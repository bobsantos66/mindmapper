"""Extract layers from the two slides.

Usage: python extract.py <slide1.jpg> <slide2.jpg> <public_dir> <shapes_json>

Text, logo, footer and arrow become black-with-alpha PNG cutouts (pixel exact).
White loop (slide 1) and yellow ribbon (slide 2) become filled SVG polygons
traced from their masks. Positions are written to the JSON.
"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.measure import find_contours, approximate_polygon
from skimage.morphology import closing, opening, disk

s1, s2, pub, out_json = sys.argv[1:5]
A = np.asarray(Image.open(s1).convert("RGB")).astype(float)
B = np.asarray(Image.open(s2).convert("RGB")).astype(float)
meta = {"layers": {}, "shapes": {}}


def dark_alpha(img, g_bg=241.0):
    a = 1.0 - img[..., 1] / g_bg
    a = np.clip(a, 0, 1)
    a[a < 0.04] = 0
    return a


def bbox_of(mask, pad=6):
    ys, xs = np.nonzero(mask)
    h, w = mask.shape
    return (max(xs.min() - pad, 0), max(ys.min() - pad, 0),
            min(xs.max() + pad + 1, w), min(ys.max() + pad + 1, h))


def save_cut(name, img, region, thresh=0.35, g_bg=241.0, extra_alpha=None):
    x0, y0, x1, y1 = region
    sub = img[y0:y1, x0:x1]
    a = dark_alpha(sub, g_bg)
    bx0, by0, bx1, by1 = bbox_of(a > thresh)
    a = a[by0:by1, bx0:bx1]
    rgba = np.zeros(a.shape + (4,), np.uint8)
    rgba[..., 3] = (a * 255).round().astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(f"{pub}/{name}.png")
    meta["layers"][name] = {"x": int(x0 + bx0), "y": int(y0 + by0),
                            "w": int(bx1 - bx0), "h": int(by1 - by0)}


# ---- slide 1 text
save_cut("s1-vendemos", A, (170, 528, 560, 620))
save_cut("s1-titulo", A, (165, 622, 1620, 800))

# pill: opaque crop (yellow fill hides the black stroke), rounded-rect alpha
row = A[478, :, :].sum(1) < 400
col = A[:, 230, :].sum(1) < 400
left = int(np.argmax(row[150:300])) + 150
right = 1000 - int(np.argmax(row[1000:860:-1]))
top = int(np.argmax(col[430:470])) + 430
bot = 520 - int(np.argmax(col[520:480:-1]))
h = bot - top + 1
crop = A[top - 2:bot + 3, left - 2:right + 3]
H, W = crop.shape[:2]
yy, xx = np.mgrid[0:H, 0:W] + 0.5
r = H / 2
cx = np.clip(xx, r, W - r)
inside = np.clip(r - np.hypot(xx - cx, yy - r) + 0.5, 0, 1)
rgba = np.dstack([crop, inside * 255]).round().astype(np.uint8)
Image.fromarray(rgba, "RGBA").save(f"{pub}/s1-selo.png")
meta["layers"]["s1-selo"] = {"x": left - 2, "y": top - 2, "w": W, "h": H}

# ---- slide 2 lines (split by row projection)
reg = B[270:770, 270:1700]
ink = (dark_alpha(reg, 255.0) > 0.3).sum(1) > 0
runs, start = [], None
for i, v in enumerate(np.append(ink, False)):
    if v and start is None:
        start = i
    if not v and start is not None:
        runs.append((start, i)); start = None
# merge runs separated by tiny gaps (accents / descenders)
merged = []
for r0, r1 in runs:
    if merged and r0 - merged[-1][1] < 8:
        merged[-1] = (merged[-1][0], r1)
    else:
        merged.append((r0, r1))
merged = [m for m in merged if m[1] - m[0] > 20]
assert len(merged) == 5, merged
for i, (r0, r1) in enumerate(merged, 1):
    save_cut(f"s2-linha{i}", B, (270, 270 + r0 - 4, 1700, 270 + r1 + 4), g_bg=255.0)

# ---- shared: logo, footer (black ~35%), arrow (slide 2 only)
save_cut("logo", A, (195, 965, 530, 1045))
save_cut("rodape", A, (532, 995, 1170, 1042), thresh=0.12)
save_cut("seta", B, (1790, 10, 1920, 115), thresh=0.2, g_bg=255.0)


# ---- filled shapes
def repair(c, ink, near=9, ctx=25, smooth=10.0):
    """Replace contour points hidden under ink by a spline through visible ones.

    c: (N,2) closed contour as (y, x) in image coords. A point is trusted when
    no ink lies within `near` px, i.e. both colours of the edge were visible.
    """
    from scipy.interpolate import CubicSpline
    inkd = ndi.binary_dilation(ink, iterations=near)
    yi = np.clip(np.round(c[:, 0]).astype(int), 0, ink.shape[0] - 1)
    xi = np.clip(np.round(c[:, 1]).astype(int), 0, ink.shape[1] - 1)
    bad = inkd[yi, xi]
    if not bad.any() or bad.all():
        return c
    n = len(c)
    out = c.copy()
    # walk runs of bad points (circular)
    start = int(np.argmin(bad))  # a good point
    order = (np.arange(n) + start) % n
    i = 0
    while i < n:
        if not bad[order[i]]:
            i += 1
            continue
        j = i
        while j < n and bad[order[j]]:
            j += 1
        # trusted context on both sides (unwrapped indices)
        before = [k for k in range(i - 1, -n, -1) if not bad[order[k % n]]][:ctx]
        after = [k for k in range(j, j + n) if not bad[order[k % n]]][:ctx]
        idx = np.array(sorted(before) + after, float)
        pts = c[order[idx.astype(int) % n]]
        for dim in (0, 1):
            cs = CubicSpline(idx, pts[:, dim])
            out[order[np.arange(i, j)], dim] = cs(np.arange(i, j))
        i = j
    # soften the rebuilt stretches (and a margin around them) along the contour
    from scipy.ndimage import gaussian_filter1d
    zone = ndi.binary_dilation(bad, iterations=20)
    sm = np.stack([gaussian_filter1d(out[:, d], smooth, mode="wrap") for d in (0, 1)], 1)
    w = gaussian_filter1d(zone.astype(float), 6, mode="wrap")[:, None]
    return out * (1 - w) + sm * w


def poly_path(mask, tol=0.75, ink=None):
    m = np.pad(mask, 1).astype(float)
    m = ndi.gaussian_filter(m, 0.7)
    parts = []
    for c in find_contours(m, 0.5):
        if len(c) < 50:
            continue
        c = c - 1  # undo pad
        if ink is not None:
            c = repair(c, ink)
        c = approximate_polygon(c, tolerance=tol)
        pts = " ".join(f"{x:.1f},{y:.1f}" for y, x in c)
        parts.append("M" + pts.replace(" ", " L") + "Z")
    return " ".join(parts)


def text_ink(img, g_bg):
    # anti-aliased dark ink only (yellow G=241 and white G=255 are excluded)
    return img[..., 1] < 215


# white loop: white pixels + text pixels inside it, closed to fill glyph holes
white = A.min(2) > 235
ink1 = text_ink(A, 255.0) & ~(A.min(2) > 235)
# glyph bites on the edge are bridged by closing; the gaps between letters
# still show where the true edge runs. Then smooth the outline.
cand = np.pad(white, 40, mode="edge")
loop = closing(cand, disk(24))[40:-40, 40:-40]
loop = ndi.gaussian_filter(loop.astype(float), 2.0) > 0.5
loop &= ~((A[..., 2] < 60) & (A[..., 1] > 200))  # never cover pure yellow
loop = opening(loop, disk(6))
lab, n = ndi.label(loop)
sizes = ndi.sum(loop, lab, range(1, n + 1))
loop = lab == (np.argmax(sizes) + 1)
meta["shapes"]["loopBranco"] = poly_path(loop, ink=text_ink(A, 255.0))

# yellow ribbons (slide 2): yellow + footer ink over them
yel = (B[..., 0] > 200) & (B[..., 2] < 90)
ink2 = text_ink(B, 241.0) & ~yel
cand = np.pad(yel, 30, mode="edge")
rib = closing(cand, disk(14))[30:-30, 30:-30]
rib = ndi.gaussian_filter(rib.astype(float), 1.5) > 0.5
rib &= ~(B.min(2) > 235)  # never cover pure white
rib = opening(rib, disk(5))
meta["shapes"]["faixaAmarela"] = poly_path(rib)
Image.fromarray((loop * 255).astype(np.uint8)).save(f"{out_json}.loop.png")
Image.fromarray((rib * 255).astype(np.uint8)).save(f"{out_json}.faixa.png")

json.dump(meta, open(out_json, "w"), indent=1)
for k, v in meta["layers"].items():
    print(k, v)
for k, v in meta["shapes"].items():
    print(k, len(v), "chars")
