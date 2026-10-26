import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { buscar, conectar, ficha } from "./biblioteca";
import { incluir, instalar, previaInclusao, previaInstalacao, previaRemocao, remover } from "./operacoes";
import { listarInstalados } from "./registro";

/**
 * Servidor MCP do MindMapper, para usar de dentro do Claude Code enquanto se monta um comando.
 * Toda ação que muda algo tem duas chamadas: a primeira (confirmar=false) só mostra o plano;
 * a segunda (confirmar=true) executa. O próprio Claude Code ainda pede permissão para cada chamada.
 */

const texto = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const erro = (e: unknown) => ({ ...texto(e instanceof Error ? e.message : String(e)), isError: true });

const escopo = z
  .enum(["user", "project"])
  .default("user")
  .describe('"user" vale para todos os projetos; "project" só para a pasta atual.');

export async function iniciarServidorMcp() {
  const servidor = new McpServer({ name: "mindmapper", version: "0.1.0" });

  servidor.registerTool(
    "buscar",
    {
      title: "Buscar na biblioteca MindMapper",
      description:
        "Busca prompts, skills, plugins, comandos e MCP Servers compatíveis com Claude pela intenção (ex.: 'transformar planilha em gráfico'). Retorna o nome para instalar.",
      inputSchema: { consulta: z.string().min(2) },
      annotations: { readOnlyHint: true },
    },
    async ({ consulta }) => {
      try {
        const achados = await buscar(await conectar(), consulta);
        if (!achados.length) return texto("Nada encontrado. Tente descrever o que quer fazer com outras palavras.");
        return texto(
          achados
            .map((a) => `- ${a.titulo} [${a.tipo}] nome: ${a.slug}${a.instalavel ? " (instalável)" : ""}\n  ${a.resumo ?? ""}`)
            .join("\n"),
        );
      } catch (e) {
        return erro(e);
      }
    },
  );

  servidor.registerTool(
    "ver_ficha",
    {
      title: "Ver ficha",
      description: "Mostra a ficha completa de um item: o que faz, como usar, comandos verificados e o pacote de instalação.",
      inputSchema: { nome: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ nome }) => {
      try {
        const r = await ficha(await conectar(), nome);
        return texto(JSON.stringify(r, null, 2));
      } catch (e) {
        return erro(e);
      }
    },
  );

  servidor.registerTool(
    "instalar",
    {
      title: "Instalar no Claude Code",
      description:
        "Instala um item aprovado da biblioteca neste computador. Chame primeiro com confirmar=false para ver o plano e mostre-o ao usuário; só chame com confirmar=true, repetindo a versão mostrada, depois que ele concordar.",
      inputSchema: {
        nome: z.string(),
        escopo,
        confirmar: z.boolean().default(false),
        versao: z.string().optional().describe("Versão do pacote mostrada na prévia. Se mudou desde então, nada é instalado."),
      },
      annotations: { destructiveHint: false, openWorldHint: true },
    },
    async ({ nome, escopo, confirmar, versao }) => {
      try {
        const sb = await conectar();
        const o = { escopo, projeto: process.cwd() };
        const previa = await previaInstalacao(sb, nome, o);
        if (previa.pacote.manifesto.tipo === "mcp" && previa.pacote.manifesto.variaveis.length) {
          return erro(
            `Este MCP Server pede valores secretos (${previa.pacote.manifesto.variaveis.join(", ")}). ` +
              `Para eles não passarem pela conversa, instale no terminal: mm instalar ${nome}`,
          );
        }
        const resumo = [
          `Plano para "${previa.pacote.titulo}" (pacote v${previa.pacote.versao}, escopo ${escopo}):`,
          ...previa.mudancas.map((m) => `- ${m}`),
          ...previa.plano.acoes.flatMap((a) => (a.tipo === "claude" ? [`- Executar: ${a.exibicao}`] : [])),
          ...previa.plano.conflitos.map((c) => `- BLOQUEADO: já existe ${c}`),
          ...(previa.jaInstalado ? ["- Já consta como instalado por aqui."] : []),
        ].join("\n");
        if (!confirmar) return texto(`${resumo}\n\nNada foi alterado ainda.`);
        if (versao && versao !== previa.pacote.versao) {
          return erro(`O pacote mudou para a versão ${previa.pacote.versao} desde a prévia. Nada foi instalado; veja o plano novo.`);
        }
        const item = await instalar(sb, previa, o);
        return texto(`Instalado: ${item.titulo}.\n${resumo}`);
      } catch (e) {
        return erro(e);
      }
    },
  );

  servidor.registerTool(
    "remover",
    {
      title: "Remover do Claude Code",
      description:
        "Remove um item que o MindMapper instalou. Arquivos vão para a lixeira do MindMapper e podem ser restaurados com `mm restaurar`. Chame com confirmar=false primeiro.",
      inputSchema: { nome: z.string(), escopo, confirmar: z.boolean().default(false) },
      annotations: { destructiveHint: true },
    },
    async ({ nome, escopo, confirmar }) => {
      try {
        const previa = await previaRemocao(nome, { escopo, projeto: process.cwd() });
        const resumo = [`Remover "${previa.item.titulo}":`, ...previa.mudancas.map((m) => `- ${m}`)].join("\n");
        if (!confirmar) return texto(`${resumo}\n\nNada foi alterado ainda.`);
        const sb = await conectar().catch(() => null);
        const lixo = await remover(sb, previa, {});
        return texto(`Removido.${lixo ? ` Para desfazer: mm restaurar ${lixo.id}` : ""}`);
      } catch (e) {
        return erro(e);
      }
    },
  );

  servidor.registerTool(
    "listar_instalados",
    {
      title: "Listar o que o MindMapper instalou",
      description: "Lista as skills, comandos, plugins e MCP Servers instalados pelo MindMapper neste computador.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const itens = await listarInstalados();
      if (!itens.length) return texto("Nada instalado pelo MindMapper ainda.");
      return texto(
        itens
          .map((i) => `- ${i.titulo} (${i.manifesto.tipo}) nome: ${i.slug}, escopo ${i.escopo}${i.projeto ? ` em ${i.projeto}` : ""}`)
          .join("\n"),
      );
    },
  );

  servidor.registerTool(
    "incluir_na_biblioteca",
    {
      title: "Incluir na biblioteca",
      description:
        "Envia uma skill (pasta com SKILL.md) ou um comando (.md) deste computador para a biblioteca, como rascunho para o administrador revisar. Chame com confirmar=false primeiro.",
      inputSchema: { caminho: z.string(), confirmar: z.boolean().default(false) },
      annotations: { openWorldHint: true },
    },
    async ({ caminho, confirmar }) => {
      try {
        const p = await previaInclusao(caminho);
        const arquivos = p.manifesto.tipo === "skill" ? Object.keys(p.manifesto.arquivos) : [`${p.slug}.md`];
        const resumo = `Incluir ${p.tipo} "${p.titulo}" como rascunho, com ${arquivos.length} arquivo(s): ${arquivos.join(", ")}`;
        if (!confirmar) return texto(`${resumo}\n\nNada foi enviado ainda.`);
        const r = await incluir(await conectar(), p);
        return texto(`Incluído como rascunho com o nome ${r.slug}. Revise e aprove na web para ficar instalável.`);
      } catch (e) {
        return erro(e);
      }
    },
  );

  await servidor.connect(new StdioServerTransport());
}
