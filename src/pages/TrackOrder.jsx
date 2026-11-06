import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { InfoHero } from '../components/InfoPage'
import { IconArrow, IconTruck, IconWhatsApp } from '../components/Icons'
import { WHATSAPP_MESSAGES, formatPrice, whatsappLink } from '../data/site'
import { hasBackend, rpc } from '../lib/backend'
import { ORDER_STAGES, fmtDateTime, stageIndex, stageOf } from '../lib/orders'
import useDocumentMeta from '../hooks/useDocumentMeta'

// Customers look up an order with its number + the phone number used at checkout (track_order in the database).
export default function TrackOrder() {
  useDocumentMeta('Track your order | Kridhya by Devanshi Agarwal', 'Follow your Kridhya order from packing to delivery.')
  const [params] = useSearchParams()
  const [orderNo, setOrderNo] = useState(params.get('order') || '')
  const [phone, setPhone] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('kridhya-last-order'))?.phone || '' } catch { return '' }
  })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const lookup = async (e) => {
    e?.preventDefault()
    setError('')
    if (!orderNo.trim() || phone.replace(/\D/g, '').length < 10) return setError('Enter your order number and the 10-digit phone number used at checkout.')
    setBusy(true)
    try {
      const r = await rpc('track_order', { p_order_no: orderNo.trim(), p_phone: phone })
      if (!r) setError('We could not find an order with those details. Check the order number (it starts with KRD-) and the phone number.')
      setResult(r || null)
    } catch {
      setError('We could not check your order just now. Please try again in a moment.')
    } finally {
      setBusy(false)
    }
  }
  // arriving from the confirmation page with both details known
  useEffect(() => { if (hasBackend && orderNo && phone) lookup() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <InfoHero eyebrow="Your order" title="Track your order" intro="Enter your order number and phone number to see where your jewellery is." />
      <section className="section bg-ivory">
        <div className="container-site max-w-3xl">
          {!hasBackend ? (
            <p className="text-[15px] text-wine-900/75">Order tracking will be available once the online store is live. For now, message us on WhatsApp with your order number.</p>
          ) : (
            <form onSubmit={lookup} noValidate className="grid gap-4 border border-gold/40 bg-cream/50 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6">
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em]">Order number</span>
                <input value={orderNo} onChange={(e) => setOrderNo(e.target.value.toUpperCase())} placeholder="KRD-261106-AB12C" autoComplete="off" className="h-12 w-full border-b-2 border-wine-900/30 bg-transparent text-[15px] font-medium focus:border-wine-700 focus:outline-none" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em]">Phone number</span>
                <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" className="h-12 w-full border-b-2 border-wine-900/30 bg-transparent text-[15px] font-medium focus:border-wine-700 focus:outline-none" />
              </label>
              <button type="submit" disabled={busy} className="btn btn-wine h-12 disabled:opacity-60">{busy ? 'Checking…' : <>Track <IconArrow size={14} /></>}</button>
            </form>
          )}
          {error && <p role="alert" className="mt-4 text-[14.5px] font-medium text-wine-600">{error}</p>}
          {result && <Result order={result} />}
        </div>
      </section>
    </>
  )
}

function Result({ order }) {
  const cancelled = ['cancelled', 'returned', 'awaiting_payment'].includes(order.status)
  const current = stageIndex(order.status)
  const when = Object.fromEntries((order.events || []).map((e) => [e.status, e.at]))
  return (
    <div className="mt-10" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-wine-900/15 pb-4">
        <div>
          <p className="eyebrow text-gold-deep">Order {order.order_no}</p>
          <h2 className="mt-2 font-display text-[28px] leading-tight">{cancelled ? stageOf(order.status).customer : ORDER_STAGES[current]?.customer}</h2>
        </div>
        <p className="num text-[14px] text-wine-900/60">Placed {fmtDateTime(order.created_at)} · {formatPrice(order.total)}</p>
      </div>

      {!cancelled && (
        <ol className="mt-8 space-y-0">
          {ORDER_STAGES.map((s, i) => {
            const done = i <= current
            return (
              <li key={s.id} className="relative flex gap-4 pb-7 last:pb-0">
                {i < ORDER_STAGES.length - 1 && <span className={`absolute left-[11px] top-6 h-full w-px ${i < current ? 'bg-gold-deep' : 'bg-wine-900/15'}`} aria-hidden="true" />}
                <span className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-gold-deep bg-gold-deep text-ivory' : 'border-wine-900/20 bg-ivory'}`}>
                  {done && <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2.5 6.2 2.3 2.3 4.7-5" /></svg>}
                </span>
                <div>
                  <p className={`text-[15px] font-semibold ${done ? 'text-wine-900' : 'text-wine-900/45'}`}>{s.label}{i === current && <span className="ml-2 align-middle text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">Now</span>}</p>
                  {when[s.id] && <p className="num mt-0.5 text-[13px] text-wine-900/55">{fmtDateTime(when[s.id])}</p>}
                  {s.id === 'shipped' && done && (order.courier || order.tracking_no) && (
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13.5px] text-wine-900/75">
                      <IconTruck size={16} className="text-gold-deep" /> {order.courier}{order.tracking_no && <> · <span className="num">{order.tracking_no}</span></>}
                      {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="link-underline font-semibold text-wine-700">Track with courier</a>}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <ul className="mt-10 divide-y divide-wine-900/10 border-y border-wine-900/10">
        {(order.items || []).map((it, i) => (
          <li key={i} className="flex items-center gap-4 py-3">
            {it.image && <img src={it.image} alt="" className="h-14 w-14 shrink-0 bg-cream object-cover" />}
            <p className="flex-1 text-[15px]">{it.name} <span className="text-wine-900/55">· {it.finish}</span></p>
            <p className="num text-[14px] text-wine-900/65">× {it.qty}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href={whatsappLink(`${WHATSAPP_MESSAGES.general} My order number is ${order.order_no}.`)} target="_blank" rel="noreferrer" className="btn btn-outline-dark"><IconWhatsApp size={16} /> Questions? Message us</a>
        <Link to="/shop" className="btn btn-wine">Keep exploring</Link>
      </div>
    </div>
  )
}
