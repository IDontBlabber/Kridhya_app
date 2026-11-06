// Order stages - one list shared by the customer tracking page and Admin > Orders.
// Keep in sync with the status check in backend/database/schema.sql.

export const ORDER_STAGES = [
  { id: 'placed', label: 'Order placed', customer: 'We have received your order.', action: 'Accept order' },
  { id: 'confirmed', label: 'Order accepted', customer: 'Your order is confirmed and being prepared.', action: 'Move to packing' },
  { id: 'packed', label: 'Packed', customer: 'Your jewellery is packed and ready to ship.', action: 'Mark as shipped' },
  { id: 'shipped', label: 'Shipped', customer: 'Your order is on its way with our delivery partner.', action: 'Out for delivery' },
  { id: 'out_for_delivery', label: 'Out for delivery', customer: 'Arriving today.', action: 'Mark as delivered' },
  { id: 'delivered', label: 'Delivered', customer: 'Delivered - we hope you love it.' },
]
export const CANCELLED = { id: 'cancelled', label: 'Cancelled', customer: 'This order was cancelled.' }

export const stageIndex = (status) => ORDER_STAGES.findIndex((s) => s.id === status)
export const stageOf = (status) => ORDER_STAGES.find((s) => s.id === status) || (status === 'cancelled' ? CANCELLED : { id: status, label: status })
export const nextStage = (status) => {
  const i = stageIndex(status)
  return i >= 0 && i < ORDER_STAGES.length - 1 ? ORDER_STAGES[i + 1] : null
}
export const isActive = (status) => !['delivered', 'cancelled'].includes(status)

export const fmtDateTime = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
