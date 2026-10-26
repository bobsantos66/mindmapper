"use client";

import { useActionState, useMemo, useState } from "react";
import {
  CAMPOS_FICHA,
  ESTADOS_CAMPO,
  RESUMO_MAX,
  ROTULO_ESTADO,
  ROTULO_GRUPO,
  camposDoTipo,
  validarManifesto,
  type Campos,
  type EstadoCampo,
  type GrupoFicha,
} from "@mindmapper/core";
import { salvarRecurso, type DadosRecurso, type EstadoSalvar } from "@/server/recursos";
import { Botao, Rotulo, classeCampo } from "./ui";

export interface OpcoesForm {
  tipos: { slug: string; nome: string }[];
  atividades: { slug: string; nome: string }[];
  categorias: { id: string; nome: string; filhas: { id: string; nome: string }[] }[];
  tags: { id: string; nome_pt: string }[];
  facetas: { id: string; nome: string; category_id: string | null; valores: { id: string; valor_pt: string }[] }[];
  ambientes: { id: number; nome: string; plataformaSlug: string }[];
}

export type InicialForm = Omit<DadosRecurso, "modo">;

const RESULTADOS = [
  ["nao_verificada", "A verificar"],
  ["declarada_na_fonte", "Declarada na fonte"],
  ["comprovada", "Comprovada"],
  ["incompativel", "Incompatível"],
  ["nao_se_aplica", "Não se aplica"],
] as const;

const ACIONAMENTOS = [
  ["comando_barra", "Comando de barra (/nome) · Claude"],
  ["mencao_app", "Menção de app (@Nome) · ChatGPT"],
  ["cli", "Terminal"],
  ["link_instalacao", "Link de instalação"],
  ["manual", "Manual"],
] as const;

const EXEMPLO_PACOTE = `{
  "tipo": "skill",
  "nome": "minha-skill",
  "arquivos": { "SKILL.md": "---\\nname: minha-skill\\ndescription: ...\\n---\\n" }
}`;

export function FormRecurso({ opcoes, inicial, cancelarHref }: { opcoes: OpcoesForm; inicial: InicialForm; cancelarHref: string }) {
  const [estado, acao, pendente] = useActionState<EstadoSalvar, FormData>(salvarRecurso, {});
  const [d, setD] = useState<InicialForm>(inicial);
  const [novaTag, setNovaTag] = useState("");
  const [modo, setModo] = useState<"salvar" | "salvar_como">("salvar");

  const set = <K extends keyof InicialForm>(k: K, v: InicialForm[K]) => setD((x) => ({ ...x, [k]: v }));
  const setDesc = (k: "resumo" | "o_que_faz" | "para_que_serve", v: string) =>
    setD((x) => ({ ...x, descricao: { ...x.descricao, [k]: v } }));
  const setCampo = (chave: string, parcial: Partial<Campos[string]>) =>
    setD((x) => {
      const atual = x.descricao.campos[chave] ?? { valor: null, origem: "manual" as const, estado: "nao_verificado" as const, fontes: [] };
      return { ...x, descricao: { ...x.descricao, campos: { ...x.descricao.campos, [chave]: { ...atual, ...parcial } } } };
    });

  const aplicaveis = useMemo(() => new Set(camposDoTipo(d.tipo).map((c) => c.chave)), [d.tipo]);
  const catIds = new Set(d.categorias.map((c) => c.id));
  const principal = d.categorias.find((c) => c.papel === "principal")?.id ?? "";
  const facetasVisiveis = opcoes.facetas.filter((f) => !f.category_id || catIds.has(f.category_id));
  const pacoteStatus = useMemo(() => {
    if (!d.pacote?.trim()) return null;
    try {
      const r = validarManifesto(JSON.parse(d.pacote));
      return r.ok ? { ok: true, texto: `Pacote válido (${r.manifesto.tipo}).` } : { ok: false, texto: r.erro };
    } catch {
      return { ok: false, texto: "JSON inválido." };
    }
  }, [d.pacote]);

  function alternarCategoria(id: string) {
    setD((x) =>
      catIds.has(id)
        ? { ...x, categorias: x.categorias.filter((c) => c.id !== id) }
        : { ...x, categorias: [...x.categorias, { id, papel: "secundaria" }] },
    );
  }
  function definirPrincipal(id: string) {
    setD((x) => {
      const semPrincipal = x.categorias.map((c) => ({ ...c, papel: "secundaria" as const }));
      if (!id) return { ...x, categorias: semPrincipal };
      const ja = semPrincipal.some((c) => c.id === id);
      return {
        ...x,
        categorias: ja
          ? semPrincipal.map((c) => (c.id === id ? { ...c, papel: "principal" as const } : c))
          : [...semPrincipal, { id, papel: "principal" as const }],
      };
    });
  }

  const json = JSON.stringify(d);

  return (
    <form action={acao} className="flex flex-col gap-10">
      <input type="hidden" name="dados" value={json} />

      <Grupo titulo="1. Identificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="titulo" rotulo="Nome">
            <input id="titulo" required className={classeCampo} value={d.titulo} onChange={(e) => set("titulo", e.target.value)} />
          </Campo>
          <Campo id="tipo" rotulo="Tipo de recurso">
            <select id="tipo" className={classeCampo} value={d.tipo} onChange={(e) => set("tipo", e.target.value)}>
              {opcoes.tipos.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="versao" rotulo="Versão">
            <input id="versao" className={classeCampo} value={d.versao_recurso ?? ""} onChange={(e) => set("versao_recurso", e.target.value)} />
          </Campo>
          <Campo id="autor" rotulo="Autor ou desenvolvedor">
            <input id="autor" className={classeCampo} value={d.autor ?? ""} onChange={(e) => set("autor", e.target.value)} />
          </Campo>
        </div>
        <Campo id="resumo" rotulo={`Resumo para a busca (${d.descricao.resumo.length}/${RESUMO_MAX})`}>
          <input
            id="resumo"
            maxLength={RESUMO_MAX}
            className={classeCampo}
            value={d.descricao.resumo}
            onChange={(e) => setDesc("resumo", e.target.value)}
          />
        </Campo>
      </Grupo>

      <Grupo titulo="2. Descrição funcional">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="o_que_faz" rotulo="O que faz?">
            <textarea id="o_que_faz" rows={4} className={classeCampo} value={d.descricao.o_que_faz} onChange={(e) => setDesc("o_que_faz", e.target.value)} />
          </Campo>
          <Campo id="para_que_serve" rotulo="Para que serve?">
            <textarea
              id="para_que_serve"
              rows={4}
              className={classeCampo}
              value={d.descricao.para_que_serve}
              onChange={(e) => setDesc("para_que_serve", e.target.value)}
            />
          </Campo>
        </div>
        <CamposGrupo grupo="descricao" campos={d.descricao.campos as Campos} aplicaveis={aplicaveis} setCampo={setCampo} />
      </Grupo>

      <Grupo titulo="3. Utilização">
        <Campo id="conteudo" rotulo="Comando ou prompt completo (use {{parametro}} para campos editáveis)">
          <textarea id="conteudo" rows={8} className={`${classeCampo} font-mono`} value={d.conteudo} onChange={(e) => set("conteudo", e.target.value)} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="link" rotulo="Link de documentação oficial">
            <input id="link" type="url" className={classeCampo} value={d.link_oficial ?? ""} onChange={(e) => set("link_oficial", e.target.value)} />
          </Campo>
          <Campo id="instalacao" rotulo="Procedimento de instalação">
            <textarea id="instalacao" rows={3} className={classeCampo} value={d.instalacao_md ?? ""} onChange={(e) => set("instalacao_md", e.target.value)} />
          </Campo>
        </div>
        <CamposGrupo grupo="utilizacao" campos={d.descricao.campos as Campos} aplicaveis={aplicaveis} setCampo={setCampo} />

        <div className="flex flex-col gap-3">
          <Rotulo>Comandos por ambiente</Rotulo>
          <p className="text-xs text-suave">
            @Nome só aparece no ChatGPT e /comando só no Claude. Comando marcado como verificado exige link da fonte.
          </p>
          {d.comandos.map((c, i) => (
            <div key={i} className="grid gap-2 border border-linha p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <select
                aria-label="Ambiente"
                className={classeCampo}
                value={c.environment_id}
                onChange={(e) => set("comandos", d.comandos.map((x, j) => (j === i ? { ...x, environment_id: Number(e.target.value) } : x)))}
              >
                {opcoes.ambientes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
              <select
                aria-label="Forma de acionamento"
                className={classeCampo}
                value={c.acionamento}
                onChange={(e) =>
                  set("comandos", d.comandos.map((x, j) => (j === i ? { ...x, acionamento: e.target.value as typeof c.acionamento } : x)))
                }
              >
                {ACIONAMENTOS.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                aria-label="Comando"
                placeholder="/nome ou @Nome"
                className={`${classeCampo} font-mono`}
                value={c.comando}
                onChange={(e) => set("comandos", d.comandos.map((x, j) => (j === i ? { ...x, comando: e.target.value } : x)))}
              />
              <button type="button" className="text-sm text-perigo" onClick={() => set("comandos", d.comandos.filter((_, j) => j !== i))}>
                Remover
              </button>
              <select
                aria-label="Verificação"
                className={classeCampo}
                value={c.verificacao}
                onChange={(e) =>
                  set("comandos", d.comandos.map((x, j) => (j === i ? { ...x, verificacao: e.target.value as typeof c.verificacao } : x)))
                }
              >
                <option value="nao_verificado">Não verificado</option>
                <option value="encontrado_na_doc">Encontrado na documentação</option>
                <option value="verificado">Verificado</option>
              </select>
              <input
                aria-label="Link da fonte"
                placeholder="Link da fonte"
                type="url"
                className={`${classeCampo} sm:col-span-2`}
                value={c.fonte_url ?? ""}
                onChange={(e) => set("comandos", d.comandos.map((x, j) => (j === i ? { ...x, fonte_url: e.target.value } : x)))}
              />
            </div>
          ))}
          <div>
            <Botao
              type="button"
              onClick={() =>
                set("comandos", [
                  ...d.comandos,
                  { environment_id: opcoes.ambientes[0]?.id ?? 1, acionamento: "comando_barra", comando: "", exemplo_completo: "", verificacao: "nao_verificado", fonte_url: "" },
                ])
              }
            >
              Adicionar comando
            </Botao>
          </div>
        </div>

        <Campo id="pacote" rotulo="Pacote de instalação no Claude Code (JSON, opcional)">
          <textarea
            id="pacote"
            rows={6}
            placeholder={EXEMPLO_PACOTE}
            className={`${classeCampo} font-mono text-xs`}
            value={d.pacote ?? ""}
            onChange={(e) => set("pacote", e.target.value)}
          />
          {pacoteStatus && <p className={`text-xs ${pacoteStatus.ok ? "text-ok" : "text-perigo"}`}>{pacoteStatus.texto}</p>}
          <p className="text-xs text-suave">
            Tipos aceitos: skill, comando, plugin e mcp. Só pacotes de recursos aprovados podem ser instalados pelo MindMapper Local.
          </p>
        </Campo>
      </Grupo>

      <Grupo titulo="4. Requisitos">
        <CamposGrupo grupo="requisitos" campos={d.descricao.campos as Campos} aplicaveis={aplicaveis} setCampo={setCampo} />
      </Grupo>

      <Grupo titulo="5. Classificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="principal" rotulo="Categoria principal">
            <select id="principal" className={classeCampo} value={principal} onChange={(e) => definirPrincipal(e.target.value)}>
              <option value="">Escolha…</option>
              {opcoes.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="atividade" rotulo="Tipo de atividade">
            <select id="atividade" className={classeCampo} value={d.atividade ?? ""} onChange={(e) => set("atividade", e.target.value)}>
              <option value="">—</option>
              {opcoes.atividades.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[11px] uppercase tracking-wider text-suave">Categorias secundárias e subcategorias</legend>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {opcoes.categorias.map((c) => (
              <div key={c.id} className="flex flex-col gap-1">
                <Marcar marcado={catIds.has(c.id)} onChange={() => alternarCategoria(c.id)} desabilitado={c.id === principal}>
                  {c.nome}
                </Marcar>
                {catIds.has(c.id) &&
                  c.filhas.map((s) => (
                    <div key={s.id} className="ml-5">
                      <Marcar marcado={catIds.has(s.id)} onChange={() => alternarCategoria(s.id)}>
                        {s.nome}
                      </Marcar>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-mono text-[11px] uppercase tracking-wider text-suave">Tags</legend>
          <div className="flex flex-wrap gap-1.5">
            {opcoes.tags.map((t) => {
              const on = d.tags.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("tags", on ? d.tags.filter((x) => x !== t.id) : [...d.tags, t.id])}
                  className={`border px-2 py-0.5 text-xs ${on ? "border-destaque bg-destaque text-sobre-destaque" : "border-linha"}`}
                >
                  #{t.nome_pt}
                </button>
              );
            })}
            {d.novasTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("novasTags", d.novasTags.filter((x) => x !== t))}
                className="border border-dashed border-texto px-2 py-0.5 text-xs"
                title="Nova tag, clique para remover"
              >
                + {t} ×
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              aria-label="Nova tag"
              placeholder="Nova tag"
              className={`${classeCampo} max-w-xs`}
              value={novaTag}
              onChange={(e) => setNovaTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (novaTag.trim()) set("novasTags", [...new Set([...d.novasTags, novaTag.trim()])]);
                  setNovaTag("");
                }
              }}
            />
            <Botao
              type="button"
              onClick={() => {
                if (novaTag.trim()) set("novasTags", [...new Set([...d.novasTags, novaTag.trim()])]);
                setNovaTag("");
              }}
            >
              Adicionar
            </Botao>
          </div>
          <p className="text-xs text-suave">Se a tag já existir com outro nome ou sinônimo, a existente é reaproveitada.</p>
        </fieldset>

        {facetasVisiveis.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facetasVisiveis.map((f) => (
              <fieldset key={f.id} className="flex flex-col gap-1">
                <legend className="mb-1 font-mono text-[11px] uppercase tracking-wider text-suave">{f.nome}</legend>
                {f.valores.map((v) => (
                  <Marcar
                    key={v.id}
                    marcado={d.valores.includes(v.id)}
                    onChange={() => set("valores", d.valores.includes(v.id) ? d.valores.filter((x) => x !== v.id) : [...d.valores, v.id])}
                  >
                    {v.valor_pt}
                  </Marcar>
                ))}
              </fieldset>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Rotulo>Compatibilidade por ambiente</Rotulo>
          <p className="text-xs text-suave">“Comprovada” e “declarada na fonte” exigem o link da fonte.</p>
          {opcoes.ambientes.map((a) => {
            const c = d.compat.find((x) => x.environment_id === a.id);
            return (
              <div key={a.id} className="grid items-center gap-2 border border-linha p-3 sm:grid-cols-[10rem_1fr_1fr]">
                <span className="text-sm font-medium">{a.nome}</span>
                <select
                  aria-label={`Compatibilidade com ${a.nome}`}
                  className={classeCampo}
                  value={c?.resultado ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    const resto = d.compat.filter((x) => x.environment_id !== a.id);
                    set(
                      "compat",
                      v === ""
                        ? resto
                        : [
                            ...resto,
                            {
                              environment_id: a.id,
                              resultado: v as (typeof RESULTADOS)[number][0],
                              status_instalacao: c?.status_instalacao ?? "desconhecido",
                              fonte_url: c?.fonte_url ?? "",
                              notas: c?.notas ?? "",
                            },
                          ],
                    );
                  }}
                >
                  <option value="">Sem informação</option>
                  {RESULTADOS.map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
                {c && (
                  <input
                    aria-label={`Fonte da compatibilidade com ${a.nome}`}
                    type="url"
                    placeholder="Link da fonte"
                    className={classeCampo}
                    value={c.fonte_url ?? ""}
                    onChange={(e) =>
                      set("compat", d.compat.map((x) => (x.environment_id === a.id ? { ...x, fonte_url: e.target.value } : x)))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </Grupo>

      <Grupo titulo="6. Controle">
        <Campo id="aprovacao" rotulo="Status de aprovação">
          <select
            id="aprovacao"
            className={`${classeCampo} max-w-xs`}
            value={d.aprovacao}
            onChange={(e) => set("aprovacao", e.target.value as InicialForm["aprovacao"])}
          >
            <option value="rascunho">Rascunho (só o administrador vê)</option>
            <option value="em_revisao">Em revisão</option>
            <option value="aprovado">Aprovado (aparece para convidados)</option>
          </select>
        </Campo>
      </Grupo>

      {estado.erro && (
        <p role="alert" className="border border-perigo px-4 py-3 text-sm text-perigo">
          {estado.erro}
        </p>
      )}

      <div className="sticky bottom-16 z-10 flex flex-wrap gap-2 border-t border-linha bg-fundo py-3 md:bottom-0">
        <Botao variante="primario" type="submit" name="modo" value="salvar" disabled={pendente} onClick={() => setModo("salvar")}>
          {pendente && modo === "salvar" ? "Salvando…" : "Salvar"}
        </Botao>
        {d.id && (
          <Botao type="submit" name="modo" value="salvar_como" disabled={pendente} onClick={() => setModo("salvar_como")} title="Grava como novo recurso e mantém o original">
            {pendente && modo === "salvar_como" ? "Salvando…" : "Salvar como novo"}
          </Botao>
        )}
        <a href={cancelarHref} className="px-3 py-2 text-sm text-suave underline-offset-4 hover:underline">
          Cancelar
        </a>
      </div>
    </form>
  );
}

function CamposGrupo({
  grupo,
  campos,
  aplicaveis,
  setCampo,
}: {
  grupo: GrupoFicha;
  campos: Campos;
  aplicaveis: Set<string>;
  setCampo: (chave: string, p: Partial<Campos[string]>) => void;
}) {
  const defs = CAMPOS_FICHA.filter((c) => c.grupo === grupo && aplicaveis.has(c.chave));
  return (
    <details className="border border-linha" open>
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Campos de {ROTULO_GRUPO[grupo].toLowerCase()}</summary>
      <div className="grid gap-5 border-t border-linha p-4 md:grid-cols-2">
        {defs.map((def) => {
          const v = campos[def.chave];
          const fonte = v?.fontes?.[0]?.url ?? "";
          return (
            <div key={def.chave} className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor={`campo-${def.chave}`} className="text-sm font-medium">
                {def.rotulo}
              </label>
              <textarea
                id={`campo-${def.chave}`}
                rows={3}
                className={classeCampo}
                value={v?.valor ?? ""}
                disabled={v?.estado === "nao_se_aplica"}
                onChange={(e) =>
                  setCampo(def.chave, {
                    valor: e.target.value,
                    estado: v?.estado === "ausente" || !v ? "nao_verificado" : v.estado,
                  })
                }
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  aria-label={`Estado de ${def.rotulo}`}
                  className={`${classeCampo} text-xs`}
                  value={v?.estado ?? "ausente"}
                  onChange={(e) => setCampo(def.chave, { estado: e.target.value as EstadoCampo })}
                >
                  {ESTADOS_CAMPO.map((s) => (
                    <option key={s} value={s}>
                      {ROTULO_ESTADO[s]}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`Fonte de ${def.rotulo}`}
                  type="url"
                  placeholder="Link da fonte"
                  className={`${classeCampo} text-xs`}
                  value={fonte}
                  onChange={(e) => setCampo(def.chave, { fontes: e.target.value ? [{ url: e.target.value }] : [] })}
                />
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-linha pt-6">
      <h2 className="text-xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({ id, rotulo, children }: { id: string; rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Rotulo htmlFor={id}>{rotulo}</Rotulo>
      {children}
    </div>
  );
}

function Marcar({
  marcado,
  onChange,
  desabilitado,
  children,
}: {
  marcado: boolean;
  onChange: () => void;
  desabilitado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex items-start gap-2 text-sm ${desabilitado ? "opacity-60" : "cursor-pointer"}`}>
      <input type="checkbox" checked={marcado || !!desabilitado} disabled={desabilitado} onChange={onChange} className="mt-0.5" />
      <span>{children}</span>
    </label>
  );
}
