import type { FiltrosBusca } from "./dados";

export type ParamsBusca = Record<string, string | string[] | undefined>;

function lista(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).filter(Boolean);
}

const UUID = /^[0-9a-f-]{36}$/i;

export function lerFiltros(p: ParamsBusca): FiltrosBusca {
  const q = typeof p.q === "string" ? p.q.slice(0, 200) : undefined;
  const dias = Number(p.dias);
  const ordem = p.ordem === "titulo" || p.ordem === "atualizacao" || p.ordem === "relevancia" ? p.ordem : undefined;
  return {
    q,
    tipos: lista(p.tipo).filter((t) => /^[a-z_]+$/.test(t)),
    categorias: lista(p.cat).filter((c) => UUID.test(c)),
    plataformas: lista(p.plat).filter((s) => s === "chatgpt" || s === "claude"),
    tags: lista(p.tag).filter((c) => UUID.test(c)),
    valores: lista(p.f).filter((c) => UUID.test(c)),
    favoritos: p.fav === "1",
    desde: Number.isFinite(dias) && dias > 0 ? new Date(Date.now() - dias * 86_400_000).toISOString() : undefined,
    ordem,
    pagina: Math.max(1, Number(p.pagina) || 1),
  };
}

export function contarFiltrosAtivos(p: ParamsBusca) {
  return ["tipo", "cat", "plat", "tag", "f", "dias"].reduce((n, k) => n + lista(p[k]).length, 0);
}
