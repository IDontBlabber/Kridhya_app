import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InfoHero } from '../components/InfoPage'
import { useCart } from '../context/CartContext'
import { BRAND_NAME, CONTACT, formatPrice } from '../data/site'
import { IconArrow, IconShield, IconTruck } from '../components/Icons'
import useDocumentMeta from '../hooks/useDocumentMeta'
import { hasBackend, rpc } from '../lib/backend'

// Checkout.
//  - Store server live (/api, see backend/server): live Shiprocket delivery charge for the PIN code, then
//    Razorpay online payment or Cash on Delivery. Prices, stock and shipping are all recalculated on the server.
//  - Server not reachable: falls back to the database's place_order (no payment taken; the team confirms).
//  - No database: preview confirmation only.
// Every figure on this page uses the `.num` style so numerals match everywhere.

const api = async (path, body) => {
  const res = await fetch(`/api/${path}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

// Razorpay's payment window script, loaded only when someone pays.
let rzpScript
const loadRazorpay = () =>
  (rzpScript ??= new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve()
    s.onerror = () => { rzpScript = null; reject(new Error('Could not load the payment window. Check your connection and try again.')) }
    document.head.appendChild(s)
  }))

const friendly = (m = '') =>
  m.startsWith('OUT_OF_STOCK:') ? `Sorry - ${m.slice(13).split('|')[0]} has just sold out${m.includes('|') && +m.split('|')[1] > 0 ? ` (only ${m.split('|')[1]} left)` : ''}. Please update your bag.`
    : m.startsWith('UNAVAILABLE:') ? `Sorry - ${m.slice(12)} is no longer available. Please remove it from your bag.`
      : m === 'INVALID_DETAILS' ? 'Please check your details and try again.'
        : m || 'We could not place your order just now. Please try again, or message us on WhatsApp.'

const fmtEtd = (q) => {
  if (!q?.etd) return q?.days ? `${q.days} days` : ''
  const d = new Date(q.etd)
  return Number.isNaN(d.getTime()) ? q.etd : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Checkout() {
  useDocumentMeta('Checkout | Kridhya by Devanshi Agarwal', 'Share your delivery details and review your order.')
  const { items, subtotal, clear } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', address2: '', city: '', state: '', pin: '', note: '', payment: 'online' })
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [failure, setFailure] = useState('')
  const [store, setStore] = useState(null) // /api/store/config, or false when the server isn't reachable
  const [q, setQ] = useState(null) // shipping quote
  const [quoting, setQuoting] = useState(false)
  const pending = useRef(null) // created-but-unpaid online order, reused when the shopper retries payment
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const pin = form.pin.trim()

  // what the store server can offer
  useEffect(() => {
    if (!hasBackend) return setStore(false)
    api('store/config')
      .then((c) => {
        if (!c.ready) return setStore(false) // server not configured yet: no-payment fallback
        setStore(c)
        setForm((f) => ({ ...f, payment: c.onlinePayments ? 'online' : c.cod ? 'cod' : 'online' }))
      })
      .catch(() => setStore(false))
  }, [])

  // live delivery charge once a full PIN code is entered (and when the bag or payment method changes)
  const bagKey = items.map((i) => `${i.slug}:${i.finish}:${i.qty}`).join('|')
  useEffect(() => {
    pending.current = null // bag/PIN/payment changed: a held order no longer matches
    if (!store || !/^\d{6}$/.test(pin) || !items.length) return setQ(null)
    let live = true
    setQuoting(true)
    const t = setTimeout(() => {
      api('shipping/rates', { pincode: pin, payment: form.payment, items: items.map((i) => ({ slug: i.slug, finish: i.finish, qty: i.qty })) })
        .then((r) => live && setQ(r))
        .catch((e) => live && setQ({ error: e.message }))
        .finally(() => live && setQuoting(false))
    }, 350)
    return () => { live = false; clearTimeout(t) }
  }, [store, pin, form.payment, bagKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (order) => {
    try { sessionStorage.setItem('kridhya-last-order', JSON.stringify(order)) } catch { /* confirmation page falls back */ }
    clear()
    navigate('/order-confirmed', { state: order })
  }

  const payOnline = async (created) => {
    await loadRazorpay()
    return new Promise((resolve) => {
      const rz = new window.Razorpay({
        key: created.razorpay.key,
        order_id: created.razorpay.orderId,
        amount: created.razorpay.amount,
        currency: created.razorpay.currency,
        name: BRAND_NAME,
        description: `Order ${created.orderNo}`,
        prefill: { name: form.name, email: form.email, contact: form.phone.replace(/\D/g, '').slice(-10) },
        notes: { order_no: created.orderNo },
        theme: { color: '#5E182C' },
        handler: async (resp) => {
          try {
            const v = await api('checkout/verify', resp)
            resolve({ ok: true, orderNo: v.orderNo })
          } catch (e) {
            resolve({ ok: false, error: `${e.message} (order ${created.orderNo})` })
          }
        },
        modal: { ondismiss: () => resolve({ ok: false, error: 'Payment was not completed. Your pieces are held for 30 minutes - you can try again.' }) },
      })
      rz.on('payment.failed', (r) => resolve({ ok: false, error: `Payment failed: ${r?.error?.description || 'please try another method'}. You can try again.` }))
      rz.open()
    })
  }

  const submit = async (e) => {
    e.preventDefault()
    const err = {}
    if (!form.name.trim()) err.name = 'Please enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Please enter a valid email address.'
    if (form.phone.replace(/\D/g, '').length < 10) err.phone = 'Please enter a 10-digit phone number.'
    if (!form.address.trim()) err.address = 'Please enter your address.'
    if (!form.city.trim()) err.city = 'Please enter your city.'
    if (!form.state.trim()) err.state = 'Please enter your state.'
    if (!/^\d{6}$/.test(pin)) err.pin = 'Please enter a 6-digit PIN code.'
    setErrors(err)
    if (Object.keys(err).length) {
      document.getElementById(`co-${Object.keys(err)[0]}`)?.focus()
      return
    }
    if (store && q && q.serviceable === false) return setFailure(q.message)
    setFailure('')
    const base = { name: form.name.trim(), items, phone: form.phone, payment: form.payment }
    const payload = {
      customer: { name: form.name, email: form.email, phone: form.phone },
      address: { line1: form.address, line2: form.address2, city: form.city, state: form.state, pin },
      items: items.map((i) => ({ slug: i.slug, name: i.name, finish: i.finish, qty: i.qty })),
      payment: form.payment,
      note: form.note,
    }

    // no database: preview confirmation
    if (!hasBackend) return finish({ ...base, id: `KRD-${Date.now().toString(36).toUpperCase()}`, subtotal })

    setPlacing(true)
    try {
      // store server: online payment or COD
      if (store) {
        const created = pending.current || (await api('checkout/create', payload))
        if (created.payment === 'online') {
          pending.current = created
          const r = await payOnline(created)
          if (!r.ok) return setFailure(r.error)
          pending.current = null
          return finish({ ...base, id: r.orderNo, subtotal: created.total, tracked: true, paid: true })
        }
        return finish({ ...base, id: created.orderNo, subtotal: created.total, tracked: true })
      }
      // fallback: order without payment, confirmed by the team
      const res = await rpc('place_order', { p: payload })
      finish({ ...base, id: res.order_no, subtotal: res.total, tracked: true })
    } catch (err) {
      setFailure(friendly(err.message))
    } finally {
      setPlacing(false)
    }
  }

  const shippingLine = !store ? null : !/^\d{6}$/.test(pin) ? 'Enter your PIN code' : quoting ? 'Checking…' : q?.error ? 'Calculated on order' : q?.serviceable === false ? 'Not deliverable' : q ? (q.shipping === 0 ? 'Free' : formatPrice(q.shipping)) : '…'
  const total = q?.serviceable ? q.total : subtotal
  const payments = !store
    ? [{ id: 'online', label: 'Confirm on WhatsApp', hint: hasBackend ? 'We confirm your order and share a payment link' : 'Preview only - no payment is taken on this site yet' }]
    : [
        store.onlinePayments && { id: 'online', label: 'Pay online', hint: 'UPI, cards, net banking and wallets - secured by Razorpay' },
        store.cod && { id: 'cod', label: 'Cash on Delivery', hint: q && q.serviceable && !q.codAvailable ? 'Not available for this order or PIN code' : `Pay when your order arrives${store.codFee ? ` (+${formatPrice(store.codFee)})` : ''}`, disabled: q && q.serviceable && !q.codAvailable },
      ].filter(Boolean)

  return (
    <>
      <InfoHero eyebrow="Checkout" title="Almost yours" intro="Share your delivery details and review your order." />
      <section className="section bg-ivory">
        <div className="container-site">
          {items.length === 0 ? (
            <div className="mx-auto max-w-md py-10 text-center">
              <p className="font-display text-[31px]">Your bag is empty</p>
              <p className="mt-2 text-[15px] text-wine-900/70">Add a piece to your bag to check out.</p>
              <Link to="/shop" className="btn btn-wine mt-8">Explore the collection</Link>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="grid gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="space-y-12 lg:col-span-7">
                <fieldset>
                  <legend className="font-display text-[29px] font-medium">Contact</legend>
                  <div className="mt-5 grid gap-x-7 gap-y-6 sm:grid-cols-2">
                    <Field id="co-name" label="Full name" required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
                    <Field id="co-phone" label="Phone" type="tel" required value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" num />
                    <div className="sm:col-span-2">
                      <Field id="co-email" label="Email" type="email" required value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
                    </div>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="font-display text-[29px] font-medium">Delivery address</legend>
                  <div className="mt-5 grid gap-x-7 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field id="co-address" label="Address" required value={form.address} onChange={set('address')} error={errors.address} autoComplete="address-line1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Field id="co-address2" label="Apartment, landmark (optional)" value={form.address2} onChange={set('address2')} autoComplete="address-line2" />
                    </div>
                    <Field id="co-city" label="City" required value={form.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
                    <Field id="co-state" label="State" required value={form.state} onChange={set('state')} error={errors.state} autoComplete="address-level1" />
                    <Field id="co-pin" label="PIN code" required inputMode="numeric" maxLength={6} value={form.pin} onChange={set('pin')} error={errors.pin} autoComplete="postal-code" num />
                    <Field id="co-country" label="Country" value="India" readOnly />
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="font-display text-[29px] font-medium">Payment</legend>
                  <div className="mt-5 grid gap-3">
                    {store === null && hasBackend && <p className="text-[14px] text-wine-900/60">Loading payment options…</p>}
                    {(store !== null || !hasBackend) && payments.map((p) => (
                      <label key={p.id} className={`flex min-h-[64px] items-center gap-4 border px-4 py-3 transition-colors ${p.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${form.payment === p.id ? 'border-wine-900 bg-cream/70' : 'border-wine-900/20 hover:border-wine-900/50'}`}>
                        <input type="radio" name="payment" value={p.id} checked={form.payment === p.id} disabled={p.disabled} onChange={set('payment')} className="h-4 w-4 accent-wine-800" />
                        <span>
                          <span className="block text-[15px] font-medium">{p.label}</span>
                          <span className="block text-[14px] text-wine-900/65">{p.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {store && form.payment === 'online' && <p className="mt-3 text-[12px] text-wine-900/60">A secure Razorpay window opens to complete your payment. Your card or UPI details never touch our site.</p>}
                  {store && store.freeShippingAbove > 0 && subtotal < store.freeShippingAbove && <p className="mt-2 text-[12px] text-gold-deep">Add {formatPrice(store.freeShippingAbove - subtotal)} more for free shipping.</p>}
                </fieldset>

                <div>
                  <label htmlFor="co-note" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em]">Gift message or note (optional)</label>
                  <textarea id="co-note" rows={3} value={form.note} onChange={set('note')} className="w-full resize-none border-b-2 border-wine-900/30 bg-transparent py-2 text-[15px] focus:border-wine-700 focus:outline-none" />
                </div>
              </div>

              {/* order summary */}
              <aside className="lg:col-span-5" aria-label="Order summary">
                <div className="border border-gold/40 bg-cream/60 p-6 sm:p-8 lg:sticky lg:top-24">
                  <h2 className="font-display text-[26px] font-medium">Order summary</h2>
                  <ul className="mt-5 divide-y divide-wine-900/10">
                    {items.map((i) => (
                      <li key={i.id} className="flex gap-4 py-4">
                        <img src={i.image} alt="" className="h-24 w-[72px] shrink-0 bg-cream object-cover" />
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between gap-3">
                            <p className="font-display text-[20px] leading-tight">{i.name}</p>
                            <p className="num shrink-0 text-[15px]">{formatPrice(i.price * i.qty)}</p>
                          </div>
                          <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-wine-900/60">{i.finish} · <span className="num">Qty {i.qty}</span></p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-4 space-y-2 border-t border-wine-900/15 pt-4 text-[15px]">
                    <div className="flex justify-between"><dt>Subtotal</dt><dd className="num">{formatPrice(subtotal)}</dd></div>
                    <div className="flex justify-between text-wine-900/70">
                      <dt>Shipping{form.payment === 'cod' && store?.codFee > 0 && q?.serviceable ? ' (incl. COD fee)' : ''}</dt>
                      <dd className="num">{store ? shippingLine : 'Confirmed on order'}</dd>
                    </div>
                    {q?.serviceable && (q.courier || q.etd || q.days) && (
                      <p className="flex items-start gap-2 text-[13px] text-wine-900/65">
                        <IconTruck size={16} className="mt-0.5 shrink-0 text-gold-deep" />
                        <span>{q.courier && <>{q.courier} · </>}{fmtEtd(q) && <>Estimated delivery {fmtEtd(q)}</>}</span>
                      </p>
                    )}
                    {q?.serviceable === false && <p className="text-[13px] font-medium text-wine-600">{q.message}</p>}
                    <div className="flex items-baseline justify-between border-t border-wine-900/15 pt-3 text-[19px] font-medium"><dt>Total</dt><dd className="num">{formatPrice(total)}</dd></div>
                  </dl>
                  {failure && <p role="alert" className="mt-5 border border-wine-600/40 bg-wine-600/5 px-4 py-3 text-[14px] font-medium text-wine-700">{failure}</p>}
                  <button type="submit" disabled={placing || (store && q?.serviceable === false)} className="btn btn-wine mt-6 h-12 w-full text-[12px] font-semibold disabled:opacity-60">{placing ? (form.payment === 'online' && store ? 'Opening secure payment…' : 'Placing your order…') : store && form.payment === 'online' ? <>Pay {q?.serviceable ? formatPrice(total) : ''} securely <IconArrow size={15} /></> : <>Place order <IconArrow size={15} /></>}</button>
                  <p className="mt-4 flex items-start gap-2 text-[12px] leading-snug text-wine-900/65">
                    <IconShield size={16} className="mt-0.5 shrink-0 text-gold-deep" />
                    <span>Questions? Call or WhatsApp <span className="num">{CONTACT.phoneDisplay}</span>. See <Link to="/shipping-returns" className="underline decoration-gold underline-offset-4">Shipping &amp; Returns</Link>.</span>
                  </p>
                </div>
              </aside>
            </form>
          )}
        </div>
      </section>
    </>
  )
}

function Field({ id, label, error, required, num, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em]">
        {label} {required && <span className="text-wine-600" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`${num ? 'num' : ''} h-12 w-full border-b-2 bg-transparent text-[15px] focus:outline-none read-only:text-wine-900/60 ${error ? 'border-wine-600' : 'border-wine-900/30 focus:border-wine-700'}`}
        {...rest}
      />
      {error && <p id={`${id}-err`} className="mt-1.5 text-[14px] font-semibold text-wine-600">{error}</p>}
    </div>
  )
}
