import type { Metadata } from "next";
import { PaginaBusca } from "@/components/pagina-busca";
import type { ParamsBusca } from "@/lib/parametros";

export const metadata: Metadata = { title: "Favoritos" };

export default async function PaginaFavoritos({ searchParams }: { searchParams: Promise<ParamsBusca> }) {
  return (
    <PaginaBusca
      params={await searchParams}
      base="/favoritos"
      somenteFavoritos
      titulo="Favoritos"
      sub="Os recursos que você marcou com estrela. Só você vê esta lista."
    />
  );
}
