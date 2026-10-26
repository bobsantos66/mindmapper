import type { Metadata } from "next";
import Link from "next/link";
import { Titulo } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Administração" };

interface Estatisticas {
  total: number;
  exemplos: number;
  rascunhos: number;
  lixeira: number;
  tags_sugeridas: number;
  sem_fonte: number;
  duplicidades: number;
  links_sem_verificacao: number;
  por_categoria: { id: string; nome: string; total: number }[];
  por_plataforma: { nome: string; total: number }[];
}

export default async function PaginaAdmin() {
  await exigirAdmin();
  const supabase = await createClient();
  const { data } = await supabase.rpc("estatisticas_admin");
  const e = data as unknown as Estatisticas;
  const maxCat = Math.max(1, ...e.por_categoria.map((c) => c.total));

  return (
    <>
      <Titulo sub="Totais excluem os dados de exemplo, que aparecem separados.">Administração</Titulo>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Recursos" valor={e.total - e.exemplos} nota={`+ ${e.exemplos} de exemplo`} />
        <Numero rotulo="Rascunhos e revisão" valor={e.rascunhos} href="/recursos?ordem=atualizacao" />
        <Numero rotulo="Compatibilidade a verificar" valor={e.sem_fonte} />
        <Numero rotulo="Links sem verificação" valor={e.links_sem_verificacao} />
        <Numero rotulo="Duplicidades exatas" valor={e.duplicidades} />
        <Numero rotulo="Tags sugeridas" valor={e.tags_sugeridas} href="/categorias" />
        <Numero rotulo="Importações aguardando" valor={0} nota="importação na Fase 3" />
        <Numero rotulo="Na lixeira" valor={e.lixeira} href="/lixeira" />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Recursos por categoria</h2>
          <ul className="flex flex-col gap-2">
            {e.por_categoria.map((c) => (
              <li key={c.id} className="grid grid-cols-[minmax(0,12rem)_1fr_3ch] items-center gap-3 text-sm">
                <span className="truncate">{c.nome}</span>
                <span className="h-3 bg-painel">
                  <span className="block h-3 bg-destaque" style={{ width: `${(c.total / maxCat) * 100}%` }} />
                </span>
                <span className="text-right font-mono tabular-nums">{c.total}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Recursos por plataforma</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {e.por_plataforma.map((p) => (
              <li key={p.nome} className="flex justify-between border-b border-linha pb-2">
                <span>{p.nome}</span>
                <span className="font-mono tabular-nums">{p.total}</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 text-xl font-bold">Acessos</h2>
          <Link href="/admin/usuarios" className="underline-offset-4 hover:underline">
            Gerenciar convidados →
          </Link>
        </section>
      </div>
    </>
  );
}

function Numero({ rotulo, valor, nota, href }: { rotulo: string; valor: number; nota?: string; href?: string }) {
  const corpo = (
    <>
      <span className="text-xs font-semibold tracking-[0.06em] text-suave uppercase">{rotulo}</span>
      <span className="text-3xl font-bold tabular-nums">{valor}</span>
      {nota && <span className="text-xs text-suave">{nota}</span>}
    </>
  );
  return href ? (
    <Link href={href} className="flex flex-col gap-1 rounded-cartao border border-linha bg-cartao p-5 transition-colors hover:border-texto">
      {corpo}
    </Link>
  ) : (
    <div className="flex flex-col gap-1 rounded-cartao border border-linha bg-cartao p-5">{corpo}</div>
  );
}
