import { z } from "zod";

/** Estado de cada campo da ficha. "nao_se_aplica" é diferente de "ausente": não é lacuna. */
export const ESTADOS_CAMPO = ["verificado", "nao_verificado", "ausente", "nao_se_aplica"] as const;
export type EstadoCampo = (typeof ESTADOS_CAMPO)[number];

export const ROTULO_ESTADO: Record<EstadoCampo, string> = {
  verificado: "Verificado",
  nao_verificado: "Não verificado",
  ausente: "Informação ausente",
  nao_se_aplica: "Não se aplica",
};

export const ORIGENS = ["manual", "importado", "regras", "ia"] as const;

export const fonteSchema = z.object({
  documento: z.string().max(300).optional(),
  url: z.url().max(2000).optional(),
  trecho: z.string().max(2000).optional(),
});

export const valorCampoSchema = z.object({
  valor: z.string().max(20000).nullable(),
  origem: z.enum(ORIGENS).default("manual"),
  estado: z.enum(ESTADOS_CAMPO).default("nao_verificado"),
  fontes: z.array(fonteSchema).max(20).default([]),
});
export type ValorCampo = z.infer<typeof valorCampoSchema>;

export type GrupoFicha = "descricao" | "utilizacao" | "requisitos";

export interface DefinicaoCampo {
  chave: string;
  rotulo: string;
  grupo: GrupoFicha;
  ajuda?: string;
  /** Tipos de recurso para os quais o campo não faz sentido. */
  naoAplicaA?: string[];
}

const SEM_INSTALACAO = ["prompt", "template"];

/** Campos guardados em resource_descriptions.campos (os demais são colunas). */
export const CAMPOS_FICHA: DefinicaoCampo[] = [
  { chave: "principais_funcionalidades", rotulo: "Principais funcionalidades", grupo: "descricao" },
  { chave: "exemplos", rotulo: "Exemplos práticos", grupo: "descricao" },
  { chave: "entradas", rotulo: "Entradas aceitas", grupo: "descricao" },
  { chave: "resultados", rotulo: "Resultados produzidos", grupo: "descricao" },
  { chave: "limitacoes", rotulo: "Limitações conhecidas", grupo: "descricao" },
  { chave: "como_instalar", rotulo: "Como instalar", grupo: "utilizacao", naoAplicaA: SEM_INSTALACAO },
  { chave: "como_configurar", rotulo: "Como configurar", grupo: "utilizacao", naoAplicaA: SEM_INSTALACAO },
  { chave: "como_utilizar", rotulo: "Como utilizar", grupo: "utilizacao" },
  { chave: "exemplo_comando", rotulo: "Exemplo de comando completo", grupo: "utilizacao" },
  { chave: "dependencias", rotulo: "Dependências", grupo: "requisitos", naoAplicaA: SEM_INSTALACAO },
  { chave: "permissoes", rotulo: "Permissões necessárias", grupo: "requisitos", naoAplicaA: SEM_INSTALACAO },
  { chave: "versoes_compativeis", rotulo: "Versões compatíveis", grupo: "requisitos", naoAplicaA: SEM_INSTALACAO },
  { chave: "conta_assinatura", rotulo: "Conta ou assinatura", grupo: "requisitos" },
  { chave: "custos", rotulo: "Custos conhecidos", grupo: "requisitos" },
  { chave: "ferramentas_adicionais", rotulo: "Ferramentas adicionais", grupo: "requisitos" },
];

export const ROTULO_GRUPO: Record<GrupoFicha, string> = {
  descricao: "Descrição funcional",
  utilizacao: "Utilização",
  requisitos: "Requisitos",
};

export function camposDoTipo(tipoSlug: string): DefinicaoCampo[] {
  return CAMPOS_FICHA.filter((c) => !c.naoAplicaA?.includes(tipoSlug));
}

export const camposSchema = z.record(z.string(), valorCampoSchema);
export type Campos = z.infer<typeof camposSchema>;

/** Campos aplicáveis sem valor e sem marcação de "não se aplica". */
export function camposAusentes(tipoSlug: string, campos: Campos): string[] {
  return camposDoTipo(tipoSlug)
    .filter((c) => {
      const v = campos[c.chave];
      if (!v) return true;
      if (v.estado === "nao_se_aplica") return false;
      return !v.valor || v.valor.trim() === "" || v.estado === "ausente";
    })
    .map((c) => c.chave);
}

/** Proporção de campos aplicáveis preenchidos, para o indicador de completude. */
export function completude(tipoSlug: string, campos: Campos, extras: (string | null | undefined)[] = []) {
  const aplicaveis = camposDoTipo(tipoSlug).filter((c) => campos[c.chave]?.estado !== "nao_se_aplica");
  const ausentes = camposAusentes(tipoSlug, campos).length;
  const extrasPreenchidos = extras.filter((e) => e && e.trim() !== "").length;
  const total = aplicaveis.length + extras.length;
  const preenchidos = aplicaveis.length - ausentes + extrasPreenchidos;
  return { preenchidos, total };
}

export const RESUMO_MAX = 200;
