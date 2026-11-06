// Checkout business logic shared by the API routes in /api.
import { config, paymentsLive, shiprocketLive } from './config.js'
import { addEvent, getOrder, rpc, select, update } from './db.js'
import { capturePayment, createRazorpayOrder, fetchPayment, verifyCheckoutSignature } from './razorpay.js'
import { createShipment, liveRate, trackingUrl } from './shiprocket.js'

export class UserError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

const cleanItems = (items) =>
  (Array.isArray(items) ? items : [])
    .slice(0, 50)
    .map((i) => ({ slug: String(i.slug || ''), finish: String(i.finish || ''), qty: Math.max(1, Math.min(20, parseInt(i.qty, 10) || 1)) }))
    .filter((i) => i.slug && i.finish)

/** Subtotal from database prices (never from the browser). */
async function priceBag(items) {
  const slugs = [...new Set(items.map((i) => i.slug))]
  if (!slugs.length) throw new UserError('Your bag is empty.')
  const rows = await select(`products?select=slug,data&status=eq.published&slug=in.(${slugs.map((s) => `"${s.replace(/"/g, '')}"`).join(',')})`)
  const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r.data]))
  let subtotal = 0
  let units = 0
  for (const i of items) {
    const p = bySlug[i.slug]
    if (!p) throw new UserError('An item in your bag is no longer available. Please remove it and try again.')
    subtotal += i.qty * Number(p.price || 0)
    units += i.qty
  }
  return { subtotal, units }
}

/**
 * Shipping quote for the bag + PIN code. Live Shiprocket rate when configured, otherwise the flat fee.
 * payment: 'online' | 'cod'
 */
export async function quote({ items, pincode, payment = 'online' }) {
  const bag = cleanItems(items)
  if (!/^\d{6}$/.test(String(pincode || ''))) throw new UserError('Enter a valid 6-digit PIN code.')
  const { subtotal, units } = await priceBag(bag)
  const cod = payment === 'cod'
  const s = config.shipping

  let rate = null
  try {
    rate = await liveRate({ pincode: String(pincode), units, orderValue: subtotal, cod })
  } catch (e) {
    console.warn('[shipping] live rate failed, using flat fee:', e.message)
  }
  if (rate && rate.available === false) {
    return { serviceable: false, subtotal, message: 'Sorry, we can’t deliver to this PIN code yet. Message us on WhatsApp and we’ll help.' }
  }
  const courierCharge = rate ? rate.charge : s.flatFee
  const free = s.freeAbove > 0 && subtotal >= s.freeAbove
  const codAllowed = s.codEnabled && subtotal <= s.codMax && (rate ? rate.codAvailable : true)
  const shipping = (free ? 0 : courierCharge) + (cod && codAllowed ? s.codFee : 0)
  return {
    serviceable: true,
    subtotal,
    shipping,
    total: subtotal + shipping,
    free,
    courier: rate?.courier || null,
    etd: rate?.etd || null,
    days: rate?.days || null,
    source: rate ? 'shiprocket' : 'flat',
    codAvailable: codAllowed,
    codFee: s.codFee,
    onlineAvailable: paymentsLive(),
  }
}

/** Create the order. Online: also creates the Razorpay order for the payment window. */
export async function createCheckout(body) {
  const payment = body.payment === 'cod' ? 'cod' : 'online'
  if (payment === 'online' && !paymentsLive()) throw new UserError('Online payment is not available right now. Please choose Cash on Delivery or message us on WhatsApp.')
  const items = cleanItems(body.items)
  const address = { line1: String(body.address?.line1 || '').trim(), line2: String(body.address?.line2 || '').trim(), city: String(body.address?.city || '').trim(), state: String(body.address?.state || '').trim(), pin: String(body.address?.pin || '').trim() }

  await rpc('expire_unpaid_orders', { p_minutes: config.unpaidHoldMinutes }).catch(() => {})
  const q = await quote({ items, pincode: address.pin, payment })
  if (!q.serviceable) throw new UserError(q.message)
  if (payment === 'cod' && !q.codAvailable) throw new UserError('Cash on Delivery isn’t available for this order. Please pay online.')

  const order = await rpc('create_order', {
    p: {
      customer: { name: String(body.customer?.name || ''), email: String(body.customer?.email || ''), phone: String(body.customer?.phone || '') },
      address,
      items,
      note: String(body.note || ''),
      payment,
      shipping: q.shipping,
      quote: { courier: q.courier, etd: q.etd, days: q.days, source: q.source },
    },
  }).catch((e) => { throw new UserError(e.message) }) // OUT_OF_STOCK:… / UNAVAILABLE:… / INVALID_DETAILS → shown by the checkout page

  if (payment === 'cod') {
    await pushToShiprocket(order.id)
    return { orderNo: order.order_no, total: order.total, payment }
  }

  try {
    const rz = await createRazorpayOrder({ amountRupees: order.total, receipt: order.order_no, notes: { order_no: order.order_no } })
    await update('orders', `id=eq.${order.id}`, { razorpay_order_id: rz.id })
    return {
      orderNo: order.order_no,
      total: order.total,
      payment,
      razorpay: { key: config.razorpay.keyId, orderId: rz.id, amount: rz.amount, currency: rz.currency },
    }
  } catch (e) {
    // release the stock we just held
    await rpc('set_order_status', { p_order: order.id, p_status: 'cancelled', p_note: `Could not start payment: ${e.message}` }).catch(() => {})
    throw new UserError('We could not start the payment just now. Please try again in a moment.', 502)
  }
}

/**
 * Confirm an online payment (from the checkout callback, or the Razorpay webhook with verified=true).
 * Checks the signature, that the payment belongs to this order and the amount, then marks the order paid.
 */
export async function confirmPayment({ razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature }, { verified = false } = {}) {
  if (!orderId || !paymentId) throw new UserError('Missing payment details.')
  if (!verified && !verifyCheckoutSignature(orderId, paymentId, signature)) throw new UserError('We could not verify this payment. If money was deducted, please contact us with your order number.')
  let pay = await fetchPayment(paymentId)
  if (pay.order_id !== orderId) throw new UserError('This payment does not belong to the order.')
  if (pay.status === 'authorized') pay = await capturePayment(paymentId, pay.amount)
  if (pay.status !== 'captured') throw new UserError(`Payment not completed (status: ${pay.status}).`)
  const res = await rpc('mark_order_paid', { p_razorpay_order: orderId, p_payment_id: paymentId, p_amount_paise: Number(pay.amount) })
  if (!res.already && !res.late) {
    const o = await getOrder(`razorpay_order_id=eq.${encodeURIComponent(orderId)}`)
    if (o) await pushToShiprocket(o.id)
  }
  return { orderNo: res.order_no, late: !!res.late }
}

/** Create the shipment in Shiprocket once an order is paid (or COD). Failures are logged on the order, never thrown. */
export async function pushToShiprocket(orderId) {
  if (!shiprocketLive()) return { skipped: true }
  const o = await getOrder(`id=eq.${orderId}`)
  if (!o || o.shiprocket_order_id || ['awaiting_payment', 'cancelled', 'returned'].includes(o.status)) return { skipped: true }
  try {
    const sr = await createShipment(o)
    await update('orders', `id=eq.${o.id}`, {
      shiprocket_order_id: sr.shiprocketOrderId,
      shiprocket_shipment_id: sr.shipmentId,
      ...(sr.awb ? { awb: sr.awb, tracking_no: sr.awb, tracking_url: trackingUrl(sr.awb), courier: sr.courier } : {}),
    })
    await addEvent(o.id, o.status, `Sent to Shiprocket (order ${sr.shiprocketOrderId})`)
    return sr
  } catch (e) {
    await addEvent(o.id, o.status, `Shiprocket: could not create shipment - ${e.message}`).catch(() => {})
    return { error: e.message }
  }
}
