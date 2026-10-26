import { chmod, cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import type { Manifesto } from "@mindmapper/core";
import { arquivoInstalados, pastaLixeira, pastaMindMapper } from "./caminhos";

export type Escopo = "user" | "project";

/** O que o MindMapper Local instalou neste computador. Só remove o que está aqui. */
export interface Instalado {
  slug: string;
  titulo: string;
  resourceId: string;
  pacoteId: string;
  versao: string;
  escopo: Escopo;
  /** Pasta do projeto, quando o escopo é "project". */
  projeto?: string;
  manifesto: Manifesto;
  /** Arquivos ou pastas gravados (skills e comandos). */
  caminhos: string[];
  instaladoEm: string;
}

export interface ItemLixeira {
  id: string;
  slug: string;
  movidoEm: string;
  /** Caminho original de cada item guardado, para restaurar. */
  origens: { guardado: string; original: string }[];
  registro: Instalado;
}

async function lerJson<T>(arquivo: string, padrao: T): Promise<T> {
  try {
    return JSON.parse(await readFile(arquivo, "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return padrao;
    throw e;
  }
}

export async function gravarJsonPrivado(arquivo: string, dados: unknown) {
  await mkdir(dirname(arquivo), { recursive: true, mode: 0o700 });
  const tmp = `${arquivo}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(dados, null, 2), { mode: 0o600 });
  await rename(tmp, arquivo);
  await chmod(arquivo, 0o600).catch(() => {});
}

export async function listarInstalados(): Promise<Instalado[]> {
  return lerJson<Instalado[]>(arquivoInstalados(), []);
}

export async function acharInstalado(slug: string, escopo?: Escopo, projeto?: string) {
  const todos = await listarInstalados();
  return todos.filter(
    (i) => i.slug === slug && (!escopo || i.escopo === escopo) && (i.escopo !== "project" || !projeto || i.projeto === projeto),
  );
}

export async function registrarInstalado(item: Instalado) {
  const todos = (await listarInstalados()).filter(
    (i) => !(i.slug === item.slug && i.escopo === item.escopo && i.projeto === item.projeto),
  );
  todos.push(item);
  await gravarJsonPrivado(arquivoInstalados(), todos);
}

export async function esquecerInstalado(item: Instalado) {
  const todos = (await listarInstalados()).filter(
    (i) => !(i.slug === item.slug && i.escopo === item.escopo && i.projeto === item.projeto),
  );
  await gravarJsonPrivado(arquivoInstalados(), todos);
}

async function existe(p: string) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/** Move arquivos para a lixeira local em vez de apagar. Funciona entre discos diferentes. */
export async function moverParaLixeira(registro: Instalado): Promise<ItemLixeira> {
  const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${registro.slug}`;
  const destino = join(pastaLixeira(), id);
  await mkdir(destino, { recursive: true, mode: 0o700 });
  const origens: ItemLixeira["origens"] = [];
  for (const [i, original] of registro.caminhos.entries()) {
    if (!(await existe(original))) continue;
    const guardado = join(destino, `${i}-${basename(original)}`);
    try {
      await rename(original, guardado);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EXDEV") throw e;
      await cp(original, guardado, { recursive: true });
      await rm(original, { recursive: true, force: true });
    }
    origens.push({ guardado, original });
  }
  const item: ItemLixeira = { id, slug: registro.slug, movidoEm: new Date().toISOString(), origens, registro };
  await gravarJsonPrivado(join(destino, "item.json"), item);
  return item;
}

export async function listarLixeira(): Promise<ItemLixeira[]> {
  let pastas: string[];
  try {
    pastas = await readdir(pastaLixeira());
  } catch {
    return [];
  }
  const itens = await Promise.all(pastas.map((p) => lerJson<ItemLixeira | null>(join(pastaLixeira(), p, "item.json"), null)));
  return itens.filter((i): i is ItemLixeira => !!i).sort((a, b) => b.movidoEm.localeCompare(a.movidoEm));
}

/** Devolve os arquivos ao lugar original. Recusa se já existe algo lá, para não sobrescrever. */
export async function restaurarDaLixeira(item: ItemLixeira) {
  for (const o of item.origens) {
    if (await existe(o.original)) {
      throw new Error(`Já existe algo em ${o.original}. Mova ou renomeie antes de restaurar.`);
    }
  }
  for (const o of item.origens) {
    await mkdir(dirname(o.original), { recursive: true });
    await rename(o.guardado, o.original);
  }
  await rm(join(pastaLixeira(), item.id), { recursive: true, force: true });
}

export async function garantirPasta() {
  await mkdir(pastaMindMapper(), { recursive: true, mode: 0o700 });
}
