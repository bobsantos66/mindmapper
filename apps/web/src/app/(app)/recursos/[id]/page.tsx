import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  CAMPOS_FICHA,
  ROTULO_ESTADO,
  ROTULO_GRUPO,
  camposDoTipo,
  completude,
  descreverMudancas,
  regraExibicao,
  validarManifesto,
  type GrupoFicha,
} from "@mindmapper/core";
import { BotaoCopiar } from "@/components/botao-copiar";
import { BotaoFavorito } from "@/components/botao-favorito";
import { ComandoPronto } from "@/components/comando-pronto";
import { BotaoLink, ROTULO_COMPAT, Selo, SeloExemplo, classeBotao } from "@/components/ui";
import { getUsuario } from "@/lib/auth";
import { obterRecurso } from "@/lib/dados";
import { dataCurta } from "@/lib/texto";
import { duplicarRecurso, excluirRecurso } from "@/server/recursos";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = await obterRecurso((await params).id);
  return { title: r?.titulo ?? "Recurso" };
}

const ROTULO_ACIONAMENTO: Record<string, string> = {
  mencao_app: "Menção de app",
  comando_barra: "Comando de barra",
  cli: "Terminal",
  link_instalacao: "Link de instalação",
  manual: "Manual",
};

const ROTULO_VERIFICACAO: Record<string, { texto: string; tom: "ok" | "neutro" | "aviso" }> = {
  verificado: { texto: "verificado", tom: "ok" },
  encontrado_na_doc: { texto: "encontrado na documentação", tom: "neutro" },
  nao_verificado: { texto: "não verificado", tom: "aviso" },
};

export default async function PaginaRecurso({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string }>;
}) {
  const [{ id }, { salvo }, usuario] = await Promise.all([params, searchParams, getUsuario()]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const r = await obterRecurso(id);
  if (!r) notFound();

  const admin = usuario?.papel === "admin";
  const tipoSlug = r.resource_types?.slug ?? "";
  const desc = r.descricao;
  const campos = r.campos;
  const { preenchidos, total } = completude(tipoSlug, campos, [desc?.resumo, desc?.o_que_faz, desc?.para_que_serve]);

  const categoriasRaiz = r.resource_categories.filter((c) => !c.categories?.parent_id);
  const subcategorias = r.resource_categories.filter((c) => c.categories?.parent_id);
  const principal = categoriasRaiz.find((c) => c.papel === "principal") ?? categoriasRaiz[0];

  const pacote = [...(r.install_packages ?? [])]
    .filter((p) => p.aprovado_em)
    .sort((a, b) => Number(b.versao) - Number(a.versao))[0];
  const manifesto = pacote ? validarManifesto(pacote.manifesto) : null;
  const nomeInstalacao = r.slug;

  const comandos = r.resource_commands.map((c) => ({
    ...c,
    regra: regraExibicao({
      acionamento: c.acionamento,
      comando: c.comando,
      verificacao: c.verificacao,
      plataformaSlug: c.platform_environments?.platforms?.slug ?? "",
      ambienteSlug: c.platform_environments?.slug ?? "",
    }),
  }));
  const temChatGPT = r.resource_compatibility.some(
    (c) => c.platform_environments?.platforms?.slug === "chatgpt" && !["incompativel", "nao_se_aplica"].includes(c.resultado),
  );

  const grupos: GrupoFicha[] = ["descricao", "utilizacao", "requisitos"];
  const aplicaveis = new Set(camposDoTipo(tipoSlug).map((c) => c.chave));

  return (
    <article className="flex flex-col gap-10">
      {salvo && (
        <p role="status" className="rounded-xl bg-destaque px-4 py-3 text-sm font-semibold text-sobre-destaque">
          Recurso salvo.
        </p>
      )}
      {r.deleted_at && (
        <p role="status" className="rounded-xl border border-perigo px-4 py-3 text-sm text-perigo">
          Este recurso está na lixeira desde {dataCurta(r.deleted_at)}.
        </p>
      )}

      {/* Identificação */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Selo>{r.resource_types?.nome}</Selo>
          {r.is_sample && <SeloExemplo />}
          {r.aprovacao !== "aprovado" && <Selo tom="aviso">{r.aprovacao === "rascunho" ? "rascunho" : "em revisão"}</Selo>}
          {principal && (
            <Selo tom="suave">
              {principal.categories?.nome}
              {subcategorias.length > 0 && ` › ${subcategorias.map((s) => s.categories?.nome).join(" · ")}`}
            </Selo>
          )}
          {r.resource_compatibility.map((c) => (
            <Selo key={c.id} tom={ROTULO_COMPAT[c.resultado]?.tom}>
              {c.platform_environments?.nome} · {ROTULO_COMPAT[c.resultado]?.texto}
            </Selo>
          ))}
        </div>
        <h1 className="text-4xl leading-none font-bold tracking-[-0.04em] break-words sm:text-5xl">{r.titulo}</h1>
        <p className="max-w-[68ch] text-lg leading-relaxed text-suave">{desc?.resumo ?? "Sem resumo funcional ainda."}</p>
        <div className="flex flex-wrap gap-2">
          <BotaoFavorito id={r.id} inicial={r.favorito} />
          {r.link_oficial && (
            <a href={r.link_oficial} target="_blank" rel="noopener noreferrer nofollow" className={classeBotao("secundario")}>
              Documentação oficial ↗
            </a>
          )}
          {admin && (
            <>
              <BotaoLink href={`/recursos/${r.id}/editar`}>Editar</BotaoLink>
              <form action={duplicarRecurso.bind(null, r.id)}>
                <button className={classeBotao("secundario")}>Duplicar</button>
              </form>
              <BotaoLink href={`/recursos/${r.id}/historico`} variante="fantasma">
                Histórico
              </BotaoLink>
              {!r.deleted_at && (
                <form action={excluirRecurso.bind(null, r.id)}>
                  <button className={classeBotao("perigo")}>Mover para a lixeira</button>
                </form>
              )}
            </>
          )}
        </div>
        <div className="flex max-w-sm flex-col gap-2">
          <p className="text-sm">
            <span className="text-2xl font-bold tracking-[-0.03em]">{preenchidos}</span>
            <span className="text-suave"> de {total} campos da ficha preenchidos</span>
          </p>
          <div className="h-1.5 rounded-full bg-painel" aria-hidden="true">
            <div className="h-1.5 rounded-full bg-destaque" style={{ width: `${total ? Math.round((preenchidos / total) * 100) : 0}%` }} />
          </div>
        </div>
      </header>

      {/* O essencial */}
      <section className="grid gap-4 md:grid-cols-2">
        <Bloco titulo="O que faz?">{desc?.o_que_faz ?? <Ausente />}</Bloco>
        <Bloco titulo="Para que serve?">{desc?.para_que_serve ?? <Ausente />}</Bloco>
      </section>

      {/* Uso */}
      {(comandos.length > 0 || manifesto?.ok || temChatGPT || r.instalacao_md) && (
        <Secao titulo="Como usar">
          {manifesto?.ok && (
            <div className="flex flex-col gap-3 rounded-cartao border border-texto p-5">
              <h3 className="font-semibold">Instalar no Claude Code</h3>
              <p className="text-sm text-suave">
                Rode no terminal do computador onde você usa o Claude Code. O MindMapper Local mostra o que vai mudar e pede
                confirmação antes de instalar.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-lg bg-painel px-3 py-2.5 font-mono text-sm">mm instalar {nomeInstalacao}</code>
                <BotaoCopiar texto={`mm instalar ${nomeInstalacao}`} rotulo="Copiar comando" variante="primario" />
              </div>
              <ul className="list-disc pl-5 font-mono text-xs text-suave">
                {descreverMudancas(manifesto.manifesto).map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}

          {comandos.map((c) =>
            c.regra.mostrar ? (
              <div key={c.id} className="flex flex-col gap-2 rounded-cartao border border-linha p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Selo>{c.platform_environments?.nome}</Selo>
                  <Selo tom="suave">{ROTULO_ACIONAMENTO[c.acionamento]}</Selo>
                  <Selo tom={ROTULO_VERIFICACAO[c.verificacao]?.tom}>{ROTULO_VERIFICACAO[c.verificacao]?.texto}</Selo>
                  {c.fonte_url && (
                    <a href={c.fonte_url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs underline">
                      fonte
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded-lg bg-painel px-3 py-2.5 font-mono text-sm">{c.comando}</code>
                  <BotaoCopiar texto={c.comando} />
                </div>
                {c.exemplo_completo && (
                  <pre className="overflow-auto rounded-lg bg-painel p-3 font-mono text-xs whitespace-pre-wrap">{c.exemplo_completo}</pre>
                )}
              </div>
            ) : admin ? (
              <p key={c.id} className="text-xs text-suave">
                Comando “{c.comando}” oculto: {c.regra.motivo}
              </p>
            ) : null,
          )}

          {temChatGPT && (
            <div className="flex flex-col gap-2 rounded-cartao border border-linha p-5 text-sm">
              <h3 className="font-semibold">No ChatGPT</h3>
              <p className="text-suave">
                O ChatGPT não permite instalação de fora. Copie o prompt abaixo, ou abra a documentação oficial e siga o passo a
                passo.
              </p>
            </div>
          )}

          {r.instalacao_md && (
            <Bloco titulo="Procedimento de instalação">
              <pre className="font-sans text-sm whitespace-pre-wrap">{r.instalacao_md}</pre>
            </Bloco>
          )}
        </Secao>
      )}

      {r.conteudo.trim() !== "" && (
        <Secao titulo="Comando ou prompt completo">
          <ComandoPronto texto={r.conteudo} />
        </Secao>
      )}

      {/* Ficha completa */}
      {grupos.map((g) => {
        const defs = CAMPOS_FICHA.filter((c) => c.grupo === g && aplicaveis.has(c.chave));
        const preenchidosGrupo = defs.filter((d) => campos[d.chave]?.valor && campos[d.chave]?.estado !== "ausente");
        const ausentes = defs.filter(
          (d) => campos[d.chave]?.estado !== "nao_se_aplica" && !preenchidosGrupo.includes(d),
        );
        return (
          <Secao key={g} titulo={ROTULO_GRUPO[g]}>
            {preenchidosGrupo.length === 0 ? (
              <p className="text-sm text-suave">Nenhuma informação com fonte neste grupo ainda.</p>
            ) : (
              <dl className="grid gap-5 md:grid-cols-2">
                {preenchidosGrupo.map((d) => {
                  const v = campos[d.chave]!;
                  return (
                    <div key={d.chave} className="flex min-w-0 flex-col gap-1">
                      <dt className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {d.rotulo}
                        <Selo tom={v.estado === "verificado" ? "ok" : "aviso"}>{ROTULO_ESTADO[v.estado]}</Selo>
                      </dt>
                      <dd className="text-sm whitespace-pre-wrap">{v.valor}</dd>
                      {v.fontes.length > 0 && (
                        <dd className="text-xs text-suave">
                          Fonte:{" "}
                          {v.fontes.map((f, i) =>
                            f.url ? (
                              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                                {f.documento ?? f.url}
                              </a>
                            ) : (
                              <span key={i}>{f.documento ?? f.trecho}</span>
                            ),
                          )}
                        </dd>
                      )}
                    </div>
                  );
                })}
              </dl>
            )}
            {ausentes.length > 0 && (
              <p className="text-xs text-suave italic">
                Informação ausente na fonte: {ausentes.map((a) => a.rotulo.toLowerCase()).join(", ")}
              </p>
            )}
          </Secao>
        );
      })}

      <Secao titulo="Classificação">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Item rotulo="Categoria principal">{principal?.categories?.nome ?? "—"}</Item>
          <Item rotulo="Subcategorias">{subcategorias.map((s) => s.categories?.nome).join(", ") || "—"}</Item>
          <Item rotulo="Categorias secundárias">
            {categoriasRaiz
              .filter((c) => c !== principal)
              .map((c) => c.categories?.nome)
              .join(", ") || "—"}
          </Item>
          <Item rotulo="Tipo de atividade">{r.activity_types?.nome ?? "—"}</Item>
          <Item rotulo="Tags">
            {r.resource_tags.length === 0
              ? "—"
              : r.resource_tags.map((t) => (
                  <Link key={t.tag_id} href={`/recursos?tag=${t.tag_id}`} className="mr-2 underline-offset-4 hover:underline">
                    #{t.tags?.nome_pt}
                  </Link>
                ))}
          </Item>
          <Item rotulo="Filtros">
            {r.resource_facet_values.map((f) => `${f.facet_values?.facets?.nome}: ${f.facet_values?.valor_pt}`).join(" · ") || "—"}
          </Item>
        </dl>
      </Secao>

      <Secao titulo="Controle e origem">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <Item rotulo="ID">
            <span className="font-mono text-xs break-all">{r.id}</span>
          </Item>
          <Item rotulo="Versão da skill">{r.versao_recurso ?? "—"}</Item>
          <Item rotulo="Autor">{r.autor ?? "—"}</Item>
          <Item rotulo="Status de aprovação">{r.aprovacao}</Item>
          <Item rotulo="Versão do registro">{r.version}</Item>
          <Item rotulo="Atualizado em">{dataCurta(r.updated_at)}</Item>
          <Item rotulo="Importado em">{dataCurta(r.importado_em)}</Item>
          <Item rotulo="Última verificação">{dataCurta(r.verificado_em)}</Item>
          <Item rotulo="Derivado de">
            {r.origem ? (
              <Link href={`/recursos/${r.origem.id}`} className="underline">
                {r.origem.titulo}
              </Link>
            ) : (
              "—"
            )}
          </Item>
          <Item rotulo="Ficha gerada por">{desc ? `${desc.gerado_por} · versão ${desc.versao}` : "—"}</Item>
          <Item rotulo="Arquivo de origem">{r.lote_importacao ?? "—"}</Item>
        </dl>
      </Secao>
    </article>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-cartao border border-linha bg-cartao p-5 sm:p-6">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-suave uppercase">{titulo}</h2>
      {children}
    </section>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-cartao border border-linha bg-cartao p-5 sm:p-6">
      <h2 className="text-xs font-semibold tracking-[0.08em] text-suave uppercase">{titulo}</h2>
      <div className="max-w-[68ch] leading-relaxed whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function Item({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-suave">{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Ausente() {
  return <span className="text-sm text-suave italic">Informação ausente na fonte</span>;
}
