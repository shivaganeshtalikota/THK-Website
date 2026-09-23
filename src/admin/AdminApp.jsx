import { useCallback, useEffect, useState } from 'react'
import { api, onSignedOut } from './api'
import SignIn from './SignIn'
import Shell from './Shell'

/**
 * The gate. Asks the server where this browser stands — signed out, half-way
 * through signing in, or in — and shows the sign-in steps until the answer is
 * "in". The answer always comes from the server: nothing in the browser can
 * decide it is signed in, because the session cookie is HttpOnly and the API
 * checks it on every request regardless of what this screen shows.
 */
const AdminApp = () => {
  const [stage, setStage] = useState('checking')

  const check = useCallback(() => {
    api('session')
      .then((d) => setStage(d.stage || 'none'))
      .catch(() => setStage('none'))
  }, [])

  useEffect(check, [check])
  useEffect(() => onSignedOut(() => setStage('none')), [])

  if (stage === 'checking') {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/20 border-t-brand-500" aria-label="Loading" />
      </div>
    )
  }
  if (stage !== 'full') return <SignIn stage={stage} onStage={setStage} />
  return <Shell onSignedOut={() => setStage('none')} />
}

export default AdminApp
