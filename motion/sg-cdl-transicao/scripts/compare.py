"""Compare a rendered frame with the original slide. Usage: compare.py ref.jpg frame.png diff.png"""
import sys
import numpy as np
from PIL import Image
ref = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(int)
img = np.asarray(Image.open(sys.argv[2]).convert("RGB")).astype(int)
d = np.abs(ref - img).max(2)
print(f"{sys.argv[2].split('/')[-1]}: mean diff {d.mean():.2f}, px >40: {(d > 40).sum()}, px >100: {(d > 100).sum()}")
vis = np.clip(d * 3, 0, 255).astype(np.uint8)
Image.fromarray(vis).resize((960, 540)).save(sys.argv[3])
