import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { InfoHero } from '../components/InfoPage'
import SignIn from '../components/SignIn'
import { IconArrow } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../data/site'
import { hasBackend } from '../lib/backend'
import { accessToken, myOrders } from '../lib/auth'
import { api, payWithRazorpay } from '../lib/razorpay'
import { fmtDateTime, stageOf } from '../lib/orders'
import useDocumentMeta from '../hooks/useDocumentMeta'

export default function Account() {
  useDocumentMeta('My account | Kridhya by Devanshi Agarwal', 'Your orders and saved details.')
  const { user, ready, ensure, signOut } = useAuth()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState('')
  const [payMsg, setPayMsg] = useState({})

  // finish paying for an unpaid order (same Razorpay order; the pieces are still held)
  const completePayment = async (o) => {
    setPaying(o.order_no)
    setPayMsg((m) => ({ ...m, [o.order_no]: '' }))
    try {
      const created = await api('checkout/retry', { orderNo: o.order_no }, await accessToken())
      const r = await payWithRazorpay(created, created.customer || {})
      setPayMsg((m) => ({ ...m, [o.order_no]: r.ok ? 'Payment received - thank you!' : r.error }))
      if (r.ok) setOrders(await myOrders())
    } catch (e) {
      setPayMsg((m) => ({ ...m, [o.order_no]: e.message }))
      setOrders(await myOrders().catch(() => orders))
    } finally {
      setPaying('')
    }
  }

  useEffect(() => { if (hasBackend) ensure() }, [ensure])
  useEffect(() => {
    if (!user) return setOrders(null)
    myOrders().then(setOrders).catch((e) => setError(e.message))
  }, [user])

  return (
    <>
      <InfoHero eyebrow="My account" title={user ? 'Your orders' : 'Sign in'} intro={user ? `Signed in as ${user.email}` : 'Follow your orders and keep your bag on every device.'} />
      <section className="section bg-ivory">
        <div className="container-site max-w-3xl">
          {!hasBackend ? (
            <p className="text-[15px] text-wine-900/70">Accounts will be available once the online store is live.</p>
          ) : !ready ? (
            <p className="text-[15px] text-wine-900/60">One moment…</p>
          ) : !user ? (
            <div className="max-w-md"><SignIn title="Sign in to your account" /></div>
          ) : (
            <>
              {error && <p role="alert" className="mb-4 text-[14px] text-wine-600">Could not load your orders: {error}</p>}
              {orders === null ? (
                <p className="text-[15px] text-wine-900/60">Loading your orders…</p>
              ) : orders.length === 0 ? (
                <div className="border border-gold/40 bg-cream/50 p-8 text-center">
                  <p className="font-display text-[24px]">No orders yet</p>
                  <p className="mt-2 text-[15px] text-wine-900/65">When you place an order it will appear here, with tracking.</p>
                  <Link to="/shop" className="btn btn-wine mt-6">Explore the collection</Link>
                </div>
              ) : (
                <ul className="divide-y divide-wine-900/10 border-y border-wine-900/10">
                  {orders.map((o) => (
                    <li key={o.id} className="flex flex-col flex-wrap gap-3 py-5 sm:flex-row sm:items-center">
                      <div className="flex -space-x-3">
                        {o.items.slice(0, 3).map((it, i) => <img key={i} src={it.image} alt="" className="h-14 w-14 border-2 border-ivory bg-cream object-cover" />)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="num text-[15px] font-semibold">{o.order_no}</p>
                        <p className="text-[13px] text-wine-900/60">{fmtDateTime(o.created_at)} · {o.items.reduce((n, i) => n + i.qty, 0)} item(s) · <span className="num">{formatPrice(o.total)}</span></p>
                      </div>
                      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold-deep sm:text-right">
                        {stageOf(o.status).label}
                        {o.refunded_amount > 0 && <span className="block normal-case tracking-normal text-wine-900/60">Refunded <span className="num">{formatPrice(o.refunded_amount)}</span></span>}
                      </span>
                      {o.status === 'awaiting_payment' ? (
                        <button type="button" disabled={!!paying} onClick={() => completePayment(o)} className="btn btn-wine disabled:opacity-60">{paying === o.order_no ? 'Opening…' : 'Complete payment'}</button>
                      ) : (
                        <Link to={`/track-order?order=${encodeURIComponent(o.order_no)}`} className="inline-flex min-h-[44px] items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-wine-800 hover:text-wine-600">Track <IconArrow size={13} /></Link>
                      )}
                      {payMsg[o.order_no] && <p role="status" className="w-full basis-full text-[13.5px] text-wine-700">{payMsg[o.order_no]}</p>}
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={signOut} className="btn btn-outline-dark mt-10">Sign out</button>
            </>
          )}
        </div>
      </section>
    </>
  )
}
