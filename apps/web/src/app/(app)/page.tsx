import Link from "next/link";
import { CartaoRecurso } from "@/components/cartao-recurso";
import { IconeBusca } from "@/components/icones";
import { Botao } from "@/components/ui";
import { buscarRecursos, listarCategorias } from "@/lib/dados";

export default async function Inicio() {
  const [{ itens }, categorias] = await Promise.all([buscarRecursos({ ordem: "atualizacao" }), listarCategorias()]);

  return (
    <>
      <section className="flex max-w-[880px] flex-col gap-5">
        <h1 className="text-4xl leading-[1.02] font-bold tracking-[-0.04em] sm:text-[3.25rem]">O que você quer fazer hoje?</h1>
        <p className="max-w-[60ch] text-[15px] leading-relaxed text-suave">
          Descreva a tarefa com suas palavras. A busca procura no nome, na finalidade, na ficha, nas tags em português e
          inglês e nos filtros.
        </p>
        <form
          action="/recursos"
          method="get"
          role="search"
          className="flex min-h-16 items-center gap-3 rounded-[1.125rem] border-[1.5px] border-texto bg-fundo py-2 pr-2 pl-5"
        >
          <IconeBusca width={20} height={20} className="shrink-0" />
          <label htmlFor="busca-inicio" className="sr-only">
            Buscar
          </label>
          <input
            id="busca-inicio"
            name="q"
            type="search"
            placeholder="Ex.: FPV drone dive em comercial automotivo"
            className="min-w-0 flex-1 bg-transparent text-base text-texto outline-none placeholder:text-suave sm:text-[17px]"
          />
          <Botao variante="primario" className="min-h-12 rounded-xl px-5 text-[15px]">
            Buscar
          </Botao>
        </form>
        <div className="flex flex-wrap gap-2">
          {[
            ["/chatgpt", "Para o ChatGPT"],
            ["/claude", "Para o Claude"],
            ["/favoritos", "Meus favoritos"],
          ].map(([href, rotulo]) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-9 items-center rounded-full border border-linha-forte px-3.5 text-[13px] transition-colors hover:border-texto"
            >
              {rotulo}
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-[-0.02em]">Categorias</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categorias.map((c) => (
            <li key={c.id}>
              <Link
                href={`/recursos?cat=${c.id}`}
                className="flex h-full flex-col gap-1.5 rounded-cartao border border-linha bg-cartao p-4 transition-colors hover:border-texto sm:p-5"
              >
                <span className="text-xs font-semibold text-suave">{String(c.ordem).padStart(2, "0")}</span>
                <span className="leading-snug font-semibold">{c.nome}</span>
                {c.filhas.length > 0 && <span className="text-xs text-suave">{c.filhas.length} subcategorias</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold tracking-[-0.02em]">Atualizados recentemente</h2>
          <Link href="/recursos?ordem=atualizacao" className="text-sm underline-offset-4 hover:underline">
            Ver todos
          </Link>
        </div>
        {itens.length === 0 ? (
          <p className="text-sm text-suave">A biblioteca ainda está vazia.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
            {itens.slice(0, 6).map((r) => (
              <CartaoRecurso key={r.id} r={r} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
