// Shiprocket API (https://apidocs.shiprocket.in). Adapted from the KA.SHA project's integration:
// token cached per server instance, Shiprocket's *recommended* courier used for the rate (it's what gets assigned).
import { config, shiprocketLive } from './config.js'

const BASE = 'https://apiv2.shiprocket.in/v1/external'
let token = null // { value, expires }

async function getToken() {
  if (token && token.expires > Date.now()) return token.value
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: config.shiprocket.email, password: config.shiprocket.password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.token) throw new Error(`Shiprocket login failed (${res.status}): ${data.message || 'check SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD'}`)
  token = { value: data.token, expires: Date.now() + 9 * 24 * 3600_000 } // tokens last 10 days
  return token.value
}

async function call(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}`, ...init.headers } })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) token = null
  return { ok: res.ok, status: res.status, data }
}

const errorText = (data, status) => {
  if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors))
    return Object.entries(data.errors).map(([k, v]) => `${k}: ${[].concat(v).join(', ')}`).join('; ')
  if (Array.isArray(data?.errors)) return data.errors.join('; ')
  return data?.message || `Shiprocket error ${status}`
}

export const parcelWeight = (units) => Math.max(0.1, Math.round(units * config.shiprocket.weightPerItemKg * 100) / 100)

/**
 * Live courier rate for a delivery PIN code.
 * Returns { available, charge, courier, etd, days, codAvailable } or null if Shiprocket isn't set up / unreachable.
 */
export async function liveRate({ pincode, units, orderValue, cod = false }) {
  if (!shiprocketLive()) return null
  const params = new URLSearchParams({
    pickup_postcode: config.shiprocket.pickupPincode,
    delivery_postcode: pincode,
    weight: String(parcelWeight(units)),
    length: String(config.shiprocket.box.length),
    breadth: String(config.shiprocket.box.breadth),
    height: String(config.shiprocket.box.height),
    cod: cod ? '1' : '0',
    declared_value: String(Math.ceil(orderValue)),
  })
  const { ok, data } = await call(`/courier/serviceability/?${params}`)
  if (!ok) return null
  const couriers = data?.data?.available_courier_companies || []
  if (!couriers.length) return { available: false }
  const recId = data?.data?.recommended_courier_company_id
  const pick = couriers.find((c) => c.courier_company_id === recId) || couriers.find((c) => c.is_recommended === 1)
    || [...couriers].sort((a, b) => (a.freight_charge ?? a.rate ?? 1e9) - (b.freight_charge ?? b.rate ?? 1e9))[0]
  return {
    available: true,
    charge: Math.ceil(Number(pick.freight_charge ?? pick.rate ?? 0) + (cod ? Number(pick.cod_charges || 0) : 0)),
    courier: pick.courier_name || 'Standard delivery',
    etd: pick.etd || null,
    days: pick.estimated_delivery_days ? Number(pick.estimated_delivery_days) : null,
    codAvailable: couriers.some((c) => Number(c.cod) === 1),
  }
}

const splitName = (full) => {
  const parts = String(full || '').trim().split(/\s+/)
  return { first: parts[0] || 'Customer', last: parts.slice(1).join(' ') || '.' }
}

/** Create the order in Shiprocket (appears under Orders > New there). */
export async function createShipment(order) {
  const { first, last } = splitName(order.customer?.name)
  const a = order.address || {}
  const units = order.items.reduce((n, i) => n + i.qty, 0)
  const body = {
    order_id: order.order_no,
    order_date: new Date(order.created_at).toISOString().replace('T', ' ').slice(0, 16),
    pickup_location: config.shiprocket.pickupLocation,
    billing_customer_name: first,
    billing_last_name: last,
    billing_address: a.line1,
    billing_address_2: a.line2 || '',
    billing_city: a.city,
    billing_pincode: a.pin,
    billing_state: a.state,
    billing_country: 'India',
    billing_email: order.customer?.email,
    billing_phone: String(order.customer?.phone || '').replace(/\D/g, '').slice(-10),
    shipping_is_billing: true,
    order_items: order.items.map((i) => ({ name: `${i.name} (${i.finish})`, sku: i.sku || i.slug, units: i.qty, selling_price: i.price, discount: 0, tax: 0, hsn: 7117 })),
    payment_method: order.payment_status === 'cod' ? 'COD' : 'Prepaid',
    shipping_charges: order.shipping || 0,
    sub_total: order.total,
    length: config.shiprocket.box.length,
    breadth: config.shiprocket.box.breadth,
    height: config.shiprocket.box.height,
    weight: parcelWeight(units),
  }
  const { ok, status, data } = await call('/orders/create/adhoc', { method: 'POST', body: JSON.stringify(body) })
  // Shiprocket can answer 200 with validation errors and no order_id
  if (!ok || !data?.order_id) throw new Error(errorText(data, status))
  return { shiprocketOrderId: String(data.order_id), shipmentId: data.shipment_id ? String(data.shipment_id) : null, awb: data.awb_code || null, courier: data.courier_name || null }
}

/** Assign a courier and get the AWB (tracking number). Uses Shiprocket's recommended courier unless one is given. */
export async function assignAwb(shipmentId, courierId) {
  const { ok, status, data } = await call('/courier/assign/awb', { method: 'POST', body: JSON.stringify({ shipment_id: shipmentId, ...(courierId ? { courier_id: courierId } : {}) }) })
  const r = data?.response?.data
  if (!ok || !r?.awb_code) throw new Error(errorText(data?.response?.data?.awb_assign_error ? { message: data.response.data.awb_assign_error } : data, status))
  return { awb: r.awb_code, courier: r.courier_name || null }
}

export async function requestPickup(shipmentId) {
  const { ok, status, data } = await call('/courier/generate/pickup', { method: 'POST', body: JSON.stringify({ shipment_id: [Number(shipmentId)] }) })
  if (!ok) throw new Error(errorText(data, status))
  return { scheduled: data?.response?.pickup_scheduled_date || null, message: data?.response?.data || 'Pickup requested' }
}

export async function getLabel(shipmentId) {
  const { ok, status, data } = await call('/courier/generate/label', { method: 'POST', body: JSON.stringify({ shipment_id: [Number(shipmentId)] }) })
  const url = data?.label_url || data?.response?.label_url
  if (!ok || !url) throw new Error(errorText(data, status))
  return url
}

export async function cancelShipment(shiprocketOrderId) {
  const { ok, status, data } = await call('/orders/cancel', { method: 'POST', body: JSON.stringify({ ids: [Number(shiprocketOrderId)] }) })
  if (!ok) throw new Error(errorText(data, status))
  return true
}

export const trackingUrl = (awb) => (awb ? `https://shiprocket.co/tracking/${awb}` : null)

// Shiprocket status (webhook `current_status`) -> our order stage
export const STATUS_MAP = {
  'awb assigned': 'packed',
  'label generated': 'packed',
  'pickup scheduled': 'packed',
  'pickup generated': 'packed',
  'out for pickup': 'packed',
  'pickup queued': 'packed',
  'picked up': 'shipped',
  shipped: 'shipped',
  'in transit': 'shipped',
  'reached at destination hub': 'shipped',
  'out for delivery': 'out_for_delivery',
  delivered: 'delivered',
  'rto initiated': 'returned',
  rto: 'returned',
  'rto delivered': 'returned',
  canceled: 'cancelled',
  cancelled: 'cancelled',
  'shipment cancelled': 'cancelled',
}
