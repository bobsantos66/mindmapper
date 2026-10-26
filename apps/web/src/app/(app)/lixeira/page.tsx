import type { Metadata } from "next";
import Link from "next/link";
import { Titulo, Vazio, classeBotao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dataCurta } from "@/lib/texto";
import { esvaziarLixeira, restaurarRecurso } from "@/server/recursos";

export const metadata: Metadata = { title: "Lixeira" };

export default async function PaginaLixeira() {
  await exigirAdmin();
  const supabase = await createClient();
  const [{ data }, { data: cfg }] = await Promise.all([
    supabase.from("resources").select("id, titulo, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
    supabase.from("app_settings").select("valor").eq("chave", "lixeira").single(),
  ]);
  const dias = (cfg?.valor as { dias_retencao?: number } | null)?.dias_retencao ?? 30;

  return (
    <>
      <Titulo sub={`Itens excluídos podem ser restaurados. "Esvaziar" apaga de vez os que estão aqui há mais de ${dias} dias.`}>
        Lixeira
      </Titulo>
      {!data?.length ? (
        <Vazio titulo="A lixeira está vazia." />
      ) : (
        <ul className="flex flex-col divide-y divide-linha overflow-hidden rounded-cartao border border-linha bg-cartao">
          {data.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <Link href={`/recursos/${r.id}`} className="min-w-0 flex-1 font-medium hover:underline">
                {r.titulo}
              </Link>
              <span className="text-suave">excluído em {dataCurta(r.deleted_at)}</span>
              <form action={restaurarRecurso.bind(null, r.id)}>
                <button className={classeBotao("secundario")}>Restaurar</button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={esvaziarLixeira}>
        <button className={classeBotao("perigo")}>Esvaziar itens com mais de {dias} dias</button>
      </form>
    </>
  );
}
