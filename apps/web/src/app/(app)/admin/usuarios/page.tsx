import type { Metadata } from "next";
import { BotaoRevogar, FormConvidado, FormNovaSenha } from "@/components/admin-forms";
import { Selo, Titulo, Vazio } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { dataCurta } from "@/lib/texto";

export const metadata: Metadata = { title: "Convidados" };

export default async function PaginaUsuarios() {
  await exigirAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, nome, papel, created_at").order("created_at");
  const convidados = (data ?? []).filter((p) => p.papel === "convidado");
  // O e-mail fica só no Auth; a lista é lida com a chave de serviço, apenas no servidor.
  const { data: contas } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
  const emails = new Map((contas?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  return (
    <>
      <Titulo sub="Convidados entram só com e-mail e senha criados aqui. Eles consultam a biblioteca e têm favoritos próprios, mas não editam. Revogar apaga a conta e a senha na hora.">
        Convidados
      </Titulo>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Criar acesso</h2>
        <FormConvidado />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Com acesso</h2>
        {convidados.length === 0 ? (
          <Vazio titulo="Nenhum convidado ainda." />
        ) : (
          <ul className="flex flex-col divide-y divide-linha border border-linha">
            {convidados.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{c.nome}</span>
                  <span className="truncate text-sm">{emails.get(c.id)}</span>
                  <span className="text-xs text-suave">desde {dataCurta(c.created_at)}</span>
                </div>
                <Selo tom="suave">convidado</Selo>
                <FormNovaSenha id={c.id} />
                <BotaoRevogar id={c.id} nome={c.nome} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
