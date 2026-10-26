import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";

/**
 * Banco do modo local: o mesmo PostgreSQL do Supabase, rodando dentro do Node (PGlite),
 * sem Docker. As migrações de supabase/migrations rodam sem mudança; este preâmbulo cria
 * só o pedaço do Supabase de que elas dependem (esquema auth, papéis e auth.uid()).
 */
const PREAMBULO = `
create schema if not exists extensions;
create schema if not exists auth;
create schema if not exists mm_local;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  encrypted_password text not null,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  email_confirmed_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists auth.refresh_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table if not exists mm_local.migracoes (nome text primary key, aplicada_em timestamptz not null default now());
grant usage on schema public, extensions to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

/** Arquivos de dados de referência (não inclui exemplos de teste). */
const SEEDS = ["seed.sql", "seed.categorias.sql"];

/** Pasta supabase/ do repositório. MM_SUPABASE_DIR permite apontar outra. */
export function pastaSupabase() {
  if (process.env.MM_SUPABASE_DIR) return resolve(process.env.MM_SUPABASE_DIR);
  // Sobe a partir deste arquivo (src/servidor ou dist) até achar supabase/migrations.
  let d = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(d, "supabase", "migrations"))) return join(d, "supabase");
    d = dirname(d);
  }
  throw new Error("Pasta supabase/ não encontrada. Rode o MindMapper de dentro do repositório.");
}

export type Papel = "anon" | "authenticated" | "service_role";

export class Banco {
  private constructor(readonly pg: PGlite) {}

  /** Abre (ou cria) o banco na pasta indicada. Sem pasta, fica só na memória (testes). */
  static async abrir(pasta?: string, opcoes: { exemplos?: boolean; carregar?: Blob } = {}) {
    const pg = await PGlite.create({
      dataDir: pasta,
      extensions: { pg_trgm, unaccent },
      loadDataDir: opcoes.carregar,
    });
    const banco = new Banco(pg);
    await banco.atualizar(opcoes.exemplos ?? false);
    return banco;
  }

  /** Aplica o preâmbulo e as migrações ainda não aplicadas. Nunca apaga dados. */
  private async atualizar(exemplos: boolean) {
    const novo = !(await this.pg.query(`select 1 from pg_namespace where nspname = 'mm_local'`)).rows.length;
    await this.pg.exec(PREAMBULO);
    const dir = pastaSupabase();
    const aplicadas = new Set(
      (await this.pg.query<{ nome: string }>("select nome from mm_local.migracoes")).rows.map((r) => r.nome),
    );
    const migracoes = readdirSync(join(dir, "migrations")).filter((f) => f.endsWith(".sql")).sort();
    for (const nome of migracoes) {
      if (aplicadas.has(nome)) continue;
      const sql = readFileSync(join(dir, "migrations", nome), "utf8");
      await this.pg.transaction(async (tx) => {
        await tx.exec(sql);
        await tx.query("insert into mm_local.migracoes (nome) values ($1)", [nome]);
      });
    }
    if (novo) {
      for (const s of [...SEEDS, ...(exemplos ? ["seed.sample.sql"] : [])]) {
        await this.pg.exec(readFileSync(join(dir, s), "utf8"));
      }
    }
  }

  /**
   * Roda fn numa transação com as permissões de quem chamou, como o Supabase faz:
   * papel do banco (RLS vale para anon e authenticated) e auth.uid() = sub do token.
   */
  async como<T>(papel: Papel, sub: string | null, fn: (tx: Transaction) => Promise<T>): Promise<T> {
    return this.pg.transaction(async (tx) => {
      await tx.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.role', $2, true)", [
        sub ?? "",
        papel,
      ]);
      await tx.exec(`set local role ${papel}`);
      return fn(tx);
    });
  }

  /** Cópia completa da pasta de dados, compactada. Usada no backup. */
  async copia(): Promise<Blob> {
    return this.pg.dumpDataDir("gzip");
  }

  async fechar() {
    await this.pg.close();
  }
}
