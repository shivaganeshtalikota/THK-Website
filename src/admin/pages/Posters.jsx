import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaPlus, FaPen, FaTrash, FaArrowUpRightFromSquare, FaCopy, FaWandMagicSparkles } from 'react-icons/fa6'
import { api } from '../api'
import { useContent, SITE } from '../content'
import { Button, Card, Empty, LiveStatus, Notice, PageHeader } from '../ui'

const Posters = () => {
  const { content, reload, loadError } = useContent()
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(null)
  const [copied, setCopied] = useState(null)

  const remove = async (p) => {
    if (!window.confirm(`Remove “${p.titleEn}” from the website?\n\nLinks people have already shared keep showing their posters; the campaign page itself goes away.`)) return
    setBusy(p.slug)
    setStatus(null)
    try {
      const d = await api('poster-delete', { slug: p.slug })
      setStatus({ commit: d.commit, message: `Removed “${p.titleEn}”.` })
      await reload()
    } catch (err) {
      setStatus({ error: err.message })
    } finally {
      setBusy(null)
    }
  }

  const copy = async (slug) => {
    await navigator.clipboard?.writeText(`${SITE}/posters/${slug}`)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const posters = content?.posters || []

  return (
    <>
      <PageHeader
        title="Campaign posters"
        subtitle="Each campaign gets its own page where supporters put their name and photo on the poster and share it."
        actions={
          <Link to="/posters/new" className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-bold text-ink-950 hover:bg-brand-400">
            <FaPlus aria-hidden="true" /> Create a poster
          </Link>
        }
      />

      {loadError && <Notice tone="error">{loadError}</Notice>}
      {status?.error && <Notice tone="error">{status.error}</Notice>}
      {status?.commit && <LiveStatus commit={status.commit} message={status.message} />}

      <div className="mt-4">
        {!content ? (
          <p className="text-sm text-ink-400">Loading…</p>
        ) : posters.length === 0 ? (
          <Empty icon={FaWandMagicSparkles} title="No posters published from the console yet">
            Upload the event artwork, choose how the name bar looks, and publish — the campaign page is live in a couple of minutes.
          </Empty>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {posters.map((p) => (
              <li key={p.slug}>
                <Card className="h-full overflow-hidden !p-0">
                  <div className="-mx-5 -mt-5 mb-4 aspect-[4/5] bg-ink-100 sm:-mx-6">
                    <img src={`/posters/${p.slug}-v${p.version}.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand-700">{p.issue}</p>
                  <h3 className="mt-1 font-semibold text-ink-900">{p.titleEn}</h3>
                  {p.title && p.title !== p.titleEn && (
                    <p lang="te" className="mt-0.5 text-sm text-ink-600">
                      {p.title}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-ink-400">/posters/{p.slug}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to={`/posters/${p.slug}`} className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-800 hover:border-ink-400">
                      <FaPen aria-hidden="true" /> Edit
                    </Link>
                    <a
                      href={`${SITE}/posters/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-800 hover:border-ink-400"
                    >
                      <FaArrowUpRightFromSquare aria-hidden="true" /> Open
                    </a>
                    <Button variant="ghost" className="!px-3 !py-2 !text-xs" onClick={() => copy(p.slug)}>
                      <FaCopy aria-hidden="true" /> {copied === p.slug ? 'Copied' : 'Link'}
                    </Button>
                    <Button variant="danger" className="!px-3 !py-2 !text-xs" busy={busy === p.slug} onClick={() => remove(p)}>
                      <FaTrash aria-hidden="true" /> Remove
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8 text-xs text-ink-400">
        The 22A “Patta Bhumi” poster was designed by hand and lives in the site’s code, so it is not listed here.
      </p>
    </>
  )
}

export default Posters
