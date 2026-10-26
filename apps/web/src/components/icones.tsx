import type { SVGProps } from "react";

/** Ícones de traço, herdam a cor do texto. Decorativos por padrão (aria-hidden). */
function Icone({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconeBusca = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icone>
);

export const IconeSol = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icone>
);

export const IconeLua = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Icone>
);

export const IconeSistema = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </Icone>
);

export const IconeEstrela = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />
  </Icone>
);

export const IconeLista = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
  </Icone>
);

export const IconeMais = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </Icone>
);

export const IconeCopiar = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </Icone>
);

export const IconeVoltar = (p: SVGProps<SVGSVGElement>) => (
  <Icone {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Icone>
);
