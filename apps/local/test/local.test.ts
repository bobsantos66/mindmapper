import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Manifesto } from "@mindmapper/core";
import { aplicar, planejarInstalacao, planejarRemocao, type Executor } from "../src/claude-code";
import { previaInclusao, previaRemocao, remover } from "../src/operacoes";
import { listarInstalados, listarLixeira, registrarInstalado, restaurarDaLixeira, type Instalado } from "../src/registro";

let raiz: string;
let claude: string;
const chamadas: string[][] = [];
const executorFalso: Executor = async (args) => {
  chamadas.push(args);
  return { codigo: 0, saida: "" };
};

beforeEach(async () => {
  raiz = await mkdtemp(join(tmpdir(), "mm-teste-"));
  claude = join(raiz, "claude");
  process.env.MM_HOME = join(raiz, "mm");
  process.env.MM_CLAUDE_HOME = claude;
  chamadas.length = 0;
});

afterEach(async () => {
  await rm(raiz, { recursive: true, force: true });
});

const existe = (p: string) => stat(p).then(() => true, () => false);

const skill: Manifesto = {
  tipo: "skill",
  nome: "build-dashboard",
  arquivos: { "SKILL.md": "---\nname: build-dashboard\n---\nfaz painéis", "refs/guia.md": "guia" },
};

describe("instalação no Claude Code", () => {
  it("skill: grava os arquivos na pasta de skills do usuário", async () => {
    const plano = await planejarInstalacao(skill, { escopo: "user" });
    expect(plano.conflitos).toEqual([]);
    await aplicar(plano.acoes, { escopo: "user" });
    expect(await readFile(join(claude, "skills/build-dashboard/refs/guia.md"), "utf8")).toBe("guia");
    expect(plano.caminhos).toEqual([join(claude, "skills/build-dashboard")]);
  });

  it("skill: não sobrescreve uma pasta que já existe", async () => {
    await mkdir(join(claude, "skills/build-dashboard"), { recursive: true });
    const plano = await planejarInstalacao(skill, { escopo: "user" });
    expect(plano.conflitos).toHaveLength(1);
  });

  it("comando: escopo de projeto grava em .claude/commands da pasta do projeto", async () => {
    const projeto = join(raiz, "projeto");
    const plano = await planejarInstalacao({ tipo: "comando", nome: "resumo", conteudo: "Resuma $ARGUMENTS" }, { escopo: "project", projeto });
    await aplicar(plano.acoes, { escopo: "project", projeto });
    expect(await readFile(join(projeto, ".claude/commands/resumo.md"), "utf8")).toBe("Resuma $ARGUMENTS");
  });

  it("aplicar recusa arquivo que apareceu depois do plano", async () => {
    const plano = await planejarInstalacao({ tipo: "comando", nome: "x", conteudo: "novo" }, { escopo: "user" });
    await mkdir(join(claude, "commands"), { recursive: true });
    await writeFile(join(claude, "commands/x.md"), "do usuário");
    await expect(aplicar(plano.acoes, { escopo: "user" })).rejects.toThrow();
    expect(await readFile(join(claude, "commands/x.md"), "utf8")).toBe("do usuário");
  });

  it("plugin: adiciona o marketplace e instala com argumentos fixos", async () => {
    const plano = await planejarInstalacao(
      { tipo: "plugin", plugin: "dados@loja", marketplace: { nome: "loja", fonte: "empresa/plugins" } },
      { escopo: "user" },
    );
    await aplicar(plano.acoes, { escopo: "user", executor: executorFalso });
    expect(chamadas).toEqual([
      ["plugin", "marketplace", "add", "empresa/plugins"],
      ["plugin", "install", "dados@loja", "--scope", "user"],
    ]);
  });

  it("MCP stdio: o nome vem antes de -e e o segredo não aparece na exibição", async () => {
    const m: Manifesto = { tipo: "mcp", nome: "planilhas", transporte: "stdio", comando: "npx", args: ["-y", "srv"], variaveis: ["API_KEY"] };
    const plano = await planejarInstalacao(m, { escopo: "user", variaveis: { API_KEY: "segredo-123" } });
    const a = plano.acoes[0]!;
    expect(a.tipo === "claude" && a.args).toEqual(["mcp", "add", "--scope", "user", "planilhas", "-e", "API_KEY=segredo-123", "--", "npx", "-y", "srv"]);
    expect(a.tipo === "claude" && a.exibicao).not.toContain("segredo-123");
  });

  it("MCP sem os valores das variáveis fica bloqueado", async () => {
    const m: Manifesto = { tipo: "mcp", nome: "p", transporte: "stdio", comando: "srv", args: [], variaveis: ["TOKEN"] };
    const plano = await planejarInstalacao(m, { escopo: "user" });
    expect(plano.conflitos[0]).toContain("TOKEN");
  });

  it("MCP remoto usa --transport e a URL", async () => {
    const plano = await planejarInstalacao(
      { tipo: "mcp", nome: "sentry", transporte: "http", url: "https://mcp.sentry.dev/mcp", args: [], variaveis: [] },
      { escopo: "project", projeto: raiz },
    );
    const a = plano.acoes[0]!;
    expect(a.tipo === "claude" && a.args).toEqual(["mcp", "add", "--scope", "project", "--transport", "http", "sentry", "https://mcp.sentry.dev/mcp"]);
  });

  it("falha do Claude Code vira erro legível", async () => {
    const plano = await planejarInstalacao({ tipo: "plugin", plugin: "a@b" }, { escopo: "user" });
    const recusa: Executor = async () => ({ codigo: 1, saida: "plugin not found" });
    await expect(aplicar(plano.acoes, { escopo: "user", executor: recusa })).rejects.toThrow(/plugin not found/);
  });
});

describe("remoção, lixeira e restauração", () => {
  async function instalarSkill(): Promise<Instalado> {
    const plano = await planejarInstalacao(skill, { escopo: "user" });
    await aplicar(plano.acoes, { escopo: "user" });
    const item: Instalado = {
      slug: "build-dashboard",
      titulo: "Build Dashboard",
      resourceId: "r",
      pacoteId: "p",
      versao: "1",
      escopo: "user",
      manifesto: skill,
      caminhos: plano.caminhos,
      instaladoEm: new Date().toISOString(),
    };
    await registrarInstalado(item);
    return item;
  }

  it("remove para a lixeira e restaura no lugar", async () => {
    await instalarSkill();
    const previa = await previaRemocao("build-dashboard", { escopo: "user" });
    const lixo = await remover(null, previa, { executor: executorFalso });
    expect(await existe(join(claude, "skills/build-dashboard"))).toBe(false);
    expect(await listarInstalados()).toEqual([]);
    expect(lixo).not.toBeNull();

    const [item] = await listarLixeira();
    await restaurarDaLixeira(item!);
    expect(await readFile(join(claude, "skills/build-dashboard/SKILL.md"), "utf8")).toContain("faz painéis");
    expect(await listarLixeira()).toEqual([]);
  });

  it("não restaura por cima de algo que já está lá", async () => {
    await instalarSkill();
    await remover(null, await previaRemocao("build-dashboard", { escopo: "user" }), {});
    await mkdir(join(claude, "skills/build-dashboard"), { recursive: true });
    const [item] = await listarLixeira();
    await expect(restaurarDaLixeira(item!)).rejects.toThrow(/Já existe/);
  });

  it("não remove o que o MindMapper não instalou", async () => {
    await mkdir(join(claude, "skills/outra"), { recursive: true });
    await expect(previaRemocao("outra", { escopo: "user" })).rejects.toThrow(/não foi instalado pelo MindMapper/);
    expect(await existe(join(claude, "skills/outra"))).toBe(true);
  });

  it("plugin: remoção chama o uninstall do Claude Code", () => {
    expect(planejarRemocao({ tipo: "plugin", plugin: "a@b" }, { escopo: "user" })).toMatchObject([
      { args: ["plugin", "uninstall", "a@b", "--scope", "user"] },
    ]);
  });
});

describe("incluir na biblioteca", () => {
  it("lê uma pasta de skill, usa o nome do frontmatter e ignora binários e ocultos", async () => {
    const pasta = join(raiz, "Minha Skill");
    await mkdir(join(pasta, ".git"), { recursive: true });
    await writeFile(join(pasta, "SKILL.md"), "---\nname: Relatório Mensal\ndescription: Gera o relatório do mês\n---\ncorpo");
    await writeFile(join(pasta, "logo.png"), Buffer.from([0x89, 0x50, 0x00, 0x01]));
    await writeFile(join(pasta, ".git/config"), "x");
    const p = await previaInclusao(pasta);
    expect(p.slug).toBe("relatorio-mensal");
    expect(p.descricao).toBe("Gera o relatório do mês");
    expect(p.manifesto.tipo === "skill" && Object.keys(p.manifesto.arquivos)).toEqual(["SKILL.md"]);
  });

  it("recusa pasta sem SKILL.md", async () => {
    await mkdir(join(raiz, "vazia"));
    await expect(previaInclusao(join(raiz, "vazia"))).rejects.toThrow(/SKILL\.md/);
  });
});
