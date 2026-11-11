// IA na propaganda: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// 96 bpm grid (1 beat = 0.625 s). Everything is on screen by beat ~6.6 (4.1 s); then the frame holds
// still for reading. The held frame reproduces the original art (assets/src/tela.jpg).
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, wobble, font, layout, glyph, rrect } = M;

const C = { ink: '#000000', paper: '#FFFFFF' };
const BOLD = 'Display', REG = 'UI';

// ---------------------------------------------------------------- layout measured on tela.jpg
const PILL = { x: 146, y: 179, w: 546, h: 41, size: 24.5, base: 209, str: 'IA NA PROPAGANDA' };
const HEAD = { x: 143.5, size: 50, lines: [
  { str: 'SUA AGÊNCIA AINDA USA', base: 289, u0: 0.15, u1: 1.15 },
  { str: 'INTELIGÊNCIA ARTIFICIAL', base: 347, u0: 1.25, u1: 2.35 },
  { str: 'SOMENTE PARA CRIAR?', base: 404, u0: 2.45, u1: 3.2 },
] };
const BODY = { x: 145.5, size: 31.7, lines: [
  'NA SG PROPAG, O USO DE FERRAMENTAS',
  'INTELIGENTES JÁ FAZ PARTE DA NOSSA',
  'ROTINA NA AUTOMAÇÃO DE FLUXOS DE',
  'TRABALHO, PESQUISA DE COMPORTAMENTO DO',
  'CONSUMIDOR, NA ANÁLISE DE MÉTRICAS E',
  'INSIGHTS POR SEGMENTO, COM INFORMAÇÕES',
  'EXCLUSIVAS PARA NOSSOS CLIENTES.',
], base0: 475, step: 41.67, u0: 3.2, du: 0.2 };
const CTA = { x: 145, size: 31.6, lines: [
  { str: 'VENHA PARA A SG.', base: 841, u0: 4.7 },
  { str: 'AQUI, QUEM VIRALIZA É A SUA COMUNICAÇÃO', base: 882, u0: 4.9 },
] };
const TAG = { size: 31.6, lines: [
  { str: 'INTELIGÊNCIA DE MERCADO PARA', cx: 548.5, base: 1780, u0: 5.5 },
  { str: 'DECISÕES DE COMUNICAÇÃO.', cx: 556, base: 1822, u0: 5.7 },
] };
const PERSON = { x: 619, y: 933 };
const LOGO = { x: 321, y: 1636 };
const STAR = [600, 1300];
// bars, clockwise from the top: [id, box x, box y]
const BARS = [['A', 465, 1005], ['B', 691, 993], ['G', 715, 1247], ['H', 689, 1343], ['F', 611, 1369], ['E', 521, 1341], ['D', 357, 1257], ['C', 333, 1175]];
const BAR_U0 = 0.75, BAR_DU = 0.17;
const NOTES = ['D5', 'F5', 'G5', 'A5', 'C6', 'D6', 'F6', 'A6'];

const HITS = [
  [-0.0, 'pill', 'click'],
  [0.05, 'pill text types', 'type', { n: 16, len: 0.3 }],
  [0.15, 'head 1 types', 'type', { n: 21, len: 0.62 }],
  [0.35, 'presenter lands', 'thud'],
  [1.25, 'head 2 types', 'type', { n: 23, len: 0.68 }],
  [2.45, 'head 3 types', 'type', { n: 19, len: 0.46 }],
  [3.2, '?', 'thud'],
  ...BARS.map(([id], i) => [BAR_U0 + i * BAR_DU + 0.3, `bar ${id}`, 'blip', { pitch: NOTES[i] }]),
  [4.7, 'CTA', 'pop', { pitch: 'A5' }],
  [5.25, 'logo', 'bell', { pitch: 'D6' }],
];

// ---------------------------------------------------------------- pieces
function pill(ctx, u) {
  const p = E.outExpo(prog(u, -0.45, 0.35));
  if (p <= 0) return;
  ctx.save();
  rrect(ctx, PILL.x, PILL.y, Math.max(PILL.h, PILL.w * p), PILL.h, PILL.h / 2);
  ctx.fillStyle = C.ink; ctx.fill(); ctx.clip();
  const f = font(PILL.size, 400, REG), L = layout(ctx, PILL.str, f);
  const n = Math.floor(PILL.str.length * prog(u, 0.05, 0.55));
  const x0 = PILL.x + (PILL.w - L.width) / 2;
  L.glyphs.slice(0, n).forEach((g) => glyph(ctx, g.ch, x0 + g.cx, PILL.base, f, C.paper));
  ctx.restore();
}

// Typewriter: characters land one by one with a small pop; a block cursor rides the end of the line.
function typed(ctx, u) {
  const f = font(HEAD.size, 600, BOLD);
  let cursor = null;
  HEAD.lines.forEach((ln, li) => {
    const L = layout(ctx, ln.str, f);
    const N = ln.str.length;
    const fp = prog(u, ln.u0, ln.u1);
    const n = Math.floor(N * fp + 1e-6);
    L.glyphs.forEach((g, j) => {
      if (j >= n) return;
      const tj = ln.u0 + ((ln.u1 - ln.u0) * j) / N;            // when glyph j landed
      let s = 1 + 0.18 * Math.exp(-(u - tj) * 14);
      let y = ln.base;
      if (g.ch === '?') { s += 0.35 * wobble(u - 3.2, 2.4, 5); y -= 10 * wobble(u - 3.2, 2.4, 5); }
      glyph(ctx, g.ch, HEAD.x + g.cx, y, f, C.ink, s, s);
    });
    if (u >= ln.u0 && (fp < 1 || li === HEAD.lines.length - 1)) {
      const adv = L.glyphs[1].x - L.glyphs[0].x;
      cursor = { x: HEAD.x + (n < N ? L.glyphs[n].x : L.width + adv * 0.15), base: ln.base, adv };
    }
  });
  // cursor: solid while typing, blinks after, gone before the reading hold
  if (cursor && u < 5.8) {
    const typing = u < HEAD.lines[2].u1;
    const on = typing || Math.floor((u - 3.2) * 2) % 2 === 0;
    if (on) { ctx.fillStyle = C.ink; ctx.fillRect(cursor.x, cursor.base - HEAD.size * 0.72, cursor.adv * 0.55, HEAD.size * 0.78); }
  }
}

// A line that rises out of a mask (its own baseline clip).
function rise(ctx, str, x, base, f, size, u, u0, align = 'left') {
  const k = springU(u, u0, SPRING.snappy);
  if (k <= 0) return;
  const L = layout(ctx, str, f);
  const x0 = align === 'center' ? x - L.width / 2 : x;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - 10, base - size * 1.05, L.width + 20, size * 1.4); ctx.clip();
  const dy = (1 - k) * size * 1.25;
  L.glyphs.forEach((g) => glyph(ctx, g.ch, x0 + g.cx, base + dy, f, C.ink));
  ctx.restore();
}

function body(ctx, u) {
  const f = font(BODY.size, 400, REG);
  BODY.lines.forEach((s, i) => rise(ctx, s, BODY.x, BODY.base0 + i * BODY.step, f, BODY.size, u, BODY.u0 + i * BODY.du));
  const fb = font(CTA.size, 600, BOLD);
  CTA.lines.forEach((l) => rise(ctx, l.str, CTA.x, l.base, fb, CTA.size, u, l.u0));
  const ft = font(TAG.size, 400, REG);
  TAG.lines.forEach((l) => rise(ctx, l.str, l.cx, l.base, ft, TAG.size, u, l.u0, 'center'));
}

function floorShadow(ctx, u) {
  const a = E.outCubic(prog(u, 5.1, 5.9));
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = 0.1 * a;
  ctx.translate(555, 1724); ctx.scale(1, 0.055);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 290);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 290, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function bars(ctx, u, IMG) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  BARS.forEach(([id, bx, by], i) => {
    const im = IMG['bar' + id];
    if (!im) return;
    const k = springU(u, BAR_U0 + i * BAR_DU, { stiffness: 230, damping: 15 });
    if (k <= 0) return;
    const cx = bx + im.width / 2, cy = by + im.height / 2;
    const x = lerp(STAR[0], cx, k), y = lerp(STAR[1], cy, k);
    const s = 0.25 + 0.75 * clamp(k, 0, 1.2);
    ctx.save();
    ctx.globalAlpha = clamp(k * 3, 0, 1);
    ctx.translate(x, y); ctx.rotate((1 - k) * 0.9); ctx.scale(s, s);
    ctx.drawImage(im, -im.width / 2, -im.height / 2);
    ctx.restore();
  });
  ctx.restore();
}

function person(ctx, u, IMG) {
  if (!IMG.person) return;
  const k = springU(u, -0.75, { stiffness: 150, damping: 17 });
  if (k <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(IMG.person, PERSON.x + (1 - k) * 120, PERSON.y + (1 - k) * 1100);
  ctx.restore();
}

function logo(ctx, u, IMG) {
  if (!IMG.logo) return;
  const p = E.outQuint(prog(u, 5.1, 5.8));
  if (p <= 0) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(LOGO.x - 4, LOGO.y - 6, (IMG.logo.width + 8) * p, IMG.logo.height + 12); ctx.clip();
  ctx.drawImage(IMG.logo, LOGO.x - (1 - p) * 50, LOGO.y);
  ctx.restore();
}

const images = { person: 'assets/person.png', logo: 'assets/logo.png' };
BARS.forEach(([id]) => { images['bar' + id] = `assets/bar_${id}.png`; });

M.film({
  fonts: [font(50, 600, BOLD), font(32, 400, REG)],
  images,
  hits: HITS,
  draw(ctx, u, t, IMG) {
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
    floorShadow(ctx, u);
    bars(ctx, u, IMG);
    person(ctx, u, IMG);
    logo(ctx, u, IMG);
    pill(ctx, u);
    typed(ctx, u);
    body(ctx, u);
  },
  // the reading hold is a still: skip motion-blur sub-frames once everything has settled
  samples: (t) => (t > 4.6 ? 1 : 16),
});
