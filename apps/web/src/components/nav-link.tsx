"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  children,
  mobile,
  fase,
  icone,
}: {
  href: string;
  children: ReactNode;
  mobile?: boolean;
  fase?: number;
  icone?: ReactNode;
}) {
  const caminho = usePathname();
  const ativo = href === "/" ? caminho === "/" : caminho.startsWith(href);

  if (mobile) {
    return (
      <Link
        href={href}
        aria-current={ativo ? "page" : undefined}
        className={`flex min-h-13 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] ${
          ativo ? "bg-inverso font-semibold text-sobre-inverso [&_svg]:text-destaque" : ""
        }`}
      >
        {icone}
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      className={`flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-sm transition-colors ${
        ativo ? "bg-inverso font-semibold text-sobre-inverso" : "hover:bg-painel"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${ativo ? "bg-destaque" : "bg-transparent"}`}
      />
      <span className="flex-1">{children}</span>
      {fase && <span className="text-[10px] font-medium opacity-60">fase {fase}</span>}
    </Link>
  );
}
