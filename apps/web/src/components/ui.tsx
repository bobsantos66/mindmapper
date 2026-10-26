import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primario" | "secundario" | "fantasma" | "perigo";

const base =
  "inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

const variantes: Record<Variante, string> = {
  primario: "bg-destaque text-sobre-destaque border-destaque hover:brightness-95",
  secundario: "bg-fundo text-texto border-texto hover:bg-painel",
  fantasma: "bg-transparent text-texto border-transparent hover:bg-painel",
  perigo: "bg-fundo text-perigo border-perigo hover:bg-painel",
};

export function classeBotao(v: Variante = "secundario", extra = "") {
  return `${base} ${variantes[v]} ${extra}`;
}

export function Botao({ variante = "secundario", className = "", ...props }: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={classeBotao(variante, className)} {...props} />;
}

export function BotaoLink({ variante = "secundario", className = "", ...props }: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={classeBotao(variante, className)} {...props} />;
}

type Tom = "neutro" | "destaque" | "ok" | "aviso" | "perigo" | "suave";

const tons: Record<Tom, string> = {
  neutro: "border-texto text-texto",
  destaque: "bg-destaque text-sobre-destaque border-destaque",
  ok: "border-ok text-ok",
  aviso: "border-suave text-suave border-dashed",
  perigo: "border-perigo text-perigo",
  suave: "border-linha text-suave",
};

export function Selo({ tom = "neutro", children, title }: { tom?: Tom; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[11px] leading-5 ${tons[tom]}`}>
      {children}
    </span>
  );
}

export function SeloExemplo() {
  return (
    <Selo tom="destaque" title="Dado de teste. Não é um recurso real verificado.">
      EXEMPLO ILUSTRATIVO
    </Selo>
  );
}

export function Titulo({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="flex flex-col gap-1.5">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{children}</h1>
      {sub && <p className="max-w-[68ch] text-suave">{sub}</p>}
    </header>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 border border-dashed border-linha p-6">
      <p className="font-semibold">{titulo}</p>
      {children && <div className="text-sm text-suave">{children}</div>}
    </div>
  );
}

export function Rotulo({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="font-mono text-[11px] uppercase tracking-wider text-suave">
      {children}
    </label>
  );
}

export const classeCampo =
  "w-full border border-linha bg-fundo px-3 py-2 text-sm text-texto placeholder:text-suave focus:border-texto";

export const ROTULO_COMPAT: Record<string, { texto: string; tom: Tom }> = {
  comprovada: { texto: "comprovada", tom: "ok" },
  declarada_na_fonte: { texto: "declarada na fonte", tom: "neutro" },
  nao_verificada: { texto: "a verificar", tom: "aviso" },
  incompativel: { texto: "incompatível", tom: "perigo" },
  nao_se_aplica: { texto: "não se aplica", tom: "suave" },
};
