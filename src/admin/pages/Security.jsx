import { useEffect, useState } from 'react'
import { FaShieldHalved, FaKey, FaRightFromBracket, FaMobileScreenButton } from 'react-icons/fa6'
import { api } from '../api'
import { Button, Card, Notice, PageHeader, inputCls } from '../ui'
import { fmtDate } from '../format'
import { RecoveryCodes } from '../SignIn'

/**
 * The account's protection, and the three things worth being able to do
 * about it: make new recovery codes, sign every device out, and move the
 * authenticator to a new phone. The last two need a current code from the
 * authenticator, so a session left open on a borrowed computer cannot be used
 * to take the account over.
 */
const Security = ({ onSignedOut }) => {
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(null)
  const [codes, setCodes] = useState(null)

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
    try {
      await fn()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

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

  return (
    <>
      <PageHeader title="Security" subtitle="How the console is protected, and what to do if a phone or password is lost." />
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Protection in place">
          <ul className="space-y-3 text-sm text-ink-700">
            <li className="flex gap-3">
              <FaShieldHalved className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>
                <strong>Two-step sign-in.</strong> Password, then a code from the authenticator app
                {info?.enrolledAt ? ` (set up ${fmtDate(Date.parse(info.enrolledAt))})` : ''}.
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

        <div className="space-y-6">
          <Card title="Actions that need your authenticator code">
            <label htmlFor="sec-code" className="block text-[0.8rem] font-semibold text-ink-700">
              Current six-digit code
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
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 p-3">
                <p className="text-sm text-ink-700">Make new recovery codes (the old ones stop working).</p>
                <Button
                  variant="ghost"
                  disabled={code.length !== 6}
                  busy={busy === 'codes'}
                  onClick={() => run('codes', async () => setCodes((await api('security-recovery', { code })).recoveryCodes))}
                >
                  <FaKey aria-hidden="true" /> New codes
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50/40 p-3">
                <p className="text-sm text-ink-700">
                  <strong>Move to a new phone.</strong> Removes the current authenticator and signs you out; the next sign-in sets up the new phone.
                </p>
                <Button
                  variant="danger"
                  disabled={code.length !== 6}
                  busy={busy === 'reset'}
                  onClick={() => {
                    if (!window.confirm('Remove the authenticator and sign out? You will set up the new phone at the next sign-in.')) return
                    run('reset', async () => {
                      await api('security-reset', { code })
                      onSignedOut()
                    })
                  }}
                >
                  Move authenticator
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

          <Card title="If everything is lost">
            <p className="text-sm leading-relaxed text-ink-600">
              Lost the phone <em>and</em> the recovery codes? Someone with access to the Cloudflare account can delete the object{' '}
              <code className="rounded bg-ink-100 px-1">sec/state.json</code> in the <code className="rounded bg-ink-100 px-1">thk-web</code> R2 bucket. The next
              sign-in with the password then sets up a new authenticator. To change the password itself, edit <code>ADMIN_PASSWORD</code> in Vercel and
              redeploy — that also signs everyone out.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}

export default Security
