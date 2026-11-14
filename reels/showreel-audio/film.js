// Sound-only film for the Remotion showreel: movement and impact sounds only (no music, no bells,
// no pitched tones). Frames @ 60 fps -> beats = f / 30 on the 120 bpm grid in beats.json.
import * as M from './lib/motion.js';
const b = (f) => f / 30;
const BOUNCES = [13.7, 28.1, 36.9];   // ball wall hits (Showreel.tsx BOUNCES)
const LAND = 52, SLICE = 86, HEAD = 94, DIVE = 170, PILL_TEXT = 182, PILL_HOME = 204, SAIL = 206, LOGO_HOME = 220, HEAD_HOME = 230, FINAL = 280;
const HITS = [
  [b(2), 'ball enters', 'whoosh', { len: 0.25, from: 500, to: 2600, pan: -0.6 }],
  [b(BOUNCES[0]), 'ball hits bottom', 'thud', { pitch: 150, to: 60, pan: -0.2 }],
  [b(BOUNCES[1]), 'ball hits top', 'thud', { pitch: 170, to: 70, pan: 0.2 }],
  [b(BOUNCES[2]), 'ball hits right', 'thud', { pitch: 160, to: 65, pan: 0.8 }],
  [b(46), 'ball flies to centre', 'whoosh', { len: 0.3, from: 2400, to: 600, pan: 0.3 }],
  [b(LAND), 'ball lands', 'thud+sub', { len: 0.35 }],
  [b(LAND + 8), 'letters rise', 'whoosh', { len: 0.25, from: 900, to: 3000, gain: 0.6 }],
  [b(SLICE + 7), 'slice whip', 'whoosh', { len: 0.3 }],
  [b(HEAD + 2), 'camera pulls out', 'whoosh', { len: 0.5, from: 3000, to: 500, gain: 0.7 }],
  [b(139), '?', 'thud'],
  [b(DIVE), 'dive into the dot', 'whoosh', { len: 0.45, from: 400, to: 3200 }],
  [b(DIVE + 2), 'black', 'sub', { len: 0.45 }],
  [b(PILL_TEXT + 4), 'pill text', 'whoosh', { len: 0.2, from: 1500, to: 4000, gain: 0.5 }],
  [b(PILL_HOME + 4), 'pill flies home', 'whoosh', { len: 0.3, from: 2400, to: 700 }],
  [b(SAIL + 16), 'sail lands', 'thud'],
  [b(LOGO_HOME + 6), 'logo home', 'thud', { pitch: 200, to: 90, gain: 0.5 }],
  [b(HEAD_HOME + 4), 'headline home', 'whoosh', { len: 0.25, from: 800, to: 2500, gain: 0.5 }],
  [b(FINAL + 4), 'MOT FINAL settles', 'thud+sub', { len: 0.5 }],
];
M.film({ hits: HITS, draw(ctx) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, M.W, M.H); } });
