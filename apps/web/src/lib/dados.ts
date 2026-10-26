import "server-only";
import { cache } from "react";
import type { Campos } from "@mindmapper/core";
import { createClient } from "@/lib/supabase/server";

export interface Categoria {
  id: string;
  parent_id: string | null;
  nome: string;
  slug: string;
  ordem: number;
  status: "ativa" | "unida" | "arquivada";
  is_system: boolean;
}

export interface CategoriaComFilhas extends Categoria {
  filhas: Categoria[];
}

export const listarCategorias = cache(async (incluirInativas = false): Promise<CategoriaComFilhas[]> => {
  const supabase = await createClient();
  let q = supabase.from("categories").select("id, parent_id, nome, slug, ordem, status, is_system").order("ordem").order("nome");
  if (!incluirInativas) q = q.eq("status", "ativa");
  const { data } = await q;
  const todas = data ?? [];
  return todas
    .filter((c) => c.parent_id === null)
    .map((raiz) => ({ ...raiz, filhas: todas.filter((c) => c.parent_id === raiz.id) }));
});

export const listarTipos = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("resource_types").select("id, slug, nome").order("ordem");
  return data ?? [];
});

export const listarAmbientes = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_environments")
    .select("id, slug, nome, instalacao_automatica, notas, platforms(slug, nome)")
    .order("id");
  return (data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    nome: a.nome,
    instalacaoAutomatica: a.instalacao_automatica,
    notas: a.notas,
    plataformaSlug: a.platforms?.slug ?? "",
    plataformaNome: a.platforms?.nome ?? "",
  }));
});

export const listarFacetas = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("facets")
    .select("id, slug, nome, category_id, ordem, facet_values(id, valor_pt, status)")
    .order("ordem");
  return (data ?? []).map((f) => ({
    ...f,
    valores: (f.facet_values ?? []).filter((v) => v.status === "aprovada"),
  }));
});

export const listarTags = cache(async (incluirSugeridas = false) => {
  const supabase = await createClient();
  let q = supabase.from("tags").select("id, nome_pt, nome_en, sinonimos, status, category_id").order("nome_pt");
  if (!incluirSugeridas) q = q.eq("status", "aprovada");
  const { data } = await q;
  return data ?? [];
});

export interface CartaoRecurso {
  id: string;
  titulo: string;
  tipo: string;
  tipoSlug: string;
  resumo: string | null;
  categorias: { nome: string; principal: boolean; parentId: string | null }[];
  compat: { ambiente: string; plataforma: string; resultado: string }[];
  isSample: boolean;
  aprovacao: string;
  favorito: boolean;
  updatedAt: string;
}

export interface FiltrosBusca {
  q?: string;
  tipos?: string[];
  categorias?: string[];
  plataformas?: string[];
  tags?: string[];
  valores?: string[];
  favoritos?: boolean;
  desde?: string;
  ordem?: "relevancia" | "atualizacao" | "titulo";
  pagina?: number;
}

const POR_PAGINA = 24;

export async function buscarRecursos(f: FiltrosBusca): Promise<{ itens: CartaoRecurso[]; total: number }> {
  const supabase = await createClient();
  const pagina = Math.max(1, f.pagina ?? 1);
  const { data: achados, error } = await supabase.rpc("search_resources", {
    p_q: f.q || undefined,
    p_type_slugs: f.tipos?.length ? f.tipos : undefined,
    p_category_ids: f.categorias?.length ? f.categorias : undefined,
    p_platform_slugs: f.plataformas?.length ? f.plataformas : undefined,
    p_tag_ids: f.tags?.length ? f.tags : undefined,
    p_facet_value_ids: f.valores?.length ? f.valores : undefined,
    p_somente_favoritos: f.favoritos ?? false,
    p_atualizado_desde: f.desde || undefined,
    p_ordem: f.ordem ?? (f.q ? "relevancia" : "atualizacao"),
    p_limite: POR_PAGINA,
    p_offset: (pagina - 1) * POR_PAGINA,
  });
  if (error) throw new Error(`Falha na busca: ${error.message}`);
  const ids = (achados ?? []).map((a) => a.resource_id);
  const total = Number(achados?.[0]?.total ?? 0);
  return { itens: await carregarCartoes(ids), total };
}

export async function carregarCartoes(ids: string[]): Promise<CartaoRecurso[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const [{ data }, { data: auth }] = await Promise.all([
    supabase
      .from("resources")
      .select(
        `id, titulo, is_sample, aprovacao, updated_at,
         resource_types(slug, nome),
         resource_descriptions!resources_current_description_fk(resumo),
         resource_categories(papel, categories(nome, parent_id)),
         resource_compatibility(resultado, platform_environments(nome, platforms(slug)))`,
      )
      .in("id", ids),
    supabase.auth.getUser(),
  ]);
  const { data: favs } = await supabase
    .from("favorites")
    .select("resource_id")
    .eq("user_id", auth.user?.id ?? "")
    .in("resource_id", ids);
  const favoritos = new Set((favs ?? []).map((f) => f.resource_id));

  const porId = new Map<string, CartaoRecurso>(
    (data ?? []).map((r) => [
      r.id,
      {
        id: r.id,
        titulo: r.titulo,
        tipo: r.resource_types?.nome ?? "",
        tipoSlug: r.resource_types?.slug ?? "",
        resumo: r.resource_descriptions?.resumo ?? null,
        categorias: (r.resource_categories ?? [])
          .map((rc) => ({
            nome: rc.categories?.nome ?? "",
            principal: rc.papel === "principal",
            parentId: rc.categories?.parent_id ?? null,
          }))
          .sort((a, b) => Number(b.principal) - Number(a.principal)),
        compat: (r.resource_compatibility ?? []).map((c) => ({
          ambiente: c.platform_environments?.nome ?? "",
          plataforma: c.platform_environments?.platforms?.slug ?? "",
          resultado: c.resultado,
        })),
        isSample: r.is_sample,
        aprovacao: r.aprovacao,
        favorito: favoritos.has(r.id),
        updatedAt: r.updated_at,
      } satisfies CartaoRecurso,
    ]),
  );
  return ids.map((id) => porId.get(id)).filter((r): r is CartaoRecurso => !!r);
}

export async function obterRecurso(id: string) {
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("resources")
    .select(
      `*, resource_types(slug, nome), activity_types(slug, nome),
       descricao:resource_descriptions!resources_current_description_fk(*),
       resource_categories(papel, category_id, categories(id, nome, parent_id)),
       resource_tags(tag_id, tags(id, nome_pt, nome_en, status)),
       resource_facet_values(facet_value_id, facet_values(id, valor_pt, facets(nome))),
       resource_compatibility(*, platform_environments(id, slug, nome, instalacao_automatica, platforms(slug, nome))),
       resource_commands(*, platform_environments(id, slug, nome, platforms(slug, nome))),
       install_packages(id, versao, tipo, manifesto, aprovado_em)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!r) return null;

  const { data: auth } = await supabase.auth.getUser();
  const { data: fav } = await supabase
    .from("favorites")
    .select("resource_id")
    .eq("user_id", auth.user?.id ?? "")
    .eq("resource_id", id)
    .maybeSingle();

  let origem: { titulo: string; id: string } | null = null;
  if (r.derived_from_id) {
    const { data: o } = await supabase.from("resources").select("id, titulo").eq("id", r.derived_from_id).maybeSingle();
    origem = o;
  }

  return { ...r, campos: (r.descricao?.campos ?? {}) as Campos, favorito: !!fav, origem };
}
export type RecursoCompleto = NonNullable<Awaited<ReturnType<typeof obterRecurso>>>;

export async function historicoDescricoes(resourceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resource_descriptions")
    .select("id, versao, status, gerado_por, created_at, resumo")
    .eq("resource_id", resourceId)
    .order("versao", { ascending: false });
  return data ?? [];
}

export async function historicoVersoes(resourceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resource_versions")
    .select("id, version, alterado_em, snapshot")
    .eq("resource_id", resourceId)
    .order("version", { ascending: false })
    .limit(50);
  return data ?? [];
}

export const listarAtividades = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("activity_types").select("slug, nome").order("id");
  return data ?? [];
});

export async function opcoesFormulario() {
  const [tipos, atividades, categorias, tags, facetas, ambientes] = await Promise.all([
    listarTipos(),
    listarAtividades(),
    listarCategorias(),
    listarTags(),
    listarFacetas(),
    listarAmbientes(),
  ]);
  return {
    tipos,
    atividades,
    categorias: categorias.map((c) => ({ id: c.id, nome: c.nome, filhas: c.filhas.map((f) => ({ id: f.id, nome: f.nome })) })),
    tags: tags.map((t) => ({ id: t.id, nome_pt: t.nome_pt })),
    facetas: facetas.map((f) => ({ id: f.id, nome: f.nome, category_id: f.category_id, valores: f.valores })),
    ambientes: ambientes.map((a) => ({ id: a.id, nome: a.nome, plataformaSlug: a.plataformaSlug })),
  };
}
