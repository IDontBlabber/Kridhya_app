import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ExternalLink, MessageCircle, Phone, Printer, RefreshCw, RotateCcw, Truck } from 'lucide-react'
import { formatPrice } from '../../data/site'
import { ORDER_STAGES, fmtDateTime, isActive, nextStage, stageIndex, stageOf } from '../../lib/orders'
import { hasBackend } from '../../lib/backend'
import { orderApi, useOrders } from '../orders'
import { Button, Confirm, Field, Input, PageHeader, Pill, Section, Textarea, Toast, cx } from '../ui'
import { PaymentBadge, StatusBadge } from './Orders'

export default function OrderDetail() {
  const { id } = useParams()
  const { orders, reload } = useOrders()
  const order = orders?.find((o) => o.id === id)
  const [events, setEvents] = useState([])
  const [info, setInfo] = useState({ refunds: [], refundable: 0 })
  const [note, setNote] = useState('')
  const [ship, setShip] = useState({ courier: '', trackingNo: '', trackingUrl: '' })
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [adminNote, setAdminNote] = useState(null)

  const loadEvents = useCallback(() => orderApi.events(id).then(setEvents).catch(() => {}), [id])
  const loadInfo = useCallback(() => orderApi.action(id, 'info').then(setInfo).catch(() => {}), [id])
  const refreshAll = useCallback(() => Promise.all([reload(), loadEvents(), loadInfo()]), [reload, loadEvents, loadInfo])
  useEffect(() => { loadEvents(); loadInfo() }, [loadEvents, loadInfo])
  useEffect(() => {
    if (!order) return
    setShip({ courier: order.courier || '', trackingNo: order.tracking_no || '', trackingUrl: order.tracking_url || '' })
    setAdminNote((v) => (v === null ? order.admin_note || '' : v))
  }, [order])

  if (!orders) return <p className="py-16 text-center text-wine-900/55">Loading order…</p>
  if (!order) return <p className="py-16 text-center text-wine-900/60">Order not found. <Link to="/admin/orders" className="font-semibold underline">Back to orders</Link></p>

  // run a server action, show the result, refresh everything
  const run = async (key, fn, okMsg) => {
    setErr('')
    setBusy(key)
    try {
      const r = await fn()
      await refreshAll()
      setToast(r?.message || okMsg)
      return r
    } catch (e) {
      setErr(e.message)
      return { error: e.message }
    } finally {
      setBusy('')
    }
  }

  const next = nextStage(order.status)
  const move = (status, label) =>
    run(`status:${status}`, async () => {
      if (status === 'shipped' && !ship.courier.trim()) throw new Error('Add the courier name before marking the order as shipped.')
      // through the server so the customer is emailed; falls back to the database directly if the server is not set up
      try {
        await orderApi.action(order.id, 'status', { status, note, courier: ship.courier, trackingNo: ship.trackingNo, trackingUrl: ship.trackingUrl })
      } catch (e) {
        if (!/not configured|Server error 5/.test(e.message)) throw e
        await orderApi.setStatus(order.id, status, { note, courier: ship.courier, trackingNo: ship.trackingNo, trackingUrl: ship.trackingUrl })
      }
      setNote('')
    }, label)
  const patch = (fields, msg) => run('patch', () => orderApi.update(order.id, fields), msg)
  const phoneDigits = (order.customer?.phone || '').replace(/\D/g, '').slice(-10)
  const a = order.address || {}
  const current = stageIndex(order.status)
  const paidOnline = ['paid', 'partially_refunded', 'refunded'].includes(order.payment_status) && order.razorpay_payment_id

  return (
    <div className="space-y-5 pb-10">
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-wine-900/60 hover:text-wine-900"><ArrowLeft size={14} /> Orders</Link>
      <PageHeader title={order.order_no} subtitle={`Placed ${fmtDateTime(order.created_at)}${order.paid_at ? ` · paid ${fmtDateTime(order.paid_at)}` : ''}`}>
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.payment_status} />
      </PageHeader>
      {err && <p role="alert" className="border border-[#e8b9c0] bg-[#fdf2f4] px-4 py-3 text-[13.5px] font-medium text-[#9b2335]">{err}</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {/* ───── progress ───── */}
          <Section title="Progress">
            {!['cancelled', 'returned', 'awaiting_payment'].includes(order.status) && (
              <ol className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {ORDER_STAGES.map((s, i) => (
                  <li key={s.id} className={`border-t-2 pt-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] ${i <= current ? 'border-gold-deep text-wine-900' : 'border-wine-900/15 text-wine-900/40'}`}>
                    {i <= current && <Check size={12} className="mb-0.5 inline text-gold-deep" />} {s.label}
                  </li>
                ))}
              </ol>
            )}
            {next && order.status !== 'awaiting_payment' ? (
              <div className="space-y-4">
                {next.id === 'shipped' && !order.awb && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Courier" required><Input value={ship.courier} onChange={(e) => setShip((s) => ({ ...s, courier: e.target.value }))} placeholder="Delhivery, Blue Dart…" /></Field>
                    <Field label="Tracking number"><Input value={ship.trackingNo} onChange={(e) => setShip((s) => ({ ...s, trackingNo: e.target.value }))} /></Field>
                    <Field label="Tracking link"><Input value={ship.trackingUrl} onChange={(e) => setShip((s) => ({ ...s, trackingUrl: e.target.value.trim() }))} placeholder="https://…" /></Field>
                  </div>
                )}
                <Field label="Note for this step" hint="Optional - shown in the timeline">
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={next.id === 'confirmed' ? 'e.g. Checked stock, gift-wrapping' : 'e.g. Gift-wrapped as requested'} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={!!busy} onClick={() => move(next.id, `Moved to “${next.label}”`)}>{busy.startsWith('status') ? 'Saving…' : `${stageOf(order.status).action} →`}</Button>
                  {isActive(order.status) && <Button variant="quiet" className="text-[#9b2335] hover:bg-[#f8e3e6]" onClick={() => setConfirmCancel(true)}>Cancel order</Button>}
                </div>
                <p className="text-[12px] text-wine-900/50">Customers are emailed when their order ships, is out for delivery, is delivered or is cancelled.</p>
              </div>
            ) : (
              <p className="text-[14px] text-wine-900/65">
                {order.status === 'delivered' ? 'This order has been delivered.'
                  : order.status === 'awaiting_payment' ? 'Waiting for the customer to complete online payment. Unpaid orders are cancelled automatically after 30 minutes and their stock is released. Use “Check with Razorpay” if the customer says they paid.'
                    : order.status === 'returned' ? 'This parcel was returned (RTO). Its items were added back to stock.'
                      : 'This order was cancelled and its items were returned to stock.'}
              </p>
            )}
          </Section>

          <ShippingPanel order={order} busy={busy} run={run} />
          <PaymentPanel order={order} info={info} busy={busy} run={run} paidOnline={paidOnline} />

          {/* ───── items ───── */}
          <Section title="Items">
            <ul className="divide-y divide-wine-900/10">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  {it.image && <img src={it.image} alt="" className="h-12 w-12 shrink-0 bg-cream object-cover" />}
                  <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{it.name}</p><p className="text-[12.5px] text-wine-900/55">{it.finish}{it.sku ? ` · ${it.sku}` : ''}</p></div>
                  <p className="num text-[13.5px] text-wine-900/65">{it.qty} × {formatPrice(it.price)}</p>
                  <p className="num w-24 text-right text-[14px] font-semibold">{formatPrice(it.qty * it.price)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-wine-900/10 pt-3 text-[14px]">
              <div className="flex justify-between"><dt className="text-wine-900/60">Subtotal</dt><dd className="num">{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-wine-900/60">Shipping</dt><dd className="num">{formatPrice(order.shipping)}</dd></div>
              <div className="flex justify-between text-[16px] font-semibold"><dt>Total</dt><dd className="num">{formatPrice(order.total)}</dd></div>
              {order.refunded_amount > 0 && <div className="flex justify-between text-[#9b2335]"><dt>Refunded</dt><dd className="num">− {formatPrice(order.refunded_amount)}</dd></div>}
            </dl>
          </Section>

          <Section title="Timeline">
            <ol className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3 text-[13.5px]">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-deep" />
                  <div><p className="font-semibold">{stageOf(e.status).label}{e.note && <span className="font-normal text-wine-900/65"> - {e.note}</span>}</p><p className="num text-[12px] text-wine-900/50">{fmtDateTime(e.created_at)}</p></div>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Section title="Customer">
            <p className="text-[15px] font-semibold">{order.customer?.name}</p>
            <p className="mt-1 text-[13.5px] text-wine-900/70">{order.customer?.email}</p>
            <p className="num text-[13.5px] text-wine-900/70">{order.customer?.phone}</p>
            <div className="mt-3 flex gap-2">
              <a href={`tel:+91${phoneDigits}`}><Button size="sm" variant="ghost"><Phone size={13} /> Call</Button></a>
              <a href={`https://wa.me/91${phoneDigits}?text=${encodeURIComponent(`Hello ${order.customer?.name?.split(' ')[0] || ''}, this is Kridhya by Devanshi Agarwal about your order ${order.order_no}.`)}`} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost"><MessageCircle size={13} /> WhatsApp</Button></a>
            </div>
            <h3 className="mt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-wine-900/55">Deliver to</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed">{a.line1}{a.line2 && <><br />{a.line2}</>}<br />{a.city}, {a.state} <span className="num">{a.pin}</span></p>
            {order.note && (<><h3 className="mt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-wine-900/55">Customer note</h3><p className="mt-1 text-[13.5px]">{order.note}</p></>)}
          </Section>
          <EmailPanel order={order} info={info} busy={busy} run={run} />
          <Section title="Internal note" hint="Only visible to the team">
            <Textarea rows={3} value={adminNote ?? ''} onChange={(e) => setAdminNote(e.target.value)} />
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => patch({ admin_note: adminNote }, 'Note saved')}>Save note</Button>
          </Section>
        </div>
      </div>

      <Confirm
        open={confirmCancel}
        title={`Cancel ${order.order_no}?`}
        body={`The order is marked cancelled, its items go back to stock${order.shiprocket_order_id ? ', the Shiprocket shipment is cancelled' : ''} and the customer is emailed.${paidOnline ? ' It was paid online - refund it afterwards from the Payment section.' : ''}`}
        confirmLabel="Cancel order"
        onConfirm={() => move('cancelled', 'Order cancelled')}
        onClose={() => setConfirmCancel(false)}
      />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}

/* ───────────────────────── Shipping (Shiprocket) ───────────────────────── */
function ShippingPanel({ order, busy, run }) {
  const [couriers, setCouriers] = useState(null)
  const [pick, setPick] = useState('')
  const [srError, setSrError] = useState('')
  const closed = ['awaiting_payment', 'cancelled', 'returned'].includes(order.status)
  const act = async (action, extra, msg) => {
    setSrError('')
    const r = await run(`ship:${action}`, () => orderApi.action(order.id, action, extra), msg)
    if (r?.error) setSrError(r.error)
    return r
  }
  const loadCouriers = async () => {
    const r = await act('couriers', {}, 'Couriers loaded')
    if (r?.couriers) {
      setCouriers(r.couriers)
      setPick(String((r.couriers.find((c) => c.recommended) || r.couriers[0] || {}).id || ''))
    }
  }
  const label = async () => {
    const r = await act('label', {}, 'Label ready')
    if (r?.url) window.open(r.url, '_blank', 'noopener')
  }
  const b = (k) => busy === `ship:${k}`

  return (
    <Section title="Shipping - Shiprocket" hint={order.shipping_quote?.courier ? `Quoted at checkout: ${order.shipping_quote.courier}${order.shipping_quote.etd ? ` · ETA ${order.shipping_quote.etd}` : ''}` : undefined}>
      <dl className="grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
        <div className="flex justify-between gap-3"><dt className="text-wine-900/55">Shiprocket order</dt><dd className="num">{order.shiprocket_order_id || '-'}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-wine-900/55">Shipment</dt><dd className="num">{order.shiprocket_shipment_id || '-'}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-wine-900/55">Courier</dt><dd>{order.courier || '-'}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-wine-900/55">AWB / tracking</dt><dd className="num">{order.awb || order.tracking_no || '-'}</dd></div>
      </dl>

      {closed ? (
        <p className="mt-4 text-[13px] text-wine-900/55">Shipping actions are available once the order is paid (or Cash on Delivery) and not cancelled.</p>
      ) : !hasBackend ? null : (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {!order.shiprocket_order_id && <Button size="sm" disabled={!!busy} onClick={() => act('create', {}, 'Sent to Shiprocket')}><Truck size={13} /> {b('create') ? 'Sending…' : 'Send to Shiprocket'}</Button>}
            {order.shiprocket_order_id && !order.awb && <Button size="sm" variant="ghost" disabled={!!busy} onClick={loadCouriers}>{b('couriers') ? 'Loading…' : 'Choose courier'}</Button>}
            {order.shiprocket_order_id && !order.awb && <Button size="sm" disabled={!!busy} onClick={() => act('awb', {}, 'Courier assigned')}>{b('awb') ? 'Assigning…' : 'Auto-assign best courier'}</Button>}
            {order.awb && <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => act('pickup', {}, 'Pickup requested')}>{b('pickup') ? 'Requesting…' : 'Schedule pickup'}</Button>}
            {order.awb && <Button size="sm" variant="ghost" disabled={!!busy} onClick={label}><Printer size={13} /> {b('label') ? 'Generating…' : 'Shipping label'}</Button>}
            {order.awb && <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => act('track', {}, 'Tracking updated')}><RefreshCw size={13} /> {b('track') ? 'Checking…' : 'Update tracking'}</Button>}
            {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer"><Button size="sm" variant="quiet"><ExternalLink size={13} /> Track parcel</Button></a>}
            {order.shiprocket_order_id && !['shipped', 'out_for_delivery', 'delivered'].includes(order.status) && (
              <Button size="sm" variant="quiet" className="text-[#9b2335]" disabled={!!busy} onClick={() => act('cancel-shipment', {}, 'Shipment cancelled')}>Cancel shipment</Button>
            )}
          </div>

          {couriers && !order.awb && (
            <div className="border border-gold/30 bg-ivory/60 p-3">
              {couriers.length === 0 ? (
                <p className="text-[13px] text-wine-900/60">No courier serves this route for this parcel.</p>
              ) : (
                <>
                  <ul className="max-h-64 divide-y divide-wine-900/10 overflow-y-auto">
                    {couriers.map((c) => (
                      <li key={c.id}>
                        <label className={cx('flex cursor-pointer items-center gap-3 px-1 py-2 text-[13px]', String(c.id) === pick && 'bg-gold/10')}>
                          <input type="radio" name="courier" checked={String(c.id) === pick} onChange={() => setPick(String(c.id))} className="accent-wine-800" />
                          <span className="flex-1 font-medium">{c.name}{c.recommended && <Pill tone="gold">Recommended</Pill>}</span>
                          <span className="text-wine-900/55">{c.etd ? `ETA ${c.etd}` : c.days ? `${c.days} days` : ''}{c.rating ? ` · ★ ${c.rating}` : ''}</span>
                          <span className="num w-16 text-right font-semibold">{formatPrice(c.rate)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" className="mt-3" disabled={!pick || !!busy} onClick={() => act('awb', { courierId: Number(pick) }, 'Courier assigned').then((r) => !r?.error && setCouriers(null))}>{b('awb') ? 'Assigning…' : 'Assign this courier'}</Button>
                </>
              )}
            </div>
          )}

          {/Shiprocket login (paused|failed)/.test(srError) && (
            <div className="border border-[#ecd29a] bg-[#fdf7ea] p-3 text-[13px] text-[#8a5a00]">
              <p>{srError}</p>
              <p className="mt-2">After fixing <strong>SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD</strong> in Vercel and redeploying, click:</p>
              <Button size="sm" variant="ghost" className="mt-2" disabled={!!busy} onClick={() => act('shiprocket-retry-login', {}, 'Shiprocket login works again')}><RotateCcw size={13} /> Try Shiprocket login again</Button>
            </div>
          )}
          <p className="text-[12px] text-wine-900/50">Courier updates (picked up, in transit, delivered, returned) move the order automatically through the Shiprocket webhook, and a daily check catches anything missed.</p>
        </div>
      )}
    </Section>
  )
}

/* ───────────────────────── Payment + refunds ───────────────────────── */
function PaymentPanel({ order, info, busy, run, paidOnline }) {
  const [refund, setRefund] = useState(null) // { amount, reason } while the form is open
  const [confirm, setConfirm] = useState(false)
  const method = order.payment_method === 'online' ? 'Online (Razorpay)' : order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method || '-'
  const canRefund = paidOnline && info.refundable > 0
  const amount = refund ? (refund.full ? info.refundable : Number(refund.amount) || 0) : 0
  const tone = { processed: 'ok', pending: 'warn', failed: 'bad' }

  return (
    <Section title="Payment" aside={<PaymentBadge status={order.payment_status} />}>
      <dl className="grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
        <div className="flex justify-between gap-3"><dt className="text-wine-900/55">Method</dt><dd>{method}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-wine-900/55">Amount</dt><dd className="num">{formatPrice(order.total)}</dd></div>
        {order.razorpay_payment_id && <div className="flex justify-between gap-3 sm:col-span-2"><dt className="text-wine-900/55">Razorpay payment</dt><dd className="num break-all text-right">{order.razorpay_payment_id}</dd></div>}
        {order.payment_attempts > 0 && <div className="flex justify-between gap-3 sm:col-span-2"><dt className="text-wine-900/55">Failed attempts</dt><dd className="text-right">{order.payment_attempts}{order.last_payment_error ? ` · ${order.last_payment_error}` : ''}</dd></div>}
        {order.refunded_amount > 0 && <div className="flex justify-between gap-3"><dt className="text-wine-900/55">Refunded</dt><dd className="num">{formatPrice(order.refunded_amount)}</dd></div>}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {order.razorpay_order_id && ['pending', 'failed'].includes(order.payment_status) && (
          <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run('reconcile', () => orderApi.action(order.id, 'reconcile'), 'Checked')}><RefreshCw size={13} /> {busy === 'reconcile' ? 'Checking…' : 'Check with Razorpay'}</Button>
        )}
        {canRefund && !refund && <Button size="sm" variant="ghost" onClick={() => setRefund({ full: true, amount: '', reason: '' })}><RotateCcw size={13} /> Refund</Button>}
        {order.payment_status === 'cod' && order.status === 'delivered' && <p className="text-[12.5px] text-wine-900/55">Cash on Delivery - the courier collects payment and Shiprocket remits it to you.</p>}
      </div>

      {refund && (
        <div className="mt-4 space-y-3 border border-gold/30 bg-ivory/60 p-4">
          <div className="flex flex-wrap gap-4 text-[13.5px]">
            <label className="flex items-center gap-2"><input type="radio" checked={refund.full} onChange={() => setRefund((r) => ({ ...r, full: true }))} className="accent-wine-800" /> Full refund ({formatPrice(info.refundable)})</label>
            <label className="flex items-center gap-2"><input type="radio" checked={!refund.full} onChange={() => setRefund((r) => ({ ...r, full: false }))} className="accent-wine-800" /> Partial refund</label>
          </div>
          {!refund.full && (
            <Field label="Amount (₹)" hint={`up to ${formatPrice(info.refundable)}`}>
              <Input type="number" min="1" max={info.refundable} value={refund.amount} onChange={(e) => setRefund((r) => ({ ...r, amount: e.target.value }))} />
            </Field>
          )}
          <Field label="Reason" hint="Shown on the order timeline">
            <Input value={refund.reason} onChange={(e) => setRefund((r) => ({ ...r, reason: e.target.value }))} placeholder="e.g. Customer returned the piece / Out of stock" />
          </Field>
          <div className="flex gap-2">
            <Button variant="danger" size="sm" disabled={!(amount > 0 && amount <= info.refundable) || !!busy} onClick={() => setConfirm(true)}>Refund {amount > 0 ? formatPrice(amount) : ''}</Button>
            <Button variant="quiet" size="sm" onClick={() => setRefund(null)}>Close</Button>
          </div>
        </div>
      )}

      {info.refunds?.length > 0 && (
        <ul className="mt-4 divide-y divide-wine-900/10 border-t border-wine-900/10 text-[13px]">
          {info.refunds.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="num font-semibold">{formatPrice(r.amount)}</span>
              <Pill tone={tone[r.status]}>{r.status}</Pill>
              <span className="min-w-0 flex-1 truncate text-wine-900/60">{r.reason}</span>
              <span className="num text-[12px] text-wine-900/45">{fmtDateTime(r.created_at)}</span>
            </li>
          ))}
        </ul>
      )}

      <Confirm
        open={confirm}
        title={`Refund ${formatPrice(amount)}?`}
        body="Razorpay sends the money back to the customer’s original payment method (usually 5-7 working days). This can’t be undone. The customer is emailed."
        confirmLabel="Refund now"
        onConfirm={() => run('refund', () => orderApi.action(order.id, 'refund', { amount: refund?.full ? undefined : amount, reason: refund?.reason || '' }), 'Refund started').then((r) => r && !r.error && setRefund(null))}
        onClose={() => setConfirm(false)}
      />
    </Section>
  )
}

/* ───────────────────────── Customer emails ───────────────────────── */
function EmailPanel({ order, info, busy, run }) {
  const [kind, setKind] = useState('confirmed')
  const on = info.emails
  return (
    <Section title="Customer emails" aside={on === undefined ? null : <Pill tone={on ? 'ok' : 'bad'}>{on ? 'On' : 'Off'}</Pill>}>
      {on === false ? (
        <p className="text-[13px] leading-relaxed text-wine-900/65">
          Emails are not being sent. Add <strong>BREVO_API_KEY</strong> and <strong>MAIL_FROM_EMAIL</strong> (a sender verified in Brevo) in Vercel, then redeploy.
        </p>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-wine-900/65">Sent automatically: order confirmation, shipped, out for delivery, delivered, cancelled and refunds - to {order.customer?.email}.</p>
          <div className="mt-3 flex gap-2">
            <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Email to resend" className="h-8 flex-1 border border-wine-900/20 bg-ivory/60 px-2 text-[13px]">
              <option value="confirmed">Order confirmation</option>
              <option value="shipped">Shipped</option>
              <option value="out_for_delivery">Out for delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => run('email', () => orderApi.action(order.id, 'email', { kind }), 'Email sent')}>{busy === 'email' ? 'Sending…' : 'Resend'}</Button>
          </div>
        </>
      )}
    </Section>
  )
}
