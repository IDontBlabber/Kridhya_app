import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { InfoHero } from '../components/InfoPage'
import { useCart } from '../context/CartContext'
import { CONTACT, formatPrice } from '../data/site'
import { IconArrow, IconShield } from '../components/Icons'
import useDocumentMeta from '../hooks/useDocumentMeta'

const PAYMENTS = [
  { id: 'upi', label: 'UPI', hint: 'Pay with any UPI app' },
  { id: 'card', label: 'Card / Net banking', hint: 'Secure payment page' },
  { id: 'whatsapp', label: 'Confirm on WhatsApp', hint: 'We confirm details and share a payment link' },
]

// DEMO checkout: validates the form, then shows an order confirmation. Payment is not connected yet —
// PENDING: hook up the payment gateway / store backend (e.g. WooCommerce) before launch.
// Every figure on this page (prices, quantities, PIN, phone) uses the `.num` style so numerals match everywhere.
export default function Checkout() {
  useDocumentMeta('Checkout | Kridhya by Devanshi Agarwal', 'Share your delivery details and review your order.')
  const { items, subtotal, clear } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', address2: '', city: '', state: '', pin: '', note: '', payment: 'upi' })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (!form.name.trim()) err.name = 'Please enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Please enter a valid email address.'
    if (form.phone.replace(/\D/g, '').length < 10) err.phone = 'Please enter a 10-digit phone number.'
    if (!form.address.trim()) err.address = 'Please enter your address.'
    if (!form.city.trim()) err.city = 'Please enter your city.'
    if (!form.state.trim()) err.state = 'Please enter your state.'
    if (!/^\d{6}$/.test(form.pin.trim())) err.pin = 'Please enter a 6-digit PIN code.'
    setErrors(err)
    if (Object.keys(err).length) {
      document.getElementById(`co-${Object.keys(err)[0]}`)?.focus()
      return
    }
    const order = { id: `KRD-${Date.now().toString(36).toUpperCase()}`, name: form.name.trim(), items, subtotal, payment: form.payment }
    try {
      sessionStorage.setItem('kridhya-last-order', JSON.stringify(order))
    } catch {
      /* confirmation page falls back to a generic message */
    }
    clear()
    navigate('/order-confirmed', { state: order })
  }

  return (
    <>
      <InfoHero eyebrow="Checkout" title="Almost yours" intro="Share your delivery details and review your order." />
      <section className="section bg-ivory">
        <div className="container-site">
          {items.length === 0 ? (
            <div className="mx-auto max-w-md py-10 text-center">
              <p className="font-display text-[32px]">Your bag is empty</p>
              <p className="mt-2 text-[16px] text-wine-900/70">Add a piece to your bag to check out.</p>
              <Link to="/shop" className="btn btn-wine mt-8">Explore the collection</Link>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="grid gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="space-y-12 lg:col-span-7">
                <fieldset>
                  <legend className="font-display text-[30px] font-medium">Contact</legend>
                  <div className="mt-5 grid gap-x-7 gap-y-6 sm:grid-cols-2">
                    <Field id="co-name" label="Full name" required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
                    <Field id="co-phone" label="Phone" type="tel" required value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" num />
                    <div className="sm:col-span-2">
                      <Field id="co-email" label="Email" type="email" required value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
                    </div>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="font-display text-[30px] font-medium">Delivery address</legend>
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
                  <legend className="font-display text-[30px] font-medium">Payment</legend>
                  <div className="mt-5 grid gap-3">
                    {PAYMENTS.map((p) => (
                      <label key={p.id} className={`flex min-h-[64px] cursor-pointer items-center gap-4 border px-4 py-3 transition-colors ${form.payment === p.id ? 'border-wine-900 bg-cream/70' : 'border-wine-900/20 hover:border-wine-900/50'}`}>
                        <input type="radio" name="payment" value={p.id} checked={form.payment === p.id} onChange={set('payment')} className="h-4 w-4 accent-wine-800" />
                        <span>
                          <span className="block text-[16px] font-medium">{p.label}</span>
                          <span className="block text-[15px] text-wine-900/65">{p.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-3 text-[13px] text-wine-900/60">Preview only — no payment is taken on this site yet.</p>
                </fieldset>

                <div>
                  <label htmlFor="co-note" className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.16em]">Gift message or note (optional)</label>
                  <textarea id="co-note" rows={3} value={form.note} onChange={set('note')} className="w-full resize-none border-b-2 border-wine-900/30 bg-transparent py-2 text-[16px] focus:border-wine-700 focus:outline-none" />
                </div>
              </div>

              {/* order summary */}
              <aside className="lg:col-span-5" aria-label="Order summary">
                <div className="border border-gold/40 bg-cream/60 p-6 sm:p-8 lg:sticky lg:top-24">
                  <h2 className="font-display text-[30px] font-medium">Order summary</h2>
                  <ul className="mt-5 divide-y divide-wine-900/10">
                    {items.map((i) => (
                      <li key={i.id} className="flex gap-4 py-4">
                        <img src={i.image} alt="" className="h-24 w-[72px] shrink-0 bg-cream object-cover" />
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between gap-3">
                            <p className="font-display text-[21px] leading-tight">{i.name}</p>
                            <p className="num shrink-0 text-[16px]">{formatPrice(i.price * i.qty)}</p>
                          </div>
                          <p className="mt-1 text-[13px] uppercase tracking-[0.16em] text-wine-900/60">{i.finish} · <span className="num">Qty {i.qty}</span></p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-4 space-y-2 border-t border-wine-900/15 pt-4 text-[16px]">
                    <div className="flex justify-between"><dt>Subtotal</dt><dd className="num">{formatPrice(subtotal)}</dd></div>
                    <div className="flex justify-between text-wine-900/70"><dt>Shipping</dt><dd>Confirmed on order</dd></div>
                    <div className="flex items-baseline justify-between border-t border-wine-900/15 pt-3 text-[20px] font-medium"><dt>Total</dt><dd className="num">{formatPrice(subtotal)}</dd></div>
                  </dl>
                  <button type="submit" className="btn btn-wine mt-6 h-12 w-full text-[13px] font-semibold">Place order <IconArrow size={15} /></button>
                  <p className="mt-4 flex items-start gap-2 text-[13px] leading-snug text-wine-900/65">
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
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.16em]">
        {label} {required && <span className="text-wine-600" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`${num ? 'num' : ''} h-12 w-full border-b-2 bg-transparent text-[16px] focus:outline-none read-only:text-wine-900/60 ${error ? 'border-wine-600' : 'border-wine-900/30 focus:border-wine-700'}`}
        {...rest}
      />
      {error && <p id={`${id}-err`} className="mt-1.5 text-[15px] font-semibold text-wine-600">{error}</p>}
    </div>
  )
}
