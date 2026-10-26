import type { Metadata } from "next";
import { FormRecurso } from "@/components/form-recurso";
import { Titulo } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { opcoesFormulario } from "@/lib/dados";

export const metadata: Metadata = { title: "Novo recurso" };

export default async function PaginaNovo() {
  await exigirAdmin();
  const opcoes = await opcoesFormulario();
  return (
    <>
      <Titulo sub="Só nome e tipo são obrigatórios para salvar como rascunho. Campos sem fonte ficam marcados como não verificados.">
        Novo recurso
      </Titulo>
      <FormRecurso
        opcoes={opcoes}
        cancelarHref="/recursos"
        inicial={{
          tipo: "skill",
          titulo: "",
          versao_recurso: "",
          autor: "",
          atividade: "",
          conteudo: "",
          link_oficial: "",
          instalacao_md: "",
          aprovacao: "rascunho",
          categorias: [],
          tags: [],
          novasTags: [],
          valores: [],
          compat: [],
          comandos: [],
          descricao: { resumo: "", o_que_faz: "", para_que_serve: "", campos: {} },
          pacote: "",
        }}
      />
    </>
  );
}
