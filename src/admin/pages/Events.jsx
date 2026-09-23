import { useState } from 'react'
import { FaPlus, FaPen, FaTrash, FaCalendarDays } from 'react-icons/fa6'
import { Button, Card, Empty, Field, LiveStatus, Notice, PageHeader, inputCls } from '../ui'
import { useSection } from '../useSection'

const BLANK = { id: '', titleEn: '', titleTe: '', date: '', time: '', venueEn: '', venueTe: '', descriptionEn: '', descriptionTe: '', link: '' }
const today = () => new Date().toISOString().slice(0, 10)
const NO_EVENTS = []

/**
 * Programmes shown on the homepage under "Upcoming programmes". Past ones drop
 * off the website by themselves; they stay listed here until removed.
 */
const Events = () => {
  const { draft: events, save, saving, error, done, ready } = useSection('events', NO_EVENTS)
  const [edit, setEdit] = useState(null) // event being edited, or null
  const [localError, setLocalError] = useState(null)

  const commit = async (next) => {
    const ok = await save(next)
    if (ok) setEdit(null)
  }

  const submit = () => {
    setLocalError(null)
    if (!edit.titleEn.trim() && !edit.titleTe.trim()) return setLocalError('Give the event a title.')
    if (!edit.date) return setLocalError('Choose the date.')
    const list = Array.isArray(events) ? events : []
    const next = edit.id ? list.map((e) => (e.id === edit.id ? edit : e)) : [...list, { ...edit, id: '' }]
    commit(next)
  }

  const remove = (ev) => {
    if (!window.confirm(`Remove “${ev.titleEn || ev.titleTe}”?`)) return
    commit(events.filter((e) => e.id !== ev.id))
  }

  const sorted = [...(Array.isArray(events) ? events : [])].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const set = (k) => (e) => setEdit((d) => ({ ...d, [k]: e.target.value }))

  return (
    <>
      <PageHeader
        title="Events & programmes"
        subtitle="Upcoming programmes appear on the homepage. Once the date passes they disappear from the website by themselves."
        actions={!edit && <Button variant="brand" onClick={() => setEdit({ ...BLANK, date: today() })}><FaPlus aria-hidden="true" /> Add an event</Button>}
      />

      {edit && (
        <Card title={edit.id ? 'Edit event' : 'New event'} className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title (English)">
              <input className={inputCls} value={edit.titleEn} onChange={set('titleEn')} maxLength={140} />
            </Field>
            <Field label="Title (Telugu)">
              <input lang="te" className={inputCls} value={edit.titleTe} onChange={set('titleTe')} maxLength={140} />
            </Field>
            <Field label="Date *">
              <input type="date" className={inputCls} value={edit.date} onChange={set('date')} />
            </Field>
            <Field label="Time">
              <input type="time" className={inputCls} value={edit.time} onChange={set('time')} />
            </Field>
            <Field label="Venue (English)">
              <input className={inputCls} value={edit.venueEn} onChange={set('venueEn')} maxLength={140} />
            </Field>
            <Field label="Venue (Telugu)">
              <input lang="te" className={inputCls} value={edit.venueTe} onChange={set('venueTe')} maxLength={140} />
            </Field>
            <Field label="Description (English)">
              <textarea className={`${inputCls} min-h-[5rem]`} value={edit.descriptionEn} onChange={set('descriptionEn')} maxLength={700} />
            </Field>
            <Field label="Description (Telugu)">
              <textarea lang="te" className={`${inputCls} min-h-[5rem]`} value={edit.descriptionTe} onChange={set('descriptionTe')} maxLength={700} />
            </Field>
            <Field label="Link (optional)" className="md:col-span-2" hint="A map, a livestream, or a poster page — https:// or /posters/…">
              <input className={inputCls} value={edit.link} onChange={set('link')} />
            </Field>
          </div>
          <div className="mt-5 space-y-3">
            {(localError || error) && <Notice tone="error">{localError || error}</Notice>}
            <div className="flex gap-2">
              <Button variant="brand" onClick={submit} busy={saving}>
                {edit.id ? 'Save event' : 'Add event'}
              </Button>
              <Button variant="ghost" onClick={() => setEdit(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {done && !edit && <div className="mb-4"><LiveStatus commit={done.commit} message="Events saved." /></div>}
      {!edit && error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}

      {!ready ? (
        <p className="text-sm text-ink-400">Loading…</p>
      ) : sorted.length === 0 ? (
        <Empty icon={FaCalendarDays} title="No events yet">Add a programme and it appears on the homepage until the day has passed.</Empty>
      ) : (
        <ul className="space-y-3">
          {sorted.map((ev) => {
            const past = ev.date < today()
            return (
              <li key={ev.id} className={`flex flex-wrap items-center gap-4 rounded-xl border border-ink-200/80 bg-white p-4 shadow-sm ${past ? 'opacity-60' : ''}`}>
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-ink-900 text-center text-white">
                  <span className="leading-none">
                    <span className="block text-lg font-bold">{Number(ev.date.slice(8, 10))}</span>
                    <span className="block text-[0.6rem] uppercase tracking-wider text-brand-400">
                      {new Date(`${ev.date}T00:00:00`).toLocaleString('en-IN', { month: 'short' })}
                    </span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{ev.titleEn || ev.titleTe}</p>
                  <p className="text-sm text-ink-500">
                    {[ev.time, ev.venueEn || ev.venueTe].filter(Boolean).join(' · ')}
                    {past && ' · past — no longer on the website'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="!px-3 !py-1.5 !text-xs" onClick={() => setEdit(ev)}>
                    <FaPen aria-hidden="true" /> Edit
                  </Button>
                  <Button variant="danger" className="!px-3 !py-1.5 !text-xs" onClick={() => remove(ev)} busy={saving}>
                    <FaTrash aria-hidden="true" /> Remove
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export default Events
