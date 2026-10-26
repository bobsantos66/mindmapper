/**
 * Regras de exibição de sintaxes de acionamento.
 * Nenhuma sintaxe é fixa no código: elas vêm do banco, e só aparecem quando a regra abaixo permite.
 */

export type Acionamento = "mencao_app" | "comando_barra" | "cli" | "link_instalacao" | "manual";
export type Verificacao = "verificado" | "encontrado_na_doc" | "nao_verificado";

export interface ComandoExibivel {
  acionamento: Acionamento;
  comando: string;
  verificacao: Verificacao;
  plataformaSlug: string;
  ambienteSlug: string;
}

export type Exibicao =
  | { mostrar: true; selo: "verificado" | "encontrado_na_doc" | "nao_verificado" }
  | { mostrar: false; motivo: string };

/**
 * @NomeDoApp só no ChatGPT; /comando só no Claude.
 * Fora dessas combinações a sintaxe não é exibida, mesmo que esteja cadastrada.
 */
export function regraExibicao(c: ComandoExibivel): Exibicao {
  if (c.acionamento === "mencao_app") {
    if (c.plataformaSlug !== "chatgpt") return { mostrar: false, motivo: "@App só existe no ChatGPT." };
    if (!/^@\S+$/.test(c.comando.trim())) return { mostrar: false, motivo: "Menção precisa começar com @." };
  }
  if (c.acionamento === "comando_barra") {
    if (c.plataformaSlug !== "claude") return { mostrar: false, motivo: "Comando de barra só no Claude." };
    if (!/^\/\S+/.test(c.comando.trim())) return { mostrar: false, motivo: "Comando precisa começar com /." };
  }
  return { mostrar: true, selo: c.verificacao };
}

/** Substitui {{parametro}} pelos valores informados; parâmetros sem valor ficam visíveis. */
export function preencherParametros(texto: string, valores: Record<string, string>): string {
  return texto.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (inteiro, nome: string) => {
    const v = valores[nome];
    return v && v.trim() !== "" ? v : inteiro;
  });
}

export function extrairParametros(texto: string): string[] {
  const nomes = new Set<string>();
  for (const m of texto.matchAll(/\{\{\s*([\w-]+)\s*\}\}/g)) if (m[1]) nomes.add(m[1]);
  return [...nomes];
}
