// Admin sign-in.
//  - DATABASE mode: Supabase Auth (email + password, verified by the server); only users listed in the
//    `admins` table get in (see backend/database/schema.sql).
//  - PREVIEW mode: username + a SHA-256 hash from .env.local (`npm run admin:password -- "…"`). This runs in the
//    browser, so it only keeps casual visitors out.
import { hasBackend } from '../lib/backend'

const USER = import.meta.env.VITE_ADMIN_USER || 'admin'
const HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH || ''
const KEY = 'kridhya-admin-session'
const LOCK = 'kridhya-admin-lock'
const HOURS = 8
const MAX_TRIES = 5
const LOCK_MS = 60_000

export const usesEmail = hasBackend
export const isConfigured = () => hasBackend || /^[a-f0-9]{64}$/.test(HASH)
const remote = () => import('./remote')

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const read = (store, k) => { try { return JSON.parse(store.getItem(k)) } catch { return null } }
const write = (store, k, v) => { try { store.setItem(k, JSON.stringify(v)) } catch { /* storage blocked */ } }
const remove = (k) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k) } catch { /* ignore */ } }

// Synchronous check for preview mode; database mode resolves asynchronously.
export async function getSession() {
  if (hasBackend) return (await remote()).getSession().catch(() => null)
  const s = read(localStorage, KEY) || read(sessionStorage, KEY)
  if (!s || s.exp < Date.now() || s.user !== USER) return null
  return s
}

export function lockedFor() {
  const l = read(localStorage, LOCK)
  return l?.until > Date.now() ? l.until - Date.now() : 0
}

function failed() {
  const l = read(localStorage, LOCK) || { tries: 0 }
  const tries = (l.until && l.until < Date.now() ? 0 : l.tries) + 1
  write(localStorage, LOCK, tries >= MAX_TRIES ? { tries: 0, until: Date.now() + LOCK_MS } : { tries })
  return tries >= MAX_TRIES
}

export async function signIn(user, password, remember) {
  const wait = lockedFor()
  if (wait) return { error: `Too many attempts. Try again in ${Math.ceil(wait / 1000)} seconds.` }
  if (hasBackend) {
    const res = await (await remote()).signIn(user, password)
    if (res.error && failed()) return { error: 'Too many attempts. Sign-in is paused for one minute.' }
    if (!res.error) remove(LOCK)
    return res
  }
  if (!isConfigured()) {
    return { error: HASH ? 'The admin login on this build is set up incorrectly: VITE_ADMIN_PASSWORD_HASH must be the 64-character hash, not the password itself.' : 'The admin login has not been set up yet. Run npm run admin:password on the project, then restart.' }
  }
  const ok = user.trim().toLowerCase() === USER.toLowerCase() && (await sha256(`kridhya-admin:${password}`)) === HASH
  if (!ok) return { error: failed() ? 'Too many attempts. Sign-in is paused for one minute.' : 'That username or password is not right.' }
  remove(LOCK)
  const session = { user: USER, exp: Date.now() + (remember ? 30 * 24 : HOURS) * 3600_000 }
  write(remember ? localStorage : sessionStorage, KEY, session)
  return { session }
}

// step 2 (database mode): the 6-digit code emailed after the password
export async function verifyCode(code) {
  const res = await (await remote()).verifyCode(code)
  if (!res.error) remove(LOCK)
  return res
}
export const resendCode = async () => (await remote()).resendCode()

export async function signOut() {
  remove(KEY)
  if (hasBackend) await (await remote()).signOut()
}
