import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaWandMagicSparkles,
  FaImages,
  FaNewspaper,
  FaCalendarDays,
  FaBullhorn,
  FaCircleCheck,
  FaTriangleExclamation,
  FaArrowRight,
} from 'react-icons/fa6'
import { api } from '../api'
import { Card, Notice, PageHeader } from '../ui'
import { fmtDate } from '../format'

function Stat({ to, icon: Icon, label, value }) {
  return (
    <Link to={to} className="group rounded-xl border border-ink-200/80 bg-white p-5 shadow-sm transition hover:border-ink-400">
      <div className="flex items-center justify-between">
        <Icon className="text-lg text-brand-700" aria-hidden="true" />
        <FaArrowRight className="text-xs text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-600" aria-hidden="true" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-ink-950 tabular-nums">{value ?? '—'}</p>
      <p className="mt-1 text-sm text-ink-500">{label}</p>
    </Link>
  )
}

function Check({ ok, children }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {ok ? (
        <FaCircleCheck className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
      ) : (
        <FaTriangleExclamation className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
      )}
      <span className="text-ink-700">{children}</span>
    </li>
  )
}

export function ActivityList({ entries }) {
  if (!entries?.length) return <p className="text-sm text-ink-500">Nothing yet.</p>
  return (
    <ul className="divide-y divide-ink-100">
      {entries.map((e, i) => (
        <li key={`${e.t}-${i}`} className="flex items-start gap-3 py-2.5 text-sm">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.ok ? 'bg-emerald-500' : 'bg-red-500'}`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-ink-800">
              <span className="font-semibold capitalize">{e.op}</span>
              {e.d ? <span className="text-ink-600"> — {e.d}</span> : null}
            </p>
            <p className="text-xs text-ink-400">
              {fmtDate(e.t)} · {e.dev} · #{e.ip}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

const Overview = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api('overview')
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <PageHeader
        title={greeting}
        subtitle="Everything on talikotaharikrishna.com is managed from here. Changes are live on the website a minute or two after you save them."
      />
      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat to="/posters" icon={FaWandMagicSparkles} label="Campaign posters" value={data?.counts.posters} />
        <Stat to="/gallery" icon={FaImages} label="Photos published" value={data?.counts.photos} />
        <Stat to="/updates" icon={FaNewspaper} label="News & updates" value={data?.counts.updates} />
        <Stat to="/events" icon={FaCalendarDays} label="Upcoming events" value={data?.counts.upcomingEvents} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          title="Recent activity"
          subtitle="Sign-ins and changes, newest first"
          actions={
            <Link to="/activity" className="text-sm font-semibold text-ink-700 hover:underline">
              See all
            </Link>
          }
        >
          {data ? <ActivityList entries={data.activity} /> : <p className="text-sm text-ink-400">Loading…</p>}
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Quick actions">
            <div className="grid gap-2">
              <Link to="/posters/new" className="flex items-center gap-3 rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-ink-950 hover:bg-brand-400">
                <FaWandMagicSparkles aria-hidden="true" /> Create a campaign poster
              </Link>
              <Link to="/gallery" className="flex items-center gap-3 rounded-lg border border-ink-200 px-4 py-3 text-sm font-semibold text-ink-800 hover:border-ink-400">
                <FaImages aria-hidden="true" /> Add photos to the gallery
              </Link>
              <Link to="/announcement" className="flex items-center gap-3 rounded-lg border border-ink-200 px-4 py-3 text-sm font-semibold text-ink-800 hover:border-ink-400">
                <FaBullhorn aria-hidden="true" />
                {data?.announcement?.enabled ? 'Edit the announcement bar (on)' : 'Put up an announcement'}
              </Link>
            </div>
          </Card>

          <Card title="Health">
            {data ? (
              <ul className="space-y-2.5">
                <Check ok={data.health.github}>Publishing to the website</Check>
                <Check ok={data.health.storage}>Storage for posters and uploads</Check>
                <Check ok={data.health.recoveryCodesLeft >= 3}>
                  {data.health.recoveryCodesLeft} recovery codes left
                  {data.health.recoveryCodesLeft < 3 && (
                    <>
                      {' — '}
                      <Link to="/security" className="font-semibold underline">
                        make new ones
                      </Link>
                    </>
                  )}
                </Check>
                <Check ok={data.health.strongSessionKey}>
                  {data.health.strongSessionKey
                    ? 'Dedicated session key set'
                    : 'Recommended: add ADMIN_SESSION_SECRET in Vercel (see Security)'}
                </Check>
                <Check ok={data.health.captions}>{data.health.captions ? 'Caption drafting available' : 'Caption drafting is off (no Gemini key)'}</Check>
              </ul>
            ) : (
              <p className="text-sm text-ink-400">Checking…</p>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

export default Overview
