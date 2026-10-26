import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primario" | "secundario" | "fantasma" | "perigo";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";

const variantes: Record<Variante, string> = {
  primario: "bg-destaque text-sobre-destaque border-destaque hover:brightness-95",
  secundario: "bg-transparent text-texto border-linha-forte font-medium hover:border-texto",
  fantasma: "bg-transparent text-texto border-transparent font-medium hover:bg-painel",
  perigo: "bg-transparent text-perigo border-linha-forte font-medium hover:border-perigo",
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
  neutro: "bg-painel border-painel text-texto font-semibold",
  destaque: "bg-destaque text-sobre-destaque border-destaque font-bold",
  ok: "border-linha-forte text-ok",
  aviso: "border-linha-forte text-suave border-dashed",
  perigo: "border-linha-forte text-perigo",
  suave: "border-linha-forte text-suave",
};

export function Selo({ tom = "neutro", children, title }: { tom?: Tom; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs leading-5 ${tons[tom]}`}>
      {children}
    </span>
  );
}

export function SeloExemplo() {
  return (
    <Selo tom="destaque" title="Dado de teste. Não é um recurso real verificado.">
      Exemplo ilustrativo
    </Selo>
  );
}

export function Titulo({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-3xl leading-[1.05] font-bold tracking-[-0.035em] sm:text-[2.75rem]">{children}</h1>
      {sub && <p className="max-w-[68ch] text-[15px] leading-relaxed text-suave">{sub}</p>}
    </header>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-cartao border border-dashed border-linha-forte p-6">
      <p className="font-semibold">{titulo}</p>
      {children && <div className="text-sm text-suave">{children}</div>}
    </div>
  );
}

export function Rotulo({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold tracking-[0.06em] text-suave uppercase">
      {children}
    </label>
  );
}

export const classeCampo =
  "w-full min-h-11 rounded-xl border border-linha-forte bg-fundo px-3.5 py-2.5 text-sm text-texto placeholder:text-suave focus:border-texto";

export const ROTULO_COMPAT: Record<string, { texto: string; tom: Tom }> = {
  comprovada: { texto: "comprovada", tom: "ok" },
  declarada_na_fonte: { texto: "declarada na fonte", tom: "neutro" },
  nao_verificada: { texto: "a verificar", tom: "aviso" },
  incompativel: { texto: "incompatível", tom: "perigo" },
  nao_se_aplica: { texto: "não se aplica", tom: "suave" },
};

/** Cartão padrão: fundo de cartão, borda leve e cantos arredondados. */
export const classeCartao = "rounded-cartao border border-linha bg-cartao";

/** Logotipo: quadrado preto com o ponto amarelo (invertido no modo escuro). */
export function Logo({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex items-center justify-center rounded-lg bg-inverso"
        style={{ width: tamanho, height: tamanho }}
      >
        <span className="rounded-full bg-destaque" style={{ width: tamanho * 0.36, height: tamanho * 0.36 }} />
      </span>
      <span className="text-[17px] font-bold tracking-[-0.02em]">MindMapper</span>
    </span>
  );
}
