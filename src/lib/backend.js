// Supabase connection for the public site. Uses plain fetch against Supabase's REST API so shoppers don't
// download the full client library (the admin portal loads @supabase/supabase-js separately).
// Configure with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (new 'sb_publishable_…' key; the legacy
// VITE_SUPABASE_ANON_KEY also works) - .env.local locally, Vercel environment variables in production.
// Without them the site runs in preview mode: shipped catalogue + browser-only admin.

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const hasBackend = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

// New publishable keys go in the apikey header only (they aren't JWTs); legacy anon JWTs also go in Authorization.
const headers = () => ({ apikey: SUPABASE_ANON_KEY, ...(SUPABASE_ANON_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } : {}), 'Content-Type': 'application/json' })

export async function rest(path, { timeout = 8000 } = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers(), signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

// Call a database function. Errors raised in SQL come back as { message } - surfaced as Error.message.
export async function rpc(fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(), body: JSON.stringify(args) })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`)
  return body
}
