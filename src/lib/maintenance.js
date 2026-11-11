// Maintenance mode - switched on/off by the admin (Dashboard > Maintenance mode), stored in
// public.settings under key 'maintenance' as { on, message, until }.
// While it's on, visitors see the maintenance page; signed-in admins (on this browser) still see the full site
// so they can check their changes. New orders are also refused by the server (backend/server/checkout.js).
import { useEffect, useState } from 'react'
import { hasBackend, rest } from './backend'

const CACHE = 'kridhya-maintenance'
const ADMIN = 'kridhya-admin-preview'

const read = () => { try { return JSON.parse(localStorage.getItem(CACHE)) } catch { return null } }
const write = (v) => { try { localStorage.setItem(CACHE, JSON.stringify(v)) } catch { /* blocked */ } }

export const markAdminPreview = (on) => { try { on ? localStorage.setItem(ADMIN, '1') : localStorage.removeItem(ADMIN) } catch { /* blocked */ } }
const adminPreview = () => { try { return localStorage.getItem(ADMIN) === '1' } catch { return false } }

export async function fetchMaintenance() {
  if (!hasBackend) return { on: false }
  const rows = await rest('settings?select=value&key=eq.maintenance', { timeout: 5000 })
  const v = rows[0]?.value || {}
  return { on: !!v.on, message: v.message || '', until: v.until || '' }
}

// state: undefined while the very first check runs (no cached answer yet), then { on, message, until }
export function useMaintenance() {
  const [state, setState] = useState(() => (hasBackend ? read() ?? undefined : { on: false }))
  useEffect(() => {
    if (!hasBackend) return
    let alive = true
    const check = () => fetchMaintenance().then((v) => { if (alive) { setState(v); write(v) } }).catch(() => { if (alive) setState((s) => s ?? { on: false }) })
    check()
    // pick up the switch without a reload (every 2 minutes and when the tab comes back into view)
    const t = setInterval(check, 120_000)
    const vis = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', vis)
    // never hold the page blank for long if the network is slow
    const giveUp = setTimeout(() => alive && setState((s) => s ?? { on: false }), 1500)
    return () => { alive = false; clearInterval(t); clearTimeout(giveUp); document.removeEventListener('visibilitychange', vis) }
  }, [])
  return { ...(state || {}), checking: state === undefined, adminView: !!state?.on && adminPreview() }
}
