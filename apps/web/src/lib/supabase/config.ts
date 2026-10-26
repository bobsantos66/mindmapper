/**
 * Endereço e chave pública do banco. SUPABASE_URL e SUPABASE_ANON_KEY são lidas na hora
 * em que o servidor roda (o modo local, `mm abrir`, gera as suas); as NEXT_PUBLIC_*
 * ficam como alternativa para o Supabase de sempre.
 */
export function configSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Configure SUPABASE_URL e SUPABASE_ANON_KEY (ou rode pelo `mm abrir`).");
  return { url, anon };
}
