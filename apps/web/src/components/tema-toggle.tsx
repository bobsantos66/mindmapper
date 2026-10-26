"use client";

import { useState, useTransition } from "react";
import { definirTema } from "@/server/tema";
import type { Tema } from "@/lib/tema";

const OPCOES: { valor: Tema; rotulo: string; icone: string }[] = [
  { valor: "claro", rotulo: "Modo diurno", icone: "☀" },
  { valor: "escuro", rotulo: "Modo noturno", icone: "☾" },
  { valor: "sistema", rotulo: "Seguir o sistema", icone: "◐" },
];

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
    <div role="radiogroup" aria-label="Tema" className="inline-flex border border-linha">
      {OPCOES.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={tema === o.valor}
          title={o.rotulo}
          aria-label={o.rotulo}
          onClick={() => escolher(o.valor)}
          className={`h-8 w-8 text-sm ${tema === o.valor ? "bg-destaque text-sobre-destaque" : "text-texto hover:bg-painel"}`}
        >
          {o.icone}
        </button>
      ))}
    </div>
  );
}
