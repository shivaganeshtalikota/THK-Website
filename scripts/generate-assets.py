"""
Generates the social preview card and favicon set into public/.

WHY: the project referenced /og-image.jpg, /favicon.svg, /apple-touch-icon.png
and the android-chrome icons, but none of those files existed. The missing
og-image is why sharing the link in WhatsApp produced a preview with no image.

These are BRANDED TYPOGRAPHIC assets, not photographs. Once a real approved
photograph of Hari Krishna Talikota is available, regenerate the OG card with
the portrait composited in — see PHOTO_SLOT below.

Run:  python scripts/generate-assets.py
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public"
OUT.mkdir(exist_ok=True)

# Font directory, in order: $THK_FONT_DIR, then the platform default.
# Hardcoding C:/Windows/Fonts made this script Windows-only, so it failed on
# macOS, Linux and CI.
_DEFAULT_FONT_DIRS = {
    "win32": [Path("C:/Windows/Fonts")],
    "darwin": [Path("/Library/Fonts"), Path.home() / "Library/Fonts", Path("/System/Library/Fonts")],
}
_LINUX_DIRS = [
    Path("/usr/share/fonts/truetype/montserrat"),
    Path("/usr/share/fonts/truetype"),
    Path("/usr/share/fonts"),
    Path.home() / ".fonts",
]


def _font_dirs():
    override = os.environ.get("THK_FONT_DIR")
    if override:
        return [Path(override)]
    return _DEFAULT_FONT_DIRS.get(sys.platform, _LINUX_DIRS)
BRAND = (255, 215, 0)      # TDP yellow
BRAND_DK = (201, 154, 0)
INK = (18, 22, 27)
INK_SOFT = (69, 77, 89)
WHITE = (255, 255, 255)


def font(name, size):
    """Find `name` in any candidate font dir, searching subdirectories."""
    for base in _font_dirs():
        if not base.exists():
            continue
        direct = base / name
        if direct.exists():
            return ImageFont.truetype(str(direct), size)
        for found in base.rglob(name):
            return ImageFont.truetype(str(found), size)
    raise SystemExit(
        f"Font '{name}' not found in {[str(p) for p in _font_dirs()]}.\n"
        "Install the Montserrat family, or point THK_FONT_DIR at a directory "
        "containing it:  THK_FONT_DIR=/path/to/fonts python scripts/generate-assets.py"
    )


def track(draw, xy, text, f, fill, spacing):
    """Draw text with manual letter-spacing (PIL has no tracking)."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=f, fill=fill)
        x += draw.textlength(ch, font=f) + spacing
    return x


# ---------------------------------------------------------------- OG card
def make_og():
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BRAND)
    d = ImageDraw.Draw(img)

    # Right panel — dark ink block carrying the monogram.
    PANEL = 400
    d.rectangle([W - PANEL, 0, W, H], fill=INK)

    # Soft depth in the yellow field.
    glow = Image.new("RGB", (W, H), BRAND)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-160, -220, 520, 320], fill=(255, 233, 120))
    gd.ellipse([120, 380, 900, 940], fill=(240, 198, 20))
    img.paste(Image.blend(img, glow, 0.5).crop([0, 0, W - PANEL, H]), (0, 0))
    d = ImageDraw.Draw(img)

    # Real portrait in the right panel. This is what makes the WhatsApp /
    # Facebook link preview show his face rather than a monogram.
    portrait = ROOT / "public" / "photos" / "hero-addressing-995.webp"
    if portrait.exists():
        p = Image.open(portrait).convert("RGB")
        # centering y=0.18 keeps his face high in the tall panel rather than
        # cropping to the lectern
        p = ImageOps.fit(p, (PANEL, H), Image.LANCZOS, centering=(0.5, 0.18))
        img.paste(p, (W - PANEL, 0))
        # Scrim along the inner edge so the panel meets the yellow field cleanly.
        scrim = Image.new("L", (90, H), 0)
        ImageDraw.Draw(scrim).rectangle([0, 0, 90, H], fill=0)
        for x in range(90):
            ImageDraw.Draw(scrim).line([(x, 0), (x, H)], fill=int(150 * (1 - x / 90)))
        img.paste(Image.new("RGB", (90, H), INK), (W - PANEL, 0), scrim)
    else:
        mono = font("Montserrat-ExtraBold.ttf", 150)
        mw = d.textlength("HKT", font=mono)
        d.text((W - PANEL + (PANEL - mw) / 2, H / 2 - 118), "HKT", font=mono, fill=(255, 215, 0))
        print("  (no portrait found — monogram fallback used)")

    # Vertical accent rule between fields.
    d.rectangle([W - PANEL - 8, 0, W - PANEL, H], fill=BRAND_DK)

    x = 78
    # Eyebrow
    track(d, (x, 92), "VIJAYAWADA  ·  TELANGANA", font("Montserrat-Bold.ttf", 21), (120, 92, 0), 4.2)

    # Name — the hero element, sized to stay legible in a WhatsApp thumbnail.
    d.text((x - 4, 150), "HARI KRISHNA", font=font("Montserrat-ExtraBold.ttf", 82), fill=INK)
    d.text((x - 4, 240), "TALIKOTA", font=font("Montserrat-ExtraBold.ttf", 82), fill=INK)

    # Rule
    d.rectangle([x, 358, x + 92, 366], fill=INK)

    # Roles. The temple board seat is the more widely recognised position and
    # the one people actually search for, so it leads.
    d.text((x, 396), "Board Member", font=font("Montserrat-Bold.ttf", 32), fill=INK)
    d.text((x, 436), "Sri Kanaka Durga Devasthanam, Indrakeeladri",
           font=font("Montserrat-SemiBold.ttf", 26), fill=INK)
    d.text((x, 478), "iTDP Telangana State President  ·  Telugu Desam Party",
           font=font("Montserrat-Medium.ttf", 21), fill=(92, 74, 12))

    # Footer strip
    d.rectangle([0, H - 62, W - PANEL - 8, H], fill=INK)
    track(d, (x, H - 44), "HARIKRISHNATALIKOTA.COM",
          font("Montserrat-Bold.ttf", 17), BRAND, 3.4)

    img.save(OUT / "og-image.png", "PNG", optimize=True)
    # Some older WhatsApp/Android clients prefer JPEG; ship both.
    img.save(OUT / "og-image.jpg", "JPEG", quality=90, optimize=True)
    print(f"  og-image.png / .jpg  {W}x{H}")


# ---------------------------------------------------------------- Favicons
# The Telugu Desam Party emblem — the gear, plough and house of the party flag,
# taken from the party's own site (telugudesam.org) and vendored so the build
# needs no network and the file is served same-origin (the CSP is
# `img-src 'self'`, so a hotlinked mark would not render at all).
#
# Deliberately NOT the cycle. The cycle is the Election Commission ballot
# symbol; this is the party's own emblem, and it is what the office asked for.
TDP_EMBLEM = ROOT / "public" / "tdp-emblem.png"
TDP_YELLOW = (253, 216, 0)


def make_icons():
    """
    Browser-tab icon: the Telugu Desam Party emblem on party yellow.

    The first version of this was a tight crop of his face. A photograph cannot
    survive a 16px tab — the head landed in roughly nine pixels and read as a
    brown smudge, indistinguishable from any other photo favicon. A flat
    two-colour emblem with a hard silhouette is the opposite, and it matches the
    site's yellow header so the tab and the page read as one thing.
    """
    S = 512
    em = Image.open(TDP_EMBLEM).convert("RGBA")

    # Trim the transparent margin so the artwork, not its padding, is what gets
    # scaled — the source carries roughly 6% dead space on each side.
    box = em.split()[3].getbbox()
    if box:
        em = em.crop(box)

    # Square it without distorting: pad the shorter axis rather than stretch.
    side = max(em.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(em, ((side - em.width) // 2, (side - em.height) // 2), em)

    # Full-bleed ground rather than a rounded tile: browsers, launchers and
    # bookmark bars all apply their own masking, and a tile inside a tile loses
    # size twice.
    img = Image.new("RGBA", (S, S), TDP_YELLOW + (255,))
    art = int(S * 0.88)
    sq = sq.resize((art, art), Image.LANCZOS)
    img.paste(sq, ((S - art) // 2, (S - art) // 2), sq)

    img.save(OUT / "android-chrome-512x512.png", "PNG", optimize=True)
    img.convert("RGB").save(OUT / "favicon-512.png", "PNG", optimize=True)

    # Maskable variant: Android crops these to a circle, so the artwork has to
    # sit inside the inner 80% safe zone. At 88% the emblem would lose its edges.
    mask = Image.new("RGBA", (S, S), TDP_YELLOW + (255,))
    mart = int(S * 0.60)
    ms = sq.resize((mart, mart), Image.LANCZOS)
    mask.paste(ms, ((S - mart) // 2, (S - mart) // 2), ms)
    mask.save(OUT / "android-chrome-maskable-512x512.png", "PNG", optimize=True)
    print("  android-chrome-maskable-512x512.png")

    for size, name in [
        (192, "android-chrome-192x192.png"),
        (32, "favicon-32x32.png"),
        (16, "favicon-16x16.png"),
    ]:
        img.resize((size, size), Image.LANCZOS).save(OUT / name, "PNG", optimize=True)
        print(f"  {name}")

    # apple-touch-icon must be opaque — iOS composites alpha onto black.
    apple = Image.new("RGB", (180, 180), TDP_YELLOW)
    small = img.resize((180, 180), Image.LANCZOS)
    apple.paste(small, (0, 0), small)
    apple.save(OUT / "apple-touch-icon.png", "PNG", optimize=True)
    print("  apple-touch-icon.png")

    # 16/32/48 only. The original carried a 256px frame too, which is why it
    # weighed 124KB — for an image the browser draws at 16 pixels.
    img.resize((48, 48), Image.LANCZOS).save(
        OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("  favicon.ico  (16/32/48)")
    print("  favicon-512.png")


if __name__ == "__main__":
    print("Generating branded assets into public/ …")
    make_og()
    make_icons()
    print("Done.")
