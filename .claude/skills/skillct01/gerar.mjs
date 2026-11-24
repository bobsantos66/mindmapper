// Gera os PNGs de um carrossel (1080x1350) a partir do dados.js da pasta.
// uso: node gerar.mjs "<pasta do carrossel>" [slides...]
//   sem slides: gera todos. Com números (ex.: 1 4): gera só esses.
// A pasta precisa ter dados.js (window.DADOS = {...}). O modelo.html desta skill
// é copiado pra pasta como carrossel.html a cada execução.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pasta = path.resolve(process.argv[2] || '.');
const aqui = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(pasta, 'carrossel.html');

const dadosArq = path.join(pasta, 'dados.js');
if (!fs.existsSync(dadosArq)) { console.error('Falta dados.js em ' + pasta); process.exit(1); }
fs.copyFileSync(path.join(aqui, 'modelo.html'), html);

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(dadosArq, 'utf8'), ctx);
const total = ctx.window.DADOS.itens.length + 2;

const pedidos = process.argv.slice(3).map(Number).filter(n => n >= 1 && n <= total);
const lista = pedidos.length ? pedidos : Array.from({ length: total }, (_, i) => i + 1);

// sem slide sobrando de uma versão maior
if (!pedidos.length) {
  for (const f of fs.readdirSync(pasta)) {
    const m = f.match(/^slide-(\d+)\.png$/);
    if (m && +m[1] > total) fs.rmSync(path.join(pasta, f));
  }
}

const candidatos = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];
const chrome = candidatos.find(c => fs.existsSync(c));
if (!chrome) { console.error('Chrome não encontrado'); process.exit(1); }

const url = pathToFileURL(html).href;
for (const i of lista) {
  const saida = path.join(pasta, `slide-${String(i).padStart(2, '0')}.png`);
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'carrossel-'));
  spawnSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--user-data-dir=${perfil}`, '--force-device-scale-factor=1',
    '--window-size=1080,1350', '--virtual-time-budget=8000',
    `--screenshot=${saida}`, `${url}#${i}`
  ], { stdio: 'ignore', timeout: 60000 });
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {}
  console.log(fs.existsSync(saida) ? `ok ${path.basename(saida)}` : `FALHOU slide ${i}`);
}
