import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@mindmapper/core";
import { configSupabase } from "./config";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    configSupabase().url,
    configSupabase().anon,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(lista) {
          try {
            lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Chamado de um Server Component: o proxy já renova a sessão.
          }
        },
      },
    },
  );
}

/**
 * Cliente com a chave de serviço. Ignora RLS: use só em ações que já
 * conferiram que quem chama é o administrador (criar e revogar convidados).
 */
export function createAdminClient() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  return createSupabaseClient<Database>(configSupabase().url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
