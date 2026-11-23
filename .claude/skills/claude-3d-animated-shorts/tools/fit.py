# Speed the voice up to the target length and open a short pause before the end line. Run in the work dir.
#   python3 fit.py [--target 40] [--max 1.3] [--gap 1.2]
# in: voice_raw.mp3 + timing_raw.json   out: voice.wav + timing.json (same shape, times on the new audio)
# The pause before the LAST line (the follow line) lets the cliff-hanger shot play out. Tempo never goes above --max:
# if the text is still too long at --max, the script is too long: cut words, do not speed further.
import json, subprocess, argparse
ap = argparse.ArgumentParser(); ap.add_argument('--target', type=float, default=40); ap.add_argument('--max', type=float, default=1.3); ap.add_argument('--gap', type=float, default=1.2)
a = ap.parse_args()
T = json.load(open('timing_raw.json')); L = T['lines']; LEAD = 0.3; NL = 0.15; GAP = a.gap
speech = L[-1]['end'] - LEAD
A = max(1.0, min(a.max, speech / max(1, a.target - GAP - NL - 0.6)))
cut = (L[-2]['end'] + L[-1]['start']) / 2 - LEAD
f = lambda t: (t - LEAD) / A + NL
fc = (f"[0:a]atempo={A:.4f},asplit[a][b];[a]atrim=0:{cut/A:.3f},asetpts=PTS-STARTPTS[p1];"
      f"[b]atrim={cut/A:.3f},asetpts=PTS-STARTPTS[p2];anullsrc=r=44100:cl=mono,atrim=0:{GAP}[g];"
      f"[p1][g][p2]concat=n=3:v=0:a=1,adelay={int(NL*1000)}:all=1[o]")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'voice_raw.mp3', '-filter_complex', fc, '-map', '[o]', '-ar', '44100', '-ac', '1', 'voice.wav'], check=True)
n = len(L)
for i, l in enumerate(L):
    g = GAP if i == n - 1 else 0
    l['start'] = round(f(l['start']) + g, 3); l['end'] = round(f(l['end']) + g, 3)
    for w in l['words']: w['t'] = round(f(w['t']) + g, 3)
T['duration'] = round(L[-1]['end'] + 0.5, 2); T['tempo'] = round(A, 3); T['gapBeforeEnd'] = GAP
json.dump(T, open('timing.json', 'w'), ensure_ascii=False, indent=1)
for l in L: print(f"{l['id']}: {l['start']:.2f}-{l['end']:.2f} {l['text']}")
print(f"tempo x{A:.2f}  duration {T['duration']}s" + ('  !! still over target: cut words' if T['duration'] > a.target + 2 else ''))
