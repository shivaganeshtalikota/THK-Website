"""
Turns the raw photo drop in photos-source/original-drop/ into web-ready assets.

WHY
The originals arrived with Telugu filenames. Those are meaningful (they are the
post captions, preserved in photos.js as real alt text) but they are unusable as
URLs — they percent-encode into 200+ character monsters that break sharing,
logging and some CDNs. So each photo gets an ASCII slug here and the Telugu is
kept as data.

The originals are 100-500KB JPEGs up to 2048px. This emits WebP at four widths
plus a JPEG fallback, so the browser downloads roughly what it needs.

NOTE ON THE AMARAVATI PHOTOGRAPH
It carried a visible "AI-generated content" badge in the bottom-left corner.
The office confirmed this is Samsung Galaxy's on-device photo *enhancement*
watermark — Samsung stamps that badge on any image its AI touches, including a
straightforward enhancement — not a synthetic image. It is a genuine
photograph, so it is published, with ~6% trimmed off the bottom to remove the
badge (see CROPS).

EXCLUDED — read before adding anything back:
  * "మా బాబు గారిని" is a designed poster (a Krishna graphic composited over a
    photograph), not documentary photography. Kept out of the gallery so the
    gallery stays photographs.

Run:  python scripts/process-photos.py
"""

import json
import pathlib

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "photos-source" / "original-drop"
OUT = ROOT / "public" / "photos"

WIDTHS = [480, 768, 1200, 1800]
FALLBACK_W = 1200

# Fixed pixel crops taken from a source image before resizing, keyed by slug.
# The greeting photograph is the only frame with a clean, well-lit, front-facing
# view of him, so the hero portrait is cut from it. The box is (left, top,
# right, bottom) in the ORIGINAL image's pixels, chosen to exclude the security
# officer and the stray hand at the edges.
CROPS = {
    "portrait-headshot": (959, 297, 1580, 1125),   # 3:4 head and shoulders
    # The podium frame at 4:3, keeping almost the full 3:2 original rather than
    # punching in. The earlier 3:4 crop was far too tight — it read as a zoomed
    # face rather than a leader at a lectern.
    "hero-addressing": (114, 0, 1934, 1365),
    # The Galaxy enhancement badge sits in the bottom-left corner of this frame.
    # Trimming ~6% off the bottom removes it while keeping the subjects intact.
    "amaravati-cm-meeting": (0, 0, 2048, 1283),
}

# slug -> (source filename, role, english caption, telugu original)
PHOTOS = [
    (
        "tdp-44-anniversary",
        "tdp-44-anniversary.jpg",
        "gallery",
        "Talikota Hari Krishna at the Telugu Desam Party 44th anniversary celebration",
        None,
    ),
    (
        "hero-addressing",
        "addressing-itdp-telangana.jpg",
        "portrait",
        "Talikota Hari Krishna addressing an iTDP Telangana party meeting",
        None,
    ),
    (
        "portrait-headshot",
        "with-party-leadership.jpg",
        "portrait",
        "Talikota Hari Krishna, iTDP Telangana State President",
        None,
    ),
    (
        "addressing-itdp-telangana",
        "addressing-itdp-telangana.jpg",
        "political",
        "Talikota Hari Krishna addressing an iTDP Telangana party meeting",
        None,
    ),
    (
        "with-chandrababu-naidu",
        "with-chandrababu-naidu.jpg",
        "gallery",
        "Talikota Hari Krishna welcoming TDP National President N. Chandrababu Naidu",
        None,
    ),
    (
        "with-nara-lokesh",
        "with-nara-lokesh.jpg",
        "gallery",
        "Talikota Hari Krishna with TDP National Working President Nara Lokesh",
        None,
    ),
    (
        "with-chandrababu-naidu-portrait",
        "with-chandrababu-naidu-portrait.jpg",
        "about",
        "Talikota Hari Krishna with TDP National President N. Chandrababu Naidu",
        None,
    ),
    (
        "greeting-chandrababu-naidu",
        "greeting-chandrababu-naidu.jpg",
        "gallery",
        "Talikota Hari Krishna greeting TDP National President N. Chandrababu Naidu",
        None,
    ),
    (
        "with-party-leadership",
        "with-party-leadership.jpg",
        "gallery",
        "Talikota Hari Krishna with TDP National President N. Chandrababu Naidu",
        None,
    ),
    (
        "bonalu-bangaru-bonam",
        "bonalu-bangaru-bonam.jpg",
        "community",
        "Talikota Hari Krishna carrying the bonam during the Sri Bhagyanagar Mahankali Bonalu Jatara procession",
        "ఈరోజు తెలంగాణ ఖ్యాతిని దేశ నలుమూలలా చాటిచెప్పేలా, శ్రీ భాగ్యనగర్ మహంకాళి బోనాల జాతర ఉమ్మడి దేవాలయాల ఊరేగింపు కమిటీ ఆధ్వర్యంలో, విజయవాడ శ్రీ కనకదుర్గ అమ్మవారికి బంగారు బోనం సమర్పణ",
    ),
    (
        "kuchipudi-natya-kshetram",
        "kuchipudi-natya-kshetram.jpg",
        "gallery",
        "Kuchipudi dancers at the Shravana Maasa Nrityotsavam, Sri Datta Kuchipudi Natya Kshetram, Begumpet",
        "నిన్న శ్రీ దత్త కూచిపూడి నాట్య కళాక్షేత్రం, బేగంపేట, తెలంగాణ వారి ఆధ్వర్యంలో నిర్వహించిన శ్రావణమాస నాట్యోత్సవం కార్యక్రమంలో పాల్గొనడం ఎంతో ఆనందంగా ఉంది.",
    ),
    (
        "kuchipudi-natyotsavam-stage",
        "kuchipudi-natyotsavam-stage.jpg",
        "gallery",
        "Talikota Hari Krishna with performers at the Shravana Maasa Nrityotsavam dance festival",
        "శ్రావణమాస నాట్యోత్సవం, శ్రీ దత్త కూచిపూడి నాట్య కళాక్షేత్రం, బేగంపేట",
    ),
    (
        "jonnawada-kamakshi-thayi",
        "jonnawada-kamakshi-thayi.jpg",
        "gallery",
        "Talikota Hari Krishna carrying offerings at Sri Kamakshi Thayi temple, Jonnawada",
        "జొన్నవాడ కామాక్షి తాయి",
    ),
    (
        "medchal-constituency-meeting",
        "medchal-constituency-meeting.jpg",
        "gallery",
        "Talikota Hari Krishna speaking at an opinion-gathering programme in Medchal constituency",
        "ఈరోజు మేడ్చల్ నియోజకవర్గం లో నిర్వహించిన అభిప్రాయ సేకరణ కార్యక్రమంలో పాల్గొనడం జరిగింది.",
    ),
    (
        "medchal-constituency-dais",
        "medchal-constituency-dais.jpg",
        "gallery",
        "Opinion-gathering programme in Medchal constituency",
        "మేడ్చల్ నియోజకవర్గం అభిప్రాయ సేకరణ కార్యక్రమం",
    ),
    (
        "endowments-minister-anam",
        "endowments-minister-anam.jpg",
        "gallery",
        "Talikota Hari Krishna paying a courtesy call on Endowments Minister Anam Ramanarayana Reddy",
        "దేవాదాయ శాఖ మంత్రి ఆనం రామనారాయణరెడ్డి గారిని వారి స్వగృహంలో మర్యాదపూర్వకంగా కలవడం జరిగింది.",
    ),
    (
        "with-nandamuri-balakrishna",
        "with-nandamuri-balakrishna.jpg",
        "gallery",
        "Talikota Hari Krishna with Nandamuri Balakrishna, Hindupur MLA, beneath a portrait of N.T. Rama Rao",
        "పద్మభూషణ్ పురస్కారానికి ఎంపికైన నందమూరి బాలకృష్ణ గారికి హృదయపూర్వక శుభాకాంక్షలు.",
    ),
    (
        "mahanadu-2025",
        "mahanadu-2025.jpg",
        "gallery",
        "Delegate registration at TDP Mahanadu 2025",
        "మహానాడు 2025 ప్రతినిధుల నమోదు",
    ),
    (
        "ntr-anniversary-tribute",
        "ntr-anniversary-tribute.jpg",
        "gallery",
        "TDP workers paying tribute at an N.T. Rama Rao statue during the party's 40th anniversary",
        "40 వసంతాల పండుగ",
    ),
    (
        "amaravati-cm-meeting",
        "EXCLUDED-ai-watermarked-amaravati.jpg",
        "gallery",
        "Talikota Hari Krishna and family meeting Chief Minister N. Chandrababu Naidu in Amaravati",
        "నిన్న అమరావతిలో ముఖ్యమంత్రి శ్రీ నారా చంద్రబాబు నాయుడు గారిని కుటుంబసమేతంగా కలిసి కృతజ్ఞతలు తెలియజేయడం జరిగింది.",
    ),
    (
        "csr-summit-hyderabad",
        "csr-summit-hyderabad.jpg",
        "gallery",
        "Talikota Hari Krishna with Narasaraopet MLA Chadalavada Aravind Babu at the CSR Summit, Hyderabad",
        None,
    ),
]

# Deliberately NOT published. Do not move these into PHOTOS without reading why.
EXCLUDED = {
    "EXCLUDED-composite-poster-maa-babu.jpg": (
        "Composite poster — a Krishna graphic overlaid on a photograph. It is "
        "design work, not documentary photography, so it does not belong in a "
        "gallery presented as event photos."
    ),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    manifest = []
    for slug, filename, role, alt, telugu in PHOTOS:
        src = SRC / filename
        if not src.exists():
            print(f"  !! MISSING {filename}")
            continue

        im = Image.open(src)
        im = ImageOps.exif_transpose(im).convert("RGB")
        if slug in CROPS:
            im = im.crop(CROPS[slug])
        w, h = im.size

        # Always include the source's own width, so a small original (e.g. a
        # tight crop) still has a 1x/2x-sharp variant instead of only the
        # nearest smaller step, which looks soft on high-DPI screens.
        targets = sorted({t for t in WIDTHS if t <= w} | {w})
        sources = []
        for target in targets:
            ratio = target / w
            resized = im.resize((target, max(1, round(h * ratio))), Image.LANCZOS)
            wp = OUT / f"{slug}-{target}.webp"
            # Quality by width, not one figure for everything.
            #
            # The 480 and 768 variants are what phones fetch, and a phone is
            # both the slowest connection and the display where compression is
            # hardest to see: a 768px file is painted into roughly 390 CSS
            # pixels on a 2x screen, so the artefacts land below the pixel
            # grid. Measured on three representative photographs, q80 holds
            # PSNR at 41.1 dB against the q82 original -- above the 40 dB line
            # where a difference stops being visible -- and takes 182 KB off
            # the mobile payload, which is what PageSpeed was reporting.
            #
            # The wide variants stay at 82. They are viewed large on a desktop
            # where the same artefacts would be plain, and desktop already
            # scores 100.
            quality = 80 if target <= 768 else 82
            resized.save(wp, "WEBP", quality=quality, method=6)
            sources.append({"w": target, "kb": round(wp.stat().st_size / 1024)})

        # JPEG fallback for anything that cannot take WebP.
        fw = min(FALLBACK_W, w)
        fb = im.resize((fw, max(1, round(h * fw / w))), Image.LANCZOS)
        fb.save(OUT / f"{slug}.jpg", "JPEG", quality=84, optimize=True, progressive=True)

        manifest.append(
            {
                "slug": slug,
                "role": role,
                "alt": alt,
                "telugu": telugu,
                "width": w,
                "height": h,
                "aspect": round(w / h, 4),
                "widths": [s["w"] for s in sources],
            }
        )
        total = sum(s["kb"] for s in sources)
        print(f"  {slug:34} {w}x{h}  ->  {len(sources)} webp ({total}KB) + jpg")


    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    print(f"\n  {len(manifest)} photos processed -> public/photos/")
    print(f"  {len(EXCLUDED)} excluded:")
    for name, why in EXCLUDED.items():
        print(f"    - {why}")


if __name__ == "__main__":
    main()
