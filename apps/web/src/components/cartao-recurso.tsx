import Link from "next/link";
import type { CartaoRecurso as Cartao } from "@/lib/dados";
import { IconeEstrela } from "./icones";
import { ROTULO_COMPAT, Selo, SeloExemplo } from "./ui";

/** Ficha resumida mostrada nos resultados: nome, o que faz, tipo, categoria e compatibilidade. */
export function CartaoRecurso({ r }: { r: Cartao }) {
  const principal = r.categorias.find((c) => c.principal && !c.parentId) ?? r.categorias.find((c) => !c.parentId);
  const subs = r.categorias.filter((c) => c.parentId).map((c) => c.nome);

  return (
    <article className="group relative flex min-w-0 flex-col gap-3.5 rounded-cartao border border-linha bg-cartao p-5 transition-colors hover:border-texto sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Selo>{r.tipo}</Selo>
          {r.isSample && <SeloExemplo />}
          {r.aprovacao !== "aprovado" && <Selo tom="aviso">{r.aprovacao === "rascunho" ? "rascunho" : "em revisão"}</Selo>}
        </div>
        {r.favorito && (
          <span title="Favorito" className="shrink-0">
            <IconeEstrela width={18} height={18} className="fill-destaque" />
            <span className="sr-only">Favorito</span>
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl leading-tight font-bold tracking-[-0.02em]">
          <Link href={`/recursos/${r.id}`} className="after:absolute after:inset-0 after:rounded-cartao">
            {r.titulo}
          </Link>
        </h3>
        <p className="text-sm leading-relaxed text-suave">{r.resumo ?? "Sem resumo funcional ainda."}</p>
      </div>
      {(principal || subs.length > 0) && (
        <p className="text-xs text-suave">
          {principal?.nome}
          {subs.length > 0 && ` › ${subs.join(" · ")}`}
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-1.5 border-t border-linha pt-3.5">
        {r.compat.length === 0 && <Selo tom="suave">compatibilidade não informada</Selo>}
        {r.compat.map((c) => (
          <Selo key={c.ambiente} tom={ROTULO_COMPAT[c.resultado]?.tom ?? "suave"}>
            {c.ambiente} · {ROTULO_COMPAT[c.resultado]?.texto ?? c.resultado}
          </Selo>
        ))}
      </div>
    </article>
  );
}
