"""
Newspaper cuttings -> web images for the /press page.

The office sends cuttings as WhatsApp images and e-paper crops with names like
"WhatsApp Image 2026-09-25 at 10.30.14 AM (1).jpeg" — no use as URLs, and
several MB between them. Each one gets an ASCII slug here (the same slug
src/data/press.js uses) and is written twice:

  public/press/<slug>.jpg        up to 1600px wide, for reading the cutting
  public/press/<slug>-640.webp   a 640px thumbnail for the listing

The source folder is kept out of git (it lives only on the office machine);
the outputs are committed.

Run:  python scripts/process-press.py ["path/to/Images paper cuttings"]
"""

import pathlib
import sys

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "Images paper cuttings"
OUT = ROOT / "public" / "press"

# slug -> source filename. Keep in step with src/data/press.js.
CUTTINGS = {
    "2023-09-14-eenadu-it-employees": "9b9553bc_01-crop--920bc2.jpg.jpeg",
    "2023-09-14-eenadu-it-employees-2": "5a67ff86_11-crop--def76d.jpg.jpeg",
    "2026-01-09-andhra-jyothy-nagaram-divisions": "WhatsApp Image 2026-09-25 at 10.34.34 AM (1).jpeg",
    "2026-01-09-mana-telangana-nagaram-divisions": "WhatsApp Image 2026-09-25 at 10.34.34 AM.jpeg",
    "2026-01-09-vaartha-nagaram-divisions": "WhatsApp Image 2026-09-25 at 10.34.35 AM (1).jpeg",
    "2026-01-09-suryaa-nagaram-divisions": "WhatsApp Image 2026-09-25 at 10.34.35 AM.jpeg",
    "2026-01-17-news24-ntr-bike-rally": "WhatsApp Image 2026-09-25 at 10.33.52 AM.jpeg",
    "2026-03-18-janam-vaartha-jawahar-nagar-dumping-yard": "WhatsApp Image 2026-09-25 at 10.30.14 AM.jpeg",
    "2026-03-27-janam-vaartha-sri-rama-navami": "WhatsApp Image 2026-09-25 at 10.30.14 AM (2).jpeg",
    "2026-04-16-janam-vaartha-nara-lokesh": "WhatsApp Image 2026-09-25 at 10.30.15 AM (2).jpeg",
    "2026-05-16-janam-vaartha-durga-temple-eo": "WhatsApp Image 2026-09-25 at 10.30.16 AM.jpeg",
    "2026-05-27-janam-vaartha-mahanadu": "WhatsApp Image 2026-09-25 at 10.30.16 AM (1).jpeg",
    "2026-08-02-janam-vaartha-shirdi-sai-temple": "WhatsApp Image 2026-09-25 at 10.30.16 AM (2).jpeg",
}

FULL_W = 1600
THUMB_W = 640


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, name in CUTTINGS.items():
        src = SRC / name
        if not src.exists():
            print(f"  MISSING {name}")
            continue
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        full = im if im.width <= FULL_W else im.resize((FULL_W, round(im.height * FULL_W / im.width)), Image.LANCZOS)
        full.save(OUT / f"{slug}.jpg", "JPEG", quality=84, optimize=True, progressive=True)
        tw = min(THUMB_W, im.width)
        thumb = im.resize((tw, round(im.height * tw / im.width)), Image.LANCZOS)
        thumb.save(OUT / f"{slug}-640.webp", "WEBP", quality=80, method=6)
        print(f"  {slug}: {full.width}x{full.height}")


if __name__ == "__main__":
    main()
