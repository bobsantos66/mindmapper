"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children, mobile, fase }: { href: string; children: ReactNode; mobile?: boolean; fase?: number }) {
  const caminho = usePathname();
  const ativo = href === "/" ? caminho === "/" : caminho.startsWith(href);

  if (mobile) {
    return (
      <Link
        href={href}
        aria-current={ativo ? "page" : undefined}
        className={`flex h-14 items-center justify-center text-xs ${ativo ? "bg-destaque font-semibold text-sobre-destaque" : ""}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${
        ativo ? "bg-destaque font-semibold text-sobre-destaque" : "hover:bg-painel"
      }`}
    >
      <span>{children}</span>
      {fase && <span className="font-mono text-[10px] opacity-60">fase {fase}</span>}
    </Link>
  );
}
