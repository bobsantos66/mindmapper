// Quem convence o lojista a ficar?: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// Timing is in beats (u) on the measured grid (96 bpm, 1 beat = 0.625 s). docs/shotlist.md is the plan.
// The last frames reproduce the original cover (assets/src/capa.jpg) element for element.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, wobble, font, layout, glyph, rrect, kf, mix, TAU } = M;

const C = { ink: '#0A0A0A', paper: '#FFFFFF', grey: '#B4B4B4', faint: '#E3E3E3', foot: '#A3A3A3' };
const DISPLAY = 'Display', UI = 'UI';

const HITS = [
  [0, 'Quem', 'impact'],
  [1, 'convence', 'pop', { pitch: 'A5' }],
  [2, 'o lojista', 'pop', { pitch: 'C6' }],
  [2.5, 'a ficar', 'pop', { pitch: 'D6' }],
  [3, '?', 'thud'],
  [4, 'Belo Horizonte', 'click'],
  [4.75, 'Rio de Janeiro', 'click'],
  [5.5, 'Porto Alegre', 'click'],
  [6.25, 'Salvador', 'click'],
  [7, 'Recife', 'click'],
  [8, 'CDL de Fortaleza', 'thud'],
  [9, 'others recede', 'sub', { len: 0.6 }],
  [10, 'pill morphs', 'whoosh', { len: 0.4 }],
  [13.75, 'pill to cover', 'whoosh', { len: 0.3, from: 1800, to: 900 }],
  [11.9, 'blade slides', 'whoosh', { len: 0.35, from: 2400, to: 600 }],
  [12, 'blade lands', 'thud'],
  [14.25, 'logo', 'tick'],
  [15, 'Quem convence', 'pop', { pitch: 'D5' }],
  [16, 'o lojista a ficar?', 'pop', { pitch: 'A5' }],
  [18, 'sub 1', 'tick'],
  [18.5, 'sub 2', 'tick'],
  [19, 'sub 3', 'tick'],
  [20, 'footer', 'bell', { pitch: 'D6' }],
];

// ---------------------------------------------------------------- cover geometry (measured on capa.jpg)
const SPR = { x: 1080, y: 236 };             // sail/blade sprite origin on the cover
const SHADOW = { x: 1050, y: 800 };
const PILL = { x: 220, y: 281, w: 615, h: 46 };
const LOGO = { x: 218, y: 216 };
const COV = {};                              // fitted sizes + baselines, filled in init()

const TR = { h1: -0.05, ui: -0.045 };       // the cover's type is set tight
function fitted(ctx, str, weight, family, width, tr = 0) {
  return (100 * width) / layout(ctx, str, font(100, weight, family), tr * 100).width;
}
function initCover(ctx) {
  COV.h1 = fitted(ctx, 'Quem convence', 700, DISPLAY, 815, TR.h1);
  const f1 = font(COV.h1, 700, DISPLAY);
  COV.l1 = { str: 'Quem convence', base: 384 + layout(ctx, 'Quem convence', f1, TR.h1 * COV.h1).asc };
  COV.l2 = { str: 'o lojista a ficar?', base: 504 + layout(ctx, 'o lojista a ficar?', f1, TR.h1 * COV.h1).asc };
  const subs = ['Como a CDL de Fortaleza argumenta a captação', 'de associados, comparada às CDLs de Belo Horizonte,', 'Rio de Janeiro, Porto Alegre, Salvador e Recife'];
  COV.sub = fitted(ctx, subs[1], 400, UI, 828, TR.ui);
  const fs = font(COV.sub, 400, UI);
  COV.subs = subs.map((str, i) => ({ str, base: [646, 691, 736][i] + layout(ctx, str, fs, TR.ui * COV.sub).asc }));
  const foot = 'Novembro de 2026 · Insights SG - nov/2025 a nov/2026';
  COV.foot = fitted(ctx, foot, 400, UI, 747, TR.ui);
  COV.footL = { str: foot, base: 961 + layout(ctx, foot, font(COV.foot, 400, UI), TR.ui * COV.foot).asc };
  COV.pillText = 'Análise competitiva de comunicação';
  COV.pill = fitted(ctx, COV.pillText, 400, UI, 562, TR.ui);
}

// ---------------------------------------------------------------- background: the cover's white with its grey floor band
function background(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  [[0, 255], [600, 254], [660, 250], [690, 243], [720, 236], [760, 232], [800, 235], [840, 244], [880, 252], [915, 255], [1080, 255]]
    .forEach(([y, v]) => g.addColorStop(y / H, `rgb(${v},${v},${v})`));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// A line of type whose words rise out of a mask on their own beats.
function maskLine(ctx, str, x, base, f, color, starts, cfg = SPRING.snappy, rise = 1.15, track = 0) {
  const L = layout(ctx, str, f, track);
  const u = ctx.__u;
  const words = str.split(' ');
  let gi = 0;
  ctx.save();
  ctx.beginPath(); ctx.rect(x - 20, base - L.asc - 30, L.width + 60, L.asc + L.desc + 50); ctx.clip();
  words.forEach((w, wi) => {
    const u0 = starts[Math.min(wi, starts.length - 1)];
    const p = springU(u, u0, cfg);
    const dy = (1 - p) * (L.asc + L.desc) * rise;
    for (let j = 0; j < w.length; j++, gi++) {
      const g = L.glyphs[gi];
      if (p > 0) glyph(ctx, g.ch, x + g.cx, base + dy, f, color);
    }
    gi++; // the space
  });
  ctx.restore();
}

// ---------------------------------------------------------------- S1 the question, huge   (u 0..4.2)
const S1 = [
  { str: 'Quem', base: 250, u0: -0.3 },
  { str: 'convence', base: 475, u0: 0.75 },
  { str: 'o lojista', base: 700, u0: 1.75 },
  { str: 'a ficar', base: 925, u0: 2.25 },
];
function sceneQuestion(ctx, u) {
  const size = 236, f = font(size, 700, DISPLAY), x0 = 200;
  S1.forEach((ln, i) => {
    const L = layout(ctx, ln.str, f, TR.h1 * size);
    const exit = E.inBack(prog(u, 3.75 + i * 0.05, 4.1 + i * 0.05), 1.6);
    L.glyphs.forEach((g, j) => {
      if (g.ch === ' ') return;
      const k = springU(u, ln.u0 + j * 0.035, SPRING.bouncy);
      if (k <= 0) return;
      const y = ln.base + (1 - k) * 200 - exit * 1200;
      glyph(ctx, g.ch, x0 + g.cx, y, f, C.ink, 1, clamp(0.6 + 0.4 * k, 0, 1.2));
    });
    if (i === 3) {
      // the question mark drops in on beat 3 with weight, and falls away on beat 4
      const qk = springU(u, 2.72, SPRING.bouncy);
      if (qk > 0) {
        const qx = x0 + L.width + 72;
        const fall = E.inQuad(prog(u, 3.85, 4.2));
        const sq = 0.18 * wobble(u - 3, 2.6, 5);
        const y = ln.base - (1 - qk) * 900 + fall * 900;
        glyph(ctx, '?', qx, y, f, C.ink, 1 + sq, 1 - sq, fall * 0.5);
      }
    }
  });
}

// ---------------------------------------------------------------- S2 the six CDLs   (u 3.8..10.8)
const CITIES = ['Belo Horizonte', 'Rio de Janeiro', 'Porto Alegre', 'Salvador', 'Recife'];
const CITY_U = [3.8, 4.6, 5.3, 6.05, 6.8];
const ROW = { x: 220, base0: 190, step: 140, size: 120 };
const FPILL = { x: 220, base: 935, h: 166, size: 120, pad: 58, str: 'CDL de Fortaleza' };
function sceneCities(ctx, u) {
  const f = font(ROW.size, 700, DISPLAY);
  const recede = E.inOutCubic(prog(u, 9, 9.5));
  CITIES.forEach((c, i) => {
    const k = springU(u, CITY_U[i], SPRING.snappy);
    if (k <= 0) return;
    const dir = i % 2 ? 1 : -1;
    const exit = E.inBack(prog(u, 9.7 + i * 0.07, 10.25 + i * 0.07), 1.3);
    const x = ROW.x + dir * (1 - k) * 1500 - exit * 1900;
    const y = ROW.base0 + i * ROW.step - recede * 14;
    const col = mix(C.grey, C.faint, recede);
    const L = layout(ctx, c, f, TR.h1 * ROW.size);
    L.glyphs.forEach((g) => glyph(ctx, g.ch, x + g.cx, y, f, col));
  });
}

// The pill: born as "CDL de Fortaleza", becomes the cover's "Análise competitiva de comunicação".
function pill(ctx, u) {
  const born = springU(u, 7.75, SPRING.bouncy);
  if (born <= 0) return;
  const fF = font(FPILL.size, 700, DISPLAY);
  const LF = layout(ctx, FPILL.str, fF, TR.h1 * FPILL.size);
  const A = { x: FPILL.x, y: FPILL.base - FPILL.h * 0.69, w: LF.width + FPILL.pad * 2, h: FPILL.h };
  const bs = 54, fB = font(bs, 400, UI), LB = layout(ctx, COV.pillText, fB, TR.ui * bs);
  const B = { x: 220, y: 432, w: LB.width + 76, h: 96 };
  const m1 = springU(u, 10, SPRING.gentle);           // A -> B: Fortaleza becomes the study
  const m2 = springU(u, 13.6, SPRING.gentle);         // B -> cover pill
  const pulse = u >= 9 ? 1 + 0.035 * wobble(u - 9, 2, 4) : 1;
  const geo = (k) => lerp(lerp(A[k], B[k], m1), PILL[k], m2);
  let x = geo('x'), y = geo('y'), w = geo('w'), h = geo('h') * pulse;
  if (u < 9.5) w = A.w * clamp(born, 0, 1.2);
  y -= (h - geo('h')) / 2;
  ctx.save();
  rrect(ctx, x, y, Math.max(h, w), h, h / 2); ctx.fillStyle = C.ink; ctx.fill();
  ctx.clip();
  const out = E.inOutCubic(prog(u, 10.0, 10.45));
  const inn = springU(u, 10.3, SPRING.snappy);
  if (out < 1) {
    const L1 = LF, tx = x + FPILL.pad, base = y + h * 0.69 - out * h;
    L1.glyphs.forEach((g) => glyph(ctx, g.ch, tx + g.cx, base, fF, C.paper));
  }
  if (inn > 0) {
    const s = lerp(bs, COV.pill, m2), fp = font(s, 400, UI);
    const L2 = layout(ctx, COV.pillText, fp, TR.ui * s);
    const tx = x + (w - L2.width) / 2, base = y + h / 2 + L2.asc / 2 - 1 + (1 - inn) * h;
    L2.glyphs.forEach((g) => glyph(ctx, g.ch, tx + g.cx, base, fp, C.paper));
  }
  ctx.restore();
}

// ---------------------------------------------------------------- S3 the SG mark   (u 10.3..)
function mark(ctx, u, IMG) {
  const rise = springU(u, 10.3, SPRING.gentle);
  if (rise <= 0) return;
  const float = 7 * Math.sin((TAU * (u - 14)) / 8) * E.inOutSine(prog(u, 13, 17));
  const dolly = 1.06 * (1 / 1.06) ** E.inOutSine(prog(u, 11, 21));   // log-space settle onto the cover framing
  const pivot = [1400, 560];
  // floor shadow: tighter and darker as the mark comes down to rest
  if (IMG.shadow) {
    const a = clamp(rise, 0, 1) * (1 - Math.abs(float) / 40);
    ctx.save(); ctx.globalAlpha = a;
    const sx = 0.7 + 0.3 * clamp(rise, 0, 1);
    ctx.translate(pivot[0], SHADOW.y + 50); ctx.scale(sx * dolly, 1); ctx.translate(-pivot[0], -(SHADOW.y + 50));
    ctx.drawImage(IMG.shadow, SHADOW.x, SHADOW.y);
    ctx.restore();
  }
  ctx.save();
  M.zoomAbout(ctx, dolly, pivot[0], 800);
  // sail: rises from below, turning back to rest
  if (IMG.sail) {
    ctx.save();
    ctx.translate(pivot[0], pivot[1] + (1 - rise) * 820 + float);
    ctx.rotate((1 - rise) * 0.16);
    ctx.translate(-pivot[0], -pivot[1]);
    ctx.drawImage(IMG.sail, SPR.x, SPR.y);
    ctx.restore();
  }
  // blade: whips in from the left and seats under the sail with a squash
  const bk = springU(u, 11.55, SPRING.snappy);
  if (IMG.blade && bk > 0) {
    const q = 0.06 * wobble(u - 12, 2.8, 6);
    ctx.save();
    ctx.translate(-(1 - bk) * 1700, float * 0.85);
    ctx.translate(1390, 800); ctx.scale(1 - q, 1 + q); ctx.translate(-1390, -800);
    ctx.drawImage(IMG.blade, SPR.x, SPR.y);
    ctx.restore();
  }
  ctx.restore();
}

function logo(ctx, u, IMG) {
  if (!IMG.logo) return;
  const p = E.outQuint(prog(u, 14.1, 14.75));
  if (p <= 0) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(LOGO.x - 4, LOGO.y - 4, (IMG.logo.width + 8) * p, IMG.logo.height + 8); ctx.clip();
  ctx.drawImage(IMG.logo, LOGO.x - (1 - p) * 40, LOGO.y);
  ctx.restore();
}

// ---------------------------------------------------------------- S4/S5 the cover assembles   (u 15..)
function coverText(ctx, u) {
  ctx.__u = u;
  const f1 = font(COV.h1, 700, DISPLAY);
  if (u > 14.7) maskLine(ctx, COV.l1.str, 220, COV.l1.base, f1, C.ink, [14.8, 15.1], SPRING.snappy, 1.15, TR.h1 * COV.h1);
  if (u > 15.7) maskLine(ctx, COV.l2.str, 220, COV.l2.base, f1, C.ink, [15.8, 15.95, 16.1, 16.25], SPRING.snappy, 1.15, TR.h1 * COV.h1);
  const fs = font(COV.sub, 400, UI);
  COV.subs.forEach((s, i) => {
    const u0 = 17.85 + i * 0.5;
    if (u > u0) maskLine(ctx, s.str, 220, s.base, fs, C.ink, [u0], SPRING.snappy, 1.4, TR.ui * COV.sub);
  });
  if (u > 19.85) maskLine(ctx, COV.footL.str, 220, COV.footL.base, font(COV.foot, 400, UI), C.foot, [19.85], SPRING.snappy, 1.4, TR.ui * COV.foot);
  ctx.__u = undefined;
}

M.film({
  fonts: [font(100, 700, DISPLAY), font(40, 400, UI)],
  images: { sail: 'assets/sg_sail.png', blade: 'assets/sg_blade.png', shadow: 'assets/sg_shadow.png', logo: 'assets/sg_logo.png' },
  hits: HITS,
  init(ctx) { initCover(ctx); },
  draw(ctx, u, t, IMG) {
    background(ctx);
    if (u < 4.4) sceneQuestion(ctx, u);
    if (u >= 3.7 && u < 11) sceneCities(ctx, u);
    mark(ctx, u, IMG);
    logo(ctx, u, IMG);
    pill(ctx, u);
    coverText(ctx, u);
  },
});
