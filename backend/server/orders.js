// Order operations run on the server: stage changes (with customer emails), refunds, payment reconciliation,
// courier tracking sync. Used by the admin API, the Razorpay/Shiprocket webhooks and the daily cron.
import { addEvent, getOrder, insert, rpc, select, update } from './db.js'
import { notify } from './email.js'
import { createRefund, fetchOrderPayments, fetchPayment, capturePayment } from './razorpay.js'
import { STATUS_MAP, cancelShipment, trackAwb, trackingUrl } from './shiprocket.js'
import { shiprocketLive } from './config.js'

export class OrderError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

const FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']
export const canMove = (from, to) => to === 'returned' || to === 'cancelled' || FLOW.indexOf(to) > FLOW.indexOf(from)
const EMAIL_ON = { shipped: 'shipped', out_for_delivery: 'out_for_delivery', delivered: 'delivered', cancelled: 'cancelled' }

/** Change an order's stage, then email the customer about it. Cancelling also cancels the Shiprocket shipment. */
export async function changeStatus(orderId, status, { note = '', courier, trackingNo, trackingUrl: url, actor } = {}) {
  const o = await getOrder(`id=eq.${encodeURIComponent(orderId)}`)
  if (!o) throw new OrderError('Order not found', 404)
  if (status === 'shipped' && !(courier || o.courier)) throw new OrderError('Add the courier name before marking the order as shipped.')
  const patch = {}
  if (courier) patch.courier = courier
  if (trackingNo) Object.assign(patch, { tracking_no: trackingNo, awb: o.awb || trackingNo })
  if (url) patch.tracking_url = url
  if (Object.keys(patch).length) await update('orders', `id=eq.${o.id}`, patch)

  if (status === 'cancelled' && o.shiprocket_order_id && shiprocketLive()) {
    await cancelShipment(o.shiprocket_order_id)
      .then(() => addEvent(o.id, o.status, 'Shipment cancelled in Shiprocket'))
      .catch((e) => addEvent(o.id, o.status, `Shiprocket did not cancel the shipment: ${e.message}`))
  }
  const res = await rpc('server_set_order_status', { p_order: o.id, p_status: status, p_note: note ? `${note}${actor ? ` (${actor})` : ''}` : actor ? `by ${actor}` : null })
  if (res.from !== res.to && EMAIL_ON[status]) {
    const fresh = await getOrder(`id=eq.${o.id}`)
    await notify(EMAIL_ON[status], fresh)
  }
  return res
}

/** Refund all or part of an online payment through Razorpay. */
export async function refundOrder(orderId, { amount, reason = '', actor = 'admin' } = {}) {
  const o = await getOrder(`id=eq.${encodeURIComponent(orderId)}`)
  if (!o) throw new OrderError('Order not found', 404)
  if (o.payment_status === 'refunded') throw new OrderError('This order has already been fully refunded.')
  if (!o.razorpay_payment_id || !['paid', 'partially_refunded'].includes(o.payment_status)) {
    throw new OrderError(o.payment_status === 'cod' ? 'This is a Cash on Delivery order - refund the customer directly (UPI / bank transfer) and note it on the order.' : 'Only orders paid online can be refunded here.')
  }
  const pending = (await select(`refunds?order_id=eq.${o.id}&status=eq.pending&select=amount`)).reduce((n, r) => n + r.amount, 0)
  const refundable = o.total - o.refunded_amount - pending
  const amt = amount == null || amount === '' ? refundable : Math.round(Number(amount))
  if (!(amt > 0)) throw new OrderError('Enter a refund amount above zero.')
  if (amt > refundable) throw new OrderError(`At most ₹${refundable.toLocaleString('en-IN')} can still be refunded on this order.`)

  let rz
  try {
    rz = await createRefund(o.razorpay_payment_id, { amountPaise: amt * 100, notes: { order_no: o.order_no, reason: reason.slice(0, 200) }, receipt: `${o.order_no}-R${Date.now().toString(36)}` })
  } catch (e) {
    await addEvent(o.id, o.status, `Refund of ₹${amt} failed at Razorpay: ${e.message}`)
    throw new OrderError(`Razorpay could not start the refund: ${e.message}`, 502)
  }
  const status = rz.status === 'processed' ? 'processed' : rz.status === 'failed' ? 'failed' : 'pending'
  await insertRefund({ order_id: o.id, razorpay_refund_id: rz.id, amount: amt, status, reason, created_by: actor })
  await rpc('apply_refund_status', { p_order: o.id })
  await addEvent(o.id, o.status, `Refund of ₹${amt} ${status === 'processed' ? 'processed' : 'started'} (${rz.id})${reason ? ` - ${reason}` : ''} by ${actor}`)
  const fresh = await getOrder(`id=eq.${o.id}`)
  await notify(status === 'processed' ? 'refund_processed' : 'refund_initiated', fresh, { amount: amt })
  return { refundId: rz.id, amount: amt, status }
}

const insertRefund = (row) => insert('refunds', row, { upsert: true })

/** Razorpay refund.* webhook: create or update the refund record and the order's refund status. */
export async function syncRefund(entity, eventType) {
  const o = await getOrder(`razorpay_payment_id=eq.${encodeURIComponent(entity.payment_id)}`)
  if (!o) return { skipped: true }
  const status = eventType === 'refund.processed' ? 'processed' : eventType === 'refund.failed' ? 'failed' : 'pending'
  const existing = (await select(`refunds?razorpay_refund_id=eq.${encodeURIComponent(entity.id)}&select=status`))[0]
  if (existing?.status === status) return { unchanged: true }
  const amount = Math.round(Number(entity.amount) / 100)
  if (existing) await update('refunds', `razorpay_refund_id=eq.${encodeURIComponent(entity.id)}`, { status })
  else await insertRefund({ order_id: o.id, razorpay_refund_id: entity.id, amount, status, reason: entity.notes?.reason || 'Refunded from the Razorpay dashboard', created_by: 'razorpay' })
  await rpc('apply_refund_status', { p_order: o.id })
  await addEvent(o.id, o.status, status === 'processed' ? `Refund of ₹${amount} processed by Razorpay` : status === 'failed' ? `Refund of ₹${amount} FAILED at Razorpay - retry or refund manually` : `Refund of ₹${amount} started`)
  if (status === 'processed') await notify('refund_processed', await getOrder(`id=eq.${o.id}`), { amount })
  return { status }
}

/**
 * Fix an order stuck in "awaiting payment": ask Razorpay what happened to every attempt on it.
 * Captured -> mark paid; authorised -> capture then mark paid; otherwise report the latest failure.
 */
export async function reconcilePayment(orderId, confirm) {
  const o = await getOrder(`id=eq.${encodeURIComponent(orderId)}`)
  if (!o?.razorpay_order_id) throw new OrderError('This order has no online payment to check.')
  const attempts = await fetchOrderPayments(o.razorpay_order_id)
  let ok = attempts.find((p) => p.status === 'captured')
  const auth = !ok && attempts.find((p) => p.status === 'authorized')
  if (auth) ok = await capturePayment(auth.id, auth.amount)
  if (ok) {
    const r = await confirm({ razorpay_order_id: o.razorpay_order_id, razorpay_payment_id: ok.id }, { verified: true })
    return { result: 'paid', message: r.late ? 'Payment found - but the order had expired. Refund it or re-confirm it manually.' : `Payment ${ok.id} found and the order is now marked paid.` }
  }
  const failed = attempts.find((p) => p.status === 'failed')
  return { result: attempts.length ? 'failed' : 'none', message: attempts.length ? `No successful payment. Latest attempt failed: ${failed?.error_description || failed?.status}.` : 'The customer has not attempted payment yet.' }
}

/** Pull the latest courier status from Shiprocket and move the order on (for when the webhook is not set up). */
export async function syncTracking(orderId) {
  const o = await getOrder(`id=eq.${encodeURIComponent(orderId)}`)
  if (!o?.awb) throw new OrderError('This order has no AWB / tracking number yet.')
  const t = await trackAwb(o.awb)
  const next = STATUS_MAP[t.status.toLowerCase()]
  if (t.url && !o.tracking_url) await update('orders', `id=eq.${o.id}`, { tracking_url: t.url })
  if (next && next !== o.status && canMove(o.status, next)) {
    await changeStatus(o.id, next, { note: `Courier: ${t.status}${t.location ? ` - ${t.location}` : ''}` })
    return { status: next, courier: t.status }
  }
  return { status: o.status, courier: t.status || 'No update yet' }
}

// Amount helpers used by the admin page
export const refundable = async (o) => {
  const pending = (await select(`refunds?order_id=eq.${o.id}&status=eq.pending&select=amount`)).reduce((n, r) => n + r.amount, 0)
  return Math.max(0, o.total - o.refunded_amount - pending)
}
export { fetchPayment, trackingUrl }
