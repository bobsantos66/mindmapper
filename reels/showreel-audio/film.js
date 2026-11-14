// Sound-only film: the hit list of the Remotion showreel (frames @ 60 fps -> beats = f / 30 at 120 bpm).
import * as M from './lib/motion.js';
const b = (f) => f / 30;
const HITS = [
  [b(0), 'SG slam', 'impact'],
  ...[0, 1, 2, 3, 4, 5].map((i) => [b(8 - 6 + 8 + i * 3.5), `letter ${i}`, 'blip', { pitch: ['D5', 'F5', 'A5', 'C6', 'D6', 'F6'][i], gain: 0.6 }]),
  [b(52), 'slice whip', 'whoosh', { len: 0.35 }],
  [b(54), 'Quem', 'pop', { pitch: 'D5' }],
  [b(62), 'convence', 'pop', { pitch: 'F5' }],
  [b(74), 'o', 'pop', { pitch: 'A5' }],
  [b(80), 'lojista', 'pop', { pitch: 'C6' }],
  [b(88), 'a', 'pop', { pitch: 'D6' }],
  [b(94), 'ficar', 'pop', { pitch: 'F6' }],
  [b(102), '?', 'thud'],
  [b(146), 'dive into the dot', 'riser', { len: 0.5 }],
  [b(146.5), 'black', 'sub', { len: 0.5 }],
  [b(162), 'pill text', 'type', { n: 12, len: 0.3 }],
  [b(190), 'pill flies home', 'whoosh', { len: 0.3, from: 2400, to: 700 }],
  [b(206), 'sail lands', 'thud'],
  [b(214), 'logo home', 'click'],
  [b(226), 'headline home', 'tick'],
  [b(240), 'headline home 2', 'tick'],
  [b(276), 'MOT FINAL', 'bell', { pitch: 'D6' }],
];
M.film({ hits: HITS, draw(ctx) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, M.W, M.H); } });
