// Customer sign-in (email + one-time code) with Supabase Auth.
// @supabase/supabase-js is loaded only when needed (checkout, account, or a returning signed-in visitor),
// so browsing the shop stays light.
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasBackend } from './backend'

const STORAGE_KEY = 'kridhya-auth'
let clientPromise

export function client() {
  if (!hasBackend) return Promise.resolve(null)
  return (clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storageKey: STORAGE_KEY },
    }),
  ))
}

// Was someone signed in on this device before? (lets us skip loading the auth library for first-time visitors)
export const hadSession = () => {
  try {
    return !!localStorage.getItem(STORAGE_KEY) || /[?&#](code|access_token)=/.test(window.location.href)
  } catch {
    return false
  }
}

export async function getUser() {
  const sb = await client()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data.session?.user || null
}

export async function onAuthChange(cb) {
  const sb = await client()
  if (!sb) return () => {}
  const { data } = sb.auth.onAuthStateChange((_e, session) => cb(session?.user || null))
  return () => data.subscription.unsubscribe()
}

// Step 1: email a 6-digit code (and a sign-in link) to the shopper.
export async function sendCode(email) {
  const sb = await client()
  const { error } = await sb.auth.signInWithOtp({
    email: email.trim(),
    options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}${window.location.pathname}` },
  })
  if (error) throw new Error(friendly(error.message))
}

// Step 2: check the code they typed.
export async function verifyCode(email, code) {
  const sb = await client()
  const { data, error } = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
  if (error) throw new Error(/expired|invalid/i.test(error.message) ? 'That code is wrong or has expired. Check the latest email, or send a new code.' : error.message)
  return data.user
}

// ── email + password ──
// Password rules (also set Supabase > Authentication > Providers > Email > minimum length 8).
export function passwordProblem(pw) {
  if (pw.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use both letters and numbers.'
  if (/^(password|12345678|qwerty)/i.test(pw)) return 'That password is too easy to guess.'
  return ''
}
const friendly = (m = '') =>
  /invalid login/i.test(m) ? 'That email or password is not right.'
    : /not confirmed/i.test(m) ? 'Please confirm your email first - check your inbox for our link (or send it again below).'
      : /already registered|already exists/i.test(m) ? 'An account with this email already exists. Sign in instead, or reset your password.'
        : /email rate limit/i.test(m) ? 'We’ve sent several emails recently, so sending is paused for a while. Please use the newest email you already received (check spam too), or try again later.'
          : /after (\d+) seconds?/i.test(m) ? `For security, please wait ${/after (\d+) seconds?/i.exec(m)[1]} seconds before asking again.`
            : /rate|too many/i.test(m) ? 'Too many attempts - please wait a few minutes and try again.'
          : /weak|pwned|leaked/i.test(m) ? 'Please choose a stronger password - this one appears in known data leaks.'
            : m

export async function signUp({ name, email, password }) {
  const sb = await client()
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/account` },
  })
  if (error) throw new Error(friendly(error.message))
  // email confirmation on: no session until they click the link. (Supabase hides "already registered" for privacy:
  // an existing email returns a user with no identities.)
  if (data.user && !data.user.identities?.length) throw new Error(friendly('already registered'))
  return { user: data.session ? data.user : null, needsConfirmation: !data.session }
}

export async function signInWithPassword(email, password) {
  const sb = await client()
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw new Error(friendly(error.message))
  return data.user
}

export async function resendConfirmation(email) {
  const sb = await client()
  const { error } = await sb.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/account` } })
  if (error) throw new Error(friendly(error.message))
}

export async function sendPasswordReset(email) {
  const sb = await client()
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/account/reset` })
  if (error) throw new Error(friendly(error.message))
}

export async function setNewPassword(password) {
  const sb = await client()
  const { error } = await sb.auth.updateUser({ password })
  if (error) throw new Error(friendly(error.message))
}

// Email links (reset password, confirm signup, magic link) use ?token_hash=…&type=… - see backend/README.md
// for the email templates. Verified here in the page, so they work in any browser / device, and email
// link scanners that pre-open links can't use them up (they don't run the page's code).
export function linkFromUrl() {
  const q = new URLSearchParams(window.location.search)
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return {
    tokenHash: q.get('token_hash'),
    type: q.get('type'),
    // Supabase reports link problems in the URL, e.g. #error_code=otp_expired
    errorCode: q.get('error_code') || h.get('error_code'),
    errorText: q.get('error_description') || h.get('error_description'),
  }
}
export async function verifyEmailLink(tokenHash, type) {
  const sb = await client()
  const { data, error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type })
  if (error) throw new Error(/expired|invalid|not found/i.test(error.message) ? 'This link has expired or was already used.' : error.message)
  // tidy the address bar so a refresh doesn't try the used token again
  window.history.replaceState(null, '', window.location.pathname)
  return data.user
}

// fires 'PASSWORD_RECOVERY' when the visitor arrives from a reset-password email
export async function onPasswordRecovery(cb) {
  const sb = await client()
  if (!sb) return () => {}
  const { data } = sb.auth.onAuthStateChange((event) => event === 'PASSWORD_RECOVERY' && cb())
  return () => data.subscription.unsubscribe()
}

export async function signOut() {
  const sb = await client()
  await sb?.auth.signOut()
}

export async function accessToken() {
  const sb = await client()
  if (!sb) return ''
  const { data } = await sb.auth.getSession()
  return data.session?.access_token || ''
}

// Data the signed-in customer owns (row-level security limits every query to their own rows).
export async function loadCart(userId) {
  const sb = await client()
  const { data } = await sb.from('carts').select('items').eq('user_id', userId).maybeSingle()
  return Array.isArray(data?.items) ? data.items : []
}
export async function saveCart(userId, items) {
  const sb = await client()
  await sb.from('carts').upsert({ user_id: userId, items, updated_at: new Date().toISOString() })
}
export async function loadProfile(userId) {
  const sb = await client()
  const { data } = await sb.from('customer_profiles').select('name, phone, address').eq('user_id', userId).maybeSingle()
  return data || null
}
export async function saveProfile(userId, profile) {
  const sb = await client()
  await sb.from('customer_profiles').upsert({ user_id: userId, ...profile, updated_at: new Date().toISOString() })
}
export async function myOrders() {
  const sb = await client()
  const { data, error } = await sb.from('orders').select('id, order_no, status, payment_status, total, refunded_amount, items, created_at, courier, tracking_url').order('created_at', { ascending: false }).limit(50)
  if (error) throw new Error(error.message)
  return data
}
