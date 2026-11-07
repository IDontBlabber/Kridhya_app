import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { InfoHero } from '../components/InfoPage'
import SignIn from '../components/SignIn'
import { IconArrow, IconBag, IconTruck, IconWhatsApp } from '../components/Icons'
import { LotusMark } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { WHATSAPP_MESSAGES, formatPrice, whatsappLink } from '../data/site'
import { hasBackend } from '../lib/backend'
import { accessToken, linkFromUrl, loadProfile, myOrders, verifyEmailLink } from '../lib/auth'
import { api, payWithRazorpay } from '../lib/razorpay'
import { ORDER_STAGES, fmtDateTime, stageIndex, stageOf } from '../lib/orders'
import useDocumentMeta from '../hooks/useDocumentMeta'

const DONE = ['delivered', 'cancelled', 'returned']
const STATUS_STYLE = {
  awaiting_payment: 'border-wine-600/40 bg-wine-600/[0.07] text-wine-700',
  placed: 'border-gold/60 bg-gold/15 text-gold-deep',
  confirmed: 'border-gold/60 bg-gold/15 text-gold-deep',
  packed: 'border-gold/60 bg-gold/15 text-gold-deep',
  shipped: 'border-[#7aa3c7]/50 bg-[#7aa3c7]/10 text-[#2f5d86]',
  out_for_delivery: 'border-[#7aa3c7]/50 bg-[#7aa3c7]/10 text-[#2f5d86]',
  delivered: 'border-[#2f8a52]/40 bg-[#2f8a52]/10 text-[#24663d]',
  cancelled: 'border-wine-900/20 bg-wine-900/[0.05] text-wine-900/60',
  returned: 'border-wine-900/20 bg-wine-900/[0.05] text-wine-900/60',
}
const paymentText = (o) =>
  o.payment_status === 'refunded' ? `Refunded ${formatPrice(o.refunded_amount || o.total)}`
    : o.payment_status === 'partially_refunded' ? `Paid · ${formatPrice(o.refunded_amount)} refunded`
      : o.payment_status === 'paid' ? 'Paid online'
        : o.payment_status === 'cod' ? 'Cash on Delivery'
          : o.status === 'awaiting_payment' ? 'Payment pending'
            : o.payment_status === 'failed' ? 'Payment not completed' : 'Payment pending'

export default function Account() {
  useDocumentMeta('My account | Kridhya by Devanshi Agarwal', 'Your orders, deliveries and saved details.')
  const { user, ready, ensure, signOut, setUser } = useAuth()
  const [orders, setOrders] = useState(null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [linkMsg, setLinkMsg] = useState('')
  const [tab, setTab] = useState('active')
  const [paying, setPaying] = useState('')
  const [payMsg, setPayMsg] = useState({})

  // confirm-signup / email sign-in links (?token_hash=…&type=…) are checked here - works in any browser
  useEffect(() => {
    if (!hasBackend) return
    ensure().then(async () => {
      const link = linkFromUrl()
      if (link.tokenHash && ['signup', 'email', 'magiclink', 'invite', 'email_change'].includes(link.type)) {
        try {
          setUser(await verifyEmailLink(link.tokenHash, link.type))
          setLinkMsg(link.type === 'signup' ? 'Your email is confirmed - welcome to Kridhya.' : '')
        } catch (e) {
          setLinkMsg(`${e.message} Sign in below, or ask for a new email.`)
        }
      } else if (link.errorCode) {
        setLinkMsg(link.errorCode === 'otp_expired' ? 'That email link has expired or was already used. Sign in below, or ask for a new one.' : link.errorText || '')
      }
    })
  }, [ensure, setUser])

  useEffect(() => {
    if (!user) { setOrders(null); setProfile(null); return }
    myOrders().then(setOrders).catch((e) => setError(e.message))
    loadProfile(user.id).then(setProfile).catch(() => {})
  }, [user])

  const active = useMemo(() => (orders || []).filter((o) => !DONE.includes(o.status)), [orders])
  const past = useMemo(() => (orders || []).filter((o) => DONE.includes(o.status)), [orders])
  // open the tab that has something in it
  useEffect(() => { if (orders && !active.length && past.length) setTab('past') }, [orders, active.length, past.length])

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

  const name = profile?.name || user?.user_metadata?.full_name || ''
  const first = name.split(' ')[0]
  const initials = (name || user?.email || '?').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const list = tab === 'active' ? active : past

  return (
    <>
      <InfoHero
        eyebrow="My account"
        title={user ? (first ? `Hello, ${first}` : 'Your account') : 'Sign in'}
        intro={user ? 'Your orders, deliveries and saved details - all in one place.' : 'Follow your orders and keep your bag on every device.'}
      />
      <section className="section bg-ivory">
        <div className="container-site">
          {linkMsg && <p role="status" className="mb-6 border border-gold/40 bg-gold/10 px-4 py-3 text-[14.5px] text-wine-900">{linkMsg}</p>}
          {!hasBackend ? (
            <p className="text-[15px] text-wine-900/70">Accounts will be available once the online store is live.</p>
          ) : !ready ? (
            <p className="text-[15px] text-wine-900/60">One moment…</p>
          ) : !user ? (
            <div className="mx-auto max-w-md"><SignIn title="Sign in to your account" /></div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
              {/* ───── profile ───── */}
              <aside className="lg:col-span-4">
                <div className="border border-gold/40 bg-cream/50 lg:sticky lg:top-28">
                  <div className="flex items-center gap-4 border-b border-gold/30 p-6">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold bg-wine-900 font-brand text-[18px] tracking-[0.08em] text-gold-light">{initials}</span>
                    <div className="min-w-0">
                      {name && <p className="truncate font-display text-[21px] leading-tight">{name}</p>}
                      <p className="truncate text-[13.5px] text-wine-900/65">{user.email}</p>
                      {profile?.phone && <p className="num text-[13.5px] text-wine-900/65">{profile.phone}</p>}
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 border-b border-gold/30">
                    <div className="border-r border-gold/30 p-4 text-center">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-wine-900/55">In progress</dt>
                      <dd className="num mt-1 font-display text-[28px] leading-none">{orders ? active.length : '–'}</dd>
                    </div>
                    <div className="p-4 text-center">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-wine-900/55">All orders</dt>
                      <dd className="num mt-1 font-display text-[28px] leading-none">{orders ? orders.length : '–'}</dd>
                    </div>
                  </dl>

                  <div className="border-b border-gold/30 p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">Saved delivery address</p>
                    {profile?.address?.line1 ? (
                      <p className="mt-2 text-[14px] leading-relaxed text-wine-900/80">
                        {profile.address.line1}{profile.address.line2 && <>, {profile.address.line2}</>}<br />
                        {profile.address.city}, {profile.address.state} <span className="num">{profile.address.pin}</span>
                      </p>
                    ) : (
                      <p className="mt-2 text-[14px] text-wine-900/60">Saved automatically with your first order - next time checkout fills it in for you.</p>
                    )}
                  </div>

                  <nav className="p-3" aria-label="Account">
                    <Link to="/shop" className="flex min-h-[44px] items-center gap-3 px-3 text-[14px] hover:bg-gold/10"><IconBag size={17} className="text-gold-deep" /> Continue shopping</Link>
                    <Link to="/track-order" className="flex min-h-[44px] items-center gap-3 px-3 text-[14px] hover:bg-gold/10"><IconTruck size={17} className="text-gold-deep" /> Track an order</Link>
                    <a href={whatsappLink(WHATSAPP_MESSAGES.general)} target="_blank" rel="noreferrer" className="flex min-h-[44px] items-center gap-3 px-3 text-[14px] hover:bg-gold/10"><IconWhatsApp size={17} className="text-gold-deep" /> Help on WhatsApp</a>
                    <button type="button" onClick={signOut} className="mt-2 flex min-h-[44px] w-full items-center justify-center border border-wine-900/20 text-[12px] font-semibold uppercase tracking-[0.16em] text-wine-900 hover:border-wine-900 hover:bg-wine-900 hover:text-ivory">Sign out</button>
                  </nav>
                </div>
              </aside>

              {/* ───── orders ───── */}
              <div className="lg:col-span-8">
                <div className="flex items-end justify-between gap-4 border-b border-wine-900/15">
                  <div className="flex gap-1" role="tablist" aria-label="Orders">
                    {[['active', 'In progress', active.length], ['past', 'Past orders', past.length]].map(([id, label, n]) => (
                      <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                        className={`-mb-px min-h-[48px] border-b-2 px-3 text-[12px] font-semibold uppercase tracking-[0.16em] transition-colors ${tab === id ? 'border-wine-800 text-wine-900' : 'border-transparent text-wine-900/50 hover:text-wine-900'}`}>
                        {label} <span className="num ml-1 text-wine-900/40">{orders ? n : ''}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p role="alert" className="mt-5 text-[14px] text-wine-600">Could not load your orders: {error}</p>}

                {orders === null ? (
                  <div className="mt-6 space-y-4">{[0, 1].map((i) => <div key={i} className="h-44 animate-pulse border border-gold/25 bg-cream/40" />)}</div>
                ) : list.length === 0 ? (
                  <div className="mt-6 border border-gold/40 bg-cream/40 px-6 py-12 text-center">
                    <LotusMark className="mx-auto h-10 w-10 text-gold-deep" />
                    <p className="mt-4 font-display text-[24px]">{tab === 'active' ? 'Nothing on its way right now' : 'No past orders yet'}</p>
                    <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-wine-900/65">{tab === 'active' ? 'When you place an order, you can follow every step here.' : 'Delivered and cancelled orders will appear here.'}</p>
                    <Link to="/shop" className="btn btn-wine mt-6">Explore the collection <IconArrow size={14} /></Link>
                  </div>
                ) : (
                  <ul className="mt-6 space-y-5">
                    {list.map((o) => <OrderCard key={o.id} order={o} paying={paying} onPay={completePayment} message={payMsg[o.order_no]} />)}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function OrderCard({ order: o, paying, onPay, message }) {
  const stage = stageOf(o.status)
  const step = stageIndex(o.status)
  const units = o.items.reduce((n, i) => n + i.qty, 0)
  const shown = o.items.slice(0, 3)
  const more = o.items.length - shown.length
  const inFlow = step >= 0 && !DONE.includes(o.status)

  return (
    <li className="border border-gold/40 bg-[#f8f1e4] shadow-[0_18px_40px_-34px_rgba(43,9,18,0.45)]">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gold/30 px-5 py-4">
        <div>
          <p className="num text-[15px] font-semibold tracking-[0.02em]">{o.order_no}</p>
          <p className="mt-0.5 text-[13px] text-wine-900/55">Placed {fmtDateTime(o.created_at)}</p>
        </div>
        <span className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${STATUS_STYLE[o.status] || STATUS_STYLE.placed}`}>{stage.label}</span>
      </div>

      {/* items */}
      <ul className="divide-y divide-wine-900/[0.07] px-5">
        {shown.map((it, i) => (
          <li key={i} className="flex items-center gap-4 py-3">
            <img src={it.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 border border-gold/30 bg-cream object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[17px] leading-snug">{it.name}</p>
              <p className="text-[12px] uppercase tracking-[0.12em] text-wine-900/55">{it.finish} · <span className="num">Qty {it.qty}</span></p>
            </div>
          </li>
        ))}
        {more > 0 && <li className="py-2.5 text-[13px] text-wine-900/55">+ {more} more piece{more > 1 ? 's' : ''}</li>}
      </ul>

      {/* progress */}
      {inFlow && (
        <div className="px-5 pb-1 pt-3">
          <div className="flex gap-1" aria-hidden="true">
            {ORDER_STAGES.map((s, i) => <span key={s.id} className={`h-1 flex-1 ${i <= step ? 'bg-gold-deep' : 'bg-wine-900/10'}`} />)}
          </div>
          <p className="mt-2 text-[13px] text-wine-900/70">{stage.customer}{o.courier && ['shipped', 'out_for_delivery'].includes(o.status) ? ` · ${o.courier}` : ''}</p>
        </div>
      )}
      {o.status === 'awaiting_payment' && (
        <p className="mx-5 mt-3 border-l-2 border-wine-600/50 pl-3 text-[13.5px] text-wine-700">Your payment wasn’t completed. Your pieces are held for a short while - complete payment to confirm the order.</p>
      )}

      {/* footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gold/30 px-5 py-4">
        <div>
          <p className="num font-display text-[20px] leading-none">{formatPrice(o.total)}</p>
          <p className="mt-1 text-[12.5px] text-wine-900/55">{units} item{units > 1 ? 's' : ''} · {paymentText(o)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {o.status === 'awaiting_payment' ? (
            <button type="button" disabled={!!paying} onClick={() => onPay(o)} className="btn btn-wine disabled:opacity-60">{paying === o.order_no ? 'Opening…' : <>Complete payment <IconArrow size={14} /></>}</button>
          ) : (
            <Link to={`/track-order?order=${encodeURIComponent(o.order_no)}`} className="btn btn-outline-dark">Track order <IconArrow size={14} /></Link>
          )}
          {o.tracking_url && ['shipped', 'out_for_delivery'].includes(o.status) && (
            <a href={o.tracking_url} target="_blank" rel="noreferrer" className="btn btn-wine"><IconTruck size={16} /> Courier tracking</a>
          )}
          <a href={whatsappLink(`${WHATSAPP_MESSAGES.general} My order number is ${o.order_no}.`)} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center gap-2 px-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-wine-800 hover:text-wine-600">
            <IconWhatsApp size={15} /> Help
          </a>
        </div>
      </div>
      {message && <p role="status" className="border-t border-gold/30 px-5 py-3 text-[13.5px] text-wine-700">{message}</p>}
    </li>
  )
}
