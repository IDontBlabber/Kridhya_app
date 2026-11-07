// GET /api/cron/daily - run by Vercel Cron (see vercel.json). Vercel sends Authorization: Bearer <CRON_SECRET>.
//  1. cancels online orders left unpaid and releases their stock
//  2. pulls courier status for shipped orders (safety net if a Shiprocket webhook was missed)
import { config, serverReady, shiprocketLive } from '../../backend/server/config.js'
import { rpc, select } from '../../backend/server/db.js'
import { json } from '../../backend/server/http.js'
import { syncTracking } from '../../backend/server/orders.js'

export async function GET(request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return json({ error: 'unauthorized' }, 401)
  if (!serverReady()) return json({ error: 'server not configured' }, 503)
  const expired = await rpc('expire_unpaid_orders', { p_minutes: config.unpaidHoldMinutes }).catch((e) => `error: ${e.message}`)
  const synced = []
  if (shiprocketLive()) {
    const open = await select("orders?select=id,order_no&awb=not.is.null&status=in.(packed,shipped,out_for_delivery)&order=updated_at.asc&limit=25")
    for (const o of open) {
      try {
        synced.push({ order: o.order_no, ...(await syncTracking(o.id)) })
      } catch (e) {
        synced.push({ order: o.order_no, error: e.message })
      }
    }
  }
  return json({ ok: true, expired, synced })
}
