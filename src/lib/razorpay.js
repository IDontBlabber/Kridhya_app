// Razorpay's payment window, shared by Checkout and "Complete payment" in My account.
import { BRAND_NAME } from '../data/site'

let script
export const loadRazorpay = () =>
  (script ??= new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve()
    s.onerror = () => { script = null; reject(new Error('Could not load the payment window. Check your connection and try again.')) }
    document.head.appendChild(s)
  }))

export async function api(path, body, token) {
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  const res = await fetch(`/api/${path}`, body ? { method: 'POST', headers, body: JSON.stringify(body) } : undefined)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

/**
 * Open the payment window for a created order and verify the result on the server.
 * Resolves { ok: true, orderNo } or { ok: false, error, cancelled? } - never rejects for a payment outcome.
 */
export async function payWithRazorpay(created, prefill = {}) {
  await loadRazorpay()
  return new Promise((resolve) => {
    let settled = false
    let lastError = ''
    const finish = (r) => { if (!settled) { settled = true; resolve(r) } }
    const rz = new window.Razorpay({
      key: created.razorpay.key,
      order_id: created.razorpay.orderId,
      amount: created.razorpay.amount,
      currency: created.razorpay.currency,
      name: BRAND_NAME,
      description: `Order ${created.orderNo}`,
      prefill: { name: prefill.name || '', email: prefill.email || '', contact: String(prefill.phone || '').replace(/\D/g, '').slice(-10) },
      notes: { order_no: created.orderNo },
      theme: { color: '#5E182C' },
      retry: { enabled: true, max_count: 3 },
      handler: async (resp) => {
        try {
          const v = await api('checkout/verify', resp)
          finish({ ok: true, orderNo: v.orderNo })
        } catch (e) {
          finish({ ok: false, error: `${e.message} If money was deducted, it will be confirmed automatically within a few minutes - check My account (order ${created.orderNo}).` })
        }
      },
      modal: {
        ondismiss: () => finish({ ok: false, cancelled: true, error: `${lastError ? `Payment failed: ${lastError}. ` : 'Payment was not completed. '}Your pieces are held for 30 minutes - try again, or finish later from My account.` }),
        confirm_close: true,
      },
    })
    // Razorpay lets the shopper retry inside the window; we only report a failure if they close it after one.
    rz.on('payment.failed', (r) => { lastError = r?.error?.description || 'declined' })
    rz.open()
  })
}
