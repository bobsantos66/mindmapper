"use client";

import { useMemo, useState } from "react";
import { extrairParametros, preencherParametros } from "@mindmapper/core";
import { BotaoCopiar } from "./botao-copiar";
import { classeCampo } from "./ui";

/** Comando ou prompt com {{parâmetros}} editáveis antes de copiar. */
export function ComandoPronto({ texto }: { texto: string }) {
  const nomes = useMemo(() => extrairParametros(texto), [texto]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const final = preencherParametros(texto, valores);

  return (
    <div className="flex flex-col gap-3">
      {nomes.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {nomes.map((n) => (
            <label key={n} className="flex flex-col gap-1 text-sm">
              <span className="font-mono text-[11px] uppercase tracking-wider text-suave">{n}</span>
              <input
                className={classeCampo}
                value={valores[n] ?? ""}
                onChange={(e) => setValores((v) => ({ ...v, [n]: e.target.value }))}
              />
            </label>
          ))}
        </div>
      )}
      <pre className="max-h-96 overflow-auto border border-linha bg-painel p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
        {final}
      </pre>
      <div className="flex flex-wrap gap-2">
        <BotaoCopiar texto={final} rotulo="Copiar" variante="primario" />
        <button type="button" disabled title="Disponível na Fase 2" className="cursor-not-allowed border border-linha px-3.5 py-2 text-sm text-suave">
          Adicionar à tarefa (Fase 2)
        </button>
      </div>
    </div>
  );
}
