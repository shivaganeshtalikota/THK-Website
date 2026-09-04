import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { site } from '../data/site'

/**
 * Per-page SEO / social metadata.
 *
 * Every page gets its own title, description, canonical and og:url. The old
 * build reused one hardcoded canonical (`/`) on all six pages, which tells
 * Google the whole site is one page and drops the rest from the index.
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
  const canonical = `${site.url}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`

  // No `title` means the homepage, which gets the full descriptive title rather
  // than a suffix. "Home | Hari Krishna Talikota" wastes the single most
  // valuable string on the site — the one Google shows for his name.
  const fullTitle = title
    ? `${title} | ${site.name}`
    : `${site.name} — Kanaka Durga Devasthanam Board Member`

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      {/* Open Graph — this block is what WhatsApp, Facebook, LinkedIn and
          Telegram read to build the link preview card. */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={`${site.name} Official`} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:secure_url" content={image} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${site.name} — ${site.role}`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@THK_iTDP" />
      <meta name="twitter:creator" content="@THK_iTDP" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={`${site.name} — ${site.role}`} />

      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  )
}

export default Seo
