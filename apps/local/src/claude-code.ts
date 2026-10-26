import { spawn } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Manifesto } from "@mindmapper/core";
import { pastaClaude, pastaClaudeProjeto } from "./caminhos";
import type { Escopo } from "./registro";

/**
 * Alvo Claude Code. Tudo o que muda no computador passa por aqui, em duas etapas:
 * planejar (lista exata do que vai acontecer, sem efeito) e aplicar.
 * Comandos do Claude Code rodam com argumentos fixos, sem shell: nada da biblioteca
 * vira linha de comando livre.
 */

export type Acao =
  | { tipo: "gravar"; caminho: string; conteudo: string }
  | { tipo: "claude"; args: string[]; /** Versão para mostrar, com segredos mascarados. */ exibicao: string };

export interface Plano {
  acoes: Acao[];
  /** Arquivos e pastas que passam a existir (skills e comandos), guardados no registro. */
  caminhos: string[];
  /** Coisas que já existem e impedem a instalação. */
  conflitos: string[];
  avisos: string[];
}

export interface Opcoes {
  escopo: Escopo;
  /** Pasta do projeto quando o escopo é "project". */
  projeto?: string;
  /** Valores das variáveis de um MCP Server. Ficam só neste computador. */
  variaveis?: Record<string, string>;
}

function pastaBase(o: Opcoes) {
  return o.escopo === "project" ? pastaClaudeProjeto(o.projeto) : pastaClaude();
}

async function existe(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

function exibir(args: string[], segredos: string[] = []) {
  let texto = ["claude", ...args.map((a) => (/^[\w@./:=-]+$/.test(a) ? a : JSON.stringify(a)))].join(" ");
  for (const s of segredos) if (s) texto = texto.split(s).join("•••");
  return texto;
}

export async function planejarInstalacao(m: Manifesto, o: Opcoes): Promise<Plano> {
  const base = pastaBase(o);
  const plano: Plano = { acoes: [], caminhos: [], conflitos: [], avisos: [] };

  switch (m.tipo) {
    case "skill": {
      const pasta = join(base, "skills", m.nome);
      if (await existe(pasta)) plano.conflitos.push(pasta);
      for (const [rel, conteudo] of Object.entries(m.arquivos)) {
        plano.acoes.push({ tipo: "gravar", caminho: join(pasta, rel), conteudo });
      }
      plano.caminhos.push(pasta);
      break;
    }
    case "comando": {
      const arquivo = join(base, "commands", `${m.nome}.md`);
      if (await existe(arquivo)) plano.conflitos.push(arquivo);
      plano.acoes.push({ tipo: "gravar", caminho: arquivo, conteudo: m.conteudo });
      plano.caminhos.push(arquivo);
      break;
    }
    case "plugin": {
      if (m.marketplace) {
        const args = ["plugin", "marketplace", "add", m.marketplace.fonte];
        plano.acoes.push({ tipo: "claude", args, exibicao: exibir(args) });
      }
      const args = ["plugin", "install", m.plugin, "--scope", o.escopo];
      plano.acoes.push({ tipo: "claude", args, exibicao: exibir(args) });
      plano.avisos.push("Plugins podem executar código neste computador com as suas permissões.");
      break;
    }
    case "mcp": {
      const faltando = m.variaveis.filter((v) => !o.variaveis?.[v]);
      if (faltando.length) plano.conflitos.push(`Faltam valores para: ${faltando.join(", ")}`);
      let args: string[];
      if (m.transporte === "stdio") {
        const env = m.variaveis.flatMap((v) => ["-e", `${v}=${o.variaveis?.[v] ?? ""}`]);
        // O nome vem antes de -e: a opção -e aceita vários valores e engoliria o nome.
        args = ["mcp", "add", "--scope", o.escopo, m.nome, ...env, "--", m.comando!, ...m.args];
      } else {
        args = ["mcp", "add", "--scope", o.escopo, "--transport", m.transporte, m.nome, m.url!];
      }
      plano.acoes.push({ tipo: "claude", args, exibicao: exibir(args, Object.values(o.variaveis ?? {})) });
      plano.avisos.push("MCP Servers podem acessar dados e executar ações com as suas permissões.");
      break;
    }
  }
  return plano;
}

/** Remoção de plugins e MCP Servers. Skills e comandos vão para a lixeira local (ver registro). */
export function planejarRemocao(m: Manifesto, o: Opcoes): Acao[] {
  switch (m.tipo) {
    case "plugin": {
      const args = ["plugin", "uninstall", m.plugin, "--scope", o.escopo];
      return [{ tipo: "claude", args, exibicao: exibir(args) }];
    }
    case "mcp": {
      const args = ["mcp", "remove", m.nome, "--scope", o.escopo];
      return [{ tipo: "claude", args, exibicao: exibir(args) }];
    }
    default:
      return [];
  }
}

export interface Resultado {
  codigo: number;
  saida: string;
}

export type Executor = (args: string[], o: { cwd?: string; interativo: boolean }) => Promise<Resultado>;

/**
 * Chama o executável `claude` sem shell. No modo interativo o terminal fica ligado ao
 * Claude Code, que mostra as próprias confirmações (por exemplo, a de plugins que rodam comandos).
 */
export const executarClaude: Executor = (args, o) =>
  new Promise((resolve, reject) => {
    const filho = spawn(process.env.MM_CLAUDE_BIN ?? "claude", args, {
      cwd: o.cwd,
      shell: false,
      stdio: o.interativo ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    let saida = "";
    filho.stdout?.on("data", (d) => (saida += d));
    filho.stderr?.on("data", (d) => (saida += d));
    filho.on("error", (e) =>
      reject(
        (e as NodeJS.ErrnoException).code === "ENOENT"
          ? new Error("O Claude Code não foi encontrado. Instale-o e confira se o comando `claude` funciona no terminal.")
          : e,
      ),
    );
    filho.on("close", (codigo) => resolve({ codigo: codigo ?? 1, saida }));
  });

export async function aplicar(acoes: Acao[], o: Opcoes & { executor?: Executor; interativo?: boolean }) {
  const executor = o.executor ?? executarClaude;
  for (const a of acoes) {
    if (a.tipo === "gravar") {
      await mkdir(dirname(a.caminho), { recursive: true });
      // flag "wx": falha se o arquivo já existir, mesmo que tenha aparecido depois do plano.
      await writeFile(a.caminho, a.conteudo, { flag: "wx" });
    } else {
      const r = await executor(a.args, { cwd: o.escopo === "project" ? o.projeto : undefined, interativo: !!o.interativo });
      if (r.codigo !== 0) {
        throw new Error(`O Claude Code recusou: ${a.exibicao}\n${r.saida.trim()}`.trim());
      }
    }
  }
}
