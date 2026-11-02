import { Link, useLocation } from 'react-router-dom'
import { LogoStacked } from '../components/Logo'
import { WHATSAPP_MESSAGES, formatPrice, whatsappLink } from '../data/site'
import { IconWhatsApp } from '../components/Icons'
import useDocumentMeta from '../hooks/useDocumentMeta'

function lastOrder(state) {
  if (state?.id) return state
  try {
    return JSON.parse(sessionStorage.getItem('kridhya-last-order'))
  } catch {
    return null
  }
}

export default function OrderConfirmed() {
  useDocumentMeta('Order received | Kridhya by Devanshi Agarwal')
  const order = lastOrder(useLocation().state)
  const first = order?.name?.split(' ')[0]
  return (
    <section className="grain relative flex min-h-[90svh] items-center bg-wine-900 py-28 text-ivory">
      <div className="container-site max-w-2xl text-center">
        <LogoStacked withTagline className="mx-auto" />
        <h1 className="h-display mt-10">{first ? `Thank you, ${first}.` : 'Thank you.'}</h1>
        <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-ivory/80">
          We’ve received your order and will be in touch shortly to confirm delivery and payment.
        </p>
        {order?.id && (
          <dl className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-y-2 border-y border-ivory/15 py-5 text-left text-[16px]">
            <dt className="text-ivory/60">Order number</dt>
            <dd className="num text-right">{order.id}</dd>
            <dt className="text-ivory/60">Items</dt>
            <dd className="num text-right">{order.items?.reduce((n, i) => n + i.qty, 0)}</dd>
            <dt className="text-ivory/60">Subtotal</dt>
            <dd className="num text-right">{formatPrice(order.subtotal)}</dd>
          </dl>
        )}
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={whatsappLink(`${WHATSAPP_MESSAGES.general}${order?.id ? ` My order number is ${order.id}.` : ''}`)} target="_blank" rel="noreferrer" className="btn btn-gold"><IconWhatsApp size={16} /> Message us on WhatsApp</a>
          <Link to="/shop" className="btn btn-outline-light">Keep exploring</Link>
        </div>
      </div>
    </section>
  )
}
