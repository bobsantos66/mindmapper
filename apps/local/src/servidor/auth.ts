import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Banco, Papel } from "./banco";
import { ErroRest } from "./rest";

const scrypt = promisify(scryptCb) as (senha: string, sal: Buffer, tam: number) => Promise<Buffer>;

/**
 * Login do modo local, no formato do Supabase Auth (GoTrue) que o supabase-js espera:
 * token por senha, renovação, usuário atual, saída e a parte admin (criar, listar, apagar).
 * Tokens são JWT HS256 assinados com o segredo guardado na pasta de dados.
 */

const DURACAO_S = 3600;

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function assinar(segredo: string, claims: Record<string, unknown>) {
  const cab = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const corpo = b64(JSON.stringify(claims));
  const ass = createHmac("sha256", segredo).update(`${cab}.${corpo}`).digest("base64url");
  return `${cab}.${corpo}.${ass}`;
}

export type Claims = { sub?: string; role: Papel; exp?: number; email?: string };

export function verificar(segredo: string, token: string): Claims {
  const partes = token.split(".");
  if (partes.length !== 3) throw new ErroRest(401, "PGRST301", "JWT inválido");
  const esperada = createHmac("sha256", segredo).update(`${partes[0]}.${partes[1]}`).digest();
  const recebida = Buffer.from(partes[2]!, "base64url");
  if (recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) {
    throw new ErroRest(401, "PGRST301", "JWT inválido");
  }
  const cab = JSON.parse(Buffer.from(partes[0]!, "base64url").toString());
  if (cab.alg !== "HS256") throw new ErroRest(401, "PGRST301", "JWT inválido");
  const c = JSON.parse(Buffer.from(partes[1]!, "base64url").toString()) as Claims;
  if (!["anon", "authenticated", "service_role"].includes(c.role)) throw new ErroRest(401, "PGRST301", "JWT inválido");
  if (c.exp && c.exp < Date.now() / 1000) throw new ErroRest(401, "PGRST303", "JWT expired");
  return c;
}

export async function hashSenha(senha: string) {
  const sal = randomBytes(16);
  const h = await scrypt(senha, sal, 64);
  return `scrypt$${sal.toString("base64")}$${h.toString("base64")}`;
}

async function conferirSenha(senha: string, guardado: string) {
  const [alg, sal, h] = guardado.split("$");
  if (alg !== "scrypt" || !sal || !h) return false;
  const calc = await scrypt(senha, Buffer.from(sal, "base64"), 64);
  const esperado = Buffer.from(h, "base64");
  return calc.length === esperado.length && timingSafeEqual(calc, esperado);
}

type LinhaUsuario = {
  id: string;
  email: string;
  raw_user_meta_data: Record<string, unknown>;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

function usuarioJson(u: LinhaUsuario) {
  return {
    id: u.id,
    aud: "authenticated",
    role: "authenticated",
    email: u.email,
    email_confirmed_at: u.email_confirmed_at,
    phone: "",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: u.raw_user_meta_data ?? {},
    identities: [],
    created_at: u.created_at,
    updated_at: u.updated_at,
    is_anonymous: false,
  };
}

const COLS = "id, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at";

export class Auth {
  constructor(
    private readonly banco: Banco,
    private readonly segredo: string,
  ) {}

  private async sessao(u: LinhaUsuario) {
    const agora = Math.floor(Date.now() / 1000);
    const access_token = assinar(this.segredo, {
      sub: u.id,
      role: "authenticated",
      aud: "authenticated",
      email: u.email,
      iat: agora,
      exp: agora + DURACAO_S,
      session_id: randomBytes(8).toString("hex"),
    });
    const refresh_token = randomBytes(24).toString("base64url");
    await this.banco.pg.query("insert into auth.refresh_tokens (token, user_id) values ($1, $2)", [refresh_token, u.id]);
    return {
      access_token,
      token_type: "bearer",
      expires_in: DURACAO_S,
      expires_at: agora + DURACAO_S,
      refresh_token,
      user: usuarioJson(u),
    };
  }

  private async porEmail(email: string) {
    const r = await this.banco.pg.query<LinhaUsuario & { encrypted_password: string }>(
      `select ${COLS}, encrypted_password from auth.users where lower(email) = lower($1)`,
      [email],
    );
    return r.rows[0];
  }

  private async porId(id: string) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
    const r = await this.banco.pg.query<LinhaUsuario>(`select ${COLS} from auth.users where id = $1`, [id]);
    return r.rows[0];
  }

  /** Atende /auth/v1/*. `claims` é o token do cabeçalho Authorization (anon, usuário ou serviço). */
  async atender(metodo: string, caminho: string, q: URLSearchParams, corpo: unknown, claims: Claims) {
    const c = (corpo ?? {}) as Record<string, unknown>;
    if (metodo === "POST" && caminho === "token") {
      const tipo = q.get("grant_type");
      if (tipo === "password") {
        const u = await this.porEmail(String(c.email ?? ""));
        if (!u || !(await conferirSenha(String(c.password ?? ""), u.encrypted_password))) {
          throw new ErroAuth(400, "invalid_credentials", "Invalid login credentials");
        }
        return { status: 200, corpo: await this.sessao(u) };
      }
      if (tipo === "refresh_token") {
        const r = await this.banco.pg.query<{ user_id: string }>(
          "update auth.refresh_tokens set revoked = true where token = $1 and not revoked returning user_id",
          [String(c.refresh_token ?? "")],
        );
        const u = r.rows[0] && (await this.porId(r.rows[0].user_id));
        if (!u) throw new ErroAuth(400, "refresh_token_not_found", "Invalid Refresh Token: Refresh Token Not Found");
        return { status: 200, corpo: await this.sessao(u) };
      }
      throw new ErroAuth(400, "unsupported_grant_type", "Tipo de login não suportado no modo local");
    }

    if (metodo === "GET" && caminho === "user") {
      const u = claims.role === "authenticated" && claims.sub ? await this.porId(claims.sub) : undefined;
      if (!u) throw new ErroAuth(401, "user_not_found", "User from sub claim in JWT does not exist");
      return { status: 200, corpo: usuarioJson(u) };
    }

    if (metodo === "POST" && caminho === "logout") {
      if (claims.sub) {
        await this.banco.pg.query("update auth.refresh_tokens set revoked = true where user_id = $1", [claims.sub]);
      }
      return { status: 204 };
    }

    if (caminho === ".well-known/jwks.json") return { status: 200, corpo: { keys: [] } };
    if (caminho === "settings") {
      return { status: 200, corpo: { external: { email: true }, disable_signup: true, mailer_autoconfirm: true } };
    }

    if (caminho.startsWith("admin/users")) {
      if (claims.role !== "service_role") throw new ErroAuth(403, "not_admin", "User not allowed");
      const idUsuario = caminho.split("/")[2];
      if (metodo === "POST" && !idUsuario) {
        const email = String(c.email ?? "").trim();
        const senha = String(c.password ?? "");
        if (!email.includes("@")) throw new ErroAuth(400, "validation_failed", "Unable to validate email address: invalid format");
        if (senha.length < 6) throw new ErroAuth(422, "weak_password", "Password should be at least 6 characters.");
        if (await this.porEmail(email)) {
          throw new ErroAuth(422, "email_exists", "A user with this email address has already been registered");
        }
        const r = await this.banco.pg.query<LinhaUsuario>(
          `insert into auth.users (email, encrypted_password, raw_user_meta_data) values ($1, $2, $3::jsonb) returning ${COLS}`,
          [email, await hashSenha(senha), JSON.stringify(c.user_metadata ?? {})],
        );
        return { status: 200, corpo: usuarioJson(r.rows[0]!) };
      }
      if (metodo === "GET" && !idUsuario) {
        const r = await this.banco.pg.query<LinhaUsuario>(`select ${COLS} from auth.users order by created_at`);
        return { status: 200, corpo: { users: r.rows.map(usuarioJson), aud: "authenticated" } };
      }
      if (idUsuario && metodo === "GET") {
        const u = await this.porId(idUsuario);
        if (!u) throw new ErroAuth(404, "user_not_found", "User not found");
        return { status: 200, corpo: usuarioJson(u) };
      }
      if (idUsuario && metodo === "DELETE") {
        const u = await this.porId(idUsuario);
        if (!u) throw new ErroAuth(404, "user_not_found", "User not found");
        await this.banco.pg.query("delete from auth.users where id = $1", [idUsuario]);
        return { status: 200, corpo: {} };
      }
      if (idUsuario && metodo === "PUT") {
        const u = await this.porId(idUsuario);
        if (!u) throw new ErroAuth(404, "user_not_found", "User not found");
        if (typeof c.password === "string") {
          if (c.password.length < 6) throw new ErroAuth(422, "weak_password", "Password should be at least 6 characters.");
          await this.banco.pg.query("update auth.users set encrypted_password = $2, updated_at = now() where id = $1", [
            idUsuario,
            await hashSenha(c.password),
          ]);
          await this.banco.pg.query("update auth.refresh_tokens set revoked = true where user_id = $1", [idUsuario]);
        }
        if (c.user_metadata && typeof c.user_metadata === "object") {
          await this.banco.pg.query(
            "update auth.users set raw_user_meta_data = raw_user_meta_data || $2::jsonb, updated_at = now() where id = $1",
            [idUsuario, JSON.stringify(c.user_metadata)],
          );
        }
        return { status: 200, corpo: usuarioJson((await this.porId(idUsuario))!) };
      }
    }

    throw new ErroAuth(404, "not_found", `Rota de login não suportada no modo local: ${metodo} ${caminho}`);
  }
}

export class ErroAuth extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
  corpo() {
    return { code: this.status, error_code: this.code, msg: this.message };
  }
}
