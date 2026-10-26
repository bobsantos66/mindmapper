"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type EstadoConvite = { erro?: string; senha?: string; email?: string };

/** Senha forte gerada no servidor; é mostrada uma única vez ao administrador. */
function gerarSenha() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(16);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}

export async function criarConvidado(_: EstadoConvite, form: FormData): Promise<EstadoConvite> {
  const admin = await exigirAdmin();
  const dados = z
    .object({ email: z.email("E-mail inválido."), nome: z.string().trim().min(1, "Informe o nome.").max(80) })
    .safeParse({ email: form.get("email"), nome: form.get("nome") });
  if (!dados.success) return { erro: dados.error.issues[0]?.message };

  const senha = gerarSenha();
  const servico = createAdminClient();
  const { data, error } = await servico.auth.admin.createUser({
    email: dados.data.email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome: dados.data.nome },
  });
  if (error || !data.user) return { erro: error?.message.includes("already") ? "Já existe um usuário com esse e-mail." : error?.message };

  await servico.from("profiles").update({ criado_por: admin.id, nome: dados.data.nome }).eq("id", data.user.id);
  revalidatePath("/admin/usuarios");
  return { senha, email: dados.data.email };
}

/** Revoga o acesso: apaga a conta e a senha. Favoritos do convidado são apagados junto. */
export async function revogarConvidado(id: string) {
  const admin = await exigirAdmin();
  if (id === admin.id) throw new Error("O administrador não pode revogar a própria conta.");
  const supabase = await createClient();
  const { data: alvo } = await supabase.from("profiles").select("papel").eq("id", id).single();
  if (!alvo || alvo.papel === "admin") throw new Error("Só convidados podem ser revogados.");
  const servico = createAdminClient();
  const { error } = await servico.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/usuarios");
}

export async function novaSenhaConvidado(_: EstadoConvite, form: FormData): Promise<EstadoConvite> {
  await exigirAdmin();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return { erro: "Convidado inválido." };
  const supabase = await createClient();
  const { data: alvo } = await supabase.from("profiles").select("papel").eq("id", id.data).single();
  if (!alvo || alvo.papel === "admin") return { erro: "Só convidados." };
  const senha = gerarSenha();
  const { data, error } = await createAdminClient().auth.admin.updateUserById(id.data, { password: senha });
  if (error) return { erro: error.message };
  return { senha, email: data.user.email };
}
