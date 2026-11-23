// "Áp tai xuống đường ray" — option 2 (2026-11-09): RicksClips-style lit 3D world with true 3D stick people (stickrig on the
// Mixamo Xbot, white round heads, drawn faces), every shot moving, dissolves between shots, one-word captions mid-frame.
// index.html?w=1080&h=1920 ; window.frame(t) → jpeg dataURL ; timings from film/words.json + film/lines.json (voice by option 1).
import * as THREE from 'three';
import { makeStickRig } from './stickrig.js';
import { makePost } from './post.js';
import { buildWorld, H, RAILTOP } from './world.js';

const Q = new URLSearchParams(location.search);
const WW = +(Q.get('w') || 540), HH = +(Q.get('h') || 960);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eio = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const vl = (a, b, k) => a.clone().lerp(b, k);
for (const [fam, url] of [['Anton', './film/Anton.ttf'], ['InterB', './film/Inter-Black.otf']]) { const f = new FontFace(fam, `url(${url})`); await f.load(); document.fonts.add(f); }

// ---------- timing (words.json [{w,start,end}] + lines.json; placeholder until the voice arrives) ----------
const getJ = async u => { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } };
let WORDS = await getJ('./film/words.json'), LINES = await getJ('./film/lines.json');
if (!WORDS || !LINES) { WORDS = await getJ('./film/ph_words.json'); LINES = await getJ('./film/ph_lines.json'); }
if (LINES.lines) LINES = LINES.lines; if (WORDS.words) WORDS = WORDS.words;
const FL = LINES.map(l => ({ start: l.start, end: l.end, text: l.text, words: [] }));
for (const w of WORDS) { let i = FL.findIndex(l => w.start >= l.start - 0.06 && w.start < l.end + 0.06); if (i < 0) { let best = 0, bd = 1e9; FL.forEach((l, k) => { const d = Math.min(Math.abs(w.start - l.start), Math.abs(w.start - l.end)); if (d < bd) { bd = d; best = k; } }); i = best; }
  FL[i].words.push({ w: w.w ?? w.word, t: w.start, e: w.end }); }
const norm = s => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\d-]/gu, '');
const wt = (li, word, nth = 0) => { const ws = FL[li].words.filter(x => norm(x.w).startsWith(word)); return ws[nth] ? ws[nth].t : FL[li].start; };
const we = (li, word, nth = 0) => { const ws = FL[li].words.filter(x => norm(x.w).startsWith(word)); return ws[nth] ? ws[nth].e : FL[li].end; };
const L = i => FL[i].start, E = i => FL[i].end;
const DUR = L(13) - 0.02;   // follow outro dropped (user 2026-11-10)
const talking = (li, t, a = -1, b = 1e9) => FL[li].words.some(w => w.t >= a && w.t < b && t >= w.t && t < w.t + Math.max(0.09, (w.e - w.t) * 0.6));

// ---------- renderer, light ----------
const canvas = document.createElement('canvas'); canvas.width = WW; canvas.height = HH; document.body.appendChild(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setSize(WW, HH, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(45, WW / HH, 0.03, 6000);
const hemi = new THREE.HemisphereLight('#cfe4ff', '#8fb86a', 1.25); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d4', 3.1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; scene.add(sun, sun.target);
const SUNDIR = V(-0.45, 0.75, 0.48).normalize();
const SR = await makeStickRig(scene, './assets/rigs/Xbot.glb'); SR.setInkRes(WW, HH);
const W = buildWorld(scene, SR);
const post = makePost({ renderer, scene, camera, W: WW, H: HH });
const U = post.grade.uniforms;
const DUSK = { exp: 1.0, sat: 1.0, warm: 0.12, teal: 0.2, con: 1.1, sun: '#ffaf80', si: 2.6, hemi: 1.15, dir: V(-0.72, 0.2, 0.62), mul: [1.02, 0.95, 1.0], fog: '#a08fa6', rim: '#ff9a6a' };
// bright cartoon day like the "Nghe tàu tới" test (owner 2026-11-10: "làm lại màu sắc theo cái này"); DUSK kept for reference
const DAY = { exp: 1.0, sat: 1.12, warm: 0.02, teal: 0.0, con: 1.05, sun: '#fff7e6', si: 3.0, hemi: 1.45, dir: V(-0.45, 0.8, 0.45), mul: [1.0, 1.0, 1.0], fog: '#cfe6fa', rim: '#ffffff' };
const LOOKS = { day: DAY, gold: DAY };
function setLook(n) { const l = LOOKS[n]; renderer.toneMappingExposure = l.exp; U.uSat.value = l.sat; U.uWarm.value = l.warm; U.uTeal.value = l.teal; U.uCon.value = l.con; U.uVig.value = 0.82; U.uMul.value.set(...l.mul);
  sun.color.set(l.sun); sun.intensity = l.si; hemi.intensity = l.hemi; SUNDIR.copy(l.dir).normalize(); scene.fog.color.set(l.fog); SR.RIM.col.value.set(l.rim); }
post.bloomPass.threshold = 0.95; post.bloomPass.strength = 0.3;

// ---------- faces (canvas decals, drawn in ink on the white head) ----------
const IK = '#17141a', WH = '#fbf7ef', PU = '#17141a';   // white heads like RicksClips (user 2026-11-10, after a black-head try)
const EX = 82, LW = 26;   // eyes close together like the RicksClips reference (2026-11-10 compare)   // eyes closer like RicksClips (was 200)
const dotsRing = (g, px = 0, py = 0, r = 1) => { for (const sd of [-1, 1]) { g.fillStyle = WH; g.strokeStyle = IK; g.lineWidth = 18; g.beginPath(); g.ellipse(sd * 150, -6, 72 * r, 80 * r, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = PU; g.beginPath(); g.arc(sd * 150 + px * 22, 4 + py * 22, 30 * r, 0, 7); g.fill(); } }; const dots = (g, px = 0, py = 0, r = 1) => { g.fillStyle = IK; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * EX + px * 20, py * 20, 24 * r, 30 * r, 0, 0, 7); g.fill(); g.fillStyle = WH; g.beginPath(); g.arc(sd * EX + px * 20 + 7, py * 20 - 10, 0.1 * r, 0, 7); g.fill(); g.fillStyle = IK; } };
const ringEyes = (g, pr = 22) => { for (const sd of [-1, 1]) { g.fillStyle = WH; g.strokeStyle = IK; g.lineWidth = 20; g.beginPath(); g.ellipse(sd * EX, -6, 68, 82, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = PU; g.beginPath(); g.arc(sd * EX, 0, pr, 0, 7); g.fill(); } };
const brows = (g, tilt = 0, y = -112, lw = 40) => { lw *= 0.85; g.strokeStyle = IK; g.lineWidth = lw; g.lineCap = 'round'; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 125, y + tilt * 34); g.quadraticCurveTo(sd * 200, y - 16 - tilt * 2, sd * 275, y - tilt * 34); g.stroke(); } };
const mSmile = (g, w = 70, y = 205, d = 0.5) => { g.strokeStyle = IK; g.lineWidth = LW; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y + w * d * 2, w, y); g.stroke(); };
const mFlat = (g, w = 55, y = 215) => { g.strokeStyle = IK; g.lineWidth = LW; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y - 8, w, y); g.stroke(); };
const mFrownS = g => { g.strokeStyle = IK; g.lineWidth = 15; g.beginPath(); g.moveTo(-22, 100); g.quadraticCurveTo(2, 84, 26, 102); g.stroke(); };   // small deadpan frown (ref image 1)
const mFrown = (g, w = 60, y = 225) => { g.strokeStyle = IK; g.lineWidth = LW; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y - 45, w, y); g.stroke(); };
const mOpen = (g, w = 80, h = 95, y = 185, tongue = true) => { w *= 0.75; h *= 0.8; g.fillStyle = '#5c1212'; g.strokeStyle = IK; g.lineWidth = 14; g.beginPath(); g.moveTo(-w, y - 10); g.quadraticCurveTo(0, y - 24, w, y - 10); g.quadraticCurveTo(w * 0.8, y + h, 0, y + h); g.quadraticCurveTo(-w * 0.8, y + h, -w, y - 10); g.fill(); g.stroke(); tongue = true;
  if (tongue) { g.save(); g.clip(); g.fillStyle = '#ef3b3b'; g.beginPath(); g.ellipse(0, y + h, w * 0.55, h * 0.45, 0, 0, 7); g.fill(); g.restore(); } };
const mO = (g, r = 30, y = 225) => { g.strokeStyle = IK; g.lineWidth = 24; g.beginPath(); g.ellipse(0, y, r, r * 1.2, 0, 0, 7); g.stroke(); };
const mWavy = (g, y = 225) => { g.strokeStyle = IK; g.lineWidth = 24; g.beginPath(); for (let i = 0; i <= 6; i++) g.lineTo(-72 + i * 24, y + (i % 2 ? -13 : 13)); g.stroke(); };
const happyEyes = g => { g.strokeStyle = IK; g.lineWidth = 30; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * EX - 55, 12); g.quadraticCurveTo(sd * EX, -58, sd * EX + 55, 12); g.stroke(); } };
const lidEyes = g => { for (const sd of [-1, 1]) { g.save(); g.beginPath(); g.rect(sd * EX - 60, -78, 120, 120); g.clip(); g.fillStyle = IK; g.beginPath(); g.ellipse(sd * EX + 3, -70, 27, 32, 0, 0, 7); g.fill(); g.restore();
  g.strokeStyle = IK; g.lineWidth = 14; g.beginPath(); g.moveTo(sd * EX - 36, -78); g.quadraticCurveTo(sd * EX, -84, sd * EX + 38, -76); g.stroke(); } };   // black oval under a flat heavy lid (ref image 1)
const nose = g => {}; const noseOld = g => { g.strokeStyle = IK; g.lineWidth = 18; g.beginPath(); g.moveTo(-14, 95); g.quadraticCurveTo(10, 130, -18, 140); g.stroke(); };
const cheeks = (g, a = 0.32) => {}; const cheeksOld = (g, a = 0.32) => { a *= 0.8; const gr = (x) => { const rg = g.createRadialGradient(x, 115, 5, x, 115, 75); rg.addColorStop(0, `rgba(150,110,120,${a})`); rg.addColorStop(1, 'rgba(150,110,120,0)'); return rg; }; for (const sd of [-1, 1]) { g.fillStyle = gr(sd * 265); g.beginPath(); g.ellipse(sd * 265, 115, 80, 50, 0, 0, 7); g.fill(); } };
const sweat = g => { g.fillStyle = '#6cc3ff'; g.strokeStyle = IK; g.lineWidth = 8; g.beginPath(); g.moveTo(330, -200); g.quadraticCurveTo(372, -110, 330, -95); g.quadraticCurveTo(288, -110, 330, -200); g.fill(); g.stroke(); };
const FACES = {
  calm: g => { lidEyes(g); g.lineWidth = 0; mFrownS(g); },   // RicksClips deadpan (reference image 1)
  talk: g => { cheeks(g, 0.22); dots(g); brows(g, 0.05); nose(g); mOpen(g, 52, 62, 195, false); },
  wide: g => { cheeks(g, 0.15); ringEyes(g, 20); brows(g, -0.5, -150, 34); mO(g, 26, 235); },
  shout: g => { cheeks(g, 0.35); dots(g, 0, 0, 0.85); brows(g, 0.7, -108); mOpen(g, 95, 115, 175); },
  listen: g => { cheeks(g, 0.2); lidEyes(g); brows(g, 0.5, -84); nose(g); mFlat(g, 34); },
  serious: g => { cheeks(g, 0.18); lidEyes(g); brows(g, 0.45, -88); nose(g); mFlat(g, 50); },
  serioust: g => { cheeks(g, 0.18); lidEyes(g); brows(g, 0.45, -88); nose(g); mOpen(g, 45, 48, 200, false); },
  laugh: g => { cheeks(g, 0.45); happyEyes(g); brows(g, -0.25, -120, 34); mOpen(g, 90, 105, 165); },
  smug: g => { cheeks(g, 0.3); lidEyes(g); brows(g, 0.2, -86); g.strokeStyle = IK; g.lineWidth = LW; g.beginPath(); g.moveTo(-55, 205); g.quadraticCurveTo(10, 240, 75, 180); g.stroke(); },
  smugt: g => { cheeks(g, 0.3); lidEyes(g); brows(g, 0.2, -86); mOpen(g, 60, 70, 190, true); },
  flat: g => { cheeks(g, 0.15); dots(g, 0, 0.2, 0.9); brows(g, -0.15); mFlat(g, 40); },
  pale: g => { ringEyes(g, 18); brows(g, -0.55, -152, 32); mWavy(g); sweat(g); },
  palet: g => { ringEyes(g, 18); brows(g, -0.55, -152, 32); mOpen(g, 55, 80, 190, false); sweat(g); },
  squint: g => { cheeks(g, 0.2); g.strokeStyle = IK; g.lineWidth = 30; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * EX - 55, 6); g.lineTo(sd * EX + 55, 0); g.stroke(); } brows(g, 0.4, -70); nose(g); mFrown(g); },
  grin: g => { cheeks(g, 0.4); dots(g); brows(g, -0.2, -125); nose(g); mSmile(g, 85, 190, 0.6); },
};
const moust = g => { g.fillStyle = IK; g.beginPath(); g.moveTo(-10, 150); g.quadraticCurveTo(-90, 140, -130, 215); g.quadraticCurveTo(-80, 175, -10, 182); g.closePath(); g.fill(); g.beginPath(); g.moveTo(10, 150); g.quadraticCurveTo(90, 140, 130, 215); g.quadraticCurveTo(80, 175, 10, 182); g.closePath(); g.fill();
  g.strokeStyle = '#d8d0c4'; g.lineWidth = 26; g.beginPath(); g.moveTo(-40, 300); g.quadraticCurveTo(0, 360, 40, 300); g.stroke(); g.strokeStyle = IK; g.lineWidth = 10; g.beginPath(); g.moveTo(-58, 296); g.quadraticCurveTo(0, 385, 58, 296); g.stroke(); };
// every face stroke ×1.5 (owner 2026-11-10: "đường nét vẽ mặt nó to đậm hơn")
const thick = (g, k) => new Proxy(g, { set(t, p, v) { t[p] = p === 'lineWidth' ? v * k : v; return true; }, get(t, p) { const v = t[p]; return typeof v === 'function' ? v.bind(t) : v; } });
const FACE_K = 1.0;   // owner meant the head outline, not the features
const big = f => g => { g.translate(0, -24); g.scale(1.42, 1.22); f(thick(g, FACE_K)); };
const FT = {}, FTC = {}; for (const k in FACES) { FT[k] = SR.faceTex(big(FACES[k]), false, true); FTC[k] = SR.faceTex(big(g => { FACES[k](g); moust(g); }), false, true); }
function face(c, mood) { const T = c.opts.moust ? FTC : FT; c.faceMesh.material.map = T[mood] || T.calm; }

// ---------- cast ----------
const HEAD = '#ffffff';   // white heads, reference image 1 (2026-11-10 compare)   // cream-peach skin sampled from "Nghe tàu tới" (owner 2026-11-10: "màu khuôn mặt cũng ko phải màu trắng")   // white flat heads exactly like RicksClips (owner 2026-11-10: "cái đầu làm y như nó 100%")   // skin like the "Nghe tàu tới" test (owner 2026-11-10); was white #f5ede2
const mute = (h, k = 1.15) => { const c = new THREE.Color(h), o = {}; c.getHSL(o); c.setHSL(o.h, Math.min(1, o.s * k), Math.min(0.66, o.l * 1.22 + 0.05)); return '#' + c.getHexString(); };   // clothes pop (user 2026-11-10: was too dark)
const _build = SR.build; SR.build = (o, ...a) => _build(o.flatCloth ? o : { ...o, jacket: mute(o.jacket), jacket2: mute(o.jacket2) }, ...a);   // flat ref colours are used as is
const base = { headCol: HEAD, headR: 0.3, bodyW: 0.82, headInk: 0.004, headInkClean: true, capBack: true, inkPx: 4.5, headLift: 0.78, headFwd: 0.55, flatHead: true, bodyInk: 0.02, headShape: 'rround', roundBottom: true, limbK: 0.6, head: 'ball', face: () => {}, rick: true, shoe: '#111', sole: '#111', armCol: '#3a2418', legCol: '#2b2230', shoeCol: '#3a2b26', flatCloth: true, noodle: true, mitten: true };   // dark noodle limbs, white mittens, small dark shoes (RicksClips, owner 2026-11-10)
const thua = SR.build({ ...base, jacket: '#ee7a10', jacket2: '#b85a08', style: 'tunic', details: ['buttons'], btn: '#6a3208', pattern: ['plaid', '#c95f06'], hat: 'cap', hatCol: '#e43a2a', glasses: false });   // orange buttoned shirt + red cap (ref boy)
const chief = SR.build({ ...base, jacket: '#8a5634', jacket2: '#5e3a22', style: 'tunic', civil: true, details: ['buttons', 'belt'], btn: '#f1e3c4', beltCol: '#3a2416', pattern: ['pinstripe', '#c08a5a'], hat: 'nonla', moust: true });   // same head as Thừa (owner: the first one is the balanced one)
const ti = SR.build({ ...base, jacket: '#f2cf2c', jacket2: '#c9a516', style: 'tunic', details: ['collar'], collarCol: '#ee5d9f', pattern: ['dots', '#f39ac2'] });   // yellow + pink scarf (ref girl's colours)
const XC = [['#f39a1e', '#c87414', ['buttons', 'belt']], ['#f2cf2c', '#c9a516', ['buttons']], ['#e5483a', '#b02e24', ['belt', 'collar']], ['#2fb3a6', '#1f8379', ['buttons', 'belt']], ['#6cc04a', '#4a9431', ['pocket']],
  ['#9a6ad6', '#6e46a6', ['buttons', 'sash']], ['#f27fb2', '#c4558a', ['sash', 'belt']], ['#3f8de0', '#2a65a8', ['buttons']], ['#f6efe0', '#cfc4ad', ['pocket', 'belt']], ['#c9874a', '#94602f', ['buttons', 'collar']]];
const XP = [['stripes', '#ffffff'], ['zigzag', '#e0a60f'], ['stripes', '#f6d2c9'], ['plaid', '#16857a'], ['dots', '#3d8a24'], ['hstripes', '#c5a6ef'], ['plaid', '#ffffff'], ['pinstripe', '#bcd8f7'], ['hstripes', '#e7a54c'], ['dots', '#f6efe0']];
const XA = [['tie', '#1d3c8f'], ['bow', '#e8448a'], [], ['tie', '#f2cf2c'], ['bow', '#ffffff'], [], ['tie', '#c8352f'], ['bow', '#f2cf2c'], [], ['tie', '#2f6b3a']];   // ties / bow ties (RicksClips cast)
const ex = XC.map(([a, b, det], i) => SR.build({ ...base, jacket: a, jacket2: b, details: [...det, ...(XA[i][0] ? [XA[i][0]] : [])], tieCol: XA[i][1], pattern: XP[i], btn: '#d9a83a', knit: i % 3 === 2, style: 'tunic', civil: true, hat: i % 3 === 1 ? undefined : 'nonla' }));   // same head size/shape as Thừa (owner 2026-11-10: "resize về đúng với size của người đầu tiên")
const ALL = [thua, chief, ti, ...ex];
ALL.forEach(c => c.root.scale.setScalar(0.8));
ALL.forEach((c, i) => { c.phase = i * 0.37; c.root.rotation.order = 'YXZ'; face(c, 'calm'); c.tint = c.hm.material.uniforms.base.value.clone(); });

// ---------- pose helpers ----------
const UP = V(0, 1, 0);
const Lw = (c, x, y, z) => { c.root.updateMatrixWorld(true); return c.root.localToWorld(V(x, y, z)); };
const dirW = (c, x, y, z) => V(x, y, z).applyQuaternion(c.root.quaternion).normalize();
const arm = (c, s, target, hint) => SR.limb(c, s + 'Arm', s + 'ForeArm', s + 'Hand', target, hint || dirW(c, (s === 'Left' ? 1 : -1) * 0.7, -0.6, -0.3));
const leg = (c, s, target, hint) => SR.limb(c, s + 'UpLeg', s + 'Leg', s + 'Foot', target, hint || dirW(c, 0, 0.25, 1));
const gy = (x, z) => Math.abs(x) < 0.88 ? 0.2 : Math.abs(x) < 1.15 ? 0.1 : Math.max(0, H(x, z));
const HR = c => (c.opts.rick ? (c.opts.headR || 0.48) : 0.2) * c.root.scale.x, headC = c => c.head.getWorldPosition(new THREE.Vector3());
function place(c, x, z, ry = 0, y) { c.root.visible = true; c.root.rotation.set(0, ry, 0); c.root.position.set(x, y ?? gy(x, z), z); c.root.updateMatrixWorld(true); }
const yawTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
function idle(c, t, clip = 'idle') { SR.clipAt(c, clip, t + c.phase * 3); if (c.opts.rick && clip === 'idle') { const f = dirW(c, 0, 0, 1); SR.rotWorld(c.bone('LeftArm'), f, 0.5); SR.rotWorld(c.bone('RightArm'), f, -0.5); SR.rotWorld(c.bone('LeftForeArm'), f, -0.3); SR.rotWorld(c.bone('RightForeArm'), f, 0.3); } }
function hips(c, dy = 0, fwd = 0) { const h = c.bone('Hips'); const p = SR.wp(h).add(V(0, dy, 0)).add(dirW(c, 0, 0, 1).multiplyScalar(fwd)); h.position.copy(h.parent.worldToLocal(p)); h.updateMatrixWorld(true); }
const LEFT = c => dirW(c, 1, 0, 0);
function headTurn(c, yaw = 0, pitch = 0) { const hb = c.bone('Head'); if (yaw) SR.rotWorld(hb, UP, yaw); if (pitch) SR.rotWorld(hb, LEFT(c), pitch); }
function waveArms(c, t, both = true) { const s = Math.sin(t * 10);
  const w = c.opts.rick ? 0.75 : 0.42, hy = c.opts.rick ? 2.1 : 1.95;
  arm(c, 'Left', Lw(c, w + 0.12 * s, hy + 0.06 * s, 0.12), dirW(c, 1, 0.2, -0.5));
  if (both) arm(c, 'Right', Lw(c, -w + 0.12 * s, hy - 0.06 * s, 0.12), dirW(c, -1, 0.2, -0.5)); }
function wave1(c, t) { const s = Math.sin(t * 8); arm(c, 'Right', Lw(c, -0.45 + 0.12 * s, 1.85, 0.1), dirW(c, -1, -0.2, -0.3)); }
function laughPose(c, t) { const s = Math.abs(Math.sin((t + c.phase) * 11)); hips(c, -0.02 * s); SR.rotWorld(c.bone('Spine1'), LEFT(c), -0.12 - 0.1 * s); SR.rotWorld(c.bone('Head'), LEFT(c), -0.18 - 0.1 * s);
  arm(c, 'Left', Lw(c, 0.1, 1.02, 0.2), dirW(c, 1, 0, -0.2)); arm(c, 'Right', Lw(c, -0.08, 1.0 + 0.03 * s, 0.22), dirW(c, -1, 0, -0.2)); }
function pointAt(c, P, s = 'Right') { const sh = SR.wp(c.bone(s + 'Arm')); arm(c, s, sh.clone().add(P.clone().sub(sh).normalize().multiplyScalar(0.62)), dirW(c, s === 'Left' ? 1 : -1, -0.3, 0)); }
function shadeBrow(c) { const hc = headC(c); arm(c, 'Right', hc.clone().add(dirW(c, 0, 0, 1).multiplyScalar(0.24)).add(V(0, 0.12, 0)), dirW(c, -1, 0.3, 0)); }
function shove(c, P, k) { const sh = SR.wp(c.bone('Spine2')); const T = vl(sh.clone().add(P.clone().sub(sh).normalize().multiplyScalar(0.3)), P, k);
  SR.rotWorld(c.bone('Hips'), LEFT(c), 0.25 * k); arm(c, 'Left', T.clone().add(LEFT(c).multiplyScalar(0.1)), dirW(c, 1, -0.6, 0)); arm(c, 'Right', T.clone().add(LEFT(c).multiplyScalar(-0.1)), dirW(c, -1, -0.6, 0)); }
// lying prone with the lower ear on a rail at P (rail-top point); yaw = where the head points; roll ±1 = which ear down
function prone(c, P, yaw, roll = 1, k = 1, standAt = null, basis = null) {
  SR.reset(c); c.root.visible = true; c.root.rotation.set(0, 0, 0); c.root.position.set(0, 0, 0); c.root.updateMatrixWorld(true);
  const hc0 = headC(c), Lh = hc0.y, hy = P.y + HR(c) * 0.95, th = Math.asin(clamp((hy - 0.05) / Lh, 0, 0.9));
  const pitch = (Math.PI / 2 - th) * k; c.root.rotation.set(pitch, yaw, 0); c.root.updateMatrixWorld(true);
  const now = c.root.localToWorld(hc0.clone()); const tgt = V(P.x, hy, P.z);
  if (standAt) { const p0 = tgt.clone().sub(now); c.root.position.copy(vl(standAt, p0, k)); } else c.root.position.copy(tgt.sub(now));
  c.root.updateMatrixWorld(true);
  if (k > 0.01) { const Y = basis ? basis.Y.clone().normalize() : dirW(c, 0, 1, 0), Z = basis ? basis.Z.clone() : V(0, 0.8, -roll); Z.addScaledVector(Y, -Z.dot(Y)).normalize(); const X = Y.clone().cross(Z);
    const Qd = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)), Qc = c.head.getWorldQuaternion(new THREE.Quaternion()), Qt = Qc.slerp(Qd, k);
    const hb = c.bone('Head'), bw = Qt.multiply(c.head.quaternion.clone().invert()), pq = hb.parent.getWorldQuaternion(new THREE.Quaternion()).invert(); hb.quaternion.copy(pq.multiply(bw)); hb.updateMatrixWorld(true);
    if (basis) { const d = V(P.x, hy, P.z).sub(headC(c)).multiplyScalar(k); c.root.position.add(d); c.root.updateMatrixWorld(true); } }
  return { up: dirW(c, 0, 1, 0), fwd: dirW(c, 0, 0, 1) };
}
function proneArms(c, P, roll, phoneHand = false) { const ax = dirW(c, 0, 1, 0), lf = LEFT(c), hc = headC(c);
  // the arm on the ground side lies along the body; the other props on the sand / rail or holds a "phone" at the upper ear
  arm(c, 'Left', SR.wp(c.bone('LeftArm')).add(ax.clone().multiplyScalar(-0.15)).add(lf.clone().multiplyScalar(0.25)).setY(0.08), lf.clone().add(V(0, 0.5, 0)));
  if (phoneHand) { const T = hc.clone().add(V(0, 0.27, 0)).add(ax.clone().multiplyScalar(0.02)); arm(c, 'Right', T, lf.clone().negate().add(V(0, 0.4, 0)).add(ax.clone().multiplyScalar(-0.5))); }
  else arm(c, 'Right', P.clone().add(ax.clone().multiplyScalar(0.12)).add(V(0, 0.04, 0)), lf.clone().negate().add(V(0, 0.6, 0)));
}
// listening: propped prone on the ballast BESIDE the rail, body angled back along the track, the side of the head resting on the rail top,
// face toward fz (−1 = −z); side = which side of the rail the body lies (−1 = −x). k = 1 lying … 0 standing at standAt.
function listen(c, P, side, fz = -1, k = 1, standAt = null) { const F = V(-side * 0.55, 0, fz * 0.84).normalize(), r0 = HR(c);
  P = P.clone().add(V(side * r0 * 0.72, -r0 * 0.38, 0));   // head beside the rail top so the cheek/ear (not the chin) rests on the steel
  prone(c, P, Math.atan2(F.x, F.z), 0, k, standAt, { Y: V(-side * 0.7, 1, fz * 0.1), Z: V(-side * 0.1, 0.1, fz) }); }   // owner 2026-11-10 ref: head tilted ~35° onto the rail, face to the camera (was rolled 90°)
function listenArms(c, P, side, fz = -1, phone = false) { const hc = headC(c), r = HR(c);
  const onRail = V(P.x, RAILTOP + 0.035, P.z + fz * 0.42), ear = hc.clone().add(V(0, r * 1.02, 0)).add(V(0, 0, fz * r * 0.15));
  const dl = SR.wp(c.bone('LeftArm')).distanceTo(onRail), dr = SR.wp(c.bone('RightArm')).distanceTo(onRail), near = dl < dr ? 'Left' : 'Right', far = near === 'Left' ? 'Right' : 'Left';
  arm(c, near, onRail, V(-side * 0.6, 1, 0)); arm(c, far, phone ? ear.clone().add(V(0, 0.06, fz * 0.04)) : ear.clone().add(V(-side * 0.05, 0.02, fz * 0.1)), V(-side, 0.6, -fz * 0.4)); }
// get up: push up with the hands, a knee down, stand (u 0 → 1)
function getUp(c, P, side, fz, u, stand) { const k = 1 - eio(clamp(u / 0.85)); listen(c, P, side, fz, k, stand);
  if (k > 0.05) { for (const s2 of ['Left', 'Right']) { const sh = SR.wp(c.bone(s2 + 'Arm')); arm(c, s2, V(sh.x, 0.12, sh.z), V(0, 0, 1)); }
    if (k < 0.75) { const b = Math.sin(clamp((0.75 - k) / 0.7) * Math.PI); leg(c, 'Left', Lw(c, 0.12, 0.08 / c.root.scale.x, -0.4 * b), dirW(c, 0, -0.6, 1)); } } }
// sitting on the rail beside the pot: u in [0,1) = one ladle cycle (dip → lift → pour into the bowl → sit back); u = 1 → resting with the bowl
function sitOnRail(c, t, u = 1) { hips(c, -(SR.wp(c.bone('Hips')).y - (RAILTOP + 0.12)), -0.05); SR.rotWorld(c.bone('Spine'), LEFT(c), 0.1);
  const gy0 = 0.06 - c.root.position.y; leg(c, 'Left', Lw(c, 0.2, gy0 / c.root.scale.x, 0.55), dirW(c, 0, 0.6, 1)); leg(c, 'Right', Lw(c, -0.2, gy0 / c.root.scale.x, 0.55), dirW(c, 0, 0.6, 1));
  const potTop = W.pot.position.clone().add(V(0, 0.42, 0)), back = u >= 0.85 ? eio((u - 0.85) / 0.15) : 0;
  const bowl = vl(Lw(c, 0.28, 0.95, 0.62), Lw(c, 0.12, 1.15, 0.5), back); arm(c, 'Left', bowl.clone().add(V(0, -0.06, 0)), dirW(c, 1, -0.5, -0.2)); W.bowl.visible = true; W.bowl.position.copy(bowl).add(V(0, 0.04, 0));
  const k1 = clamp(u / 0.3), k2 = clamp((u - 0.3) / 0.2), k3 = clamp((u - 0.5) / 0.12), k4 = clamp((u - 0.62) / 0.23);
  let cup = potTop.clone().add(V(0, 0.3 - 0.3 * Math.sin(k1 * Math.PI * 0.5), 0)); if (u >= 0.3) cup = vl(potTop.clone(), potTop.clone().add(V(0, 0.45, 0)), eio(k2)); if (u >= 0.5) cup = vl(potTop.clone().add(V(0, 0.45, 0)), bowl.clone().add(V(0.03, 0.2, 0)), eio(k3));
  if (u >= 0.85) cup = vl(bowl.clone().add(V(0.03, 0.2, 0)), potTop.clone().add(V(-0.1, 0.06, 0)), back);
  const hand = Lw(c, -0.32, 1.0, 0.42).add(V(0, 0.06 * Math.sin(k2 * Math.PI), 0)); arm(c, 'Right', hand, dirW(c, -1, -0.4, -0.2));
  const L = W.ladle, d = cup.clone().sub(hand), len = d.length(); L.visible = true; L.position.copy(hand); L.quaternion.setFromUnitVectors(UP, d.normalize()); L.userData.h.scale.y = len; L.userData.cup.position.set(0, len, 0);
  const tilt = u >= 0.62 && u < 0.85 ? Math.sin(k4 * Math.PI) * 1.4 : 0; L.userData.cup.quaternion.copy(L.quaternion.clone().invert()); L.userData.cup.rotateZ(tilt);
  L.userData.fill.visible = (u >= 0.3 && u < 0.7) || u >= 0.85 && false; W.bowl.userData.fill.scale.setScalar(u < 0.62 ? 0.75 : u < 0.85 ? 0.75 + 0.25 * k4 : 1);
  W.stream.visible = u >= 0.64 && u < 0.82; if (W.stream.visible) { const top = cup.clone().add(V(0.05, 0, 0)), btm = bowl.clone().add(V(0, 0.02, 0)); W.stream.position.copy(top); W.stream.scale.y = top.distanceTo(btm); W.stream.quaternion.setFromUnitVectors(V(0, -1, 0), btm.sub(top).normalize()); } }
function pull(c, t, A, B, ph) { SR.pose(c, 'rope_pull', t, { rope: [A, B], phase: ph, lean: 30 }); }

// ---------- camp state ----------
const POT0 = V(1.42, 0, 1.25);
function camp(day = 1) {
  W.lan.position.set(0, 0, -4); W.lan.rotation.y = 0; W.cart.position.set(0, 0.0, 3.5); W.cart.rotation.y = 0; W.ox.position.set(-5.2, H(-5.2, 1.5), 1.5);
  W.pot.position.copy(POT0).setY(0.2); W.pot.rotation.set(0, 0, 0); W.pot.visible = true; W.porridge.visible = true; W.fire.position.copy(POT0).setY(0.02);
  if (day === 2) { W.lan.position.set(5.6, H(5.6, -3), -3); W.lan.rotation.y = 0.3; W.cart.position.set(-4.2, 0, 0.5); W.pot.position.set(3.4, 0.2, 1.2); W.fire.position.set(3.4, 0.02, 1.2); W.ox.position.set(-7, 0, 3); }
}
function fireSteam(t) { if (W.bowl.visible) W.steam.slice(4).forEach((s2, i) => { const a = ((t * 0.6 + i / 3) % 1); s2.visible = true; s2.position.copy(W.bowl.position).add(V(Math.sin(i * 2 + t) * 0.05 * a, 0.08 + a * 0.5, 0)); s2.scale.setScalar(0.3 + a * 0.9); s2.material.opacity = 0.45 * (1 - a); });
 W.flames.forEach((f, i) => { const s = 0.8 + 0.35 * Math.sin(t * 17 + i * 2.1) + 0.2 * Math.sin(t * 29 + i); f.scale.set(1, s, 1); f.position.y = 0.12 + s * 0.12; });
  W.steam.forEach((s, i) => { if (W.bowl.visible && i >= 4) return; const a = ((t * 0.55 + i / W.steam.length) % 1); s.visible = W.pot.visible && W.porridge.visible; s.position.copy(W.pot.position).add(V(Math.sin(i * 2.3 + t) * 0.1 * a, 0.4 + a * 1.1, Math.cos(i * 1.7) * 0.08 * a)); s.scale.setScalar(0.5 + a * 1.6); s.material.opacity = 0.5 * (1 - a); }); }
// train: front nose at zf (+z = toward the camp); smoke puffs from the stack at past positions (seek-safe)
function trainAt(zf, t, speed = 30) { W.trainAnim(zf, t, speed); }
function puffs(t, zfOf, rate = 0.1, life = 6, rise = 3.2) { const n = W.puffs.length, t0 = Math.floor(t / rate) * rate;
  W.puffs.forEach((p, k) => { const te = t0 - k * rate, age = t - te; if (age > life || age < 0) { p.visible = false; return; } const zf = zfOf(te);
    p.visible = true; const sx = Math.sin(k * 12.9898) * 0.5; p.position.set(sx * age * 0.6 + age * 0.8 + (k % 2 ? 0.5 : -0.5), 4.5 + age * rise - age * age * 0.18, zf - 4.2 + 0.9 - age * 0.6); p.scale.setScalar(0.45 + age * 0.75 + 0.15 * Math.sin(k)); }); }

// ---------- camera ----------
let focus = V(0, 1, 0), shadowR = 9;
function look(p, tg, fov = 45, roll = 0) { camera.position.copy(p); camera.up.set(0, 1, 0); camera.lookAt(tg); if (roll) camera.rotateZ(roll); camera.fov = fov; camera.aspect = WW / HH; camera.updateProjectionMatrix(); focus = tg.clone(); }
const hand = (t, a = 1) => V(Math.sin(t * 0.9) * 0.02 * a + Math.sin(t * 1.7 + 1) * 0.01 * a, Math.sin(t * 1.1 + 2) * 0.015 * a, 0);
let dofOn = null; const dof = (dist, a = 0.01) => { dofOn = [dist, a]; };

// ---------- shots ----------
const RAILL = -0.5, RAILR = 0.5;
const THUA_P = V(RAILL, RAILTOP, -14), THUA_YAW = Math.PI / 2;
const TI_P = V(RAILR, RAILTOP, -0.4), TI_YAW = Math.atan2(-0.35, 0.94);
const CAMPPOS = { chief: [1.3, -0.8], ti: [-1.5, 0.3], ex: [[-2.1, -1.9], [2.4, -1.5], [-0.9, -2.3], [2.6, 1.1], [-2.7, 1.5]] };
function campIdle(t, except = [], faceTo = null, mood = 'calm') {
  const set = (c, x, z) => { if (except.includes(c)) return; const ry = faceTo ? yawTo(x, z, faceTo.x, faceTo.z) : 0; place(c, x, z, ry); idle(c, t); face(c, mood); };
  set(chief, ...CAMPPOS.chief); set(ti, ...CAMPPOS.ti); CAMPPOS.ex.forEach((p, i) => set(ex[i], ...p)); }
const SHOTS = [];
const shot = (t0, fn, o = {}) => SHOTS.push({ t0, fn, ...o });
const STAND1 = V(-1.15, 0.1, -13.2), _q = new THREE.Quaternion(), earCam = (hc, d) => { const fd = V(0, 0, 1).applyQuaternion(thua.head.getWorldQuaternion(_q)); return hc.clone().add(fd.multiplyScalar(d)).add(V(-0.25 * d, 0.05 * d, 0)); };
// 1 — listening beside the rail (low camera along the rail), insert of the ear on the rail, eyes pop, gets up, shouts; the camp runs
const LS = -1, LF = -1, railCam = (hc, d, h = 0.32) => V(RAILL + 0.28, RAILTOP + h, hc.z + LF * d);
shot(0, (t) => { camp(); const u = clamp(t / 1.0); listen(thua, THUA_P, LS, LF); listenArms(thua, THUA_P, LS, LF); face(thua, 'listen');
  const hc = headC(thua), d = lerp(6.0, 4.6, eio(u)); look(V(RAILL + 0.3, RAILTOP + lerp(0.45, 0.6, u), hc.z + LF * d).add(hand(t, 0.5)), hc.clone().add(V(0.1, -0.05, 0.6)), 30, 0.35); dof(d, 0.01); shadowR = 6; });
shot(0.95, (t) => { camp(); listen(thua, THUA_P, LS, LF); listenArms(thua, THUA_P, LS, LF); face(thua, 'listen'); const hc = headC(thua), u = clamp((t - 0.95) / 0.85);
  W.grains.forEach((g, i) => { const z = THUA_P.z - 0.3 - i * 0.04, hop = Math.abs(Math.sin(t * (24 + (i % 5) * 3) + i * 1.7)) * (0.006 + (i % 4) * 0.004) * (0.4 + u); g.visible = i < 26; g.position.set(RAILL + Math.sin(i * 7.1) * 0.014, RAILTOP + 0.008 + hop, z); g.rotation.set(t * 9 + i, t * 7, 0); });
  const c0 = V(RAILL + 0.25, RAILTOP + 0.14, THUA_P.z - 3.2); look(c0.add(V(0, Math.sin(t * 60) * 0.002, lerp(0, 0.35, u))), V(RAILL - 0.1, RAILTOP + 0.15, THUA_P.z), 36); dof(3.0, 0.02); shadowR = 3; });
shot(1.8, (t) => { camp(); listen(thua, THUA_P, LS, LF); listenArms(thua, THUA_P, LS, LF); face(thua, t < 1.92 ? 'listen' : 'wide');
  const hc = headC(thua), u = clamp((t - 1.8) / 0.5); look(V(RAILL + 0.3, RAILTOP + 0.5, hc.z + LF * lerp(4.4, 3.9, u)).add(hand(t, 0.5)), hc.clone().add(V(0.1, -0.05, 0.5)), 30, 0.35); dof(2.6, 0.012); shadowR = 6; });
shot(wt(0, 'rồi') - 0.05, (t) => { camp(); const t0 = wt(0, 'rồi') - 0.05, u = (t - t0) / 0.75, stand = STAND1;
  if (u < 1) { getUp(thua, THUA_P, LS, LF, u, stand); face(thua, 'wide'); }
  else { place(thua, stand.x, stand.z, 0.25, 0.1); idle(thua, t); waveArms(thua, t); face(thua, 'shout'); thua.root.position.y += Math.abs(Math.sin((t - t0) * 7)) * 0.06; }
  const v = clamp((t - t0) / 1.4); look(V(lerp(0.9, 1.6, v), lerp(0.5, 1.15, v), lerp(-16.6, -17.6, v)), V(-0.9, lerp(0.55, 1.35, eio(clamp(u))), -13.3), 42); shadowR = 8; });
shot(wt(0, 'bỏ') - 0.05, (t) => { camp(); const t0 = wt(0, 'bỏ') - 0.05, u = t - t0;
  const runners = [chief, ti, ...ex.slice(0, 5)], pos = [[1.3, -0.8], [-1.5, 0.3], [-2.1, -1.9], [2.4, -1.5], [-0.9, -2.3], [2.6, 1.1], [-2.7, 1.5]];
  runners.forEach((c, i) => { const [x, z] = pos[i], sx = x >= 0 ? 1 : -1, ry = sx > 0 ? Math.PI / 2 - 0.25 : -Math.PI / 2 + 0.25; const run = Math.max(0, u - i * 0.05) * 2.0; place(c, x + sx * run * Math.cos(0.25), z + run * Math.sin(0.25) * 0.3, ry); SR.clipAt(c, 'run', u + i * 0.13); face(c, i % 2 ? 'pale' : 'wide'); });
  look(V(lerp(-1.0, -2.2, ease(u / 2)), lerp(3.2, 4.6, ease(u / 2)), lerp(9.5, 11, u / 2)), V(0, 0.6, -0.5), 48); shadowR = 12; });
// 2 — camera flies back along the rail: pot boiling, ox cart across the rail, lean-to on the rail; the flat line through the dunes
shot(L(1) - 0.12, (t) => { camp(); campIdle(t); place(thua, -1.0, 2.0, Math.PI); idle(thua, t); const u = clamp((t - L(1)) / (wt(1, 'đoàn') - L(1)));
  look(V(lerp(1.9, 1.2, u), lerp(0.75, 1.5, u), lerp(1.7, 3.6, eio(u))), POT0.clone().add(V(-0.3, 0.3, -1.2 * u)), 40); dof(lerp(1.0, 2.6, u), 0.012); shadowR = 7; });
shot(wt(1, 'đoàn') - 0.08, (t) => { camp(); campIdle(t); place(thua, -1.0, 2.0, Math.PI); idle(thua, t); const t0 = wt(1, 'đoàn') - 0.08, u = clamp((t - t0) / (wt(1, 'vì') - t0));
  look(V(lerp(2.9, -0.5, u), lerp(2.4, 5.5, eio(u)), lerp(6.2, 13.5, eio(u))), V(0, 0.9, lerp(-0.5, -3, u)), 44); shadowR = 10; });
shot(wt(1, 'vì') - 0.08, (t) => { camp(); campIdle(t); place(thua, -1.0, 2.0, Math.PI); idle(thua, t); const t0 = wt(1, 'vì') - 0.08, u = clamp((t - t0) / (E(1) + 0.3 - t0));
  look(V(lerp(9, 16, u), lerp(14, 30, eio(u)), lerp(22, 30, u)), V(0, 0, lerp(-6, -30, u)), 50); shadowR = 18; });
// 3 — chief shades his eyes at the empty horizon; turns to Thừa: "Tàu đâu? Khói đâu? Cậu ngủ mơ à?"
const CH3 = V(0.1, 0, -8.5), TH3 = V(-0.35, 0, -11.2);
shot(L(2) - 0.12, (t) => { camp(); campIdle(t, [chief], null); place(chief, CH3.x, CH3.z, Math.PI); idle(chief, t); shadeBrow(chief); face(chief, 'squint');
  place(thua, TH3.x, TH3.z, 0.1); idle(thua, t); face(thua, 'serious');
  const u = clamp((t - L(2)) / (wt(2, 'tàu') - L(2))); look(V(lerp(0.85, 0.6, u), 1.75, CH3.z + lerp(2.2, 1.5, u)).add(hand(t)), V(0.05, lerp(1.6, 1.4, u), -60), 40); shadowR = 8; });
shot(wt(2, 'tàu') - 0.08, (t) => { camp(); campIdle(t, [chief], TH3); place(chief, CH3.x, CH3.z, Math.PI + 0.1); idle(chief, t); const t0 = wt(2, 'tàu') - 0.08;
  if (t < wt(2, 'cậu') - 0.1) pointAt(chief, V(0.3, 2.4, -30), 'Left'); face(chief, talking(2, t) ? 'talk' : 'calm');
  place(thua, TH3.x, TH3.z, 0.1); idle(thua, t); face(thua, 'serious');
  const u = clamp((t - t0) / (E(2) - t0)); const a = Math.PI - lerp(0.8, 0.45, u); look(V(CH3.x + Math.sin(a) * 3.4, 1.45, CH3.z + Math.cos(a) * 3.4), V(0, 1.35, CH3.z), 38); dof(3.4, 0.01); shadowR = 7; });
// 4 — Thừa, close: "Dời lán. Ngay."
shot(L(3) - 0.12, (t) => { camp(); campIdle(t, [chief], TH3); place(chief, CH3.x, CH3.z, Math.PI + 0.1); idle(chief, t); face(chief, 'calm');
  place(thua, TH3.x, TH3.z, 0.15); idle(thua, t); face(thua, talking(3, t, wt(3, 'dời') - 0.01) ? 'serioust' : 'serious');
  const u = clamp((t - L(3)) / (E(3) + 0.2 - L(3))), hc = headC(thua); look(hc.clone().add(V(1.15, -0.05, lerp(2.6, 1.9, eio(u)))), hc.clone().add(V(0, -0.15, 0)), 34); dof(lerp(3.0, 2.1, eio(u)), 0.015); shadowR = 6; });
// 5 — the camp laughs; Tí lies down on the rail with his "phone"
const crowd5 = () => [[chief, -0.6, -0.9], [ti, 0.8, -0.6], [ex[0], -1.7, -1.6], [ex[1], 1.9, -1.4], [ex[2], 0.3, -2.2], [ex[3], -2.6, -0.4], [ex[4], 2.8, -0.2]];
shot(L(4) - 0.12, (t) => { camp(); place(thua, TH3.x, 2.0, Math.PI); idle(thua, t); face(thua, 'serious'); const cam = V(0, 1.6, 4.5);
  crowd5().forEach(([c, x, z]) => { place(c, x, z, yawTo(x, z, 0, 2)); idle(c, t); laughPose(c, t); face(c, 'laugh'); });
  const u = clamp((t - L(4)) / (wt(4, 'tí') - L(4))); look(V(lerp(-2.2, 1.6, u), lerp(1.3, 1.6, u), 4.6), V(lerp(-0.6, 0.6, u), 1.3, -1.2), 46); shadowR = 8; });
shot(wt(4, 'tí') - 0.08, (t) => { camp(); place(thua, TH3.x, 2.2, Math.PI); idle(thua, t); const t0 = wt(4, 'tí') - 0.08, u = clamp((t - t0) / (E(4) + 0.2 - t0));
  [[chief, -1.2, -2.4], [ex[0], -2.0, -1.7], [ex[2], 1.9, -2.6], [ex[3], -2.6, -0.4], [ex[4], -2.8, 1.2]].forEach(([c, x, z]) => { place(c, x, z, yawTo(x, z, 0.5, -0.4)); idle(c, t); laughPose(c, t); face(c, 'laugh'); });
  tiLying(talking(4, t, wt(4, 'a') - 0.01) ? 'smugt' : 'smug', true, t);
  const hc = headC(ti); look(V(lerp(2.9, 2.4, u), lerp(1.1, 0.95, u), lerp(1.3, 0.9, u)), hc.clone().add(V(-0.1, 0, -0.05)), 40); dof(hc.distanceTo(camera.position), 0.01); shadowR = 6;
  if (POSE) { const m = V(0.75, 0.5, -0.85); look(V(lerp(4.4, 4.0, eio(u)), lerp(1.9, 1.7, u), lerp(-0.7, -0.8, eio(u))), m, 45); dof(m.distanceTo(camera.position), 0.008); }
  if (Q.get('top')) { look(V(0.8, 7, -0.39), V(0.8, 0, -0.4), 70); dofOn = null; } });
// 6 — "Một phút": empty horizon; the chief ladles another bowl, sitting on the rail
const CH6 = V(RAILR, 0.1, 1.2);
const chiefSit = (t, u = 1) => { place(chief, CH6.x, CH6.z, Math.PI / 2, 0.1); SR.reset(chief); sitOnRail(chief, t, u); face(chief, 'calm'); };
const tiLying0 = (mood = 'smug', phone = true) => { listen(ti, TI_P, 1, 1); listenArms(ti, TI_P, 1, 1, phone); face(ti, mood); };
// ---- pose options for Tí on the rail (?pose=a|b|c; none = tiLying0). User 2026-11-10: "tư thế nằm sấp ko đẹp, cho 3 options"
const POSE = Q.get('pose') || '';
const nb = (x, y, z) => V(x, y, z).normalize();
// body: root axes → world (X = character's left, Y = up the spine, Z = chest); head: Y = top of head, Z = face; head centre ends at HP
function layBody(c, X, Y, HY, HZ, HP, bend) { SR.reset(c); c.root.visible = true; c.root.position.set(0, 0, 0);
  const Z = X.clone().cross(Y).normalize(), X2 = Y.clone().cross(Z).normalize();
  c.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X2, Y.clone().normalize(), Z)); c.root.updateMatrixWorld(true);
  if (bend) bend(c); c.root.updateMatrixWorld(true);
  const hz = HZ.clone().addScaledVector(HY, -HZ.dot(HY)).normalize(), hx = HY.clone().cross(hz).normalize();
  const Qd = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(hx, HY.clone().normalize(), hz));
  const hb = c.bone('Head'), bw = Qd.multiply(c.head.quaternion.clone().invert()), pq = hb.parent.getWorldQuaternion(new THREE.Quaternion()).invert(); hb.quaternion.copy(pq.multiply(bw)); hb.updateMatrixWorld(true);
  c.root.position.add(HP.clone().sub(headC(c))); c.root.updateMatrixWorld(true); }
const phoneAt = (c, out = 0.9, fwd = 0.5, b = 0) => { const q = c.head.getWorldQuaternion(new THREE.Quaternion()), X = V(1, 0, 0).applyQuaternion(q), Z = V(0, 0, 1).applyQuaternion(q), r = HR(c);
  if (X.y < 0) X.negate(); return headC(c).addScaledVector(X, r * out + b).addScaledVector(Z, r * fwd); };   // hand on the upper ear / cheek, toward the camera
const sh = (c, s) => SR.wp(c.bone(s + 'Arm')), hipW = (c, s) => SR.wp(c.bone(s + 'UpLeg'));
const tiPose = (mood = 'smug', t = 0) => { const c = ti, r = HR(c), P = TI_P, HP = V(P.x, P.y + r * 0.93, P.z), up = (x, z, h = 0.07) => gy(x, z) + h;
  // all three: head on the near rail (right ear down), face turned to +x where the camera is, body beside the rail running toward −z
  if (POSE === 'a') {   // A — on his right side, propped on the right forearm, left hand = phone on the upper ear, top knee bent
    layBody(c, nb(0, 1, 0), nb(-0.3, 0.28, 1), nb(-0.8, 0.12, 1), nb(1, 0.3, 0), HP, null);
    const R = sh(c, 'Right'), hc = headC(c), b = Math.sin(t * 3) * 0.01;
    arm(c, 'Right', V(R.x + 0.18, up(R.x + 0.18, R.z, 0.05), R.z + 0.12), V(0.2, -1, -0.4));
    arm(c, 'Left', phoneAt(c, 0.85, 0.55, b), V(1, 0.2, -0.6));
    const hr = hipW(c, 'Right'), hl = hipW(c, 'Left');
    leg(c, 'Right', V(hr.x + 0.04, up(hr.x, hr.z - 0.62), hr.z - 0.62), V(1, 0, 0));
    leg(c, 'Left', V(hl.x + 0.05, up(hl.x, hl.z - 0.4, 0.16), hl.z - 0.4), V(1, 0.3, 0.2));
  } else if (POSE === 'b') {   // B — on his back, head turned to camera with the right ear on the rail, left hand = phone, right hand on the belly, legs crossed (foot bobbing)
    layBody(c, nb(-1, 0, 0), nb(-0.3, 0.1, 1), nb(-0.8, 0.12, 1), nb(1, 0.45, 0), HP, null);
    const hc = headC(c), hr = hipW(c, 'Right'), hl = hipW(c, 'Left'), sp = SR.wp(c.bone('Spine1'));
    arm(c, 'Right', phoneAt(c, 0.7, 0.75), V(1, 0.6, -0.4));
    arm(c, 'Left', sp.clone().add(V(0.0, 0.14, -0.02)), V(-0.3, 1, 0));
    leg(c, 'Right', V(hr.x + 0.04, up(hr.x, hr.z - 0.42), hr.z - 0.42), V(0.3, 1, 0));
    const kn = SR.wp(c.bone('RightLeg')), bob = Math.sin(t * 6) * 0.04;
    leg(c, 'Left', kn.clone().add(V(0.12, 0.1 + bob, -0.12)), V(0.2, 1, 0.3));
  } else {   // C — kneeling with the bum in the air, leaning down to the rail, right ear on it, both hands cupped round the mouth
    layBody(c, nb(1, 0, 0), nb(-0.35, -0.5, 1), nb(-0.8, -0.1, 1), nb(1, 0.25, 0), HP, null);
    const hc = headC(c), hr = hipW(c, 'Right'), hl = hipW(c, 'Left');
    for (const [s2, hp] of [['Right', hr], ['Left', hl]]) leg(c, s2, V(hp.x + 0.02, up(hp.x, hp.z - 0.45, 0.05), hp.z - 0.45), V(0, -0.5, 1));
    const m = hc.clone().add(V(r * 0.95, -r * 0.2, 0.0)), pulse = Math.sin(t * 9) * 0.012;
    arm(c, 'Right', m.clone().add(V(0.03, -0.06, 0.07 + pulse)), V(0.5, -1, 0));
    arm(c, 'Left', m.clone().add(V(0.03, 0.04, 0.09 - pulse)), V(1, 0.5, 0));
  }
  face(c, mood); };
const tiLying = (mood = 'smug', phone = true, t = 0) => POSE ? tiPose(mood, t) : tiLying0(mood, phone);
shot(L(5) - 0.12, (t) => { camp(); campIdle(t, [chief, ti]); chiefSit(t); tiLying('smug', true, t); thua.root.visible = false; const u = clamp((t - L(5)) / (wt(5, 'ông') - L(5)));
  look(V(0.15, lerp(0.75, 1.1, u), lerp(-6.0, -9.0, u)), V(0, 1.0, -200), 34); shadowR = 8; });
shot(wt(5, 'ông') - 0.08, (t) => { camp(); campIdle(t, [chief, ti]); const t0 = wt(5, 'ông') - 0.08, u = clamp((t - t0) / (E(5) + 0.35 - t0)); chiefSit(t, Math.min(0.999, u * 1.05)); tiLying('smug', true, t); thua.root.visible = false;
  look(V(lerp(3.7, 3.25, eio(u)), lerp(1.55, 1.4, u), lerp(3.0, 2.65, eio(u))), V(1.0, 0.85, 1.05), 40); dof(lerp(3.6, 3.1, u), 0.006); shadowR = 6; });
// 7 — "Hai phút": Tí's smirk fades
shot(L(6) - 0.12, (t) => { camp(); campIdle(t, [chief, ti]); chiefSit(t); tiLying(t > wt(6, 'im') - 0.05 ? 'flat' : t > wt(6, 'tí') ? 'calm' : 'smug', true, t); thua.root.visible = false;
  const u = clamp((t - L(6)) / (E(6) + 0.2 - L(6))), hc = headC(ti); look(V(lerp(2.4, 1.85, eio(u)), lerp(0.95, 0.85, u), lerp(1.0, 0.6, eio(u))), hc.clone().add(V(-0.05, 0, -0.05)), 36); dof(hc.distanceTo(camera.position), 0.014); shadowR = 5;
  if (POSE) { const m = hc.clone().add(V(0.1, -0.08, -0.32)); look(V(lerp(2.9, 2.55, eio(u)), lerp(1.3, 1.15, u), lerp(-0.6, -0.65, eio(u))), m, 38); dof(m.distanceTo(camera.position), 0.012); } });
// 8 — Tí jumps up pale, points at the rail; macro of the rail: sand grains hopping
shot(L(7) - 0.12, (t) => { camp(); campIdle(t, [chief, ti], V(0.5, 0, -0.4)); chiefSit(t); thua.root.visible = false;
  const t0 = L(7) - 0.12, k = clamp((t - t0) / 0.7), stand = V(1.1, 0.1, -0.2);
  if (k < 1 && POSE) { if (k < 0.35) tiPose('pale', t); else { place(ti, stand.x, stand.z, -Math.PI / 2 - 0.3, 0.1 + Math.sin(clamp((k - 0.35) / 0.65) * Math.PI) * 0.22); idle(ti, t); } face(ti, 'pale'); }
  else if (k < 1) { getUp(ti, TI_P, 1, 1, k, stand); face(ti, 'pale'); } else { place(ti, stand.x, stand.z, -Math.PI / 2 - 0.3, 0.1); idle(ti, t); pointAt(ti, V(TI_P.x, 0.3, TI_P.z - 0.4)); face(ti, talking(7, t, wt(7, 'nó') - 0.01) ? 'palet' : 'pale'); }
  ti.hm.material.uniforms.base.value.set('#dcebe4');
  const u = clamp((t - t0) / 1.6); look(V(lerp(-1.4, -2.0, u), lerp(0.9, 1.4, u), lerp(2.6, 3.2, u)), V(0.8, lerp(0.7, 1.3, ease(k)), -0.4), 44); shadowR = 6; });
shot(wt(7, 'rung') - 0.3, (t) => { camp(); campIdle(t, [chief, ti]); chiefSit(t); thua.root.visible = false; place(ti, -0.1, -0.7, -Math.PI / 2 + 0.6, 0.2); idle(ti, t); face(ti, 'pale'); ti.hm.material.uniforms.base.value.set('#dcebe4');
  const t0 = wt(7, 'rung') - 0.3, u = t - t0;
  W.grains.forEach((g, i) => { const z = 2.2 - i * 0.045, hop = Math.abs(Math.sin(t * (22 + (i % 5) * 3) + i * 1.7)) * (0.012 + (i % 4) * 0.006); g.visible = true; g.position.set(RAILL + Math.sin(i * 7.1) * 0.015, RAILTOP + 0.01 + hop, z); g.rotation.set(t * 9 + i, t * 7, 0); });
  W.rails[0].position.y = Math.sin(t * 80) * 0.0015;
  look(V(RAILL + 0.22, RAILTOP + 0.09 + Math.sin(t * 70) * 0.002, lerp(2.5, 2.2, u / 1.5)), V(RAILL, RAILTOP + 0.02, 0.8), 30); dof(0.75, 0.04); shadowR = 3; });
// 9 — diagram: sound in steel vs in air (two lanes, Tí's hammer at the near end, Thừa's ear at the far end)
const Z9A = 60, Z9B = 24, STR = [L(8) + 0.25, L(8) + 1.75, L(8) + 3.25];
shot(L(8) - 0.12, (t) => { camp(); [chief, ...ex].forEach(c => c.root.visible = false);
  listen(thua, V(RAILL, RAILTOP, Z9B), LS, 1); listenArms(thua, V(RAILL, RAILTOP, Z9B), LS, 1);
  const ls = STR.filter(s => s <= t).pop(); const since = ls === undefined ? 9 : t - ls;
  const arrive = since > 0.3 && since < 1.1; face(thua, arrive ? 'wide' : 'calm');
  place(ti, RAILL - 0.55, Z9A + 0.5, Math.PI - 0.5); idle(ti, t); face(ti, 'grin');
  const sw = since < 0.25 ? 1 - since / 0.25 : clamp((since - 0.9) / 0.5); const hp = Lw(ti, -0.1, lerp(0.75, 1.45, sw), 0.45); arm(ti, 'Right', hp, dirW(ti, -1, -0.3, 0)); arm(ti, 'Left', hp.clone().add(V(0, -0.08, 0)), dirW(ti, 1, -0.3, 0));
  W.hammer.visible = true; W.hammer.position.copy(hp).add(V(0, -0.1, 0)); W.hammer.lookAt(V(RAILL, RAILTOP, Z9A)); W.hammer.rotateX(Math.PI / 2);
  // steel beads + air dots
  const sz = ls === undefined ? 1e9 : Z9A - since * 120, az = ls === undefined ? 1e9 : Z9A - since * 8;
  W.steelDots.forEach((d, i) => { const z = Z9A - i * 0.225; d.visible = z > Z9B; d.position.set(RAILL, RAILTOP + 0.06, z); const g = Math.exp(-((z - sz) ** 2) / 0.6); d.scale.setScalar(1 + g * 1.4); d.material.color.setRGB(0.85 + g * 3, 0.87 + g * 2.4, 0.9 + g * 0.3); });
  W.airDots.forEach((d, i) => { const z = Z9A - i * 2.3; d.visible = z > Z9B; d.position.set(RAILL - 1.5 + Math.sin(i * 3.1 + t) * 0.15, 1.15 + Math.sin(i * 1.7 + t * 1.3) * 0.12, z); const g = Math.exp(-((z - az) ** 2) / 2.5) * Math.exp(-since / 1.0); d.scale.setScalar(1 + g * 1.5); d.material.color.setRGB(0.62 + g * 2, 0.85 + g * 2, 1.0 + g); });
  W.pulse.visible = since < 0.32; W.pulse.position.set(RAILL, RAILTOP + 0.03, sz); W.pulse.material.opacity = 1;
  W.airRing.visible = since < 1.6; W.airRing.position.set(RAILL - 1.5, 1.15, az); W.airRing.scale.setScalar(1 + since * 1.2); W.airRing.material.opacity = clamp(1 - since / 1.5);
  const u = clamp((t - L(8)) / (E(8) + 0.2 - L(8))); look(V(lerp(0.9, 0.5, u), lerp(1.7, 2.3, u), lerp(Z9A + 4.0, Z9A - 9, eio(u))), V(-0.9, 0.7, Z9B - 4), 40); shadowR = 14;
  window.__lab = [['THÉP', V(RAILL + 0.25, RAILTOP + 0.25, lerp(Z9A - 6, Z9A - 16, u)), '#ffe36b'], ['KHÔNG KHÍ', V(RAILL - 1.5, 1.6, lerp(Z9A - 6, Z9A - 16, u)), '#9fd8ff']];
  if (arrive) window.__bang = headC(thua).add(V(0, 0.45, 0)); });
// 10 — loose crowd (push fades) vs people arm-in-arm (push crosses instantly)
const C10 = [[0, 21], [1.1, 20.2], [-1.3, 20.4], [0.6, 22.4], [-0.8, 23.0], [2.0, 21.6], [-2.2, 21.8], [1.6, 19.0], [-1.9, 19.3]];
shot(L(9) - 0.12, (t) => { camp(); thua.root.visible = false; chief.root.visible = false; const tp = wt(9, 'xô') - 0.15, P0 = V(C10[0][0], 0, C10[0][1]);
  ex.slice(0, 9).forEach((c, i) => { const [x, z] = C10[i], d = Math.hypot(x - P0.x, z - P0.z), dl = d / 1.8, amp = i === 0 ? 0.55 : 0.4 * Math.exp(-d / 1.3), u = (t - tp - dl) / 0.6;
    const b = u > 0 && u < 1 ? Math.sin(Math.PI * u) * (1 - u * 0.4) : 0; const dir = i === 0 ? V(0.2, 0, -1).normalize() : V(x - P0.x, 0, z - P0.z).normalize();
    place(c, x + dir.x * b * amp, z + dir.z * b * amp, yawTo(x, z, -3, 28) + Math.sin(i) * 0.4); idle(c, t); c.root.rotation.x = -b * amp * 0.5 * (dir.z > 0 ? -1 : 1) * 0.6; face(c, b > 0.15 ? 'wide' : 'calm'); });
  place(ti, 0.3, 23.5, Math.PI); idle(ti, t); shove(ti, SR.wp(ex[0].bone('Spine2')), clamp(1 - Math.abs(t - tp) / 0.25)); face(ti, 'grin');
  const u = clamp((t - L(9)) / (wt(9, 'thép') - L(9))), a = lerp(-0.7, -0.1, u); look(V(Math.sin(a) * 9.5, lerp(7.5, 6.0, u), 21 + Math.cos(a) * 9.5), V(0, 0.6, 21), 42); shadowR = 8; });
const LINE10 = Array.from({ length: 10 }, (_, i) => -3.6 + i * 0.8);
shot(wt(9, 'thép') - 0.08, (t) => { camp(); thua.root.visible = false; chief.root.visible = false; const tp = wt(9, 'đẩy') - 0.1, n = LINE10.length;
  const disp = i => { const u = (t - tp - i * 0.016) / 0.45; return u > 0 && u < 1 ? Math.sin(Math.PI * u) * 0.32 : 0; };
  ex.forEach((c, i) => { const x = LINE10[i] + disp(i); place(c, x, 22, 0.25); idle(c, t, 'idle'); c.root.rotation.z = -disp(i) * 0.5; face(c, i === n - 1 && t > tp + 0.15 && t < tp + 2.2 ? 'wide' : 'calm'); });
  ex.forEach((c, i) => { if (i + 1 < n) { const a = ex[i], b = ex[i + 1], m = vl(SR.wp(a.bone('LeftArm')), SR.wp(b.bone('RightArm')), 0.5).add(V(0, -0.38, 0.12)); arm(a, 'Left', m.clone().add(V(-0.02, 0, 0)), V(0, -0.6, -0.5)); arm(b, 'Right', m.clone().add(V(0.02, 0.03, 0)), V(0, -0.6, -0.5)); } });
  place(ti, LINE10[0] - 0.85, 22.1, Math.PI / 2 + 0.1); idle(ti, t); shove(ti, SR.wp(ex[0].bone('Spine2')), clamp(1 - Math.abs(t - tp) / 0.25)); face(ti, 'grin');
  const t0 = wt(9, 'thép') - 0.08, u = clamp((t - t0) / (E(9) + 0.2 - t0)); look(V(lerp(-6.2, -4.4, u), lerp(1.8, 1.6, u), lerp(27.5, 26.4, u)), V(lerp(-0.6, 1.4, eio(u)), 1.1, 22), 44); shadowR = 8;
  if (t > tp + 0.15 && t < tp + 1.1) window.__bang = headC(ex[n - 1]).add(V(0, 0.45, 0)); });
// 11 — fly down the line, over the dunes, to a tiny steam train kilometres away; back at the ear: the rail carries it
const ZFAR = -1500;
shot(L(10) - 0.12, (t) => { camp(); campIdle(t); listen(thua, THUA_P, LS, LF); listenArms(thua, THUA_P, LS, LF); face(thua, 'calm');
  const zf = tt => ZFAR + (tt - L(10)) * 9; trainAt(zf(t), t); puffs(t, zf, 0.12, 5, 2.4);
  const u = clamp((t - L(10)) / (wt(10, 'đường') - 0.1 - L(10))), e = eio(u), cz = lerp(-8, zf(t) + 46, e);
  look(V(lerp(1.5, 2.2, e), lerp(4.0, 3.6, e) + Math.sin(e * Math.PI) * 9, cz), V(0, lerp(1.0, 2.0, e), cz - 60), lerp(46, 34, e)); shadowR = 10; focus = V(0, 0, zf(t)); });
shot(wt(10, 'đường') - 0.1, (t) => { camp(); campIdle(t); listen(thua, THUA_P, LS, LF); listenArms(thua, THUA_P, LS, LF); const t0 = wt(10, 'đường') - 0.1, u = clamp((t - t0) / (E(10) + 0.2 - t0));
  const ph = ((t - t0) * 1.4) % 1; W.pulse.visible = true; W.pulse.position.set(RAILL, RAILTOP + 0.005, lerp(-32, THUA_P.z - 0.2, ph)); W.pulse.material.opacity = 1;
  face(thua, ph > 0.85 || ph < 0.12 ? 'wide' : 'calm'); const hc = headC(thua);
  look(V(lerp(0.7, 0.45, u), lerp(0.42, 0.5, u), lerp(THUA_P.z - 2.6, THUA_P.z - 1.8, u)), hc.clone().add(V(0, -0.08, -0.3)), 38); dof(hc.distanceTo(camera.position), 0.012); shadowR = 6; });
// 12 — smoke over the dune; everyone drags the ox cart off the rail; the train rushes past and blows the pot away
const TPASS = () => wt(11, 'lao') + 0.1, VT = 30;
const zTrain = tt => POT0.z + (tt - TPASS()) * VT;
const cartX = t => -3.6 * eio((t - wt(11, 'cả')) / (wt(11, 'tàu') - 0.3 - wt(11, 'cả')));
function pullers(t) { const cx = cartX(t), A = V(cx - 1.25, 0.95, 3.5), ppl = [thua, chief, ti, ex[0], ex[1], ex[2], ex[3]];
  ppl.forEach((c, i) => { const x = cx - 2.0 - i * 0.62, z = 3.5 + (i % 2 ? 0.28 : -0.28); place(c, x, z, -Math.PI / 2); pull(c, t, A, V(cx - 7, 0.95, 3.5), i * 0.07); face(c, i === 2 ? 'pale' : 'shout'); });
  ex[4].root.visible = false; const B = V(cx - 2.0 - 6 * 0.62 - 0.4, 0.95, 3.5); W.rope.visible = true; W.rope.position.copy(vl(A, B, 0.5)); W.rope.scale.set(1, A.distanceTo(B), 1); W.rope.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize()); }
function camp2(t) { camp(); W.lan.position.set(7.8, 0, 9.5); W.lan.rotation.y = 0.25; W.cart.position.x = cartX(t); }
shot(L(11) - 0.12, (t) => { camp2(t); campIdle(t, [], V(0, 0, -150), 'wide'); thua.root.visible = false;
  const zf = zTrain; trainAt(zf(t), t); puffs(t, zf, 0.1, 6, 3.4); const u = clamp((t - L(11)) / (wt(11, 'cả') - L(11)));
  look(V(0.15, 2.4, lerp(-0.5, -1.8, u)), V(0, 15, -150), lerp(17, 13, u)); shadowR = 10; });
shot(wt(11, 'cả') - 0.08, (t) => { camp2(t); pullers(t); [ex[5], ex[6]].forEach(c => c.root.visible = false); const zf = zTrain; trainAt(zf(t), t); puffs(t, zf, 0.1, 6, 3.4);
  const t0 = wt(11, 'cả') - 0.08, u = clamp((t - t0) / (wt(11, 'tàu') - 0.1 - t0)); look(V(lerp(2.0, 1.2, u), lerp(1.3, 1.1, u), lerp(9.6, 8.4, u)), V(lerp(-2.4, -4.0, u), 1.0, 1.0), 44); shadowR = 9; });
shot(wt(11, 'tàu') - 0.1, (t) => { camp2(t); const zf = zTrain; trainAt(zf(t), t); puffs(t, zf, 0.08, 4, 2.6);
  const tc = t - wt(11, 'tàu') - 0.1; pullers(t); [thua, chief, ti, ...ex.slice(0, 4)].forEach((c, i) => face(c, i === 2 ? 'pale' : 'wide'));
  const tb = TPASS() + 0.05, a = t - tb; if (a > 0) { W.pot.position.set(POT0.x + a * 4.5, 0.2 + a * 7 - 4.9 * a * a + 0.0, POT0.z + a * 9); W.pot.rotation.set(a * 9, a * 3, a * 7); W.porridge.visible = a < 0.25; }
  const P = V(lerp(3.6, 3.2, clamp(tc / 2)), 0.65, lerp(5.6, 4.8, clamp(tc / 2))); const tgt = a < 0 ? V(0, 1.4, Math.min(zf(t) - 2, POT0.z)) : vl(V(0.6, 1.2, POT0.z), W.pot.position.clone(), clamp(a / 0.5));
  look(P.add(V(Math.sin(t * 43) * 0.02 * clamp(1 - Math.abs(a) / 0.8), Math.sin(t * 37) * 0.02 * clamp(1 - Math.abs(a) / 0.8), 0)), tgt, 50); shadowR = 12; focus = V(1, 0, POT0.z); });
// 13 — another day, new camp beside the rail: the chief points at the rail; Thừa kneels and lies down, ear on the rail (loops to 1)
shot(L(12) - 0.12, (t) => { camp(2); place(chief, 1.6, 2.2, -Math.PI / 2 - 0.4, Math.max(0, H(1.6, 2.2))); idle(chief, t); pointAt(chief, V(RAILL, 0.2, 5), 'Right'); face(chief, talking(12, t) ? 'talk' : 'serious');
  place(thua, -0.35, 3.6, Math.PI * 0.75); idle(thua, t); face(thua, 'calm');
  [[ex[0], 4.2, -1.6], [ex[1], 6.6, -2.2], [ex[3], -3.4, -0.6]].forEach(([c, x, z]) => { place(c, x, z, yawTo(x, z, 0, 4)); idle(c, t); face(c, 'calm'); });
  const u = clamp((t - L(12)) / (wt(12, 'hễ') - L(12))), a = lerp(0.5, 0.9, u); look(V(0.6 + Math.sin(a) * 3.6, 1.45, 2.8 + Math.cos(a) * 3.6), V(0.6, 1.35, 2.8), 40); shadowR = 8; }, { look: 'gold' });
shot(wt(12, 'hễ') - 0.08, (t) => { camp(2); place(chief, 1.5, -6.4, -Math.PI / 2 - 0.6); idle(chief, t); pointAt(chief, V(RAILL, 0.2, -8.6), 'Right'); face(chief, talking(12, t) ? 'talk' : 'serious');
  const t0 = wt(12, 'hễ') - 0.08, k = clamp((t - t0 - 0.2) / 0.9); const stand = STAND1;
  if (k <= 0) { place(thua, stand.x, stand.z, 0.25, 0.1); idle(thua, t); face(thua, 'calm'); } else { getUp(thua, THUA_P, LS, LF, 1 - k, stand); if (k >= 1) listenArms(thua, THUA_P, LS, LF); face(thua, k >= 1 ? 'listen' : 'calm'); }
  const u = clamp((t - t0) / (E(12) + 0.3 - t0)), hc = headC(thua), e = eio(u); look(vl(V(1.4, 1.5, -18.5), railCam(hc, 2.3, 0.4), e), vl(V(-1.0, 1.1, -13.2), hc, e), lerp(42, 34, u)); dof(lerp(4.0, 2.3, e), 0.012); shadowR = 7; }, { look: 'gold' });
// outro — Thừa waves; heart / share / follow taps
if (0) shot(L(13) - 0.12, (t) => {   // follow outro dropped
 camp(); campIdle(t, [], V(0, 0, 7)); place(thua, -0.2, 4.6, 0.15); idle(thua, t); wave1(thua, t); face(thua, 'grin');
  const u = clamp((t - L(13)) / (DUR - L(13))); look(V(lerp(-1.0, 0.8, u), 1.5, lerp(8.0, 7.4, u)), V(-0.1, 1.35, 4.6), 40); dof(3.1, 0.006); shadowR = 8; });
if (Q.has('traintest')) { SHOTS.length = 0; shot(0, (t) => { camp(); trainAt(-30 + t * 0, t, 30); puffs(t, () => -30, 0.1, 5, 3);
  const a = +Q.get('traintest'); look(V(Math.sin(a) * 9, 2.6, -30 - 7 + Math.cos(a) * 9), V(0, 1.6, -38), 45); shadowR = 14; focus = V(0, 0, -38); }); }
else if (Q.has('posetest')) { SHOTS.length = 0; shot(0, (t) => { camp(); const xs = [-2.2, -1.1, 0, 1.1, 2.2];
  place(thua, xs[0], -20, 0); idle(thua, 0.8); face(thua, 'calm'); place(chief, xs[1], -20, 0.8); idle(chief, 0.8); face(chief, 'serious'); place(ti, xs[2], -20, Math.PI / 2); idle(ti, 0.8); face(ti, 'smug');
  place(ex[0], xs[3], -20, 0.5); SR.clipAt(ex[0], 'run', 0.3); face(ex[0], 'wide'); place(ex[1], xs[4], -20, -0.3); idle(ex[1], 0.8); waveArms(ex[1], 0.4); face(ex[1], 'shout');
  prone(ex[2], V(RAILL, RAILTOP, -17.5), Math.PI / 2, -1); proneArms(ex[2], V(RAILL, RAILTOP, -17.5), -1); face(ex[2], 'calm');
  look(V(0.3, 1.6, -13.2), V(0, 0.9, -19), 44); shadowR = 6; }); }
else if (Q.has('lineup')) { SHOTS.length = 0; if (Q.get('cast') === 'close') { shot(0, (t) => { camp(); [thua, chief, ti].forEach((c, i) => { const x = -1.25 + i * 1.25; place(c, x, -20, +Q.get('lineup'), 0.2); idle(c, 0.8); face(c, ['calm', 'serious', 'smug'][i]); }); look(V(0, 1.35, -16.0), V(0, 1.2, -20), 36); shadowR = 5; }); } else { const ry = +Q.get('lineup'); shot(0, (t) => { camp(); const cast = [thua, chief, ti, ...ex.slice(0, 5)];
  cast.forEach((c, i) => { const x = -3.6 + i * 1.03; place(c, x, -20, ry, Math.max(0, H(x, -20)) + (Math.abs(x) < 1.15 ? 0.1 : 0)); idle(c, 0.8); face(c, ['calm', 'serious', 'smug', 'grin', 'laugh', 'calm', 'wide', 'talk'][i]); });
  look(V(0, 1.25, -11.6), V(0, 1.15, -20), 40); shadowR = 8; }); } }

// ---------- "cướp đuổi tàu miền Viễn Tây" 10 s test (owner 2026-11-10): ?chase=1&dur=10 ----------
// same cast/rig/look as the review page; desert recolour, mesas + saguaros, code-built stick horses, bandits jump onto the coaches.
if (Q.has('chase')) { SHOTS.length = 0;
  const T = THREE, ZT = -700, VT = 9;                       // train nose z at t=0, speed (m/s, +z)
  const zf = t => ZT + VT * t;
  // desert ground
  { const g = W.ground.geometry, P = g.attributes.position, C = g.attributes.color, a = new T.Color('#e9c58c'), b = new T.Color('#d9a35e'), hi = new T.Color('#c4783f'), c = new T.Color();
    for (let i = 0; i < P.count; i++) { const y = P.getY(i), x = P.getX(i), z = P.getZ(i); c.copy(a).lerp(b, 0.5 + 0.5 * Math.sin(x * 0.07) * Math.sin(z * 0.05)); if (y > 3) c.lerp(hi, Math.min(1, (y - 3) / 10)); C.setXYZ(i, c.r, c.g, c.b); } C.needsUpdate = true; }
  const ink = (m, w = 0.02) => { const o = new T.Mesh(m.geometry, new T.MeshBasicMaterial({ color: '#2a1612', side: T.BackSide })); o.scale.setScalar(1 + w); m.add(o); return m; };
  const toonM = c => SR.toon(c, { rim: 0.3, kick: 0.1, flat2: true });
  // mesas (flat-topped red rocks) far on both sides
  const mesa = (x, z, r, h, col) => { const g = new T.Group(); const body = ink(new T.Mesh(new T.CylinderGeometry(r * 0.8, r, h, 9), toonM(col)), 0.01); body.position.y = h / 2; g.add(body);
    const band = new T.Mesh(new T.CylinderGeometry(r * 0.86, r * 0.88, h * 0.12, 9), toonM('#a6532c')); band.position.y = h * 0.62; g.add(band); g.position.set(x, H(x, z) - 1, z); scene.add(g); return g; };
  const MESAS = [[-70, -760, 22, 26, '#c8693a'], [-95, -640, 30, 34, '#d07a45'], [80, -720, 26, 30, '#c46236'], [60, -560, 18, 20, '#d58652'], [-55, -540, 14, 16, '#cf7a48'], [120, -620, 34, 40, '#bf5e34']].map(m => mesa(...m));
  // saguaro cacti along the line
  const cactM = toonM('#4f8f3a'); const saguaro = (x, z, h) => { const g = new T.Group(); const tr = ink(new T.Mesh(new T.CapsuleGeometry(0.22, h, 4, 10), cactM), 0.06); tr.position.y = h / 2 + 0.2; g.add(tr);
    for (const sd of [-1, 1]) { const ah = h * (0.35 + 0.15 * sd); const arm1 = ink(new T.Mesh(new T.CapsuleGeometry(0.15, 0.5, 4, 8), cactM), 0.08); arm1.rotation.z = Math.PI / 2; arm1.position.set(sd * 0.4, ah, 0); g.add(arm1);
      const arm2 = ink(new T.Mesh(new T.CapsuleGeometry(0.15, ah * 0.6, 4, 8), cactM), 0.08); arm2.position.set(sd * 0.7, ah + ah * 0.3, 0); g.add(arm2); }
    g.position.set(x, H(x, z), z); g.rotation.y = x * 0.3; scene.add(g); };
  for (let i = 0; i < 26; i++) { const sd = i % 2 ? 1 : -1, z = -760 + i * 9 + (i * 37 % 7), x = sd * (6 + (i * 53 % 17)); saguaro(x, z, 2.2 + (i * 29 % 10) / 6); }
  // stick horse: bean body, neck + head, mane, tail, four stick legs (gallop)
  // real galloping horse (three.js example Horse.glb, morph-target gallop), recoloured flat toon + ink hull, saddle + rein (owner 2026-11-10: "con ngựa thấy ghớm quá")
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const HG = await new GLTFLoader().loadAsync('./assets/horse/Horse.glb'); const HM0 = (() => { let m; HG.scene.traverse(o => { if (o.isMesh && !m) m = o; }); return m; })(); const HCLIP = HG.animations[0]; if (!HM0.geometry.attributes.normal) HM0.geometry.computeVertexNormals();
  const hb = new T.Box3().setFromObject(HG.scene), hsz = hb.getSize(V(0, 0, 0)), HK = 2.7 / hsz.y, HZC = (hb.min.z + hb.max.z) / 2, HLONG = hsz.z > hsz.x;
  const hullMat = (w) => { const m = new T.MeshBasicMaterial({ color: '#2a1612', side: T.BackSide }); m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', `transformed += normalize(normal) * ${w.toFixed(3)};\n#include <project_vertex>`); }; return m; };
  const horse = (col) => { const g = new T.Group(); const body = new T.Mesh(HM0.geometry, SR.toon(col, { rim: 0.3, kick: 0.1, flat2: true })); body.name = HM0.name;
    body.morphTargetInfluences = HM0.morphTargetInfluences.slice(); body.morphTargetDictionary = HM0.morphTargetDictionary;
    const hull = new T.Mesh(HM0.geometry, hullMat(0.035 / HK)); hull.morphTargetInfluences = body.morphTargetInfluences;
    const holder = new T.Group(); holder.add(body, hull); holder.scale.setScalar(HK); if (!HLONG) holder.rotation.y = -Math.PI / 2; holder.position.set(0, -hb.min.y * HK, -HZC * HK); g.add(holder);
    body.castShadow = true; const mx = new T.AnimationMixer(holder); const act = mx.clipAction(HCLIP); act.play(); g.userData.mx = mx; g.userData.dur = HCLIP.duration;
    const saddle = new T.Mesh(new T.BoxGeometry(0.55, 0.12, 0.7), toonM('#6b2f16')); ink(saddle, 0.05); saddle.position.set(0, 1.78, 0.1); g.add(saddle); g.userData.saddle = saddle;
    const blanket = new T.Mesh(new T.BoxGeometry(0.62, 0.05, 0.85), toonM('#c8352f')); blanket.position.set(0, 1.72, 0.1); g.add(blanket);
    scene.add(g); return g; };
  const gallop = (h, t, f = 1.0) => { const d = h.userData.dur; h.userData.mx.setTime(((t * f) % d + d) % d); h.position.y = 0; };
  const HORSES = [horse('#8a5232'), horse('#3b2a22'), horse('#c9a173')]; 
  // steam train: 4-4-0 loco (black boiler, red cab + cowcatcher, brass bands) + tender + two red wooden coaches; faces +z, nose at local z 0
  const ST = new T.Group(); scene.add(ST); const M = c => toonM(c), WHEELS = [];
  const box = (w, h, l, c, x, y, z, iw = 0.02) => { const m = new T.Mesh(new T.BoxGeometry(w, h, l), M(c)); if (iw) ink(m, iw); m.position.set(x, y, z); ST.add(m); return m; };
  const cyl = (rt, rb, h, c, x, y, z, rx = 0, iw = 0.02, seg = 20) => { const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), M(c)); if (iw) ink(m, iw); m.position.set(x, y, z); m.rotation.x = rx; ST.add(m); return m; };
  const wheel = (x, z, r, c = '#b8322a') => { const w = cyl(r, r, 0.12, c, x, r + 0.32, z, 0, 0.04, 16); w.rotation.z = Math.PI / 2; const hub = new T.Mesh(new T.CylinderGeometry(r * 0.25, r * 0.25, 0.14, 10), M('#e0b84a')); w.add(hub); for (let k = 0; k < 4; k++) { const sp = new T.Mesh(new T.BoxGeometry(0.13, r * 1.8, 0.05), M('#7a1f18')); sp.rotation.y = k * Math.PI / 4; w.add(sp); } WHEELS.push([w, r]); };
  box(1.6, 0.35, 8.2, '#232227', 0, 0.75, -4.1);
  cyl(0.82, 0.82, 5.0, '#2c2c33', 0, 1.85, -2.9, Math.PI / 2, 0.015, 24);
  for (const z of [-1.0, -2.6, -4.2]) cyl(0.85, 0.85, 0.14, '#d9a93f', 0, 1.85, z, Math.PI / 2, 0.01, 24);
  cyl(0.85, 0.85, 0.1, '#3a3a42', 0, 1.85, -0.38, Math.PI / 2);
  const lamp = new T.Mesh(new T.SphereGeometry(0.22, 12, 10), new T.MeshBasicMaterial({ color: new T.Color(2.2, 2.0, 1.2) })); lamp.position.set(0, 2.85, -0.35); ST.add(lamp); box(0.5, 0.5, 0.5, '#2c2c33', 0, 2.85, -0.6);
  cyl(0.55, 0.28, 0.9, '#1e1e24', 0, 3.25, -1.2, 0, 0.03); cyl(0.3, 0.3, 0.6, '#1e1e24', 0, 2.75, -1.2);
  cyl(0.36, 0.42, 0.55, '#d9a93f', 0, 2.75, -3.0, 0, 0.03);
  box(2.3, 2.3, 2.2, '#b8322a', 0, 2.2, -6.5); box(2.6, 0.18, 2.6, '#1e1e24', 0, 3.42, -6.5);
  for (const sx of [-1, 1]) box(0.05, 0.7, 0.8, '#1b2533', sx * 1.16, 2.7, -6.4, 0);
  { const cc = ink(new T.Mesh(new T.ConeGeometry(1.0, 1.1, 4), M('#b8322a')), 0.02); cc.rotation.set(-Math.PI / 2 + 0.5, Math.PI / 4, 0); cc.position.set(0, 0.85, 0.35); cc.scale.set(1.1, 1, 0.5); ST.add(cc); }
  for (const sx of [-0.85, 0.85]) { wheel(sx, -0.9, 0.38, '#2c2c33'); wheel(sx, -3.4, 0.62); wheel(sx, -4.9, 0.62); }
  box(2.2, 1.6, 3.6, '#232227', 0, 1.6, -9.6); box(2.0, 0.4, 3.2, '#111114', 0, 2.55, -9.6);
  for (const sx of [-0.85, 0.85]) { wheel(sx, -8.6, 0.38, '#2c2c33'); wheel(sx, -10.6, 0.38, '#2c2c33'); }
  const COACH = [];
  for (const z0 of [-16.6, -27.0]) { box(2.5, 2.4, 9.4, '#8f2e22', 0, 2.05, z0); box(2.56, 0.18, 9.4, '#e3b74a', 0, 1.4, z0, 0); box(2.56, 0.12, 9.4, '#e3b74a', 0, 2.95, z0, 0);
    box(2.75, 0.22, 9.9, '#5a4a3f', 0, 3.36, z0); box(1.2, 0.3, 8.6, '#6b5a4c', 0, 3.6, z0);   // roof + clerestory
    for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) box(0.05, 0.7, 0.9, '#ffe9a8', sx * 1.27, 2.35, z0 - 3.6 + i * 1.8, 0);
    for (const sx of [-0.85, 0.85]) { wheel(sx, z0 - 3.2, 0.38, '#2c2c33'); wheel(sx, z0 + 3.2, 0.38, '#2c2c33'); }
    COACH.push(z0); }
  ST.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const trainSteam = (t) => { const z = zf(t); ST.visible = true; ST.position.set(0, Math.sin(t * 9) * 0.015, z); WHEELS.forEach(([w, r]) => { w.rotation.x = z / r; }); };
  // bandits: cowboy hat + red bandana over the mouth
  const BAND = [ex[1], ex[3], ex[6]];
  BAND.forEach((c, i) => { const r = HR(c) / c.root.scale.x, hatM = toonM(['#5a3a22', '#2b2421', '#7a5634'][i]);
    const brim = ink(new T.Mesh(new T.CylinderGeometry(r * 1.55, r * 1.55, r * 0.08, 24), hatM), 0.02); brim.position.y = r * 0.72; brim.scale.z = 0.85; c.head.add(brim);
    const crown = ink(new T.Mesh(new T.CylinderGeometry(r * 0.7, r * 0.82, r * 0.7, 20), hatM), 0.03); crown.position.y = r * 1.05; c.head.add(crown);
    const band = new T.Mesh(new T.SphereGeometry(r * 1.03, 24, 12, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.55, Math.PI * 0.35), toonM('#c8352f')); band.rotation.y = Math.PI; c.head.add(band);
    c._cowboy = [brim, crown, band]; });
  const seat = (c, h, t) => { const hp = h.position; place(c, hp.x, hp.z + 0.1, h.rotation.y, hp.y + 1.84 - 0.55); SR.clipAt(c, 'idle', 0.3); c.root.rotation.x = 0.12;
    leg(c, 'Left', Lw(c, 0.42, 0.25, 0.15), dirW(c, 0.4, 0, 1)); leg(c, 'Right', Lw(c, -0.42, 0.25, 0.15), dirW(c, -0.4, 0, 1));
    const b = 0.03 * Math.sin(t * 16); arm(c, 'Left', Lw(c, 0.18, 1.05 + b, 0.55)); arm(c, 'Right', Lw(c, -0.18, 1.05 + b, 0.55)); };
  const ry0 = 0, X = [2.9, 5.0, 7.0];
  const at = (t) => { const z = zf(t); return { lead: z - 30 + 15.5 * eio(clamp((t - 0.2) / 5.6)), b2: z - 36 + 12 * eio(clamp((t - 0.6) / 8)), b3: z - 40 + 10 * eio(clamp((t - 1) / 8.5)) }; };
  // roof of the coach beside the lead bandit (ray down onto the train)
  const rc = new T.Raycaster(); const roofY = (x, z) => { rc.set(V(x, 30, z), V(0, -1, 0)); const hit = rc.intersectObject(W.train, true)[0]; return hit ? hit.point.y : 4.2; };
  const actors = (t, jumpOn = true) => { trainSteam(t); puffs(t, (te) => zf(te) + 4.2 - 0.9 - 1.2, 0.07, 4, 2.6); W.puffs.forEach(pp => { pp.scale.multiplyScalar(0.42); pp.position.y -= 1.0; if (pp.material.color) pp.material.color.set('#d9d2c8'); });
    const p = at(t); [p.lead, p.b2, p.b3].forEach((z, i) => { const h = HORSES[i]; h.visible = true; h.position.set(X[i], 0, z); h.rotation.y = ry0; gallop(h, t + i * 0.13); });
    BAND.forEach((c, i) => { c._cowboy.forEach(m => (m.visible = true)); });
    const J0 = 6.0, J1 = 7.0, lead = BAND[0];
    BAND.slice(1).forEach((c, i) => { seat(c, HORSES[i + 1], t); face(c, i ? 'grin' : 'shout'); });
    if (!jumpOn || t < J0) { seat(lead, HORSES[0], t); face(lead, t > 3.2 ? 'smug' : 'shout'); if (t > 4.4) { arm(lead, 'Right', Lw(lead, -0.55, 1.6, 0.35)); } }
    else { const u = clamp((t - J0) / (J1 - J0)), zt = zf(t) + COACH[0] + 2.5, y1 = 3.75;
      const a = V(X[0], 1.1, p.lead), b = V(0.3, y1, zt); const P = a.clone().lerp(b, eio(u)); P.y += Math.sin(u * Math.PI) * 1.4;
      if (u < 1) { place(lead, P.x, P.z, -0.3, P.y); SR.clipAt(lead, 'run', 0.25); face(lead, 'wide'); leg(lead, 'Left', Lw(lead, 0.2, 0.45, 0.25)); leg(lead, 'Right', Lw(lead, -0.2, 0.35, -0.2)); waveArms(lead, t); }
      else { place(lead, 0.3, zt, Math.PI * 0.5 + 0.25, y1); idle(lead, t); waveArms(lead, t, false); face(lead, 'laugh'); lead.root.position.y += Math.abs(Math.sin(t * 9)) * 0.04; }
      HORSES[0].visible = true; } };
  setLook('day');
  // 0–3 s: wide, side-on tracking: train left→right across the frame, three riders closing in beside it
  shot(0, (t) => { actors(t); const z = zf(t); look(V(13, 3.0, z - 6 - t * 0.5), V(3.0, 2.0, z - 25 + t * 1.5), 42); shadowR = 30; focus = V(3, 1, z - 14); });
  // 3–6 s: chase cam behind the lead rider, coaches sliding past on the left; he reaches for the ladder
  shot(3, (t) => { actors(t); const p = at(t), z = p.lead; look(V(7.0, 4.0, z - 6.0).add(hand(t, 3)), V(1.6, 2.7, z + 3), 48); shadowR = 14; focus = V(2.5, 1.5, z); });
  // 6–8 s: low side angle as he leaps from the saddle onto the coach roof
  shot(6, (t) => { actors(t); const z = zf(t) + COACH[0] + 2.5; look(V(11, 1.2, z + 2.0), V(1.6, 2.9, z - 0.5), 46); shadowR = 14; focus = V(1.5, 2.5, z); });
  // 8–10 s: on the roof, waving his hat, camera rising and pulling back; the other two still galloping alongside
  shot(8, (t) => { actors(t); const z = zf(t) + COACH[0] + 2.5, u = clamp((t - 8) / 2); look(V(lerp(5, 9, u), lerp(5.2, 8.0, u), z + lerp(6, 9, u)), V(0.6, 4.2, z - 1.5), 44); shadowR = 20; focus = V(1, 3, z); });
}
SHOTS.sort((a, b) => a.t0 - b.t0); if (Q.has('cut10')) { const cut = SHOTS.findIndex(x => x.t0 >= 9.4); if (cut > 0) SHOTS.length = cut; }

// ---------- 2D overlay: one-word captions, cards, labels ----------
const out2 = document.createElement('canvas'); out2.width = WW; out2.height = HH; const og = out2.getContext('2d');
const backOut = x => { x = clamp(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const ALLW = FL.flatMap(l => l.words);
function caption(t) { let w = null, i = -1; for (let k = 0; k < ALLW.length; k++) if (t >= ALLW[k].t - 0.02) { w = ALLW[k]; i = k; }
  if (!w) return; const nx = ALLW[i + 1], end = nx ? Math.min(nx.t - 0.02, w.e + 0.35) : w.e + 0.35; if (t > end) return;
  const txt = w.w.replace(/["“”]/g, ''); const S = WW / 1080, p = backOut((t - w.t + 0.02) / 0.12);
  og.save(); og.translate(WW / 2, HH * 0.71); og.scale(S * (0.82 + 0.18 * p), S * (0.82 + 0.18 * p)); og.font = '96px InterB'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round';
  const k = Math.min(1, 900 / og.measureText(txt).width); og.scale(k, k); og.lineWidth = 20; og.strokeStyle = '#000'; og.strokeText(txt, 0, 0); og.fillStyle = '#fff'; og.fillText(txt, 0, 0); og.restore(); }
function card(text, t0, t, t1, y = 330, sz = 120, colr = '#ffe36b') { if (t < t0 || t > t1) return; const k = backOut((t - t0) / 0.3) * clamp((t1 - t) / 0.2), S = WW / 1080; og.save(); og.translate(WW / 2, y * S); og.scale(k * S, k * S); og.rotate(-0.03);
  og.font = `${sz}px Anton`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.lineWidth = sz * 0.2; og.strokeStyle = '#000'; og.strokeText(text, 0, 0); og.fillStyle = colr; og.fillText(text, 0, 0); og.restore(); }
function label(text, P, colr) { const p = P.clone().project(camera); if (p.z > 1) return; const x = (p.x + 1) / 2 * WW, y = (1 - p.y) / 2 * HH, S = WW / 1080;
  og.save(); og.translate(x, y); og.scale(S, S); og.font = '58px Anton'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineJoin = 'round'; og.lineWidth = 12; og.strokeStyle = '#000'; og.strokeText(text, 0, 0); og.fillStyle = colr; og.fillText(text, 0, 0); og.restore(); }
function bang(P, t) { const p = P.clone().project(camera); if (p.z > 1) return; const x = (p.x + 1) / 2 * WW, y = (1 - p.y) / 2 * HH, S = WW / 1080, s = 1 + 0.08 * Math.sin(t * 30);
  og.save(); og.translate(x, y); og.scale(S * s, S * s); og.font = '120px Anton'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineWidth = 18; og.strokeStyle = '#000'; og.strokeText('!', 0, 0); og.fillStyle = '#ffe14d'; og.fillText('!', 0, 0); og.restore(); }
function outroIcons(t) { if (t < L(13)) return; const S = WW / 1080; const items = [['tim', 'heart'], ['chia', 'share'], ['follow', 'follow']];
  items.forEach(([w, kind], i) => { const t0 = wt(13, w) - 0.1; if (t < t0) return; const k = backOut((t - t0) / 0.25), x = (300 + i * 240) * S, y = 1560 * S; og.save(); og.translate(x, y); og.scale(k * S, k * S);
    og.fillStyle = 'rgba(0,0,0,0.55)'; og.beginPath(); og.arc(0, 0, 92, 0, 7); og.fill(); og.lineJoin = 'round';
    if (kind === 'heart') { og.fillStyle = '#ff3b5c'; og.beginPath(); og.moveTo(0, 40); og.bezierCurveTo(-90, -20, -40, -80, 0, -35); og.bezierCurveTo(40, -80, 90, -20, 0, 40); og.fill(); }
    if (kind === 'share') { og.fillStyle = '#fff'; og.beginPath(); og.moveTo(45, -10); og.lineTo(0, -50); og.lineTo(0, -28); og.quadraticCurveTo(-55, -25, -55, 40); og.quadraticCurveTo(-30, 5, 0, 8); og.lineTo(0, 30); og.closePath(); og.fill(); }
    if (kind === 'follow') { og.fillStyle = '#ff3b30'; og.beginPath(); og.arc(0, 0, 70, 0, 7); og.fill(); og.fillStyle = '#fff'; og.fillRect(-36, -9, 72, 18); og.fillRect(-9, -36, 18, 72); }
    const tap = (t - t0 - 0.3) / 0.5; if (tap > 0 && tap < 1) { og.strokeStyle = `rgba(255,255,255,${1 - tap})`; og.lineWidth = 8; og.beginPath(); og.arc(0, 0, 92 + tap * 50, 0, 7); og.stroke(); }
    og.restore(); }); }

// ---------- frame ----------
const TRANS = new Set([W.stream, ...W.sparks, ...W.cylSteam, W.bowl, W.ladle, W.hammer, W.rope, W.pulse, W.airRing, W.train, ...W.grains, ...W.puffs, ...W.airDots, ...W.steelDots]);
function resetScene() { for (const o of TRANS) o.visible = false; ALL.forEach(c => { c.root.visible = false; c.root.rotation.set(0, 0, 0); c.hm.material.uniforms.base.value.copy(c.tint); });
  W.rails[0].position.y = 0; dofOn = null; shadowR = 9; window.__lab = null; window.__bang = null; }
function renderShot(S, t) { resetScene(); setLook(S.look || 'day'); S.fn(t); ALL.forEach(c => SR.updateLimbs(c)); fireSteam(t); W.update(t, focus);
  const f = focus.clone(); sun.target.position.copy(f); sun.position.copy(f).addScaledVector(SUNDIR, 60); const sc = sun.shadow.camera; sc.left = sc.bottom = -shadowR; sc.right = sc.top = shadowR; sc.near = 1; sc.far = 140; sc.updateProjectionMatrix();
  post.bokeh.enabled = !!dofOn; if (dofOn) { post.bokeh.uniforms.focus.value = dofOn[0]; post.bokeh.uniforms.aperture.value = dofOn[1]; }
  U.uTime.value = t; post.render(); }
const XF = 0;   // hard cuts: dissolves showed one head through another (user 2026-11-10)
function render(t) {
  let i = 0; for (let k = 0; k < SHOTS.length; k++) if (t >= SHOTS[k].t0) i = k; const S = SHOTS[i];
  og.clearRect(0, 0, WW, HH);
  if (i > 0 && t < S.t0 + XF) { renderShot(SHOTS[i - 1], t); og.drawImage(canvas, 0, 0); renderShot(S, t); og.globalAlpha = (t - S.t0) / XF; og.drawImage(canvas, 0, 0); og.globalAlpha = 1; }
  else { renderShot(S, t); og.drawImage(canvas, 0, 0); }
  const lab = window.__lab, bg = window.__bang;
  if (lab) lab.forEach(([s, P, c]) => label(s, P, c)); if (bg) bang(bg, t);
  if (!Q.has('chase') && FL[5]) card('1 PHÚT', wt(5, 'một') - 0.05, t, wt(5, 'ông') - 0.1, 330, 140);
  if (!Q.has('chase') && FL[6]) card('2 PHÚT', wt(6, 'hai') - 0.05, t, E(6) + 0.1, 330, 140);
  if (!Q.has('chase') && FL[8]) card('THÉP ≈ 15 × KHÔNG KHÍ', wt(8, 'nhanh') - 0.1, t, E(8) + 0.15, 300, 92);
  if (!Q.has('lineup') && !Q.has('chase')) caption(t);
  return out2.toDataURL('image/jpeg', 0.92);
}
window.DUR = Math.min(DUR, +(Q.get('dur') || 1e9)); window.frame = render; window.FL = FL; window.ready = true;

// ---------- character review page (owner 2026-11-10: "tạo 1 trang chỉ để mình duyệt nhân vật, cho phép xoay, zoom… góp ý trên đó") ----------
// index.html?viewer=1 → live orbit view of the real cast (same rig/faces/colours as the film), mood + pose pickers, OK/Cần sửa notes
// to the LAN feedback api (POST /api/feedback/nhan-vat-3d when served by lan-share).
if (Q.has('viewer')) { if (Q.has('skit')) window.ready = false;   // the skit waits for the furniture before render.cjs starts
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const NAMES = ['Áo hoodie', 'Áo vest', 'Áo polo', 'Thừa', 'Trưởng đoàn', 'Tí', ...ex.map((_, i) => `Người trong đoàn ${i + 1}`)];
  // outfit tests: hoodie / vest / polo on Thừa's body (owner 2026-11-10)
  const OUTF = [SR.build({ ...base, jacket: '#3d5a9c', jacket2: '#2d4478', details: ['hoodie'], hat: 'cap', hatCol: '#e43a2a', capBack: true }),
    SR.build({ ...base, jacket: '#2f3542', jacket2: '#1f2430', pattern: ['vest', '#252a35'], details: ['tie', 'vestBtn', 'hanky'], tieCol: '#c8352f', hankyCol: '#f2cf2c' }),
    SR.build({ ...base, jacket: '#2fa36b', jacket2: '#23805a', details: ['polo'], collarCol: '#ffffff', logoCol: '#f2cf2c' })];
  OUTF.forEach((c, i) => { c.root.scale.setScalar(0.8); c.phase = 2 + i * 0.37; c.root.rotation.order = 'YXZ'; face(c, 'calm'); c.tint = c.hm.material.uniforms.base.value.clone(); ALL.push(c); });
  const CAST = [...OUTF, thua, chief, ti, ...ex], Z = -20, X0 = -((CAST.length - 1) * 1.05) / 2;
  const POS = CAST.map((c, i) => V(X0 + i * 1.05, 0, Q.get('set') !== 'track' ? Z + 2.4 : Z));   // office/home: people stand in front of the furniture
  // office set (owner 2026-11-10: "đổi khung cảnh về văn phòng đi"): hide the outdoor world, build a bright cartoon office around the lineup
  const OFFICE = Q.get('set') !== 'track', FY = 0.4; let OFF_O = null;
  if (OFFICE) { const keep = new Set([hemi, sun, sun.target]); ALL.forEach(c => { keep.add(c.root); c.dyn?.forEach(d => d.mesh?.parent && keep.add(d.mesh.parent)); });
    scene.children.forEach(o => { if (!keep.has(o)) o.visible = false; }); scene.fog.near = 400; scene.fog.far = 4000;
    const O = new THREE.Group(); scene.add(O); OFF_O = O; const tm = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0 });   // real shading for the set (owner 2026-11-10: "màu sắc chẳng chân thật")
    const ob = (w, h, d, c, x, y, z, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.mat || tm(c)); m.position.set(x, y, z); m.castShadow = !!o.cast; m.receiveShadow = true; if (o.ink) { const k = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ color: '#2a1612', side: THREE.BackSide })); k.scale.setScalar(1 + o.ink); m.add(k); } O.add(m); return m; };
    const W0 = 18, ZB = Z - 6, ZF = Z + 9;
    // floor (light wood planks), back + side walls (soft mint / cream), skirting, ceiling strip lights
    const fc = document.createElement('canvas'); fc.width = fc.height = 256; { const g = fc.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = ['#b98552', '#a8754a', '#c08e5c', '#a36f43'][i % 4]; g.fillRect(0, i * 32, 256, 32); g.fillStyle = 'rgba(90,60,30,0.25)'; g.fillRect(0, i * 32, 256, 2); g.fillRect((i * 97) % 256, i * 32, 2, 32); } }
    const ft = new THREE.CanvasTexture(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(6, 5); ft.colorSpace = THREE.SRGBColorSpace;
    ob(W0, 0.1, ZF - ZB, '#ffffff', 0, FY - 0.05, (ZB + ZF) / 2, { mat: new THREE.MeshStandardMaterial({ map: ft, roughness: 0.45, metalness: 0 }) });
    ob(W0, 4.2, 0.2, '#5f9a8c', 0, FY + 2.1, ZB); for (const sx of [-1, 1]) ob(0.2, 4.2, ZF - ZB, '#c9a77c', sx * W0 / 2, FY + 2.1, (ZB + ZF) / 2);   // deeper teal + tan walls
    ob(W0, 0.1, ZF - ZB, '#fbf8f2', 0, FY + 4.25, (ZB + ZF) / 2); scene.background = new THREE.Color('#f3e9d6');   // ceiling, no black above the walls
    ob(W0, 0.18, 0.06, '#8a6a4a', 0, FY + 0.09, ZB + 0.12);
    for (const x of [-5, 0, 5]) ob(2.6, 0.06, 0.4, '#ffffff', x, FY + 4.15, Z - 1, { mat: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.6, 1.5) }) });
    // windows with sky + city, whiteboard, wall clock, poster
    const gradT = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,236,200,0.55)'); gr.addColorStop(0.6, 'rgba(255,226,180,0.22)'); gr.addColorStop(1, 'rgba(255,220,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const shaftM = new THREE.MeshBasicMaterial({ map: gradT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const patchT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,232,190,0.7)'); gr.addColorStop(0.7, 'rgba(255,225,180,0.35)'); gr.addColorStop(1, 'rgba(255,220,170,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      g.fillStyle = 'rgba(0,0,0,0.0)'; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    for (const x of [-6.2, -3.2]) { // sunlight shaft: window → floor, plus the bright patch where it lands
      const yT = FY + 3.2, yB = FY + 1.4, zW = ZB + 0.2, zF = ZB + 5.6, g = new THREE.BufferGeometry();
      for (const [a, b] of [[yT, 0], [yB, 1]]) {}
      const v = [x - 1.15, yT, zW, x + 1.15, yT, zW, x + 1.5, FY + 0.02, zF, x - 1.5, FY + 0.02, zF, x - 1.15, yB, zW, x + 1.15, yB, zW, x + 1.5, FY + 0.02, zF - 2.6, x - 1.5, FY + 0.02, zF - 2.6];
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0], 2)); g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 0, 4, 7, 0, 7, 3, 1, 5, 6, 1, 6, 2]);
      const sh = new THREE.Mesh(g, shaftM); sh.renderOrder = 5; O.add(sh);
      const pt = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.0), new THREE.MeshBasicMaterial({ map: patchT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pt.rotation.x = -Math.PI / 2; pt.position.set(x, FY + 0.012, zF - 1.4); O.add(pt);
      ob(2.4, 1.8, 0.05, '#ffffff', x, FY + 2.3, ZB + 0.12, { mat: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.75, 0.95) }) }); ob(2.6, 0.1, 0.12, '#f7f5f0', x, FY + 3.25, ZB + 0.15); ob(2.6, 0.1, 0.12, '#f7f5f0', x, FY + 1.35, ZB + 0.15); ob(0.08, 1.9, 0.12, '#f7f5f0', x, FY + 2.3, ZB + 0.15);
      for (let k = 0; k < 4; k++) ob(0.35, 0.4 + (k * 37 % 5) * 0.12, 0.03, '#7da7c9', x - 0.9 + k * 0.6, FY + 1.6 + (0.2 + (k * 37 % 5) * 0.06), ZB + 0.14, { mat: new THREE.MeshBasicMaterial({ color: '#7da7c9' }) }); }
    if ((Q.get('set') || 'office') === 'office') ob(3.4, 1.6, 0.06, '#ffffff', 2.2, FY + 2.4, ZB + 0.14, { ink: 0.02 }); ob(3.5, 0.08, 0.15, '#9aa3ad', 2.2, FY + 1.56, ZB + 0.2);
    if ((Q.get('set') || 'office') === 'office') for (const [x, y, w, c] of [[1.2, 2.8, 1.0, '#e8442a'], [2.6, 2.5, 1.3, '#3d7be0'], [1.5, 2.2, 0.8, '#2fa36b']]) ob(w, 0.05, 0.02, c, x, FY + y, ZB + 0.19, { mat: new THREE.MeshBasicMaterial({ color: c }) });
    { const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 32), tm('#ffffff')); ck.rotation.x = Math.PI / 2; ck.position.set(5.6, FY + 3.2, ZB + 0.15); O.add(ck); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 8, 32), tm('#2a1612')); rim.position.copy(ck.position); O.add(rim);
      for (const [l, a] of [[0.2, 0.6], [0.26, 2.2]]) { const hd = new THREE.Mesh(new THREE.BoxGeometry(0.025, l, 0.01), tm('#2a1612')); hd.geometry.translate(0, l / 2, 0); hd.position.set(5.6, FY + 3.2, ZB + 0.2); hd.rotation.z = -a; O.add(hd); } }
    ob(1.1, 1.5, 0.04, '#f2cf2c', 7.3, FY + 2.4, ZB + 0.14, { ink: 0.02 });
    // furniture: Kenney Furniture Kit + KayKit Furniture Bits (both CC0), see FURN below
    ob(0.5, 1.1, 0.5, '#f2f0ea', 8.4, FY + 0.55, Z + 1.5, { ink: 0.02 }); { const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16), new THREE.MeshBasicMaterial({ color: '#9fd3f5', transparent: true, opacity: 0.85 })); jug.position.set(8.4, FY + 1.35, Z + 1.5); O.add(jug); }
    hemi.color.set('#fff3e2'); hemi.groundColor.set('#b89a78');
    { const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'); const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55; }
    for (const x of [-5, 0, 5]) { const pl = new THREE.PointLight('#ffe2b8', 6, 9, 1.6); pl.position.set(x, FY + 3.6, Z - 1); scene.add(pl); }
    await post.addAO();
    // ---- real furniture (CC0): Kenney Furniture Kit 2.0 (.glb) + KayKit Furniture Bits 1.0 (.gltf, one texture atlas) ----
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'); const GL = new GLTFLoader(), CACHE = {};
    const hull = (w) => { const m = new THREE.MeshBasicMaterial({ color: '#2a1612', side: THREE.BackSide }); m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', `transformed += normalize(normal) * ${w.toFixed(4)};\n#include <project_vertex>`); }; m.customProgramCacheKey = () => 'fh' + w; return m; };
    const load = async (src) => (CACHE[src] ||= GL.loadAsync(src));
    // one scale per kit so pieces stay in proportion: Kenney desk → 0.66 m, KayKit table_medium → 0.62 m (people are ~1.45 m)
    const kScale = {}; const kitScale = async (kit) => { if (kScale[kit]) return kScale[kit]; const ref = kit === 'kenney' ? 'kenney/desk.glb' : kit === 'polyhaven' ? 'polyhaven/metal_office_desk/metal_office_desk.gltf' : 'kaykit/table_medium.gltf'; const g = await load('./assets/props/' + ref); const b = new THREE.Box3().setFromObject(g.scene); return (kScale[kit] = (kit === 'kaykit' ? 0.62 : 0.66) / (b.max.y - b.min.y)); };
    const put = async (kit, name, x, z, ry = 0, o = {}) => { const g = await load(kit === 'polyhaven' ? `./assets/props/polyhaven/${name}/${name}.gltf` : `./assets/props/${kit}/${name}.${kit === 'kenney' ? 'glb' : 'gltf'}`); const k = (await kitScale(kit)) * (o.k || 1);
      const obj = g.scene.clone(true); const ms = []; obj.traverse(m => { if (m.isMesh) ms.push(m); }); ms.forEach(m => { const src = m.material; if (kit === 'polyhaven') { m.castShadow = m.receiveShadow = true; if (src.map) src.map.anisotropy = 8; return; }   // Poly Haven: keep the scanned PBR materials
        m.material = new THREE.MeshStandardMaterial({ color: src.color ? src.color.clone() : new THREE.Color('#ffffff'), map: src.map || null, roughness: Math.max(0.45, src.roughness ?? 0.7), metalness: Math.min(0.2, src.metalness ?? 0) }); m.castShadow = true; m.receiveShadow = true;
        if (!o.noInk && Q.get('propink') === '1') { const h = new THREE.Mesh(m.geometry, hull(0.012 / k)); m.add(h); } });   // props: no ink line, real-looking like the RicksClips worlds
      obj.name = name; obj.scale.setScalar(k); obj.rotation.y = ry; obj.position.set(x, (o.y ?? FY), z); O.add(obj);
      if (kit === 'polyhaven') { obj.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(obj), c2 = bb.getCenter(V(0, 0, 0)); obj.position.x += x - c2.x; obj.position.z += z - c2.z; obj.position.y += (o.y ?? FY) - bb.min.y; }   // footprint centred on (x, z), sitting on the floor/desk
      return obj; };
    const SET = Q.get('set') || 'office', ZD = Z - 2.9;
    if (SET === 'office') {   // Poly Haven CC0 scans (desks, chairs, lamps, plants, shelves) + Kenney monitors
      for (const [i, x] of [-6.2, -2.1, 2.1, 6.2].entries()) { await put('polyhaven', 'metal_office_desk', x, ZD, 0); await put('kenney', i === 1 ? 'laptop' : 'computerScreen', x, ZD, 0, { y: FY + 0.66 });
        if (i !== 1) { await put('kenney', 'computerKeyboard', x, ZD + 0.12, 0, { y: FY + 0.66 }); await put('kenney', 'computerMouse', x + 0.35, ZD + 0.12, 0, { y: FY + 0.66 }); }
        await put('polyhaven', 'modern_arm_chair_01', x + 0.1, ZD - 0.8, Math.PI); await put('polyhaven', i % 2 ? 'office_notepads' : 'clipboard', x - 0.55, ZD + 0.05, 0.4, { y: FY + 0.66 }); }
      await put('polyhaven', 'desk_lamp_arm_01', -6.75, ZD - 0.15, 0.6, { y: FY + 0.66 }); await put('polyhaven', 'desk_lamp_arm_01', 6.75, ZD - 0.15, -0.6, { y: FY + 0.66 }); await put('polyhaven', 'alarm_clock_01', 2.7, ZD - 0.15, -0.3, { y: FY + 0.66 });
      await put('polyhaven', 'potted_plant_04', -1.6, ZD - 0.2, 0, { y: FY + 0.66 }); await put('polyhaven', 'ceramic_vase_01', 6.0, ZD - 0.25, 0, { y: FY + 0.66 });
      await put('polyhaven', 'Shelf_01', 7.6, ZB + 0.35, 0); await put('polyhaven', 'book_encyclopedia_set_01', 7.6, ZB + 0.35, 0, { y: FY + 1.0 }); await put('polyhaven', 'drawer_cabinet', -7.7, ZB + 0.45, 0); await put('polyhaven', 'painted_wooden_shelves', -4.7, ZB + 0.3, 0);
      await put('polyhaven', 'pachira_aquatica_01', -8.5, Z + 2.8, 0); await put('polyhaven', 'potted_plant_01', 8.5, ZB + 1.4, 0); await put('polyhaven', 'potted_plant_02', -8.5, Z - 1.2, 0);
      await put('polyhaven', 'CoffeeCart_01', 8.4, Z + 0.4, -Math.PI / 2); await put('polyhaven', 'hanging_picture_frame_01', -8.95, Z - 3.4, Math.PI / 2, { y: FY + 1.7 }); await put('polyhaven', 'hanging_picture_frame_02', 8.95, Z - 3.6, -Math.PI / 2, { y: FY + 1.7 });
      await put('polyhaven', 'fire_alarm', 5.2, ZB + 0.12, 0, { y: FY + 2.6 }); for (const x of [-5, 0, 5]) await put('polyhaven', 'mounted_fluorescent_lights', x, Z - 1, 0, { y: FY + 4.05 });
      await put('kaykit', 'rug_rectangle_stripes_A', 0, Z + 0.4, 0, { k: 2.2, y: FY + 0.005, noInk: true });
    } else {
      // home: living room + kitchen corner
      await put('kaykit', 'couch_pillows', -1.2, ZB + 1.1, 0, { k: 1.25 }); await put('kaykit', 'armchair_pillows', -4.6, Z - 2.6, 0.7, { k: 1.25 }); await put('kaykit', 'table_low', -1.2, Z - 2.4, 0, { k: 1.2 });
      await put('kaykit', 'rug_rectangle_stripes_B', -1.2, Z - 2.4, 0, { k: 2.6, y: FY + 0.005, noInk: true }); await put('kaykit', 'lamp_standing', -3.6, ZB + 0.8, 0, { k: 1.3 }); await put('kaykit', 'shelf_B_large_decorated', 1.9, ZB + 0.5, 0, { k: 1.2 });
      await put('kenney', 'cabinetTelevision', -8.5, Z - 2.4, Math.PI / 2); await put('kenney', 'televisionModern', -8.5, Z - 2.4, Math.PI / 2, { y: FY + 0.5 });   // TV on the side wall, out of the lineup
      for (const [n, x, y] of [['pictureframe_large_B', -2.6, 2.4], ['pictureframe_medium', -0.2, 2.6], ['pictureframe_small_C', 0.6, 2.2]]) await put('kaykit', n, x, ZB + 0.15, 0, { y: FY + y });
      await put('kenney', 'kitchenFridge', 4.4, ZB + 0.55, 0); await put('kenney', 'kitchenCabinet', 5.4, ZB + 0.55, 0); await put('kenney', 'kitchenStove', 6.3, ZB + 0.55, 0); await put('kenney', 'kitchenSink', 7.2, ZB + 0.55, 0); await put('kenney', 'kitchenCabinetUpper', 5.4, ZB + 0.3, 0, { y: FY + 1.35 });
      await put('kenney', 'kitchenCoffeeMachine', 5.4, ZB + 0.55, 0, { y: FY + 0.62 }); await put('kenney', 'tableRound', 6, Z - 1.5, 0); for (const a of [0, 2.1, 4.2]) await put('kaykit', 'chair_A_wood', 6 + Math.sin(a) * 0.75, Z - 1.5 + Math.cos(a) * 0.75, a + Math.PI);
      await put('kenney', 'pottedPlant', -8.4, ZB + 1.0, 0, { k: 1.4 }); await put('kaykit', 'cactus_medium_A', 8.4, Z + 1.5, 0, { k: 1.3 }); await put('kenney', 'ceilingFan', -1.2, Z - 2.4, 0, { y: FY + 3.4 });
      for (const sx of [-1, 1]) for (const o of O.children) {}
    } }
  const fit = () => { const k = Math.min(innerWidth / WW, innerHeight / HH); canvas.style.width = `${WW * k}px`; canvas.style.height = `${HH * k}px`; };
  document.body.style.cssText = 'margin:0;background:#1d2430;display:flex;justify-content:center;align-items:flex-start;height:100vh;overflow:hidden;font:15px system-ui,sans-serif';
  fit(); addEventListener('resize', fit);
  camera.position.set(0, 1.4, -14.5); const ctl = new OrbitControls(camera, canvas); ctl.target.set(0, 1.0, Z); ctl.enableDamping = true; ctl.minDistance = 1.7; ctl.maxDistance = 25; ctl.zoomSpeed = 0.35;   // gentle zoom; never closer than a head-and-shoulders shot (owner 2026-11-10) ctl.maxPolarAngle = Math.PI * 0.53; ctl.update();
  // compare mode: &who=<i>&dist=<m>&mood=<face> → camera straight on that head (used to match the RicksClips reference side by side)
  if (Q.has('who')) { const i = +Q.get('who'); const hp = () => { place(CAST[i], POS[i].x, POS[i].z, 0); idle(CAST[i], 0); return headC(CAST[i]); }; const h = hp(); ctl.target.copy(h); camera.position.copy(h).add(V(0, 0.05, +(Q.get('dist') || 1.6))); camera.fov = 30; camera.updateProjectionMatrix(); ctl.update(); }
  const st = { who: -1, mood: Q.get('mood') || 'calm', pose: 'idle', spin: false };
  if (!Q.has('who')) { const mid = POS[1].clone().lerp(POS[2], 0.5); ctl.target.set(mid.x + 2.0, 0.9, Z - 1.2); camera.position.set(mid.x + 3.0, 3.6, Z + 10.5); ctl.update(); }
  const ui = document.createElement('div'); ui.style.cssText = 'position:fixed;right:12px;top:12px;width:280px;max-height:calc(100vh - 24px);overflow:auto;background:rgba(255,255,255,.95);color:#1b1b1f;border-radius:12px;padding:12px;box-shadow:0 6px 24px rgba(0,0,0,.3)';
  const moods = Object.keys(FACES), poses = [['idle', 'Đứng'], ['walk', 'Đi'], ['run', 'Chạy'], ['wave', 'Vẫy tay'], ['laugh', 'Cười ôm bụng']];
  ui.innerHTML = `<b style="font-size:17px">Duyệt nhân vật 3D</b><div style="color:#666;font-size:13px;margin:4px 0 10px">Kéo để xoay · cuộn/chụm 2 ngón để zoom · chuột phải/2 ngón kéo để dời</div>
    <label>Nhân vật<br><select id="vw-who" style="width:100%;padding:6px;margin:4px 0 8px"><option value="-1">Cả dàn</option>${NAMES.map((n, i) => `<option value="${i}">${n}</option>`).join('')}</select></label>
    <label>Nét mặt<br><select id="vw-mood" style="width:100%;padding:6px;margin:4px 0 8px">${moods.map((m) => `<option>${m}</option>`).join('')}</select></label>
    <label>Dáng<br><select id="vw-pose" style="width:100%;padding:6px;margin:4px 0 8px">${poses.map(([k, n]) => `<option value="${k}">${n}</option>`).join('')}</select></label>
    <label style="display:block;margin:4px 0 12px"><input type="checkbox" id="vw-spin"> Tự xoay vòng</label>
    <textarea id="vw-note" rows="4" placeholder="Góp ý cho nhân vật đang chọn (màu, mặt, dáng, quần áo…)" style="width:100%;box-sizing:border-box;padding:6px"></textarea>
    <div style="display:flex;gap:8px;margin-top:8px"><button id="vw-ok" style="flex:1;padding:8px;background:#2f9e44;color:#fff;border:0;border-radius:8px">OK</button><button id="vw-fix" style="flex:1;padding:8px;background:#e8590c;color:#fff;border:0;border-radius:8px">Cần sửa</button></div>
    <div id="vw-sent" style="color:#2f9e44;font-size:13px;margin-top:6px"></div>`;
  document.body.appendChild(ui);
  const $ = (id) => ui.querySelector(id);
  $('#vw-who').onchange = (e) => { st.who = +e.target.value; const p = st.who < 0 ? V(0, 1.0, Z) : POS[st.who].clone().setY(1.15); const d = camera.position.clone().sub(ctl.target); ctl.target.copy(p); camera.position.copy(p).add(st.who < 0 ? V(0, 0.4, 5.5) : d.setLength(3.6)); ctl.update(); };
  $('#vw-mood').onchange = (e) => (st.mood = e.target.value); $('#vw-pose').onchange = (e) => (st.pose = e.target.value); $('#vw-spin').onchange = (e) => (st.spin = e.target.checked);
  const send = async (verdict) => { const who = st.who < 0 ? 'Cả dàn' : NAMES[st.who];
    try { const r = await fetch('/api/feedback/nhan-vat-3d', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ item: `${who} · mặt ${st.mood} · dáng ${st.pose}`, verdict, note: $('#vw-note').value }) });
      $('#vw-sent').textContent = r.ok ? `Đã gửi: ${verdict} · ${who}` : 'Gửi lỗi'; if (r.ok) $('#vw-note').value = ''; } catch { $('#vw-sent').textContent = 'Gửi lỗi'; } };
  $('#vw-ok').onclick = () => send('OK'); $('#vw-fix').onclick = () => send('Cần sửa');
  let t0 = performance.now();
  const loop = () => { const t = (performance.now() - t0) / 1000;
    resetScene(); setLook('day'); if (!OFFICE) camp(); else { const dim = Q.get('light') !== 'bright'; hemi.intensity = dim ? 0.32 : 0.55; hemi.color.set(dim ? '#9fb4e0' : '#fff3e2'); sun.intensity = dim ? 2.6 : 2.2; sun.color.set(dim ? '#ffd29a' : '#fff0d8'); SUNDIR.set(0.35, 0.5, -0.75).normalize();
      U.uSat.value = 1.2; U.uCon.value = dim ? 1.22 : 1.14; U.uWarm.value = 0.07; renderer.toneMappingExposure = dim ? 0.42 : 0.72; U.uVig.value = dim ? 0.55 : 0.82; }
    CAST.forEach((c, i) => { const p = POS[i], ry = st.spin ? t * 0.8 : +(Q.get('ry') || 0); place(c, p.x, p.z, ry, OFFICE ? FY : undefined);
      if (st.pose === 'walk' || st.pose === 'run') SR.clipAt(c, st.pose, t); else idle(c, t);
      if (st.pose === 'wave') waveArms(c, t); if (st.pose === 'laugh') laughPose(c, t);
      face(c, st.mood); });
    ALL.forEach((c) => SR.updateLimbs(c)); if (!OFFICE) W.update(t, ctl.target);
    const f = ctl.target.clone(); sun.target.position.copy(f); sun.position.copy(f).addScaledVector(SUNDIR, 60); const sc = sun.shadow.camera; sc.left = sc.bottom = -8; sc.right = sc.top = 8; sc.near = 1; sc.far = 140; sc.updateProjectionMatrix();
    post.bokeh.enabled = false; U.uTime.value = t; ctl.update(); post.render(); requestAnimationFrame(loop); };
  if (!Q.has('skit')) loop(); else {
  // ---------- 10 s skit "Trả lời tất cả" (owner 2026-11-10: "làm thử 1 kịch bản nhẹ nhẹ 10s") ----------
  ui.style.display = 'none';
  const O = OFF_O, VEST = OUTF[1], ZD = Z - 2.9, DESKS = [-6.2, -2.1, 2.1, 6.2], ME = 2.1, CO = [[thua, -6.2], [ti, -2.1], [chief, 6.2]];
  const CHZ = ZD - 0.55, SEATY = FY;   // standing desks: people stand behind the desk (chairs hidden)
  O.children.filter(o => o.name === 'chairDesk' || o.name === 'modern_arm_chair_01').forEach(o => (o.visible = false));
  const myMouse = O.children.find(o => o.name === 'computerMouse' && Math.abs(o.position.x - (ME + 0.35)) < 0.05); if (myMouse) myMouse.visible = false;
  const MOUSEP = V(ME - 0.24, FY + 0.69, ZD - 0.33);
  { const mm = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.04, 6, 12), new THREE.MeshStandardMaterial({ color: '#2b2f38', roughness: 0.35 })); mm.rotation.x = Math.PI / 2; mm.scale.set(1, 1, 0.55); mm.position.copy(MOUSEP).add(V(0, -0.012, 0)); mm.castShadow = true; O.add(mm);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.004, 0.22), new THREE.MeshStandardMaterial({ color: '#3d7be0', roughness: 0.8 })); pad.position.copy(MOUSEP).add(V(0, -0.03, 0)); O.add(pad); }   // his own mouse + pad (the kit mouse sat off the desk)
  // his monitor turns toward him; everyone's screen gets a flash panel; his screen shows the mail app
  const screens = []; O.traverse(o => { if (o.isObject3D && o.parent === O && Math.abs(o.position.z - ZD) < 0.01 && o.position.y > FY + 0.5 && DESKS.some(x => Math.abs(o.position.x - x) < 0.01)) screens.push(o); });
  screens.filter(o => Math.abs(o.position.x - ME) < 0.01).forEach(o => (o.rotation.y = Math.PI));
  const mail = document.createElement('canvas'); mail.width = 640; mail.height = 400; const mg = mail.getContext('2d'), mailT = new THREE.CanvasTexture(mail); mailT.colorSpace = THREE.SRGBColorSpace;
  const drawMail = (k, click) => { mg.fillStyle = '#f4f6fa'; mg.fillRect(0, 0, 640, 400); mg.fillStyle = '#2b5cc8'; mg.fillRect(0, 0, 640, 56); mg.fillStyle = '#fff'; mg.font = 'bold 28px Inter, sans-serif'; mg.fillText('Thư: Họp lúc 9h', 20, 38);
    mg.fillStyle = '#333'; mg.font = '24px Inter, sans-serif'; mg.fillText('Từ: Sếp', 24, 100); mg.fillText('Tới: Toàn công ty (300 người)', 24, 136); mg.fillStyle = '#111'; mg.font = 'bold 40px Inter, sans-serif'; mg.fillText('Ok', 24, 220);
    const bt = (x, w, label, hot) => { mg.fillStyle = hot ? '#e8442a' : '#dde3ee'; mg.fillRect(x, 300, w, 64); mg.fillStyle = hot ? '#fff' : '#223'; mg.font = 'bold 26px Inter, sans-serif'; mg.fillText(label, x + 16, 342); };
    bt(24, 170, 'Trả lời', false); bt(214, 260, 'Trả lời tất cả', click); const cx = 120 + (330 - 120) * k, cy = 330 - 10 * Math.sin(k * 3.14);
    mg.fillStyle = '#000'; mg.beginPath(); mg.moveTo(cx, cy); mg.lineTo(cx, cy + 34); mg.lineTo(cx + 10, cy + 25); mg.lineTo(cx + 22, cy + 30); mg.fill(); if (click) { mg.strokeStyle = 'rgba(232,68,42,0.8)'; mg.lineWidth = 6; mg.beginPath(); mg.arc(cx, cy, 26, 0, 7); mg.stroke(); } mailT.needsUpdate = true; };
  const myScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.31), new THREE.MeshBasicMaterial({ map: mailT, toneMapped: false })); myScreen.rotation.y = Math.PI; myScreen.position.set(ME, FY + 0.95, ZD - 0.045); O.add(myScreen);
  const flashes = DESKS.filter(x => x !== ME).map(x => { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.32), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.4, 2.8), transparent: true, opacity: 0, toneMapped: false })); f.position.set(x, FY + 0.95, ZD + 0.05); O.add(f); return f; });
  const bubble = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 60, 50, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#2a1612'; g.stroke(); g.fillStyle = '#e8442a'; g.font = 'bold 72px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('!', 64, 86); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const bubbles = CO.map(() => { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubble, transparent: true, depthTest: false })); b.scale.setScalar(0.38); b.visible = false; scene.add(b); return b; });
  const sit = (c, x, ry, dy = 0) => { place(c, x, CHZ, ry, SEATY - dy); SR.clipAt(c, 'idle', 0.4); if (dy > 0.01) hips(c, 0); const f = dirW(c, 0, 0, 1); arm(c, 'Left', Lw(c, 0.18, 0.95, 0.5)); arm(c, 'Right', Lw(c, -0.18, 0.95, 0.5)); };
  const type = (c, t) => { const a = 0.03 * Math.sin(t * 28), b = 0.03 * Math.sin(t * 31 + 1); arm(c, 'Left', Lw(c, 0.16, 0.97 + a, 0.52)); arm(c, 'Right', Lw(c, -0.16, 0.97 + b, 0.52)); };
  const T2 = 3.19, CLICK = 5.0, T3 = 5.6, T4 = 7.9;
  const LOOKAT = (c) => { const p = V(ME, 1.4, CHZ); return yawTo(c.root.position.x, c.root.position.z, p.x, p.z); };
  const frame = (t) => { resetScene(); setLook('day'); hemi.intensity = 0.32; hemi.color.set('#9fb4e0'); sun.intensity = 2.6; sun.color.set('#ffd29a'); SUNDIR.set(0.35, 0.5, -0.75).normalize(); U.uSat.value = 1.2; U.uCon.value = 1.22; U.uWarm.value = 0.07; renderer.toneMappingExposure = 0.42; U.uVig.value = 0.55;
    OUTF.forEach(c => (c.root.visible = false)); ex.forEach(c => (c.root.visible = false));
    // him
    const sink = clamp((t - T4) / 1.6); sit(VEST, ME, 0, eio(sink) * 0.75); if (t < CLICK) type(VEST, t); face(VEST, t < T2 ? 'smug' : t < CLICK ? 'calm' : t < T4 ? 'wide' : 'pale');
    if (t >= 3.6 && t < T4) { const press = t > CLICK && t < CLICK + 0.15 ? -0.015 : 0; arm(VEST, 'Right', MOUSEP.clone().add(V(0, 0.05 + press, 0.0))); }   // his left mitten on the mouse (camera side of the frame)
    drawMail(clamp((t - 3.6) / (CLICK - 3.6)), t >= CLICK && t < CLICK + 0.5);
    // coworkers at their desks: type, then the ping, the screen flash, heads turn to him
    CO.forEach(([c, x], i) => { const tt = T3 + i * 0.18, turn = eio(clamp((t - tt - 0.35) / 0.4)); sit(c, x, turn * (LOOKAT(c) * 0.9)); if (t < tt) type(c, t + i); face(c, t < tt + 0.3 ? 'calm' : 'wide');
      const b = bubbles[i]; b.visible = t > tt + 0.1 && t < 9.4; const h = headC(c); b.position.set(h.x + 0.25, h.y + 0.42 + 0.05 * Math.sin(t * 9), h.z); b.scale.setScalar(0.38 * Math.min(1, (t - tt - 0.1) * 6)); });
    flashes.forEach((f, i) => { const tt = T3 + i * 0.18; f.material.opacity = t > tt ? Math.max(0, 1 - (t - tt) * 1.6) * 0.9 : 0; });
    ALL.forEach(c => SR.updateLimbs(c));
    // shots — director's plan (camera-cinematography + camera grammar): establish → low hero push → OTS insert → ECU click snap → whip-pan reactions → dolly-zoom "oh no"
    let dofD = 0, dofA = 0;
    const HEAD = headC(VEST), MOUSE = MOUSEP;
    if (t < 1.7) { const u = eio(t / 1.7); look(V(lerp(-3.5, 0.6, u), lerp(4.1, 2.6, u), lerp(Z + 4.5, ZD + 4.2, u)), V(lerp(-0.5, ME, u), lerp(1.0, 1.35, u), ZD - 0.3), 52); }   // 1 ESTABLISH: crane down from the ceiling corner, sun shafts, office geography
    else if (t < T2) { const u = eio((t - 1.7) / (T2 - 1.7)); look(V(ME + 1.55 - u * 0.25, lerp(1.0, 1.1, u), lerp(ZD + 1.2, ZD + 0.95, u)), V(ME + 0.05, 1.62, CHZ), 38); dofD = 1.9; dofA = 0.012; }   // 2 LOW ANGLE push-in: smug hero, background soft
    else if (t < 4.6) { const u = eio((t - T2) / (4.6 - T2)); look(V(ME + 0.55 - u * 0.12, 1.66, CHZ - 0.55 + u * 0.12), V(ME + 0.05, FY + 0.95, ZD), 30); dofD = 0.85; dofA = 0.008; }   // 3 OTS insert: his shoulder blurred in the foreground, the cursor creeps to "Trả lời tất cả"
    else if (t < 5.45) { const u = (t - 4.6) / 0.85, snap = t > CLICK ? eio(clamp((t - CLICK) / 0.12)) : 0; look(MOUSE.clone().add(V(-0.55, 0.3, -0.5)).lerp(MOUSE.clone().add(V(-0.3, 0.16, -0.28)), 0.35 * u + 0.5 * snap), MOUSE.clone().add(V(0, 0.03, 0)), lerp(36, 22, snap)); dofD = 0.5; dofA = 0.01; }   // 4 ECU mitten on the mouse, snap-zoom on the click
    else if (t < T4) { const A = headC(ti), B = headC(thua), P = V(-4.15, 1.6, ZD + 2.3), w = eio(clamp((t - 6.55) / 0.28)), shake = (t > 6.55 && t < 6.9) ? Math.sin(t * 90) * 0.01 : 0;   // 5 hold on Tí → WHIP PAN → hold on Thừa
      look(P.clone().add(V(0, 0, -0.25 * clamp((t - 5.45) / 2.4))), A.clone().lerp(B, w).add(V(shake, -0.15, 0)), 40, (w > 0 && w < 1) ? 0.05 : 0); dofD = 2.6; dofA = 0.01; }
    else { const u = eio((t - T4) / (10 - T4)), dz = lerp(1.2, 3.2, u), fov = 2 * Math.atan(0.42 / dz) * 180 / Math.PI;   // 6 DOLLY ZOOM (vertigo) + dutch tilt on the "oh no"
      look(V(ME + 0.05, 1.55, CHZ + dz), V(ME, 1.5 - u * 0.12, CHZ), fov, -0.09 * u); dofD = dz; dofA = 0.015; }
    post.bokeh.enabled = dofD > 0; if (dofD > 0) { post.bokeh.uniforms.focus.value = dofD; post.bokeh.uniforms.aperture.value = dofA; }
    const f = V(ME, 1, ZD); sun.target.position.copy(f); sun.position.copy(f).addScaledVector(SUNDIR, 60); const sc = sun.shadow.camera; sc.left = sc.bottom = -10; sc.right = sc.top = 10; sc.near = 1; sc.far = 140; sc.updateProjectionMatrix();
    U.uTime.value = t; post.render(); return canvas.toDataURL('image/jpeg', 0.92); };
  window.frame = frame; window.DUR = 10; window.ready = true; }
}
