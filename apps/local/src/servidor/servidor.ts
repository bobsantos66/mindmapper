import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { join } from "node:path";
import { assinar, Auth, ErroAuth, verificar, type Claims } from "./auth";
import type { Banco } from "./banco";
import { Catalogo, ErroRest, erroDoBanco, executarRpc, executarTabela } from "./rest";

/**
 * Servidor local no lugar do Supabase: atende /rest/v1 e /auth/v1 no mesmo formato,
 * então o site e o `mm` funcionam sem mudança. Escuta só em 127.0.0.1: quem fala
 * com ele é o site (no mesmo computador), nunca o celular diretamente.
 */

export type Chaves = { segredo: string; anon: string; servico: string };

/** Lê ou cria o segredo do JWT e as duas chaves (pública e de serviço) da pasta de dados. */
export function chavesDaPasta(pasta: string): Chaves {
  const arq = join(pasta, "chaves.json");
  if (existsSync(arq)) return JSON.parse(readFileSync(arq, "utf8")) as Chaves;
  mkdirSync(pasta, { recursive: true });
  const segredo = randomBytes(32).toString("base64url");
  const iat = Math.floor(Date.now() / 1000);
  const chaves = {
    segredo,
    anon: assinar(segredo, { role: "anon", iss: "mindmapper-local", iat }),
    servico: assinar(segredo, { role: "service_role", iss: "mindmapper-local", iat }),
  };
  writeFileSync(arq, JSON.stringify(chaves, null, 2), { mode: 0o600 });
  return chaves;
}

const LIMITE_CORPO = 5 * 1024 * 1024;

async function lerCorpo(req: IncomingMessage): Promise<unknown> {
  const partes: Buffer[] = [];
  let total = 0;
  for await (const p of req) {
    total += (p as Buffer).length;
    if (total > LIMITE_CORPO) throw new ErroRest(413, "PGRST413", "Corpo grande demais");
    partes.push(p as Buffer);
  }
  if (!total) return undefined;
  try {
    return JSON.parse(Buffer.concat(partes).toString("utf8"));
  } catch {
    throw new ErroRest(400, "PGRST102", "JSON inválido no corpo");
  }
}

function responder(res: ServerResponse, status: number, corpo?: unknown, cabecalhos: Record<string, string> = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...cabecalhos });
  res.end(corpo === undefined || status === 204 ? undefined : JSON.stringify(corpo));
}

export class ServidorLocal {
  private catalogo?: Catalogo;
  private readonly auth: Auth;
  private http?: Server;

  constructor(
    readonly banco: Banco,
    readonly chaves: Chaves,
  ) {
    this.auth = new Auth(banco, chaves.segredo);
  }

  private async cat() {
    this.catalogo ??= await Catalogo.ler(this.banco.pg);
    return this.catalogo;
  }

  private claims(req: IncomingMessage): Claims {
    const bearer = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const apikey = req.headers.apikey;
    const token = bearer ?? (typeof apikey === "string" ? apikey : undefined);
    if (!token) throw new ErroRest(401, "PGRST301", "Sem chave de acesso");
    return verificar(this.chaves.segredo, token);
  }

  async atender(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? "/", "http://local");
    const metodo = req.method ?? "GET";
    if (metodo === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, prefer, accept, accept-profile, content-profile, x-client-info",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, PATCH, DELETE, PUT, OPTIONS",
      });
      return res.end();
    }

    if (url.pathname.startsWith("/auth/v1/")) {
      try {
        const caminho = url.pathname.slice("/auth/v1/".length);
        // O token de login vem sem usuário; os demais exigem a chave pública ou um token válido.
        const claims = this.claims(req);
        const r = await this.auth.atender(metodo, caminho, url.searchParams, await lerCorpo(req), claims);
        return responder(res, r.status, r.corpo);
      } catch (e) {
        if (e instanceof ErroAuth) return responder(res, e.status, e.corpo());
        if (e instanceof ErroRest) return responder(res, e.status, { code: e.status, error_code: e.code, msg: e.message });
        console.error(e);
        return responder(res, 500, { code: 500, error_code: "unexpected_failure", msg: "Erro interno" });
      }
    }

    if (url.pathname.startsWith("/rest/v1/")) {
      let autenticado = false;
      try {
        const claims = this.claims(req);
        autenticado = claims.role !== "anon";
        const resto = decodeURIComponent(url.pathname.slice("/rest/v1/".length));
        const objeto = (req.headers.accept ?? "").includes("application/vnd.pgrst.object+json");
        const corpo = await lerCorpo(req);
        const cat = await this.cat();
        const r = await this.banco.como(claims.role, claims.sub ?? null, (tx) =>
          resto.startsWith("rpc/")
            ? executarRpc(cat, tx, resto.slice(4), corpo, objeto)
            : executarTabela(cat, tx, {
                metodo,
                tabela: resto,
                q: url.searchParams,
                prefer: String(req.headers.prefer ?? ""),
                objeto,
                corpo,
              }),
        );
        const cab: Record<string, string> = {};
        if (r.total !== undefined) {
          const n = Array.isArray(r.corpo) ? r.corpo.length : r.corpo ? 1 : 0;
          const ini = r.inicio ?? 0;
          cab["Content-Range"] = `${n ? `${ini}-${ini + n - 1}` : "*"}/${r.total ?? "*"}`;
        }
        if (objeto) cab["Content-Type"] = "application/vnd.pgrst.object+json; charset=utf-8";
        return responder(res, r.status, r.corpo, cab);
      } catch (e) {
        const erro = erroDoBanco(e, autenticado);
        if (erro.status >= 500) console.error(e);
        return responder(res, erro.status, erro.corpo());
      }
    }

    if (url.pathname === "/" || url.pathname === "/saude") return responder(res, 200, { ok: true, servico: "mindmapper-local" });
    return responder(res, 404, { message: "Não encontrado" });
  }

  /** Começa a escutar. Porta 0 escolhe uma livre (testes). */
  async escutar(porta = 54321, host = "127.0.0.1"): Promise<number> {
    this.http = createServer((req, res) => {
      this.atender(req, res).catch((e) => {
        console.error(e);
        if (!res.headersSent) responder(res, 500, { message: "Erro interno" });
      });
    });
    await new Promise<void>((ok, falha) => {
      this.http!.once("error", falha);
      this.http!.listen(porta, host, () => ok());
    });
    const end = this.http.address();
    return typeof end === "object" && end ? end.port : porta;
  }

  async parar() {
    await new Promise<void>((ok) => (this.http ? this.http.close(() => ok()) : ok()));
  }
}
