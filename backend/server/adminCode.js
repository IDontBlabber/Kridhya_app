// Admin sign-in, step 2: a one-time 6-digit code emailed after the password (see 005_admin_login_code.sql).
// The code is tied to the sign-in session (session_id in the user's token), stored only as a hash,
// expires after 10 minutes and allows 5 tries.
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { config, mailLive } from './config.js'
import { currentUser, insert, select } from './db.js'
import { adminCodeEmail, sendEmail } from './email.js'

const CODE_MINUTES = 10
const MAX_TRIES = 5
const RESEND_SECONDS = 45

export class CodeError extends Error {}

const hash = (code, sessionId) => createHash('sha256').update(`${config.supabaseSecret}:${sessionId}:${code}`).digest('hex')
const del = (path) => fetch(`${config.supabaseUrl}/rest/v1/${path}`, { method: 'DELETE', headers: { apikey: config.supabaseSecret, ...(config.supabaseSecret.startsWith('eyJ') ? { Authorization: `Bearer ${config.supabaseSecret}` } : {}) } })

// signed-in user + the session id from their (already verified) token
async function who(request) {
  const user = await currentUser(request)
  if (!user) throw new CodeError('Please sign in again.')
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  let sessionId = ''
  try { sessionId = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).session_id || '' } catch { /* malformed */ }
  if (!sessionId) throw new CodeError('Please sign in again.')
  const admin = (await select(`admins?user_id=eq.${encodeURIComponent(user.id)}&select=user_id`)).length > 0
  if (!admin) throw new CodeError('This account is not an admin.')
  return { user, sessionId }
}

const mask = (email) => email.replace(/^(.{2})[^@]*(@.*)$/, (_, a, b) => `${a}•••${b}`)

export async function sendCode(request) {
  const { user, sessionId } = await who(request)
  if (!mailLive()) throw new CodeError('Email sending is not set up (BREVO_API_KEY / MAIL_FROM_EMAIL), so the login code cannot be sent.')
  const [prev] = await select(`admin_login_codes?session_id=eq.${sessionId}&select=sent_at`)
  if (prev && Date.now() - new Date(prev.sent_at).getTime() < RESEND_SECONDS * 1000) {
    throw new CodeError(`A code was just sent. Please wait ${RESEND_SECONDS} seconds before asking for a new one.`)
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await insert('admin_login_codes', {
    session_id: sessionId, user_id: user.id, code_hash: hash(code, sessionId), attempts: 0,
    expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(), sent_at: new Date().toISOString(),
  }, { upsert: true })
  const { subject, html } = adminCodeEmail(code, CODE_MINUTES)
  await sendEmail({ to: user.email, subject, html })
  return { sent: true, to: mask(user.email) }
}

export async function verifyCode(request, code) {
  const { user, sessionId } = await who(request)
  const clean = String(code || '').replace(/\D/g, '')
  const [row] = await select(`admin_login_codes?session_id=eq.${sessionId}&select=*`)
  if (!row) throw new CodeError('No code is waiting for this sign-in. Please send a new code.')
  if (new Date(row.expires_at).getTime() < Date.now()) throw new CodeError('This code has expired. Please send a new code.')
  if (row.attempts >= MAX_TRIES) throw new CodeError('Too many wrong codes. Please sign in again.')
  const a = Buffer.from(hash(clean, sessionId)); const b = Buffer.from(row.code_hash)
  if (clean.length !== 6 || a.length !== b.length || !timingSafeEqual(a, b)) {
    await fetch(`${config.supabaseUrl}/rest/v1/admin_login_codes?session_id=eq.${sessionId}`, {
      method: 'PATCH',
      headers: { apikey: config.supabaseSecret, ...(config.supabaseSecret.startsWith('eyJ') ? { Authorization: `Bearer ${config.supabaseSecret}` } : {}), 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempts: row.attempts + 1 }),
    })
    const left = MAX_TRIES - row.attempts - 1
    throw new CodeError(left > 0 ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong codes. Please sign in again.')
  }
  await insert('admin_verified_sessions', { session_id: sessionId, user_id: user.id, verified_at: new Date().toISOString() }, { upsert: true })
  await del(`admin_login_codes?session_id=eq.${sessionId}`)
  return { verified: true, email: user.email }
}

// For server routes: an admin whose current sign-in session passed the code check (last 12 hours).
export async function verifiedAdmin(request) {
  try {
    const { user, sessionId } = await who(request)
    const since = new Date(Date.now() - 12 * 3600_000).toISOString()
    const ok = (await select(`admin_verified_sessions?session_id=eq.${sessionId}&user_id=eq.${user.id}&verified_at=gt.${since}&select=session_id`)).length > 0
    return ok ? user : null
  } catch {
    return null
  }
}
