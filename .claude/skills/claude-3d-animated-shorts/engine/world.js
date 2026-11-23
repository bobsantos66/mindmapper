// world.js — Phan Thiết dunes, a single metre-gauge line to the horizon, the trader camp, a small steam train.
// Everything toon + ink hulls (stickrig's toon/rim material), heights from H(x, z) so props sit on the sand.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const sm = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
export const RAILTOP = 0.32, GAUGE = 1.0, HILLZ = -150;
export function H(x, z) {
  const ax = Math.abs(x), flat = sm(5, 18, ax), amp = 1 + Math.min(2.2, ax / 70);
  const d = 2.4 * Math.sin(x * 0.043 + z * 0.021) + 1.7 * Math.sin(x * 0.088 - z * 0.034 + 1.3) + 0.8 * Math.sin(x * 0.17 + z * 0.09 + 0.4) + 1.2 * Math.abs(Math.sin(z * 0.012 + x * 0.01));
  const hill = 11 * Math.exp(-(((z - HILLZ) / 26) ** 2)) * sm(3.4, 7, ax) * (1 + 0.3 * Math.sin(x * 0.05));
  const land = flat * (d + 2.6) * amp + hill, beach = sm(300, 420, x);
  return land * (1 - beach) - 4 * beach;
}
export function buildWorld(scene, SR) {
  const { toon } = SR, INK = '#16110f';
  const inkM = (w) => { const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }); m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n transformed += normalize(normal) * ${w.toFixed(4)};`); }; m.customProgramCacheKey = () => 'wink' + w; return m; };
  const mesh = (g, m, o = {}) => { const x = new THREE.Mesh(g, m); x.castShadow = o.cast ?? true; x.receiveShadow = o.recv ?? true; if (o.ink) { const h = new THREE.Mesh(g, inkM(o.ink)); h.castShadow = false; x.add(h); } return x; };
  const W = {};
  // ---------- sky: deep blue zenith → warm haze horizon, flat cartoon clouds ----------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vp; void main(){ float h = vp.y; vec3 sd = normalize(vec3(-0.7, 0.0, 0.6)); float toward = max(0.0, dot(normalize(vec3(vp.x, 0.0, vp.z)), sd));
      // bright cartoon day like the "Nghe tàu tới" test (owner 2026-11-10): pale horizon → clear saturated blue
      vec3 c = mix(vec3(0.86,0.94,1.0), vec3(0.52,0.78,1.0), smoothstep(0.0, 0.12, h));
      c = mix(c, vec3(0.27,0.6,0.98), smoothstep(0.1, 0.4, h));
      c = mix(c, vec3(0.16,0.45,0.92), smoothstep(0.4, 0.9, h)); c += toward * 0.0;
      c = mix(c, vec3(0.7,0.82,0.9), smoothstep(0.0, -0.05, h)); gl_FragColor = vec4(c, 1.0); }` }));
  sky.renderOrder = -1; scene.add(sky); W.sky = sky;
  scene.fog = new THREE.Fog('#cfe6fa', 260, 2200);
  let sd = 11; const R = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  const cloudM = (fade) => new THREE.ShaderMaterial({ fog: false, uniforms: { fade: { value: fade } },
    vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float fade; varying vec3 vN; varying vec3 vW; void main(){ float l = dot(normalize(vN), normalize(vec3(-0.7, 0.15, 0.6)));
      vec3 top = vec3(1.0, 1.0, 1.0), mid = vec3(0.95, 0.97, 1.0), bot = vec3(0.74, 0.82, 0.94); vec3 c = l > 0.35 ? top : (l > -0.1 ? mid : bot);
      c = mix(c, bot * 0.92, smoothstep(0.2, -0.6, vN.y) * 0.5); c = mix(c, vec3(0.86, 0.92, 1.0), fade); gl_FragColor = vec4(c, 1.0); }` });
  W.clouds = new THREE.Group(); scene.add(W.clouds);
  for (const [n, d0, d1, sz, fade] of [[10, 500, 800, 1.0, 0.0], [14, 1000, 1500, 1.5, 0.25], [16, 1800, 2400, 2.0, 0.5]]) { const m = cloudM(fade);
    for (let i = 0; i < n; i++) { const g = new THREE.Group(), a = R() * Math.PI * 2, dist = d0 + R() * (d1 - d0); g.position.set(Math.sin(a) * dist, 110 + R() * 160 * sz, Math.cos(a) * dist);
      const w = (60 + R() * 70) * sz, puffs = 9 + Math.floor(R() * 8);
      for (let k = 0; k < puffs; k++) { const u = R() * 2 - 1, r = w * (0.22 + R() * 0.2) * (1 - Math.abs(u) * 0.45); const s2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), m); s2.scale.set(r * 1.15, r, r);
        s2.position.set(u * w, Math.max(0, r * 0.55 - Math.abs(u) * w * 0.12) + R() * r * 0.4, (R() - 0.5) * w * 0.35); g.add(s2); }
      const base = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), m); base.scale.set(w * 1.15, w * 0.12, w * 0.32); g.add(base);
      g.lookAt(0, g.position.y, 0); W.clouds.add(g); } }
  // ---------- dunes ----------
  const NX = 300, NZ = 560, geo = new THREE.PlaneGeometry(1, 1, NX, NZ); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), cA = new THREE.Color('#86cc3e'), cB = new THREE.Color('#62b032'), cC = new THREE.Color('#a9dc5e'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) { const u = pos.getX(i) * 2, v = pos.getZ(i) + 0.5;   // u ∈ [-1,1], v ∈ [0,1] (front → back)
    const x = Math.sign(u) * 800 * Math.pow(Math.abs(u), 1.8), z = 240 - 2700 * Math.pow(v, 1.6), y = H(x, z);
    pos.setXYZ(i, x, y, z); const k = sm(-1, 6, y + 0.6 * Math.sin(x * 0.3) * Math.sin(z * 0.27)); c.copy(cB).lerp(cA, k); if (y > 5) c.lerp(cC, sm(5, 12, y) * 0.6); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); { const ix = geo.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } } geo.computeVertexNormals();
  const sandTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 6000; i++) { const v = 200 + Math.random() * 55 | 0; g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    g.strokeStyle = 'rgba(140,110,80,0.16)'; g.lineWidth = 3; for (let y = 0; y < 256; y += 18) { g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin(x / 256 * Math.PI * 4 + y) * 5); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(500, 900); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  const sandM = toon('#ffffff', { rim: 0, kick: 0, map: sandTex }); sandM.vertexColors = true;
  const ground = mesh(geo, sandM, { cast: false }); scene.add(ground); W.ground = ground;
  // ripple stripes on the sand near the camp (decal plane with alpha)
  { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); g.strokeStyle = 'rgba(170,100,40,0.18)'; g.lineWidth = 5;
    for (let y = 0; y < 256; y += 22) { g.beginPath(); for (let x = 0; x <= 256; x += 8) g.lineTo(x, y + Math.sin(x / 256 * Math.PI * 2 * 2) * 6); g.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(16, 60); t.colorSpace = THREE.SRGBColorSpace;
    for (const sx of []) { const p = new THREE.Mesh(new THREE.PlaneGeometry(9, 400), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); p.rotation.x = -Math.PI / 2; p.position.set(sx * 6.2, 0.02, -80); p.renderOrder = 1; scene.add(p); } }
  // ---------- the line: ballast, sleepers, two rails (metre gauge) ----------
  const Z0 = 140, Z1 = -2300, LEN = Z0 - Z1, ZM = (Z0 + Z1) / 2;
  const gv = document.createElement('canvas'); gv.width = gv.height = 256; { const g = gv.getContext('2d'); g.fillStyle = '#8f8c88'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1400; i++) { const x = Math.random() * 256, y = Math.random() * 256, r = 2 + Math.random() * 5; g.fillStyle = ['#a3a09b', '#c4c1bb', '#7f7c78', '#b2aea8', '#94918c', '#d6d3cd'][i % 6]; g.beginPath(); g.ellipse(x, y, r, r * 0.75, Math.random() * 3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,245,225,0.35)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7); g.fill(); } }
  const gt = new THREE.CanvasTexture(gv); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(2, LEN / 2.5); gt.colorSpace = THREE.SRGBColorSpace;
  const bal = mesh(new THREE.BoxGeometry(2.3, 0.1, LEN), toon('#d7d2cc', { rim: 0, kick: 0, map: gt }), { cast: false }); bal.position.set(0, 0.05, ZM); scene.add(bal);
  for (const sx of [-1, 1]) { const sl = mesh(new THREE.BoxGeometry(0.5, 0.1, LEN), toon('#b3afa8', { rim: 0, kick: 0 }), { cast: false }); sl.position.set(sx * 1.3, 0.02, ZM); sl.rotation.z = sx * 0.25; scene.add(sl); }
  const N = Math.floor(LEN / 0.62), sg = new THREE.BoxGeometry(1.75, 0.1, 0.2), sMat = toon('#7b4a2a', { rim: 0.2, kick: 0 });
  const sleepers = new THREE.InstancedMesh(sg, sMat, N); const mm = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { mm.makeTranslation(0, 0.15, Z0 - i * 0.62); sleepers.setMatrixAt(i, mm); } sleepers.receiveShadow = true; sleepers.castShadow = false; scene.add(sleepers);
  const railM = toon('#8b9097', { rim: 0.5, kick: 0.3 }), headM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.15, 1.12, 1.08) });
  W.rails = [];
  for (const sx of [-1, 1]) { const g = new THREE.Group(); g.position.set(sx * GAUGE / 2, 0, ZM);
    const web = mesh(new THREE.BoxGeometry(0.03, 0.09, LEN), railM, { cast: false }); web.position.y = 0.245; g.add(web);
    const foot = mesh(new THREE.BoxGeometry(0.1, 0.02, LEN), railM, { cast: false }); foot.position.y = 0.21; g.add(foot);
    const hd = mesh(new THREE.BoxGeometry(0.065, 0.035, LEN), railM, { cast: false }); hd.position.y = RAILTOP - 0.018; g.add(hd);
    const top = mesh(new THREE.BoxGeometry(0.045, 0.004, LEN), headM, { cast: false }); top.position.y = RAILTOP + 0.001; g.add(top);
    scene.add(g); W.rails.push(g); }
  // ---------- telegraph poles + wires along the line ----------
  const poleM = toon('#5b3e2a', { rim: 0.4 }), insM = toon('#dfe7ea', { rim: 0.3 }), wireM = new THREE.LineBasicMaterial({ color: '#2a2220' });
  const tops = [];
  for (let z = 120; z > -2000; z -= 42) { const x = -4.2, y0 = H(x, z); const p = mesh(new THREE.CylinderGeometry(0.07, 0.1, 6.4, 7), poleM, { ink: 0.012 }); p.position.set(x, y0 + 3.2, z); scene.add(p);
    const arm = mesh(new THREE.BoxGeometry(1.3, 0.1, 0.1), poleM, { ink: 0.01 }); arm.position.set(x, y0 + 5.9, z); scene.add(arm);
    for (const ax of [-0.5, 0.5]) { const ins = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 6), insM, { cast: false }); ins.position.set(x + ax, y0 + 6.02, z); scene.add(ins); }
    tops.push([x, y0 + 6.08, z]); }
  for (const ax of [-0.5, 0.5]) { const pts = []; for (let i = 0; i + 1 < tops.length; i++) { const [x, y, z] = tops[i], [, y2, z2] = tops[i + 1]; for (let k = 0; k <= 8; k++) { const f = k / 8; pts.push(V(x + ax, y + (y2 - y) * f - Math.sin(f * Math.PI) * 0.55, z + (z2 - z) * f)); } }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireM)); }
  // ---------- scrub bushes on the dunes ----------
  { const bg = new THREE.IcosahedronGeometry(1, 1), bm = toon('#5f8a3e', { rim: 0.4 }); const n = 520, inst = new THREE.InstancedMesh(bg, bm, n); const q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    let k = 0; sd = 5; while (k < n) { const x = (R() - 0.5) * 300, z = 60 - R() * 520; if (Math.abs(x) < 6) continue; const r = 0.35 + R() * 0.9; p.set(x, H(x, z) + r * 0.3, z); s.set(r * 1.3, r * 0.7, r); mm.compose(p, q, s); inst.setMatrixAt(k++, mm); }
    inst.castShadow = true; inst.receiveShadow = true; scene.add(inst); }

  // ---------- camp props ----------
  const wood = toon('#8b5e3c', { rim: 0.45 }), wood2 = toon('#6d4529', { rim: 0.4 }), bam = toon('#c9a560', { rim: 0.5 });
  // lean-to (lán): four bamboo poles, striped canvas roof sloping to one side, straddling the rail
  const lan = new THREE.Group(); scene.add(lan); W.lan = lan;
  { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 16; const g = cv.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f3e7cf' : '#c8453a'; g.fillRect(i * 32, 0, 32, 16); }
    const tt = new THREE.CanvasTexture(cv); tt.colorSpace = THREE.SRGBColorSpace;
    for (const [x, z, h] of [[-1.8, -1.2, 2.5], [1.8, -1.2, 1.7], [-1.8, 1.2, 2.5], [1.8, 1.2, 1.7]]) { const p = mesh(new THREE.CylinderGeometry(0.045, 0.05, h, 7), bam, { ink: 0.008 }); p.position.set(x, h / 2, z); lan.add(p); }
    const roof = mesh(new THREE.BoxGeometry(4.3, 0.04, 3.0), toon('#ffffff', { rim: 0.3, map: tt, side: THREE.DoubleSide }), { ink: 0.01 }); roof.position.set(0, 2.12, 0); roof.rotation.z = -0.2; lan.add(roof);
    const mat = mesh(new THREE.BoxGeometry(2.6, 0.03, 1.8), toon('#d9b46a', { rim: 0 }), { cast: false }); mat.position.set(-0.2, RAILTOP + 0.02, 0); lan.add(mat);
    for (const [x, z, s, cc] of [[-1.3, 0.6, 0.45, '#cdb48a'], [-1.0, -0.5, 0.38, '#b8956a'], [1.2, 0.5, 0.42, '#d8c39c'], [1.35, -0.6, 0.34, '#a8835a']]) { const b = mesh(new RoundedBoxGeometry(s * 1.4, s, s, 3, s * 0.3), toon(cc, { rim: 0.4 }), { ink: 0.006 }); b.position.set(x, RAILTOP + s / 2, z); lan.add(b); } }
  lan.position.set(0, 0, -4);
  // ox cart (xe bò), across the rail: two big spoked wheels, plank bed, shafts on the ground (unhitched)
  const cart = new THREE.Group(); scene.add(cart); W.cart = cart;
  { const bed = mesh(new RoundedBoxGeometry(2.4, 0.12, 1.3, 2, 0.03), wood, { ink: 0.008 }); bed.position.set(0, 0.95, 0); cart.add(bed);
    for (const sz of [-1, 1]) { const side = mesh(new THREE.BoxGeometry(2.4, 0.32, 0.06), wood2, { ink: 0.007 }); side.position.set(0, 1.17, sz * 0.63); cart.add(side); }
    for (const sz of [-1, 1]) { const w = new THREE.Group(); w.position.set(0, 0.62, sz * 0.82); cart.add(w);
      const rim = mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 24), wood2, { ink: 0.008 }); w.add(rim); const hub = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 10), wood2); hub.rotation.x = Math.PI / 2; w.add(hub);
      for (let k = 0; k < 8; k++) { const sp = mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.15, 5), wood, { cast: false }); sp.rotation.z = k * Math.PI / 8; w.add(sp); } }
    const ax = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), wood2); ax.rotation.x = Math.PI / 2; ax.position.y = 0.62; cart.add(ax);
    for (const sz of [-0.35, 0.35]) { const sh = mesh(new THREE.CylinderGeometry(0.04, 0.035, 2.6, 6), wood, { ink: 0.007 }); sh.rotation.z = Math.PI / 2 - 0.36; sh.position.set(2.2, 0.48, sz); cart.add(sh); }
    for (const [x, z, s] of [[-0.6, 0.2, 0.42], [0.3, -0.25, 0.38], [0.1, 0.3, 0.34]]) { const b = mesh(new RoundedBoxGeometry(s * 1.3, s, s, 3, s * 0.3), toon('#c9a77a', { rim: 0.4 }), { ink: 0.006 }); b.position.set(x, 1.01 + s / 2, z); cart.add(b); } }
  // ox (resting beside the camp)
  const ox = new THREE.Group(); scene.add(ox); W.ox = ox;
  { const om = toon('#c58a52', { rim: 0.6 }), dk = toon('#3b2a20', { rim: 0.3 }), hornM = toon('#efe6d2', { rim: 0.3 });
    const body = mesh(new THREE.SphereGeometry(0.6, 20, 14), om, { ink: 0.012 }); body.scale.set(0.85, 0.7, 1.55); body.position.y = 0.55; ox.add(body);
    const hump = mesh(new THREE.SphereGeometry(0.28, 14, 10), om, { ink: 0.01 }); hump.position.set(0, 0.95, 0.55); ox.add(hump);
    const head = mesh(new THREE.SphereGeometry(0.3, 16, 12), om, { ink: 0.01 }); head.scale.set(0.8, 0.85, 1.25); head.position.set(0, 0.85, 1.25); ox.add(head);
    const muz = mesh(new THREE.SphereGeometry(0.17, 12, 10), toon('#e9c9a8', { rim: 0.3 }), { ink: 0.008 }); muz.position.set(0, 0.74, 1.55); ox.add(muz);
    for (const sd2 of [-1, 1]) { const hn = mesh(new THREE.ConeGeometry(0.05, 0.32, 8), hornM, { ink: 0.006 }); hn.position.set(sd2 * 0.2, 1.12, 1.15); hn.rotation.z = -sd2 * 0.9; ox.add(hn);
      const e = mesh(new THREE.SphereGeometry(0.035, 8, 6), dk, { cast: false }); e.position.set(sd2 * 0.16, 0.92, 1.45); ox.add(e);
      for (const lz of [-0.6, 0.6]) { const lg = mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.3, 7), om, { ink: 0.006 }); lg.rotation.x = Math.PI / 2; lg.position.set(sd2 * 0.42, 0.12, lz + 0.25); ox.add(lg); } } }
  ox.position.set(-5.2, 0, 1.5); ox.rotation.y = 0.5;
  // porridge pot on a wood fire beside the rail
  const pot = new THREE.Group(); scene.add(pot); W.pot = pot; const fire = new THREE.Group(); scene.add(fire); W.fire = fire;
  { const pm = toon('#2c2a2e', { rim: 0.8, kick: 0.5 }); const prof = [[0, 0], [0.2, 0.01], [0.3, 0.1], [0.32, 0.25], [0.29, 0.4], [0.3, 0.42]].map(([r, y]) => new THREE.Vector2(r, y));
    const body = mesh(new THREE.LatheGeometry(prof, 24), toon('#2c2a2e', { rim: 0.8, kick: 0.5, side: THREE.DoubleSide }), { ink: 0.008 }); pot.add(body);
    const por = mesh(new THREE.CircleGeometry(0.28, 24), toon('#f4ead2', { rim: 0 }), { cast: false }); por.rotation.x = -Math.PI / 2; por.position.y = 0.36; pot.add(por); W.porridge = por;
    for (const sd2 of [-1, 1]) { const ear = mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 10), pm); ear.position.set(sd2 * 0.33, 0.36, 0); ear.rotation.y = Math.PI / 2; pot.add(ear); }
    for (let k = 0; k < 3; k++) { const a = k * 2.1, st = mesh(new THREE.DodecahedronGeometry(0.13), toon('#8d8378', { rim: 0.4 }), { ink: 0.006 }); st.position.set(Math.cos(a) * 0.3, 0.1, Math.sin(a) * 0.3); fire.add(st); }
    for (let k = 0; k < 4; k++) { const lg = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.7, 6), wood2, { ink: 0.006 }); lg.rotation.set(Math.PI / 2, 0, k * 0.8); lg.position.y = 0.06; fire.add(lg); }
    W.flames = []; for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.32, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(k % 2 ? 2.4 : 2.0, k % 2 ? 1.1 : 0.55, 0.15) })); const a = k * 1.3; f.position.set(Math.cos(a) * 0.12, 0.2, Math.sin(a) * 0.12); fire.add(f); W.flames.push(f); } }
  W.steam = []; { const stM = new THREE.MeshBasicMaterial({ color: '#fffaf0', transparent: true, opacity: 0.55, depthWrite: false }); for (let k = 0; k < 7; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), stM); scene.add(s); W.steam.push(s); } }
  W.bowl = (() => { const g = new THREE.Group(); const b = mesh(new THREE.SphereGeometry(0.14, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon('#f3f6f8', { rim: 0.5, side: THREE.DoubleSide }), { ink: 0.008 }); g.add(b);
    const band = mesh(new THREE.TorusGeometry(0.135, 0.012, 6, 24), toon('#2f6fb0', { rim: 0.3 }), { cast: false }); band.rotation.x = Math.PI / 2; band.position.y = -0.03; g.add(band);
    const f = mesh(new THREE.CircleGeometry(0.12, 18), toon('#f4ead2', { rim: 0 }), { cast: false }); f.rotation.x = -Math.PI / 2; f.position.y = -0.02; g.add(f); g.userData.fill = f; scene.add(g); return g; })();
  W.ladle = (() => { const g = new THREE.Group(); const h = mesh(new THREE.CylinderGeometry(0.018, 0.022, 1, 8), wood, { ink: 0.006 }); h.geometry.translate(0, 0.5, 0); g.add(h); g.userData.h = h;
    const cup = new THREE.Group(); g.add(cup); g.userData.cup = cup; const cb = mesh(new THREE.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon('#8a5a34', { rim: 0.5, side: THREE.DoubleSide }), { ink: 0.007 }); cup.add(cb);
    const cf = mesh(new THREE.CircleGeometry(0.085, 14), toon('#f4ead2', { rim: 0 }), { cast: false }); cf.rotation.x = -Math.PI / 2; cf.position.y = -0.02; cup.add(cf); g.userData.fill = cf; scene.add(g); return g; })();
  W.stream = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 1, 8).translate(0, -0.5, 0), toon('#f4ead2', { rim: 0.2 })); W.stream.visible = false; scene.add(W.stream);
  W.hammer = (() => { const g = new THREE.Group(); const h = mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.6, 6), wood, { ink: 0.003 }); h.position.y = 0.3; g.add(h);
    const hd = mesh(new THREE.BoxGeometry(0.18, 0.07, 0.07), toon('#55575e', { rim: 0.7 }), { ink: 0.004 }); hd.position.y = 0.6; g.add(hd); scene.add(g); return g; })();
  W.rope = mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 6), toon('#c7a46a', { rim: 0.3 }), { cast: false }); scene.add(W.rope);
  // sand grains that hop on the rail head (shot 8)
  W.grains = []; { const gm = toon('#f0c27e', { rim: 0.3 }); for (let k = 0; k < 40; k++) { const g = mesh(new THREE.IcosahedronGeometry(0.008 + (k % 3) * 0.003, 0), gm, { cast: false }); scene.add(g); W.grains.push(g); } }

  // ---------- set dressing: rocks, dry shrubs, cactus-like plants, grass tufts, footprints, camp clutter, markers, birds, dust ----------
  { sd = 21; const q = new THREE.Quaternion(), sc3 = new THREE.Vector3(), p3 = new THREE.Vector3(), e = new THREE.Euler();
    const scatter = (geo, mat, n, fn) => { const im = new THREE.InstancedMesh(geo, mat, n); let k = 0, guard = 0; while (k < n && guard++ < n * 20) { const r = fn(); if (!r) continue; e.set(r.rx || 0, r.ry || R() * 6.28, r.rz || 0); q.setFromEuler(e); p3.set(r.x, r.y, r.z); sc3.set(...r.s); mm.compose(p3, q, sc3); im.setMatrixAt(k++, mm); } im.count = k; im.castShadow = true; im.receiveShadow = true; scene.add(im); return im; };
    const nearTrack = () => { const side = R() < 0.5 ? -1 : 1, x = side * (1.5 + Math.pow(R(), 1.6) * 40), z = 70 - R() * 330; if (Math.abs(x) < 1.45) return null; if (Math.abs(x) < 7 && z > -7 && z < 7) return null; return [x, z]; };
    scatter(new THREE.DodecahedronGeometry(1, 0), toon('#8f877c', { rim: 0.4 }), 520, () => { const p = nearTrack(); if (!p) return null; const r = 0.06 + Math.pow(R(), 3) * 0.6; return { x: p[0], y: H(p[0], p[1]) + r * 0.3, z: p[1], s: [r * 1.3, r * 0.8, r], rx: R(), rz: R() }; });
    scatter(new THREE.DodecahedronGeometry(1, 0), toon('#c8b49a', { rim: 0.3 }), 300, () => { const side = R() < 0.5 ? -1 : 1, x = side * (1.18 + R() * 0.5), z = 60 - R() * 200; const r = 0.03 + R() * 0.07; return { x, y: 0.03, z, s: [r, r * 0.7, r] }; });
    const twig = (() => { const gs = []; for (let i = 0; i < 9; i++) { const g = new THREE.CylinderGeometry(0.008, 0.018, 0.55 + (i % 3) * 0.15, 4); g.translate(0, 0.3, 0); g.rotateZ((i % 2 ? 1 : -1) * (0.35 + (i % 4) * 0.15)); g.rotateY(i * 0.7); gs.push(g); } return mergeGeometries(gs); })();
    scatter(twig, toon('#8a6a44', { rim: 0.3 }), 260, () => { const p = nearTrack(); if (!p) return null; const s2 = 0.6 + R() * 1.2; return { x: p[0], y: H(p[0], p[1]), z: p[1], s: [s2, s2 * (0.8 + R() * 0.5), s2] }; });
    const tuft = (() => { const gs = []; for (let i = 0; i < 7; i++) { const g = new THREE.ConeGeometry(0.025, 0.35, 3); g.translate(0, 0.17, 0); g.rotateZ((i - 3) * 0.16); g.rotateY(i * 0.9); gs.push(g); } return mergeGeometries(gs); })();
    scatter(tuft, toon('#9cad52', { rim: 0.4 }), 1100, () => { const p = nearTrack(); if (!p) return null; const s2 = 0.7 + R() * 1.0; return { x: p[0], y: H(p[0], p[1]), z: p[1], s: [s2, s2, s2] }; });
    const cact = (() => { const gs = [new THREE.CylinderGeometry(0.12, 0.14, 1.4, 8).translate(0, 0.7, 0), new THREE.SphereGeometry(0.12, 8, 6).translate(0, 1.4, 0)];
      for (const sx of [-1, 1]) { gs.push(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 6).rotateZ(Math.PI / 2).translate(sx * 0.25, 0.6 + sx * 0.12, 0)); gs.push(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 6).translate(sx * 0.38, 0.85 + sx * 0.12, 0)); gs.push(new THREE.SphereGeometry(0.07, 6, 5).translate(sx * 0.38, 1.08 + sx * 0.12, 0)); }
      return mergeGeometries(gs.map(g => g.toNonIndexed())); })();
    scatter(cact, toon('#5f8448', { rim: 0.5 }), 40, () => { const side = R() < 0.5 ? -1 : 1, x = side * (6 + R() * 30), z = 50 - R() * 250; if (z > -9 && z < 9 && Math.abs(x) < 9) return null; const s2 = 0.7 + R() * 0.8; return { x, y: H(x, z), z, s: [s2, s2, s2] }; });
    // footprints around the camp and along the track
    const fp = new THREE.InstancedMesh(new THREE.CircleGeometry(0.06, 10), new THREE.MeshBasicMaterial({ color: '#8e6232', transparent: true, opacity: 0.35, depthWrite: false }), 260); let k = 0;
    for (const [x0, z0, x1, z1] of [[-1.4, 6, -1.3, -16], [2.0, 2, 4.5, -6], [-2.5, 3, -5.0, 1.5], [1.2, -2, 6, 5], [-3, -3, -9, -8]]) { const n = 50; for (let i = 0; i < n && k < 260; i++) { const f = i / n, x = x0 + (x1 - x0) * f + (i % 2 ? 0.12 : -0.12), z = z0 + (z1 - z0) * f; if (Math.abs(x) < 1.2) continue; e.set(-Math.PI / 2, 0, Math.atan2(x1 - x0, z1 - z0)); q.setFromEuler(e); p3.set(x, Math.max(0, H(x, z)) + 0.012, z); sc3.set(0.7, 1.3, 1); mm.compose(p3, q, sc3); fp.setMatrixAt(k++, mm); } }
    fp.count = k; scene.add(fp); }
  // camp clutter: crates, baskets, water jars, kettle + bowls on a mat, rope coil, hitching post, laundry line, tarp
  const clutter = new THREE.Group(); scene.add(clutter); W.clutter = clutter;
  { const plank = toon('#a87a4c', { rim: 0.45 }), plank2 = toon('#7e5634', { rim: 0.4 }), clay = toon('#b8643c', { rim: 0.5 }), wick = toon('#c9a15e', { rim: 0.4 });
    const crate = (x, z, s, ry = 0, y = 0) => { const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(s, s * 0.75, s * 0.8), plank, { ink: 0.008 }); b.position.y = s * 0.375; g.add(b);
      for (const yy of [0.12, 0.62]) { const sl = mesh(new THREE.BoxGeometry(s * 1.02, s * 0.06, s * 0.82), plank2, { cast: false }); sl.position.y = s * yy; g.add(sl); }
      g.position.set(x, y + Math.max(0, H(x, z)), z); g.rotation.y = ry; clutter.add(g); return g; };
    crate(-2.9, -3.2, 0.6, 0.3); crate(-2.85, -3.15, 0.45, 0.6, 0.45); crate(2.9, -5.6, 0.55, -0.2); crate(-3.6, 2.6, 0.5, 0.9);
    const basket = (x, z, r2) => { const b = mesh(new THREE.CylinderGeometry(r2, r2 * 0.8, r2 * 1.1, 14, 1, true), wick, { ink: 0.006 }); b.material.side = THREE.DoubleSide; b.position.set(x, r2 * 0.55, z); clutter.add(b);
      const f = mesh(new THREE.SphereGeometry(r2 * 0.9, 12, 8), toon(['#d64a2c', '#e6c04a', '#6aa04a'][Math.floor(Math.abs(x * 7)) % 3], { rim: 0.4 }), { cast: false }); f.scale.y = 0.4; f.position.set(x, r2 * 1.05, z); clutter.add(f); };
    basket(2.6, -2.7, 0.24); basket(3.1, -2.4, 0.2); basket(-2.4, 4.6, 0.22);
    const jar = (x, z, h2) => { const pr = [[0, 0], [0.12, 0.01], [0.2, 0.12], [0.22, 0.3], [0.16, 0.48], [0.08, 0.55], [0.1, 0.6]].map(([a, b]) => new THREE.Vector2(a * h2, b * h2)); const j = mesh(new THREE.LatheGeometry(pr, 16), clay, { ink: 0.008 }); j.position.set(x, Math.max(0, H(x, z)), z); clutter.add(j); };
    jar(3.3, 0.1, 1.2); jar(3.6, 0.5, 1.0); jar(-3.2, -0.6, 1.3);
    const mat2 = mesh(new THREE.BoxGeometry(1.4, 0.02, 1.0), toon('#c7a35a', { rim: 0 }), { cast: false }); mat2.position.set(2.7, 0.01, 1.9); clutter.add(mat2);
    for (let i = 0; i < 4; i++) { const b = mesh(new THREE.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon('#e7eef3', { rim: 0.5, side: THREE.DoubleSide }), { ink: 0.004 }); b.position.set(2.4 + (i % 2) * 0.2, 0.09 + Math.floor(i / 2) * 0.05, 1.7); b.rotation.x = Math.PI; clutter.add(b); }
    const ket = mesh(new THREE.SphereGeometry(0.13, 14, 10), toon('#4a4a52', { rim: 0.8 }), { ink: 0.005 }); ket.scale.y = 0.8; ket.position.set(3.0, 0.12, 2.1); clutter.add(ket);
    const coil = mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 18), toon('#c7a46a', { rim: 0.4 }), { ink: 0.005 }); coil.rotation.x = Math.PI / 2; coil.position.set(-2.2, 0.04, 4.3); clutter.add(coil);
    const coil2 = coil.clone(); coil2.position.y = 0.11; coil2.scale.setScalar(0.85); clutter.add(coil2);
    // hitching post next to the ox
    const hp = new THREE.Group(); hp.position.set(-6.6, 0, 3.2); clutter.add(hp);
    for (const sx of [-0.6, 0.6]) { const p2 = mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.2, 7), plank2, { ink: 0.008 }); p2.position.set(sx, 0.6, 0); hp.add(p2); }
    const bar = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 7), plank, { ink: 0.008 }); bar.rotation.z = Math.PI / 2; bar.position.y = 1.0; hp.add(bar);
    // laundry line between two poles with cloths
    const ll = new THREE.Group(); ll.position.set(-4.4, 0, -6.2); ll.rotation.y = 0.35; clutter.add(ll); W.laundry = [];
    for (const sx of [-1.6, 1.6]) { const p2 = mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.0, 6), toon('#c9a560', { rim: 0.4 }), { ink: 0.008 }); p2.position.set(sx, 1.0, 0); ll.add(p2); }
    const ln = mesh(new THREE.CylinderGeometry(0.006, 0.006, 3.2, 4), toon('#e9e1cf', { rim: 0 }), { cast: false }); ln.rotation.z = Math.PI / 2; ln.position.y = 1.9; ll.add(ln);
    [['#3a6fb0', -1.1, 0.5], ['#d0c39a', -0.3, 0.6], ['#b0453a', 0.5, 0.45], ['#e8e2d4', 1.15, 0.55]].forEach(([cc, x, h2]) => { const cl = mesh(new THREE.PlaneGeometry(0.5, h2, 2, 4), toon(cc, { rim: 0.3, side: THREE.DoubleSide }), { ink: 0.006 }); cl.geometry.translate(0, -h2 / 2, 0); cl.position.set(x, 1.9, 0); ll.add(cl); W.laundry.push(cl); });
    // tarp over sacks behind the lean-to
    const tarp = mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon('#6f7a4a', { rim: 0.4 }), { ink: 0.01 }); tarp.scale.set(1.2, 0.55, 0.8); tarp.position.set(3.4, 0, -6.4); clutter.add(tarp);
    // ox yoke + harness (unhitched, on the ox's neck)
    const yoke = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 7), plank2, { ink: 0.008 }); yoke.rotation.z = Math.PI / 2; yoke.position.set(0, 1.0, 1.05); ox.add(yoke);
    const strap = mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 16), toon('#5a3a22', { rim: 0.3 })); strap.position.set(0, 0.85, 1.0); ox.add(strap);
    const tether = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.8, 4), toon('#c7a46a', { rim: 0 }), { cast: false }); tether.rotation.set(0, 0, Math.PI / 2 - 0.3); tether.position.set(-0.9, 0.8, 1.4); ox.add(tether); }
  // km marker + signal post along the line
  { const km = new THREE.Group(); km.position.set(-1.75, 0, -22); scene.add(km);
    const post = mesh(new THREE.BoxGeometry(0.22, 0.8, 0.12), toon('#f1ece2', { rim: 0.4 }), { ink: 0.008 }); post.position.y = 0.4; km.add(post);
    const top = mesh(new THREE.BoxGeometry(0.23, 0.12, 0.13), toon('#c8352f', { rim: 0.4 }), { cast: false }); top.position.y = 0.76; km.add(top);
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 256; const g = cv.getContext('2d'); g.fillStyle = '#1a1a1a'; g.font = 'bold 74px sans-serif'; g.textAlign = 'center'; g.fillText('KM', 64, 100); g.fillText('196', 64, 190);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.36), new THREE.MeshBasicMaterial({ map: tx, transparent: true })); lab.position.set(0, 0.42, 0.065); km.add(lab); lab.rotation.y = 0; km.rotation.y = Math.PI * 0.15;
    const sg = new THREE.Group(); sg.position.set(1.9, 0, -48); scene.add(sg); const pm = toon('#2e2e33', { rim: 0.7 });
    const pole = mesh(new THREE.CylinderGeometry(0.06, 0.08, 5, 8), pm, { ink: 0.01 }); pole.position.y = 2.5; sg.add(pole);
    const armS = mesh(new THREE.BoxGeometry(1.1, 0.16, 0.05), toon('#c8352f', { rim: 0.5 }), { ink: 0.006 }); armS.position.set(-0.5, 4.4, 0.08); armS.rotation.z = -0.4; sg.add(armS);
    const band = mesh(new THREE.BoxGeometry(0.16, 0.17, 0.06), toon('#f1ece2', { rim: 0.3 }), { cast: false }); band.position.set(-0.85, 4.54, 0.09); band.rotation.z = -0.4; sg.add(band);
    const lampS = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 10), pm, { ink: 0.006 }); lampS.position.y = 5.1; sg.add(lampS);
    const lad = mesh(new THREE.BoxGeometry(0.04, 4.5, 0.25), pm, { cast: false }); lad.position.set(0.1, 2.3, -0.1); sg.add(lad); }
  // far dune ridges (layers toward the horizon)
  { const rm = toon('#d9c8a8', { rim: 0.2 }); for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, d = 1100 + (i % 3) * 260; const rd = mesh(new THREE.SphereGeometry(1, 20, 10), rm, { cast: false }); rd.scale.set(260 + (i % 4) * 80, 60 + (i % 3) * 35, 120); rd.position.set(Math.sin(a) * d, -15, Math.cos(a) * d); rd.rotation.y = a; scene.add(rd); } }
  // birds
  W.birds = []; { const bm = new THREE.MeshBasicMaterial({ color: '#2a2220', side: THREE.DoubleSide }); for (let i = 0; i < 9; i++) { const b = new THREE.Group(); for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.12), bm); w.geometry.translate(sx * 0.35, 0, 0); w.userData.sx = sx; b.add(w); } scene.add(b); W.birds.push(b); } }
  // dust motes in the air (follow the camera focus)
  { const n = 500, pg = new THREE.BufferGeometry(), arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) { arr[i * 3] = (R() - 0.5) * 30; arr[i * 3 + 1] = R() * 6; arr[i * 3 + 2] = (R() - 0.5) * 30; } pg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    W.dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#fff0d0', size: 0.035, transparent: true, opacity: 0.55, depthWrite: false })); scene.add(W.dust); }
  W.update = (t, focus) => {
    if (W.clouds) W.clouds.rotation.y = t * 0.0015; if (W.kites) W.kites.forEach((k, i) => { k.rotation.z = Math.sin(t * 1.3 + i) * 0.25; k.position.y += Math.sin(t * 0.9 + i) * 0.01; });
    W.birds.forEach((b, i) => { const a = t * (0.18 + i * 0.01) + i * 0.7, rr = 40 + i * 7; b.position.set(Math.sin(a) * rr - 10, 26 + (i % 4) * 5 + Math.sin(t + i) * 1.5, -60 + Math.cos(a) * rr * 0.6); b.rotation.y = -a; b.children.forEach(w => { w.rotation.z = w.userData.sx * Math.sin(t * 9 + i) * 0.6; }); });
    if (W.laundry) W.laundry.forEach((c, i) => { c.rotation.x = Math.sin(t * 2.3 + i) * 0.18 + 0.1; });
    if (focus) { W.dust.position.set(focus.x, Math.max(0, focus.y - 2), focus.z); W.dust.rotation.y = t * 0.05; }
  };
  // ---------- Phan Thiết scenery: phi lao rows, coconut palms, huts, fence, stacked sleepers, water tank, signal box, goats + cows, kites, the sea ----------
  { const q = new THREE.Quaternion(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(), e = new THREE.Euler(); sd = 77;
    const canopy = (() => { const gs = []; for (let i = 0; i < 5; i++) { const g = new THREE.ConeGeometry(1.25 - i * 0.18, 1.6, 9); g.translate(0, 3.0 + i * 0.95, 0); gs.push(g); } return mergeGeometries(gs); })();
    const trunkG = new THREE.CylinderGeometry(0.07, 0.13, 4.0, 6).translate(0, 2.0, 0); const spots = [];
    for (let z = 70; z > -260; z -= 4.2) for (const x0 of [-17, -21.5, 23, 27]) spots.push([x0 + (R() - 0.5) * 2.2, z + (R() - 0.5) * 2]);
    for (let i = 0; i < 70; i++) { const x = (R() < 0.5 ? -1 : 1) * (35 + R() * 120), z = 80 - R() * 400; spots.push([x, z]); }
    const tI = new THREE.InstancedMesh(trunkG, toon('#6b4f3a', { rim: 0.3 }), spots.length), cI = new THREE.InstancedMesh(canopy, toon('#3e6b47', { rim: 0.5, kick: 0.3 }), spots.length);
    spots.forEach(([x, z], i) => { const h = 1.1 + R() * 0.7; e.set((R() - 0.5) * 0.08, R() * 6, (R() - 0.5) * 0.08); q.setFromEuler(e); p3.set(x, H(x, z) - 0.1, z); s3.set(h * 0.9, h, h * 0.9); mm.compose(p3, q, s3); tI.setMatrixAt(i, mm); cI.setMatrixAt(i, mm); });
    for (const im of [tI, cI]) { im.castShadow = true; im.receiveShadow = true; scene.add(im); }
    // coconut palms toward the sea
    const palm = (x, z, h) => { const g = new THREE.Group(); g.position.set(x, H(x, z), z); scene.add(g); const pts = []; for (let k = 0; k <= 8; k++) { const f = k / 8; pts.push(V(Math.sin(f * 1.4) * h * 0.18, f * h, 0)); }
      const tr = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.16, 7), toon('#8a6a4c', { rim: 0.4 }), { ink: 0.02 }); g.add(tr); const top = pts[8];
      for (let k = 0; k < 8; k++) { const fr = mesh(new THREE.ConeGeometry(0.45, 3.6, 4, 1, true), toon('#4f8a3c', { rim: 0.5, side: THREE.DoubleSide }), { ink: 0.015 }); fr.scale.set(1, 1, 0.15); fr.geometry.translate(0, 1.8, 0); fr.position.copy(top); fr.rotation.set(0, k * 0.8, 1.15 + (k % 2) * 0.25, 'YXZ'); g.add(fr); }
      for (let k = 0; k < 3; k++) { const nut = mesh(new THREE.SphereGeometry(0.18, 8, 6), toon('#6a4a2a', { rim: 0.4 }), { ink: 0.01 }); nut.position.copy(top).add(V(Math.cos(k * 2) * 0.25, -0.25, Math.sin(k * 2) * 0.25)); g.add(nut); }
      g.rotation.y = R() * 6; };
    for (let i = 0; i < 26; i++) { const x = 40 + R() * 200, z = 60 - R() * 360; palm(x, z, 7 + R() * 4); } palm(14, -26, 8); palm(16.5, -22, 9.5); palm(-15, 18, 8);
    // huts / roadside shacks
    const hut = (x, z, ry, s2 = 1) => { const g = new THREE.Group(); g.position.set(x, H(x, z), z); g.rotation.y = ry; g.scale.setScalar(s2); scene.add(g);
      const w = mesh(new THREE.BoxGeometry(3.2, 2.0, 2.6), toon('#b08a5e', { rim: 0.4 }), { ink: 0.02 }); w.position.y = 1.0; g.add(w);
      const rf = mesh(new THREE.ConeGeometry(2.6, 1.6, 4), toon('#d8bf86', { rim: 0.5 }), { ink: 0.02 }); rf.rotation.y = Math.PI / 4; rf.scale.set(1.15, 1, 0.95); rf.position.y = 2.75; g.add(rf);
      const dr = mesh(new THREE.BoxGeometry(0.8, 1.4, 0.05), toon('#4a3524', { rim: 0.2 }), { cast: false }); dr.position.set(0.4, 0.7, 1.31); g.add(dr);
      const wi = mesh(new THREE.BoxGeometry(0.6, 0.5, 0.05), toon('#2b2622', { rim: 0 }), { cast: false }); wi.position.set(-0.9, 1.25, 1.31); g.add(wi); };
    hut(-30, -24, 0.5); hut(-27, -30, 0.2, 0.8); hut(34, 14, -0.6); hut(-24, 42, 2.4); hut(30, -70, -0.3, 1.2); hut(-40, -95, 0.8);
    // fence along the camp side
    const fm = toon('#8b6a48', { rim: 0.4 }); for (let z = 22; z > -44; z -= 1.8) { const x = -10.5 + Math.sin(z * 0.2) * 0.3; const p = mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.2, 6), fm, { ink: 0.008 }); p.position.set(x, H(x, z) + 0.6, z); p.rotation.z = Math.sin(z) * 0.06; scene.add(p);
      for (const yy of [0.45, 0.95]) { const r2 = mesh(new THREE.BoxGeometry(0.05, 0.06, 1.85), fm, { cast: false }); r2.position.set(x, H(x, z) + yy, z - 0.9); scene.add(r2); } }
    // stacked old sleepers by the line
    const sl2 = toon('#6a5848', { rim: 0.3 }); for (let L2 = 0; L2 < 4; L2++) for (let k = 0; k < 4 - (L2 > 2 ? 1 : 0); k++) { const b2 = mesh(new THREE.BoxGeometry(1.75, 0.16, 0.24), sl2, { ink: 0.006 }); b2.position.set(2.6, 0.08 + L2 * 0.17, -13.5 + k * 0.3 + (L2 % 2) * 0.12); b2.rotation.y = L2 % 2 ? 0.05 : -0.04; scene.add(b2); }
    // water tank on legs + signal box
    const wt = new THREE.Group(); wt.position.set(5.5, 0, -36); scene.add(wt); const tm = toon('#5d7f96', { rim: 0.6 }), lm = toon('#3b3a3c', { rim: 0.5 });
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const lg = mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6), lm, { ink: 0.01 }); lg.position.set(lx * 0.9, 2.25, lz * 0.9); wt.add(lg); }
    const tank = mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.0, 20), tm, { ink: 0.02 }); tank.position.y = 5.4; wt.add(tank); const tc = mesh(new THREE.ConeGeometry(1.5, 0.7, 20), lm, { ink: 0.015 }); tc.position.y = 6.75; wt.add(tc);
    const spout = mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8), lm, { ink: 0.008 }); spout.rotation.z = Math.PI / 2 - 0.4; spout.position.set(-1.9, 4.6, 0); wt.add(spout);
    const sb = new THREE.Group(); sb.position.set(-3.6, 0, -62); scene.add(sb); const sbw = mesh(new THREE.BoxGeometry(2.2, 2.4, 2.0), toon('#ece6da', { rim: 0.4 }), { ink: 0.02 }); sbw.position.y = 1.2; sb.add(sbw);
    const sbr = mesh(new THREE.ConeGeometry(1.8, 0.9, 4), toon('#b2402f', { rim: 0.5 }), { ink: 0.015 }); sbr.rotation.y = Math.PI / 4; sbr.position.y = 2.85; sb.add(sbr);
    const sbwin = mesh(new THREE.BoxGeometry(1.6, 0.6, 0.05), toon('#2b3a4a', { rim: 0.6 }), { cast: false }); sbwin.position.set(0, 1.6, 1.01); sb.add(sbwin);
    // goats and cows grazing
    const beast = (x, z, s2, col, ry) => { const g = new THREE.Group(); g.position.set(x, H(x, z), z); g.rotation.y = ry; g.scale.setScalar(s2); scene.add(g); const m = toon(col, { rim: 0.5 });
      const b2 = mesh(new THREE.SphereGeometry(0.5, 14, 10), m, { ink: 0.02 }); b2.scale.set(0.7, 0.65, 1.3); b2.position.y = 0.9; g.add(b2); const hd = mesh(new THREE.SphereGeometry(0.25, 12, 8), m, { ink: 0.015 }); hd.scale.set(0.8, 0.9, 1.3); hd.position.set(0, 0.85, 0.75); hd.rotation.x = 0.6; g.add(hd);
      for (const [lx, lz] of [[-0.2, -0.4], [0.2, -0.4], [-0.2, 0.4], [0.2, 0.4]]) { const lg = mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.65, 6), m, { ink: 0.01 }); lg.position.set(lx, 0.33, lz); g.add(lg); } };
    [[-21, -10], [-19.5, -13], [-23, -14.5], [-20, -8], [-24, -11]].forEach(([x, z], i) => beast(x, z, 0.55, i % 2 ? '#f2eee6' : '#4a3f36', i * 1.3));
    beast(29, -30, 1.2, '#b9845a', 0.7); beast(32, -26, 1.1, '#e8e2d6', 2.1); beast(-35, 8, 1.15, '#a8744a', 4.0);
    // kites
    W.kites = []; for (const [x, y, z, c1] of [[16, 30, -45, '#d64a3a'], [-26, 38, -80, '#3a8fd6'], [40, 26, 10, '#e6c04a']]) { const k = new THREE.Group(); k.position.set(x, y, z); scene.add(k);
      const dm = mesh(new THREE.PlaneGeometry(1.6, 1.6), toon(c1, { rim: 0.3, side: THREE.DoubleSide }), { cast: false, ink: 0.02 }); dm.rotation.z = Math.PI / 4; dm.scale.y = 1.4; k.add(dm);
      const tail = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, -1.2, 0), V(0.4, -3, 0), V(-0.3, -5, 0), V(0.3, -7, 0)]), new THREE.LineBasicMaterial({ color: '#222' })); k.add(tail);
      const str = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(-x * 0.6, -y * 0.98, -z * 0.3)]), new THREE.LineBasicMaterial({ color: '#555' })); k.add(str); W.kites.push(k); }
    // the sea (+x side, beyond the beach)
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(2600, 4000), toon('#3f8fc2', { rim: 0, kick: 0 })); sea.rotation.x = -Math.PI / 2; sea.position.set(330 + 1300, -0.5, -800); sea.receiveShadow = false; scene.add(sea);
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(14, 4000), new THREE.MeshBasicMaterial({ color: '#f4f7f8', transparent: true, opacity: 0.7 })); surf.rotation.x = -Math.PI / 2; surf.position.set(338, -0.45, -800); scene.add(surf); }
  // ---------- tàu Thống Nhất: D19E diesel (Đường sắt Việt Nam) + 5 passenger coaches; faces +z, nose at local z 4.2 ----------
  const train = new THREE.Group(); scene.add(train); W.train = train;
  { const navy = toon('#1f3f7a', { rim: 0.7, kick: 0.4 }), white = toon('#f1efe8', { rim: 0.5 }), yellow = toon('#f1c232', { rim: 0.6 }), dark = toon('#22252b', { rim: 0.8, kick: 0.4 }), grey = toon('#9ea3aa', { rim: 0.6 }),
      redM = toon('#c8352f', { rim: 0.5 }), glass = toon('#1b2a3a', { rim: 0.9, kick: 0.6 }), roofM = toon('#b9bcc2', { rim: 0.6 });
    const T = (geo, m, x, y, z, o = {}) => { const me = mesh(geo, m, { ink: o.ink ?? 0.014 }); me.position.set(x, y, z); if (o.rx) me.rotation.x = o.rx; if (o.ry) me.rotation.y = o.ry; if (o.rz) me.rotation.z = o.rz; (o.to || train).add(me); return me; };
    const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
    const plane = (t, w, h, x, y, z, ry, to = train) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true })); m.position.set(x, y, z); m.rotation.y = ry; to.add(m); return m; };
    W.wheels = [];
    const bogie = (z, axles, r, to = train, y0 = 0) => { const g = new THREE.Group(); g.position.set(0, y0, z); to.add(g); const L = (axles - 1) * r * 2.3;
      T(new THREE.BoxGeometry(2.2, 0.35, L + r * 2.2), dark, 0, r + 0.15, 0, { to: g, ink: 0.008 });
      for (let k = 0; k < axles; k++) for (const sx of [-1, 1]) { const w = new THREE.Group(); w.position.set(sx * 0.62, r, -L / 2 + k * r * 2.3); g.add(w); w.userData.r = r;
        const d = mesh(new THREE.CylinderGeometry(r, r, 0.1, 22), dark, { ink: 0.006 }); d.rotation.z = Math.PI / 2; w.add(d);
        for (let q = 0; q < 3; q++) { const sp = mesh(new THREE.BoxGeometry(0.03, r * 1.5, 0.06), grey, { cast: false }); sp.position.x = sx * 0.06; sp.rotation.x = q * Math.PI / 3; w.add(sp); }
        const hub = mesh(new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.16, 10), yellow, { ink: 0.004 }); hub.rotation.z = Math.PI / 2; hub.position.x = sx * 0.05; w.add(hub); W.wheels.push(w); }
      for (const sx of [-1, 1]) { T(new THREE.BoxGeometry(0.12, 0.3, L + r * 2.4), dark, sx * 1.05, r + 0.05, 0, { to: g, ink: 0.006 }); for (let k = 0; k < axles; k++) T(new THREE.CylinderGeometry(0.11, 0.11, 0.35, 10), yellow, sx * 1.12, r + 0.25, -L / 2 + k * r * 2.3, { to: g, ink: 0.004 }); }
      return g; };
    // --- D19E locomotive: body z 4.2 → -10.6 ---
    const LZ = -3.2, LL = 14.8;
    T(new RoundedBoxGeometry(2.8, 2.55, LL, 3, 0.18), navy, 0, 2.38, LZ);
    T(new THREE.BoxGeometry(2.86, 0.42, LL - 0.4), white, 0, 2.15, LZ, { ink: 0.006 }); T(new THREE.BoxGeometry(2.88, 0.07, LL - 0.4), redM, 0, 1.9, LZ, { ink: 0 });
    T(new THREE.BoxGeometry(3.0, 0.22, LL + 0.2), dark, 0, 1.0, LZ); T(new RoundedBoxGeometry(2.6, 0.3, LL - 0.6, 2, 0.1), roofM, 0, 3.75, LZ, { ink: 0.01 });
    for (const zz of [-1.2, -4.0, -6.8]) { T(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 20), dark, 0, 3.94, zz, { ink: 0.006 }); for (let q = 0; q < 4; q++) T(new THREE.BoxGeometry(0.85, 0.02, 0.06), grey, 0, 4.01, zz, { ry: q * 0.78, ink: 0 }); }
    T(new THREE.CylinderGeometry(0.18, 0.22, 0.5, 12), dark, 0.5, 4.1, 0.9, { ink: 0.008 }); T(new THREE.CylinderGeometry(0.18, 0.22, 0.5, 12), dark, -0.5, 4.1, 0.9, { ink: 0.008 }); W.stackLocal = V(0, 4.4, 0.9);
    // front cab: yellow nose, raked windscreens, headlights, number plate, horn, handrails, coupler
    T(new RoundedBoxGeometry(2.84, 1.25, 0.6, 3, 0.15), yellow, 0, 1.65, 4.0, { ink: 0.012 });
    const ws = T(new THREE.BoxGeometry(2.5, 1.0, 0.12), glass, 0, 2.95, 4.12, { rx: -0.22, ink: 0.008 }); T(new THREE.BoxGeometry(0.1, 1.05, 0.14), navy, 0, 2.95, 4.14, { rx: -0.22, ink: 0 });
    for (const sx of [-1, 1]) { const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 18), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.6, 2.4) })); hl.rotation.x = Math.PI / 2; hl.position.set(sx * 0.95, 1.7, 4.32); train.add(hl); T(new THREE.TorusGeometry(0.16, 0.03, 6, 18), dark, sx * 0.95, 1.7, 4.32, { ink: 0 });
      const tl = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: '#ff3b2e' })); tl.position.set(sx * 1.25, 1.45, 4.31); train.add(tl);
      T(new THREE.BoxGeometry(0.04, 1.1, 0.04), grey, sx * 1.43, 2.0, 4.1, { ink: 0 }); T(new THREE.BoxGeometry(0.25, 0.5, 0.05), dark, sx * 1.48, 2.85, 3.95, { ry: sx * 0.4, ink: 0.004 }); }
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 18), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 4, 2.8) })); top.rotation.x = Math.PI / 2; top.position.set(0, 3.6, 4.2); train.add(top); W.lamp = top;
    const np = tex(512, 128, g => { g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#1f3f7a'; g.lineWidth = 10; g.strokeRect(5, 5, 502, 118); g.fillStyle = '#1f3f7a'; g.font = 'bold 80px sans-serif'; g.textAlign = 'center'; g.fillText('D19E-959', 256, 94); });
    plane(np, 0.9, 0.23, 0, 2.05, 4.32, 0);
    T(new THREE.CylinderGeometry(0.06, 0.1, 0.35, 10), grey, -0.6, 3.95, 3.4, { rx: Math.PI / 2 + 0.3, ink: 0.004 });
    T(new THREE.BoxGeometry(0.4, 0.3, 0.5), dark, 0, 1.05, 4.45, { ink: 0.006 }); T(new THREE.BoxGeometry(2.6, 0.12, 0.3), dark, 0, 0.75, 4.35, { rx: 0.5, ink: 0.006 });
    // sides: grilles, doors, lettering
    const side = tex(2048, 256, g => { g.clearRect(0, 0, 2048, 256);
      for (let k = 0; k < 7; k++) { const x = 560 + k * 190; g.fillStyle = '#16305e'; g.fillRect(x, 30, 150, 100); g.strokeStyle = '#7f93b8'; g.lineWidth = 3; for (let y = 38; y < 128; y += 10) { g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x + 144, y); g.stroke(); } }
      g.fillStyle = '#16305e'; g.fillRect(60, 22, 120, 190); g.fillStyle = '#1b2a3a'; g.fillRect(200, 30, 170, 95); g.strokeStyle = '#f1efe8'; g.lineWidth = 6; g.strokeRect(200, 30, 170, 95);
      g.fillStyle = '#ffffff'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.fillText('ĐƯỜNG SẮT VIỆT NAM', 1220, 232); g.font = 'bold 40px sans-serif'; g.fillText('D19E-959', 300, 232); });
    for (const sx of [-1, 1]) plane(side, LL - 0.2, 1.85, sx * 1.42, 2.65, LZ, sx * Math.PI / 2);
    bogie(-0.2, 3, 0.5); bogie(-7.4, 3, 0.5);
    for (const sx of [-1, 1]) T(new THREE.BoxGeometry(0.5, 0.55, 3.2), dark, sx * 1.1, 0.75, -3.8, { ink: 0.006 });
    // --- coaches (Thống Nhất): cream upper, blue lower + red stripe, square windows with passengers, doors, gangway, AC units ---
    const coachTex = (n) => tex(2048, 320, g => { g.fillStyle = '#f2efe6'; g.fillRect(0, 0, 2048, 320); g.fillStyle = '#2a5aa8'; g.fillRect(0, 196, 2048, 124); g.fillStyle = '#c8352f'; g.fillRect(0, 186, 2048, 10); g.fillStyle = '#2a5aa8'; g.fillRect(0, 22, 2048, 8);
      for (const dx of [70, 1860]) { g.fillStyle = '#d9d4c6'; g.fillRect(dx, 40, 118, 270); g.strokeStyle = '#555'; g.lineWidth = 5; g.strokeRect(dx, 40, 118, 270); g.fillStyle = '#1b2a3a'; g.fillRect(dx + 22, 60, 74, 90); }
      for (let i = 0; i < 9; i++) { const x = 250 + i * 176; g.fillStyle = '#1b2a3a'; g.fillRect(x, 52, 130, 112); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 8, 58, 30, 100);
        if (i % 4 !== 2) { g.fillStyle = '#f4ede2'; g.beginPath(); g.arc(x + 62 + (i % 2) * 10, 128, 30, 0, 7); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#000'; g.fillRect(x + 52 + (i % 2) * 10, 122, 6, 9); g.fillRect(x + 70 + (i % 2) * 10, 122, 6, 9);
          g.fillStyle = ['#c8352f', '#3f7f9e', '#e0a83a', '#6a8a3c'][i % 4]; g.fillRect(x + 30 + (i % 2) * 10, 158, 64, 8); } }
      g.fillStyle = '#ffffff'; g.font = 'bold 50px sans-serif'; g.textAlign = 'center'; g.fillText('ĐƯỜNG SẮT VIỆT NAM', 860, 270); g.font = 'bold 44px sans-serif'; g.fillText('SE1 · ' + n, 1600, 270); });
    for (let c = 0; c < 5; c++) { const zc = -11.8 - 6.4 - c * 12.8, car = new THREE.Group(); car.position.z = zc; train.add(car); const tx = coachTex(c + 1);
      T(new RoundedBoxGeometry(2.8, 2.7, 12.0, 3, 0.16), toon('#f2efe6', { rim: 0.5 }), 0, 2.3, 0, { to: car });
      for (const sx of [-1, 1]) plane(tx, 11.8, 1.84, sx * 1.415, 2.3, 0, sx * Math.PI / 2, car);
      T(new RoundedBoxGeometry(2.6, 0.25, 11.6, 2, 0.1), roofM, 0, 3.72, 0, { to: car, ink: 0.01 }); for (const zz of [-4, 4]) T(new RoundedBoxGeometry(1.6, 0.35, 1.6, 2, 0.1), grey, 0, 3.98, zz, { to: car, ink: 0.008 });
      T(new THREE.BoxGeometry(2.0, 2.3, 0.8), dark, 0, 2.2, 6.4, { to: car, ink: 0.008 }); T(new THREE.BoxGeometry(2.9, 0.2, 12.0), dark, 0, 0.95, 0, { to: car, ink: 0.006 });
      bogie(-4.3, 2, 0.42, car); bogie(4.3, 2, 0.42, car); }
    // exhaust / dust pools
    W.sparks = []; W.cylSteam = []; { const dm = new THREE.MeshBasicMaterial({ color: '#d9b27a', transparent: true, opacity: 0.6, depthWrite: false }); for (let k = 0; k < 30; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), dm.clone()); p.visible = false; scene.add(p); W.cylSteam.push(p); } }
  }
  // trainAnim(zf, t, speed): nose at zf; wheels turn, slight sway, sand dust kicked up at speed
  W.trainAnim = (zf, t, speed = 10) => { const tr = W.train; tr.visible = true; const k = Math.min(1, speed / 25); tr.position.set(Math.sin(t * 2.1) * 0.02 * k, 0.2 + Math.sin(t * 7) * 0.01 * k, zf - 4.2); tr.rotation.z = Math.sin(t * 1.7) * 0.006 * k;
    W.wheels.forEach(w => { w.rotation.x = zf / w.userData.r; });
    W.cylSteam.forEach((p, i) => { const per = 0.9, ph = ((t + i * per / 30) % per) / per; p.visible = speed > 15; if (!p.visible) return; const sx = i % 2 ? 1 : -1, z0 = zf - 4.2 - 2 - (i % 10) * 7;
      p.position.set(sx * (1.3 + ph * 1.8), 0.25 + ph * 0.8, z0 - ph * 3); p.scale.setScalar(0.5 + ph * 2.2); p.material.opacity = 0.5 * (1 - ph); }); };
  train.traverse(o => { if (o.isMesh) o.castShadow = true; });
  W.puffs = []; { const pm = toon('#5a5650', { rim: 0.6, kick: 0.2 }), pm2 = toon('#3d3a36', { rim: 0.4 }); for (let k = 0; k < 70; k++) { const p = mesh(new THREE.IcosahedronGeometry(1, 2), k % 3 ? pm : pm2, { cast: false }); p.visible = false; scene.add(p); W.puffs.push(p); } }
  // ---------- diagram pieces (shot 9): air dots (sparse) and steel beads (dense) ----------
  W.airDots = []; W.steelDots = [];
  { const am = new THREE.MeshBasicMaterial({ color: '#9fd8ff' }), smt = toon('#d9dde6', { rim: 0.7, kick: 0.4 });
    for (let k = 0; k < 16; k++) { const d = mesh(new THREE.SphereGeometry(0.09, 12, 8), am.clone(), { cast: false }); d.visible = false; scene.add(d); W.airDots.push(d); }
    for (let k = 0; k < 160; k++) { const d = mesh(new THREE.SphereGeometry(0.06, 10, 8), smt.clone(), { cast: false }); d.visible = false; scene.add(d); W.steelDots.push(d); } }
  W.pulse = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 2.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3, 0.8), transparent: true })); W.pulse.visible = false; scene.add(W.pulse);
  W.airRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 2.2, 3.0), transparent: true })); W.airRing.visible = false; scene.add(W.airRing);
  return W;
}
