"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/texto";

export type EstadoCategoria = { erro?: string; ok?: string };

const nomeSchema = z.string().trim().min(2, "Nome muito curto.").max(80);

export async function criarSubcategoria(_: EstadoCategoria, form: FormData): Promise<EstadoCategoria> {
  await exigirAdmin();
  const nome = nomeSchema.safeParse(form.get("nome"));
  const pai = z.uuid().safeParse(form.get("pai"));
  if (!nome.success) return { erro: nome.error.issues[0]?.message };
  if (!pai.success) return { erro: "Escolha a categoria principal." };
  const supabase = await createClient();
  const { count } = await supabase.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", pai.data);
  const { error } = await supabase
    .from("categories")
    .insert({ parent_id: pai.data, nome: nome.data, slug: slugify(nome.data), ordem: (count ?? 0) + 1 });
  if (error) return { erro: error.code === "23505" ? "Já existe uma subcategoria com esse nome." : error.message };
  revalidatePath("/categorias");
  return { ok: `Subcategoria "${nome.data}" criada.` };
}

export async function renomearCategoria(id: string, form: FormData) {
  await exigirAdmin();
  const nome = nomeSchema.parse(form.get("nome"));
  const supabase = await createClient();
  await supabase.from("categories").update({ nome }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function moverCategoria(id: string, direcao: "subir" | "descer") {
  await exigirAdmin();
  const supabase = await createClient();
  const { data: c } = await supabase.from("categories").select("id, parent_id, ordem").eq("id", id).single();
  if (!c) return;
  let q = supabase.from("categories").select("id, ordem").eq("status", "ativa");
  q = c.parent_id ? q.eq("parent_id", c.parent_id) : q.is("parent_id", null);
  const { data: irmas } = await q.order("ordem");
  const lista = irmas ?? [];
  const i = lista.findIndex((x) => x.id === id);
  const j = direcao === "subir" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lista.length) return;
  const [a, b] = [lista[i]!, lista[j]!];
  await supabase.from("categories").update({ ordem: b.ordem }).eq("id", a.id);
  await supabase.from("categories").update({ ordem: a.ordem }).eq("id", b.id);
  revalidatePath("/", "layout");
}

export async function unirCategorias(_: EstadoCategoria, form: FormData): Promise<EstadoCategoria> {
  await exigirAdmin();
  const origem = z.uuid().safeParse(form.get("origem"));
  const destino = z.uuid().safeParse(form.get("destino"));
  if (!origem.success || !destino.success) return { erro: "Escolha as duas categorias." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("unir_categorias", { p_origem: origem.data, p_destino: destino.data });
  if (error) return { erro: error.message };
  revalidatePath("/", "layout");
  return { ok: "Categorias unidas. Os recursos foram movidos sem perda." };
}

export async function excluirCategoria(id: string) {
  await exigirAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    // Com recursos vinculados, o banco recusa; arquivamos em vez de apagar.
    await supabase.from("categories").update({ status: "arquivada" }).eq("id", id);
  }
  revalidatePath("/", "layout");
}

export async function decidirTag(id: string, decisao: "aprovada" | "rejeitada") {
  await exigirAdmin();
  const supabase = await createClient();
  await supabase.from("tags").update({ status: decisao }).eq("id", id);
  revalidatePath("/", "layout");
}
