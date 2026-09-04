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

EXCLUDED — read before adding anything back:
  * The Amaravati family photo carries a visible "AI-generated content"
    watermark burned into the pixels. Publishing a synthetic image as a real
    meeting with the Chief Minister on a politician's official site is a
    liability, so it is not processed. See EXCLUDED below.
  * "మా బాబు గారిని" is a designed poster (a Krishna graphic composited over a
    photograph), not documentary photography. Kept out of the news gallery so
    the gallery stays photographs.

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
}

# slug -> (source filename, role, english caption, telugu original)
PHOTOS = [
    (
        "tdp-44-anniversary",
        "tdp-44-anniversary.jpg",
        "gallery",
        "Hari Krishna Talikota at the Telugu Desam Party 44th anniversary celebration",
        None,
    ),
    (
        "portrait-headshot",
        "with-party-leadership.jpg",
        "portrait",
        "Hari Krishna Talikota, iTDP Telangana State President",
        None,
    ),
    (
        "addressing-itdp-telangana",
        "addressing-itdp-telangana.jpg",
        "political",
        "Hari Krishna Talikota addressing an iTDP Telangana party meeting",
        None,
    ),
    (
        "with-chandrababu-naidu",
        "with-chandrababu-naidu.jpg",
        "gallery",
        "Hari Krishna Talikota welcoming TDP National President N. Chandrababu Naidu",
        None,
    ),
    (
        "with-nara-lokesh",
        "with-nara-lokesh.jpg",
        "gallery",
        "Hari Krishna Talikota with TDP National Working President Nara Lokesh",
        None,
    ),
    (
        "with-chandrababu-naidu-portrait",
        "with-chandrababu-naidu-portrait.jpg",
        "about",
        "Hari Krishna Talikota with TDP National President N. Chandrababu Naidu",
        None,
    ),
    (
        "greeting-chandrababu-naidu",
        "greeting-chandrababu-naidu.jpg",
        "gallery",
        "Hari Krishna Talikota greeting TDP National President N. Chandrababu Naidu",
        None,
    ),
    (
        "with-party-leadership",
        "with-party-leadership.jpg",
        "gallery",
        "Hari Krishna Talikota with TDP National President N. Chandrababu Naidu",
        None,
    ),
    (
        "bonalu-bangaru-bonam",
        "bonalu-bangaru-bonam.jpg",
        "community",
        "Hari Krishna Talikota carrying the bonam during the Sri Bhagyanagar Mahankali Bonalu Jatara procession",
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
        "Hari Krishna Talikota with performers at the Shravana Maasa Nrityotsavam dance festival",
        "శ్రావణమాస నాట్యోత్సవం, శ్రీ దత్త కూచిపూడి నాట్య కళాక్షేత్రం, బేగంపేట",
    ),
    (
        "jonnawada-kamakshi-thayi",
        "jonnawada-kamakshi-thayi.jpg",
        "gallery",
        "Hari Krishna Talikota carrying offerings at Sri Kamakshi Thayi temple, Jonnawada",
        "జొన్నవాడ కామాక్షి తాయి",
    ),
    (
        "medchal-constituency-meeting",
        "medchal-constituency-meeting.jpg",
        "gallery",
        "Hari Krishna Talikota speaking at an opinion-gathering programme in Medchal constituency",
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
        "Hari Krishna Talikota paying a courtesy call on Endowments Minister Anam Ramanarayana Reddy",
        "దేవాదాయ శాఖ మంత్రి ఆనం రామనారాయణరెడ్డి గారిని వారి స్వగృహంలో మర్యాదపూర్వకంగా కలవడం జరిగింది.",
    ),
    (
        "with-nandamuri-balakrishna",
        "with-nandamuri-balakrishna.jpg",
        "gallery",
        "Hari Krishna Talikota with Nandamuri Balakrishna, Hindupur MLA, beneath a portrait of N.T. Rama Rao",
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
        "csr-summit-hyderabad",
        "csr-summit-hyderabad.jpg",
        "gallery",
        "Hari Krishna Talikota with Narasaraopet MLA Chadalavada Aravind Babu at the CSR Summit, Hyderabad",
        None,
    ),
]

# Deliberately NOT published. Do not move these into PHOTOS without reading why.
EXCLUDED = {
    "నిన్న అమరావతిలో ముఖ్యమంత్రి శ్రీ నారాచంద్రబాబు నాయుడు గారిని కుటుంబసమేతంగా కలిసి కృతజ్ఞతలు తెలియజేయడం జరిగింది.🙏🙏.jpg": (
        "Carries a visible 'AI-generated content' watermark burned into the "
        "bottom-left pixels. Cannot be published as a genuine photograph of a "
        "meeting with the Chief Minister."
    ),
    "మా బాబు గారిని.jpg": (
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
            resized.save(wp, "WEBP", quality=82, method=6)
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
