import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Selo, Titulo, classeBotao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { historicoDescricoes, historicoVersoes, obterRecurso } from "@/lib/dados";
import { dataCurta } from "@/lib/texto";
import { restaurarDescricao } from "@/server/recursos";

export const metadata: Metadata = { title: "Histórico" };

export default async function PaginaHistorico({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const { id } = await params;
  const [r, descricoes, versoes] = await Promise.all([obterRecurso(id), historicoDescricoes(id), historicoVersoes(id)]);
  if (!r) notFound();

  return (
    <>
      <Titulo sub={<Link href={`/recursos/${id}`} className="underline">← Voltar para {r.titulo}</Link>}>Histórico</Titulo>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Versões da ficha funcional</h2>
        <p className="text-sm text-suave">Toda alteração ou nova geração cria uma versão. Nenhuma é apagada.</p>
        <ul className="flex flex-col divide-y divide-linha border border-linha">
          {descricoes.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <span className="font-mono">v{d.versao}</span>
              <Selo tom={d.id === r.current_description_id ? "destaque" : "suave"}>
                {d.id === r.current_description_id ? "em uso" : d.status}
              </Selo>
              <span className="text-suave">{d.gerado_por}</span>
              <span className="text-suave">{dataCurta(d.created_at)}</span>
              <span className="min-w-0 flex-1 truncate">{d.resumo}</span>
              {d.id !== r.current_description_id && (
                <form action={restaurarDescricao.bind(null, id, d.id)}>
                  <button className={classeBotao("secundario")}>Usar esta versão</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Versões do registro</h2>
        {versoes.length === 0 ? (
          <p className="text-sm text-suave">Ainda não houve alterações depois da criação.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-linha border border-linha">
            {versoes.map((v) => {
              const s = v.snapshot as { titulo?: string; aprovacao?: string };
              return (
                <li key={v.id} className="flex flex-wrap gap-3 p-3 text-sm">
                  <span className="font-mono">v{v.version}</span>
                  <span className="text-suave">{dataCurta(v.alterado_em)}</span>
                  <span>{s.titulo}</span>
                  <span className="text-suave">{s.aprovacao}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
