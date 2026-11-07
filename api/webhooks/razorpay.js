// POST /api/webhooks/razorpay - Razorpay events. Razorpay Dashboard > Webhooks:
//   URL https://<site>/api/webhooks/razorpay, secret = RAZORPAY_WEBHOOK_SECRET,
//   events: payment.captured, payment.failed, order.paid, refund.created, refund.processed, refund.failed
// Each event is stored once (by x-razorpay-event-id) - Razorpay's retries and replays are ignored.
import { confirmPayment, recordFailure } from '../../backend/server/checkout.js'
import { serverReady } from '../../backend/server/config.js'
import { getOrder, insert } from '../../backend/server/db.js'
import { json } from '../../backend/server/http.js'
import { syncRefund } from '../../backend/server/orders.js'
import { verifyWebhookSignature } from '../../backend/server/razorpay.js'
import { config } from '../../backend/server/config.js'

// Browser visit / reachability check (Razorpay itself only POSTs). Shows whether the secret is set - never the secret.
export const GET = () => json({ ok: true, service: 'kridhya-razorpay-webhook', ready: serverReady(), secretSet: !!config.razorpay.webhookSecret })

export async function POST(request) {
  const raw = await request.text()
  if (!verifyWebhookSignature(raw, request.headers.get('x-razorpay-signature'))) return json({ error: 'invalid signature' }, 401)
  if (!serverReady()) return json({ ok: true, saved: false })
  let event
  try {
    event = JSON.parse(raw)
  } catch {
    return json({ ok: true })
  }
  const type = event?.event || ''
  const pay = event?.payload?.payment?.entity
  const refund = event?.payload?.refund?.entity
  const eventId = request.headers.get('x-razorpay-event-id') || `${type}:${pay?.id || refund?.id || ''}:${event?.created_at || ''}`

  // de-duplicate + audit trail
  try {
    const order = pay?.order_id ? await getOrder(`razorpay_order_id=eq.${encodeURIComponent(pay.order_id)}`) : refund?.payment_id ? await getOrder(`razorpay_payment_id=eq.${encodeURIComponent(refund.payment_id)}`) : null
    await insert('payment_events', { event_id: eventId, order_id: order?.id || null, type, payment_id: pay?.id || refund?.payment_id || null, amount_paise: pay?.amount ?? refund?.amount ?? null, payload: event })
  } catch (e) {
    if (e.status === 409 || /duplicate/i.test(e.message)) return json({ ok: true, duplicate: true })
    console.warn('[razorpay webhook] could not store event', e.message)
  }

  try {
    if ((type === 'payment.captured' || type === 'order.paid') && pay?.order_id && pay?.id) {
      await confirmPayment({ razorpay_order_id: pay.order_id, razorpay_payment_id: pay.id }, { verified: true })
    } else if (type === 'payment.failed' && pay?.order_id) {
      await recordFailure(pay)
    } else if (type.startsWith('refund.') && refund?.id) {
      await syncRefund(refund, type)
    }
  } catch (e) {
    console.error('[razorpay webhook]', type, e.message)
  }
  // always 200 so Razorpay does not keep retrying; problems are logged and on the order timeline
  return json({ ok: true })
}
