import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  papel: "admin" | "convidado";
}

/**
 * Lê o usuário validando o token no servidor de autenticação (getUser),
 * de modo que um convidado revogado perde o acesso na próxima requisição.
 */
export const getUsuario = cache(async (): Promise<Usuario | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nome, papel, ativo")
    .eq("id", data.user.id)
    .single();
  if (!perfil || !perfil.ativo) return null;

  return { id: data.user.id, email: data.user.email ?? "", nome: perfil.nome, papel: perfil.papel };
});

export async function exigirUsuario(): Promise<Usuario> {
  const u = await getUsuario();
  if (!u) redirect("/entrar");
  return u;
}

export async function exigirAdmin(): Promise<Usuario> {
  const u = await exigirUsuario();
  if (u.papel !== "admin") redirect("/");
  return u;
}
