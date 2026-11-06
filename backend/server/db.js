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
export const addEvent = (orderId, status, note) => call('order_events', { method: 'POST', body: JSON.stringify({ order_id: orderId, status, note }) })

export async function getOrder(filter) {
  const rows = await select(`orders?${filter}&select=*&limit=1`)
  return rows[0] || null
}

// Admin check for requests from the dashboard: verify the signed-in user's access token with Supabase Auth,
// then confirm the user is listed in public.admins.
export async function requireAdmin(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return false
  const res = await fetch(`${config.supabaseUrl}/auth/v1/user`, { headers: { apikey: config.supabaseSecret, Authorization: `Bearer ${token}` } })
  if (!res.ok) return false
  const user = await res.json()
  if (!user?.id) return false
  const rows = await select(`admins?user_id=eq.${encodeURIComponent(user.id)}&select=user_id`)
  return rows.length > 0
}
