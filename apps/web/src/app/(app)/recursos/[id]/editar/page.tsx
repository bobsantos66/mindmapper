import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormRecurso } from "@/components/form-recurso";
import { Titulo, classeBotao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { obterRecurso, opcoesFormulario } from "@/lib/dados";
import { duplicarRecurso, excluirRecurso } from "@/server/recursos";

export const metadata: Metadata = { title: "Editar recurso" };

export default async function PaginaEditar({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const { id } = await params;
  const [r, opcoes] = await Promise.all([obterRecurso(id), opcoesFormulario()]);
  if (!r) notFound();

  const pacote = [...(r.install_packages ?? [])].sort((a, b) => Number(b.versao) - Number(a.versao))[0];
  const desc = r.descricao;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Titulo sub={`Modo edição · versão ${r.version} do registro`}>{r.titulo}</Titulo>
        <div className="flex flex-wrap gap-2">
          <Link href={`/recursos/${id}/historico`} className={classeBotao("fantasma")}>
            Histórico
          </Link>
          <form action={duplicarRecurso.bind(null, id)}>
            <button className={classeBotao("secundario")}>Duplicar</button>
          </form>
          <form action={excluirRecurso.bind(null, id)}>
            <button className={classeBotao("perigo")}>Excluir</button>
          </form>
        </div>
      </div>
      <FormRecurso
        opcoes={opcoes}
        cancelarHref={`/recursos/${id}`}
        inicial={{
          id: r.id,
          version: r.version,
          tipo: r.resource_types?.slug ?? "skill",
          titulo: r.titulo,
          versao_recurso: r.versao_recurso ?? "",
          autor: r.autor ?? "",
          atividade: r.activity_types?.slug ?? "",
          conteudo: r.conteudo,
          link_oficial: r.link_oficial ?? "",
          instalacao_md: r.instalacao_md ?? "",
          aprovacao: r.aprovacao,
          categorias: r.resource_categories.map((c) => ({ id: c.category_id, papel: c.papel })),
          tags: r.resource_tags.map((t) => t.tag_id),
          novasTags: [],
          valores: r.resource_facet_values.map((f) => f.facet_value_id),
          compat: r.resource_compatibility.map((c) => ({
            environment_id: c.environment_id,
            resultado: c.resultado,
            status_instalacao: c.status_instalacao,
            fonte_url: c.fonte_url ?? "",
            notas: c.notas ?? "",
          })),
          comandos: r.resource_commands.map((c) => ({
            environment_id: c.environment_id,
            acionamento: c.acionamento,
            comando: c.comando,
            exemplo_completo: c.exemplo_completo ?? "",
            verificacao: c.verificacao,
            fonte_url: c.fonte_url ?? "",
          })),
          descricao: {
            resumo: desc?.resumo ?? "",
            o_que_faz: desc?.o_que_faz ?? "",
            para_que_serve: desc?.para_que_serve ?? "",
            campos: r.campos,
          },
          pacote: pacote ? JSON.stringify(pacote.manifesto, null, 2) : "",
        }}
      />
    </>
  );
}
