import type { Metadata } from "next";
import { Titulo, Vazio } from "@/components/ui";

export const metadata: Metadata = { title: "Importar arquivos" };

export default function Pagina() {
  return (
    <>
      <Titulo sub="Importação de PDF, Word, Excel, Markdown e JSON com leitura, classificação sugerida e aprovação antes do cadastro.">Importar arquivos</Titulo>
      <Vazio titulo="Chega na Fase 3.">Esta tela faz parte do plano aprovado e ainda não foi construída.</Vazio>
    </>
  );
}
