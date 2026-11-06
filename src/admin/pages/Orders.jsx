import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BellRing, Search, ShoppingBag } from 'lucide-react'
import { formatPrice } from '../../data/site'
import { ORDER_STAGES, fmtDateTime, isActive, stageOf } from '../../lib/orders'
import { useOrders } from '../orders'
import { hasBackend } from '../store'
import { Button, Card, Empty, Input, PageHeader, Pill } from '../ui'

const TABS = [
  ['new', 'New', (o) => o.status === 'placed'],
  ['active', 'Active', (o) => isActive(o.status)],
  ['delivered', 'Delivered', (o) => o.status === 'delivered'],
  ['unpaid', 'Unpaid', (o) => o.status === 'awaiting_payment'],
  ['cancelled', 'Cancelled / returned', (o) => ['cancelled', 'returned'].includes(o.status)],
  ['all', 'All', () => true],
]

export const statusTone = (s) => (s === 'placed' ? 'gold' : s === 'delivered' ? 'ok' : ['cancelled', 'returned'].includes(s) ? 'bad' : s === 'awaiting_payment' ? 'neutral' : 'warn')
export const StatusBadge = ({ status }) => <Pill tone={statusTone(status)}>{stageOf(status).label}</Pill>
const PAY = { paid: ['ok', 'Paid'], pending: ['neutral', 'Payment pending'], cod: ['gold', 'Cash on delivery'], refunded: ['bad', 'Refunded'], failed: ['bad', 'Payment failed'] }
export const PaymentBadge = ({ status }) => <Pill tone={(PAY[status] || PAY.pending)[0]}>{(PAY[status] || [0, status])[1]}</Pill>

export default function Orders() {
  const { orders, error, reload, fresh, clearFresh } = useOrders()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'active'
  const [q, setQ] = useState('')

  const counts = useMemo(() => Object.fromEntries(TABS.map(([id, , fn]) => [id, (orders || []).filter(fn).length])), [orders])
  const list = useMemo(() => {
    const fn = TABS.find(([id]) => id === tab)?.[2] || (() => true)
    const t = q.trim().toLowerCase()
    return (orders || []).filter(fn).filter((o) => !t || `${o.order_no} ${o.customer?.name} ${o.customer?.phone} ${o.customer?.email}`.toLowerCase().includes(t))
  }, [orders, tab, q])

  if (!hasBackend)
    return (
      <div className="space-y-5">
        <PageHeader title="Orders" />
        <Card><Empty icon={ShoppingBag} title="Orders need the database" body="Once Supabase is connected, every order placed on the website appears here and can be moved through accepted → packed → shipped → delivered." /></Card>
      </div>
    )

  return (
    <div className="space-y-5">
      <PageHeader title="Orders" subtitle={orders ? `${counts.active} active · ${counts.new} new` : 'Loading…'}>
        <Button variant="ghost" onClick={reload}>Refresh</Button>
      </PageHeader>

      {fresh > 0 && (
        <button type="button" onClick={() => { clearFresh(); setParams({ tab: 'new' }) }} className="flex w-full items-center gap-3 border border-gold bg-gold/15 px-4 py-3 text-left text-[14px] font-semibold">
          <BellRing size={17} className="text-gold-deep" /> {fresh} new order{fresh > 1 ? 's' : ''} just arrived - view
        </button>
      )}
      {error && <p role="alert" className="border border-[#e8b9c0] bg-[#fdf2f4] px-4 py-3 text-[13.5px] text-[#9b2335]">Could not load orders: {error}</p>}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setParams({ tab: id })}
              className={`h-10 shrink-0 border-b-2 px-3 text-[12px] font-semibold uppercase tracking-[0.14em] ${tab === id ? 'border-wine-800 text-wine-900' : 'border-transparent text-wine-900/55 hover:text-wine-900'}`}>
              {label} <span className="num ml-1 text-wine-900/45">{counts[id]}</span>
            </button>
          ))}
        </div>
        <label className="relative lg:w-80">
          <span className="sr-only">Search orders</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-wine-900/40" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number, name or phone" className="pl-9" />
        </label>
      </div>

      <Card className="overflow-hidden">
        {!orders ? (
          <p className="py-14 text-center text-[14px] text-wine-900/55">Loading orders…</p>
        ) : list.length === 0 ? (
          <Empty icon={ShoppingBag} title={orders.length ? 'No orders here' : 'No orders yet'} body={orders.length ? 'Try another tab or search.' : 'Orders placed on the website will appear here.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[13.5px]">
              <thead className="border-b border-wine-900/10 bg-wine-900/[0.03] text-[11.5px] font-semibold uppercase tracking-[0.12em] text-wine-900/55">
                <tr><th className="px-4 py-3">Order</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Items</th><th className="px-3 py-3 text-right">Total</th><th className="px-3 py-3">Payment</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-wine-900/10">
                {list.map((o) => (
                  <tr key={o.id} onClick={() => nav(`/admin/orders/${o.id}`)} className="cursor-pointer hover:bg-wine-900/[0.03]">
                    <td className="px-4 py-3"><span className="num block font-semibold">{o.order_no}</span><span className="text-[12px] text-wine-900/50">{fmtDateTime(o.created_at)}</span></td>
                    <td className="px-3 py-3"><span className="block font-medium">{o.customer?.name}</span><span className="num text-[12px] text-wine-900/50">{o.customer?.phone}</span></td>
                    <td className="num px-3 py-3 text-wine-900/70">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                    <td className="num px-3 py-3 text-right font-semibold">{formatPrice(o.total)}</td>
                    <td className="px-3 py-3"><PaymentBadge status={o.payment_status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="text-[12.5px] text-wine-900/50">Stages: {ORDER_STAGES.map((s) => s.label).join(' → ')}</p>
    </div>
  )
}
