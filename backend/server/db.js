// Supabase access for the server, using the secret key (bypasses row-level security - server only).
import { config } from './config.js'

const headers = (extra = {}) => ({
  apikey: config.supabaseSecret,
  ...(config.supabaseSecret.startsWith('eyJ') ? { Authorization: `Bearer ${config.supabaseSecret}` } : {}),
  'Content-Type': 'application/json',
  ...extra,
})

async function call(path, init = {}) {
  const res = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, { ...init, headers: headers(init.headers) })
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error(body?.message || `Database error ${res.status}`)
    err.status = res.status
    throw err
  }
  return body
}

export const rpc = (fn, args = {}) => call(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) })
export const select = (path) => call(path)
export const update = (table, filter, patch) =>
  call(`${table}?${filter}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }) })
export const insert = (table, row, { upsert = false } = {}) =>
  call(table, { method: 'POST', headers: upsert ? { Prefer: 'resolution=merge-duplicates' } : {}, body: JSON.stringify(row) })
export const addEvent = (orderId, status, note) => call('order_events', { method: 'POST', body: JSON.stringify({ order_id: orderId, status, note }) })

export async function getOrder(filter) {
  const rows = await select(`orders?${filter}&select=*&limit=1`)
  return rows[0] || null
}

// The signed-in user behind a request (Authorization: Bearer <access token>), verified with Supabase Auth.
export async function currentUser(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const res = await fetch(`${config.supabaseUrl}/auth/v1/user`, { headers: { apikey: config.supabaseSecret, Authorization: `Bearer ${token}` } })
  if (!res.ok) return null
  const user = await res.json()
  return user?.id ? user : null
}

// Admin check for requests from the dashboard: a verified user who is listed in public.admins.
export async function requireAdmin(request) {
  const user = await currentUser(request)
  if (!user) return false
  const rows = await select(`admins?user_id=eq.${encodeURIComponent(user.id)}&select=user_id`)
  return rows.length > 0
}

// Small server-only key/value store (public.integration_state - row-level security on, no policies).
export async function getState(key) {
  const rows = await select(`integration_state?key=eq.${encodeURIComponent(key)}&select=value`)
  return rows[0]?.value ?? null
}
export const setState = (key, value) =>
  call('integration_state', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }) })
export const clearState = (key) => call(`integration_state?key=eq.${encodeURIComponent(key)}`, { method: 'DELETE' })
