"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { camposAusentes, camposSchema, RESUMO_MAX, validarManifesto } from "@mindmapper/core";
import { exigirAdmin, exigirUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/texto";

const uuid = z.uuid();
const urlOpcional = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v === "" ? null : v))
  .pipe(z.url("Link inválido.").startsWith("http", "Use um link http ou https.").nullable());
const textoOpcional = z
  .string()
  .trim()
  .max(20000)
  .transform((v) => (v === "" ? null : v));

const dadosRecursoSchema = z.object({
  id: uuid.optional(),
  version: z.number().int().positive().optional(),
  modo: z.enum(["salvar", "salvar_como"]),
  tipo: z.string().regex(/^[a-z_]+$/),
  titulo: z.string().trim().min(1, "Informe o nome.").max(200),
  versao_recurso: textoOpcional,
  autor: textoOpcional,
  atividade: z.string().regex(/^[a-z_]*$/).optional(),
  conteudo: z.string().max(200_000),
  link_oficial: urlOpcional,
  instalacao_md: textoOpcional,
  aprovacao: z.enum(["rascunho", "em_revisao", "aprovado"]),
  categorias: z
    .array(z.object({ id: uuid, papel: z.enum(["principal", "secundaria"]) }))
    .refine((c) => c.filter((x) => x.papel === "principal").length <= 1, "Só uma categoria principal."),
  tags: z.array(uuid).max(100),
  novasTags: z.array(z.string().trim().min(1).max(60)).max(30),
  valores: z.array(uuid).max(100),
  compat: z
    .array(
      z.object({
        environment_id: z.number().int(),
        resultado: z.enum(["comprovada", "declarada_na_fonte", "nao_verificada", "incompativel", "nao_se_aplica"]),
        status_instalacao: z.enum(["instalado", "requer_configuracao", "desconhecido"]),
        fonte_url: urlOpcional,
        notas: textoOpcional,
      }),
    )
    .refine(
      (l) => l.every((c) => !["comprovada", "declarada_na_fonte"].includes(c.resultado) || c.fonte_url),
      "Compatibilidade comprovada ou declarada precisa de um link de fonte.",
    ),
  comandos: z
    .array(
      z.object({
        environment_id: z.number().int(),
        acionamento: z.enum(["mencao_app", "comando_barra", "cli", "link_instalacao", "manual"]),
        comando: z.string().trim().min(1).max(5000),
        exemplo_completo: textoOpcional,
        verificacao: z.enum(["verificado", "encontrado_na_doc", "nao_verificado"]),
        fonte_url: urlOpcional,
      }),
    )
    .refine(
      (l) => l.every((c) => c.verificacao === "nao_verificado" || c.fonte_url),
      "Comando verificado precisa de um link de fonte.",
    ),
  descricao: z.object({
    resumo: z.string().trim().max(RESUMO_MAX, `O resumo tem no máximo ${RESUMO_MAX} caracteres.`),
    o_que_faz: z.string().trim().max(5000),
    para_que_serve: z.string().trim().max(5000),
    campos: camposSchema,
  }),
  pacote: z.string().max(400_000).optional(),
});

export type DadosRecurso = z.input<typeof dadosRecursoSchema>;
export type EstadoSalvar = { erro?: string };

export async function salvarRecurso(_: EstadoSalvar, form: FormData): Promise<EstadoSalvar> {
  const usuario = await exigirAdmin();
  let bruto: unknown;
  try {
    // O botão clicado envia o modo; ele vale mais que o JSON, que pode estar um render atrasado.
    bruto = { ...JSON.parse(String(form.get("dados") ?? "")), modo: form.get("modo") ?? "salvar" };
  } catch {
    return { erro: "Não foi possível ler o formulário." };
  }
  const parse = dadosRecursoSchema.safeParse(bruto);
  if (!parse.success) return { erro: parse.error.issues.map((i) => i.message).join(" ") };
  const d = parse.data;

  let manifesto: ReturnType<typeof validarManifesto> | null = null;
  if (d.pacote && d.pacote.trim() !== "") {
    let json: unknown;
    try {
      json = JSON.parse(d.pacote);
    } catch {
      return { erro: "O pacote de instalação não é um JSON válido." };
    }
    manifesto = validarManifesto(json);
    if (!manifesto.ok) return { erro: `Pacote de instalação inválido: ${manifesto.erro}` };
  }

  const supabase = await createClient();
  const [{ data: tipo }, { data: atividade }] = await Promise.all([
    supabase.from("resource_types").select("id").eq("slug", d.tipo).single(),
    d.atividade
      ? supabase.from("activity_types").select("id").eq("slug", d.atividade).single()
      : Promise.resolve({ data: null }),
  ]);
  if (!tipo) return { erro: "Tipo de recurso desconhecido." };

  const linha = {
    type_id: tipo.id,
    titulo: d.titulo,
    slug: slugify(d.titulo),
    versao_recurso: d.versao_recurso,
    autor: d.autor,
    activity_type_id: atividade?.id ?? null,
    conteudo: d.conteudo,
    link_oficial: d.link_oficial,
    instalacao_md: d.instalacao_md,
    aprovacao: d.aprovacao,
  };

  let id: string;
  const novo = !d.id || d.modo === "salvar_como";
  if (novo) {
    const { data, error } = await supabase
      .from("resources")
      .insert({ ...linha, owner_id: usuario.id, derived_from_id: d.modo === "salvar_como" ? d.id : null })
      .select("id")
      .single();
    if (error || !data) return { erro: `Não foi possível criar: ${error?.message}` };
    id = data.id;
  } else {
    // Salvar: atualiza o mesmo registro, só se ninguém alterou desde que a tela foi aberta.
    const { data, error } = await supabase
      .from("resources")
      .update(linha)
      .eq("id", d.id!)
      .eq("version", d.version ?? 0)
      .select("id");
    if (error) return { erro: `Não foi possível salvar: ${error.message}` };
    if (!data || data.length === 0)
      return { erro: "Este recurso foi alterado por outra pessoa ou em outra aba. Recarregue a página antes de salvar." };
    id = d.id!;
  }

  // Tags novas digitadas pelo admin entram já aprovadas; duplicatas são reaproveitadas.
  const tagIds = new Set(d.tags);
  for (const nome of d.novasTags) {
    const { data: existente } = await supabase.rpc("buscar_tag_por_nome", { p_nome: nome });
    if (existente) {
      tagIds.add(existente);
      continue;
    }
    const { data: criada } = await supabase
      .from("tags")
      .insert({ nome_pt: nome, status: "aprovada", sugerida_por: usuario.id })
      .select("id")
      .single();
    if (criada) tagIds.add(criada.id);
  }

  const erro = await substituirVinculos(id, {
    categorias: d.categorias,
    tags: [...tagIds],
    valores: d.valores,
    compat: d.compat.map((c) => ({
      ...c,
      avaliado_por: usuario.id,
      avaliado_em: c.resultado === "nao_verificada" ? null : new Date().toISOString(),
    })),
    comandos: d.comandos.map((c) => ({
      ...c,
      verificado_em: c.verificacao === "nao_verificado" ? null : new Date().toISOString(),
    })),
  });
  if (erro) return { erro };

  const erroDescricao = await gravarDescricao(id, d.tipo, d.descricao, usuario.id, d.aprovacao === "aprovado");
  if (erroDescricao) return { erro: erroDescricao };

  if (manifesto?.ok) {
    const { data: ultimo } = await supabase
      .from("install_packages")
      .select("versao, manifesto")
      .eq("resource_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const igual = ultimo && JSON.stringify(ultimo.manifesto) === JSON.stringify(manifesto.manifesto);
    if (!igual) {
      const proxima = String((Number(ultimo?.versao) || 0) + 1);
      const { error } = await supabase.from("install_packages").insert({
        resource_id: id,
        versao: proxima,
        tipo: manifesto.manifesto.tipo,
        manifesto: manifesto.manifesto,
        aprovado_por: d.aprovacao === "aprovado" ? usuario.id : null,
        aprovado_em: d.aprovacao === "aprovado" ? new Date().toISOString() : null,
      });
      if (error) return { erro: `Pacote não salvo: ${error.message}` };
    } else if (d.aprovacao === "aprovado") {
      await supabase
        .from("install_packages")
        .update({ aprovado_por: usuario.id, aprovado_em: new Date().toISOString() })
        .eq("resource_id", id)
        .eq("versao", ultimo!.versao)
        .is("aprovado_em", null);
    }
  }

  revalidatePath("/", "layout");
  redirect(`/recursos/${id}?salvo=1`);
}

async function substituirVinculos(
  id: string,
  v: {
    categorias: { id: string; papel: "principal" | "secundaria" }[];
    tags: string[];
    valores: string[];
    compat: {
      environment_id: number;
      resultado: "comprovada" | "declarada_na_fonte" | "nao_verificada" | "incompativel" | "nao_se_aplica";
      status_instalacao: "instalado" | "requer_configuracao" | "desconhecido";
      fonte_url: string | null;
      notas: string | null;
      avaliado_por: string;
      avaliado_em: string | null;
    }[];
    comandos: {
      environment_id: number;
      acionamento: "mencao_app" | "comando_barra" | "cli" | "link_instalacao" | "manual";
      comando: string;
      exemplo_completo: string | null;
      verificacao: "verificado" | "encontrado_na_doc" | "nao_verificado";
      fonte_url: string | null;
      verificado_em: string | null;
    }[];
  },
): Promise<string | undefined> {
  const supabase = await createClient();
  const ops = [
    ["resource_categories", v.categorias.map((c) => ({ resource_id: id, category_id: c.id, papel: c.papel }))],
    ["resource_tags", v.tags.map((t) => ({ resource_id: id, tag_id: t }))],
    ["resource_facet_values", v.valores.map((f) => ({ resource_id: id, facet_value_id: f }))],
    ["resource_compatibility", v.compat.map((c) => ({ resource_id: id, ...c }))],
    ["resource_commands", v.comandos.map((c) => ({ resource_id: id, ...c }))],
  ] as const;

  for (const [tabela, linhas] of ops) {
    const { error: e1 } = await supabase.from(tabela).delete().eq("resource_id", id);
    if (e1) return `Erro ao atualizar ${tabela}: ${e1.message}`;
    if (linhas.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: e2 } = await supabase.from(tabela).insert(linhas as any);
      if (e2) return `Erro ao gravar ${tabela}: ${e2.message}`;
    }
  }
}

/** Cada alteração da ficha vira uma nova versão; a anterior fica guardada como "substituída". */
async function gravarDescricao(
  id: string,
  tipo: string,
  desc: z.infer<typeof dadosRecursoSchema>["descricao"],
  usuarioId: string,
  aprovar: boolean,
): Promise<string | undefined> {
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("resources")
    .select("current_description_id, resource_descriptions!resources_current_description_fk(*)")
    .eq("id", id)
    .single();
  const atual = r?.resource_descriptions;
  const mudou =
    !atual ||
    atual.resumo !== (desc.resumo || null) ||
    atual.o_que_faz !== (desc.o_que_faz || null) ||
    atual.para_que_serve !== (desc.para_que_serve || null) ||
    JSON.stringify(atual.campos) !== JSON.stringify(desc.campos);

  if (!mudou) {
    if (aprovar && atual && atual.status !== "aprovada") {
      await supabase
        .from("resource_descriptions")
        .update({ status: "aprovada", aprovado_por: usuarioId, aprovado_em: new Date().toISOString() })
        .eq("id", atual.id);
    }
    return;
  }

  const { data: max } = await supabase
    .from("resource_descriptions")
    .select("versao")
    .eq("resource_id", id)
    .order("versao", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: nova, error } = await supabase
    .from("resource_descriptions")
    .insert({
      resource_id: id,
      versao: (max?.versao ?? 0) + 1,
      derived_from_id: atual?.id ?? null,
      resumo: desc.resumo || null,
      o_que_faz: desc.o_que_faz || null,
      para_que_serve: desc.para_que_serve || null,
      campos: desc.campos,
      campos_ausentes: camposAusentes(tipo, desc.campos),
      gerado_por: "manual",
      status: aprovar ? "aprovada" : "rascunho",
      aprovado_por: aprovar ? usuarioId : null,
      aprovado_em: aprovar ? new Date().toISOString() : null,
      created_by: usuarioId,
    })
    .select("id")
    .single();
  if (error || !nova) return `Ficha não salva: ${error?.message}`;

  if (atual) await supabase.from("resource_descriptions").update({ status: "substituida" }).eq("id", atual.id);
  await supabase.from("resources").update({ current_description_id: nova.id }).eq("id", id);
}

export async function duplicarRecurso(id: string) {
  await exigirAdmin();
  const supabase = await createClient();
  const { data: r } = await supabase.from("resources").select("titulo").eq("id", id).single();
  if (!r) throw new Error("Recurso não encontrado.");
  const { data: novo, error } = await supabase.rpc("salvar_como", { p_resource_id: id, p_novo_titulo: `${r.titulo} (cópia)` });
  if (error || !novo) throw new Error(error?.message ?? "Falha ao duplicar.");
  revalidatePath("/", "layout");
  redirect(`/recursos/${novo}/editar`);
}

export async function excluirRecurso(id: string) {
  const usuario = await exigirAdmin();
  const supabase = await createClient();
  await supabase.from("resources").update({ deleted_at: new Date().toISOString(), deleted_by: usuario.id }).eq("id", id);
  revalidatePath("/", "layout");
  redirect("/recursos?excluido=1");
}

export async function restaurarRecurso(id: string) {
  await exigirAdmin();
  const supabase = await createClient();
  await supabase.from("resources").update({ deleted_at: null, deleted_by: null }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function esvaziarLixeira() {
  await exigirAdmin();
  const supabase = await createClient();
  const { data: dias } = await supabase.from("app_settings").select("valor").eq("chave", "lixeira").single();
  const retencao = Number((dias?.valor as { dias_retencao?: number } | null)?.dias_retencao ?? 30);
  await supabase.rpc("esvaziar_lixeira", { p_dias: retencao });
  revalidatePath("/lixeira");
}

export async function alternarFavorito(id: string, marcar: boolean) {
  const usuario = await exigirUsuario();
  const supabase = await createClient();
  if (marcar) await supabase.from("favorites").upsert({ user_id: usuario.id, resource_id: id });
  else await supabase.from("favorites").delete().eq("user_id", usuario.id).eq("resource_id", id);
  revalidatePath("/", "layout");
}

export async function restaurarDescricao(resourceId: string, descricaoId: string) {
  await exigirAdmin();
  const supabase = await createClient();
  const { data: atual } = await supabase.from("resources").select("current_description_id").eq("id", resourceId).single();
  await supabase.from("resource_descriptions").update({ status: "aprovada" }).eq("id", descricaoId).eq("resource_id", resourceId);
  if (atual?.current_description_id && atual.current_description_id !== descricaoId) {
    await supabase.from("resource_descriptions").update({ status: "substituida" }).eq("id", atual.current_description_id);
  }
  await supabase.from("resources").update({ current_description_id: descricaoId }).eq("id", resourceId);
  revalidatePath(`/recursos/${resourceId}`);
}
