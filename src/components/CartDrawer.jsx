import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../data/site'
import { IconClose, IconGift, IconMinus, IconPlus } from './Icons'
import { EASE } from './motion'

export default function CartDrawer() {
  const { items, open, setOpen, update, subtotal } = useCart()
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-wine-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-md flex-col bg-ivory text-wine-900"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="flex items-center justify-between border-b border-wine-900/10 px-6 py-5">
              <h2 className="text-[28px]">Your Bag</h2>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="-mr-2 inline-flex h-11 w-11 items-center justify-center" aria-label="Close bag">
                <IconClose size={22} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <IconGift size={40} className="text-gold-deep" />
                <p className="mt-5 font-display text-[25px]">Your bag is waiting</p>
                <p className="mt-2 text-[15px] text-wine-900/70">Discover pieces made for the moments that matter.</p>
                <Link to="/shop" onClick={() => setOpen(false)} className="btn btn-wine mt-8">Explore the collection</Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-wine-900/10 overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {items.map((i) => (
                      <motion.li key={i.id} layout exit={{ opacity: 0, x: 40 }} className="flex gap-4 py-5">
                        <img src={i.image} alt="" className="h-28 w-[84px] shrink-0 bg-cream object-cover" />
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between gap-3">
                            <Link to={`/product/${i.slug}`} onClick={() => setOpen(false)} className="font-display text-[21px] leading-tight">{i.name}</Link>
                            <p className="num shrink-0 text-[15px]">{formatPrice(i.price * i.qty)}</p>
                          </div>
                          <p className="mt-1 text-[12px] uppercase tracking-[0.18em] text-wine-900/60">{i.finish}</p>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center border border-wine-900/20">
                              <button type="button" className="inline-flex h-10 w-10 items-center justify-center" onClick={() => update(i.id, i.qty - 1)} aria-label={`Decrease ${i.name} quantity`}><IconMinus size={14} /></button>
                              <span className="num w-6 text-center text-[15px]" aria-live="polite">{i.qty}</span>
                              <button type="button" className="inline-flex h-10 w-10 items-center justify-center" onClick={() => update(i.id, i.qty + 1)} aria-label={`Increase ${i.name} quantity`}><IconPlus size={14} /></button>
                            </div>
                            <button type="button" onClick={() => update(i.id, 0)} className="link-underline min-h-[44px] text-[12px] uppercase tracking-[0.18em] text-wine-900/60">Remove</button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="border-t border-wine-900/10 bg-cream/60 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="eyebrow">Subtotal</span>
                    <span className="num text-[19px] font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-wine-900/60">Shipping &amp; taxes calculated at checkout.</p>
                  <Link to="/checkout" onClick={() => setOpen(false)} className="btn btn-wine mt-5 w-full">Proceed to checkout</Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
