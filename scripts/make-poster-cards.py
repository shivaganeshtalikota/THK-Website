"""Build the social card for each poster, from the poster's own artwork.

WHY A SEPARATE IMAGE AND NOT THE ARTWORK ITSELF
The artwork is 2048x2560 and 862KB: portrait, and heavy enough that WhatsApp
will decline to render it as a preview. Crawlers want something near 1.91:1 and
comfortably under a few hundred KB. Handing them the poster directly gets either
no preview at all or one cropped by the platform to whatever it felt like.

WHY THE TOP OF THE POSTER
The card is the top 1.91:1 slice rather than the whole poster shrunk into a
letterbox. The headline lives up there, so the slice fills the frame with the
thing a reader actually needs to see — what the campaign is about — instead of a
postage-stamp poster floating in blurred filler. It also keeps the Telugu type
big enough to read at the size a chat app renders a preview.

WHY NO TEXT IS DRAWN HERE
Pillow is built without raqm in this environment, so it cannot shape Telugu:
conjuncts and vowel marks come out reordered or broken. Rather than ship type
that is subtly wrong in a language most readers of this site actually read, the
card draws no text at all. Every word on it is already baked into the artwork,
set correctly by the designer. (The card for a poster somebody has personalised
is made in the BROWSER for the same reason — there the text shapes properly.)

Run: python scripts/make-poster-cards.py
Outputs are committed, in the same way the photo derivatives are.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
POSTERS = ROOT / "public" / "posters"

# 1200x630 is the size every platform documents for a large card, and the size
# the tags declare. Anything else and og:image:width/height start lying.
CARD_W, CARD_H = 1200, 630

# WhatsApp is the binding constraint on weight and the way this audience shares.
TARGET_MAX_BYTES = 260 * 1024


def build_card(src: Path, dest: Path) -> tuple[int, int]:
    im = Image.open(src).convert("RGB")
    w, h = im.size

    # The top 1.91:1 slice, at full width.
    slice_h = round(w * CARD_H / CARD_W)
    if slice_h > h:
        # A poster shorter than the card's aspect: fall back to a centre crop.
        slice_w = round(h * CARD_W / CARD_H)
        left = (w - slice_w) // 2
        box = (left, 0, left + slice_w, h)
    else:
        box = (0, 0, w, slice_h)

    card = im.crop(box).resize((CARD_W, CARD_H), Image.LANCZOS)

    # Walk the quality down only as far as the byte ceiling requires, so a card
    # that fits at high quality keeps it.
    for q in (92, 88, 84, 80, 76, 72):
        card.save(dest, "JPEG", quality=q, optimize=True, progressive=True)
        size = dest.stat().st_size
        if size <= TARGET_MAX_BYTES:
            print(f"  {dest.name}  {CARD_W}x{CARD_H}  {size/1024:.0f}KB  q{q}")
            return size, q
    print(f"  {dest.name}  {CARD_W}x{CARD_H}  {dest.stat().st_size/1024:.0f}KB  q72 (over target)")
    return dest.stat().st_size, 72


def main() -> int:
    if not POSTERS.is_dir():
        print(f"no {POSTERS}", file=sys.stderr)
        return 1

    # Artwork files are <slug>-v<n>.jpg; the version is in the filename because
    # /posters/* is served immutable and a corrected artwork must be a new URL.
    # The card inherits the same version for exactly the same reason.
    pattern = re.compile(r"^(?P<slug>.+)-v(?P<version>\d+)\.jpg$")
    found = 0
    for path in sorted(POSTERS.glob("*.jpg")):
        m = pattern.match(path.name)
        if not m or "-card-" in path.name:
            continue
        slug, version = m.group("slug"), m.group("version")
        dest = POSTERS / f"{slug}-card-v{version}.jpg"
        build_card(path, dest)
        found += 1

    if not found:
        print("no poster artwork matched <slug>-v<n>.jpg", file=sys.stderr)
        return 1
    print(f"{found} card(s) written")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
