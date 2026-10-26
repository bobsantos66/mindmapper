import Link from "next/link";
import type { ReactNode } from "react";
import { buscarRecursos, listarCategorias, listarFacetas, listarTipos } from "@/lib/dados";
import { contarFiltrosAtivos, lerFiltros, type ParamsBusca } from "@/lib/parametros";
import { CartaoRecurso } from "./cartao-recurso";
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

      <form action={base} method="get" className="flex flex-col gap-3" role="search">
        <div className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filtros.q ?? ""}
            placeholder="O que você quer fazer? Ex.: transformar planilha em gráfico"
            className={`${classeCampo} text-base`}
          />
          <Botao variante="primario" type="submit">
            Buscar
          </Botao>
        </div>

        <details className="border border-linha" open={ativos > 0}>
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
            Filtros {ativos > 0 && <span className="ml-1 bg-destaque px-1.5 text-sobre-destaque">{ativos}</span>}
          </summary>
          <div className="grid gap-5 border-t border-linha p-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <Link href={base} className="px-3 py-2 text-sm text-suave underline-offset-4 hover:underline">
                Limpar
              </Link>
            </div>
          </div>
        </details>
      </form>

      <section aria-live="polite" className="flex flex-col gap-4">
        <p className="font-mono text-xs text-suave">
          {total} {total === 1 ? "recurso encontrado" : "recursos encontrados"}
          {filtros.q ? ` para "${filtros.q}"` : ""}
        </p>
        {itens.length === 0 ? (
          <Vazio titulo="Nada encontrado com esses critérios.">
            Tente palavras mais gerais, descreva o que você quer fazer em vez do nome da ferramenta, ou limpe os filtros.
          </Vazio>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {itens.map((r) => (
              <CartaoRecurso key={r.id} r={r} />
            ))}
          </div>
        )}
        {paginas > 1 && (
          <nav aria-label="Páginas" className="flex items-center gap-3 text-sm">
            {pagina > 1 && <Link href={linkPagina(pagina - 1)}>← Anterior</Link>}
            <span className="font-mono text-xs text-suave">
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
      <legend className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-suave">{titulo}</legend>
      {children}
    </fieldset>
  );
}

function Opcao({ nome, valor, marcado, children }: { nome: string; valor: string; marcado: boolean; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm">
      <input type="checkbox" name={nome} value={valor} defaultChecked={marcado} className="mt-0.5 accent-[var(--texto)]" />
      <span>{children}</span>
    </label>
  );
}
