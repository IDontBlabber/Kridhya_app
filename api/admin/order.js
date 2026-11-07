// POST /api/admin/order  { orderId, action, ... }   - admins only (Authorization: Bearer <admin access token>)
//   status    { status, note, courier, trackingNo, trackingUrl }  move the order on (emails the customer)
//   refund    { amount?, reason }        full (no amount) or partial refund through Razorpay
//   reconcile                            ask Razorpay what happened to an unpaid order's payment
//   track                                pull the latest courier status from Shiprocket
//   ship      send to Shiprocket | couriers (list with prices) | awb { courierId? } | pickup | label | cancel-shipment
//   shiprocket-retry-login               clear the login pause after fixing the Shiprocket password
import { confirmPayment, pushToShiprocket } from '../../backend/server/checkout.js'
import { mailLive, shiprocketLive } from '../../backend/server/config.js'
import { notify } from '../../backend/server/email.js'
import { addEvent, currentUser, getOrder, select, update } from '../../backend/server/db.js'
import { handle, json, readJson } from '../../backend/server/http.js'
import { changeStatus, reconcilePayment, refundOrder, refundable, syncTracking } from '../../backend/server/orders.js'
import { assignAwb, cancelShipment, courierOptions, getLabel, requestPickup, resetLogin, trackingUrl } from '../../backend/server/shiprocket.js'

const NEED_SR = 'Shiprocket is not set up yet (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, SHIPROCKET_PICKUP_PINCODE).'

export const POST = handle(async (request) => {
  const user = await currentUser(request)
  const isAdmin = user && (await select(`admins?user_id=eq.${encodeURIComponent(user.id)}&select=user_id`)).length > 0
  if (!isAdmin) return json({ error: 'Admins only' }, 403)
  const actor = user.email
  const body = await readJson(request)
  const { action } = body

  if (action === 'shiprocket-retry-login') {
    if (!shiprocketLive()) return json({ error: NEED_SR }, 400)
    await resetLogin()
    return json({ ok: true, message: 'Shiprocket login works again.' })
  }

  const o = await getOrder(`id=eq.${encodeURIComponent(body.orderId)}`)
  if (!o) return json({ error: 'Order not found' }, 404)

  switch (action) {
    case 'info': {
      const refunds = await select(`refunds?order_id=eq.${o.id}&select=*&order=created_at.desc`)
      return json({ refunds, refundable: await refundable(o), emails: mailLive() })
    }
    case 'email': {
      // resend one of the customer emails for this order
      if (!mailLive()) return json({ error: 'Customer emails are off: add BREVO_API_KEY and MAIL_FROM_EMAIL in Vercel, then redeploy.' }, 400)
      const kinds = { confirmed: 'Order confirmation', shipped: 'Shipped', out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' }
      if (!kinds[body.kind]) return json({ error: 'Unknown email' }, 400)
      const r = await notify(body.kind, o)
      if (r.error) return json({ error: `Brevo did not send it: ${r.error}` }, 502)
      return json({ ok: true, message: `${kinds[body.kind]} email sent to ${o.customer?.email}` })
    }
    case 'status':
      await changeStatus(o.id, body.status, { note: body.note, courier: body.courier, trackingNo: body.trackingNo, trackingUrl: body.trackingUrl, actor })
      return json({ ok: true })
    case 'refund':
      return json({ ok: true, ...(await refundOrder(o.id, { amount: body.amount, reason: body.reason || '', actor })) })
    case 'reconcile':
      return json({ ok: true, ...(await reconcilePayment(o.id, confirmPayment)) })
    case 'track':
      if (!shiprocketLive()) return json({ error: NEED_SR }, 400)
      return json({ ok: true, ...(await syncTracking(o.id)) })
  }

  // ── Shiprocket shipment actions ──
  if (!shiprocketLive()) return json({ error: NEED_SR }, 400)
  try {
    if (action === 'create') {
      const r = await pushToShiprocket(o.id)
      if (r.error) return json({ error: r.error }, 400)
      return json({ ok: true, message: r.skipped ? 'Already in Shiprocket' : 'Sent to Shiprocket' })
    }
    if (!o.shiprocket_order_id) return json({ error: 'Send the order to Shiprocket first.' }, 400)
    if (action === 'couriers') return json({ ok: true, couriers: await courierOptions(o.shiprocket_order_id) })
    if (action === 'awb') {
      const r = await assignAwb(o.shiprocket_shipment_id, body.courierId)
      await update('orders', `id=eq.${o.id}`, { awb: r.awb, tracking_no: r.awb, tracking_url: trackingUrl(r.awb), courier: r.courier })
      if (['placed', 'confirmed'].includes(o.status)) await changeStatus(o.id, 'packed', { note: `Courier assigned: ${r.courier || ''} · AWB ${r.awb}`, actor })
      else await addEvent(o.id, o.status, `Courier assigned: ${r.courier || ''} · AWB ${r.awb}`)
      return json({ ok: true, message: `AWB ${r.awb} assigned (${r.courier || 'courier'})` })
    }
    if (action === 'pickup') {
      const r = await requestPickup(o.shiprocket_shipment_id)
      await addEvent(o.id, o.status, `Pickup requested${r.scheduled ? ` for ${r.scheduled}` : ''} by ${actor}`)
      return json({ ok: true, message: r.scheduled ? `Pickup scheduled for ${r.scheduled}` : 'Pickup requested' })
    }
    if (action === 'label') {
      const url = await getLabel(o.shiprocket_shipment_id)
      await update('orders', `id=eq.${o.id}`, { label_url: url })
      return json({ ok: true, url })
    }
    if (action === 'cancel-shipment') {
      await cancelShipment(o.shiprocket_order_id)
      await update('orders', `id=eq.${o.id}`, { shiprocket_order_id: null, shiprocket_shipment_id: null, awb: null })
      await addEvent(o.id, o.status, `Shipment cancelled in Shiprocket by ${actor}`)
      return json({ ok: true, message: 'Shipment cancelled in Shiprocket' })
    }
    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ error: e.message.startsWith('Shiprocket') ? e.message : `Shiprocket: ${e.message}` }, 400)
  }
})
