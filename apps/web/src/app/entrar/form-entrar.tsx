"use client";

import { useActionState } from "react";
import { entrar, type EstadoEntrar } from "@/server/auth";
import { Botao, Rotulo, classeCampo } from "@/components/ui";

export function FormEntrar() {
  const [estado, acao, pendente] = useActionState<EstadoEntrar, FormData>(entrar, {});
  return (
    <form action={acao} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Rotulo htmlFor="email">E-mail</Rotulo>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={estado.email} required className={classeCampo} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Rotulo htmlFor="senha">Senha</Rotulo>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required className={classeCampo} />
      </div>
      {estado.erro && (
        <p role="alert" className="text-sm text-perigo">
          {estado.erro}
        </p>
      )}
      <Botao variante="primario" disabled={pendente}>
        {pendente ? "Entrando…" : "Entrar"}
      </Botao>
    </form>
  );
}
