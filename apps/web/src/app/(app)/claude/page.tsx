import type { Metadata } from "next";
import { PaginaBusca } from "@/components/pagina-busca";
import type { ParamsBusca } from "@/lib/parametros";

export const metadata: Metadata = { title: "Claude" };

export default async function PaginaClaude({ searchParams }: { searchParams: Promise<ParamsBusca> }) {
  return (
    <PaginaBusca
      params={await searchParams}
      base="/claude"
      plataformaFixa="claude"
      titulo="Claude"
      sub="Recursos com compatibilidade registrada com Claude.ai, Claude Code ou Claude Desktop."
      aviso={
        <p className="max-w-[72ch] border-l-4 border-destaque pl-4 text-sm">
          No Claude Code, recursos com pacote de instalação aprovado são instalados e removidos pelo MindMapper Local,
          direto do terminal: <code className="rounded bg-painel px-1.5">mm instalar &lt;nome&gt;</code>.
        </p>
      }
    />
  );
}
