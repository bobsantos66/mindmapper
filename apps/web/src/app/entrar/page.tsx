import type { Metadata } from "next";
import { FormEntrar } from "./form-entrar";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-3xl font-bold tracking-tight">
            Mind<span className="bg-destaque px-1 text-sobre-destaque">Mapper</span>
          </p>
          <p className="text-suave">Entre com o e-mail e a senha que o administrador criou para você.</p>
        </div>
        <FormEntrar />
      </div>
    </main>
  );
}
