// stickrig.js — 3D người que on a Mixamo skeleton (approved look 2026-11-08, test: episodes/stick3d-test, lineup.js).
// Flat black head + warm rim crescent + cool kicker, tiny white canvas face, stick neck, thin stick legs, slim sleeves, black
// mitt hands, sneakers/boots/sandals, faceted outfits; uniforms + hats for war history (ARMY presets: bộ đội VN mũ cối,
// giải phóng quân mũ tai bèo, lính Mỹ M1, lính Pháp mũ nồi đỏ + rằn ri, lính TQ 1979).
// Parts are attach()ed to the bones, so any Mixamo clip drives them (Xbot clips: idle, walk, run, sneak_pose, sad_pose, agree, headShake).
//
//   import { makeStickRig } from './stickrig.js';
//   const SR = await makeStickRig(scene, './assets/rigs/Xbot.glb');
//   const vm = SR.build({ ...SR.ARMY[0], clip: 'walk' }, new THREE.Vector3(2, 0, -1), Math.PI / 2);
//   // per frame: vm.mixer.setTime(t)   (seek-safe; or crossfade vm.actions.run etc.)
//   // custom face: o.face = g => { SR.eyes(g, { px, py }); SR.smile(g); }  ·  SR.RIM.dir/col/kdir/kcol = rim lights (view space)
// Look-dev notes: RIM.dir is in VIEW space; set it per shot toward the key light. Limbs are 1.3–1.9 cm sticks (owner: "chân tay que nhỏ").
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export async function makeStickRig(scene, url = './assets/rigs/Xbot.glb') {
// ---------- materials: toon + warm key rim + cool kicker rim ----------
const ramp = (() => { const d = new Uint8Array([95, 160, 220, 255]); const t = new THREE.DataTexture(d, 4, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const RIM = { dir: { value: V(-0.6, 0.65, -0.1).normalize() }, col: { value: new THREE.Color('#ffc27e') }, kdir: { value: V(0.75, 0.2, -0.1).normalize() }, kcol: { value: new THREE.Color('#7fd6ff') } };
const ramp2 = (() => { const d = new Uint8Array([200, 255]); const t = new THREE.DataTexture(d, 2, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
function toon(color, o = {}) {
  const m = new THREE.MeshToonMaterial({ color, gradientMap: o.flat2 ? ramp2 : ramp, side: o.side || THREE.FrontSide, map: o.map || null });
  const r = o.rim ?? 0.55, k = o.kick ?? 0.35;
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, { rimDir: RIM.dir, rimCol: RIM.col, kDir: RIM.kdir, kCol: RIM.kcol });
    sh.fragmentShader = 'uniform vec3 rimDir, rimCol, kDir, kCol;\n' + sh.fragmentShader.replace('#include <opaque_fragment>',
      `{ vec3 nn = normalize(normal); float fr = 1.0 - max(dot(nn, normalize(vViewPosition)), 0.0);
         outgoingLight += rimCol * smoothstep(0.62, 0.68, fr) * smoothstep(0.1, 0.5, dot(nn, rimDir)) * ${r.toFixed(2)};
         outgoingLight += kCol * smoothstep(0.66, 0.72, fr) * smoothstep(0.1, 0.5, dot(nn, kDir)) * ${k.toFixed(2)}; }\n#include <opaque_fragment>`); };
  m.customProgramCacheKey = () => `t${r}${k}${!!o.flat}${!!o.map}${!!o.flat2}`; return m;
}
// o.pattern = [kind, colour2]: stripes | hstripes | pinstripe | plaid | dots | zigzag — full-colour tile over the shirt colour
const PATC = {};
function patTex(kind, base, c2) { const key = kind + base + c2; if (PATC[key]) return PATC[key];
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.fillStyle = c2; g.strokeStyle = c2;
  let rep = [1, 1];
  if (kind === 'stripes') { g.fillRect(0, 0, 96, 256); rep = [7, 1]; }
  else if (kind === 'hstripes') { g.fillRect(0, 0, 256, 90); rep = [1, 7]; }
  else if (kind === 'pinstripe') { g.fillRect(0, 0, 22, 256); rep = [12, 1]; }
  else if (kind === 'plaid') { g.globalAlpha = 0.45; g.fillRect(0, 0, 80, 256); g.fillRect(0, 0, 256, 80); g.globalAlpha = 1; g.fillRect(150, 0, 14, 256); g.fillRect(0, 150, 256, 14); rep = [5, 4]; }
  else if (kind === 'dots') { for (const [x, y] of [[64, 64], [192, 192], [192, 64], [64, 192]]) { g.beginPath(); g.arc(x, y, 30, 0, 7); g.fill(); } rep = [4, 4]; }
  else if (kind === 'zigzag') { g.lineWidth = 34; g.beginPath(); g.moveTo(0, 150); for (let x = 0; x <= 256; x += 64) g.lineTo(x, x % 128 ? 80 : 170); g.stroke(); rep = [5, 4]; }
  if (kind === 'vest') { g.fillStyle = base; g.fillRect(0, 0, 256, 256); const V = (cx) => { // lapels (c2) then the white shirt V, tip at 52% height
      g.fillStyle = c2; g.beginPath(); g.moveTo(cx - 44, 0); g.lineTo(cx, 128); g.lineTo(cx + 44, 0); g.fill();
      g.fillStyle = '#f7f5f0'; g.beginPath(); g.moveTo(cx - 28, 0); g.lineTo(cx, 120); g.lineTo(cx + 28, 0); g.fill();
      g.strokeStyle = '#2a1612'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 44, 0); g.lineTo(cx, 128); g.lineTo(cx + 44, 0); g.stroke(); };
    V(0); V(256); rep = [1, 1]; }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return (PATC[key] = t); }
const grainTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { const v = 175 + Math.random() * 80 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1); }
  for (let x = 0; x < 256; x += 4) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(x, 0, 1, 256); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const ribTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128); for (let x = 0; x < 128; x += 8) { g.fillStyle = 'rgba(0,0,0,0.26)'; g.fillRect(x, 0, 3, 128); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 1); t.colorSpace = THREE.SRGBColorSpace; return t; })();
function cloth(color, o = {}) { const m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.92, metalness: o.metal ?? 0, map: o.map === null ? null : (o.map || grainTex), bumpMap: o.map === null ? null : (o.map || grainTex), bumpScale: 1.6, side: o.side || THREE.FrontSide });
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, { rimDir: RIM.dir, rimCol: RIM.col });
    sh.fragmentShader = 'uniform vec3 rimDir, rimCol;\n' + sh.fragmentShader.replace('#include <opaque_fragment>',
      `{ vec3 nn = normalize(normal); float fr = 1.0 - max(dot(nn, normalize(vViewPosition)), 0.0);
         outgoingLight *= mix(1.0, ${Math.max(0.68, o.ao ?? 0.45).toFixed(2)}, smoothstep(0.35, 0.97, fr)); outgoingLight *= mix(0.78, 1.0, smoothstep(-0.75, 0.25, nn.y)); outgoingLight += diffuseColor.rgb * 0.12;
         outgoingLight += rimCol * smoothstep(0.62, 0.7, fr) * smoothstep(0.1, 0.5, dot(nn, rimDir)) * 0.35; }\n#include <opaque_fragment>`); };
  m.customProgramCacheKey = () => 'cloth' + (o.ao ?? 0.6) + (o.map === null ? 'n' : o.map ? 'm' : 'g'); return m; }
const INK = '#2a1612';   // dark plum line sampled from "Nghe tàu tới" (2026-11-10)   // dark warm brown-plum like the RicksClips line (sampled 2026-11-10; was near-black #0d0b10)
const INK_RES = new THREE.Vector2(1080, 1920);
const inkPx = (px) => new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { res: { value: INK_RES }, px: { value: px }, col: { value: new THREE.Color(INK) } },
  vertexShader: `uniform vec2 res; uniform float px; void main(){ vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vec3 vn = normalize(normalMatrix * normal);
    vec2 d = (projectionMatrix * vec4(vn, 0.0)).xy; float L = length(d); d = L > 1e-5 ? d / L : vec2(0.0);
    float bw = 0.85 + 0.15 * sin(position.x * 23.0 + position.y * 17.0);   // a little brush wobble
    c.xy += d * px * (res.y / 1000.0) * bw * 2.0 / res * c.w; /* px on a 1000-px-tall frame */ c.z += 0.0005 * c.w; gl_Position = c; }`,
  fragmentShader: `uniform vec3 col; void main(){ gl_FragColor = vec4(col, 1.0); }` });   // outline in screen pixels: same thickness at any zoom/distance
const inkClean = (w) => { const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }); m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n vec3 nn = normalize(normal); float bw = 0.62 + 0.38 * sin(nn.x * 3.1 + nn.y * 2.3 + 0.8) * sin(nn.y * 2.7 - nn.z * 1.9 + 1.7) + 0.22 * sin(nn.x * 7.3 - nn.y * 5.1 + nn.z * 3.7) + 0.25 * smoothstep(0.2, -0.8, nn.y);\n transformed += nn * ${w.toFixed(4)} * max(0.35, bw);`); }; m.customProgramCacheKey = () => 'inkc' + w; return m; };   // brush-like outline: thick/thin swells, heavier under the chin (owner 2026-11-10 "giống vẽ tay")
const inkM = (w) => { const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }); m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${w.toFixed(4)} * (0.74 + 0.2 * sin(position.x * 11.0 + position.y * 8.0 + 0.7) + 0.12 * sin(position.y * 19.0 - position.z * 13.0) + 0.08 * sin(position.z * 27.0 + position.x * 17.0));`); }; m.customProgramCacheKey = () => 'ink' + w; return m; };
const ink = (m, w = 0.005) => { m.add(new THREE.Mesh(m.geometry, inkM(w))); return m; };
const mesh = (g, m, o = {}) => { const x = new THREE.Mesh(g, m); x.castShadow = o.cast ?? true; x.receiveShadow = true; if (o.ink) ink(x, o.ink); return x; };
// black head: flat black + crisp warm rim crescent + cool kicker + optional lacquer gloss
function headMat(o = {}) { return new THREE.ShaderMaterial({ uniforms: { rimDir: RIM.dir, rimCol: RIM.col, kDir: RIM.kdir, kCol: RIM.kcol, gloss: { value: o.gloss || 0 }, base: { value: (() => { const c = new THREE.Color(o.base || '#0a090c'); if (o.gain) { c.r *= o.gain[0]; c.g *= o.gain[1]; c.b *= o.gain[2]; } return c; })() }, shade: { value: o.shade || 0 }, flatK: { value: o.flat ? 1 : 0 }, ell: { value: new THREE.Vector3(...(o.ell || [1, 1, 1])) } },
  vertexShader: 'uniform vec3 ell; varying vec3 vN; varying vec3 vV; varying vec3 vSN; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vSN = normalize(normalMatrix * normalize(position / (ell * ell))); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: `uniform vec3 rimDir, rimCol, kDir, kCol, base; uniform float gloss, shade, flatK; varying vec3 vSN; varying vec3 vN; varying vec3 vV;
    void main(){ vec3 n = normalize(vN), v = normalize(vV); float fr = 1.0 - max(dot(n, v), 0.0); vec3 c = base * mix(1.0, 0.7 + 0.3 * smoothstep(-0.45, 0.5, dot(n, normalize(vec3(-0.45, 0.6, 0.6)))) - 0.12 * smoothstep(0.5, 0.97, fr) - 0.1 * smoothstep(0.0, -0.8, n.y), shade); c *= vec3(1.0, 0.985, 1.02) * (1.0 - 0.0 * fr);   // white heads: 2-tone soft cel shade
      c = mix(c, c * vec3(0.66, 0.66, 0.72), shade * smoothstep(-0.05, -0.6, n.y));   // soft grey shadow under the head (RicksClips)
      c = mix(c, c * vec3(0.8, 0.8, 0.86), shade * smoothstep(0.1, -0.7, dot(n, normalize(vec3(-0.45, 0.6, 0.6)))) * 0.7);
      c += rimCol * smoothstep(0.64, 0.68, fr) * smoothstep(0.15, 0.55, dot(n, rimDir)) * 1.15;
      c += kCol * smoothstep(0.70, 0.74, fr) * smoothstep(0.15, 0.55, dot(n, kDir)) * 0.7;
      vec3 r = reflect(-v, n); float sp = dot(r, normalize(vec3(-0.45, 0.6, 0.65)));
      c += vec3(1.0, 0.97, 0.92) * gloss * (smoothstep(0.955, 0.965, sp) * 0.9 + smoothstep(0.6, 1.0, sp) * 0.06);   // crisp cartoon highlight + soft sheen
      // flat 2D-looking head (owner 2026-11-10: "bóng với tròn quá"): plain fill + one hard cel shadow, no rim/sheen
      float ld = dot(n, normalize(vec3(-0.45, 0.6, 0.6))), rag = 0.08 * sin(n.x * 23.0 + n.y * 17.0) + 0.05 * sin(n.y * 41.0 - n.z * 29.0);
      float cel = smoothstep(-0.05, 0.08, ld + rag) * 0.5 + 0.5 * smoothstep(-0.42, -0.28, ld + rag);
      float streak = 0.025 * sin(n.x * 60.0 + n.y * 14.0 + sin(n.y * 9.0) * 3.0) + 0.015 * sin(n.y * 90.0 - n.x * 20.0);
      float soft = smoothstep(-0.25, 0.75, ld + rag * 0.6);   // soft wrap-around shadow like the RicksClips heads
      vec3 cf = base * (mix(vec3(0.72, 0.70, 0.78), vec3(1.0), soft) + streak);
      cf *= mix(1.0, 0.82, smoothstep(-0.1, -0.75, n.y));   // darker under the chin
      // inner half of the ink line: a dark band along the silhouette so the outline grows inward too and hugs the face (owner 2026-11-10 "đường đó không dính sát vào mặt")
      vec3 sn = normalize(vSN); float frs = 1.0 - max(dot(sn, v), 0.0);   // smooth ellipsoid normal: the band follows the silhouette only, never the lumps
      float edge = 0.0 * smoothstep(0.76, 0.81, frs);   // replaced by the screen-space pixel outline   // thin even line like reference image 1   // the line is drawn ON the skin (inner band) so it never comes apart when zoomed/rotated; a thin hull only closes the silhouette
      cf = mix(cf, vec3(0.07, 0.035, 0.03), edge);   // dark brown
      c = mix(c, cf, flatK);
      gl_FragColor = vec4(c, 1.0); }` }); }

// ---------- face decals (canvas, 1024², the patch spans ±0.75 rad of the head front) ----------
function wobble(c) { const g = c.getContext('2d'), W = c.width, src = g.getImageData(0, 0, W, W), out = g.createImageData(W, W), d = src.data, o = out.data;
  const n = (x, y, a, b, p) => Math.sin(x * a + p) * Math.cos(y * b - p * 0.7);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const dx = 5.5 * n(x, y, 0.021, 0.017, 1.3) + 2.5 * n(y, x, 0.053, 0.047, 4.1), dy = 5.5 * n(y, x, 0.019, 0.023, 2.7) + 2.5 * n(x, y, 0.049, 0.057, 0.4);
    const sx = Math.min(W - 1, Math.max(0, Math.round(x + dx))), sy = Math.min(W - 1, Math.max(0, Math.round(y + dy))), i = (y * W + x) * 4, j = (sy * W + sx) * 4;
    o[i] = d[j]; o[i + 1] = d[j + 1]; o[i + 2] = d[j + 2]; o[i + 3] = d[j + 3]; }
  g.putImageData(out, 0, 0); }
function faceTex(draw, light = false, hand = false) { const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.clearRect(0, 0, 1024, 1024); g.save(); g.translate(512, 520); g.lineCap = 'round'; g.lineJoin = 'round'; draw(g); g.restore();
  if (light) { const im = g.getImageData(0, 0, 1024, 1024), d = im.data; for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { d[i] = 255 - d[i] + 6; d[i + 1] = 255 - d[i + 1] + 4; d[i + 2] = 255 - d[i + 2]; } g.putImageData(im, 0, 0); }
  if (hand) wobble(c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const WH = '#fbf7ef';
const eyes = (g, o = {}) => { const ex = o.ex || 130, rx = o.rx || 40, ry = o.ry || 52, col = o.col || WH;
  for (const sd of [-1, 1]) { const x = sd * ex; g.fillStyle = col; g.beginPath(); g.ellipse(x, 0, rx, ry, 0, 0, 7); g.fill();
    if (o.pupil !== false) { g.fillStyle = INK; g.beginPath(); g.arc(x + (o.px || 0) * 16, (o.py || 0) * 18, o.pr || 19, 0, 7); g.fill(); }
    if (o.lid) { g.fillStyle = INK; g.fillRect(x - rx - 4, -ry - 4, rx * 2 + 8, ry * o.lid + 4); g.strokeStyle = col; g.lineWidth = 16; g.beginPath(); g.moveTo(x - rx - 2, -ry + ry * o.lid); g.lineTo(x + rx + 2, -ry + ry * o.lid); g.stroke(); } } };
const smile = (g, w = 50, y = 190, col = WH, lw = 17) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y + w * 0.6, w, y); g.stroke(); };
const smirk = (g, y = 190, col = WH) => { g.strokeStyle = col; g.lineWidth = 17; g.beginPath(); g.moveTo(-55, y); g.quadraticCurveTo(10, y + 34, 70, y - 22); g.stroke(); };
function shapeHead(geo, r, shape) { if (!shape) return geo; const p = geo.attributes.position, v = new THREE.Vector3();
  const S = { wide: [1.05, 0.98, 1.0, 0, 0], egg: [0.98, 1.04, 0.99, 0, 0], squircle: [1.03, 1.0, 1.0, 0, 0], potato: [1.02, 1.02, 1.0, 0, 0], rick: [0.93, 1.08, 0.95, 0.3, 0], rround: [1.02, 0.98, 0.98, 0.08, 0], rickw: [0.98, 1.03, 0.96, 0.35, 0] }[shape]   // rick*: taller, softly squared head like the RicksClips reference (owner 2026-11-10) || [1, 1, 1, 0, 0];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const nx = v.x / r, ny = v.y / r, nz = v.z / r;
    const sq = 1 + S[3] * (Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(ny), 4)) * 0.6;   // squircle push toward the corners
    let x = v.x * S[0] * sq, y = v.y * S[1] * (1 + S[3] * 0.3 * Math.pow(Math.abs(nx), 4)), z = v.z * S[2];
    if (ny < -0.5) y = -0.5 * r * S[1] + (y + 0.5 * r * S[1]) * 0.9;   // a touch flatter bottom
    { const L = Math.hypot(x, y, z) || 1, ux = x / L, uy = y / L, uz = z / L;   // hand-drawn lumps + wider brow, slightly narrower jaw
      const k = 1 + 0.03 * Math.sin(ux * 2.3 + uy * 1.7 + 0.6) * Math.cos(uz * 1.9 - uy * 1.1) + 0.018 * Math.sin(ux * 4.1 - uz * 3.3 + uy * 2.2);
      const w = 1 + 0.06 * Math.max(0, uy) - 0.05 * Math.max(0, -uy - 0.3); x *= k * w; z *= k * w; y *= k; }
    p.setXYZ(i, x, y, z); }
  geo.computeVertexNormals(); return geo; }
function decal(r, tex, glow = 1, box = 0, shape) {
  const geo = box ? new THREE.PlaneGeometry(box, box) : shapeHead(new THREE.SphereGeometry(r * 1.004, 48, 48, Math.PI / 2 - (shape !== undefined ? 1.1 : 0.75), shape !== undefined ? 2.2 : 1.5, Math.PI / 2 - (shape !== undefined ? 1.1 : 0.75), shape !== undefined ? 2.2 : 1.5), r * 1.004, shape);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: new THREE.Color(glow, glow, glow) }));
  if (box) m.position.z = r + 0.002; return m; }

const camoTex = (base, cols, kind) => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  let sd = 7; const R = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 160; i++) { g.fillStyle = cols[i % cols.length]; const x = R() * 512, y = R() * 512;
    if (kind === 'lizard') { g.fillRect(x, y, 30 + R() * 60, 5 + R() * 5); } else { g.beginPath(); g.ellipse(x, y, 14 + R() * 30, 8 + R() * 18, R() * 3, 0, 7); g.fill(); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.colorSpace = THREE.SRGBColorSpace; return t; };
const ARMY = [
  { name: 'Bộ đội Việt Nam (mũ cối)', headCol: '#f6f2ea', short: 'Bộ đội VN', clip: 'idle', at: 1.2, head: 'ball', jacket: '#6f7c48', jacket2: '#59653a', style: 'tunic', hat: 'pith', hatCol: '#6f7c48', boot: 'sandal', shoe: '#1c1a17', sole: '#1c1a17', belt: '#3d3322', pack: '#6a7448', rifle: 'ak',
    face: g => { eyes(g, { px: 0.1, py: 0.1 }); smile(g, 40); } },
  { name: 'Giải phóng quân (mũ tai bèo)', headCol: '#f6f2ea', short: 'Giải phóng quân', clip: 'idle', at: 2.4, head: 'ball', jacket: '#4f5d3a', jacket2: '#3f4a2e', style: 'tunic', hat: 'boonie', hatCol: '#5b6a40', scarf: true, boot: 'sandal', shoe: '#1c1a17', sole: '#1c1a17', belt: '#2e2a20', rifle: 'ak',
    face: g => { eyes(g, { px: -0.2, py: 0 }); smirk(g, 195); } },
  { name: 'Lính Mỹ (Việt Nam 1965–73)', short: 'Lính Mỹ', clip: 'walk', at: 0.45, head: 'ball', jacket: '#56603a', jacket2: '#454d2e', style: 'tunic', hat: 'm1', hatCol: '#5d6a3e', vest: '#4a4d33', boot: 'boot', shoe: '#1b1a18', sole: '#111', belt: '#5b5a3c', rifle: 'm16',
    face: g => { eyes(g, { px: 0.3, py: 0 }); smile(g, 30, 195); } },
  { name: 'Lính Pháp (Điện Biên Phủ 1954)', short: 'Lính Pháp', clip: 'idle', at: 0.4, head: 'ball', jacket: '#ffffff', jacket2: '#6e6a44', camo: ['#b9b083', ['#6b6b3e', '#7c5a36', '#4f5a33'], 'lizard'], style: 'tunic', hat: 'beret', hatCol: '#8e1b22', boot: 'boot', shoe: '#2a221c', sole: '#111', belt: '#5a4a30', rifle: 'mas',
    face: g => { eyes(g, { px: 0, py: 0, lid: 0.35 }); smile(g, 30, 195); } },
  { name: 'Lính Trung Quốc (1979)', short: 'Lính TQ 1979', clip: 'sneak_pose', at: 0.3, head: 'ball', jacket: '#71774a', jacket2: '#5d623b', style: 'tunic', hat: 'cap79', hatCol: '#71774a', tabs: '#c3242b', boot: 'shoe', shoe: '#2e3524', sole: '#e8e2d2', belt: '#3d3a28', rifle: 'ak',
    face: g => { eyes(g, { px: 0.4, py: 0.1, rx: 34, ry: 48 }); g.strokeStyle = WH; g.lineWidth = 15; g.beginPath(); g.moveTo(-30, 200); g.lineTo(30, 200); g.stroke(); } },
  { name: 'Dân công (nón lá, đòn gánh)', headCol: '#f6f2ea', short: 'Dân công', clip: 'walk', at: 0.2, head: 'ball', jacket: '#6b4a32', jacket2: '#553a27', style: 'tunic', civil: true, hat: 'nonla', hatCol: '#e3cf98', boot: 'sandal', shoe: '#1c1a17', sole: '#1c1a17', belt: '#553a27', pole: true,
    face: g => { eyes(g, { px: 0, py: 0.1 }); smile(g, 36); } },
];
const gltf = await new GLTFLoader().loadAsync(url);
const CLIPS = Object.fromEntries(gltf.animations.map(a => [a.name, a]));
const bone = (root, n) => root.getObjectByName('mixamorig' + n) || root.getObjectByName('mixamorig:' + n);
const wp = (o) => o.getWorldPosition(new THREE.Vector3());
function seg(a, b, r, mat, segs = 8) { const d = b.clone().sub(a), L = d.length(); const g = new THREE.CylinderGeometry(r, r, L, segs); g.translate(0, L / 2, 0);
  const m = mesh(g, mat); m.position.copy(a); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m; }
function build(o, pos = new THREE.Vector3(), ry = 0) {
  const root = SkeletonUtils.clone(gltf.scene); root.position.copy(pos); root.rotation.y = ry; scene.add(root);
  root.traverse(c => { if (c.isMesh || c.isSkinnedMesh) c.visible = false; });
  root.updateMatrixWorld(true);
  const B = n => bone(root, n), P = n => wp(B(n));
  const RK = !!o.rick; const dyn = []; const BWK = RK ? (o.bodyW || 1) : 1, LK = RK ? (o.limbK || 1) : 1;   // limbK: thinner stick arms/legs like RicksClips (owner 2026-11-10)   // o.bodyW: slimmer bean body (owner 2026-11-10 "cho thân ôm lại")
  const black = RK ? toon('#111014', { rim: 0, kick: 0, flat2: true }) : toon('#0c0b0e', { rim: 0.8, kick: 0.45 }), jm = RK ? (o.flatCloth ? (o.pattern ? toon('#ffffff', { rim: 0.25, kick: 0, flat2: true, map: patTex(o.pattern[0], o.jacket, o.pattern[1]) }) : toon(o.jacket, { rim: 0.25, kick: 0, flat2: true })) : cloth(o.jacket, { map: o.knit ? ribTex : undefined })) : toon(o.jacket, { flat: true, rim: 0.5, map: o.camo ? camoTex(...o.camo) : null }), jd = RK ? (o.flatCloth ? toon(o.jacket2, { rim: 0.2, kick: 0, flat2: true }) : cloth(o.jacket2)) : toon(o.jacket2, { flat: true, rim: 0.4 });
  // limbs: sleeves (jacket colour) on the arms, thin black sticks for legs and neck; RK: o.armCol / o.legCol / o.shoeCol colour them (owner 2026-11-10, "Nghe tàu tới" look)
  const limbM = (c) => (RK && c ? toon(c, { rim: 0, kick: 0, flat2: true }) : black), armM = limbM(o.armCol), legM = limbM(o.legCol), shoeM = limbM(o.shoeCol);
  for (const sd of ['Left', 'Right']) {
    if (RK) { dyn.push({ side: sd, kind: 'arm', r: 0.026 * LK, to: B(sd + 'ForeArm') }); { const j = mesh(new THREE.SphereGeometry(0.026 * LK, 8, 6), armM); j.position.copy(P(sd + 'ForeArm')); B(sd + 'ForeArm').attach(j); } }
    else { B(sd + 'Arm').attach(seg(P(sd + 'Arm'), P(sd + 'ForeArm'), 0.019, jm, 7)); B(sd + 'ForeArm').attach(seg(P(sd + 'ForeArm'), P(sd + 'Hand'), 0.017, jm, 7));
    { const j = mesh(new THREE.SphereGeometry(0.019, 10, 8), jm); j.position.copy(P(sd + 'Arm')); B(sd + 'Arm').attach(j); }
    const cuff = seg(P(sd + 'Hand').lerp(P(sd + 'ForeArm'), 0.12), P(sd + 'Hand').lerp(P(sd + 'ForeArm'), 0.02), 0.021, jd, 7); B(sd + 'ForeArm').attach(cuff); }
    const hand = new THREE.Group(); const handM = RK && o.mitten ? toon(o.mitten === true ? '#fbfaf6' : o.mitten, { rim: 0, kick: 0, flat2: true }) : black;
    const palm = mesh(new THREE.SphereGeometry(RK ? 0.048 * (0.5 + 0.5 * LK) * (o.mitten ? 1.15 : 1) : 0.032, 16, 12), handM); palm.scale.set(1.1, 0.9, 0.85); hand.add(palm);
    const th = mesh(new THREE.SphereGeometry(o.mitten ? 0.017 : 0.013, 10, 8), handM); th.position.set(0, o.mitten ? 0.01 : 0.006, o.mitten ? 0.03 : 0.024); hand.add(th);
    if (RK && o.mitten && o.inkPx) for (const m of [palm, th]) m.add(new THREE.Mesh(m.geometry, inkPx(o.inkPx * 0.8)));   // white mitten + outline (RicksClips hands)
    hand.position.copy(P(sd + 'Hand').lerp(P(sd + 'HandMiddle1'), 0.6)); B(sd + 'Hand').attach(hand);
    if (RK) dyn.push({ side: sd, kind: 'fore', r: 0.025 * LK, from: B(sd + 'ForeArm'), to: hand });   // forearm drawn elbow → palm every frame, so the hand never floats off
    if (RK) dyn.push({ side: sd, kind: 'leg', r: 0.032 * LK, to: B(sd + 'Leg') }); else { B(sd + 'UpLeg').attach(seg(P(sd + 'UpLeg'), P(sd + 'Leg'), 0.014, black)); B(sd + 'Leg').attach(seg(P(sd + 'Leg'), P(sd + 'Foot'), 0.013, black)); } if (RK) { const kn = mesh(new THREE.SphereGeometry(0.031 * LK, 10, 8), legM); kn.position.copy(P(sd + 'Leg')); B(sd + 'Leg').attach(kn); }
    { const j = mesh(new THREE.SphereGeometry(0.014, 8, 6), black); j.position.copy(P(sd + 'Leg')); B(sd + 'Leg').attach(j); }
    // sneaker: coloured upper + contrasting sole, pointing from the ankle to the toe
    const f0 = P(sd + 'Foot'), f1 = P(sd + 'ToeBase'); const shoe = new THREE.Group(); const dir = f1.clone().sub(f0); dir.y = 0; const len = dir.length() + 0.09;
    if (RK) { const sh = mesh(new THREE.SphereGeometry(0.07, 14, 10), shoeM); if (o.shoeCol) ink(sh, 0.012); sh.scale.set(0.85, 0.6, len / 0.11); sh.position.set(0, 0.028, 0.02); shoe.add(sh); shoe.position.set(f0.x + dir.x * 0.35, 0, f0.z + dir.z * 0.35); shoe.rotation.y = Math.atan2(dir.x, dir.z); B(sd + 'Foot').attach(shoe); const ank = new THREE.Object3D(); ank.position.set(0, 0.05, -0.01); shoe.add(ank); dyn.push({ side: sd, kind: 'shin', r: 0.03 * LK, from: B(sd + 'Leg'), to: ank }); continue; }
    const up = mesh(new THREE.SphereGeometry(0.06, 16, 10), toon(o.shoe, { rim: 0.6 }), { ink: 0.004 }); up.scale.set(0.85, 0.75, len / 0.12); up.position.set(0, 0.035, 0);
    if (o.boot === 'sandal') { up.scale.set(0.8, 0.12, len / 0.12); up.position.y = 0.012; for (const zz of [0.03, -0.02]) { const st = mesh(new THREE.TorusGeometry(0.035, 0.006, 6, 12, Math.PI), toon('#2a2622', { rim: 0.4 })); st.position.set(0, 0.012, zz); shoe.add(st); } }
    if (o.boot === 'boot') { const sh = mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.13, 10), toon(o.shoe, { rim: 0.6 }), { ink: 0.004 }); sh.position.set(0, 0.09, -0.03); shoe.add(sh); }
    shoe.add(up);
    const so = mesh(new THREE.CylinderGeometry(0.052, 0.054, 0.024, 16), toon(o.sole, { rim: 0.3 })); so.scale.set(1, 1, len / 0.105); so.position.y = 0.012; shoe.add(so);
    shoe.position.set(f0.x + dir.x * 0.35, 0, f0.z + dir.z * 0.35); shoe.rotation.y = Math.atan2(dir.x, dir.z); B(sd + 'Foot').attach(shoe);
  }
  // torso: a jacket (faceted lathe) spanning hips → neck, attached to the spine; style details
  const hy = P('Hips').y, ny = P('Neck').y, hx = P('Hips').x, hz = P('Hips').z, h = ny - hy + 0.06;
  const prof = { bomber: [[0, -0.06], [0.135, -0.06], [0.15, -0.02], [0.155, 0.2], [0.15, 0.36], [0.115, 0.46], [0.06, 0.5], [0, 0.505]],
    hoodie: [[0, -0.07], [0.14, -0.07], [0.155, -0.02], [0.155, 0.2], [0.15, 0.36], [0.12, 0.46], [0.065, 0.5], [0, 0.505]],
    coat: [[0, -0.46], [0.2, -0.46], [0.175, -0.2], [0.15, 0.05], [0.15, 0.3], [0.125, 0.45], [0.065, 0.5], [0, 0.505]],
    trench: [[0, -0.42], [0.21, -0.42], [0.18, -0.18], [0.155, 0.04], [0.155, 0.3], [0.13, 0.45], [0.07, 0.5], [0, 0.505]],
    tunic: [[0, -0.1], [0.14, -0.1], [0.152, -0.04], [0.152, 0.2], [0.148, 0.36], [0.115, 0.46], [0.06, 0.5], [0, 0.505]],
    bean: (o.roundBottom ? [[0, -0.2], [0.12, -0.19], [0.22, -0.16], [0.29, -0.11], [0.33, -0.03], [0.335, 0.06], [0.32, 0.18], [0.285, 0.31], [0.23, 0.42], [0.14, 0.5], [0, 0.522]]   // pear: wider at the bottom (owner 2026-11-10)   // egg/pill bottom like the RicksClips cast (owner 2026-11-10)
      : [[0, -0.12], [0.19, -0.115], [0.28, -0.06], [0.31, 0.08], [0.31, 0.26], [0.29, 0.4], [0.22, 0.48], [0.09, 0.515], [0, 0.52]]).map(([r, y]) => [r * BWK, y]),
    puffer: [[0, -0.06], [0.16, -0.06], [0.185, 0.0], [0.19, 0.1], [0.185, 0.2], [0.19, 0.3], [0.17, 0.4], [0.12, 0.47], [0.07, 0.505], [0, 0.51]] }[RK ? 'bean' : o.style];
  const sc = h / 0.5, torso = new THREE.Group(); torso.position.set(hx, hy - 0.02, hz);
  const lg = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y * sc)), RK ? 32 : o.style === 'puffer' ? 14 : 10);
  const lgF = RK ? lg : lg.toNonIndexed(); if (!RK) lgF.computeVertexNormals(); const body = mesh(lgF, jm); if (RK && o.inkPx) body.add(new THREE.Mesh(body.geometry, inkPx(o.inkPx))); else ink(body, RK ? (o.bodyInk ?? 0.05) : 0.005); body.children[0].geometry = lg; body.scale.z = RK ? 0.75 : 0.8; torso.add(body);
  const FZ = 0.31 * BWK * 0.75;
  const nDet0 = torso.children.length;
  if (RK) { const det = o.details || [];
    for (const d of det) {
      if (d === 'buttons') for (let k = 0; k < 4; k++) { const bt = mesh(new THREE.SphereGeometry(0.014, 10, 8), cloth(o.btn || '#d9a83a', { rough: 0.3, metal: 0.6, map: null, ao: 0.9 }), { cast: false }); bt.position.set(0, (0.08 + k * 0.1) * sc, FZ * (k === 3 ? 0.94 : 1) + 0.004); torso.add(bt); }
      if (d === 'tie') { const tm = toon(o.tieCol || '#c8352f', { rim: 0, kick: 0, flat2: true }); const knot = mesh(new THREE.SphereGeometry(0.03, 10, 8), tm, { cast: false, ink: 0.004 }); knot.position.set(0, 0.45 * sc, FZ * 0.8 + 0.02); torso.add(knot);
        const sh = new THREE.Shape(); sh.moveTo(-0.022, 0); sh.lineTo(0.022, 0); sh.lineTo(0.04, -0.26); sh.lineTo(0, -0.31); sh.lineTo(-0.04, -0.26); sh.closePath(); const tg = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: false });
        const tie = mesh(tg, tm, { cast: false, ink: 0.003 }); tie.userData.span = 0.31; tie.position.set(0, 0.44 * sc, FZ * 0.86 + 0.012); tie.rotation.x = -0.12; torso.add(tie); }
      if (d === 'bow') { const tm = toon(o.tieCol || '#e8448a', { rim: 0, kick: 0, flat2: true }); for (const s2 of [-1, 1]) { const w = mesh(new THREE.ConeGeometry(0.045, 0.08, 10), tm, { cast: false, ink: 0.004 }); w.rotation.z = s2 * Math.PI / 2; w.position.set(s2 * 0.04, 0.45 * sc, FZ * 0.8 + 0.03); torso.add(w); }
        const k = mesh(new THREE.SphereGeometry(0.022, 8, 6), tm, { cast: false }); k.position.set(0, 0.45 * sc, FZ * 0.8 + 0.035); torso.add(k); }
      // outfits (owner 2026-11-10: "thử các bộ: hoodie, áo vest, áo polo")
      if (d === 'hoodie') { const hm3 = toon(o.jacket2 || o.jacket, { rim: 0.2, kick: 0, flat2: true });
        const ring = mesh(new THREE.TorusGeometry(0.15 * BWK + 0.05, 0.055, 10, 28), hm3, { cast: false, ink: 0.006 }); ring.rotation.x = Math.PI / 2 + 0.25; ring.scale.set(1, 0.85, 1); ring.position.set(0, 0.5 * sc, -0.02); torso.add(ring);
        const hood = mesh(new THREE.SphereGeometry(0.17, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), hm3, { cast: false, ink: 0.006 }); hood.scale.set(1.1, 0.7, 0.75); hood.rotation.x = -1.9; hood.position.set(0, 0.47 * sc, -0.16); torso.add(hood);
        { const yP = 0.06 * sc, rP = (prof.find(([, y]) => y * sc >= yP) || prof[prof.length - 1])[0] + 0.012; const pk = mesh(new THREE.CylinderGeometry(rP, rP, 0.12, 24, 1, true, -0.55, 1.1), hm3, { cast: false, ink: 0.004 }); pk.material.side = THREE.DoubleSide; pk.scale.z = 0.75; pk.position.set(0, yP, 0); pk.userData.wrap = true; torso.add(pk); }   // kangaroo pocket wraps the belly
        for (const s2 of [-1, 1]) { const st = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), toon('#f4f1ea', { rim: 0, flat2: true }), { cast: false }); st.position.set(s2 * 0.04, 0.4 * sc, FZ * 0.92 + 0.02); torso.add(st);
          const tip = mesh(new THREE.SphereGeometry(0.014, 8, 6), toon('#f4f1ea', { rim: 0, flat2: true }), { cast: false }); tip.position.set(s2 * 0.04, 0.4 * sc - 0.075, FZ * 0.92 + 0.02); torso.add(tip); } }
      if (d === 'vestBtn') for (let k = 0; k < 2; k++) { const bt = mesh(new THREE.SphereGeometry(0.016, 10, 8), toon('#1e1a1c', { rim: 0, flat2: true }), { cast: false }); bt.position.set(0, (0.12 + k * 0.1) * sc, FZ * 1.07); torso.add(bt); }
      if (d === 'hanky') { const hk = mesh(new THREE.ConeGeometry(0.028, 0.05, 3), toon(o.hankyCol || '#f2f0ea', { rim: 0, flat2: true }), { cast: false }); hk.position.set(0.1, 0.36 * sc, FZ * 0.96 + 0.015); hk.rotation.z = Math.PI; torso.add(hk); }
      if (d === 'polo') { const cm = toon(o.collarCol || '#ffffff', { rim: 0.1, kick: 0, flat2: true });
        for (const s2 of [-1, 1]) { const fl = mesh(new THREE.BoxGeometry(0.11, 0.012, 0.075), cm, { cast: false, ink: 0.004 }); fl.position.set(s2 * 0.055, 0.49 * sc, FZ * 0.62); fl.rotation.set(0.6, s2 * -0.5, s2 * 0.35); torso.add(fl); }
        const pl = mesh(new THREE.BoxGeometry(0.04, 0.13, 0.008), toon(o.jacket2, { rim: 0, flat2: true }), { cast: false }); pl.position.set(0, 0.4 * sc, FZ * 0.9 + 0.012); pl.rotation.x = -0.35; torso.add(pl);
        for (let k = 0; k < 2; k++) { const bt = mesh(new THREE.SphereGeometry(0.009, 8, 6), toon('#f4f1ea', { rim: 0, flat2: true }), { cast: false }); bt.position.set(0, (0.43 - k * 0.05) * sc, FZ * 0.9 + 0.022 + k * 0.012); torso.add(bt); }
        const logo = mesh(new THREE.CircleGeometry(0.018, 12), toon(o.logoCol || '#e8442a', { rim: 0, flat2: true }), { cast: false }); logo.position.set(-0.085, 0.33 * sc, FZ * 0.98 + 0.012); torso.add(logo);
        for (const s2 of [-1, 1]) { const sl = mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.13, 12), jm, { cast: false, ink: 0.005 }); sl.position.set(s2 * (0.255 * BWK + 0.02), 0.34 * sc, -0.01); sl.rotation.z = s2 * 0.5; torso.add(sl); } }
      if (d === 'pocket') { const pk = mesh(new THREE.BoxGeometry(0.2, 0.09, 0.012), jd, { cast: false, ink: 0.004 }); pk.position.set(0, 0.07 * sc, FZ - 0.002); torso.add(pk); }
      if (d === 'strings') for (const s2 of [-1, 1]) { const st = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.13, 6), toon('#f2efe8', { rim: 0, flat2: true }), { cast: false }); st.position.set(s2 * 0.035, 0.38 * sc, FZ * 0.86 + 0.01); torso.add(st); }
      if (d === 'zip') { const zp = mesh(new THREE.BoxGeometry(0.01, 0.46 * sc, 0.008), toon('#f1d36a', { rim: 0, flat2: true }), { cast: false }); zp.position.set(0, 0.22 * sc, FZ + 0.002); torso.add(zp); }
      if (d === 'belt') { const bl = mesh(new THREE.CylinderGeometry(0.313 * BWK, 0.313 * BWK, 0.04, 32, 1, true), cloth(o.beltCol || '#3b2a1c', { side: THREE.DoubleSide, rough: 0.6 })); bl.scale.z = 0.75; bl.position.y = 0.02 * sc; torso.add(bl); }
      if (d === 'sash') { const sa = mesh(new THREE.BoxGeometry(0.05, 0.62 * sc, 0.012), toon(o.sashCol || '#c8352f', { rim: 0, flat2: true }), { cast: false }); sa.position.set(0, 0.24 * sc, FZ + 0.005); sa.rotation.z = 0.6; torso.add(sa); }
      if (d === 'collar') for (const s2 of [-1, 1]) { const cl = mesh(new THREE.BoxGeometry(0.07, 0.05, 0.01), toon(o.collarCol || '#f4f0e6', { rim: 0, flat2: true }), { cast: false }); cl.position.set(s2 * 0.045, 0.47 * sc, FZ * 0.75); cl.rotation.set(-0.5, s2 * 0.5, s2 * 0.5); torso.add(cl); } } }
  if (!RK && o.style === 'puffer') for (const y of [0.05, 0.15, 0.25, 0.35]) { const rr = mesh(new THREE.TorusGeometry(0.188, 0.012, 6, 20), jd, { cast: false }); rr.rotation.x = Math.PI / 2; rr.scale.y = 0.8; rr.position.y = y * sc; torso.add(rr); }
  if (!RK && o.style === 'bomber') { const hem = mesh(new THREE.CylinderGeometry(0.137, 0.137, 0.05, 10, 1, true), jd); hem.material = jd; hem.scale.z = 0.8; hem.position.y = -0.04 * sc; torso.add(hem);
    const zp = mesh(new THREE.BoxGeometry(0.008, 0.48 * sc, 0.006), toon('#e8c86a', { rim: 0 }), { cast: false }); zp.position.set(0, 0.2 * sc, 0.123); torso.add(zp);
    const patch = mesh(new THREE.CircleGeometry(0.03, 16), toon('#f2e3b0', { rim: 0 }), { cast: false }); patch.position.set(0.075, 0.33 * sc, 0.118); patch.rotation.y = 0.45; torso.add(patch); }
  if (!RK && o.style === 'hoodie') { const pk = mesh(new THREE.BoxGeometry(0.17, 0.08, 0.01), jd, { cast: false }); pk.position.set(0, 0.06 * sc, 0.122); torso.add(pk);
    for (const sd of [-1, 1]) { const st = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), toon('#d9d4cc', { rim: 0 }), { cast: false }); st.position.set(sd * 0.03, 0.4 * sc, 0.105); torso.add(st); } }
  if (!RK && o.style === 'coat' || o.style === 'trench') { for (const sd of [-1, 1]) { const lp = mesh(new THREE.BoxGeometry(0.05, 0.2 * sc, 0.012), jd, { cast: false }); lp.position.set(sd * 0.05, 0.36 * sc, 0.12); lp.rotation.set(-0.12, 0, sd * 0.32); torso.add(lp); }
    if (o.style === 'trench') { const belt = mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.035, 10, 1, true), jd); belt.scale.z = 0.8; belt.position.y = 0.06 * sc; torso.add(belt); }
    if (o.style === 'coat') { const st = mesh(new THREE.BoxGeometry(0.006, 0.9 * sc, 0.006), new THREE.MeshBasicMaterial({ color: new THREE.Color(o.visor).multiplyScalar(2) }), { cast: false }); st.position.set(0.02, -0.0 * sc, 0.13); torso.add(st); } }
  if (!RK) { const collar = mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.06, 10, 1, true), jd, { ink: 0.004 }); collar.material = toon(o.jacket2, { flat: true, side: THREE.DoubleSide }); collar.scale.z = 0.85; collar.position.y = 0.5 * sc; torso.add(collar); }
  if (o.pole) { const pm = toon('#9a7a48', { rim: 0.5 }), bm = toon('#b08a52', { rim: 0.4 }), rope = toon('#5a4a30', { rim: 0 });
    const pole = mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.5, 8), pm, { ink: 0.003 }); pole.rotation.x = Math.PI / 2; pole.position.set(0.1, 0.5 * sc, 0.0); torso.add(pole);
    for (const zz of [-0.7, 0.7]) { const bk = mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.2, 14), bm, { ink: 0.004 }); bk.position.set(0.1, 0.02 * sc - 0.1, zz); torso.add(bk);
      for (const a of [0, 2.1, 4.2]) { const r2 = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.5 * sc, 4), rope, { cast: false }); r2.position.set(0.1 + Math.cos(a) * 0.07, 0.27 * sc - 0.05, zz + Math.sin(a) * 0.07); torso.add(r2); } } }
  if (!RK && o.style === 'tunic' && !o.civil) { // four pockets, buttons, belt + pouches, collar tabs, vest, pack, scarf, rifle on the back
    for (const [px, py] of [[-0.07, 0.34], [0.07, 0.34], [-0.075, 0.1], [0.075, 0.1]]) { const pk = mesh(new THREE.BoxGeometry(0.062, py > 0.2 ? 0.05 : 0.07, 0.01), jd, { cast: false }); pk.position.set(px, py * sc, 0.118); pk.rotation.y = px * 2.2; torso.add(pk);
      const fl = mesh(new THREE.BoxGeometry(0.066, 0.014, 0.014), jd, { cast: false }); fl.position.set(px, (py + (py > 0.2 ? 0.028 : 0.038)) * sc, 0.121); fl.rotation.y = px * 2.2; torso.add(fl); }
    for (let k = 0; k < 4; k++) { const bt = mesh(new THREE.SphereGeometry(0.007, 6, 4), toon('#3a3424', { rim: 0 }), { cast: false }); bt.position.set(0, (0.42 - k * 0.11) * sc, 0.124); torso.add(bt); }
    const belt = mesh(new THREE.CylinderGeometry(0.156, 0.156, 0.04, 12, 1, true), toon(o.belt, { rim: 0.4, side: THREE.DoubleSide })); belt.scale.z = 0.8; belt.position.y = 0.0; torso.add(belt);
    const buckle = mesh(new THREE.BoxGeometry(0.04, 0.032, 0.01), toon('#c9b26a', { rim: 0.5 }), { cast: false }); buckle.position.set(0, 0.0, 0.128); torso.add(buckle);
    for (const sd of [-1, 1]) { const pu = mesh(new THREE.BoxGeometry(0.05, 0.055, 0.035), toon(o.belt, { rim: 0.4 }), { ink: 0.003 }); pu.position.set(sd * 0.1, -0.01, 0.105); pu.rotation.y = sd * 0.5; torso.add(pu); }
    if (o.tabs) for (const sd of [-1, 1]) { const tb = mesh(new THREE.BoxGeometry(0.03, 0.02, 0.008), toon(o.tabs, { rim: 0.3 }), { cast: false }); tb.position.set(sd * 0.045, 0.485 * sc, 0.075); tb.rotation.set(-0.5, sd * 0.6, 0); torso.add(tb); }
    if (o.vest) { const vg = new THREE.LatheGeometry([[0, 0.04], [0.163, 0.04], [0.166, 0.2], [0.16, 0.36], [0.125, 0.45], [0.0, 0.452]].map(([r2, y]) => new THREE.Vector2(r2, y * sc)), 12); const vf = vg.toNonIndexed(); vf.computeVertexNormals();
      const vest = mesh(vf, toon(o.vest, { rim: 0.5 })); vest.scale.z = 0.82; torso.add(vest); for (let k = 0; k < 4; k++) { const rb = mesh(new THREE.TorusGeometry(0.166, 0.005, 4, 16), toon('#3b3d28', { rim: 0 }), { cast: false }); rb.rotation.x = Math.PI / 2; rb.scale.y = 0.82; rb.position.y = (0.1 + k * 0.08) * sc; torso.add(rb); } }
    if (o.pack) { const pk = mesh(new RoundedBoxGeometry(0.24, 0.26 * sc, 0.12, 3, 0.03), toon(o.pack, { rim: 0.5 }), { ink: 0.004 }); pk.position.set(0, 0.27 * sc, -0.17); torso.add(pk);
      const roll = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 10), toon('#4b5634', { rim: 0.4 }), { ink: 0.003 }); roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.43 * sc, -0.17); torso.add(roll); }
    if (o.scarf) { const ct = document.createElement('canvas'); ct.width = ct.height = 64; const cg = ct.getContext('2d'); cg.fillStyle = '#f2efe6'; cg.fillRect(0, 0, 64, 64); cg.fillStyle = '#1a1a1a'; for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) if ((a + b) % 2) cg.fillRect(a * 8, b * 8, 8, 8);
      const tt = new THREE.CanvasTexture(ct); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(6, 1); tt.colorSpace = THREE.SRGBColorSpace; const sf = mesh(new THREE.TorusGeometry(0.08, 0.028, 8, 20), toon('#ffffff', { rim: 0.3, map: tt }));
      sf.rotation.x = Math.PI / 2 - 0.25; sf.position.set(0, 0.49 * sc, 0.01); torso.add(sf); const tail = mesh(new THREE.BoxGeometry(0.05, 0.13, 0.015), toon('#ffffff', { rim: 0.3, map: tt })); tail.position.set(0.04, 0.42 * sc, 0.11); tail.rotation.z = 0.25; torso.add(tail); }
    if (o.rifle) { const rg = new THREE.Group(), wood = toon(o.rifle === 'm16' ? '#1d1d1f' : '#6b4a2b', { rim: 0.5 }), metal = toon('#2a2a2c', { rim: 0.6 });
      const body2 = mesh(new THREE.BoxGeometry(0.035, 0.42, 0.05), wood, { ink: 0.003 }); rg.add(body2); const brl = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), metal); brl.position.y = 0.36; rg.add(brl);
      const stock = mesh(new THREE.BoxGeometry(0.033, 0.2, 0.07), wood, { ink: 0.003 }); stock.position.set(0, -0.3, 0.008); rg.add(stock);
      if (o.rifle === 'ak') { const mag = mesh(new THREE.BoxGeometry(0.03, 0.12, 0.04), metal); mag.position.set(0, 0.06, 0.06); mag.rotation.x = 0.35; rg.add(mag); }
      if (o.rifle === 'm16') { const hd = mesh(new THREE.BoxGeometry(0.02, 0.05, 0.03), metal); hd.position.set(0, 0.12, -0.04); rg.add(hd); }
      rg.position.set(0.02, 0.25 * sc, -0.17 - (o.pack ? 0.08 : 0)); rg.rotation.set(0, 0, 0.72); torso.add(rg);
      const strap = mesh(new THREE.BoxGeometry(0.02, 0.62 * sc, 0.01), toon(o.belt, { rim: 0.3 }), { cast: false }); strap.position.set(0.0, 0.26 * sc, 0.122); strap.rotation.z = -0.72; torso.add(strap); }
  }
  // snap the front details onto the pear-shaped shirt at their own height, so they never float off it seen from the side (owner 2026-11-10)
  if (RK) { const P2 = prof.map(([r, y]) => [r, y * sc]), rAt = (y) => { for (let i = 1; i < P2.length; i++) if (y <= P2[i][1]) { const [r0, y0] = P2[i - 1], [r1, y1] = P2[i], k = (y - y0) / Math.max(1e-6, y1 - y0); return r0 + (r1 - r0) * Math.min(1, Math.max(0, k)); } return P2[P2.length - 1][0]; };
    const zs = body.scale.z; for (let i = nDet0; i < torso.children.length; i++) { const ch = torso.children[i]; if (ch === body || ch.userData.wrap || ch.position.z < 0.04 || Math.abs(ch.position.x) > 0.2) continue;
      const front = rAt(ch.position.y) * zs, side = Math.abs(ch.position.x), zf = Math.sqrt(Math.max(0, front * front - (side * zs) * (side * zs) * 0.0)) - side * side * 0.9;
      const g = ch.geometry; if (g && !g.boundingBox) g.computeBoundingBox(); const half = g?.boundingBox ? Math.min(0.03, (g.boundingBox.max.z - g.boundingBox.min.z) * 0.5 * ch.scale.z) : 0.01;
      ch.position.z = zf + half * 0.6 + 0.003;
      if (ch.userData.span) { const yb = ch.position.y - ch.userData.span, zb = rAt(yb) * zs + 0.006; ch.position.z = Math.max(ch.position.z, rAt(ch.position.y - ch.userData.span * 0.5) * zs + 0.006 - (zb - ch.position.z) * 0.5); ch.rotation.x = -Math.atan2(zb - ch.position.z, ch.userData.span); } } }   // long pieces (tie) lean with the belly
  B('Spine1').attach(torso);
  if (RK) { const limbG = new THREE.Group(); scene.add(limbG);
    for (const d of dyn) { const s2 = d.side === 'Left' ? 1 : -1, a = new THREE.Object3D();
      if (d.from) {} else if (d.kind === 'arm') a.position.set(s2 * 0.255 * BWK, 0.37 * sc, -0.01); else a.position.set(s2 * 0.1, -0.06 * sc, 0.0);   // inside the outline: upper third of the side / under the bottom
      if (!d.from) { torso.add(a); d.from = a; } const g = new THREE.CylinderGeometry(d.r, d.r, 1, 7); g.translate(0, 0.5, 0); const lm = d.kind === 'leg' || d.kind === 'shin' ? legM : armM; d.mesh = mesh(g, lm); limbG.add(d.mesh);
      const j = mesh(new THREE.SphereGeometry(d.r, 10, 8), lm); d.mesh.add(j); d.cap = j; } }
  // neck + head
  const neckTop = P('Head'); if (!RK) { const nk = seg(P('Neck'), neckTop.clone().add(V(0, 0.04, 0)), 0.017, black); B('Neck').attach(nk); }
  const r = RK ? (o.headR || 0.48) : 0.2, head = new THREE.Group(); head.position.copy(neckTop).add(V(0, RK ? r * (o.headLift ?? 0.5) : r * 0.95, RK ? r * (o.headFwd ?? 0) : 0.0));   // headLift/headFwd: chin outline stays in front of the body (owner 2026-11-10)
  let hm;
  if (o.head === 'box') { hm = mesh(new RoundedBoxGeometry(r * 1.9, r * 1.75, r * 1.7, 4, 0.07), headMat()); head.add(hm); head.add(decal(r * 0.85, faceTex(o.face), 1, r * 1.6)); }
  else { const light = !!o.headCol; hm = mesh(shapeHead(new THREE.SphereGeometry(r, 56, 40), r, RK ? o.headShape : null), headMat({ gloss: o.flatHead ? 0 : o.gloss, base: o.headCol, shade: light ? 1 : 0, flat: o.flatHead, gain: o.headGain, ell: ({ rround: [1.02, 0.98, 0.98], rick: [0.93, 1.08, 0.95], rickw: [0.98, 1.03, 0.96], egg: [0.98, 1.04, 0.99], wide: [1.05, 0.98, 1.0], potato: [1.02, 1.02, 1.0] })[o.headShape] })); if (light) { if (RK && o.inkPx) hm.add(new THREE.Mesh(hm.geometry, inkPx(o.inkPx))); else if (RK && o.headInkClean) hm.add(new THREE.Mesh(hm.geometry, inkClean(o.headInk))); else ink(hm, RK ? (o.headInk ?? 0.075) : 0.006); } if (RK && o.headTall) hm.scale.y = o.headTall; head.add(hm); var faceMesh = decal(r, faceTex(o.face, light), o.glow || 1, 0, RK ? (o.headShape || null) : undefined); head.add(faceMesh); if (o.head === 'egg') head.scale.set(0.9, 1.16, 0.94); }
  if (o.beard) { const bm = RK ? cloth(o.beard, { map: ribTex, ao: 0.75 }) : toon(o.beard, { rim: 0.5 }); const bd = mesh(new THREE.SphereGeometry(r * 0.62, 24, 16, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), bm, { ink: RK ? 0.012 : 0.004 }); bd.scale.set(RK ? 0.42 : 1.0, RK ? 0.6 : 1.25, 0.6); bd.position.set(0, -r * (RK ? 0.72 : 0.42), r * (RK ? 0.62 : 0.62)); head.add(bd);
    const ms = mesh(new THREE.TorusGeometry(r * 0.28, 0.022, 6, 16, Math.PI), bm); ms.position.set(0, -r * 0.22, r * 0.93); ms.rotation.z = Math.PI; if (!RK) head.add(ms); }
  if (o.glasses) { const gm = toon('#141216', { rim: 0.6 }); for (const sd of [-1, 1]) { const ring = mesh(new THREE.TorusGeometry(r * (RK ? 0.3 : 0.2), RK ? 0.022 : 0.008, 8, 32), gm, { cast: false }); const a = sd * (RK ? 0.46 : 0.25); ring.position.set(Math.sin(a) * r * 1.03, RK ? -r * 0.02 : 0.0, Math.cos(a) * r * 1.03); ring.rotation.y = a; head.add(ring); }
    const br = mesh(new THREE.CylinderGeometry(RK ? 0.016 : 0.008, RK ? 0.016 : 0.008, r * 0.18, 6), gm, { cast: false }); br.rotation.z = Math.PI / 2; br.position.set(0, RK ? r * 0.02 : 0.01, r * 1.04); head.add(br); }
  if (o.hood) { const hood = mesh(new THREE.SphereGeometry(r * 1.1, 30, 20, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI * 0.8), toon(o.jacket, { flat: true, side: THREE.DoubleSide, rim: 0.6 }), { ink: 0.005 }); hood.position.set(0, -0.005, -0.01); head.add(hood);
    const brim = mesh(new THREE.TorusGeometry(r * 1.0, 0.022, 8, 24, Math.PI * 1.25), jd); brim.rotation.set(0, 0, -Math.PI * 0.125 + Math.PI * 1.5 - Math.PI * 0.5); brim.position.set(0, 0.0, r * 0.62); brim.scale.set(0.75, 1.05, 1); head.add(brim); }
  if (o.visor) { const band = mesh(new THREE.SphereGeometry(r * 1.035, 40, 6, Math.PI / 2 - 1.15, 2.3, Math.PI / 2 - 0.2, 0.3), toon('#1b1a20', { rim: 0.8, side: THREE.DoubleSide })); head.add(band);
    const neon = new THREE.Mesh(new THREE.SphereGeometry(r * 1.045, 40, 4, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.09, 0.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(o.visor).multiplyScalar(3.5), side: THREE.DoubleSide })); head.add(neon); }
  if (o.phones) { const band = mesh(new THREE.TorusGeometry(r * 1.02, 0.016, 8, 28, Math.PI), toon('#f2efe8', { rim: 0.6 }), { ink: 0.004 }); band.position.y = 0.02; head.add(band);
    for (const sd of [-1, 1]) { const cup = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20), toon('#e8542c', { rim: 0.6 }), { ink: 0.004 }); cup.rotation.z = Math.PI / 2; cup.position.set(sd * r * 0.98, 0.0, 0); head.add(cup); } }
  if (o.hat) { const hm2 = RK ? cloth(o.hatCol || '#222', { ao: 0.7 }) : toon(o.hatCol, { rim: 0.7 });
    if (o.hat === 'cap') { const dome = RK ? mesh(shapeHead(new THREE.SphereGeometry(r * 1.05, 40, 20, 0, Math.PI * 2, 0, o.capBack ? 1.22 : 1.12), r * 1.05, o.headShape || 'potato'), hm2, { ink: o.headInk != null ? o.headInk * 0.6 : 0.03 }) : mesh(new THREE.SphereGeometry(r * 1.04, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), hm2, { ink: 0.005 }); if (RK) dome.rotation.x = -0.1; else { dome.position.y = r * 0.12; dome.rotation.x = -0.12; } head.add(dome);   // RK: a shell hugging the skull (no gap)
      const vis = mesh(new THREE.CylinderGeometry(r * 0.8, r * 0.8, 0.014, 24, 1, false, -Math.PI / 2, Math.PI), hm2, { ink: 0.004 }); vis.scale.z = 0.95; vis.position.set(0, r * (RK ? 0.43 : 0.2), r * (RK ? 0.5 : 0.62)); vis.rotation.x = 0.1; if (RK && o.capBack) { vis.position.set(0, r * 0.38, -r * 0.55); vis.rotation.set(-0.1, Math.PI, 0); dome.rotation.set(-0.18, 0, 0.16); } head.add(vis);   // capBack: brim to the back like reference image 1
      const bt = mesh(new THREE.SphereGeometry(0.018, 8, 6), hm2); bt.position.y = r * 1.12; if (!(RK && o.capBack)) head.add(bt); }
    if (o.hat === 'nonla') { const straw = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#f0dda6'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 16) { g.fillStyle = 'rgba(150,110,50,0.35)'; g.fillRect(0, y, 256, 2); } for (let x = 0; x < 256; x += 6) { g.fillStyle = 'rgba(120,90,40,0.08)'; g.fillRect(x, 0, 1, 256); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
      const cone = mesh(new THREE.ConeGeometry(r * (RK ? 1.4 : 1.75), r * (RK ? 0.6 : 0.8), 40, 1, true), RK ? cloth('#ffffff', { map: straw, side: THREE.DoubleSide, ao: 0.8 }) : toon('#e3cf98', { rim: 0.6, side: THREE.DoubleSide }), { ink: RK ? 0.02 : 0.004 }); cone.position.y = r * (RK ? 1.0 : 0.78); if (RK) cone.scale.y = 1.15; head.add(cone); }   // RK: sits higher so the head never pokes through the straw (owner 2026-11-10)
    if (o.hat === 'pith') { const dome = mesh(new THREE.SphereGeometry(r * 1.1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), hm2, { ink: 0.005 }); dome.scale.y = 0.9; dome.position.y = r * 0.2; head.add(dome);
      const brim = mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.56, 0.014, 32), hm2, { ink: 0.004 }); brim.scale.z = 1.12; brim.position.set(0, r * 0.2, 0.01); brim.rotation.x = 0.06; head.add(brim);
      const bd = mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.006, 20), toon('#c8242b', { rim: 0 }), { cast: false }); bd.rotation.x = Math.PI / 2 - 0.45; bd.position.set(0, r * 0.62, r * 0.98); head.add(bd);
      const st = mesh(new THREE.CylinderGeometry(r * 0.09, r * 0.09, 0.008, 5), toon('#f2c53a', { rim: 0 }), { cast: false }); st.rotation.x = Math.PI / 2 - 0.45; st.position.set(0, r * 0.625, r * 1.0); head.add(st); }
    if (o.hat === 'boonie') { const crown = mesh(new THREE.CylinderGeometry(r * 0.92, r * 1.06, r * 0.6, 20), hm2, { ink: 0.005 }); crown.position.y = r * 0.6; head.add(crown);
      const brim = mesh(new THREE.LatheGeometry([[r * 1.0, 0], [r * 1.3, -0.012], [r * 1.62, -0.05]].map(([a, b]) => new THREE.Vector2(a, b)), 28), toon(o.hatCol, { rim: 0.6, side: THREE.DoubleSide }), { ink: 0.004 }); brim.position.y = r * 0.34; brim.rotation.z = 0.05; head.add(brim);
      const band = mesh(new THREE.CylinderGeometry(r * 1.065, r * 1.065, r * 0.12, 20, 1, true), toon('#3f4a2c', { rim: 0.3, side: THREE.DoubleSide })); band.position.y = r * 0.38; head.add(band); }
    if (o.hat === 'm1') { const net = camoTex('#5d6a3e', ['#46512d', '#7a6d44', '#3a4127'], 'blob'); const hel = mesh(new THREE.SphereGeometry(r * 1.16, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), toon('#ffffff', { rim: 0.7, map: net }), { ink: 0.005 }); hel.position.y = r * 0.08; hel.rotation.x = -0.08; head.add(hel);
      const rimH = mesh(new THREE.TorusGeometry(r * 1.13, 0.012, 6, 32), toon('#47522f', { rim: 0.5 })); rimH.rotation.x = Math.PI / 2 - 0.08; rimH.position.y = r * 0.0; head.add(rimH);
      const band = mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.14, r * 0.12, 24, 1, true), toon('#2b2b22', { rim: 0.3, side: THREE.DoubleSide })); band.position.y = r * 0.3; head.add(band); }
    if (o.hat === 'beret') { const bt = mesh(new THREE.SphereGeometry(r * 1.0, 24, 14), hm2, { ink: 0.005 }); bt.scale.set(1.08, 0.34, 1.06); bt.position.set(-r * 0.12, r * 0.8, -r * 0.02); bt.rotation.z = 0.28; head.add(bt);
      const bge = mesh(new THREE.CylinderGeometry(r * 0.1, r * 0.1, 0.008, 12), toon('#d8b84a', { rim: 0.5 }), { cast: false }); bge.rotation.set(Math.PI / 2 - 0.3, 0, 0.3); bge.position.set(r * 0.42, r * 0.74, r * 0.8); head.add(bge); }
    if (o.hat === 'cap79') { const crown = mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.04, r * 0.5, 24), hm2, { ink: 0.005 }); crown.position.y = r * 0.62; head.add(crown);
      const top = mesh(new THREE.SphereGeometry(r * 1.02, 24, 8, 0, Math.PI * 2, 0, Math.PI * 0.18), hm2); top.position.y = r * 0.82 - r * 1.02 * Math.cos(Math.PI * 0.18) + r * 0.05; head.add(top);
      const vis = mesh(new THREE.CylinderGeometry(r * 0.75, r * 0.75, 0.012, 20, 1, false, -Math.PI / 2, Math.PI), hm2, { ink: 0.003 }); vis.position.set(0, r * 0.4, r * 0.62); vis.rotation.x = 0.12; head.add(vis);
      const star = mesh(new THREE.CylinderGeometry(r * 0.11, r * 0.11, 0.008, 5), toon('#d3262c', { rim: 0 }), { cast: false }); star.rotation.x = Math.PI / 2; star.position.set(0, r * 0.66, r * 1.04); head.add(star); } }
  B('Head').attach(head);
  const mixer = new THREE.AnimationMixer(root); const actions = Object.fromEntries(Object.keys(CLIPS).map(k => [k, mixer.clipAction(CLIPS[k])]));
  if (o.clip) { actions[o.clip].play(); mixer.setTime(o.at || 0); }
  return { dyn, root, head, hm, faceMesh, mixer, actions, bone: n => bone(root, n), opts: o };
}

// ---------- procedural work poses on top of the clips (for scenes Xbot has no clip for) ----------
// SR.pose(c, 'rope_pull', t, { rope: [A, B], period: 1.25, phase: 0, lean: 35 })  — lean back ~30–40°, both hands on the rope (world
//   line A→B; hands slide to the nearest point), pull cycle in sync for everyone with the same period/phase, feet dig in.
// SR.pose(c, 'shoulder_push', t, { target: P, period: 1.1, slope: 0.15 }) — low forward lean, shoulder on P (gun wheel / trail),
//   hands on P, legs stepping uphill. Call INSTEAD of c.mixer.setTime(t), after moving c.root for this frame.
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
function setWorldQ(b, wq) { b.parent.getWorldQuaternion(_q2); b.quaternion.copy(_q2.invert().multiply(wq)); b.updateMatrixWorld(true); }
function rotWorld(b, axis, ang) { b.getWorldQuaternion(_q); setWorldQ(b, new THREE.Quaternion().setFromAxisAngle(axis, ang).multiply(_q)); }
function aim(b, child, target) { b.updateMatrixWorld(true); const bp = wp(b), cp = wp(child); const d0 = cp.sub(bp).normalize(), d1 = target.clone().sub(bp).normalize();
  b.getWorldQuaternion(_q); setWorldQ(b, new THREE.Quaternion().setFromUnitVectors(d0, d1).multiply(_q)); }
function ik2(a, c2, l1, l2, hint) { const d = c2.clone().sub(a), L = Math.min(Math.max(d.length(), 0.01), l1 + l2 - 0.002), dn = d.clone().normalize();
  const x = (l1 * l1 - l2 * l2 + L * L) / (2 * L), y = Math.sqrt(Math.max(0, l1 * l1 - x * x)); const side = hint.clone().sub(dn.clone().multiplyScalar(hint.dot(dn))).normalize();
  return a.clone().add(dn.clone().multiplyScalar(x)).add(side.multiplyScalar(y)); }
function limb(c, up, mid, end, target, hint) { const B = n => bone(c.root, n); const u = B(up), m = B(mid), e = B(end); c.root.updateMatrixWorld(true);
  const a = wp(u), l1 = a.distanceTo(wp(m)), l2 = wp(m).distanceTo(wp(e)); const el = ik2(a, target, l1, l2, hint); aim(u, m, el); aim(m, e, target); }
function pose(c, name, t, o = {}) {
  // three.js PropertyMixer skips writing a bone when the clip value is unchanged, so setTime(0.4) every frame would NOT undo last
  // frame's IK/lean (rotations pile up → heads spin). Snapshot the idle pose once and restore it from the snapshot each frame.
  reset(c);
  const per = o.period || (name === 'rope_pull' ? 1.25 : 1.1), ph = ((t / per + (o.phase || 0)) % 1 + 1) % 1, S = Math.sin(ph * Math.PI * 2);
  const ry = c.root.rotation.y, F = V(Math.sin(ry), 0, Math.cos(ry)), R = V(Math.cos(ry), 0, -Math.sin(ry)), O = c.root.position.clone();
  const L = (x, y, z) => O.clone().addScaledVector(R, x).addScaledVector(F, z).add(V(0, y, 0));   // character-local → world (x = its left)
  const hips = bone(c.root, 'Hips'); c.root.updateMatrixWorld(true); const h0 = wp(hips);
  const slope = o.slope || 0, gy = z => z * slope;
  if (name === 'rope_pull') {
    const lean = ((o.lean ?? 35) * 0.62 + 4 * S) * Math.PI / 180;   // hip pitch; the bent legs + back-shifted hips add the rest (visual lean ≈ o.lean)
    const hp = L(0, h0.y - O.y - 0.1, -0.1 - 0.04 * S); hips.position.copy(hips.parent.worldToLocal(hp)); hips.updateMatrixWorld(true);
    rotWorld(hips, R, -lean);
    for (const n of ['Neck', 'Head']) rotWorld(bone(c.root, n), R, lean * 0.35);
    // hands on the rope (or a virtual rope at hip-chest height in front)
    const chest = wp(bone(c.root, 'Spine2')).addScaledVector(F, 0.42); let hand = L(0, 0.98 + 0.03 * S, 0.42 - 0.12 * Math.max(0, S)), dir = F.clone();
    if (o.rope) { const [A, B2] = o.rope, ab = B2.clone().sub(A), k = Math.min(1, Math.max(0, chest.clone().sub(A).dot(ab) / ab.lengthSq())); hand = A.clone().addScaledVector(ab, k); dir = ab.normalize(); if (dir.dot(F) < 0) dir.negate(); hand.addScaledVector(dir, -0.08 * Math.max(0, S)); }
    limb(c, 'LeftArm', 'LeftForeArm', 'LeftHand', hand.clone().addScaledVector(dir, 0.13).addScaledVector(R, 0.02), R.clone().multiplyScalar(0.7).add(V(0, -0.6, 0)));
    limb(c, 'RightArm', 'RightForeArm', 'RightHand', hand.clone().addScaledVector(dir, -0.05).addScaledVector(R, -0.02), R.clone().multiplyScalar(-0.7).add(V(0, -0.6, 0)));
    // feet dig in ahead of the hips; each foot re-plants once per cycle (left on the first half, right on the second)
    const lift = (a) => Math.max(0, Math.sin((ph - a) * Math.PI * 4)) * (((ph - a + 1) % 1) < 0.25 ? 1 : 0) * 0.07;
    limb(c, 'LeftUpLeg', 'LeftLeg', 'LeftFoot', L(0.11, 0.08 + lift(0) + gy(0.32), 0.32), F.clone().add(V(0, 0.2, 0)));
    limb(c, 'RightUpLeg', 'RightLeg', 'RightFoot', L(-0.11, 0.08 + lift(0.5) + gy(0.05), 0.05), F.clone().add(V(0, 0.2, 0)));
  } else if (name === 'shoulder_push') {
    const lean = (40 + 4 * S) * Math.PI / 180;
    const hp = L(0, h0.y - O.y - 0.16, -0.08); hips.position.copy(hips.parent.worldToLocal(hp)); hips.updateMatrixWorld(true);
    rotWorld(hips, R, lean);
    for (const n of ['Neck', 'Head']) rotWorld(bone(c.root, n), R, -lean * 0.55);
    const T = o.target ? o.target.clone() : L(0, 1.05, 0.55);
    limb(c, 'LeftArm', 'LeftForeArm', 'LeftHand', T.clone().addScaledVector(R, 0.16).add(V(0, -0.04, 0)), R.clone().add(V(0, -0.8, 0)));
    limb(c, 'RightArm', 'RightForeArm', 'RightHand', T.clone().addScaledVector(R, -0.12).add(V(0, 0.06, 0)), R.clone().negate().add(V(0, -0.8, 0)));
    // walking uphill: legs alternate (one drives back, one steps under)
    const st = (a) => { const q = ((ph - a) % 1 + 1) % 1; return q < 0.5 ? { z: 0.25 - q * 1.3, y: 0 } : { z: -0.4 + (q - 0.5) * 1.3, y: Math.sin((q - 0.5) * Math.PI * 2) * 0.09 }; };
    const sl = st(0), sr = st(0.5);
    limb(c, 'LeftUpLeg', 'LeftLeg', 'LeftFoot', L(0.1, 0.08 + sl.y + gy(sl.z), sl.z), F.clone().add(V(0, 0.3, 0)));
    limb(c, 'RightUpLeg', 'RightLeg', 'RightFoot', L(-0.1, 0.08 + sr.y + gy(sr.z), sr.z), F.clone().add(V(0, 0.3, 0)));
  }
  c.root.updateMatrixWorld(true);
}
// reset(c): restore the idle snapshot (seek-safe base for custom poses)
function reset(c, clip = 'idle', at = 0.4) { clipAt(c, clip, at); }
// updateLimbs(c): RicksClips mode — upper arms / thighs drawn from a point ON the torso to the elbow / knee (call after posing)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _y = new THREE.Vector3(0, 1, 0);
const _n0 = new THREE.Vector3(), _n1 = new THREE.Vector3(), _n2 = new THREE.Vector3(), _nc = new THREE.Vector3();
function noodle(c, sc) { if (!c._nd) { c._nd = {}; for (const sd of ['Left', 'Right']) for (const k of ['arm', 'leg']) { const a = c.dyn.find(d => d.side === sd && d.kind === k), b = c.dyn.find(d => d.side === sd && d.kind === (k === 'arm' ? 'fore' : 'shin'));
      if (!a || !b) continue; const m = new THREE.Mesh(new THREE.BufferGeometry(), a.mesh.material); m.castShadow = true; scene.add(m); const ink2 = c.opts.inkPx ? new THREE.Mesh(m.geometry, inkPx(c.opts.inkPx * 0.7)) : null; if (ink2) m.add(ink2); c._nd[sd + k] = { a, b, m, ink2, r: a.r }; } }
  for (const key in c._nd) { const N = c._nd[key]; N.a.mesh.visible = N.b.mesh.visible = false; N.m.visible = c.root.visible; if (!c.root.visible) continue;
    N.a.from.getWorldPosition(_n0); N.a.to.getWorldPosition(_n1); N.b.to.getWorldPosition(_n2);
    _nc.copy(_n0).add(_n2).multiplyScalar(0.5); const ctrl = _n1.clone().add(_n1.clone().sub(_nc).multiplyScalar(0.55));   // bow out past the joint: a soft noodle bend, never a sharp elbow/knee
    const curve = new THREE.QuadraticBezierCurve3(_n0.clone(), ctrl, _n2.clone()); const g = new THREE.TubeGeometry(curve, 14, N.r * sc, 7, false);
    N.m.geometry.dispose(); N.m.geometry = g; if (N.ink2) N.ink2.geometry = g; } }
function updateLimbs(c) { if (!c.dyn) return; c.root.updateMatrixWorld(true); const sc = c.root.scale.x; if (c.opts.noodle) { for (const d of c.dyn) { d.from.getWorldPosition(_a); d.to.getWorldPosition(_b); d.mesh.position.copy(_a); } noodle(c, sc); return; }
  for (const d of c.dyn) { d.mesh.visible = c.root.visible; if (!c.root.visible) continue; d.from.getWorldPosition(_a); d.to.getWorldPosition(_b);
    const L = _a.distanceTo(_b); d.mesh.position.copy(_a); d.mesh.quaternion.setFromUnitVectors(_y, _b.sub(_a).normalize()); d.mesh.scale.set(sc, Math.max(L, 1e-3), sc);
    d.cap.scale.set(1, sc / Math.max(L, 1e-3), 1); d.cap.position.y = 1; } }
// clipAt(c, clip, t): sample a Mixamo clip straight into the bones (no mixer cache, so it mixes safely with IK poses)
function clipAt(c, clip, t) { if (!c._tr) c._tr = {}; if (!c._tr[clip]) { const cl = CLIPS[clip]; c._tr[clip] = { dur: cl.duration, tr: cl.tracks.map(tk => { const pn = THREE.PropertyBinding.parseTrackName(tk.name); const b = c.root.getObjectByName(pn.nodeName); return b ? [b, pn.propertyName, tk.createInterpolant(), tk.ValueTypeName] : null; }).filter(Boolean) }; }
  const T = c._tr[clip], tt = ((t % T.dur) + T.dur) % T.dur;
  for (const [b, prop, ip] of T.tr) { const v = ip.evaluate(tt); if (prop === 'quaternion') b.quaternion.set(v[0], v[1], v[2], v[3]); else if (prop === 'position') b.position.set(v[0], v[1], v[2]); else if (prop === 'scale') b.scale.set(v[0], v[1], v[2]); }
  c.root.updateMatrixWorld(true); }
return { setInkRes: (w, h) => INK_RES.set(w, h), build, pose, reset, updateLimbs, clipAt, limb, rotWorld, aim, wp, bone, ARMY, CLIPS, RIM, toon, eyes, smile, smirk, camoTex, faceTex, INK, WH };
}
