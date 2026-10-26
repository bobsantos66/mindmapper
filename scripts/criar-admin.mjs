// Cria (ou promove) a conta do administrador. Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/criar-admin.mjs email@exemplo.com "Nome"
// A senha é gerada aqui e mostrada uma única vez.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [email, nome = "Administrador"] = process.argv.slice(2);
const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!email || !chave) {
  console.error("Uso: SUPABASE_SERVICE_ROLE_KEY=... node scripts/criar-admin.mjs email [nome]");
  process.exit(1);
}

const supabase = createClient(url, chave, { auth: { persistSession: false } });
const senha = process.env.SENHA_ADMIN ?? randomBytes(12).toString("base64url");

let { data: lista } = await supabase.auth.admin.listUsers();
let usuario = lista?.users.find((u) => u.email === email);
if (!usuario) {
  const { data, error } = await supabase.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome } });
  if (error) throw error;
  usuario = data.user;
  console.log(`Conta criada: ${email}\nSenha: ${senha}\nGuarde a senha agora; ela não aparece de novo.`);
} else {
  console.log(`Conta já existia: ${email} (senha mantida).`);
}

const { error } = await supabase.from("profiles").update({ papel: "admin", nome }).eq("id", usuario.id);
if (error) throw error;

// Garante um único administrador.
const { data: outros } = await supabase.from("profiles").select("id").eq("papel", "admin").neq("id", usuario.id);
if (outros?.length) console.warn(`Atenção: existem outros ${outros.length} administradores.`);
console.log("Papel de administrador confirmado.");
