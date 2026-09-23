import { FaXmark, FaArrowUp, FaArrowDown } from 'react-icons/fa6'
import { Button, Card, Field, LiveStatus, Notice, PageHeader, inputCls } from '../ui'
import { useSection } from '../useSection'
import { socialDefaults } from '../../data/site'

const NO_CONTACT = { email: '', pressEmail: '', phone: '', whatsapp: '', office: '', officeTe: '', hours: '', hoursTe: '' }

/**
 * Contact details and social accounts, as shown on the Contact page, in the
 * footer and in the navigation. Anything left empty keeps what the site shows
 * today — the office address stays "Hyderabad, Telangana", and no email or
 * phone is shown until one is entered here.
 */
const ContactSocial = () => {
  const contact = useSection('contact', NO_CONTACT)
  const social = useSection('social', null)
  const c = { ...NO_CONTACT, ...(contact.draft || {}) }
  const accounts = social.draft ?? socialDefaults
  const set = (k) => (e) => contact.setDraft((d) => ({ ...NO_CONTACT, ...(d || {}), [k]: e.target.value }))
  const setAcc = (i, k, v) => social.setDraft(accounts.map((a, j) => (j === i ? { ...a, [k]: v } : a)))
  const move = (i, d) => {
    const next = [...accounts]
    const [x] = next.splice(i, 1)
    next.splice(i + d, 0, x)
    social.setDraft(next)
  }

  return (
    <>
      <PageHeader title="Contact & social" subtitle="What the website shows on the Contact page, in the footer and in the menu." />
      {!contact.ready ? (
        <p className="text-sm text-ink-400">Loading…</p>
      ) : (
        <div className="space-y-6">
          <Card title="Contact details" subtitle="Leave a field empty to keep it off the website.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Office email">
                <input type="email" className={inputCls} value={c.email} onChange={set('email')} placeholder="office@…" />
              </Field>
              <Field label="Press email">
                <input type="email" className={inputCls} value={c.pressEmail} onChange={set('pressEmail')} />
              </Field>
              <Field label="Phone" hint="Shown with a tap-to-call link.">
                <input className={inputCls} value={c.phone} onChange={set('phone')} placeholder="+91 …" />
              </Field>
              <Field label="WhatsApp number" hint="Adds a “Message the office on WhatsApp” link.">
                <input className={inputCls} value={c.whatsapp} onChange={set('whatsapp')} placeholder="+91 …" />
              </Field>
              <Field label="Office address (English)" hint="Empty keeps “Hyderabad, Telangana, India”.">
                <input className={inputCls} value={c.office} onChange={set('office')} />
              </Field>
              <Field label="Office address (Telugu)">
                <input lang="te" className={inputCls} value={c.officeTe} onChange={set('officeTe')} />
              </Field>
              <Field label="Office hours (English)">
                <input className={inputCls} value={c.hours} onChange={set('hours')} placeholder="Mon–Sat, 10 AM – 6 PM" />
              </Field>
              <Field label="Office hours (Telugu)">
                <input lang="te" className={inputCls} value={c.hoursTe} onChange={set('hoursTe')} />
              </Field>
            </div>
            <div className="mt-5 space-y-3">
              {contact.error && <Notice tone="error">{contact.error}</Notice>}
              {contact.done && <LiveStatus commit={contact.done.commit} message="Contact details saved." link="https://www.talikotaharikrishna.com/contact" />}
              <Button variant="brand" onClick={() => contact.save(c)} busy={contact.saving} disabled={!contact.dirty}>
                Save contact details
              </Button>
            </div>
          </Card>

          <Card title="Social accounts" subtitle="In this order across the site. Mark accounts the office does not run as not official.">
            <div className="space-y-3">
              {accounts.map((a, i) => (
                <div key={i} className="grid gap-2 rounded-lg border border-ink-200 p-3 md:grid-cols-[8rem_10rem_1fr_auto]">
                  <input className={`${inputCls} !mt-0`} value={a.name} onChange={(e) => setAcc(i, 'name', e.target.value)} placeholder="Instagram" aria-label="Network" />
                  <input className={`${inputCls} !mt-0`} value={a.handle} onChange={(e) => setAcc(i, 'handle', e.target.value)} placeholder="@handle" aria-label="Handle" />
                  <input className={`${inputCls} !mt-0`} value={a.url} onChange={(e) => setAcc(i, 'url', e.target.value)} placeholder="https://…" aria-label="Link" />
                  <div className="flex items-center gap-1">
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-md text-ink-500 hover:bg-ink-100 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                      <FaArrowUp aria-hidden="true" />
                    </button>
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-md text-ink-500 hover:bg-ink-100 disabled:opacity-30" disabled={i === accounts.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                      <FaArrowDown aria-hidden="true" />
                    </button>
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600" onClick={() => social.setDraft(accounts.filter((_, j) => j !== i))} aria-label="Remove">
                      <FaXmark aria-hidden="true" />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-ink-700 md:col-span-4">
                    <input type="checkbox" checked={a.official !== false} onChange={(e) => setAcc(i, 'official', e.target.checked)} />
                    Run by the office
                    {a.official === false && (
                      <input
                        className={`${inputCls} !mt-0 ml-2 max-w-xs !py-1.5`}
                        value={a.note || ''}
                        onChange={(e) => setAcc(i, 'note', e.target.value)}
                        placeholder="e.g. Supporter-run channel"
                        aria-label="Note"
                      />
                    )}
                  </label>
                </div>
              ))}
              {accounts.length < 12 && (
                <button type="button" onClick={() => social.setDraft([...accounts, { name: '', handle: '', url: '', official: true, note: '' }])} className="text-sm font-semibold text-ink-700 hover:underline">
                  + Add an account
                </button>
              )}
            </div>
            <div className="mt-5 space-y-3">
              {social.error && <Notice tone="error">{social.error}</Notice>}
              {social.done && <LiveStatus commit={social.done.commit} message="Social accounts saved." />}
              <Button variant="brand" onClick={() => social.save(accounts)} busy={social.saving} disabled={!social.dirty && social.draft !== null}>
                Save social accounts
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

export default ContactSocial
