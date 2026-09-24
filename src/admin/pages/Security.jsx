import { useEffect, useMemo, useState } from 'react'
import qrcode from 'qrcode-generator'
import { FaShieldHalved, FaKey, FaRightFromBracket, FaMobileScreenButton, FaPlus, FaPen, FaTrash } from 'react-icons/fa6'
import { api } from '../api'
import { Button, Card, Notice, PageHeader, inputCls } from '../ui'
import { fmtDate } from '../format'
import { RecoveryCodes, CodeInput } from '../SignIn'

/**
 * The account's protection, and what can be done about it: the authenticator
 * phones (up to three — one per person who signs in), new recovery codes,
 * signing every device out, and starting over. Everything that changes who can
 * get in needs a current code from a phone already on the account, so a
 * session left open on a borrowed computer cannot be used to take it over.
 */
const Security = ({ onSignedOut }) => {
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(null)
  const [codes, setCodes] = useState(null)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(null) // { secret, uri, name }
  const [newCode, setNewCode] = useState('')

  const load = () =>
    api('security')
      .then(setInfo)
      .catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  const run = async (what, fn) => {
    setBusy(what)
    setError(null)
    setDone(null)
    try {
      await fn()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const qrSrc = useMemo(() => {
    if (!adding?.uri) return null
    const qr = qrcode(0, 'M')
    qr.addData(adding.uri)
    qr.make()
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.createSvgTag({ cellSize: 6, margin: 3, scalable: true }))}`
  }, [adding])

  const devices = info?.devices || []
  const max = info?.maxDevices || 3
  const full = devices.length >= max
  const codeReady = code.length === 6

  if (codes) {
    return (
      <>
        <PageHeader title="New recovery codes" />
        <Card>
          <RecoveryCodes
            codes={codes}
            onDone={() => {
              setCodes(null)
              load()
            }}
          />
        </Card>
      </>
    )
  }

  if (adding) {
    return (
      <>
        <PageHeader title={`Add ${adding.name}`} subtitle="Do this with the new phone in hand." />
        <Card>
          <form
            className="mx-auto max-w-md space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              run('confirm', async () => {
                await api('device-add-confirm', { code: newCode })
                setAdding(null)
                setNewCode('')
                setNewName('')
                setDone(`${adding.name} can now sign in. Its codes work from the next sign-in.`)
                await load()
              })
            }}
          >
            <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-700">
              <li>
                On the new phone, install <strong>Google Authenticator</strong> (or Microsoft Authenticator).
              </li>
              <li>In the app, add an account and scan this QR code.</li>
              <li>Type the six-digit code the NEW phone shows.</li>
            </ol>
            <div className="flex justify-center rounded-xl bg-white p-2 ring-1 ring-ink-100">
              {qrSrc && <img src={qrSrc} alt={`QR code for ${adding.name}`} className="h-56 w-56" />}
            </div>
            <details className="text-xs text-ink-500">
              <summary className="cursor-pointer font-medium text-ink-600">Can’t scan? Enter this key instead</summary>
              <p className="mt-2 break-all rounded bg-ink-50 p-2 font-mono text-[0.8rem] text-ink-800">
                {adding.secret.replace(/(.{4})/g, '$1 ').trim()}
              </p>
            </details>
            <CodeInput value={newCode} onChange={setNewCode} />
            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="primary" busy={busy === 'confirm'} disabled={newCode.length !== 6}>
                Confirm and add
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  run('cancel', async () => {
                    await api('device-add-cancel', {})
                    setAdding(null)
                    setNewCode('')
                  })
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Security" subtitle="How the console is protected, and what to do if a phone or password is lost." />
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
      {done && <div className="mb-4"><Notice tone="ok" onClose={() => setDone(null)}>{done}</Notice></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card title="Protection in place">
            <ul className="space-y-3 text-sm text-ink-700">
              <li className="flex gap-3">
                <FaShieldHalved className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>
                  <strong>Two-step sign-in.</strong> Password, then a code from one of the account’s authenticator phones
                  {info ? ` (${devices.length} of ${max} set up)` : ''}.
                </span>
              </li>
              <li className="flex gap-3">
                <FaKey className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>
                  <strong>{info ? info.recoveryCodesLeft : '…'} recovery codes</strong> left for a lost phone. Each works once.
                </span>
              </li>
              <li className="flex gap-3">
                <FaMobileScreenButton className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>
                  <strong>This session:</strong> {info ? `${info.session.device}, signed in ${fmtDate(info.session.since)}` : '…'}. It ends after an hour
                  without use, and after twelve hours regardless.
                </span>
              </li>
              <li className="flex gap-3">
                <FaShieldHalved className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>
                  <strong>Only on admin.talikotaharikrishna.com.</strong> The console and its sign-in cookie do not exist on the public website. Repeated
                  wrong passwords or codes lock sign-in for fifteen minutes, and every attempt is in the activity log.
                </span>
              </li>
            </ul>
            {info && !info.strongSessionKey && (
              <div className="mt-5">
                <Notice tone="warn">
                  <strong>Recommended:</strong> in Vercel → Settings → Environment Variables, add <code>ADMIN_SESSION_SECRET</code> set to a long random
                  value (32+ characters), then redeploy. It gives sessions and the authenticator key their own secret instead of one derived from the
                  password. Everyone will need to sign in again once; nothing else changes.
                </Notice>
              </div>
            )}
          </Card>

          <Card title="If everything is lost">
            <p className="text-sm leading-relaxed text-ink-600">
              Lost every phone <em>and</em> the recovery codes? Someone with access to the Cloudflare account can delete the object{' '}
              <code className="rounded bg-ink-100 px-1">sec/state.json</code> in the <code className="rounded bg-ink-100 px-1">thk-web</code> R2 bucket. The next
              sign-in with the password then sets up a new authenticator. To change the password itself, edit <code>ADMIN_PASSWORD</code> in Vercel and
              redeploy — that also signs everyone out.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title={`Authenticator phones (${devices.length} of ${max})`}
            subtitle="One for each person who signs in. Everyone uses the same password; each person’s phone gives its own codes."
          >
            <label htmlFor="sec-code" className="block text-[0.8rem] font-semibold text-ink-700">
              A current code from a phone already on the account
            </label>
            <input
              id="sec-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              className={`${inputCls} max-w-[12rem] text-center font-mono text-lg tracking-[0.25em]`}
              placeholder="123456"
            />
            <p className="mt-1.5 text-xs text-ink-500">Needed to add or remove a phone, and for the actions below. Each code works once.</p>

            <ul className="mt-5 divide-y divide-ink-100 rounded-lg border border-ink-200">
              {devices.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <FaMobileScreenButton className="shrink-0 text-ink-500" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">{d.name}</span>
                      <span className="block text-xs text-ink-500">{d.createdAt ? `Added ${fmtDate(Date.parse(d.createdAt))}` : ''}</span>
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <Button
                      variant="ghost"
                      busy={busy === `rename-${d.id}`}
                      onClick={() => {
                        const name = window.prompt('Name for this phone', d.name)
                        if (!name || name.trim() === d.name) return
                        run(`rename-${d.id}`, async () => {
                          await api('device-rename', { id: d.id, name })
                          await load()
                        })
                      }}
                    >
                      <FaPen aria-hidden="true" /> Rename
                    </Button>
                    <Button
                      variant="danger"
                      disabled={!codeReady || devices.length < 2}
                      title={devices.length < 2 ? 'The only phone cannot be removed — use Start over instead.' : undefined}
                      busy={busy === `remove-${d.id}`}
                      onClick={() => {
                        if (!window.confirm(`Remove ${d.name}? Its codes stop working at once.`)) return
                        run(`remove-${d.id}`, async () => {
                          await api('device-remove', { id: d.id, code })
                          setCode('')
                          setDone(`${d.name} was removed.`)
                          await load()
                        })
                      }}
                    >
                      <FaTrash aria-hidden="true" /> Remove
                    </Button>
                  </span>
                </li>
              ))}
            </ul>

            {full ? (
              <p className="mt-4 text-sm text-ink-600">All {max} places are in use. Remove a phone to add a different one.</p>
            ) : (
              <form
                className="mt-4 flex flex-wrap items-end gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  run('add', async () => {
                    const d = await api('device-add-start', { code, name: newName })
                    setCode('')
                    setAdding(d)
                  })
                }}
              >
                <label className="min-w-[12rem] flex-1">
                  <span className="block text-[0.8rem] font-semibold text-ink-700">New phone’s name</span>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value.slice(0, 40))}
                    className={inputCls}
                    placeholder="e.g. Dad’s phone"
                  />
                </label>
                <Button type="submit" variant="brand" busy={busy === 'add'} disabled={!codeReady || !newName.trim()}>
                  <FaPlus aria-hidden="true" /> Add a phone
                </Button>
              </form>
            )}
          </Card>

          <Card title="Actions that need a code" subtitle="Uses the code typed above.">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 p-3">
                <p className="text-sm text-ink-700">Make new recovery codes (the old ones stop working).</p>
                <Button
                  variant="ghost"
                  disabled={!codeReady}
                  busy={busy === 'codes'}
                  onClick={() => run('codes', async () => setCodes((await api('security-recovery', { code })).recoveryCodes))}
                >
                  <FaKey aria-hidden="true" /> New codes
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50/40 p-3">
                <p className="text-sm text-ink-700">
                  <strong>Start over.</strong> Removes every phone and signs everyone out; the next sign-in sets up a phone again.
                </p>
                <Button
                  variant="danger"
                  disabled={!codeReady}
                  busy={busy === 'reset'}
                  onClick={() => {
                    if (!window.confirm('Remove every authenticator phone and sign everyone out? The next sign-in sets up a phone again.')) return
                    run('reset', async () => {
                      await api('security-reset', { code })
                      onSignedOut()
                    })
                  }}
                >
                  Start over
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Sign out everywhere" subtitle="Every browser signed in to the console, including this one, is signed out at once.">
            <Button
              variant="primary"
              busy={busy === 'all'}
              onClick={() =>
                run('all', async () => {
                  await api('security-signout-all', {})
                  onSignedOut()
                })
              }
            >
              <FaRightFromBracket aria-hidden="true" /> Sign out every device
            </Button>
          </Card>
        </div>
      </div>
    </>
  )
}

export default Security
