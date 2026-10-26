import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import type { Usuario } from "@/lib/auth";
import { COOKIE_TEMA, type Tema } from "@/lib/tema";
import { sair } from "@/server/auth";
import { TemaToggle } from "./tema-toggle";
import { NavLink } from "./nav-link";

interface ItemNav {
  href: string;
  rotulo: string;
  curto: string;
  soAdmin?: boolean;
  fase?: number;
}

const NAV: ItemNav[] = [
  { href: "/", rotulo: "Início", curto: "Início" },
  { href: "/chatgpt", rotulo: "ChatGPT", curto: "ChatGPT" },
  { href: "/claude", rotulo: "Claude", curto: "Claude" },
  { href: "/recursos", rotulo: "Todos os recursos", curto: "Todos" },
  { href: "/favoritos", rotulo: "Favoritos", curto: "Favoritos" },
  { href: "/tarefas", rotulo: "Minhas tarefas", curto: "Tarefas", fase: 2 },
  { href: "/importar", rotulo: "Importar arquivos", curto: "Importar", soAdmin: true, fase: 3 },
  { href: "/categorias", rotulo: "Categorias", curto: "Categorias" },
  { href: "/mapa", rotulo: "Mapa mental", curto: "Mapa", fase: 2 },
  { href: "/admin", rotulo: "Administração", curto: "Admin", soAdmin: true },
  { href: "/lixeira", rotulo: "Lixeira", curto: "Lixeira", soAdmin: true },
];

const PRINCIPAIS_MOBILE = ["/", "/chatgpt", "/claude", "/recursos"];

export async function AppShell({ usuario, children }: { usuario: Usuario; children: ReactNode }) {
  const valorTema = (await cookies()).get(COOKIE_TEMA)?.value;
  const tema: Tema = valorTema === "claro" || valorTema === "escuro" ? valorTema : "sistema";
  const itens = NAV.filter((i) => !i.soAdmin || usuario.papel === "admin");
  const mais = itens.filter((i) => !PRINCIPAIS_MOBILE.includes(i.href));

  return (
    <div className="flex min-h-dvh">
      {/* Barra lateral no desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-linha px-4 py-6 md:flex">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Mind<span className="bg-destaque px-0.5 text-sobre-destaque">Mapper</span>
        </Link>
        <nav aria-label="Principal" className="flex flex-col gap-0.5">
          {itens.map((i) => (
            <NavLink key={i.href} href={i.href} fase={i.fase}>
              {i.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 text-sm">
          <TemaToggle inicial={tema} />
          <div className="flex flex-col">
            <span className="truncate font-medium">{usuario.nome}</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-suave">
              {usuario.papel === "admin" ? "Administrador" : "Convidado"}
            </span>
          </div>
          <form action={sair}>
            <button className="text-suave underline-offset-4 hover:underline">Sair</button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topo no celular */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-linha bg-fundo px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Mind<span className="bg-destaque px-0.5 text-sobre-destaque">Mapper</span>
          </Link>
          <TemaToggle inicial={tema} />
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-6 pb-28 sm:px-6 md:pb-12">
          {children}
        </main>

        {/* Navegação inferior no celular */}
        <nav
          aria-label="Principal"
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-linha bg-fundo pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          {itens
            .filter((i) => PRINCIPAIS_MOBILE.includes(i.href))
            .map((i) => (
              <NavLink key={i.href} href={i.href} mobile>
                {i.curto}
              </NavLink>
            ))}
          <details className="relative">
            <summary className="flex h-14 cursor-pointer list-none items-center justify-center text-xs">Mais</summary>
            <div className="absolute right-2 bottom-16 flex w-56 flex-col border border-texto bg-fundo p-2 shadow-lg">
              {mais.map((i) => (
                <NavLink key={i.href} href={i.href} fase={i.fase}>
                  {i.rotulo}
                </NavLink>
              ))}
              <form action={sair} className="border-t border-linha pt-2">
                <button className="px-3 py-2 text-sm text-suave">Sair ({usuario.nome})</button>
              </form>
            </div>
          </details>
        </nav>
      </div>
    </div>
  );
}
