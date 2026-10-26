import { describe, expect, it } from "vitest";
import {
  camposAusentes,
  camposDoTipo,
  descreverMudancas,
  extrairParametros,
  preencherParametros,
  regraExibicao,
  validarManifesto,
} from "./index";

describe("ficha", () => {
  it("esconde campos de instalação para prompts", () => {
    const chaves = camposDoTipo("prompt").map((c) => c.chave);
    expect(chaves).not.toContain("como_instalar");
    expect(camposDoTipo("skill").map((c) => c.chave)).toContain("como_instalar");
  });

  it("não conta 'não se aplica' como ausente", () => {
    const ausentes = camposAusentes("skill", {
      custos: { valor: null, origem: "manual", estado: "nao_se_aplica", fontes: [] },
      resultados: { valor: "Um painel", origem: "manual", estado: "nao_verificado", fontes: [] },
    });
    expect(ausentes).not.toContain("custos");
    expect(ausentes).not.toContain("resultados");
    expect(ausentes).toContain("dependencias");
  });
});

describe("sintaxe", () => {
  it("só mostra @App no ChatGPT", () => {
    expect(
      regraExibicao({ acionamento: "mencao_app", comando: "@Canva", verificacao: "verificado", plataformaSlug: "claude", ambienteSlug: "claude-code" }).mostrar,
    ).toBe(false);
    expect(
      regraExibicao({ acionamento: "mencao_app", comando: "@Canva", verificacao: "verificado", plataformaSlug: "chatgpt", ambienteSlug: "chatgpt" }).mostrar,
    ).toBe(true);
  });

  it("só mostra /comando no Claude", () => {
    expect(
      regraExibicao({ acionamento: "comando_barra", comando: "/review", verificacao: "nao_verificado", plataformaSlug: "chatgpt", ambienteSlug: "chatgpt" }).mostrar,
    ).toBe(false);
  });

  it("preenche parâmetros e mantém os vazios visíveis", () => {
    const t = "Crie um vídeo de {{duracao}} sobre {{tema}}";
    expect(extrairParametros(t)).toEqual(["duracao", "tema"]);
    expect(preencherParametros(t, { duracao: "30s" })).toBe("Crie um vídeo de 30s sobre {{tema}}");
  });
});

describe("pacotes", () => {
  it("aceita skill com SKILL.md", () => {
    const r = validarManifesto({ tipo: "skill", nome: "build-dashboard", arquivos: { "SKILL.md": "---\nname: x\n---" } });
    expect(r.ok).toBe(true);
  });

  it("recusa caminhos que saem da pasta", () => {
    const r = validarManifesto({ tipo: "skill", nome: "x", arquivos: { "SKILL.md": "a", "../../.bashrc": "rm -rf ~" } });
    expect(r.ok).toBe(false);
  });

  it("recusa nome com caracteres de shell", () => {
    expect(validarManifesto({ tipo: "comando", nome: "x; rm -rf ~", conteudo: "a" }).ok).toBe(false);
  });

  it("exige https em MCP remoto e comando em stdio", () => {
    expect(validarManifesto({ tipo: "mcp", nome: "x", transporte: "http", url: "http://inseguro.com" }).ok).toBe(false);
    expect(validarManifesto({ tipo: "mcp", nome: "x", transporte: "stdio" }).ok).toBe(false);
    const ok = validarManifesto({ tipo: "mcp", nome: "x", transporte: "stdio", comando: "npx", args: ["-y", "pacote"] });
    expect(ok.ok).toBe(true);
  });

  it("avisa que plugins executam código", () => {
    const r = validarManifesto({ tipo: "plugin", plugin: "github@claude-plugins-official" });
    expect(r.ok && descreverMudancas(r.manifesto).join(" ")).toContain("executar código");
  });
});
