# python3 tools/sheet.py <dir> <out.jpg> [cols] — contact sheet of still-<t>.jpg sorted by t (row-major), via ffmpeg xstack
import sys, os, subprocess
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 10
fs = sorted([f for f in os.listdir(d) if f.startswith('still-')], key=lambda f: float(f[6:-4]))
print(' '.join(f[6:-4] for f in fs))
w, h = 216, 384; ins = []
for f in fs: ins += ['-i', os.path.join(d, f)]
k = len(fs); lay = '|'.join(f'{(i % cols) * w}_{(i // cols) * h}' for i in range(k))
fc = ''.join(f'[{i}]scale={w}:{h}[v{i}];' for i in range(k)) + ''.join(f'[v{i}]' for i in range(k)) + f'xstack=inputs={k}:layout={lay}:fill=black'
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', fc, '-frames:v', '1', '-q:v', '3', out], check=True)
