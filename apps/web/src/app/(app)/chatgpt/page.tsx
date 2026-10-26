import type { Metadata } from "next";
import { PaginaBusca } from "@/components/pagina-busca";
import type { ParamsBusca } from "@/lib/parametros";

export const metadata: Metadata = { title: "ChatGPT" };

export default async function PaginaChatGPT({ searchParams }: { searchParams: Promise<ParamsBusca> }) {
  return (
    <PaginaBusca
      params={await searchParams}
      base="/chatgpt"
      plataformaFixa="chatgpt"
      titulo="ChatGPT"
      sub="Recursos com compatibilidade registrada com o ChatGPT."
      aviso={
        <p className="max-w-[72ch] border-l-4 border-destaque pl-4 text-sm">
          No ChatGPT, apps e conectores só podem ser adicionados na tela do próprio ChatGPT. Aqui você copia o prompt,
          abre o link oficial e segue o passo a passo. Nada aparece como instalado sem confirmação.
        </p>
      }
    />
  );
}
