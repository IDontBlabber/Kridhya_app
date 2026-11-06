// POST /api/webhooks/razorpay - Razorpay calls this when a payment is captured, so an order is confirmed even if
// the shopper closed the tab before the checkout page could verify it. Set up in Razorpay Dashboard > Webhooks
// with event "payment.captured" and the secret in RAZORPAY_WEBHOOK_SECRET.
import { confirmPayment } from '../../backend/server/checkout.js'
import { json } from '../../backend/server/http.js'
import { verifyWebhookSignature } from '../../backend/server/razorpay.js'

export async function POST(request) {
  const raw = await request.text()
  if (!verifyWebhookSignature(raw, request.headers.get('x-razorpay-signature'))) return json({ error: 'invalid signature' }, 401)
  let event
  try {
    event = JSON.parse(raw)
  } catch {
    return json({ ok: true })
  }
  const p = event?.payload?.payment?.entity
  if ((event?.event === 'payment.captured' || event?.event === 'order.paid') && p?.order_id && p?.id) {
    try {
      await confirmPayment({ razorpay_order_id: p.order_id, razorpay_payment_id: p.id }, { verified: true })
    } catch (e) {
      console.error('[razorpay webhook]', p.order_id, e.message)
    }
  }
  // always 200 so Razorpay does not keep retrying; problems are logged
  return json({ ok: true })
}
