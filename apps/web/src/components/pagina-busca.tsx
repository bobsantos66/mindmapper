import Link from "next/link";
import type { ReactNode } from "react";
import { buscarRecursos, listarCategorias, listarFacetas, listarTipos } from "@/lib/dados";
import { contarFiltrosAtivos, lerFiltros, type ParamsBusca } from "@/lib/parametros";
import { CartaoRecurso } from "./cartao-recurso";
import { IconeBusca } from "./icones";
import { Botao, Titulo, Vazio, classeCampo } from "./ui";

interface Props {
  params: ParamsBusca;
  base: string;
  titulo: string;
  sub?: ReactNode;
  plataformaFixa?: "chatgpt" | "claude";
  somenteFavoritos?: boolean;
  aviso?: ReactNode;
}

export async function PaginaBusca({ params, base, titulo, sub, plataformaFixa, somenteFavoritos, aviso }: Props) {
  const filtros = lerFiltros(params);
  if (plataformaFixa) filtros.plataformas = [plataformaFixa];
  if (somenteFavoritos) filtros.favoritos = true;

  const [{ itens, total }, categorias, tipos, facetas] = await Promise.all([
    buscarRecursos(filtros),
    listarCategorias(),
    listarTipos(),
    listarFacetas(),
  ]);

  const marcados = (k: string) => {
    const v = params[k];
    return new Set(Array.isArray(v) ? v : v ? [v] : []);
  };
  const ativos = contarFiltrosAtivos(params);
  const catSel = marcados("cat");
  const facetasVisiveis = facetas.filter(
    (f) => !f.category_id || catSel.has(f.category_id) || categorias.some((c) => catSel.has(c.id) && c.id === f.category_id),
  );
  const pagina = filtros.pagina ?? 1;
  const paginas = Math.max(1, Math.ceil(total / 24));

  /** Link que troca um parâmetro (null remove) e mantém os outros, voltando à página 1. */
  const linkCom = (troca: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (k === "pagina" || k in troca || v === undefined) return;
      (Array.isArray(v) ? v : [v]).forEach((x) => sp.append(k, x));
    });
    Object.entries(troca).forEach(([k, v]) => v !== null && sp.set(k, v));
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const linkPagina = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (k === "pagina" || v === undefined) return;
      (Array.isArray(v) ? v : [v]).forEach((x) => sp.append(k, x));
    });
    sp.set("pagina", String(p));
    return `${base}?${sp.toString()}`;
  };

  return (
    <>
      <Titulo sub={sub}>{titulo}</Titulo>
      {aviso}

      <form action={base} method="get" className="flex flex-col gap-4" role="search">
        <div className="flex min-h-16 items-center gap-3 rounded-[1.125rem] border-[1.5px] border-texto bg-fundo py-2 pr-2 pl-5">
          <IconeBusca width={20} height={20} className="shrink-0" />
          <label htmlFor="q" className="sr-only">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filtros.q ?? ""}
            placeholder="O que você quer fazer? Ex.: transformar planilha em gráfico"
            className="min-w-0 flex-1 bg-transparent text-base text-texto outline-none placeholder:text-suave sm:text-[17px]"
          />
          <Botao variante="primario" type="submit" className="min-h-12 rounded-xl px-5 text-[15px]">
            Buscar
          </Botao>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Filtros rápidos">
          <Chip href={linkCom({ tipo: null })} ativo={marcados("tipo").size === 0}>
            Todos os tipos
          </Chip>
          {tipos.map((t) => (
            <Chip key={t.slug} href={linkCom({ tipo: t.slug })} ativo={marcados("tipo").has(t.slug) && marcados("tipo").size === 1}>
              {t.nome}
            </Chip>
          ))}
          {!plataformaFixa && (
            <>
              <span aria-hidden="true" className="mx-1 h-6 w-px self-center bg-linha-forte" />
              <Chip href={linkCom({ plat: marcados("plat").has("chatgpt") ? null : "chatgpt" })} ativo={marcados("plat").has("chatgpt")}>
                ChatGPT
              </Chip>
              <Chip href={linkCom({ plat: marcados("plat").has("claude") ? null : "claude" })} ativo={marcados("plat").has("claude")}>
                Claude
              </Chip>
            </>
          )}
        </div>

        <details className="rounded-cartao border border-linha bg-cartao" open={ativos > 0}>
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-4 text-sm font-semibold">
            Mais filtros
            {ativos > 0 && (
              <span className="rounded-full bg-destaque px-2 text-xs font-bold text-sobre-destaque">{ativos}</span>
            )}
          </summary>
          <div className="grid gap-6 border-t border-linha p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Grupo titulo="Tipo">
              {tipos.map((t) => (
                <Opcao key={t.slug} nome="tipo" valor={t.slug} marcado={marcados("tipo").has(t.slug)}>
                  {t.nome}
                </Opcao>
              ))}
            </Grupo>

            <Grupo titulo="Categoria">
              {categorias.map((c) => (
                <div key={c.id} className="flex flex-col gap-1">
                  <Opcao nome="cat" valor={c.id} marcado={catSel.has(c.id)}>
                    {c.nome}
                  </Opcao>
                  {c.filhas.length > 0 && catSel.has(c.id) && (
                    <div className="ml-5 flex flex-col gap-1">
                      {c.filhas.map((s) => (
                        <Opcao key={s.id} nome="cat" valor={s.id} marcado={catSel.has(s.id)}>
                          {s.nome}
                        </Opcao>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Grupo>

            <div className="flex flex-col gap-5">
              {!plataformaFixa && (
                <Grupo titulo="Plataforma">
                  <Opcao nome="plat" valor="chatgpt" marcado={marcados("plat").has("chatgpt")}>
                    ChatGPT
                  </Opcao>
                  <Opcao nome="plat" valor="claude" marcado={marcados("plat").has("claude")}>
                    Claude
                  </Opcao>
                </Grupo>
              )}
              {!somenteFavoritos && (
                <Grupo titulo="Favoritos">
                  <Opcao nome="fav" valor="1" marcado={params.fav === "1"}>
                    Só meus favoritos
                  </Opcao>
                </Grupo>
              )}
              <Grupo titulo="Atualizado">
                <select name="dias" defaultValue={typeof params.dias === "string" ? params.dias : ""} className={classeCampo}>
                  <option value="">Qualquer data</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                </select>
              </Grupo>
              <Grupo titulo="Ordenar por">
                <select name="ordem" defaultValue={typeof params.ordem === "string" ? params.ordem : ""} className={classeCampo}>
                  <option value="">Relevância</option>
                  <option value="atualizacao">Atualização</option>
                  <option value="titulo">Nome</option>
                </select>
              </Grupo>
            </div>

            <div className="flex flex-col gap-5">
              {facetasVisiveis.map((f) => (
                <Grupo key={f.id} titulo={f.nome}>
                  {f.valores.length === 0 && <span className="text-xs text-suave">Nenhum valor cadastrado.</span>}
                  {f.valores.map((v) => (
                    <Opcao key={v.id} nome="f" valor={v.id} marcado={marcados("f").has(v.id)}>
                      {v.valor_pt}
                    </Opcao>
                  ))}
                </Grupo>
              ))}
              {catSel.size === 0 && (
                <p className="text-xs text-suave">Escolha uma categoria para ver os filtros específicos dela.</p>
              )}
            </div>

            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <Botao type="submit" variante="primario">
                Aplicar filtros
              </Botao>
              <Link href={base} className="flex min-h-11 items-center px-3 text-sm text-suave underline-offset-4 hover:underline">
                Limpar
              </Link>
            </div>
          </div>
        </details>
      </form>

      <section aria-live="polite" className="flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold">
          {total} {total === 1 ? "resultado" : "resultados"}
          {filtros.q ? <span className="font-normal text-suave"> para &ldquo;{filtros.q}&rdquo;</span> : null}
        </h2>
        {itens.length === 0 ? (
          <Vazio titulo="Nada encontrado com esses critérios.">
            Tente palavras mais gerais, descreva o que você quer fazer em vez do nome da ferramenta, ou limpe os filtros.
          </Vazio>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
            {itens.map((r) => (
              <CartaoRecurso key={r.id} r={r} />
            ))}
          </div>
        )}
        {paginas > 1 && (
          <nav aria-label="Páginas" className="flex items-center gap-3 text-sm">
            {pagina > 1 && <Link href={linkPagina(pagina - 1)}>← Anterior</Link>}
            <span className="text-xs text-suave">
              página {pagina} de {paginas}
            </span>
            {pagina < paginas && <Link href={linkPagina(pagina + 1)}>Próxima →</Link>}
          </nav>
        )}
      </section>
    </>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-2 text-xs font-semibold tracking-[0.06em] text-suave uppercase">{titulo}</legend>
      {children}
    </fieldset>
  );
}

function Opcao({ nome, valor, marcado, children }: { nome: string; valor: string; marcado: boolean; children: ReactNode }) {
  return (
    <label className="flex min-h-7 cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" name={nome} value={valor} defaultChecked={marcado} className="mt-0.5 h-4 w-4 accent-[var(--texto)]" />
      <span>{children}</span>
    </label>
  );
}

function Chip({ href, ativo, children }: { href: string; ativo: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "true" : undefined}
      className={`inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] transition-colors ${
        ativo ? "border-inverso bg-inverso text-sobre-inverso" : "border-linha-forte hover:border-texto"
      }`}
    >
      {children}
    </Link>
  );
}
