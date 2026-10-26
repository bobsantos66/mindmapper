import { readFile, readdir, stat } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { descreverMudancas, validarManifesto, type Manifesto } from "@mindmapper/core";
import { espelharInstalacao, exigirLogin, pacoteAprovado, type Cliente, type PacotePronto } from "./biblioteca";
import { aplicar, planejarInstalacao, planejarRemocao, type Acao, type Executor, type Opcoes, type Plano } from "./claude-code";
import { acharInstalado, esquecerInstalado, moverParaLixeira, registrarInstalado, type Instalado } from "./registro";

/** Operações comuns ao terminal (mm) e ao servidor MCP. Cada uma tem a etapa de prévia separada da execução. */

export interface PreviaInstalacao {
  pacote: PacotePronto;
  plano: Plano;
  mudancas: string[];
  jaInstalado: boolean;
}

export async function previaInstalacao(sb: Cliente, slug: string, o: Opcoes): Promise<PreviaInstalacao> {
  await exigirLogin(sb);
  const pacote = await pacoteAprovado(sb, slug);
  const plano = await planejarInstalacao(pacote.manifesto, o);
  const ja = (await acharInstalado(pacote.slug, o.escopo, o.projeto)).length > 0;
  let mudancas = descreverMudancas(pacote.manifesto);
  if (o.escopo === "project") mudancas = mudancas.map((m) => m.replaceAll("~/.claude/", `${o.projeto ?? "."}/.claude/`));
  return { pacote, plano, mudancas, jaInstalado: ja };
}

export async function instalar(
  sb: Cliente,
  p: PreviaInstalacao,
  o: Opcoes & { executor?: Executor; interativo?: boolean },
) {
  if (p.plano.conflitos.length) {
    throw new Error(`Instalação cancelada, nada foi alterado:\n- ${p.plano.conflitos.join("\n- ")}`);
  }
  await aplicar(p.plano.acoes, o);
  const item: Instalado = {
    slug: p.pacote.slug,
    titulo: p.pacote.titulo,
    resourceId: p.pacote.resourceId,
    pacoteId: p.pacote.pacoteId,
    versao: p.pacote.versao,
    escopo: o.escopo,
    projeto: o.escopo === "project" ? o.projeto : undefined,
    manifesto: p.pacote.manifesto,
    caminhos: p.plano.caminhos,
    instaladoEm: new Date().toISOString(),
  };
  await registrarInstalado(item);
  await espelharInstalacao(sb, {
    resourceId: item.resourceId,
    pacoteId: item.pacoteId,
    escopo: o.escopo,
    caminho: item.caminhos[0],
    status: "instalado",
  });
  return item;
}

export interface PreviaRemocao {
  item: Instalado;
  acoes: Acao[];
  mudancas: string[];
}

/** Só remove o que o próprio MindMapper instalou: o que não está no registro não é tocado. */
export async function previaRemocao(slug: string, o: Pick<Opcoes, "escopo" | "projeto">): Promise<PreviaRemocao> {
  const achados = await acharInstalado(slug, o.escopo, o.projeto);
  const item = achados[0];
  if (!item) {
    throw new Error(
      `"${slug}" não foi instalado pelo MindMapper ${o.escopo === "project" ? "neste projeto" : "neste computador"}. ` +
        "Para ver o que foi instalado: mm instalados",
    );
  }
  const acoes = planejarRemocao(item.manifesto, { escopo: item.escopo, projeto: item.projeto });
  const mudancas = item.caminhos.length
    ? item.caminhos.map((c) => `Mover para a lixeira do MindMapper: ${c}`)
    : acoes.map((a) => (a.tipo === "claude" ? `Executar: ${a.exibicao}` : ""));
  return { item, acoes, mudancas };
}

export async function remover(
  sb: Cliente | null,
  p: PreviaRemocao,
  o: { executor?: Executor; interativo?: boolean },
) {
  await aplicar(p.acoes, { escopo: p.item.escopo, projeto: p.item.projeto, ...o });
  const lixeira = p.item.caminhos.length ? await moverParaLixeira(p.item) : null;
  await esquecerInstalado(p.item);
  if (sb) {
    await espelharInstalacao(sb, {
      resourceId: p.item.resourceId,
      pacoteId: p.item.pacoteId,
      escopo: p.item.escopo,
      status: "removido",
    });
  }
  return lixeira;
}

// ---------------------------------------------------------------------------
// Incluir: leva uma skill ou um comando deste computador para a biblioteca, como rascunho.
// ---------------------------------------------------------------------------

function lerFrontmatter(texto: string): Record<string, string> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  if (!m) return {};
  return Object.fromEntries(
    m[1]!
      .split(/\r?\n/)
      .map((l) => /^([A-Za-z_-]+):\s*(.*)$/.exec(l))
      .filter((x): x is RegExpExecArray => !!x)
      .map((x) => [x[1]!.toLowerCase(), x[2]!.replace(/^["']|["']$/g, "").trim()]),
  );
}

function nomeSeguro(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function listarArquivos(pasta: string, base = pasta): Promise<string[]> {
  const saida: string[] = [];
  for (const e of await readdir(pasta, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = join(pasta, e.name);
    if (e.isDirectory()) saida.push(...(await listarArquivos(p, base)));
    else if (e.isFile()) saida.push(relative(base, p).split("\\").join("/"));
  }
  return saida;
}

export interface PreviaInclusao {
  titulo: string;
  slug: string;
  tipo: "skill" | "comando";
  descricao: string;
  conteudo: string;
  manifesto: Manifesto;
}

export async function previaInclusao(caminho: string): Promise<PreviaInclusao> {
  const alvo = resolve(caminho);
  const info = await stat(alvo);
  if (info.isDirectory()) {
    const skillMd = await readFile(join(alvo, "SKILL.md"), "utf8").catch(() => {
      throw new Error("Essa pasta não tem SKILL.md. Aponte para a pasta de uma skill ou para o .md de um comando.");
    });
    const fm = lerFrontmatter(skillMd);
    const nome = nomeSeguro(fm.name || basename(alvo));
    const arquivos: Record<string, string> = {};
    for (const rel of await listarArquivos(alvo)) {
      const conteudo = await readFile(join(alvo, rel));
      // Binários ficam de fora: o pacote guarda só texto.
      if (conteudo.includes(0)) continue;
      arquivos[rel] = conteudo.toString("utf8");
    }
    const v = validarManifesto({ tipo: "skill", nome, arquivos });
    if (!v.ok) throw new Error(`A skill não pôde ser incluída: ${v.erro}`);
    return { titulo: fm.name || basename(alvo), slug: nome, tipo: "skill", descricao: fm.description ?? "", conteudo: skillMd, manifesto: v.manifesto };
  }
  if (!alvo.endsWith(".md")) throw new Error("Aponte para a pasta de uma skill ou para o arquivo .md de um comando.");
  const texto = await readFile(alvo, "utf8");
  const fm = lerFrontmatter(texto);
  const nome = nomeSeguro(basename(alvo, ".md"));
  const v = validarManifesto({ tipo: "comando", nome, conteudo: texto });
  if (!v.ok) throw new Error(`O comando não pôde ser incluído: ${v.erro}`);
  return { titulo: `/${nome}`, slug: nome, tipo: "comando", descricao: fm.description ?? "", conteudo: texto, manifesto: v.manifesto };
}

/**
 * Cria o recurso como rascunho, com o pacote ainda não aprovado. Nada fica visível para
 * convidados nem instalável até o administrador revisar e aprovar na web.
 */
export async function incluir(sb: Cliente, p: PreviaInclusao) {
  const usuario = await exigirLogin(sb);
  if (!usuario.admin) throw new Error("Só o administrador inclui itens na biblioteca.");
  const { data: tipo } = await sb.from("resource_types").select("id").eq("slug", p.tipo).single();
  if (!tipo) throw new Error(`Tipo "${p.tipo}" não existe na biblioteca.`);

  const { data: existente } = await sb.from("resources").select("id").eq("slug", p.slug).maybeSingle();
  const slug = existente ? `${p.slug}-${Date.now().toString(36)}` : p.slug;

  const { data: r, error } = await sb
    .from("resources")
    .insert({
      titulo: p.titulo,
      slug,
      type_id: tipo.id,
      conteudo: p.conteudo,
      aprovacao: "rascunho",
      owner_id: usuario.id,
      importado_em: new Date().toISOString(),
    })
    .select("id, slug")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Já existe um recurso com o mesmo conteúdo na biblioteca.");
    throw new Error(error.message);
  }
  const { error: e2 } = await sb
    .from("install_packages")
    .insert({ resource_id: r.id, versao: "1", tipo: p.tipo, manifesto: p.manifesto as never });
  if (e2) throw new Error(`O recurso foi criado, mas o pacote falhou: ${e2.message}`);

  // A descrição que veio no próprio arquivo entra como rascunho de origem "importado",
  // sem completar campos: o que a fonte não diz fica ausente.
  if (p.descricao) {
    const { data: d } = await sb
      .from("resource_descriptions")
      .insert({
        resource_id: r.id,
        versao: 1,
        resumo: p.descricao.slice(0, 200),
        o_que_faz: p.descricao,
        gerado_por: "importado",
        status: "rascunho",
        created_by: usuario.id,
      })
      .select("id")
      .single();
    if (d) await sb.from("resources").update({ current_description_id: d.id }).eq("id", r.id);
  }
  return { ...r, existia: !!existente };
}
