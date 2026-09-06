"""
Measures two things the eye is bad at judging and the browser will not tell you:

  1. FOCAL POINTS. Detects faces in every photograph and reports where the
     subject actually sits, so object-position can be set from evidence rather
     than from `50% 50%` and hope. A centre crop is only correct when the
     subject happens to be centred, which is almost never true of press
     photography.

  2. BANNER TEXT CONTRAST. PageHero lays white text over a photograph behind a
     bottom scrim that fades to 0.05 alpha at 78% height. The eyebrow and the
     top of the h1 sit high in that band, where the scrim is weak — so over a
     bright photograph the white text can drop below the WCAG AA threshold.
     This composites the real gradient over the real pixels and computes the
     real contrast ratio, at desktop and at mobile.

Run:  python scripts/audit-images.py
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "public" / "photos"

# --------------------------------------------------------------- WCAG helpers

def _srgb_to_lin(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def rel_luminance(bgr):
    """WCAG relative luminance from a BGR pixel array (…,3) -> (…)."""
    b, g, r = bgr[..., 0], bgr[..., 1], bgr[..., 2]
    rl, gl, bl = _srgb_to_lin(r), _srgb_to_lin(g), _srgb_to_lin(b)
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl


def contrast_with_white(bgr):
    """Contrast ratio of white text against these pixels. 1.0 = invisible."""
    return 1.05 / (rel_luminance(bgr) + 0.05)


# --------------------------------------------------------------- scrim model

# scrim-bottom, from src/styles/index.css. Stops are (height-from-bottom, alpha).
SCRIM_BOTTOM = [(0.00, 0.92), (0.38, 0.55), (0.78, 0.05), (1.00, 0.05)]
SCRIM_INK = np.array([9, 10, 10], dtype=np.float64)  # #0A0A09 in BGR


def scrim_alpha(h, stops=None):
    """
    Alpha of the gradient at fractional height-from-bottom h.

    `stops` defaults to the module global at CALL time, not at definition time
    — a default argument would bind the list once and silently ignore any
    later reassignment, which makes tuning the gradient impossible.
    """
    stops = SCRIM_BOTTOM if stops is None else stops
    for (h0, a0), (h1, a1) in zip(stops, stops[1:]):
        if h0 <= h <= h1:
            t = 0.0 if h1 == h0 else (h - h0) / (h1 - h0)
            return a0 + (a1 - a0) * t
    return stops[-1][1]


def composite_scrim(band):
    """Lay the scrim gradient over a band image, bottom-up."""
    h = band.shape[0]
    out = band.astype(np.float64).copy()
    for y in range(h):
        a = scrim_alpha((h - 1 - y) / max(h - 1, 1))
        out[y] = out[y] * (1 - a) + SCRIM_INK * a
    return out


# --------------------------------------------------------------- face finding

_CASCADES = [
    "haarcascade_frontalface_default.xml",
    "haarcascade_profileface.xml",
]


def find_faces(img):
    grey = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    grey = cv2.equalizeHist(grey)
    boxes = []
    for name in _CASCADES:
        path = Path(cv2.data.haarcascades) / name
        if not path.exists():
            continue
        cc = cv2.CascadeClassifier(str(path))
        found = cc.detectMultiScale(grey, scaleFactor=1.08, minNeighbors=6,
                                    minSize=(max(24, img.shape[1] // 28),) * 2)
        boxes.extend([tuple(int(v) for v in b) for b in found])
    return boxes


def focal_from_faces(img, boxes):
    """
    Weighted centre of the detected faces, as object-position percentages.

    Weighted by area: the biggest face in a press photograph is almost always
    the subject, and small background faces should not drag the crop away from
    him. Biased slightly upward because a crop that clips a chin reads as a
    mistake while one that clips a chest does not.
    """
    if not boxes:
        return None
    H, W = img.shape[:2]
    tot = sum(w * h for _, _, w, h in boxes)
    cx = sum((x + w / 2) * w * h for x, _, w, h in boxes) / tot
    cy = sum((y + h / 2) * w * h for _, y, w, h in boxes) / tot
    return round(100 * cx / W), round(100 * cy / H)


# --------------------------------------------------------------- band cropping

def crop_band(img, box_w, box_h, pos_x=0.5, pos_y=0.5):
    """Reproduce CSS object-fit:cover + object-position for a box."""
    H, W = img.shape[:2]
    scale = max(box_w / W, box_h / H)
    nw, nh = int(round(W * scale)), int(round(H * scale))
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA)
    x = int(round((nw - box_w) * pos_x))
    y = int(round((nh - box_h) * pos_y))
    return resized[y:y + box_h, x:x + box_w]


# --------------------------------------------------------------- text regions

# Where PageHero's text actually sits, as fractions of the band, measured from
# the component: items-end, pb-12 (mobile) / pb-16 (>=640), max-w-3xl, and the
# eyebrow + text-display h1 + text-lead paragraph stack above it.
VIEWPORTS = {
    #  name        band w   band h   text left..right   text top..bottom (from bottom)
    "desktop": (1512, int(0.56 * 950), 0.06, 0.55, 0.12, 0.66),
    "mobile": (375, int(0.46 * 812), 0.05, 0.95, 0.10, 0.72),
}

AA_LARGE = 3.0   # WCAG 2.1 AA for >=24px or >=18.66px bold
AA_SMALL = 4.5   # everything else — the eyebrow and the lead paragraph


def audit_banner(slug, focal):
    img = cv2.imread(str(PHOTOS / f"{slug}.jpg"))
    if img is None:
        return None
    px, py = (focal[0] / 100, focal[1] / 100) if focal else (0.5, 0.5)
    rows = {}
    for vp, (bw, bh, l, r, tb, tt) in VIEWPORTS.items():
        band = crop_band(img, bw, bh, px, py)
        comped = composite_scrim(band)
        x0, x1 = int(bw * l), int(bw * r)
        # convert height-from-bottom fractions into row indices
        y0, y1 = int(bh * (1 - tt)), int(bh * (1 - tb))
        region = comped[y0:y1, x0:x1]
        cr = contrast_with_white(region)
        rows[vp] = {
            "min": round(float(cr.min()), 2),
            "p05": round(float(np.percentile(cr, 5)), 2),
            "mean": round(float(cr.mean()), 2),
            "pct_below_4_5": round(float((cr < AA_SMALL).mean() * 100), 1),
            "pct_below_3": round(float((cr < AA_LARGE).mean() * 100), 1),
        }
    return rows


def main():
    banners = sys.argv[1:] or None
    manifest = {}

    files = sorted(p for p in PHOTOS.glob("*.jpg"))
    print(f"{'slug':<34}{'native':>12}  {'AR':>5}  {'faces':>5}  focal")
    print("-" * 78)
    for f in files:
        img = cv2.imread(str(f))
        if img is None:
            continue
        H, W = img.shape[:2]
        boxes = find_faces(img)
        focal = focal_from_faces(img, boxes)
        manifest[f.stem] = {
            "w": W, "h": H, "ar": round(W / H, 3),
            "faces": len(boxes),
            "focal": focal,
        }
        fs = f"{focal[0]}% {focal[1]}%" if focal else "-- (no face found)"
        print(f"{f.stem:<34}{W:>5}x{H:<6}{W/H:>5.2f}  {len(boxes):>5}  {fs}")

    if banners:
        print("\n\nBANNER TEXT CONTRAST — white text over the scrim, per viewport")
        print("(AA needs 4.5:1 for the eyebrow/lead, 3:1 for the large h1)")
        print("-" * 78)
        for slug in banners:
            focal = manifest.get(slug, {}).get("focal")
            rows = audit_banner(slug, focal)
            if not rows:
                print(f"{slug}: MISSING")
                continue
            print(f"\n{slug}   focal={focal}")
            for vp, r in rows.items():
                verdict = "FAIL" if r["p05"] < AA_SMALL else "pass"
                print(f"   {vp:<8} min={r['min']:<6} p05={r['p05']:<6} mean={r['mean']:<7}"
                      f" below4.5={r['pct_below_4_5']:>5}%  below3={r['pct_below_3']:>5}%  {verdict}")
            manifest[slug]["banner"] = rows

    (ROOT / "scripts" / "image-audit.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    print("\nwrote scripts/image-audit.json")


if __name__ == "__main__":
    main()
