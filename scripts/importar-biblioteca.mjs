// Importa um arquivo JSON de biblioteca (formato "MindMapper Skills Library") como itens em revisão.
// Uso:
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/importar-biblioteca.mjs <arquivo.json> <mapa.json> [--simular]
//
// Regras:
// - O registro original vai inteiro para resources.dados_originais; nada dele é reescrito.
// - Tudo entra como "em revisão": convidados não veem nada até o admin aprovar.
// - Tags novas entram como "sugerida". Compatibilidade fica "não verificada" (o arquivo não traz link de fonte).
// - O atalho "/nome:" não vira comando: não é comando nativo do ChatGPT nem do Claude.
// - Rodar de novo não duplica: itens do mesmo arquivo com o mesmo id são pulados.
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createClient } from "@supabase/supabase-js";

const [arquivo, arquivoMapa] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const simular = process.argv.includes("--simular");
const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!arquivo || !arquivoMapa || !chave) {
  console.error("Uso: SUPABASE_SERVICE_ROLE_KEY=... node scripts/importar-biblioteca.mjs <arquivo.json> <mapa.json> [--simular]");
  process.exit(1);
}

const biblioteca = JSON.parse(readFileSync(arquivo, "utf8"));
const mapa = JSON.parse(readFileSync(arquivoMapa, "utf8"));
const registros = biblioteca.registros ?? [];
const lote = basename(arquivo);
const sb = createClient(url, chave, { auth: { persistSession: false } });

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function unico(q) {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

const [tipos, cats, ambientes, admins] = await Promise.all([
  unico(sb.from("resource_types").select("id, slug")),
  unico(sb.from("categories").select("id, slug, parent_id").eq("status", "ativa")),
  unico(sb.from("platform_environments").select("id, slug")),
  unico(sb.from("profiles").select("id").eq("papel", "admin").limit(1)),
]);
const raizes = new Map(cats.filter((c) => !c.parent_id).map((c) => [c.slug, c]));
const subId = (cat, sub) => cats.find((c) => c.parent_id === raizes.get(cat)?.id && c.slug === sub)?.id;
const ambiente = (slug) => ambientes.find((a) => a.slug === slugify(slug))?.id;
const AMBIENTES_POR_PLATAFORMA = { chatgpt: ["chatgpt"], claude: ["claude-ai"] };
const adminId = admins[0]?.id ?? null;

const jaImportados = new Set(
  (await unico(sb.from("resources").select("dados_originais").eq("lote_importacao", lote))).map((r) => r.dados_originais?.id),
);
const slugsUsados = new Set((await unico(sb.from("resources").select("slug"))).map((r) => r.slug));
const nomesCategoriasOrigem = new Set(registros.map((r) => r.categoria));
const cacheTags = new Map();

async function tagId(nome) {
  const chaveTag = slugify(nome);
  if (cacheTags.has(chaveTag)) return cacheTags.get(chaveTag);
  let id = (await sb.rpc("buscar_tag_por_nome", { p_nome: nome })).data;
  if (!id && !simular) {
    id = (await unico(sb.from("tags").insert({ nome_pt: nome, status: "sugerida", sugerida_por: adminId }).select("id").single())).id;
  }
  cacheTags.set(chaveTag, id);
  return id;
}

const CAMPOS_AUSENTES = [
  "para_que_serve", "principais_funcionalidades", "exemplos", "entradas", "resultados", "limitacoes",
  "exemplo_comando", "conta_assinatura", "custos", "ferramentas_adicionais",
];

const relatorio = [];
for (const r of registros) {
  if (jaImportados.has(r.id)) {
    relatorio.push({ id: r.id, nome: r.nome, situacao: "já importado" });
    continue;
  }
  const destino = mapa.porItem?.[r.id] ?? mapa.grupos[`${r.categoria}>${r.subcategoria}`];
  if (!destino || !raizes.has(destino.cat)) throw new Error(`Sem mapeamento para ${r.id} (${r.categoria} > ${r.subcategoria}).`);

  let slug = slugify(r.nome) || r.id;
  if (slugsUsados.has(slug)) slug = `${slug}-${slugify(r.tipo)}`;
  if (slugsUsados.has(slug)) slug = `${slug}-${r.id}`;
  slugsUsados.add(slug);

  const ligacoes = [{ id: raizes.get(destino.cat).id, papel: "principal" }];
  if (destino.sub) ligacoes.push({ id: subId(destino.cat, destino.sub), papel: "secundaria" });
  for (const s of destino.sec ?? []) {
    const [c, sub] = s.split("/");
    ligacoes.push({ id: raizes.get(c).id, papel: "secundaria" }, { id: subId(c, sub), papel: "secundaria" });
  }
  const categorias = [...new Map(ligacoes.filter((l) => l.id).map((l) => [l.id, l])).values()];
  // A categoria antiga do arquivo não vira tag: ela já está guardada no original.
  const tags = (r.tags ?? []).filter((t) => !nomesCategoriasOrigem.has(t));
  const plataformas = (r.plataforma ?? "").split(",").map((p) => slugify(p)).filter(Boolean);

  relatorio.push({
    id: r.id,
    nome: r.nome,
    slug,
    origem: `${r.categoria} > ${r.subcategoria}`,
    destino: categorias.map((c) => cats.find((x) => x.id === c.id).slug).join(", "),
    tags: tags.join(", "),
    situacao: simular ? "simulado" : "importado",
  });
  if (simular) continue;

  const tipo = tipos.find((t) => t.slug === slugify(r.tipo));
  if (!tipo) throw new Error(`Tipo desconhecido em ${r.id}: ${r.tipo}`);

  const recurso = await unico(
    sb
      .from("resources")
      .insert({
        titulo: r.nome,
        slug,
        type_id: tipo.id,
        conteudo: r.comando_uso ?? "",
        instalacao_md: r.instalacao || null,
        link_oficial: r.origem_url || null,
        aprovacao: "em_revisao",
        owner_id: adminId,
        importado_em: new Date().toISOString(),
        dados_originais: r,
        lote_importacao: lote,
      })
      .select("id")
      .single(),
  );

  const descricao = await unico(
    sb
      .from("resource_descriptions")
      .insert({
        resource_id: recurso.id,
        versao: 1,
        resumo: (r.descricao_funcional ?? "").slice(0, 200) || null,
        o_que_faz: r.descricao_funcional || null,
        campos: {
          como_utilizar: {
            valor: r.instalacao || null,
            origem: "importado",
            estado: "nao_verificado",
            fontes: [{ documento: `${lote} (${r.arquivo_origem ?? "sem arquivo de origem"})` }],
          },
        },
        // O arquivo só traz uma frase por item: o resto da ficha fica marcado como ausente, sem inventar.
        campos_ausentes: CAMPOS_AUSENTES,
        gerado_por: "importado",
        status: "rascunho",
        created_by: adminId,
      })
      .select("id")
      .single(),
  );
  await unico(sb.from("resources").update({ current_description_id: descricao.id }).eq("id", recurso.id));

  await unico(sb.from("resource_categories").insert(categorias.map((c) => ({ resource_id: recurso.id, category_id: c.id, papel: c.papel }))));

  const ids = [...new Set((await Promise.all(tags.map(tagId))).filter(Boolean))];
  if (ids.length) {
    await unico(sb.from("resource_tags").insert(ids.map((tag_id) => ({ resource_id: recurso.id, tag_id, origem: "importado" }))));
  }

  const envs = plataformas.flatMap((p) => AMBIENTES_POR_PLATAFORMA[p] ?? []).map(ambiente).filter(Boolean);
  if (envs.length) {
    await unico(
      sb.from("resource_compatibility").insert(
        envs.map((environment_id) => ({
          resource_id: recurso.id,
          environment_id,
          resultado: "nao_verificada",
          notas: `Plataforma declarada no arquivo de origem (${r.plataforma}), sem link de fonte.`,
        })),
      ),
    );
  }
}

const contagem = relatorio.reduce((a, x) => ((a[x.situacao] = (a[x.situacao] ?? 0) + 1), a), {});
console.log(JSON.stringify({ lote, contagem, itens: relatorio }, null, 2));
