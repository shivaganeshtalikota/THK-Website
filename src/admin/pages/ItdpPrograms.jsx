import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaPlus, FaPen, FaTrash, FaArrowUpRightFromSquare, FaImages, FaCalendarDays, FaTriangleExclamation } from 'react-icons/fa6'
import { api, itdpThumbSrc } from '../api'
import { ITDP_SITE } from '../content'
import { Button, Empty, LiveStatus, Notice, PageHeader } from '../ui'

const size = (n) => (n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GB` : `${Math.round(n / 1024 ** 2)} MB`)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** A programme's date as the website shows it: only as precise as it is known. */
function programDate(p) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p?.date))) return ''
  const [y, m, d] = p.date.split('-').map(Number)
  if (p.datePrecision === 'year') return String(y)
  if (p.datePrecision === 'month') return `${MONTHS[m - 1]} ${y}`
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/**
 * iTDP Telangana > Programmes: every programme on itdptelangana.com/programs,
 * newest first, as the site shows them.
 */
const ItdpPrograms = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)
  const [status, setStatus] = useState(null)

  const load = useCallback(async () => {
    try {
      setData(await api('itdp-content'))
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (p) => {
    if (!window.confirm(`Remove “${p.title}” from itdptelangana.com?\n\nIts ${p.photoCount} photos stay in storage, so this can be undone.`)) return
    setBusy(p.slug)
    setStatus(null)
    try {
      const d = await api('itdp-program-delete', { slug: p.slug })
      setStatus({ commit: d.commit, message: `Removed “${p.title}”.` })
      await load()
    } catch (err) {
      setStatus({ error: err.message })
    } finally {
      setBusy(null)
    }
  }

  const programs = data?.programs || []
  const unconfirmed = programs.filter((p) => p.dateConfirmed === false).length
  const storage = data?.storage
  const site = data?.site || ITDP_SITE

  return (
    <>
      <PageHeader
        title="iTDP programmes"
        subtitle="Programmes on itdptelangana.com — each with its photo album. The newest appear first on the website."
        actions={
          <Link to="/itdp/programs/new" className="inline-flex items-center gap-2 rounded-md bg-brand-500 px-4 py-2.5 text-sm font-bold text-ink-950 hover:bg-brand-400">
            <FaPlus aria-hidden="true" /> Add a programme
          </Link>
        }
      />

      <div className="space-y-3">
        {error && <Notice tone="error">{error}</Notice>}
        {status?.error && <Notice tone="error">{status.error}</Notice>}
        {status?.commit && <LiveStatus site="itdp" commit={status.commit} message={status.message} />}
        {unconfirmed > 0 && (
          <Notice tone="warn">
            {unconfirmed} programme{unconfirmed > 1 ? 's' : ''} brought over from the old website {unconfirmed > 1 ? 'have dates' : 'has a date'} worked out
            from the photos, not recorded by the office. Open {unconfirmed > 1 ? 'each' : 'it'}, check the date, and save to confirm it.
          </Notice>
        )}
        {storage && !storage.ready && (
          <Notice tone="warn">Photo storage is not set up yet (ITDP_R2_BUCKET), so new photos cannot be uploaded. Existing programmes can still be edited.</Notice>
        )}
      </div>

      {storage?.ready && (
        <div className="mt-4 rounded-xl border border-ink-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-ink-600">
            <span>Photo storage used (free tier)</span>
            <span className="tabular-nums">
              {size(storage.bytes)} of {size(storage.budget)}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, Math.min(100, (storage.bytes / storage.budget) * 100))}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink-500">When this fills, new photos go to the backup storage automatically.</p>
        </div>
      )}

      <div className="mt-6">
        {!data && !error ? (
          <p className="text-sm text-ink-400">Loading…</p>
        ) : programs.length === 0 ? (
          <Empty icon={FaCalendarDays} title="No programmes yet">
            Add a programme with its date and photos, and it appears on itdptelangana.com/programs.
          </Empty>
        ) : (
          <ul className="space-y-3">
            {programs.map((p) => (
              <li key={p.slug} className="flex flex-wrap items-center gap-4 rounded-xl border border-ink-200/80 bg-white p-3 shadow-sm sm:flex-nowrap">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                  {p.cover && <img src={itdpThumbSrc(p.cover.k)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{p.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
                    <span className="inline-flex items-center gap-1.5">
                      <FaCalendarDays aria-hidden="true" /> {programDate(p)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FaImages aria-hidden="true" /> {p.photoCount} photos
                    </span>
                    {p.dateConfirmed === false && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900">
                        <FaTriangleExclamation aria-hidden="true" /> Date to confirm
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/itdp/programs/${p.slug}`} className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-800 hover:border-ink-400">
                    <FaPen aria-hidden="true" /> Edit
                  </Link>
                  <a
                    href={`${site}/programs/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-800 hover:border-ink-400"
                  >
                    <FaArrowUpRightFromSquare aria-hidden="true" /> Open
                  </a>
                  <Button variant="danger" className="!px-3 !py-2 !text-xs" busy={busy === p.slug} onClick={() => remove(p)}>
                    <FaTrash aria-hidden="true" /> Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export default ItdpPrograms
