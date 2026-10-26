import type { Metadata } from "next";
import { PaginaBusca } from "@/components/pagina-busca";
import { BotaoLink } from "@/components/ui";
import { getUsuario } from "@/lib/auth";
import type { ParamsBusca } from "@/lib/parametros";

export const metadata: Metadata = { title: "Todos os recursos" };

export default async function PaginaRecursos({ searchParams }: { searchParams: Promise<ParamsBusca> }) {
  const [params, usuario] = await Promise.all([searchParams, getUsuario()]);
  return (
    <>
      {usuario?.papel === "admin" && (
        <div className="flex justify-end">
          <BotaoLink href="/recursos/novo" variante="primario">
            Novo recurso
          </BotaoLink>
        </div>
      )}
      <PaginaBusca
        params={params}
        base="/recursos"
        titulo="Todos os recursos"
        sub="Prompts, skills, plugins, conectores, MCP Servers, agentes, templates, comandos e workflows."
      />
    </>
  );
}
