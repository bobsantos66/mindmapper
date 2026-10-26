import type { Transaction } from "@electric-sql/pglite";

/**
 * Tradução do pedaço da API do PostgREST que o @supabase/supabase-js usa no MindMapper
 * (select com tabelas ligadas, filtros, ordem, limite, insert, update, upsert, delete e rpc)
 * para SQL. Tudo roda dentro de Banco.como(), então a RLS das migrações vale igual.
 */

export class ErroRest extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: string | null = null,
    readonly hint: string | null = null,
  ) {
    super(message);
  }
  corpo() {
    return { code: this.code, message: this.message, details: this.details, hint: this.hint };
  }
}

// ---------------------------------------------------------------------------
// Catálogo: colunas e chaves estrangeiras do esquema public
// ---------------------------------------------------------------------------

type ChaveEstrangeira = { nome: string; de: string; colunasDe: string[]; para: string; colunasPara: string[] };
type Funcao = { args: { nome: string; tipo: string; padrao: boolean }[]; retornaConjunto: boolean; composto: boolean; vazio: boolean };

export class Catalogo {
  constructor(
    readonly colunas: Map<string, Set<string>>,
    readonly chavesPrimarias: Map<string, string[]>,
    readonly fks: ChaveEstrangeira[],
    readonly funcoes: Map<string, Funcao>,
  ) {}

  static async ler(tx: Pick<Transaction, "query">) {
    const cols = await tx.query<{ t: string; c: string }>(
      `select c.relname t, a.attname c from pg_attribute a join pg_class c on c.oid = a.attrelid
        join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind in ('r','v') and a.attnum > 0 and not a.attisdropped`,
    );
    const colunas = new Map<string, Set<string>>();
    for (const { t, c } of cols.rows) (colunas.get(t) ?? colunas.set(t, new Set()).get(t)!).add(c);

    const pks = await tx.query<{ t: string; cols: string[] }>(
      `select c.relname t, array(select a.attname from unnest(k.conkey) with ordinality u(n, i)
              join pg_attribute a on a.attrelid = k.conrelid and a.attnum = u.n order by u.i)::text[] cols
         from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and k.contype = 'p'`,
    );
    const chavesPrimarias = new Map(pks.rows.map((r) => [r.t, r.cols]));

    const fks = await tx.query<{ nome: string; de: string; cde: string[]; para: string; cpara: string[] }>(
      `select k.conname nome, c1.relname de, c2.relname para,
              array(select a.attname from unnest(k.conkey) with ordinality u(n, i)
                    join pg_attribute a on a.attrelid = k.conrelid and a.attnum = u.n order by u.i)::text[] cde,
              array(select a.attname from unnest(k.confkey) with ordinality u(n, i)
                    join pg_attribute a on a.attrelid = k.confrelid and a.attnum = u.n order by u.i)::text[] cpara
         from pg_constraint k
         join pg_class c1 on c1.oid = k.conrelid join pg_namespace n1 on n1.oid = c1.relnamespace
         join pg_class c2 on c2.oid = k.confrelid join pg_namespace n2 on n2.oid = c2.relnamespace
        where k.contype = 'f' and n1.nspname = 'public' and n2.nspname = 'public'`,
    );

    const fns = await tx.query<{ nome: string; args: string[] | null; tipos: string[]; nargs: number; ndef: number; conjunto: boolean; composto: boolean; vazio: boolean }>(
      `select p.proname nome, p.proargnames args, p.pronargs nargs, p.pronargdefaults ndef, p.proretset conjunto,
              array(select format_type(t, null) from unnest(p.proargtypes) t)::text[] tipos,
              (p.proretset and p.prorettype = 'record'::regtype) or t.typtype = 'c' composto,
              p.prorettype = 'void'::regtype vazio
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_type t on t.oid = p.prorettype
        where n.nspname = 'public'`,
    );
    const funcoes = new Map<string, Funcao>();
    for (const f of fns.rows) {
      funcoes.set(f.nome, {
        args: f.tipos.map((tipo, i) => ({ nome: f.args?.[i] ?? `$${i + 1}`, tipo, padrao: i >= f.nargs - f.ndef })),
        retornaConjunto: f.conjunto,
        composto: f.composto,
        vazio: f.vazio,
      });
    }
    return new Catalogo(
      colunas,
      chavesPrimarias,
      fks.rows.map((r) => ({ nome: r.nome, de: r.de, colunasDe: r.cde, para: r.para, colunasPara: r.cpara })),
      funcoes,
    );
  }

  tabela(nome: string) {
    const c = this.colunas.get(nome);
    if (!c) throw new ErroRest(404, "42P01", `relation "public.${nome}" does not exist`);
    return c;
  }

  coluna(tabela: string, coluna: string) {
    if (!this.tabela(tabela).has(coluna)) {
      throw new ErroRest(400, "42703", `column ${tabela}.${coluna} does not exist`);
    }
    return id(coluna);
  }
}

/** Identificador entre aspas. Só chega aqui nome que existe no catálogo. */
const id = (s: string) => `"${s.replace(/"/g, '""')}"`;

// ---------------------------------------------------------------------------
// select=...
// ---------------------------------------------------------------------------

type ItemSelect =
  | { tipo: "tudo" }
  | { tipo: "coluna"; nome: string; apelido?: string }
  | { tipo: "ligada"; nome: string; apelido?: string; dica?: string; itens: ItemSelect[] };

export function lerSelect(texto: string): ItemSelect[] {
  let i = 0;
  const s = texto.replace(/\s+/g, "");
  function lista(): ItemSelect[] {
    const itens: ItemSelect[] = [];
    while (i < s.length && s[i] !== ")") {
      let nome = "";
      while (i < s.length && !",()".includes(s[i]!)) nome += s[i++];
      let apelido: string | undefined;
      const dp = nome.indexOf(":");
      if (dp >= 0 && !nome.includes("::")) {
        apelido = nome.slice(0, dp);
        nome = nome.slice(dp + 1);
      }
      if (s[i] === "(") {
        i++;
        const filhos = lista();
        if (s[i] !== ")") throw new ErroRest(400, "PGRST100", `select inválido: ${texto}`);
        i++;
        const [rel, dica] = nome.split("!");
        itens.push({ tipo: "ligada", nome: rel!, apelido, dica, itens: filhos });
      } else if (nome === "*") itens.push({ tipo: "tudo" });
      else if (nome) {
        if (nome.includes("::") || nome.includes("->")) {
          throw new ErroRest(400, "PGRST100", `select com conversão ou JSON não é suportado no modo local: ${nome}`);
        }
        itens.push({ tipo: "coluna", nome, apelido });
      }
      if (s[i] === ",") i++;
    }
    return itens;
  }
  const r = lista();
  if (i < s.length) throw new ErroRest(400, "PGRST100", `select inválido: ${texto}`);
  return r.length ? r : [{ tipo: "tudo" }];
}

class Sql {
  params: unknown[] = [];
  private n = 0;
  p(v: unknown) {
    this.params.push(v);
    return `$${this.params.length}`;
  }
  alias() {
    return `t${++this.n}`;
  }
}

/** Expressão jsonb de uma linha da tabela `tabela` (apelido `a`) conforme o select. */
function linhaJson(cat: Catalogo, sql: Sql, tabela: string, a: string, itens: ItemSelect[]): string {
  const partes: string[] = [];
  for (const it of itens) {
    if (it.tipo === "tudo") partes.push(`to_jsonb(${a}.*)`);
    else if (it.tipo === "coluna") {
      partes.push(`jsonb_build_object(${sql.p(it.apelido ?? it.nome)}::text, ${a}.${cat.coluna(tabela, it.nome)})`);
    } else {
      partes.push(`jsonb_build_object(${sql.p(it.apelido ?? it.nome)}::text, ${ligada(cat, sql, tabela, a, it)})`);
    }
  }
  return partes.length ? partes.join(" || ") : `'{}'::jsonb`;
}

function ligada(cat: Catalogo, sql: Sql, pai: string, a: string, it: Extract<ItemSelect, { tipo: "ligada" }>): string {
  cat.tabela(it.nome);
  const candidatas = cat.fks.filter(
    (f) =>
      ((f.de === pai && f.para === it.nome) || (f.de === it.nome && f.para === pai)) &&
      (!it.dica || f.nome === it.dica || f.colunasDe.join(",") === it.dica),
  );
  if (candidatas.length === 0) {
    throw new ErroRest(400, "PGRST200", `Could not find a relationship between '${pai}' and '${it.nome}'`);
  }
  if (candidatas.length > 1) {
    throw new ErroRest(300, "PGRST201", `More than one relationship was found for '${pai}' and '${it.nome}'`);
  }
  const fk = candidatas[0]!;
  const b = sql.alias();
  const dentro = linhaJson(cat, sql, it.nome, b, it.itens);
  if (fk.de === pai && fk.para === it.nome && !(fk.de === fk.para)) {
    // muitos-para-um: objeto (ou null)
    const cond = fk.colunasDe.map((c, i) => `${b}.${id(fk.colunasPara[i]!)} = ${a}.${id(c)}`).join(" and ");
    return `(select ${dentro} from public.${id(it.nome)} ${b} where ${cond})`;
  }
  // um-para-muitos: lista
  const cond = fk.colunasDe.map((c, i) => `${b}.${id(c)} = ${a}.${id(fk.colunasPara[i]!)}`).join(" and ");
  return `coalesce((select jsonb_agg(${dentro}) from public.${id(it.nome)} ${b} where ${cond}), '[]'::jsonb)`;
}

// ---------------------------------------------------------------------------
// Filtros, ordem e limite
// ---------------------------------------------------------------------------

const RESERVADOS = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);
const OPERADORES: Record<string, string> = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "like", ilike: "ilike" };

function listaIn(v: string): string[] {
  const m = v.match(/^\((.*)\)$/s);
  if (!m) throw new ErroRest(400, "PGRST100", `in inválido: ${v}`);
  const itens: string[] = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < m[1]!.length; i++) {
    const ch = m[1]![i]!;
    if (aspas) {
      if (ch === "\\") atual += m[1]![++i] ?? "";
      else if (ch === '"') aspas = false;
      else atual += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === ",") {
      itens.push(atual);
      atual = "";
    } else atual += ch;
  }
  if (m[1]!.length) itens.push(atual);
  return itens;
}

function condicao(cat: Catalogo, sql: Sql, tabela: string, a: string, coluna: string, expr: string): string {
  if (coluna.includes(".")) throw new ErroRest(400, "PGRST100", `filtro em tabela ligada não é suportado no modo local: ${coluna}`);
  const col = `${a}.${cat.coluna(tabela, coluna)}`;
  let negar = false;
  let e = expr;
  if (e.startsWith("not.")) {
    negar = true;
    e = e.slice(4);
  }
  const ponto = e.indexOf(".");
  if (ponto < 0) throw new ErroRest(400, "PGRST100", `filtro inválido: ${coluna}=${expr}`);
  const op = e.slice(0, ponto);
  const v = e.slice(ponto + 1);
  let c: string;
  if (op === "is") {
    const lv = v.toLowerCase();
    if (!["null", "true", "false", "unknown"].includes(lv)) throw new ErroRest(400, "PGRST100", `is inválido: ${v}`);
    c = `${col} is ${lv}`;
  } else if (op === "in") {
    const itens = listaIn(v);
    c = itens.length ? `${col} in (${itens.map((x) => sql.p(x)).join(", ")})` : "false";
  } else if (OPERADORES[op]) {
    const valor = op === "like" || op === "ilike" ? v.replace(/\*/g, "%") : v;
    c = `${col} ${OPERADORES[op]} ${sql.p(valor)}`;
  } else {
    throw new ErroRest(400, "PGRST100", `operador não suportado no modo local: ${op}`);
  }
  return negar ? `not (${c})` : c;
}

function onde(cat: Catalogo, sql: Sql, tabela: string, a: string, q: URLSearchParams): string {
  const conds: string[] = [];
  for (const [k, v] of q) {
    if (RESERVADOS.has(k)) continue;
    if (k === "or" || k === "and") throw new ErroRest(400, "PGRST100", `${k}=(...) não é suportado no modo local`);
    conds.push(condicao(cat, sql, tabela, a, k, v));
  }
  return conds.length ? `where ${conds.join(" and ")}` : "";
}

function ordem(cat: Catalogo, tabela: string, a: string, q: URLSearchParams): string {
  const o = q.get("order");
  if (!o) return "";
  const partes = o.split(",").map((p) => {
    const [col, ...mods] = p.split(".");
    let s = `${a}.${cat.coluna(tabela, col!)}`;
    for (const m of mods) {
      if (m === "asc" || m === "desc") s += ` ${m}`;
      else if (m === "nullsfirst") s += " nulls first";
      else if (m === "nullslast") s += " nulls last";
      else throw new ErroRest(400, "PGRST100", `ordem inválida: ${p}`);
    }
    return s;
  });
  return `order by ${partes.join(", ")}`;
}

function inteiro(v: string | null) {
  if (v == null) return null;
  if (!/^\d+$/.test(v)) throw new ErroRest(400, "PGRST100", `número inválido: ${v}`);
  return Number(v);
}

// ---------------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------------

export type Pedido = {
  metodo: string;
  tabela: string;
  q: URLSearchParams;
  prefer: string;
  objeto: boolean; // Accept: application/vnd.pgrst.object+json (single)
  corpo: unknown;
};

export type Resposta = { status: number; corpo?: unknown; total?: number | null; inicio?: number };

type Tx = Pick<Transaction, "query">;

async function linhas(tx: Tx, sql: Sql, texto: string): Promise<unknown[]> {
  const r = await tx.query<{ j: unknown }>(texto, sql.params);
  return r.rows.map((x) => x.j);
}

function finalizar(p: Pedido, dados: unknown[], total: number | null = null, inicio = 0): Resposta {
  if (p.objeto) {
    if (dados.length !== 1) {
      throw new ErroRest(406, "PGRST116", "JSON object requested, multiple (or no) rows returned", `The result contains ${dados.length} rows`);
    }
    return { status: 200, corpo: dados[0], total, inicio };
  }
  return { status: 200, corpo: dados, total, inicio };
}

export async function executarTabela(cat: Catalogo, tx: Tx, p: Pedido): Promise<Resposta> {
  cat.tabela(p.tabela);
  const sql = new Sql();
  const t = id(p.tabela);
  const representacao = p.prefer.includes("return=representation");
  const itens = lerSelect(p.q.get("select") ?? "*");

  if (p.metodo === "GET" || p.metodo === "HEAD") {
    const w = onde(cat, sql, p.tabela, "t0", p.q);
    const limite = inteiro(p.q.get("limit"));
    const desloc = inteiro(p.q.get("offset")) ?? 0;
    let total: number | null = null;
    if (p.prefer.includes("count=")) {
      const c = new Sql();
      const wc = onde(cat, c, p.tabela, "t0", p.q);
      total = Number((await tx.query<{ n: number }>(`select count(*)::int n from public.${t} t0 ${wc}`, c.params)).rows[0]!.n);
    }
    if (p.metodo === "HEAD") return { status: 200, total, inicio: desloc };
    const dados = await linhas(
      tx,
      sql,
      `select ${linhaJson(cat, sql, p.tabela, "t0", itens)} j from public.${t} t0 ${w} ${ordem(cat, p.tabela, "t0", p.q)}
       ${limite != null ? `limit ${limite}` : ""} ${desloc ? `offset ${desloc}` : ""}`,
    );
    return finalizar(p, dados, total, desloc);
  }

  // Seleção do que volta depois de gravar: lê as linhas gravadas pela CTE "gravadas".
  const devolver = (cte: string) =>
    representacao
      ? `with gravadas as (${cte}) select ${linhaJson(cat, sql, p.tabela, "t0", itens)} j from gravadas t0`
      : `with gravadas as (${cte}) select null::jsonb j from gravadas`;

  if (p.metodo === "POST") {
    const corpo = Array.isArray(p.corpo) ? p.corpo : [p.corpo];
    if (!corpo.every((x) => x && typeof x === "object" && !Array.isArray(x))) {
      throw new ErroRest(400, "PGRST102", "Corpo inválido: envie um objeto ou uma lista de objetos");
    }
    const linhasCorpo = corpo as Record<string, unknown>[];
    if (linhasCorpo.length === 0) return finalizar(p, []);
    const nomes = p.q.get("columns")
      ? p.q.get("columns")!.split(",").map((c) => c.replace(/^"|"$/g, ""))
      : [...new Set(linhasCorpo.flatMap((l) => Object.keys(l)))];
    const cols = nomes.map((c) => cat.coluna(p.tabela, c));
    const fonte = `jsonb_populate_recordset(null::public.${t}, ${sql.p(JSON.stringify(linhasCorpo))}::jsonb)`;
    let conflito = "";
    const res = p.prefer.match(/resolution=(merge|ignore)-duplicates/);
    if (res) {
      const alvo = p.q.get("on_conflict")?.split(",") ?? cat.chavesPrimarias.get(p.tabela) ?? [];
      const alvoSql = alvo.map((c) => cat.coluna(p.tabela, c));
      const atualizar = nomes.filter((c) => !alvo.includes(c));
      conflito =
        res[1] === "merge" && atualizar.length
          ? `on conflict (${alvoSql.join(", ")}) do update set ${atualizar.map((c) => `${id(c)} = excluded.${id(c)}`).join(", ")}`
          : `on conflict (${alvoSql.join(", ")}) do nothing`;
    }
    const cte = `insert into public.${t} (${cols.join(", ")}) select ${cols.join(", ")} from ${fonte} ${conflito} returning *`;
    const dados = await linhas(tx, sql, devolver(cte));
    return representacao ? { ...finalizar(p, dados), status: 201 } : { status: 201 };
  }

  if (p.metodo === "PATCH") {
    if (!p.corpo || typeof p.corpo !== "object" || Array.isArray(p.corpo)) {
      throw new ErroRest(400, "PGRST102", "Corpo inválido: envie um objeto");
    }
    const nomes = Object.keys(p.corpo);
    if (nomes.length === 0) return finalizar(p, []);
    const sets = nomes.map((c) => `${cat.coluna(p.tabela, c)} = n.${id(c)}`).join(", ");
    const novo = `jsonb_populate_record(null::public.${t}, ${sql.p(JSON.stringify(p.corpo))}::jsonb)`;
    const w = onde(cat, sql, p.tabela, "t0", p.q);
    const cte = `update public.${t} t0 set ${sets} from ${novo} n ${w} returning t0.*`;
    const dados = await linhas(tx, sql, devolver(cte));
    return representacao ? finalizar(p, dados) : { status: 204 };
  }

  if (p.metodo === "DELETE") {
    const w = onde(cat, sql, p.tabela, "t0", p.q);
    const dados = await linhas(tx, sql, devolver(`delete from public.${t} t0 ${w} returning t0.*`));
    return representacao ? finalizar(p, dados) : { status: 204 };
  }

  throw new ErroRest(405, "PGRST117", `Método ${p.metodo} não suportado`);
}

/** POST /rest/v1/rpc/<funcao> com argumentos nomeados no corpo. */
export async function executarRpc(cat: Catalogo, tx: Tx, nome: string, corpo: unknown, objeto: boolean): Promise<Resposta> {
  const f = cat.funcoes.get(nome);
  if (!f) throw new ErroRest(404, "PGRST202", `Could not find the function public.${nome}`);
  const args = (corpo && typeof corpo === "object" ? corpo : {}) as Record<string, unknown>;
  const sql = new Sql();
  const partes: string[] = [];
  for (const [k, v] of Object.entries(args)) {
    const arg = f.args.find((a) => a.nome === k);
    if (!arg) throw new ErroRest(404, "PGRST202", `Could not find the function public.${nome}(${k})`);
    // Todo valor vai como jsonb e é convertido no SQL para o tipo do argumento.
    const p = v === null || v === undefined ? "" : `${sql.p(JSON.stringify(v))}::jsonb`;
    const valor =
      v === null || v === undefined
        ? `null::${arg.tipo}`
        : arg.tipo === "jsonb" || arg.tipo === "json"
          ? `${p}::${arg.tipo}`
          : arg.tipo.endsWith("[]")
            ? `array(select jsonb_array_elements_text(${p}))::${arg.tipo}`
            : `(${p} #>> '{}')::${arg.tipo}`;
    partes.push(`${id(k)} => ${valor}`);
  }
  for (const a of f.args) {
    if (!a.padrao && !(a.nome in args)) throw new ErroRest(404, "PGRST202", `Missing argument ${a.nome} for public.${nome}`);
  }
  const chamada = `public.${id(nome)}(${partes.join(", ")})`;
  if (f.vazio) {
    await tx.query(`select ${chamada}`, sql.params);
    return { status: 204 };
  }
  if (f.retornaConjunto || f.composto) {
    const dados = await linhas(tx, sql, `select to_jsonb(x) j from ${chamada} x`);
    if (!f.retornaConjunto) return { status: 200, corpo: dados[0] ?? null };
    return objeto ? finalizar({ objeto } as Pedido, dados) : { status: 200, corpo: dados };
  }
  const dados = await linhas(tx, sql, `select to_jsonb(${chamada}) j`);
  return { status: 200, corpo: dados[0] ?? null };
}

/** Converte erro do PostgreSQL no formato de erro do PostgREST. */
export function erroDoBanco(e: unknown, autenticado: boolean): ErroRest {
  if (e instanceof ErroRest) return e;
  const err = e as { code?: string; message?: string; detail?: string; hint?: string };
  const code = err.code ?? "XX000";
  const status =
    code === "42501" ? (autenticado ? 403 : 401)
    : code === "23505" || code === "23503" ? 409
    : code === "P0002" ? 404
    : code.startsWith("08") || code === "XX000" ? 500
    : 400;
  return new ErroRest(status, code, err.message ?? String(e), err.detail ?? null, err.hint ?? null);
}
