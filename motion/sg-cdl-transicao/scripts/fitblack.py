"""Fit the black squiggle as a round-capped stroke through control points.

Usage: python fitblack.py <slide1.jpg> <shapes.json> <diff.png>
Prints IoU against the visible black pixels and writes the path into shapes.json.
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.optimize import minimize
from scipy import ndimage as ndi

s1, shapes_json, diff_png = sys.argv[1:4]
A = np.asarray(Image.open(s1).convert("RGB")).astype(int)
meta = json.load(open(shapes_json))
pill = meta["layers"]["s1-selo"]

visible = np.ones((1080, 1920), bool)
visible[pill["y"]:pill["y"] + pill["h"], pill["x"]:pill["x"] + pill["w"]] = False
visible[600:] = False
target = (A.sum(2) < 300) & visible
target = ndi.binary_opening(target, iterations=3)  # drop thin pill outline/glyph bits

PTS = np.array([
    (405, 372), (470, 384), (540, 405), (620, 437), (700, 488), (770, 533),
    (830, 552), (890, 530), (925, 450), (950, 330), (975, 200), (1010, 140),
    (1060, 126), (1110, 145), (1160, 196), (1215, 295), (1270, 413), (1320, 486),
    (1370, 512), (1420, 490), (1452, 400), (1478, 265), (1520, 228), (1575, 236),
    (1640, 292), (1720, 381), (1800, 443), (1880, 471), (1960, 484), (2040, 490),
], float)
WIDTH = 67.0


def bezier_segments(P):
    """Catmull-Rom (uniform, tension 1/6) -> cubic Bezier control points."""
    segs = []
    for i in range(len(P) - 1):
        p0 = P[max(i - 1, 0)]; p1 = P[i]; p2 = P[i + 1]; p3 = P[min(i + 2, len(P) - 1)]
        segs.append((p1, p1 + (p2 - p0) / 6, p2 - (p3 - p1) / 6, p2))
    return segs


def sample(segs, n=40):
    t = np.linspace(0, 1, n)[:, None]
    out = []
    for p0, c1, c2, p3 in segs:
        out.append((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * c1 + 3 * (1 - t) * t ** 2 * c2 + t ** 3 * p3)
    return np.vstack(out)


def raster(P, w=WIDTH, scale=1):
    im = Image.new("L", (1920 * scale, 1080 * scale), 0)
    d = ImageDraw.Draw(im)
    pts = sample(bezier_segments(P)) * scale
    r = w / 2 * scale
    d.line([tuple(p) for p in pts], fill=255, width=int(round(w * scale)))
    for x, y in pts:
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    a = np.asarray(im.resize((1920, 1080), Image.BILINEAR)) > 127
    return a


def iou(P, w=WIDTH):
    m = raster(P, w) & visible
    return (m & target).sum() / (m | target).sum()


def loss(flat):
    P = PTS.copy()
    P[:-2] = flat.reshape(-1, 2)  # keep the two off-screen tail points fixed
    return 1 - iou(P)


print("start IoU", round(iou(PTS), 4))
res = minimize(loss, PTS[:-2].ravel(), method="Powell",
               options={"maxiter": 4000, "xtol": 0.5, "ftol": 1e-5})
P = PTS.copy(); P[:-2] = res.x.reshape(-1, 2)
print("fitted IoU", round(iou(P), 4))

segs = bezier_segments(P)
d = f"M{segs[0][0][0]:.1f},{segs[0][0][1]:.1f}" + "".join(
    f" C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p3[0]:.1f},{p3[1]:.1f}" for _, c1, c2, p3 in segs)
meta["shapes"]["tracoPreto"] = d
meta["shapes"]["tracoPretoLargura"] = WIDTH
json.dump(meta, open(shapes_json, "w"), indent=1)

m = raster(P) & visible
vis = np.zeros((1080, 1920, 3), np.uint8)
vis[target & m] = (60, 60, 60)
vis[target & ~m] = (255, 0, 0)      # missed
vis[~target & m] = (0, 140, 255)    # extra
Image.fromarray(vis[60:620]).resize((1440, 420)).save(diff_png)
