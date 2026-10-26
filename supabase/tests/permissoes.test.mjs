// Testes de permissão (RLS) contra o Supabase local.
// Rodar: pnpm test:rls  (com `supabase start` ativo e apps/web/.env.local preenchido)
// Cria um convidado e um rascunho temporários e apaga os dois no fim.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../../apps/web/.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL;
if (!URL_SB.includes("127.0.0.1") && !URL_SB.includes("localhost")) {
  throw new Error("Estes testes só rodam no Supabase local.");
}
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const servico = createClient(URL_SB, env.SUPABASE_SERVICE_ROLE_KEY, opts);

const email = `rls-${Date.now()}@teste.local`;
const senha = "senha-teste-rls-123";
let convidado;
let usuarioId;
let rascunhoId;
let aprovadoId;

before(async () => {
  const { data: u, error } = await servico.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome: "Teste RLS" },
  });
  if (error) throw error;
  usuarioId = u.user.id;

  const { data: tipo } = await servico.from("resource_types").select("id").eq("slug", "prompt").single();
  const { data: r, error: e2 } = await servico
    .from("resources")
    .insert({ titulo: "Rascunho secreto RLS", slug: `rls-${Date.now()}`, type_id: tipo.id, aprovacao: "rascunho", conteudo: "x" })
    .select("id")
    .single();
  if (e2) throw e2;
  rascunhoId = r.id;
  const { data: amb } = await servico.from("platform_environments").select("id").eq("slug", "claude-code").single();
  const { error: e4 } = await servico
    .from("resource_commands")
    .insert({ resource_id: rascunhoId, environment_id: amb.id, acionamento: "comando_barra", comando: "/segredo" });
  if (e4) throw e4;
  await servico
    .from("install_packages")
    .insert({ resource_id: rascunhoId, tipo: "comando", manifesto: { tipo: "comando", nome: "segredo", conteudo: "x" } })
    .throwOnError();

  const { data: ap } = await servico.from("resources").select("id").eq("aprovacao", "aprovado").is("deleted_at", null).limit(1).single();
  aprovadoId = ap.id;

  convidado = createClient(URL_SB, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts);
  const { error: e3 } = await convidado.auth.signInWithPassword({ email, password: senha });
  if (e3) throw e3;
});

after(async () => {
  if (rascunhoId) await servico.from("resources").delete().eq("id", rascunhoId);
  if (usuarioId) await servico.auth.admin.deleteUser(usuarioId);
});

test("o perfil novo nasce como convidado", async () => {
  const { data } = await convidado.from("profiles").select("papel, ativo").eq("id", usuarioId).single();
  assert.equal(data.papel, "convidado");
  assert.equal(data.ativo, true);
});

test("convidado vê recursos aprovados", async () => {
  const { data } = await convidado.from("resources").select("id").eq("id", aprovadoId);
  assert.equal(data.length, 1);
});

test("convidado não vê rascunho nem o que pertence a ele", async () => {
  const { data: r } = await convidado.from("resources").select("id").eq("id", rascunhoId);
  assert.equal(r.length, 0);
  for (const t of ["install_packages", "resource_commands", "resource_descriptions", "resource_categories"]) {
    const { data } = await convidado.from(t).select("resource_id").eq("resource_id", rascunhoId);
    assert.equal(data.length, 0, `vazou em ${t}`);
  }
});

test("convidado não altera a biblioteca", async () => {
  const { data: tipo } = await convidado.from("resource_types").select("id").eq("slug", "prompt").single();
  const { error } = await convidado.from("resources").insert({ titulo: "invasor", slug: "invasor", type_id: tipo.id });
  assert.ok(error, "insert deveria falhar");
  const { data } = await convidado.from("resources").update({ titulo: "alterado" }).eq("id", aprovadoId).select();
  assert.equal(data.length, 0, "update não deveria afetar linhas");
});

test("convidado não se promove a administrador", async () => {
  const { data } = await convidado.from("profiles").update({ papel: "admin" }).eq("id", usuarioId).select();
  assert.equal(data.length, 0);
  const { data: p } = await servico.from("profiles").select("papel").eq("id", usuarioId).single();
  assert.equal(p.papel, "convidado");
});

test("convidado não lê auditoria nem versões", async () => {
  for (const t of ["audit_log", "resource_versions"]) {
    const { data } = await convidado.from(t).select("id").limit(1);
    assert.equal(data.length, 0, `leu ${t}`);
  }
});

test("convidado desativado perde a leitura na hora", async () => {
  await servico.from("profiles").update({ ativo: false }).eq("id", usuarioId);
  const { data } = await convidado.from("resources").select("id").eq("id", aprovadoId);
  assert.equal(data.length, 0);
  await servico.from("profiles").update({ ativo: true }).eq("id", usuarioId);
});
