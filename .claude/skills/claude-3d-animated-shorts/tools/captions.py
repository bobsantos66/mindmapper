# Word-by-word captions + cards as one transparent overlay (this ffmpeg has no drawtext). Run in the work dir with
#   ~/.local/share/unmark-venv/bin/python captions.py
# cards.json: [{"text","from":"<line id>"|seconds,"plus":0,"to":"<line id>"|"end"|seconds,"toPlus":0,"y":0.16,"size":104,"color":"#ffd400"}]
# The last line (the follow line) gets no word captions when cards.json has a card starting on it.
import json, os, subprocess
from PIL import Image, ImageDraw, ImageFont
T = json.load(open('timing.json')); L = T['lines']; DUR = T['duration']
W, H = 1080, 1920; FONT = os.environ.get('FONT', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'engine', 'film', 'Inter-Black.otf'))
cards = json.load(open('cards.json')) if os.path.exists('cards.json') else []
at = {l['id']: l['start'] for l in L}
def tm(v, plus=0): return (DUR if v == 'end' else at[v] if isinstance(v, str) else float(v)) + (plus or 0)
rgb = lambda c: tuple(int(c.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)) if isinstance(c, str) else tuple(c)
words = [w for l in L for w in l['words']]
items = []
for i, w in enumerate(words):
    t0 = w['t']; t1 = min(words[i + 1]['t'] if i + 1 < len(words) else t0 + 0.8, t0 + 1.2)
    items.append((t0, t1, w['w'].strip('"“”'), float(os.environ.get('CAP_Y', 0.56)), 122, (255, 255, 255)))
for c in cards:
    items.append((tm(c['from'], c.get('plus')), tm(c.get('to', 'end'), c.get('toPlus')), c['text'], c.get('y', 0.16), c.get('size', 104), rgb(c.get('color', '#ffd400'))))
cuts = sorted({0.0, DUR, *[round(x, 3) for it in items for x in it[:2] if x < DUR]})
os.makedirs('cap', exist_ok=True); lines = []; cache = {}
for a, b in zip(cuts, cuts[1:]):
    m = (a + b) / 2; act = tuple(it for it in items if it[0] <= m < it[1])
    if act not in cache:
        im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        for _, _, txt, y, size, fill in act:
            f = ImageFont.truetype(FONT, size)
            while d.textlength(txt, font=f) > W - 120: size -= 4; f = ImageFont.truetype(FONT, size)
            d.text((W / 2, H * y), txt, font=f, fill=fill, anchor='mm', stroke_width=max(6, size // 10), stroke_fill=(0, 0, 0))
        p = f'cap/s{len(cache):03d}.png'; im.save(p); cache[act] = p
    lines += [f"file '{os.path.basename(cache[act])}'", f'duration {b - a:.3f}']
lines.append(f"file '{os.path.basename(cache[act])}'")
open('cap/list.txt', 'w').write('\n'.join(lines) + '\n')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'cap/list.txt', '-vf', 'fps=30,format=rgba', '-c:v', 'png', '-t', f'{DUR:.3f}', 'cap/overlay.mov'], check=True)
print('cap/overlay.mov', len(cache), 'pictures')
