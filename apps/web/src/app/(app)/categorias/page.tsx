import type { Metadata } from "next";
import Link from "next/link";
import { FormSubcategoria, FormUnir } from "@/components/admin-forms";
import { Selo, Titulo } from "@/components/ui";
import { getUsuario } from "@/lib/auth";
import { listarCategorias, listarTags } from "@/lib/dados";
import { decidirTag, excluirCategoria, moverCategoria, renomearCategoria } from "@/server/categorias";

export const metadata: Metadata = { title: "Categorias" };

export default async function PaginaCategorias() {
  const usuario = await getUsuario();
  const admin = usuario?.papel === "admin";
  const [categorias, tags] = await Promise.all([listarCategorias(), listarTags(admin)]);
  const sugeridas = tags.filter((t) => t.status === "sugerida");
  const opcoes = categorias.map((c) => ({ id: c.id, nome: c.nome, filhas: c.filhas.map((f) => ({ id: f.id, nome: f.nome })) }));

  return (
    <>
      <Titulo sub="12 categorias principais. Cada uma tem poucas subcategorias; os assuntos específicos viram tags e os detalhes técnicos viram filtros.">
        Categorias
      </Titulo>

      <ol className="flex flex-col divide-y divide-linha overflow-hidden rounded-cartao border border-linha bg-cartao">
        {categorias.map((c) => (
          <li key={c.id} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-suave">{String(c.ordem).padStart(2, "0")}</span>
              <Link href={`/recursos?cat=${c.id}`} className="text-lg font-semibold hover:underline">
                {c.nome}
              </Link>
              {c.filhas.length === 0 && <Selo tom="aviso">subcategorias a definir</Selo>}
              {admin && <AcoesCategoria id={c.id} nome={c.nome} raiz />}
            </div>
            {c.filhas.length > 0 && (
              <ul className="ml-8 flex flex-col gap-1.5">
                {c.filhas.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-3 text-sm">
                    <Link href={`/recursos?cat=${c.id}&cat=${f.id}`} className="hover:underline">
                      {f.nome}
                    </Link>
                    {admin && <AcoesCategoria id={f.id} nome={f.nome} />}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {admin && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Incluir subcategoria</h2>
            <FormSubcategoria categorias={opcoes} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Unir categorias</h2>
            <p className="text-sm text-suave">
              Os recursos da primeira passam para a segunda sem duplicar. A primeira fica marcada como unida e sai dos menus.
            </p>
            <FormUnir categorias={opcoes} />
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Tags sugeridas aguardando aprovação</h2>
            {sugeridas.length === 0 ? (
              <p className="text-sm text-suave">Nenhuma sugestão pendente.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {sugeridas.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-3 text-sm">
                    <span>#{t.nome_pt}</span>
                    <form action={decidirTag.bind(null, t.id, "aprovada")}>
                      <button className="underline">Aprovar</button>
                    </form>
                    <form action={decidirTag.bind(null, t.id, "rejeitada")}>
                      <button className="text-perigo underline">Rejeitar</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}

function AcoesCategoria({ id, nome, raiz }: { id: string; nome: string; raiz?: boolean }) {
  return (
    <span className="ml-auto flex flex-wrap items-center gap-2 text-xs">
      <details>
        <summary className="cursor-pointer text-suave">Renomear</summary>
        <form action={renomearCategoria.bind(null, id)} className="mt-2 flex gap-2">
          <input name="nome" defaultValue={nome} aria-label={`Novo nome de ${nome}`} className="min-h-9 rounded-lg border border-linha-forte bg-fundo px-2.5" />
          <button className="min-h-9 rounded-lg border border-texto px-3 text-sm font-semibold">OK</button>
        </form>
      </details>
      <form action={moverCategoria.bind(null, id, "subir")}>
        <button aria-label={`Subir ${nome}`} className="px-1">↑</button>
      </form>
      <form action={moverCategoria.bind(null, id, "descer")}>
        <button aria-label={`Descer ${nome}`} className="px-1">↓</button>
      </form>
      {!raiz && (
        <form action={excluirCategoria.bind(null, id)}>
          <button className="text-perigo" title="Se tiver recursos, é arquivada em vez de excluída">
            Excluir
          </button>
        </form>
      )}
    </span>
  );
}
