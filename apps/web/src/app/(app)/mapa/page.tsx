import type { Metadata } from "next";
import { Titulo, Vazio } from "@/components/ui";

export const metadata: Metadata = { title: "Mapa mental" };

export default function Pagina() {
  return (
    <>
      <Titulo sub="Navegação visual entre categorias, subcategorias, recursos, plataformas e tarefas, com ramos que expandem e recolhem.">Mapa mental</Titulo>
      <Vazio titulo="Chega na Fase 2.">Esta tela faz parte do plano aprovado e ainda não foi construída.</Vazio>
    </>
  );
}
