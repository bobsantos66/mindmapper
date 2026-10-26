"use client";

import { useState, useTransition } from "react";
import { definirTema } from "@/server/tema";
import type { Tema } from "@/lib/tema";
import { IconeLua, IconeSistema, IconeSol } from "./icones";

const OPCOES = [
  { valor: "claro", rotulo: "Modo diurno", Icone: IconeSol },
  { valor: "escuro", rotulo: "Modo noturno", Icone: IconeLua },
  { valor: "sistema", rotulo: "Seguir o sistema", Icone: IconeSistema },
] as const satisfies readonly { valor: Tema; rotulo: string; Icone: unknown }[];

export function TemaToggle({ inicial }: { inicial: Tema }) {
  const [tema, setTema] = useState<Tema>(inicial);
  const [, iniciar] = useTransition();

  function escolher(t: Tema) {
    setTema(t);
    if (t === "sistema") document.documentElement.removeAttribute("data-tema");
    else document.documentElement.setAttribute("data-tema", t);
    iniciar(() => definirTema(t));
  }

  return (
    <div role="radiogroup" aria-label="Tema" className="inline-flex gap-1 rounded-xl bg-painel p-1">
      {OPCOES.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={tema === o.valor}
          title={o.rotulo}
          aria-label={o.rotulo}
          onClick={() => escolher(o.valor)}
          className={`flex h-9 w-10 items-center justify-center rounded-lg transition-colors ${
            tema === o.valor ? "bg-fundo text-texto shadow-sm" : "text-suave hover:text-texto"
          }`}
        >
          <o.Icone width={16} height={16} />
        </button>
      ))}
    </div>
  );
}
