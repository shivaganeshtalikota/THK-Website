import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * The credential check shared by every admin endpoint.
 *
 * Extracted, not rewritten. It was living inside api/publish.js and a second
 * endpoint needed it — and a second copy of an authentication check is how one
 * of them quietly ends up weaker than the other, usually the one nobody
 * remembers to update. There is one implementation and both import it.
 *
 * WHAT IT DOES, AND WHAT IT DOES NOT
 *
 * Comparison is over SHA-256 digests with timingSafeEqual, so a wrong password
 * takes the same time as a right one AND the two inputs are the same length —
 * timingSafeEqual throws on a length mismatch, which would otherwise leak the
 * password's length through an exception.
 *
 * Brute-force resistance is deliberately modest and it is worth being honest
 * about why. There is no shared store — serverless instances do not see each
 * other — so this is not a true global rate limit. It does two useful things:
 *
 *  1. Every REJECTED attempt costs a fixed second. Credential stuffing depends
 *     on volume; at one second per try a strong password is out of reach, and
 *     somebody who fat-fingers their own password never notices.
 *  2. A per-instance counter locks an address out for fifteen minutes after ten
 *     failures, which stops one warm instance being hammered.
 *
 * Neither replaces a long random ADMIN_PASSWORD, which is what actually guards
 * this. These endpoints commit to the repository, which auto-deploys — the
 * password is the difference between an office tool and a way to publish
 * anything at all to a politician's live site.
 */

const ATTEMPTS = new Map()
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 10

export const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress ||
  'unknown'

export const passwordOk = (given, expected) => {
  if (typeof given !== 'string' || !expected) return false
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

export const lockedOut = (ip) => {
  const rec = ATTEMPTS.get(ip)
  if (!rec) return false
  if (Date.now() - rec.first > WINDOW_MS) {
    ATTEMPTS.delete(ip)
    return false
  }
  return rec.count >= MAX_FAILURES
}

export const noteFailure = (ip) => {
  const rec = ATTEMPTS.get(ip)
  if (!rec || Date.now() - rec.first > WINDOW_MS) ATTEMPTS.set(ip, { count: 1, first: Date.now() })
  else rec.count += 1
}

export const clearFailures = (ip) => ATTEMPTS.delete(ip)

export const penalty = () => new Promise((r) => setTimeout(r, 1000))

/**
 * Check a request's credentials end to end.
 *
 * Returns null when the caller is authorised, or a {status, error} to send back.
 * Written as one call so an endpoint cannot accidentally do half of it — the
 * lockout check, the comparison, the failure note and the penalty all belong
 * together, and the original code had them as four separate steps a new
 * endpoint could get subtly wrong.
 */
export async function requireAdmin(req, { adminId, password }) {
  const { ADMIN_PASSWORD, ADMIN_ID } = process.env
  if (!ADMIN_PASSWORD) {
    return { status: 500, error: 'Server is not configured. ADMIN_PASSWORD must be set in Vercel.' }
  }

  const ip = clientIp(req)
  if (lockedOut(ip)) {
    await penalty()
    return { status: 429, error: 'Too many attempts. Try again in fifteen minutes.' }
  }

  // ADMIN_ID is optional: when it is set in the environment it must match, so
  // the panel needs both halves.
  if ((ADMIN_ID && !passwordOk(adminId, ADMIN_ID)) || !passwordOk(password, ADMIN_PASSWORD)) {
    noteFailure(ip)
    await penalty()
    return { status: 401, error: 'Wrong ID or password.' }
  }

  clearFailures(ip)
  return null
}
