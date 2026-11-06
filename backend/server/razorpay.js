// Razorpay over its REST API (no SDK needed). Docs: https://razorpay.com/docs/api/
import { createHmac, timingSafeEqual } from 'node:crypto'
import { config } from './config.js'

const API = 'https://api.razorpay.com/v1'
const auth = () => 'Basic ' + Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64')

async function call(path, init = {}) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { Authorization: auth(), 'Content-Type': 'application/json', ...init.headers } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error?.description || `Razorpay error ${res.status}`)
  return body
}

// amount in rupees (the order total from the database)
export const createRazorpayOrder = ({ amountRupees, receipt, notes }) =>
  call('/orders', { method: 'POST', body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency: 'INR', receipt, notes, payment_capture: 1 }) })

export const fetchPayment = (paymentId) => call(`/payments/${encodeURIComponent(paymentId)}`)
export const capturePayment = (paymentId, amountPaise) =>
  call(`/payments/${encodeURIComponent(paymentId)}/capture`, { method: 'POST', body: JSON.stringify({ amount: amountPaise, currency: 'INR' }) })

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

// Checkout callback: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
export const verifyCheckoutSignature = (orderId, paymentId, signature) =>
  safeEqual(createHmac('sha256', config.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest('hex'), signature)

// Webhook: signature = HMAC_SHA256(raw request body, webhook secret)
export const verifyWebhookSignature = (rawBody, signature) =>
  !!config.razorpay.webhookSecret && !!signature && safeEqual(createHmac('sha256', config.razorpay.webhookSecret).update(rawBody).digest('hex'), signature)
