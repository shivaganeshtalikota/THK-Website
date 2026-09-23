import { useEffect, useState } from 'react'
import { api } from '../api'
import { Button, Card, Notice, PageHeader } from '../ui'
import { ActivityList } from './Overview'

/**
 * Every sign-in — including failed ones — and every change made from the
 * console, newest first. Addresses are shown only as a short fingerprint
 * (#a1b2c3d4): enough to tell "the same place as usual" from "somewhere new",
 * without the log becoming a record of where anybody was.
 */
const Activity = () => {
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = () => {
    setError(null)
    api('activity')
      .then((d) => setEntries(d.entries))
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const shown = (entries || []).filter((e) =>
    filter === 'all' ? true : filter === 'failed' ? !e.ok : filter === 'signin' ? /sign|factor|authenticator|security/.test(e.op) : !/sign|factor|authenticator|security/.test(e.op),
  )
  const failures = (entries || []).filter((e) => !e.ok && Date.now() - e.t < 24 * 3600 * 1000).length

  return (
    <>
      <PageHeader title="Activity log" subtitle="Sign-ins and every change made from the console." actions={<Button variant="ghost" onClick={load}>Refresh</Button>} />
      {error && <Notice tone="error">{error}</Notice>}
      {failures >= 5 && (
        <div className="mb-4">
          <Notice tone="warn">
            {failures} failed attempts in the last 24 hours. Sign-in locks for 15 minutes after repeated failures. If these were not you, consider
            changing the password in Vercel.
          </Notice>
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ['all', 'Everything'],
          ['changes', 'Changes'],
          ['signin', 'Sign-ins & security'],
          ['failed', 'Failed'],
        ].map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${filter === k ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200'}`}
          >
            {l}
          </button>
        ))}
      </div>
      <Card>{entries ? <ActivityList entries={shown} /> : <p className="text-sm text-ink-400">Loading…</p>}</Card>
    </>
  )
}

export default Activity
