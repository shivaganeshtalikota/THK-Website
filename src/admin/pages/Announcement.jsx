import { Button, Card, Field, LiveStatus, Notice, PageHeader, Toggle, inputCls } from '../ui'
import { useSection } from '../useSection'

const EMPTY = { enabled: false, en: '', te: '', link: '', linkEn: '', linkTe: '', tone: 'brand', until: '' }

const TONES = [
  ['brand', 'Party yellow', 'bg-brand-500 text-ink-900'],
  ['dark', 'Dark', 'bg-ink-900 text-white'],
  ['alert', 'Urgent red', 'bg-red-700 text-white'],
]

/**
 * The strip across the top of every page. For a programme this weekend, a
 * helpline, a change of venue. It switches itself off after the end date.
 */
const Announcement = () => {
  const { draft, setDraft, save, saving, error, done, dirty, ready } = useSection('announcement', EMPTY)
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))
  const tone = TONES.find((t) => t[0] === draft.tone) || TONES[0]

  return (
    <>
      <PageHeader title="Announcement bar" subtitle="A one-line notice across the top of every page of the website, in English and Telugu." />
      {!ready ? (
        <p className="text-sm text-ink-400">Loading…</p>
      ) : (
        <div className="space-y-6">
          <Card title="Preview">
            <div className={`rounded-md px-4 py-2.5 text-center text-sm font-medium ${tone[2]} ${draft.enabled ? '' : 'opacity-40'}`}>
              {draft.en || draft.te || 'Your announcement appears here.'}
              {draft.link && <span className="ml-1 font-semibold underline">{draft.linkEn || 'Details'} →</span>}
            </div>
            {!draft.enabled && <p className="mt-2 text-xs text-ink-500">Switched off — not shown on the website.</p>}
          </Card>

          <Card title="Message">
            <div className="space-y-4">
              <Toggle checked={draft.enabled} onChange={(v) => setDraft((d) => ({ ...d, enabled: v }))} label={draft.enabled ? 'Showing on the website' : 'Off'} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="English">
                  <input className={inputCls} value={draft.en} onChange={set('en')} maxLength={220} placeholder="Public meeting at Nizamabad, Sunday 5 PM" />
                </Field>
                <Field label="Telugu">
                  <input lang="te" className={inputCls} value={draft.te} onChange={set('te')} maxLength={220} />
                </Field>
                <Field label="Link (optional)" hint="A full https:// address, or a page on this site like /contact.">
                  <input className={inputCls} value={draft.link} onChange={set('link')} placeholder="https://… or /posters" />
                </Field>
                <Field label="Hide automatically after" hint="Leave empty to keep it up until you switch it off.">
                  <input type="date" className={inputCls} value={draft.until} onChange={set('until')} />
                </Field>
                <Field label="Link text (English)">
                  <input className={inputCls} value={draft.linkEn} onChange={set('linkEn')} maxLength={40} placeholder="Details" />
                </Field>
                <Field label="Link text (Telugu)">
                  <input lang="te" className={inputCls} value={draft.linkTe} onChange={set('linkTe')} maxLength={40} placeholder="వివరాలు" />
                </Field>
              </div>
              <div>
                <p className="text-[0.8rem] font-semibold text-ink-700">Colour</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TONES.map(([k, label, cls]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, tone: k }))}
                      className={`rounded-md px-3 py-2 text-sm font-semibold ${cls} ${draft.tone === k ? 'ring-2 ring-ink-900 ring-offset-2' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {error && <Notice tone="error">{error}</Notice>}
          {done && <LiveStatus commit={done.commit} message="Announcement saved." link="https://www.talikotaharikrishna.com/" />}
          <Button variant="brand" onClick={() => save()} busy={saving} disabled={!dirty}>
            Save
          </Button>
        </div>
      )}
    </>
  )
}

export default Announcement
