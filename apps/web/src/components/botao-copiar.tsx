"use client";

import { useState } from "react";
import { classeBotao } from "./ui";

export function BotaoCopiar({ texto, rotulo = "Copiar", variante = "secundario" }: { texto: string; rotulo?: string; variante?: "primario" | "secundario" }) {
  const [estado, setEstado] = useState<"" | "ok" | "erro">("");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setEstado("ok");
    } catch {
      setEstado("erro");
    }
    setTimeout(() => setEstado(""), 2000);
  }

  return (
    <button type="button" onClick={copiar} className={classeBotao(variante)} aria-live="polite">
      {estado === "ok" ? "Copiado" : estado === "erro" ? "Selecione e copie manualmente" : rotulo}
    </button>
  );
}
