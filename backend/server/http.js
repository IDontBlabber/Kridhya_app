// Shared helpers for the Web-standard (Request -> Response) handlers in /api.
import { serverReady } from './config.js'

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

// Wraps a handler: user-facing errors keep their message, anything else becomes a generic 500 (details in the logs).
export const handle = (fn) => async (request) => {
  if (!serverReady()) return json({ error: 'The store server is not configured yet (SUPABASE_SECRET_KEY).' }, 503)
  try {
    return await fn(request)
  } catch (e) {
    if (e?.status && e.status < 500) return json({ error: e.message }, e.status)
    console.error('[api]', request.url, e)
    return json({ error: e?.status === 502 ? e.message : 'Something went wrong. Please try again.' }, e?.status === 502 ? 502 : 500)
  }
}
