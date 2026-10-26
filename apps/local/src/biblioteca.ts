import { readFile } from "node:fs/promises";
import { hostname, platform } from "node:os";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { validarManifesto, type Database, type Manifesto } from "@mindmapper/core";
import { arquivoConfig, pastaMindMapper } from "./caminhos";
import { gravarJsonPrivado, type Escopo } from "./registro";

/** Conexão com a biblioteca MindMapper, com o login do próprio usuário (admin ou convidado). */

export interface Config {
  url: string;
  /** Chave pública (anon) do Supabase. Não é segredo: o acesso é decidido pelo login e pelas regras do banco. */
  chave: string;
}

const arquivoSessao = () => join(pastaMindMapper(), "sessao.json");

export async function lerConfig(): Promise<Config | null> {
  if (process.env.MM_URL && process.env.MM_CHAVE) return { url: process.env.MM_URL, chave: process.env.MM_CHAVE };
  try {
    return JSON.parse(await readFile(arquivoConfig(), "utf8")) as Config;
  } catch {
    return null;
  }
}

export async function salvarConfig(c: Config) {
  const url = new URL(c.url);
  const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  if (url.protocol !== "https:" && !local) throw new Error("Use um endereço https.");
  await gravarJsonPrivado(arquivoConfig(), { url: url.origin, chave: c.chave });
}

/** Guarda a sessão num arquivo legível só pelo usuário (0600). */
function armazenamento() {
  const ler = async (): Promise<Record<string, string>> => {
    try {
      return JSON.parse(await readFile(arquivoSessao(), "utf8"));
    } catch {
      return {};
    }
  };
  return {
    getItem: async (k: string) => (await ler())[k] ?? null,
    setItem: async (k: string, v: string) => gravarJsonPrivado(arquivoSessao(), { ...(await ler()), [k]: v }),
    removeItem: async (k: string) => {
      const d = await ler();
      delete d[k];
      await gravarJsonPrivado(arquivoSessao(), d);
    },
  };
}

export type Cliente = SupabaseClient<Database>;

export async function conectar(): Promise<Cliente> {
  const c = await lerConfig();
  if (!c) throw new Error("O MindMapper Local ainda não foi configurado. Rode: mm configurar <endereço> <chave pública>");
  return createClient<Database>(c.url, c.chave, {
    auth: { storage: armazenamento(), persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Confere no servidor se o login continua válido (acesso revogado cai aqui na hora). */
export async function exigirLogin(sb: Cliente) {
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) throw new Error("Você não está conectado, ou o acesso foi revogado. Rode: mm entrar");
  const { data: perfil } = await sb.from("profiles").select("nome, papel, ativo").eq("id", data.user.id).maybeSingle();
  if (!perfil?.ativo) throw new Error("Seu acesso está desativado. Fale com o administrador.");
  return { id: data.user.id, email: data.user.email ?? "", nome: perfil.nome, admin: perfil.papel === "admin" };
}

export interface Achado {
  id: string;
  slug: string;
  titulo: string;
  tipo: string;
  resumo: string | null;
  instalavel: boolean;
}

export async function buscar(sb: Cliente, q: string, limite = 10): Promise<Achado[]> {
  const { data: achados, error } = await sb.rpc("search_resources", {
    // Sem filtro de plataforma: item ainda sem compatibilidade marcada também precisa aparecer.
    p_q: q,
    p_ordem: "relevancia",
    p_limite: limite,
  });
  if (error) throw new Error(`Falha na busca: ${error.message}`);
  const ids = (achados ?? []).map((a) => a.resource_id);
  if (!ids.length) return [];
  const { data } = await sb
    .from("resources")
    .select(
      `id, slug, titulo, resource_types(nome),
       resource_descriptions!resources_current_description_fk(resumo),
       install_packages(aprovado_em)`,
    )
    .in("id", ids);
  const porId = new Map((data ?? []).map((r) => [r.id, r]));
  return ids.flatMap((id) => {
    const r = porId.get(id);
    if (!r) return [];
    return [
      {
        id: r.id,
        slug: r.slug,
        titulo: r.titulo,
        tipo: r.resource_types?.nome ?? "",
        resumo: r.resource_descriptions?.resumo ?? null,
        instalavel: (r.install_packages ?? []).some((p) => p.aprovado_em),
      },
    ];
  });
}

export async function ficha(sb: Cliente, slug: string) {
  const { data: r, error } = await sb
    .from("resources")
    .select(
      `id, slug, titulo, aprovacao, link_oficial, conteudo, resource_types(slug, nome),
       descricao:resource_descriptions!resources_current_description_fk(resumo, o_que_faz, para_que_serve, campos),
       resource_commands(comando, acionamento, verificacao, platform_environments(nome)),
       install_packages(id, versao, tipo, manifesto, aprovado_em)`,
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!r) throw new Error(`Nada encontrado com o nome "${slug}". Use mm buscar para achar o nome certo.`);
  return r;
}

export interface PacotePronto {
  resourceId: string;
  slug: string;
  titulo: string;
  pacoteId: string;
  versao: string;
  manifesto: Manifesto;
}

/** Só instala pacote aprovado de recurso aprovado. O manifesto é validado de novo aqui, no computador. */
export async function pacoteAprovado(sb: Cliente, slug: string): Promise<PacotePronto> {
  const r = await ficha(sb, slug);
  if (r.aprovacao !== "aprovado") throw new Error(`"${r.titulo}" ainda não foi aprovado na biblioteca.`);
  const pacote = (r.install_packages ?? [])
    .filter((p) => p.aprovado_em)
    .sort((a, b) => Number(b.versao) - Number(a.versao))[0];
  if (!pacote) {
    throw new Error(
      `"${r.titulo}" não tem pacote de instalação aprovado. Veja a ficha para instalar manualmente: mm ver ${slug}`,
    );
  }
  const v = validarManifesto(pacote.manifesto);
  if (!v.ok) throw new Error(`O pacote de "${r.titulo}" é inválido e foi recusado: ${v.erro}`);
  return { resourceId: r.id, slug: r.slug, titulo: r.titulo, pacoteId: pacote.id, versao: pacote.versao, manifesto: v.manifesto };
}

/**
 * Registra a instalação no histórico da conta, para o painel web mostrar o que está em cada computador.
 * É só um espelho: se falhar, a instalação local continua válida.
 */
export async function espelharInstalacao(
  sb: Cliente,
  p: { resourceId: string; pacoteId: string; escopo: Escopo; caminho?: string; status: "instalado" | "removido" },
) {
  try {
    const usuario = await exigirLogin(sb);
    const nome = hostname();
    const { data: disp } = await sb
      .from("devices")
      .upsert({ owner_id: usuario.id, nome, sistema: platform(), ultima_sincronizacao: new Date().toISOString() }, { onConflict: "owner_id,nome" })
      .select("id")
      .single();
    if (!disp) return;
    const agora = new Date().toISOString();
    await sb.from("installations").upsert(
      {
        device_id: disp.id,
        resource_id: p.resourceId,
        package_id: p.pacoteId,
        alvo: "claude_code",
        escopo: p.escopo,
        caminho: p.caminho ?? null,
        status: p.status,
        instalado_em: p.status === "instalado" ? agora : undefined,
        removido_em: p.status === "removido" ? agora : null,
        updated_at: agora,
      },
      { onConflict: "device_id,resource_id,alvo,escopo" },
    );
  } catch {
    // espelho opcional
  }
}
