import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Breadcrumbs, FinishDot, ProductCard, SectionHeading } from '../components/ui'
import { EASE, Stagger } from '../components/motion'
import { PRODUCTS, getCategory, getProduct } from '../data/products'
import { WHATSAPP_MESSAGES, formatPrice, whatsappLink } from '../data/site'
import { useCart } from '../context/CartContext'
import { IconBag, IconGift, IconMinus, IconPlus, IconWhatsApp } from '../components/Icons'
import useDocumentMeta from '../hooks/useDocumentMeta'
import NotFound from './NotFound'

export default function Product() {
  const { slug } = useParams()
  const product = getProduct(slug)
  if (!product) return <NotFound />
  return <ProductView key={slug} product={product} />
}

function ProductView({ product }) {
  const { add } = useCart()
  const cat = getCategory(product.category)
  const [img, setImg] = useState(0)
  const [finish, setFinish] = useState(product.finishes[0])
  const [qty, setQty] = useState(1)
  const [stickyBar, setStickyBar] = useState(false)
  const buyRef = useRef(null)
  useDocumentMeta(`${product.name} | Kridhya by Devanshi Agarwal`, product.short)

  // Show the mobile sticky add-to-bag bar once the main button scrolls out of view.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setStickyBar(!e.isIntersecting && e.boundingClientRect.top < 0))
    if (buyRef.current) io.observe(buyRef.current)
    return () => io.disconnect()
  }, [])

  const related = PRODUCTS.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4)

  return (
    <>
      <section className="bg-ivory pb-16 pt-28 sm:pt-32">
        <div className="container-site">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: cat.name, to: `/collections/${cat.slug}` }, { label: product.name }]} />

          <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
            {/* gallery */}
            <div className="lg:col-span-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                {product.images.length > 1 && (
                  <div className="scrollbar-none flex gap-3 overflow-x-auto sm:flex-col" role="tablist" aria-label="Product images">
                    {product.images.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        role="tab"
                        aria-selected={img === i}
                        aria-label={`View image ${i + 1}`}
                        onClick={() => setImg(i)}
                        className={`relative h-[72px] w-14 shrink-0 overflow-hidden bg-cream transition-opacity sm:h-20 sm:w-16 ${img === i ? 'opacity-100' : 'opacity-55 hover:opacity-90'}`}
                      >
                        <img src={src} alt="" className="h-full w-full object-cover mix-blend-multiply" />
                        {img === i && <span className="absolute inset-0 border border-wine-900" />}
                      </button>
                    ))}
                  </div>
                )}
                <div className="group relative aspect-square flex-1 overflow-hidden bg-cream">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.img
                      key={img}
                      src={product.images[img]}
                      alt={`${product.name} - view ${img + 1}`}
                      data-placeholder="true"
                      initial={{ opacity: 0, filter: "blur(10px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: EASE }}
                      drag={product.images.length > 1 ? 'x' : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -60) setImg((i) => (i + 1) % product.images.length)
                        if (info.offset.x > 60) setImg((i) => (i - 1 + product.images.length) % product.images.length)
                      }}
                      className="absolute inset-0 h-full w-full cursor-grab object-cover mix-blend-multiply active:cursor-grabbing"
                    />
                  </AnimatePresence>
                  {product.badge && <span className="absolute left-4 top-4 bg-ivory/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em]">{product.badge}</span>}
                </div>
              </div>
            </div>

            {/* details */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }} className="lg:col-span-5 lg:col-start-8">
              <div className="lg:sticky lg:top-28">
                <p className="eyebrow text-gold-deep">{cat.name}</p>
                <h1 className="mt-3 text-[clamp(calc(1.9rem_-_3px),calc(3.2vw_-_3px),calc(2.6rem_-_3px))] leading-[1.05]">{product.name}</h1>
                <p className="num mt-3 text-[18px] font-light">{formatPrice(product.price)}</p>
                <div className="hairline my-6" />
                <p className="text-[13px] leading-relaxed text-wine-900/75">{product.short}</p>

                <fieldset className="mt-6">
                  <legend className="eyebrow mb-3">Finish - <span className="normal-case tracking-normal text-wine-900/70">{finish}</span></legend>
                  <div className="flex flex-wrap gap-2">
                    {product.finishes.map((f) => (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={finish === f}
                        onClick={() => setFinish(f)}
                        className={`inline-flex min-h-[44px] items-center gap-2 border px-4 text-[13px] transition-colors ${finish === f ? 'border-wine-900 bg-wine-900 text-ivory' : 'border-wine-900/20 hover:border-wine-900/50'}`}
                      >
                        <FinishDot finish={f} size={14} /> {f}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div ref={buyRef} className="mt-6 flex gap-3">
                  <div className="flex items-center border border-wine-900/20">
                    <button type="button" className="inline-flex h-11 w-10 items-center justify-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><IconMinus size={14} /></button>
                    <span className="w-8 text-center" aria-live="polite" aria-label={`Quantity ${qty}`}>{qty}</span>
                    <button type="button" className="inline-flex h-11 w-10 items-center justify-center" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity"><IconPlus size={14} /></button>
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={() => add(product, finish, qty)} className="btn btn-wine flex-1">
                    <IconBag size={18} /> Add to bag
                  </motion.button>
                </div>
                <a href={whatsappLink(WHATSAPP_MESSAGES.product(`${product.name} (${finish})`))} target="_blank" rel="noreferrer" className="btn btn-outline-dark mt-3 w-full">
                  <IconWhatsApp size={18} /> Ask about this piece
                </a>

                <div className="mt-8 divide-y divide-wine-900/10 border-y border-wine-900/10">
                  <Accordion title="Details" defaultOpen>
                    {/* PENDING: materials, dimensions and stone details from approved WooCommerce data */}
                    <p>{product.short} Available in {product.finishes.join(', ').toLowerCase()}.</p>
                    <p className="mt-2 text-wine-900/55">Material and size specifications to be confirmed.</p>
                  </Accordion>
                  <Accordion title="Care">
                    <p>Store separately in a soft pouch. Avoid perfume, lotions and water. Wipe gently with a soft dry cloth after wearing.</p>
                  </Accordion>
                  <Accordion title="Gifting">
                    <p className="flex gap-3"><IconGift size={18} className="mt-1 shrink-0 text-gold-deep" /> Planning a gift or a bulk order? <Link to="/corporate-gifting" className="link-underline text-wine-700">Explore corporate gifting</Link>.</p>
                  </Accordion>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section bg-cream">
          <div className="container-site">
            <SectionHeading eyebrow="You may also love" title={`More ${cat.name.toLowerCase()}`} />
            <Stagger className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4 lg:gap-x-5">
              {related.map((p) => <ProductCard key={p.slug} product={p} />)}
            </Stagger>
          </div>
        </section>
      )}

      {/* mobile sticky add-to-bag */}
      <AnimatePresence>
        {stickyBar && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.45, ease: EASE }}
            className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-wine-900/10 bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"
          >
            <img src={product.images[0]} alt="" className="h-12 w-12 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[16px] leading-tight">{product.name}</p>
              <p className="num text-[13px]">{formatPrice(product.price)}</p>
            </div>
            <button type="button" onClick={() => add(product, finish, qty)} className="btn btn-wine">Add</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex min-h-[50px] w-full items-center justify-between text-left">
        <span className="eyebrow">{title}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.3 }}><IconPlus size={16} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
            <div className="pb-6 text-[13px] leading-relaxed text-wine-900/75">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
