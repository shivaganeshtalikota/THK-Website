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
  description = site.description,
  image = `${site.url}/og-image.png`,
  type = 'website',
  noindex = false,
  schema,
}) => {
  const { pathname } = useLocation()

  const head = useMemo(() => {
    const canonical = `${site.url}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`

    // No `title` means the homepage, which gets the full descriptive title
    // rather than a suffix. "Home | Hari Krishna Talikota" would waste the
    // single most valuable string on the site — the one Google shows for his
    // name.
    const fullTitle = title
      ? `${title} | ${site.name}`
      : `${site.name} — Kanaka Durga Devasthanam Board Member`

    const alt = `${site.name} — ${site.role}`

    const tags = [
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

    if (noindex) {
      tags.push({ _tag: 'meta', name: 'robots', content: 'noindex, follow' })
    }

    if (schema) {
      tags.push({
        _tag: 'script',
        type: 'application/ld+json',
        _text: JSON.stringify(schema),
      })
    }

    return { title: fullTitle, tags }
  }, [pathname, title, description, image, type, noindex, schema])

  useHead(head)
  return null
}

export default Seo
