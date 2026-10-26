import { z } from "zod";

/**
 * Manifesto de instalação no Claude Code.
 * É o único caminho de instalação: o MindMapper Local nunca executa texto livre da biblioteca,
 * só estes formatos validados, chamando os comandos oficiais com argumentos fixos.
 */

const nomeSeguro = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,63}$/, "Use letras minúsculas, números e hífen (até 64 caracteres).");

const caminhoRelativo = z
  .string()
  .min(1)
  .max(200)
  .refine(
    (p) => !p.startsWith("/") && !p.includes("\\") && !p.split("/").some((s) => s === ".." || s === "." || s === ""),
    "Caminho de arquivo inválido: use caminhos relativos simples, sem '..'.",
  );

export const pacoteSkillSchema = z.object({
  tipo: z.literal("skill"),
  nome: nomeSeguro,
  arquivos: z
    .record(caminhoRelativo, z.string().max(200_000))
    .refine((a) => "SKILL.md" in a, "A skill precisa de um arquivo SKILL.md.")
    .refine((a) => Object.keys(a).length <= 50, "No máximo 50 arquivos por skill."),
});

export const pacoteComandoSchema = z.object({
  tipo: z.literal("comando"),
  nome: nomeSeguro,
  conteudo: z.string().min(1).max(100_000),
});

export const pacotePluginSchema = z.object({
  tipo: z.literal("plugin"),
  /** nome@marketplace, como o Claude Code espera. */
  plugin: z.string().regex(/^[a-z0-9][a-z0-9._-]*@[a-z0-9][a-z0-9._-]*$/i, "Use o formato nome@marketplace."),
  marketplace: z
    .object({
      nome: z.string().regex(/^[a-z0-9][a-z0-9._-]*$/i),
      /** owner/repo do GitHub ou URL https de um repositório git. */
      fonte: z
        .string()
        .regex(/^([a-z0-9-]+\/[a-z0-9._-]+|https:\/\/[^\s]+)$/i, "Use owner/repo ou uma URL https."),
    })
    .optional(),
});

export const pacoteMcpSchema = z
  .object({
    tipo: z.literal("mcp"),
    nome: nomeSeguro,
    transporte: z.enum(["http", "sse", "stdio"]),
    url: z.url().startsWith("https://", "O servidor remoto precisa usar https.").optional(),
    comando: z
      .string()
      .regex(/^[a-zA-Z0-9._\/@-]+$/, "Comando inválido: só o nome do programa, sem espaços.")
      .optional(),
    args: z.array(z.string().max(500)).max(30).default([]),
    /** Só os nomes das variáveis; os valores são pedidos no computador do usuário e nunca saem dele. */
    variaveis: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)).max(20).default([]),
  })
  .refine((m) => (m.transporte === "stdio" ? !!m.comando && !m.url : !!m.url && !m.comando), {
    message: "stdio exige comando; http e sse exigem url.",
  });

export const manifestoSchema = z.discriminatedUnion("tipo", [
  pacoteSkillSchema,
  pacoteComandoSchema,
  pacotePluginSchema,
  // discriminatedUnion não aceita schemas com refine; validamos MCP em seguida.
  z.object({ tipo: z.literal("mcp") }).passthrough(),
]);

export type PacoteSkill = z.infer<typeof pacoteSkillSchema>;
export type PacoteComando = z.infer<typeof pacoteComandoSchema>;
export type PacotePlugin = z.infer<typeof pacotePluginSchema>;
export type PacoteMcp = z.infer<typeof pacoteMcpSchema>;
export type Manifesto = PacoteSkill | PacoteComando | PacotePlugin | PacoteMcp;

export function validarManifesto(entrada: unknown):
  | { ok: true; manifesto: Manifesto }
  | { ok: false; erro: string } {
  const base = manifestoSchema.safeParse(entrada);
  if (!base.success) return { ok: false, erro: base.error.issues.map((i) => i.message).join("; ") };
  if (base.data.tipo === "mcp") {
    const mcp = pacoteMcpSchema.safeParse(entrada);
    if (!mcp.success) return { ok: false, erro: mcp.error.issues.map((i) => i.message).join("; ") };
    return { ok: true, manifesto: mcp.data };
  }
  return { ok: true, manifesto: base.data as Manifesto };
}

/** Descrição legível do que a instalação vai mudar, mostrada antes da confirmação. */
export function descreverMudancas(m: Manifesto): string[] {
  switch (m.tipo) {
    case "skill":
      return [
        `Criar a pasta da skill "${m.nome}" em ~/.claude/skills/${m.nome}/`,
        ...Object.keys(m.arquivos).map((a) => `  gravar ${a}`),
      ];
    case "comando":
      return [`Gravar o comando /${m.nome} em ~/.claude/commands/${m.nome}.md`];
    case "plugin":
      return [
        ...(m.marketplace ? [`Adicionar o marketplace "${m.marketplace.nome}" (${m.marketplace.fonte})`] : []),
        `Instalar o plugin ${m.plugin} com: claude plugin install ${m.plugin}`,
        "Atenção: plugins podem executar código no seu computador com as suas permissões.",
      ];
    case "mcp":
      return [
        m.transporte === "stdio"
          ? `Registrar o MCP Server "${m.nome}" que executa: ${[m.comando, ...m.args].join(" ")}`
          : `Registrar o MCP Server remoto "${m.nome}" em ${m.url}`,
        ...(m.variaveis.length ? [`Pedir os valores de: ${m.variaveis.join(", ")} (ficam só neste computador)`] : []),
        "Atenção: MCP Servers podem acessar dados e executar ações com as suas permissões.",
      ];
  }
}
