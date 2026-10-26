import Link from "next/link";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import type { Usuario } from "@/lib/auth";
import { COOKIE_TEMA, type Tema } from "@/lib/tema";
import { sair } from "@/server/auth";
import { IconeBusca, IconeEstrela, IconeLista, IconeMais } from "./icones";
import { TemaToggle } from "./tema-toggle";
import { NavLink } from "./nav-link";
import { Logo } from "./ui";

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

const PRINCIPAIS_MOBILE = [
  { href: "/", curto: "Buscar", Icone: IconeBusca },
  { href: "/favoritos", curto: "Favoritos", Icone: IconeEstrela },
  { href: "/recursos", curto: "Todos", Icone: IconeLista },
];

export async function AppShell({ usuario, children }: { usuario: Usuario; children: ReactNode }) {
  const valorTema = (await cookies()).get(COOKIE_TEMA)?.value;
  const tema: Tema = valorTema === "claro" || valorTema === "escuro" ? valorTema : "sistema";
  const itens = NAV.filter((i) => !i.soAdmin || usuario.papel === "admin");
  const mais = itens.filter((i) => !PRINCIPAIS_MOBILE.some((p) => p.href === i.href));

  return (
    <div className="flex min-h-dvh">
      {/* Barra lateral no desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-7 overflow-y-auto border-r border-linha px-5 py-7 md:flex">
        <Link href="/" aria-label="MindMapper, início">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="flex flex-col gap-0.5">
          {itens.map((i) => (
            <NavLink key={i.href} href={i.href} fase={i.fase}>
              {i.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <TemaToggle inicial={tema} />
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-painel text-sm font-bold"
            >
              {usuario.nome.slice(0, 1).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{usuario.nome}</span>
              <span className="text-xs text-suave">{usuario.papel === "admin" ? "Administrador" : "Convidado"}</span>
            </div>
          </div>
          <form action={sair}>
            <button className="text-sm text-suave underline-offset-4 hover:text-texto hover:underline">Sair</button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topo no celular */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-fundo/90 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur md:hidden">
          <Link href="/" aria-label="MindMapper, início">
            <Logo tamanho={26} />
          </Link>
          <TemaToggle inicial={tema} />
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pt-6 pb-32 sm:px-8 md:px-14 md:pt-12 md:pb-16">
          {children}
        </main>

        {/* Navegação inferior no celular */}
        <nav
          aria-label="Principal"
          className="fixed inset-x-0 bottom-0 z-20 flex justify-around gap-1 border-t border-linha bg-fundo px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
        >
          {PRINCIPAIS_MOBILE.map(({ href, curto, Icone }) => (
            <NavLink key={href} href={href} mobile icone={<Icone width={20} height={20} />}>
              {curto}
            </NavLink>
          ))}
          <details className="relative">
            <summary className="flex min-h-13 min-w-16 cursor-pointer list-none flex-col items-center justify-center gap-1 rounded-xl text-[11px]">
              <IconeMais width={20} height={20} />
              Mais
            </summary>
            <div className="absolute right-0 bottom-16 flex w-60 flex-col gap-0.5 rounded-cartao border border-linha bg-cartao p-2 shadow-xl">
              {mais.map((i) => (
                <NavLink key={i.href} href={i.href} fase={i.fase}>
                  {i.rotulo}
                </NavLink>
              ))}
              <form action={sair} className="mt-1 border-t border-linha pt-1">
                <button className="min-h-11 w-full rounded-xl px-3 text-left text-sm text-suave">Sair ({usuario.nome})</button>
              </form>
            </div>
          </details>
        </nav>
      </div>
    </div>
  );
}
