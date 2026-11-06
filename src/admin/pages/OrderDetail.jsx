import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, MessageCircle, Phone } from 'lucide-react'
import { formatPrice } from '../../data/site'
import { ORDER_STAGES, fmtDateTime, isActive, nextStage, stageIndex, stageOf } from '../../lib/orders'
import { orderApi, useOrders } from '../orders'
import { Button, Card, Confirm, Field, Input, PageHeader, Section, Select, Textarea, Toast } from '../ui'
import { PaymentBadge, StatusBadge } from './Orders'

export default function OrderDetail() {
  const { id } = useParams()
  const { orders, reload } = useOrders()
  const order = orders?.find((o) => o.id === id)
  const [events, setEvents] = useState([])
  const [note, setNote] = useState('')
  const [ship, setShip] = useState({ courier: '', trackingNo: '', trackingUrl: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')
  const [cancel, setCancel] = useState(false)
  const [adminNote, setAdminNote] = useState(null)

  const loadEvents = useCallback(() => orderApi.events(id).then(setEvents).catch(() => {}), [id])
  useEffect(() => { loadEvents() }, [loadEvents])
  useEffect(() => {
    if (order) {
      setShip({ courier: order.courier || '', trackingNo: order.tracking_no || '', trackingUrl: order.tracking_url || '' })
      setAdminNote((v) => (v === null ? order.admin_note || '' : v))
    }
  }, [order])

  if (!orders) return <p className="py-16 text-center text-wine-900/55">Loading order…</p>
  if (!order) return <p className="py-16 text-center text-wine-900/60">Order not found. <Link to="/admin/orders" className="font-semibold underline">Back to orders</Link></p>

  const next = nextStage(order.status)
  const needsShipping = next?.id === 'shipped'
  const move = async (status, label) => {
    setErr('')
    if (status === 'shipped' && !ship.courier.trim()) return setErr('Add the courier name before marking the order as shipped.')
    setBusy(true)
    try {
      await orderApi.setStatus(order.id, status, { note, courier: ship.courier, trackingNo: ship.trackingNo, trackingUrl: ship.trackingUrl })
      setNote('')
      await Promise.all([reload(), loadEvents()])
      setToast(label)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }
  const patch = async (fields, msg) => {
    try {
      await orderApi.update(order.id, fields)
      await reload()
      setToast(msg)
    } catch (e) {
      setErr(e.message)
    }
  }
  const phoneDigits = (order.customer?.phone || '').replace(/\D/g, '').slice(-10)
  const a = order.address || {}
  const current = stageIndex(order.status)

  return (
    <div className="space-y-5 pb-10">
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-wine-900/60 hover:text-wine-900"><ArrowLeft size={14} /> Orders</Link>
      <PageHeader title={order.order_no} subtitle={`Placed ${fmtDateTime(order.created_at)}`}>
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.payment_status} />
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* stage progress + next action */}
          <Section title="Progress">
            {order.status !== 'cancelled' && (
              <ol className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {ORDER_STAGES.map((s, i) => (
                  <li key={s.id} className={`border-t-2 pt-2 text-[11.5px] font-semibold uppercase tracking-[0.08em] ${i <= current ? 'border-gold-deep text-wine-900' : 'border-wine-900/15 text-wine-900/40'}`}>
                    {i <= current && <Check size={12} className="mb-0.5 inline text-gold-deep" />} {s.label}
                  </li>
                ))}
              </ol>
            )}
            {next ? (
              <div className="space-y-4">
                {needsShipping && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Courier" required><Input value={ship.courier} onChange={(e) => setShip((s) => ({ ...s, courier: e.target.value }))} placeholder="Delhivery, Blue Dart…" /></Field>
                    <Field label="Tracking number"><Input value={ship.trackingNo} onChange={(e) => setShip((s) => ({ ...s, trackingNo: e.target.value }))} /></Field>
                    <Field label="Tracking link"><Input value={ship.trackingUrl} onChange={(e) => setShip((s) => ({ ...s, trackingUrl: e.target.value.trim() }))} placeholder="https://…" /></Field>
                  </div>
                )}
                <Field label="Note for this step" hint="Optional - shown in the timeline">
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={next.id === 'confirmed' ? 'e.g. Payment received by UPI' : 'e.g. Gift-wrapped as requested'} />
                </Field>
                {err && <p role="alert" className="text-[13px] font-medium text-[#9b2335]">{err}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy} onClick={() => move(next.id, `Moved to “${next.label}”`)}>{busy ? 'Saving…' : `${stageOf(order.status).action} →`}</Button>
                  {isActive(order.status) && <Button variant="quiet" className="text-[#9b2335] hover:bg-[#f8e3e6]" onClick={() => setCancel(true)}>Cancel order</Button>}
                </div>
              </div>
            ) : (
              <p className="text-[14px] text-wine-900/65">{order.status === 'delivered' ? 'This order has been delivered.' : 'This order was cancelled and its items were returned to stock.'}</p>
            )}
          </Section>

          <Section title="Items">
            <ul className="divide-y divide-wine-900/10">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  {it.image && <img src={it.image} alt="" className="h-12 w-12 shrink-0 bg-cream object-cover" />}
                  <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{it.name}</p><p className="text-[12.5px] text-wine-900/55">{it.finish}</p></div>
                  <p className="num text-[13.5px] text-wine-900/65">{it.qty} × {formatPrice(it.price)}</p>
                  <p className="num w-24 text-right text-[14px] font-semibold">{formatPrice(it.qty * it.price)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-wine-900/10 pt-3 text-[14px]">
              <div className="flex justify-between"><dt className="text-wine-900/60">Subtotal</dt><dd className="num">{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-wine-900/60">Shipping</dt><dd className="num">{formatPrice(order.shipping)}</dd></div>
              <div className="flex justify-between text-[16px] font-semibold"><dt>Total</dt><dd className="num">{formatPrice(order.total)}</dd></div>
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
          <Section title="Payment">
            <p className="mb-3 text-[13px] text-wine-900/60">Method chosen: {order.payment_method || '-'}</p>
            <Select value={order.payment_status} onChange={(e) => patch({ payment_status: e.target.value }, 'Payment status updated')} aria-label="Payment status">
              <option value="pending">Payment pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </Select>
          </Section>
          <Section title="Internal note" hint="Only visible to the team">
            <Textarea rows={3} value={adminNote ?? ''} onChange={(e) => setAdminNote(e.target.value)} />
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => patch({ admin_note: adminNote }, 'Note saved')}>Save note</Button>
          </Section>
        </div>
      </div>

      <Confirm open={cancel} title={`Cancel ${order.order_no}?`} body="The order is marked cancelled and its items are added back to stock. The customer sees 'Cancelled' on the tracking page." confirmLabel="Cancel order" onConfirm={() => move('cancelled', 'Order cancelled')} onClose={() => setCancel(false)} />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
