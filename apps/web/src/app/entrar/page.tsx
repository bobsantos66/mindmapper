import type { Metadata } from "next";
import { Logo } from "@/components/ui";
import { FormEntrar } from "./form-entrar";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8 rounded-[1.5rem] border border-linha bg-cartao p-7 sm:p-9">
        <div className="flex flex-col gap-5">
          <Logo tamanho={32} />
          <h1 className="text-3xl leading-tight font-bold tracking-[-0.03em]">Entrar</h1>
          <p className="-mt-3 text-sm leading-relaxed text-suave">Entre com o e-mail e a senha que o administrador criou para você.</p>
        </div>
        <FormEntrar />
      </div>
    </main>
  );
}
