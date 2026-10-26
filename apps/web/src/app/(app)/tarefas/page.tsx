import type { Metadata } from "next";
import { Titulo, Vazio } from "@/components/ui";

export const metadata: Metadata = { title: "Minhas tarefas" };

export default function Pagina() {
  return (
    <>
      <Titulo sub="O editor de tarefas reúne prompts e comandos, permite reordenar, editar, salvar, salvar como, duplicar e copiar o texto final.">Minhas tarefas</Titulo>
      <Vazio titulo="Chega na Fase 2.">Esta tela faz parte do plano aprovado e ainda não foi construída.</Vazio>
    </>
  );
}
