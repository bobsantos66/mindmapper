import Link from "next/link";
import type { CartaoRecurso as Cartao } from "@/lib/dados";
import { ROTULO_COMPAT, Selo, SeloExemplo } from "./ui";

/** Ficha resumida mostrada nos resultados: nome, o que faz, tipo, categoria e compatibilidade. */
export function CartaoRecurso({ r }: { r: Cartao }) {
  const principal = r.categorias.find((c) => c.principal && !c.parentId) ?? r.categorias.find((c) => !c.parentId);
  const subs = r.categorias.filter((c) => c.parentId).map((c) => c.nome);

  return (
    <article className="relative flex min-w-0 flex-col gap-3 border border-linha p-4 transition-colors hover:border-texto">
      <div className="flex flex-wrap items-center gap-1.5">
        <Selo>{r.tipo}</Selo>
        {r.isSample && <SeloExemplo />}
        {r.aprovacao !== "aprovado" && <Selo tom="aviso">{r.aprovacao === "rascunho" ? "rascunho" : "em revisão"}</Selo>}
        {r.favorito && <Selo tom="destaque">★ favorito</Selo>}
      </div>
      <h3 className="text-lg leading-snug font-semibold">
        <Link href={`/recursos/${r.id}`} className="after:absolute after:inset-0 hover:underline">
          {r.titulo}
        </Link>
      </h3>
      <p className="text-sm text-suave">{r.resumo ?? "Sem resumo funcional ainda."}</p>
      {(principal || subs.length > 0) && (
        <p className="font-mono text-[11px] text-suave">
          {principal?.nome}
          {subs.length > 0 && ` › ${subs.join(" · ")}`}
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-1.5">
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
