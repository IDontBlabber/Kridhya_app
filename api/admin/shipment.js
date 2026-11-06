// POST /api/admin/shipment  { orderId, action }  (admin only - Authorization: Bearer <admin access token>)
// action: 'create' (send to Shiprocket) | 'awb' (assign courier + tracking number) | 'pickup' | 'label' | 'cancel'
import { pushToShiprocket } from '../../backend/server/checkout.js'
import { shiprocketLive } from '../../backend/server/config.js'
import { addEvent, getOrder, requireAdmin, update } from '../../backend/server/db.js'
import { handle, json, readJson } from '../../backend/server/http.js'
import { assignAwb, cancelShipment, getLabel, requestPickup, trackingUrl } from '../../backend/server/shiprocket.js'

export const POST = handle(async (request) => {
  if (!(await requireAdmin(request))) return json({ error: 'Admins only' }, 403)
  if (!shiprocketLive()) return json({ error: 'Shiprocket is not set up yet (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD, SHIPROCKET_PICKUP_PINCODE).' }, 400)
  const { orderId, action } = await readJson(request)
  const o = await getOrder(`id=eq.${encodeURIComponent(orderId)}`)
  if (!o) return json({ error: 'Order not found' }, 404)
  try {
    if (action === 'create') {
      const r = await pushToShiprocket(o.id)
      if (r.error) return json({ error: r.error }, 400)
      return json({ ok: true, message: r.skipped ? 'Already in Shiprocket' : 'Sent to Shiprocket' })
    }
    if (!o.shiprocket_shipment_id) return json({ error: 'Send the order to Shiprocket first.' }, 400)
    if (action === 'awb') {
      const r = await assignAwb(o.shiprocket_shipment_id)
      const status = ['placed', 'confirmed'].includes(o.status) ? 'packed' : o.status
      await update('orders', `id=eq.${o.id}`, { awb: r.awb, tracking_no: r.awb, tracking_url: trackingUrl(r.awb), courier: r.courier, status })
      await addEvent(o.id, status, `Courier assigned: ${r.courier || ''} · AWB ${r.awb}`)
      return json({ ok: true, message: `AWB ${r.awb} assigned (${r.courier || 'courier'})` })
    }
    if (action === 'pickup') {
      const r = await requestPickup(o.shiprocket_shipment_id)
      await addEvent(o.id, o.status, `Pickup requested${r.scheduled ? ` for ${r.scheduled}` : ''}`)
      return json({ ok: true, message: r.scheduled ? `Pickup scheduled for ${r.scheduled}` : 'Pickup requested' })
    }
    if (action === 'label') {
      const url = await getLabel(o.shiprocket_shipment_id)
      await update('orders', `id=eq.${o.id}`, { label_url: url })
      return json({ ok: true, url })
    }
    if (action === 'cancel') {
      await cancelShipment(o.shiprocket_order_id)
      await addEvent(o.id, o.status, 'Shipment cancelled in Shiprocket')
      return json({ ok: true, message: 'Cancelled in Shiprocket' })
    }
    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ error: `Shiprocket: ${e.message}` }, 400)
  }
})
