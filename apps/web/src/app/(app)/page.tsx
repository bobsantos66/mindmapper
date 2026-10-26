import Link from "next/link";
import { CartaoRecurso } from "@/components/cartao-recurso";
import { Botao, classeCampo } from "@/components/ui";
import { buscarRecursos, listarCategorias } from "@/lib/dados";

export default async function Inicio() {
  const [{ itens }, categorias] = await Promise.all([buscarRecursos({ ordem: "atualizacao" }), listarCategorias()]);

  return (
    <>
      <section className="flex flex-col gap-5 border-b-4 border-texto pb-8">
        <h1 className="max-w-[18ch] text-4xl leading-none font-bold tracking-tight sm:text-6xl">
          O que você quer <span className="bg-destaque px-1 text-sobre-destaque">fazer</span> hoje?
        </h1>
        <p className="max-w-[60ch] text-suave">
          Descreva a tarefa com suas palavras. A busca procura no nome, na finalidade, na ficha funcional, nas tags em
          português e inglês e nos filtros.
        </p>
        <form action="/recursos" method="get" role="search" className="flex max-w-3xl gap-2">
          <label htmlFor="busca-inicio" className="sr-only">
            Buscar
          </label>
          <input
            id="busca-inicio"
            name="q"
            type="search"
            placeholder="Ex.: FPV drone dive em comercial automotivo"
            className={`${classeCampo} py-3 text-base`}
          />
          <Botao variante="primario">Buscar</Botao>
        </form>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/chatgpt" className="border border-texto px-3 py-1.5 hover:bg-painel">
            Para o ChatGPT
          </Link>
          <Link href="/claude" className="border border-texto px-3 py-1.5 hover:bg-painel">
            Para o Claude
          </Link>
          <Link href="/favoritos" className="border border-texto px-3 py-1.5 hover:bg-painel">
            Meus favoritos
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Categorias</h2>
        <ul className="grid grid-cols-2 gap-px border border-linha bg-linha sm:grid-cols-3 lg:grid-cols-4">
          {categorias.map((c) => (
            <li key={c.id} className="bg-fundo">
              <Link href={`/recursos?cat=${c.id}`} className="flex h-full flex-col gap-1 p-4 hover:bg-painel">
                <span className="font-mono text-[11px] text-suave">{String(c.ordem).padStart(2, "0")}</span>
                <span className="font-semibold">{c.nome}</span>
                {c.filhas.length > 0 && <span className="text-xs text-suave">{c.filhas.length} subcategorias</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Atualizados recentemente</h2>
          <Link href="/recursos?ordem=atualizacao" className="text-sm underline-offset-4 hover:underline">
            Ver todos
          </Link>
        </div>
        {itens.length === 0 ? (
          <p className="text-sm text-suave">A biblioteca ainda está vazia.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {itens.slice(0, 6).map((r) => (
              <CartaoRecurso key={r.id} r={r} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
