import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { Banco } from "../src/servidor/banco";
import { chavesDaPasta, ServidorLocal } from "../src/servidor/servidor";

// Servidor do modo local contra o supabase-js de verdade: o que o site e o `mm` usam.
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
let pasta: string;
let banco: Banco;
let servidor: ServidorLocal;
let url: string;
let servico: SupabaseClient;
let anon: string;

beforeAll(async () => {
  pasta = mkdtempSync(join(tmpdir(), "mm-servidor-"));
  banco = await Banco.abrir(undefined, { exemplos: true });
  const chaves = chavesDaPasta(pasta);
  anon = chaves.anon;
  servidor = new ServidorLocal(banco, chaves);
  url = `http://127.0.0.1:${await servidor.escutar(0)}`;
  servico = createClient(url, chaves.servico, opts);
}, 60_000);

afterAll(async () => {
  await servidor.parar();
  await banco.fechar();
  rmSync(pasta, { recursive: true, force: true });
});

async function usuario(email: string, papel: "admin" | "convidado") {
  const { data, error } = await servico.auth.admin.createUser({ email, password: "senha-teste-123", user_metadata: { nome: email } });
  if (error) throw error;
  await servico.from("profiles").update({ papel }).eq("id", data.user.id);
  const c = createClient(url, anon, opts);
  const r = await c.auth.signInWithPassword({ email, password: "senha-teste-123" });
  if (r.error) throw r.error;
  return { c, id: data.user.id };
}

describe("servidor do modo local", () => {
  test("select com tabelas ligadas, filtros, ordem e contagem", async () => {
    const { data, error } = await servico
      .from("platform_environments")
      .select("slug, plataforma:platforms(slug)")
      .in("slug", ["chatgpt", "claude-code"])
      .order("slug", { ascending: false });
    expect(error).toBeNull();
    expect(data).toEqual([
      { slug: "claude-code", plataforma: { slug: "claude" } },
      { slug: "chatgpt", plataforma: { slug: "chatgpt" } },
    ]);

    const { count } = await servico.from("categories").select("id", { count: "exact", head: true }).is("parent_id", null);
    expect(count).toBe(12);

    const { data: f } = await servico.from("facets").select("slug, facet_values(valor_pt)").limit(1).single();
    expect(Array.isArray(f?.facet_values)).toBe(true);
  });

  test("single sem linha devolve erro PGRST116; maybeSingle devolve null", async () => {
    const um = await servico.from("resource_types").select("id").eq("slug", "nao-existe").single();
    expect(um.error?.code).toBe("PGRST116");
    const talvez = await servico.from("resource_types").select("id").eq("slug", "nao-existe").maybeSingle();
    expect(talvez).toMatchObject({ data: null, error: null });
  });

  test("insert, update com retorno, upsert e delete", async () => {
    const { data: cat, error } = await servico
      .from("categories")
      .insert({ nome: "Teste Local", slug: "teste-local", ordem: 99 })
      .select("id, nome")
      .single();
    expect(error).toBeNull();
    const { data: upd } = await servico.from("categories").update({ nome: "Teste 2" }).eq("id", cat!.id).select("nome");
    expect(upd).toEqual([{ nome: "Teste 2" }]);
    const { error: e2 } = await servico.from("categories").upsert({ id: cat!.id, nome: "Teste 3", slug: "teste-local", ordem: 99 });
    expect(e2).toBeNull();
    const { data: lido } = await servico.from("categories").select("nome").eq("id", cat!.id).single();
    expect(lido?.nome).toBe("Teste 3");
    const dup = await servico.from("categories").insert({ nome: "x", slug: "teste-local", ordem: 1 });
    expect(dup.error?.code).toBe("23505");
    await servico.from("categories").delete().eq("id", cat!.id);
    const { data: fim } = await servico.from("categories").select("id").eq("id", cat!.id);
    expect(fim).toEqual([]);
  });

  test("rpc: busca, função com jsonb e erro de argumento", async () => {
    const { data, error } = await servico.rpc("search_resources", { p_q: null, p_limite: 5 });
    expect(error).toBeNull();
    expect((data as unknown[]).length).toBeGreaterThan(0);
    const inexistente = await servico.rpc("funcao_que_nao_existe", {});
    expect(inexistente.error?.code).toBe("PGRST202");
  });

  test("login, sessão, regras de acesso e revogação", async () => {
    const admin = await usuario("admin@teste.local", "admin");
    const conv = await usuario("conv@teste.local", "convidado");

    const { data: eu } = await conv.c.auth.getUser();
    expect(eu.user?.email).toBe("conv@teste.local");

    const errada = await createClient(url, anon, opts).auth.signInWithPassword({ email: "conv@teste.local", password: "errada" });
    expect(errada.error).not.toBeNull();

    // Convidado não altera a biblioteca nem vê a auditoria; admin altera.
    const { data: tipo } = await conv.c.from("resource_types").select("id").eq("slug", "prompt").single();
    const ins = await conv.c.from("resources").insert({ titulo: "x", slug: "x-conv", type_id: tipo!.id, conteudo: "x" });
    expect(ins.error?.code).toBe("42501");
    expect((await conv.c.from("audit_log").select("id")).data).toEqual([]);
    const okAdmin = await admin.c.from("resources").insert({ titulo: "y", slug: "y-admin", type_id: tipo!.id, conteudo: "y" }).select("id");
    expect(okAdmin.error).toBeNull();

    // Renovar a sessão funciona; depois de apagar o convidado, o login dele deixa de valer.
    const { data: s } = await conv.c.auth.refreshSession();
    expect(s.session?.access_token).toBeTruthy();
    await servico.auth.admin.deleteUser(conv.id);
    const depois = await conv.c.auth.getUser();
    expect(depois.data.user).toBeNull();
    expect((await conv.c.from("resources").select("id")).data).toEqual([]);
  });

  test("token adulterado é recusado", async () => {
    const falso = createClient(url, anon.slice(0, -2) + "xx", opts);
    const r = await falso.from("resource_types").select("id");
    expect(r.status).toBe(401);
  });
});
