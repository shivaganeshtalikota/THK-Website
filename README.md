# Hari Krishna Talikota — Official Website

Political website for **Hari Krishna Talikota**, iTDP Telangana State President and
Board Member of Sri Kanaka Durga Devasthanam.

React 18 · Vite · Tailwind · React Router · Framer Motion · react-helmet-async

```bash
npm install
npm run dev      # dev server (port 3000, or $PORT)
npm run build    # regenerates sitemap.xml, then builds to dist/
npm run assets   # regenerates og-image + favicons (needs Python + Pillow)
```

---

## ⚠️ Before launch — required

Three things must be supplied by the office. The site runs without them and
degrades honestly, but it isn't finished until they're done.

### 1. Photographs — nothing is in the repo

**There are no photos of Hari Krishna Talikota in this project.** Until real files
are added, every photo slot renders a branded "photograph pending" placeholder.

To add them, drop files into `public/images/` using the exact filenames listed in
[`src/data/images.js`](src/data/images.js). Nothing else — the `<Photo>` component
picks them up and the placeholder disappears.

| File | Used for | Ratio |
|---|---|---|
| `hari-krishna-talikota-portrait.jpg` | Homepage hero | 3:4 |
| `about-portrait.jpg` | About page | 4:5 |
| `political-leadership.jpg` | Political page — rally/meeting | 16:9 |
| `community-service.jpg` | Community page — temple | 16:9 |

WebP or JPEG, ~2000px long edge, under ~400KB each.

> **Never hotlink from Facebook or Instagram.** The previous build pulled the hero
> straight from `scontent.fhyd11-1.fna.fbcdn.net` using a signed URL. Those expire —
> it returns **HTTP 403** and the homepage hero was a broken image. Always commit
> local files.

After adding a portrait, regenerate the social card with the real face in it:
uncomment the `PHOTO_SLOT` block in [`scripts/generate-assets.py`](scripts/generate-assets.py),
then `npm run assets`.

### 2. Contact form — currently disabled

Set `VITE_WEB3FORMS_KEY` in `.env` (copy from `.env.example`; free key at
[web3forms.com](https://web3forms.com)). Without it the form is **disabled and says
so**, by design.

It will never claim a message was sent unless the API confirms delivery. The old
version ran a 2-second `setTimeout`, discarded the message, and told the
constituent *"Thank you for your message! We'll get back to you soon."* Nobody
received any of it.

### 3. Confirm the real contact details

[`src/data/site.js`](src/data/site.js) gates contact details behind a `verified`
flag. Anything `verified: false` is hidden from the page **and** from the
structured data, so nothing unconfirmed is published. The phone number that used
to ship, `+91 98765 43210`, was a fake placeholder.

Set the real values and flip `verified: true`. Also confirm `site.url` — every
canonical URL, the sitemap, and the social preview derive from it.

---

## Content integrity

All copy traces to `website-content-master.md`. If a claim isn't in that document
or verifiable from a public source, it does not go on the site.

Removed from the previous build because it was invented:

- **Stats bar** — "10+ Years of Service / 1000+ Community Events / 50K+ Lives
  Impacted". No source. Replaced with verifiable credentials (his actual roles).
- **Four press releases** — dated events like "May 8, 2026 — Public Meeting in
  Hyderabad". Fabricated news attached to a sitting party president. The newsroom
  is now an honest empty state; add real entries to `updates` in `src/data/site.js`.
- **Follower counts** — "10K+ / 25K+ / 15K+". Invented.

The site is political-only. No construction/business content remains in `src/`.

---

## Structure

```
public/            og-image.png, favicons, robots.txt, sitemap.xml (generated)
  images/          ← real photographs go here
scripts/
  generate-assets.py    og card + favicon set
  generate-sitemap.js   runs automatically on prebuild
src/
  data/
    site.js        all copy, roles, party facts — single source of truth
    images.js      photo manifest (filenames + alt text)
  components/
    Seo.jsx        per-page title/canonical/OG/JSON-LD
    Photo.jsx      image with branded fallback when the file is absent
    Reveal.jsx     scroll animation; respects prefers-reduced-motion
    PageHero.jsx   shared page header
    Navbar / Footer / ScrollToTop / ScrollReset / Icon
  pages/           Home About Political Community Media Contact
                   Privacy Terms NotFound
```

## Design system

Party yellow `#FFD700` is a **surface** colour, never text — at ~1.6:1 on white it
fails WCAG badly, and the old build used it for nav links, active states and
footer headings, leaving much of the site's text near-invisible.

The `brand` scale splits that hue:

| Token | Use | Contrast on white |
|---|---|---|
| `brand-500` `#FFD700` | fills, badges, bars (dark ink on top) | — |
| `brand-700` `#9C7500` | **large text only** | 4.24:1 |
| `brand-800` `#6F5300` | safe for small text | 7.21:1 |

`ink-*` for neutrals, `leaf-*` for the party's green. All nine routes audit at
**zero contrast failures**.

## SEO / GEO

- Per-page canonical + OG via `<Seo>`; a connected JSON-LD `@graph`
  (Person → PoliticalParty → WebSite) rather than disconnected islands.
- `robots.txt` explicitly allows generative crawlers (GPTBot, PerplexityBot,
  ClaudeBot, Google-Extended…) so AI answer engines cite this site directly.
- `sitemap.xml` is generated on every build — `robots.txt` had always pointed at
  it, but the file never existed and returned 404.

### Known limitation: per-page social previews

This is a client-rendered SPA, and **social crawlers don't execute JavaScript**.
So `<Seo>` is invisible to them — only the static tags in `index.html` produce
link previews. Sharing the root domain works correctly; sharing a deep link
(e.g. `/political`) shows the homepage card.

Fixing that properly needs prerendering (`vite-plugin-ssr`, `react-snap`) or
moving to a framework with SSR. Worth doing if deep links get shared often.
