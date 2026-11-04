// Admin sign-in for the preview portal. The username and a SHA-256 hash of the password come from .env.local
// (set with `npm run admin:password -- "new password"`); the password itself is never in the code or the bundle.
// NOTE: this gate runs in the browser, so it keeps casual visitors out but is not server-grade security.
// SUPABASE: replace signIn/signOut/getSession with supabase.auth.signInWithPassword / signOut / getSession.

const USER = import.meta.env.VITE_ADMIN_USER || 'admin'
const HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH || ''
const KEY = 'kridhya-admin-session'
const LOCK = 'kridhya-admin-lock'
const HOURS = 8
const MAX_TRIES = 5
const LOCK_MS = 60_000

export const isConfigured = () => !!HASH

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const read = (store, k) => { try { return JSON.parse(store.getItem(k)) } catch { return null } }
const write = (store, k, v) => { try { store.setItem(k, JSON.stringify(v)) } catch { /* storage blocked */ } }
const remove = (k) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k) } catch { /* ignore */ } }

export function getSession() {
  const s = read(localStorage, KEY) || read(sessionStorage, KEY)
  if (!s || s.exp < Date.now() || s.user !== USER) return null
  return s
}

export function lockedFor() {
  const l = read(localStorage, LOCK)
  return l?.until > Date.now() ? l.until - Date.now() : 0
}

export async function signIn(user, password, remember) {
  if (!isConfigured()) return { error: 'The admin login has not been set up yet. Run npm run admin:password on the project, then restart.' }
  const wait = lockedFor()
  if (wait) return { error: `Too many attempts. Try again in ${Math.ceil(wait / 1000)} seconds.` }
  const ok = user.trim().toLowerCase() === USER.toLowerCase() && (await sha256(`kridhya-admin:${password}`)) === HASH
  if (!ok) {
    const l = read(localStorage, LOCK) || { tries: 0 }
    const tries = (l.until && l.until < Date.now() ? 0 : l.tries) + 1
    write(localStorage, LOCK, tries >= MAX_TRIES ? { tries: 0, until: Date.now() + LOCK_MS } : { tries })
    return { error: tries >= MAX_TRIES ? 'Too many attempts. Sign-in is paused for one minute.' : 'That username or password is not right.' }
  }
  remove(LOCK)
  const session = { user: USER, exp: Date.now() + (remember ? 30 * 24 : HOURS) * 3600_000 }
  write(remember ? localStorage : sessionStorage, KEY, session)
  return { session }
}

export function signOut() {
  remove(KEY)
}
