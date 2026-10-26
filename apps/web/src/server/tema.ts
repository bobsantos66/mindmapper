"use server";

import { cookies } from "next/headers";
import { COOKIE_TEMA, type Tema } from "@/lib/tema";

export async function definirTema(tema: Tema) {
  const c = await cookies();
  if (tema === "sistema") c.delete(COOKIE_TEMA);
  else c.set(COOKIE_TEMA, tema, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
