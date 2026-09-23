import { useMemo, useState } from 'react'
import qrcode from 'qrcode-generator'
import { FaShieldHalved, FaLock, FaMobileScreenButton, FaKey, FaCopy, FaDownload } from 'react-icons/fa6'
import { api } from './api'
import { Button, Notice, inputCls } from './ui'

/**
 * Signing in: password, then a code from an authenticator app.
 *
 * The first time — before any authenticator exists — the password leads into
 * setting one up: scan a QR code with Google Authenticator (or any TOTP app),
 * type the code it shows to prove it worked, and save ten one-time recovery
 * codes for the day the phone is lost. After that, every sign-in needs both.
 */

function Frame({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 bg-[radial-gradient(ellipse_at_top,rgba(255,212,0,0.10),transparent_60%)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <img src="/tdp-emblem.png" alt="" className="h-11 w-11 rounded-lg" />
          <div className="leading-tight">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand-400">Office Console</p>
            <p className="font-display text-lg font-bold text-white">Talikota Hari Krishna</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-7 shadow-2xl sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-900 text-brand-400">
              <Icon aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-lg font-bold text-ink-950">{title}</h1>
              {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
            </div>
          </div>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-white/40">
          Private to the office. Every sign-in and every change is recorded in the activity log.
        </p>
      </div>
    </div>
  )
}

function CodeInput({ value, onChange, recovery, autoFocus = true }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(recovery ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 6))}
      inputMode={recovery ? 'text' : 'numeric'}
      autoComplete="one-time-code"
      autoFocus={autoFocus}
      placeholder={recovery ? 'xxxxx-xxxxx' : '123456'}
      aria-label={recovery ? 'Recovery code' : 'Six-digit code'}
      className={`${inputCls} text-center font-mono text-2xl tracking-[0.3em]`}
    />
  )
}

function RecoveryCodes({ codes, onDone }) {
  const [saved, setSaved] = useState(false)
  const text = `Talikota Hari Krishna — Office Console recovery codes\nEach code works once. Keep them somewhere safe, away from the phone.\n\n${codes.join('\n')}\n`
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'office-console-recovery-codes.txt'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
  return (
    <div className="space-y-5">
      <Notice tone="warn">
        If the phone with the authenticator is lost, one of these codes gets you in. <strong>Each works once.</strong> They are
        shown only now — save them before continuing.
      </Notice>
      <ol className="grid grid-cols-2 gap-2 rounded-lg bg-ink-50 p-4 font-mono text-sm text-ink-900">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => navigator.clipboard?.writeText(text)}>
          <FaCopy aria-hidden="true" /> Copy
        </Button>
        <Button variant="ghost" onClick={download}>
          <FaDownload aria-hidden="true" /> Download
        </Button>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-ink-700">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="h-4 w-4" />
        I have saved these codes somewhere safe
      </label>
      <Button variant="brand" className="w-full" disabled={!saved} onClick={onDone}>
        Open the console
      </Button>
    </div>
  )
}

export { RecoveryCodes }

const SignIn = ({ stage, onStage }) => {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [enrol, setEnrol] = useState(null) // {secret, uri}
  const [codes, setCodes] = useState(null)

  const qrSrc = useMemo(() => {
    if (!enrol?.uri) return null
    const qr = qrcode(0, 'M')
    qr.addData(enrol.uri)
    qr.make()
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr.createSvgTag({ cellSize: 6, margin: 3, scalable: true }))}`
  }, [enrol])

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (codes) {
    return (
      <Frame icon={FaKey} title="Save your recovery codes" subtitle="The authenticator is set up.">
        <RecoveryCodes codes={codes} onDone={() => onStage('full')} />
      </Frame>
    )
  }

  if (stage === 'mfa') {
    return (
      <Frame icon={FaMobileScreenButton} title="Enter your code" subtitle="From the authenticator app on your phone.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(async () => {
              const d = await api('verify', { code })
              onStage(d.stage)
            })
          }}
          className="space-y-4"
        >
          <CodeInput value={code} onChange={setCode} recovery={useRecovery} />
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" variant="primary" className="w-full" busy={busy} disabled={useRecovery ? code.length < 10 : code.length !== 6}>
            Verify and sign in
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="font-medium text-ink-600 underline-offset-2 hover:underline"
              onClick={() => {
                setUseRecovery((v) => !v)
                setCode('')
              }}
            >
              {useRecovery ? 'Use the authenticator code' : 'Lost your phone? Use a recovery code'}
            </button>
            <button type="button" className="text-ink-400 hover:text-ink-700" onClick={() => run(async () => onStage((await api('logout', {})).stage))}>
              Start over
            </button>
          </div>
        </form>
      </Frame>
    )
  }

  if (stage === 'enroll') {
    return (
      <Frame icon={FaShieldHalved} title="Set up two-step sign-in" subtitle="One time only. Takes a minute.">
        {!enrol ? (
          <div className="space-y-4 text-sm leading-relaxed text-ink-700">
            <p>
              From now on, signing in needs the password <em>and</em> a six-digit code from an authenticator app on your phone — so a
              leaked password alone cannot get into the panel.
            </p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Install <strong>Google Authenticator</strong> (or Microsoft Authenticator) on your phone.</li>
              <li>Press the button below and scan the QR code with the app.</li>
              <li>Type the six-digit code the app shows.</li>
            </ol>
            {error && <Notice tone="error">{error}</Notice>}
            <Button variant="brand" className="w-full" busy={busy} onClick={() => run(async () => setEnrol(await api('enroll-start', {})))}>
              Show the QR code
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              run(async () => {
                const d = await api('enroll-confirm', { code })
                setCodes(d.recoveryCodes)
              })
            }}
            className="space-y-4"
          >
            <div className="flex justify-center rounded-xl bg-white p-2 ring-1 ring-ink-100">
              {qrSrc && <img src={qrSrc} alt="QR code for the authenticator app" className="h-56 w-56" />}
            </div>
            <details className="text-xs text-ink-500">
              <summary className="cursor-pointer font-medium text-ink-600">Can’t scan? Enter this key instead</summary>
              <p className="mt-2 break-all rounded bg-ink-50 p-2 font-mono text-[0.8rem] text-ink-800">{enrol.secret.replace(/(.{4})/g, '$1 ').trim()}</p>
            </details>
            <p className="text-sm text-ink-700">Now type the six-digit code the app shows:</p>
            <CodeInput value={code} onChange={setCode} />
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" variant="primary" className="w-full" busy={busy} disabled={code.length !== 6}>
              Confirm and finish
            </Button>
          </form>
        )}
      </Frame>
    )
  }

  return (
    <Frame icon={FaLock} title="Sign in" subtitle="Office use only.">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run(async () => {
            const d = await api('login', { id, password })
            setPassword('')
            onStage(d.stage)
          })
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="admin-id" className="block text-[0.8rem] font-semibold text-ink-700">
            Admin ID
          </label>
          <input id="admin-id" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" autoFocus className={inputCls} required />
        </div>
        <div>
          <label htmlFor="admin-password" className="block text-[0.8rem] font-semibold text-ink-700">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={inputCls}
            required
          />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" variant="primary" className="w-full" busy={busy}>
          Continue
        </Button>
      </form>
    </Frame>
  )
}

export default SignIn
