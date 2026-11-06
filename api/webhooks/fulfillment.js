// POST /api/webhooks/fulfillment - Shiprocket shipment status updates (AWB assigned, picked up, in transit, delivered, RTO…).
// The address must not contain the word "shiprocket" (Shiprocket rejects such webhook URLs).
// Set up in Shiprocket > Settings > API > Webhooks with the token in SHIPROCKET_WEBHOOK_TOKEN (sent as x-api-key).
//
// Shiprocket's "Test Webhook" and its live updates need a quick 200 OK - otherwise it reports the endpoint as
// unreachable and may switch the webhook off. So this always answers 200 (except for a wrong token), and logs
// anything it could not process instead of failing the request.
import { config, serverReady } from '../../backend/server/config.js'
import { addEvent, getOrder, update } from '../../backend/server/db.js'
import { json, readJson } from '../../backend/server/http.js'
import { STATUS_MAP, trackingUrl } from '../../backend/server/shiprocket.js'

const FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']
const canMove = (from, to) => to === 'returned' || to === 'cancelled' || FLOW.indexOf(to) > FLOW.indexOf(from)

const ping = () => json({ ok: true, service: 'kridhya-fulfillment-webhook', ready: serverReady() })
export const GET = ping
export const HEAD = () => new Response(null, { status: 200 })
export const OPTIONS = () => new Response(null, { status: 200, headers: { Allow: 'GET, HEAD, POST, OPTIONS' } })

export async function POST(request) {
  const token = config.shiprocket.webhookToken
  if (token && request.headers.get('x-api-key') !== token) return json({ error: 'unauthorized' }, 401)
  const p = await readJson(request)

  if (!serverReady()) {
    console.warn('[fulfillment webhook] received but SUPABASE_SECRET_KEY is not set - update not saved', p?.awb, p?.current_status)
    return json({ ok: true, saved: false })
  }

  try {
    const awb = String(p.awb || '').trim()
    const raw = String(p.current_status || p.shipment_status || '').trim().toLowerCase()
    if (!raw) return json({ ok: true })

    const order =
      (awb && (await getOrder(`awb=eq.${encodeURIComponent(awb)}`))) ||
      (p.order_id && (await getOrder(`order_no=eq.${encodeURIComponent(p.order_id)}`))) ||
      (p.sr_order_id && (await getOrder(`shiprocket_order_id=eq.${encodeURIComponent(p.sr_order_id)}`)))
    if (!order) return json({ ok: true, matched: false }) // e.g. Shiprocket's test payload

    const patch = {}
    if (awb && order.awb !== awb) Object.assign(patch, { awb, tracking_no: awb, tracking_url: trackingUrl(awb), ...(p.courier_name ? { courier: p.courier_name } : {}) })
    const next = STATUS_MAP[raw]
    if (next && next !== order.status && canMove(order.status, next)) patch.status = next
    if (Object.keys(patch).length) await update('orders', `id=eq.${order.id}`, patch)
    const where = p.current_location || p.city
    await addEvent(order.id, patch.status || order.status, `Courier: ${p.current_status || p.shipment_status}${where ? ` - ${where}` : ''}`)
    return json({ ok: true, matched: true })
  } catch (e) {
    console.error('[fulfillment webhook] could not process update', p?.awb, e.message)
    return json({ ok: true, saved: false })
  }
}
