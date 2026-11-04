import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../data/site'
import { getCategory } from '../data/products'
import { IconArrow, IconArrowLeft, IconBag } from './Icons'
import { EASE } from './motion'

const SPRING = { type: 'spring', stiffness: 170, damping: 26, mass: 0.9 }
const AUTOPLAY = 4200
const PERSPECTIVE = 1400
const DEPTH = 90

// 3D coverflow: the focused piece faces the viewer, neighbours swing back on a curved plane.
// Circular - cards wrap around both sides. Drag / swipe, arrows, keyboard and click-to-focus.
export default function CoverflowCarousel({ products }) {
  const n = products.length
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const { add } = useCart()
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const [width, setWidth] = useState(1200)
  const stage = useRef(null)

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    if (stage.current) ro.observe(stage.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (hover || reduce || n < 2) return
    const t = setTimeout(() => setActive((a) => (a + 1) % n), AUTOPLAY)
    return () => clearTimeout(t)
  }, [active, hover, reduce, n])

  const mobile = width < 640
  // The focused piece is the hero of the row: large and dead-centre; neighbours step down in size.
  const cardW = Math.round(mobile ? Math.min(300, width * 0.68) : Math.min(390, Math.max(240, width * 0.31)))
  const visible = mobile ? 1 : 2
  const scaleAt = (abs) => 1 - Math.min(abs, 3) * (mobile ? 0.16 : 0.15)
  // desktop: outermost visible cards land on the container edges, so the rail spans the full width
  const spacing = mobile ? cardW * 0.62 : (width / 2 - (cardW * scaleAt(visible)) / 2) / visible
  const go = (step) => setActive((a) => (((a + step) % n) + n) % n)
  const offsetOf = (i) => {
    let d = i - active
    if (d > n / 2) d -= n
    if (d < -n / 2) d += n
    return d
  }
  const current = products[active]

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Bestselling pieces"
    >
      <motion.div
        ref={stage}
        className="relative w-full select-none"
        style={{ height: cardW * 1.25 + 56, perspective: PERSPECTIVE, touchAction: 'pan-y' }}
        onPanEnd={(_, info) => {
          if (Math.abs(info.offset.x) < 40) return
          const steps = Math.max(1, Math.round(Math.abs(info.offset.x) / spacing))
          go(info.offset.x < 0 ? steps : -steps)
        }}
      >
        {/* floor glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[15%] bottom-0 h-16 bg-[radial-gradient(ellipse_at_center,rgba(43,9,18,0.22),transparent_70%)] blur-md" />

        {products.map((p, i) => {
          const d = offsetOf(i)
          const abs = Math.abs(d)
          const hidden = abs > visible
          return (
            <motion.div
              key={p.slug}
              className="absolute left-1/2 top-0"
              style={{ width: cardW, marginLeft: -cardW / 2, zIndex: 100 - abs, transformStyle: 'preserve-3d' }}
              initial={false}
              animate={{
                // counter the perspective shrink of pushed-back cards so screen spacing stays even
                x: (d * spacing * (PERSPECTIVE + abs * DEPTH)) / PERSPECTIVE,
                z: -abs * DEPTH,
                rotateY: reduce ? 0 : Math.max(-30, Math.min(30, -d * 16)),
                scale: scaleAt(abs),
                opacity: hidden ? 0 : 1 - abs * 0.12,
              }}
              transition={reduce ? { duration: 0 } : SPRING}
              aria-hidden={d !== 0}
            >
              <button
                type="button"
                tabIndex={d === 0 ? 0 : -1}
                onClick={() => (d === 0 ? navigate(`/product/${p.slug}`) : go(d))}
                className={`group block w-full bg-ivory p-2 text-left shadow-[0_30px_50px_-28px_rgba(43,9,18,0.55)] ring-1 ring-wine-900/5 transition-[filter] duration-500 ${hidden ? 'pointer-events-none' : ''} ${d === 0 ? '' : 'brightness-[0.92]'}`}
                aria-label={d === 0 ? `View ${p.name}` : `Bring ${p.name} to front`}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                  <img src={p.images[0]} alt={p.name} loading="lazy" draggable={false} data-placeholder="true" className="h-full w-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.04]" />
                  {p.badge && <span className="absolute left-2 top-2 bg-ivory/90 px-2 py-0.5 text-[11.5px] font-medium uppercase tracking-[0.16em] text-wine-900">{p.badge}</span>}
                </div>
                <div className="flex items-center justify-between gap-2 px-1 pb-1 pt-2.5">
                  <span className="truncate font-display text-[15px] font-semibold">{p.name}</span>
                  <span className="num shrink-0 text-[14px] font-semibold">{formatPrice(p.price)}</span>
                </div>
              </button>
            </motion.div>
          )
        })}
      </motion.div>

      {/* focused piece details + controls */}
      <div className="mt-10 flex w-full flex-col items-center gap-5 border-t border-wine-900/10 pt-6 sm:flex-row sm:justify-between">
        <div className="min-h-[56px] text-center sm:text-left" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={current.slug} initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.45, ease: EASE }}>
              <p className="text-[12px] uppercase tracking-[0.18em] text-gold-deep">{getCategory(current.category)?.name}</p>
              <Link to={`/product/${current.slug}`} className="link-underline mt-1 font-display text-[25px]">{current.name}</Link>
              <p className="num mt-0.5 text-[14px] text-wine-900/70">{formatPrice(current.price)}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => add(current, current.finishes[0])} className="btn btn-wine">
            <IconBag size={15} /> Add to bag
          </button>
          <span className="mx-2 font-display text-[15px] tabular-nums text-wine-900/60">
            {String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
          </span>
          <button type="button" onClick={() => go(-1)} aria-label="Previous piece" className="icon-btn h-11 w-11 border-wine-900/20 hover:border-wine-900 hover:bg-wine-900 hover:text-ivory"><IconArrowLeft size={15} /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next piece" className="icon-btn h-11 w-11 border-wine-900/20 hover:border-wine-900 hover:bg-wine-900 hover:text-ivory"><IconArrow size={15} /></button>
        </div>
      </div>
    </div>
  )
}
