"use client";

import { useActionState, useState } from "react";
import { criarSubcategoria, unirCategorias, type EstadoCategoria } from "@/server/categorias";
import { criarConvidado, novaSenhaConvidado, revogarConvidado, type EstadoConvite } from "@/server/usuarios";
import { BotaoCopiar } from "./botao-copiar";
import { Botao, Rotulo, classeCampo } from "./ui";

type OpcaoCategoria = { id: string; nome: string; filhas: { id: string; nome: string }[] };

function Mensagem({ estado }: { estado: { erro?: string; ok?: string } }) {
  if (estado.erro) return <p role="alert" className="text-sm text-perigo">{estado.erro}</p>;
  if (estado.ok) return <p role="status" className="text-sm text-ok">{estado.ok}</p>;
  return null;
}

export function FormSubcategoria({ categorias }: { categorias: OpcaoCategoria[] }) {
  const [estado, acao, pendente] = useActionState<EstadoCategoria, FormData>(criarSubcategoria, {});
  return (
    <form action={acao} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor="pai">Categoria principal</Rotulo>
          <select id="pai" name="pai" className={classeCampo} required>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor="nome-sub">Nome da subcategoria</Rotulo>
          <input id="nome-sub" name="nome" className={classeCampo} required />
        </div>
        <Botao variante="primario" disabled={pendente}>
          Incluir
        </Botao>
      </div>
      <Mensagem estado={estado} />
    </form>
  );
}

export function FormUnir({ categorias }: { categorias: OpcaoCategoria[] }) {
  const [estado, acao, pendente] = useActionState<EstadoCategoria, FormData>(unirCategorias, {});
  const opcoes = categorias.flatMap((c) => [
    { id: c.id, nome: c.nome },
    ...c.filhas.map((f) => ({ id: f.id, nome: `${c.nome} › ${f.nome}` })),
  ]);
  return (
    <form action={acao} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor="origem">Unir esta</Rotulo>
          <select id="origem" name="origem" className={classeCampo} required>
            {opcoes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor="destino">dentro desta</Rotulo>
          <select id="destino" name="destino" className={classeCampo} required>
            {opcoes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </div>
        <Botao disabled={pendente}>Unir</Botao>
      </div>
      <Mensagem estado={estado} />
    </form>
  );
}

function SenhaGerada({ estado }: { estado: EstadoConvite }) {
  if (!estado.senha) return null;
  return (
    <div role="status" className="flex flex-col gap-2 bg-destaque p-4 text-sobre-destaque">
      <p className="text-sm font-semibold">Senha de {estado.email}. Ela aparece só agora: copie e envie ao convidado.</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="bg-white px-3 py-2 font-mono text-black">{estado.senha}</code>
        <BotaoCopiar texto={estado.senha} rotulo="Copiar senha" />
      </div>
    </div>
  );
}

export function FormConvidado() {
  const [estado, acao, pendente] = useActionState<EstadoConvite, FormData>(criarConvidado, {});
  return (
    <form action={acao} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor="nome-convidado">Nome</Rotulo>
          <input id="nome-convidado" name="nome" className={classeCampo} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor="email-convidado">E-mail</Rotulo>
          <input id="email-convidado" name="email" type="email" className={classeCampo} required />
        </div>
        <Botao variante="primario" disabled={pendente}>
          Criar acesso
        </Botao>
      </div>
      {estado.erro && <p role="alert" className="text-sm text-perigo">{estado.erro}</p>}
      <SenhaGerada estado={estado} />
    </form>
  );
}

export function FormNovaSenha({ id }: { id: string }) {
  const [estado, acao, pendente] = useActionState<EstadoConvite, FormData>(novaSenhaConvidado, {});
  return (
    <form action={acao} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <Botao disabled={pendente}>Gerar nova senha</Botao>
      {estado.erro && <p className="text-sm text-perigo">{estado.erro}</p>}
      <SenhaGerada estado={estado} />
    </form>
  );
}

export function BotaoRevogar({ id, nome }: { id: string; nome: string }) {
  const [confirmando, setConfirmando] = useState(false);
  if (!confirmando)
    return (
      <Botao variante="perigo" type="button" onClick={() => setConfirmando(true)}>
        Revogar acesso
      </Botao>
    );
  return (
    <form action={revogarConvidado.bind(null, id)} className="flex flex-col gap-2">
      <p className="text-sm">A conta de {nome} e a senha serão apagadas agora. Não dá para desfazer.</p>
      <div className="flex gap-2">
        <Botao variante="perigo">Confirmar revogação</Botao>
        <Botao type="button" variante="fantasma" onClick={() => setConfirmando(false)}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
