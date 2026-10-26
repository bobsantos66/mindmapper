import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { networkInterfaces, platform } from "node:os";
import { basename, dirname, join } from "node:path";
import { arquivoConfig, pastaMindMapper } from "./caminhos";
import { gravarJsonPrivado } from "./registro";
import { hashSenha } from "./servidor/auth";
import { Banco, pastaSupabase } from "./servidor/banco";
import { chavesDaPasta, ServidorLocal } from "./servidor/servidor";

/**
 * Modo local: a plataforma inteira neste computador, sem Docker e sem nuvem.
 * O banco fica em ~/.mindmapper/local/dados (fora do Drive: sincronizar a pasta
 * de um banco aberto corrompe os arquivos). O Drive recebe só cópias de backup.
 */

export const pastaLocal = () => process.env.MM_LOCAL ?? join(pastaMindMapper(), "local");
const pastaDados = () => join(pastaLocal(), "dados");
const arquivoTrava = () => join(pastaLocal(), "em-uso.json");
const arquivoAjustes = () => join(pastaLocal(), "ajustes.json");

type Ajustes = { pastaBackup?: string; manterBackups?: number };

export async function lerAjustes(): Promise<Ajustes> {
  try {
    return JSON.parse(await readFile(arquivoAjustes(), "utf8")) as Ajustes;
  } catch {
    return {};
  }
}

async function salvarAjustes(a: Ajustes) {
  mkdirSync(pastaLocal(), { recursive: true });
  await writeFile(arquivoAjustes(), JSON.stringify(a, null, 2));
}

// ---------------------------------------------------------------------------
// Trava: um único processo abre o banco por vez
// ---------------------------------------------------------------------------

function processoVivo(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Devolve o endereço da plataforma se ela já estiver aberta por outro processo. */
export function emUso(): { pid: number; endereco: string } | null {
  try {
    const t = JSON.parse(readFileSync(arquivoTrava(), "utf8")) as { pid: number; endereco: string };
    return processoVivo(t.pid) ? t : null;
  } catch {
    return null;
  }
}

function travar(endereco: string) {
  const outro = emUso();
  if (outro) throw new Error(`O MindMapper já está aberto em ${outro.endereco}. Use essa janela ou feche-a antes.`);
  mkdirSync(pastaLocal(), { recursive: true });
  writeFileSync(arquivoTrava(), JSON.stringify({ pid: process.pid, endereco }));
}

function destravar() {
  try {
    const t = JSON.parse(readFileSync(arquivoTrava(), "utf8")) as { pid: number };
    if (t.pid === process.pid) unlinkSync(arquivoTrava());
  } catch {
    // já não existe
  }
}

function exigirFechado(acao: string) {
  const outro = emUso();
  if (outro) throw new Error(`Feche o MindMapper (janela do "mm abrir") antes de ${acao}.`);
}

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

const PADRAO_BACKUP = /^MindMapper-backup-\d{4}-\d{2}-\d{2}-\d{6}\.tar\.gz$/;

function carimbo(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export async function definirPastaBackup(pasta: string) {
  if (!existsSync(pasta)) throw new Error(`A pasta não existe: ${pasta}`);
  const teste = join(pasta, `.mindmapper-teste-${process.pid}`);
  try {
    writeFileSync(teste, "ok");
    unlinkSync(teste);
  } catch {
    throw new Error(`Não consegui gravar em ${pasta}.`);
  }
  await salvarAjustes({ ...(await lerAjustes()), pastaBackup: pasta });
}

/**
 * Grava uma cópia completa do banco na pasta de backup e mantém só as mais recentes.
 * Só apaga arquivos com o nome dos backups do MindMapper; nada mais na pasta é tocado.
 */
async function gravarBackup(banco: Banco): Promise<string | null> {
  const { pastaBackup, manterBackups = 30 } = await lerAjustes();
  if (!pastaBackup) return null;
  const copia = Buffer.from(await (await banco.copia()).arrayBuffer());
  const nome = `MindMapper-backup-${carimbo()}.tar.gz`;
  const temp = join(pastaBackup, `.${nome}.parcial`);
  writeFileSync(temp, copia);
  renameSync(temp, join(pastaBackup, nome));
  const antigos = readdirSync(pastaBackup).filter((f) => PADRAO_BACKUP.test(f)).sort().reverse().slice(manterBackups);
  for (const f of antigos) rmSync(join(pastaBackup, f));
  return join(pastaBackup, nome);
}

export async function backupAgora() {
  exigirFechado("fazer o backup");
  const { pastaBackup } = await lerAjustes();
  if (!pastaBackup) throw new Error("Escolha a pasta antes: mm backup-pasta <caminho da pasta no Drive>");
  if (!existsSync(join(pastaDados(), "PG_VERSION"))) throw new Error("Ainda não há banco local para copiar.");
  const banco = await Banco.abrir(pastaDados());
  try {
    return await gravarBackup(banco);
  } finally {
    await banco.fechar();
  }
}

/**
 * Restaura um backup. O banco atual não é apagado: vai para uma pasta
 * "dados-antes-de-restaurar-<data>" ao lado, para poder voltar atrás.
 */
export async function restaurarBackup(arquivo: string) {
  exigirFechado("restaurar um backup");
  if (!existsSync(arquivo)) throw new Error(`Arquivo não encontrado: ${arquivo}`);
  const conteudo = new Blob([readFileSync(arquivo)]);
  const guardado = existsSync(pastaDados()) ? join(pastaLocal(), `dados-antes-de-restaurar-${carimbo()}`) : null;
  if (guardado) renameSync(pastaDados(), guardado);
  try {
    const banco = await Banco.abrir(pastaDados(), { carregar: conteudo });
    const n = (await banco.pg.query<{ n: number }>("select count(*)::int n from public.resources")).rows[0]!.n;
    await banco.fechar();
    return { itens: n, guardado };
  } catch (e) {
    rmSync(pastaDados(), { recursive: true, force: true });
    if (guardado) renameSync(guardado, pastaDados());
    throw new Error(`Não consegui restaurar este arquivo (o banco atual foi mantido): ${(e as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// Abrir
// ---------------------------------------------------------------------------

export function enderecosNaRede(porta: number) {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => `http://${i!.address}:${porta}`);
}

function abrirNavegador(url: string) {
  const [cmd, args] =
    platform() === "win32" ? ["explorer.exe", [url]] : platform() === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  spawn(cmd, args, { stdio: "ignore", detached: true }).on("error", () => {}).unref();
}

export type Perguntar = (pergunta: string, oculta?: boolean) => Promise<string>;

async function garantirAdmin(banco: Banco, perguntar: Perguntar) {
  const r = await banco.pg.query("select 1 from public.profiles where papel = 'admin' limit 1");
  if (r.rows.length) return;
  console.log("\nPrimeira vez: crie o acesso de administrador (só você entra no modo local).");
  const nome = (await perguntar("Seu nome: ")) || "Administrador";
  const email = await perguntar("E-mail (só serve de login, nada é enviado): ");
  // Mesmo critério da tela de login, para não criar um acesso que não consegue entrar.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("E-mail inválido. Use o formato nome@exemplo.com.");
  let senha = "";
  for (;;) {
    senha = await perguntar("Senha (mínimo 10 caracteres): ", true);
    if (senha.length < 10) {
      console.log("Curta demais.");
      continue;
    }
    if ((await perguntar("Repita a senha: ", true)) === senha) break;
    console.log("As senhas não conferem.");
  }
  await banco.pg.transaction(async (tx) => {
    const u = await tx.query<{ id: string }>(
      "insert into auth.users (email, encrypted_password, raw_user_meta_data) values ($1, $2, $3::jsonb) returning id",
      [email, await hashSenha(senha), JSON.stringify({ nome })],
    );
    await tx.query("update public.profiles set papel = 'admin', nome = $2 where id = $1", [u.rows[0]!.id, nome]);
  });
  console.log("Administrador criado.");
}

function pastaWeb() {
  const web = join(dirname(pastaSupabase()), "apps", "web");
  if (!existsSync(join(web, ".next", "BUILD_ID"))) {
    throw new Error("O site ainda não foi preparado. Na pasta do MindMapper, rode uma vez: pnpm build");
  }
  return web;
}

async function portaLivre(servidor: ServidorLocal, inicial: number) {
  for (let p = inicial; p < inicial + 20; p++) {
    try {
      return await servidor.escutar(p);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EADDRINUSE") throw e;
    }
  }
  throw new Error("Não achei uma porta livre para o banco local.");
}

export async function abrir(opcoes: { porta: number; celular: boolean; navegador: boolean; perguntar: Perguntar }) {
  const web = pastaWeb();
  const host = opcoes.celular ? "0.0.0.0" : "127.0.0.1";
  const endereco = `http://localhost:${opcoes.porta}`;
  travar(endereco);
  let banco: Banco | undefined;
  let site: ChildProcess | undefined;
  let relogio: NodeJS.Timeout | undefined;
  let encerrando = false;

  const encerrar = async (codigo = 0) => {
    if (encerrando) return;
    encerrando = true;
    console.log("\nFechando o MindMapper...");
    if (relogio) clearInterval(relogio);
    site?.kill();
    try {
      if (banco) {
        const b = await gravarBackup(banco);
        if (b) console.log(`Backup gravado: ${b}`);
        await banco.fechar();
      }
    } finally {
      destravar();
      process.exit(codigo);
    }
  };

  try {
    console.log("Abrindo o banco local...");
    banco = await Banco.abrir(pastaDados());
    await garantirAdmin(banco, opcoes.perguntar);
    const chaves = chavesDaPasta(pastaLocal());
    const servidor = new ServidorLocal(banco, chaves);
    const portaBanco = await portaLivre(servidor, 54321);
    const urlBanco = `http://127.0.0.1:${portaBanco}`;

    // O `mm` (buscar, instalar, MCP) passa a falar com este banco.
    await gravarJsonPrivado(arquivoConfig(), { url: urlBanco, chave: chaves.anon });

    const nextBin = createRequire(join(web, "package.json")).resolve("next/dist/bin/next");
    site = spawn(process.execPath, [nextBin, "start", "-p", String(opcoes.porta), "-H", host], {
      cwd: web,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NODE_ENV: "production",
        SUPABASE_URL: urlBanco,
        SUPABASE_ANON_KEY: chaves.anon,
        SUPABASE_SERVICE_ROLE_KEY: chaves.servico,
      },
    });
    site.stderr?.on("data", (d: Buffer) => process.stderr.write(d));
    site.on("exit", (c) => {
      if (!encerrando) {
        console.error(`O site parou (código ${c}).`);
        void encerrar(1);
      }
    });
    await new Promise<void>((ok, falha) => {
      const t = setTimeout(() => falha(new Error("O site demorou demais para abrir.")), 60_000);
      site!.stdout?.on("data", (d: Buffer) => {
        if (/Ready|ready|started/.test(d.toString())) {
          clearTimeout(t);
          ok();
        }
      });
      site!.once("exit", () => falha(new Error(`O site não abriu. A porta ${opcoes.porta} pode estar em uso: tente mm abrir --porta 3001`)));
    });

    console.log(`\nMindMapper aberto: ${endereco}`);
    if (opcoes.celular) {
      const rede = enderecosNaRede(opcoes.porta);
      console.log("No iPhone (mesma rede Wi-Fi), abra no Safari:");
      for (const r of rede) console.log(`  ${r}`);
      if (!rede.length) console.log("  (nenhuma rede encontrada: o computador está no Wi-Fi?)");
      if (platform() === "win32") console.log('Se o Windows perguntar, permita o acesso só em "Redes privadas".');
    }
    const { pastaBackup } = await lerAjustes();
    console.log(
      pastaBackup
        ? `Backup: ao abrir, a cada 6 horas e ao fechar, em ${pastaBackup}`
        : "Backup desligado. Para ligar: mm backup-pasta <pasta do Google Drive>",
    );
    console.log("Para fechar, aperte Ctrl+C nesta janela.\n");

    const b = await gravarBackup(banco);
    if (b) console.log(`Backup gravado: ${basename(b)}`);
    relogio = setInterval(() => {
      if (banco) gravarBackup(banco).catch((e) => console.error(`Backup falhou: ${(e as Error).message}`));
    }, 6 * 3600_000);

    if (opcoes.navegador) abrirNavegador(endereco);
    process.on("SIGINT", () => void encerrar());
    process.on("SIGTERM", () => void encerrar());
    process.on("SIGHUP", () => void encerrar());
  } catch (e) {
    site?.kill();
    if (banco) await banco.fechar().catch(() => {});
    destravar();
    throw e;
  }
}

/**
 * Importa um arquivo de biblioteca (JSON) no MindMapper aberto, pelo mesmo importador
 * usado no Supabase. Os itens entram "em revisão", com o original guardado.
 */
export async function importar(arquivo: string, simular: boolean) {
  const aberto = emUso();
  if (!aberto) throw new Error("Abra o MindMapper antes (mm abrir) e rode este comando em outra janela.");
  if (!existsSync(arquivo)) throw new Error(`Arquivo não encontrado: ${arquivo}`);
  const raiz = dirname(pastaSupabase());
  const chaves = chavesDaPasta(pastaLocal());
  const { url } = JSON.parse(readFileSync(arquivoConfig(), "utf8")) as { url: string };
  const args = [join(raiz, "scripts", "importar-biblioteca.mjs"), arquivo, join(raiz, "scripts", "importacao", "mapa-biblioteca-organizada.json")];
  if (simular) args.push("--simular");
  await new Promise<void>((ok, falha) => {
    spawn(process.execPath, args, {
      cwd: raiz,
      stdio: "inherit",
      env: { ...process.env, SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: chaves.servico },
    }).on("exit", (c) => (c === 0 ? ok() : falha(new Error(`A importação parou (código ${c}).`))));
  });
}
