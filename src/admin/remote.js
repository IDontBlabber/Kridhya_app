// Admin-only Supabase access (loaded on demand, so the public site never downloads @supabase/supabase-js).
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../lib/backend'

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'kridhya-admin-auth' },
})

const must = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

/* ---------- auth: password, then a one-time code emailed to the admin (backend/database/005_admin_login_code.sql) ---------- */
// true only when listed as admin AND this sign-in passed the code check
async function isAdmin() {
  const { data, error } = await sb.rpc('is_admin')
  return !error && data === true
}
async function isAdminAccount() {
  const { data, error } = await sb.rpc('is_admin_account')
  return !error && data === true
}
async function codeApi(body) {
  const token = (await sb.auth.getSession()).data.session?.access_token || ''
  const res = await fetch('/api/admin/code', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
  return data
}
export async function getSession() {
  const { data } = await sb.auth.getSession()
  if (!data.session) return null
  if (!(await isAdmin())) return null
  return { user: data.session.user.email }
}
export async function signIn(email, password) {
  // any half-finished sign-in (password done, code never entered) is closed first
  await sb.auth.signOut().catch(() => {})
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
  if (error) return { error: error.message === 'Invalid login credentials' ? 'That email or password is not right.' : error.message }
  if (!(await isAdminAccount())) {
    await sb.auth.signOut()
    return { error: 'This account is not an admin. Ask the site owner to add it in Supabase.' }
  }
  try {
    const r = await codeApi({ action: 'send' })
    return { needsCode: true, to: r.to, user: data.user.email }
  } catch (e) {
    await sb.auth.signOut()
    return { error: e.message }
  }
}
export async function resendCode() {
  try { return await codeApi({ action: 'send' }) } catch (e) { return { error: e.message } }
}
export async function verifyCode(code) {
  try {
    const r = await codeApi({ action: 'verify', code })
    return { session: { user: r.email } }
  } catch (e) {
    return { error: e.message }
  }
}
export const signOut = () => sb.auth.signOut()
export const accessToken = async () => (await sb.auth.getSession()).data.session?.access_token || ''

/* ---------- catalogue ---------- */
const fromRow = (r) => ({ ...r.data, id: r.id, slug: r.slug, status: r.status })
export async function loadCatalogue() {
  const [products, posts, popup] = await Promise.all([
    sb.from('products').select('id, slug, status, data').then(must),
    sb.from('posts').select('id, slug, status, publish_at, data').then(must),
    sb.from('settings').select('value').eq('key', 'popup').maybeSingle().then(must),
  ])
  return { products: products.map(fromRow), posts: posts.map(fromRow), popup: popup?.value || null }
}
const now = () => new Date().toISOString()
export const upsertProduct = (p) => sb.from('products').upsert({ id: p.id, slug: p.slug, status: p.status, data: p, updated_at: now() }).then(must)
export const upsertProducts = (list) => sb.from('products').upsert(list.map((p) => ({ id: p.id, slug: p.slug, status: p.status, data: p, updated_at: now() }))).then(must)
export const deleteProduct = (id) => sb.from('products').delete().eq('id', id).then(must)
const postRow = (p) => ({ id: p.id, slug: p.slug, status: p.status, publish_at: new Date(p.publishAt || p.date || Date.now()).toISOString(), data: p, updated_at: now() })
export const upsertPost = (p) => sb.from('posts').upsert(postRow(p)).then(must)
export const upsertPosts = (list) => sb.from('posts').upsert(list.map(postRow)).then(must)
export const deletePost = (id) => sb.from('posts').delete().eq('id', id).then(must)
export const savePopup = (value) => sb.from('settings').upsert({ key: 'popup', value, updated_at: now() }).then(must)

/* ---------- photos ---------- */
// Accepts a data URL (from the in-browser resizer); returns the public URL in the 'media' bucket.
export async function uploadImage(dataUrl) {
  if (!dataUrl.startsWith('data:')) return dataUrl
  const blob = await (await fetch(dataUrl)).blob()
  const path = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.webp`
  must(await sb.storage.from('media').upload(path, blob, { contentType: blob.type || 'image/webp', cacheControl: '31536000' }))
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl
}

/* ---------- orders ---------- */
export const listOrders = () => sb.from('orders').select('*').order('created_at', { ascending: false }).limit(500).then(must)
export const orderEvents = (id) => sb.from('order_events').select('*').eq('order_id', id).order('created_at').then(must)
export const setOrderStatus = (id, status, { note = '', courier = '', trackingNo = '', trackingUrl = '' } = {}) =>
  sb.rpc('set_order_status', { p_order: id, p_status: status, p_note: note, p_courier: courier, p_tracking_no: trackingNo, p_tracking_url: trackingUrl }).then(must)
export const updateOrder = (id, patch) => sb.from('orders').update({ ...patch, updated_at: now() }).eq('id', id).then(must)
// Live updates: new orders appear in the dashboard without a refresh (needs Realtime enabled on `orders`).
export function watchOrders(onChange) {
  const ch = sb.channel('orders-feed').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange).subscribe()
  return () => sb.removeChannel(ch)
}
