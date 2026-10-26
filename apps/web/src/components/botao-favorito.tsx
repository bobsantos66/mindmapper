"use client";

import { useOptimistic, useTransition } from "react";
import { alternarFavorito } from "@/server/recursos";
import { classeBotao } from "./ui";

export function BotaoFavorito({ id, inicial }: { id: string; inicial: boolean }) {
  const [favorito, setFavorito] = useOptimistic(inicial);
  const [, iniciar] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={favorito}
      className={classeBotao(favorito ? "primario" : "secundario")}
      onClick={() =>
        iniciar(async () => {
          setFavorito(!favorito);
          await alternarFavorito(id, !favorito);
        })
      }
    >
      {favorito ? "★ Favorito" : "☆ Favoritar"}
    </button>
  );
}
