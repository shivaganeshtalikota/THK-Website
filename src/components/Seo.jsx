import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useHead } from './Head'
import { site } from '../data/site'

/**
 * Per-page SEO / social metadata.
 *
 * Every page gets its own title, description, canonical and og:url. The very
 * first build reused one hardcoded canonical (`/`) on all six pages, which
 * tells Google the whole site is one page and drops the rest from the index.
 *
 * `image` must be an absolute URL for WhatsApp/Facebook/X to fetch it —
 * relative paths silently produce a preview with no image.
 */
const Seo = ({
  title,
  preloadPhoto,
  description = site.description,
  image = `${site.url}/og-image.jpg`,
  type = 'website',
  noindex = false,
  schema,
}) => {
  const { pathname } = useLocation()

  const head = useMemo(() => {
    /*
     * Preload the LCP image.
     *
     * Without this the browser cannot start the hero download until it has
     * parsed the HTML, fetched the blocking stylesheet and reached the
     * <picture>. On a phone that serialised chain put LCP at 4.2s. A preload
     * with imagesrcset lets it begin immediately, in parallel with the CSS,
     * and — because it repeats the same srcset and sizes — the browser picks
     * exactly the variant it would have picked anyway rather than downloading
     * a second one.
     *
     * Per route, not in index.html: every page has a different hero, so a
     * shared preload would fetch the wrong image on five of them.
     */
    const preloadTags = preloadPhoto
      ? [
          {
            _tag: 'link',
            rel: 'preload',
            as: 'image',
            type: 'image/webp',
            href: `/photos/${preloadPhoto.slug}-${preloadPhoto.widths[Math.min(1, preloadPhoto.widths.length - 1)]}.webp`,
            imagesrcset: (preloadPhoto.widths ?? [])
              .map((w) => `/photos/${preloadPhoto.slug}-${w}.webp ${w}w`)
              .join(', '),
            imagesizes: preloadPhoto.sizes ?? '100vw',
            fetchpriority: 'high',
          },
        ]
      : []
    const canonical = `${site.url}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`

    // No `title` means the homepage, which gets the full descriptive title
    // rather than a suffix. "Home | Talikota Hari Krishna" would waste the
    // single most valuable string on the site — the one Google shows for his
    // name.
    const fullTitle = title
      ? `${title} | ${site.name}`
      : `${site.name} · Devasthanam Board Member`

    const alt = `${site.name} — ${site.role}`

    const tags = [
      ...preloadTags,
      { _tag: 'meta', name: 'description', content: description },
      { _tag: 'link', rel: 'canonical', href: canonical },

      // Open Graph — what WhatsApp, Facebook, LinkedIn and Telegram read to
      // build the link preview card.
      { _tag: 'meta', property: 'og:type', content: type },
      { _tag: 'meta', property: 'og:site_name', content: `${site.name} Official` },
      { _tag: 'meta', property: 'og:locale', content: 'en_IN' },
      { _tag: 'meta', property: 'og:url', content: canonical },
      { _tag: 'meta', property: 'og:title', content: fullTitle },
      { _tag: 'meta', property: 'og:description', content: description },
      { _tag: 'meta', property: 'og:image', content: image },
      { _tag: 'meta', property: 'og:image:secure_url', content: image },
      // WhatsApp and Facebook use this as a decoding hint. index.html
      // declared it, but prerender strips the template's og: block in
      // favour of these, so it was being dropped from every page.
      { _tag: 'meta', property: 'og:image:type', content: image.endsWith('.png') ? 'image/png' : 'image/jpeg' },
      { _tag: 'meta', property: 'og:image:width', content: '1200' },
      { _tag: 'meta', property: 'og:image:height', content: '630' },
      { _tag: 'meta', property: 'og:image:alt', content: alt },

      { _tag: 'meta', name: 'twitter:card', content: 'summary_large_image' },
      { _tag: 'meta', name: 'twitter:site', content: '@THK_iTDP' },
      { _tag: 'meta', name: 'twitter:creator', content: '@THK_iTDP' },
      { _tag: 'meta', name: 'twitter:title', content: fullTitle },
      { _tag: 'meta', name: 'twitter:description', content: description },
      { _tag: 'meta', name: 'twitter:image', content: image },
      { _tag: 'meta', name: 'twitter:image:alt', content: alt },
    ]

    // Always emitted, not only when noindex. index.html carries a static robots
    // tag, and prerender used to leave it in place — so /admin shipped BOTH
    // "index, follow" and "noindex, follow". Google resolves a conflict by
    // taking the most restrictive, so it happened to behave, but it was
    // ambiguous and some crawlers simply take the first one they see. The
    // template's tag is now stripped and this is the single source.
    tags.push({
      _tag: 'meta',
      name: 'robots',
      content: noindex
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1',
    })

    if (schema) {
      tags.push({
        _tag: 'script',
        type: 'application/ld+json',
        _text: JSON.stringify(schema),
      })
    }

    /*
     * Breadcrumbs, on every page but the homepage.
     *
     * Two reasons, and the second is the one that matters here. Google renders
     * a breadcrumb trail in place of the raw URL in the result, so the listing
     * reads "Talikota Hari Krishna › Political Leadership" rather than a bare
     * path — more legible, and it tells a searcher what section they are about
     * to land in. Less visibly, it is another edge in the entity graph: each
     * crumb points back at the site root, which reinforces that these eight
     * pages are one property about one person rather than eight loose pages.
     *
     * Emitted here rather than per page so it cannot be forgotten when a route
     * is added, and derived from the same `title` the <title> tag uses so the
     * two can never disagree.
     */
    if (pathname !== '/' && title && !noindex) {
      tags.push({
        _tag: 'script',
        type: 'application/ld+json',
        _text: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: site.name, item: `${site.url}/` },
            { '@type': 'ListItem', position: 2, name: title, item: canonical },
          ],
        }),
      })
    }

    return { title: fullTitle, tags }
  }, [pathname, title, description, image, type, noindex, schema, preloadPhoto])

  useHead(head)
  return null
}

export default Seo
