// Voice + word timings: ElevenLabs /with-timestamps, one call. Run in the work dir: node tts.mjs
// in: script.json {lines:[{id,vo}]}  out: voice_raw.mp3 + timing_raw.json ({duration, lines:[{id,text,start,end,words:[{w,t}]}]})
// env: VOICE (default Ninh Đôn), SPEED (0.7–1.2, default 1.2), MODEL (default eleven_v3)
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const KEY = process.env.ELEVENLABS_API_KEY || readFileSync(join(process.env.HOME, '.config/elevenlabs/key'), 'utf8').trim();   // env first
const VOICE = process.env.VOICE || 'aN7cv9yXNrfIR87bDmyD';
const S = JSON.parse(readFileSync('script.json', 'utf8')).lines;
const LINES = S.map((l) => l.vo), LEAD = 0.3, text = LINES.join(' ');
const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
  method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text, model_id: process.env.MODEL || 'eleven_v3', language_code: process.env.LANG_CODE || 'vi', voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: Number(process.env.SPEED || 1.2) } }) });
if (!r.ok) { console.error('ElevenLabs', r.status, (await r.text()).slice(0, 200)); process.exit(1); }
const j = await r.json();
writeFileSync('voice_raw.mp3', Buffer.from(j.audio_base64, 'base64'));
const st = j.alignment.character_start_times_seconds, en = j.alignment.character_end_times_seconds;
let pos = 0; const lines = [];
S.forEach((l) => {
  const i0 = text.indexOf(l.vo, pos), i1 = i0 + l.vo.length; pos = i1;
  const words = []; let k = i0;
  for (const w of l.vo.split(' ')) { const wi = text.indexOf(w, k); words.push({ w, t: +(st[wi] + LEAD).toFixed(3) }); k = wi + w.length; }
  lines.push({ id: l.id, text: l.vo, start: +(st[i0] + LEAD).toFixed(3), end: +(en[i1 - 1] + LEAD).toFixed(3), words });
});
const duration = +(en[en.length - 1] + LEAD + 0.6).toFixed(3);
writeFileSync('timing_raw.json', JSON.stringify({ duration, lines }, null, 1));
console.log(lines.map((l) => `${l.id}: ${l.start.toFixed(2)}-${l.end.toFixed(2)} ${l.text}`).join('\n'), '\nraw duration', duration);
