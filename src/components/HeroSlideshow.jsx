import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { IMG } from '../data/images'
import { IconArrow, IconArrowLeft, IconPause, IconPlay } from './Icons'
import { EASE } from './motion'

const COPY = [
  { label: 'Aevum', eyebrow: 'Small joys worn close to heart', title: ['Jewellery for the', 'moments that matter.'] },
  { label: 'Bracelets & Cuffs', eyebrow: 'Small joys worn close to heart', title: ['Made to move', 'with you.'] },
  { label: 'Everyday Gold', eyebrow: 'Small joys worn close to heart', title: ['Quiet details,', 'lasting meaning.'] },
  { label: 'Gifting', eyebrow: 'Small joys worn close to heart', title: ['Gifts that are kept,', 'not forgotten.'] },
]
const SLIDES = IMG.heroSlides.map((s, i) => ({ ...s, ...COPY[i] }))
const INTERVAL = 6500
const STRIPS = 5

const srcSet = (name) =>
  [1080, 1920, 3840].map((w) => `/images/hero/hero-${name}-${w}.webp ${w}w`).join(', ')

function Banner({ slide, eager, className = '', style }) {
  return (
    <img
      src={`/images/hero/hero-${slide.name}-1920.webp`}
      srcSet={srcSet(slide.name)}
      sizes="100vw"
      alt={slide.alt}
      data-placeholder={slide.placeholder ? 'true' : undefined}
      loading={eager ? 'eager' : 'lazy'}
      fetchpriority={eager ? 'high' : 'auto'}
      decoding="async"
      className={`h-full w-full object-cover [object-position:var(--pos-m)] md:[object-position:var(--pos)] ${className}`}
      style={{ '--pos': slide.position, '--pos-m': slide.mobilePosition, ...style }}
    />
  )
}

export default function HeroSlideshow() {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [prev, setPrev] = useState(null)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const ref = useRef(null)

  // Parallax: banner sinks slower than the page, copy lifts away and fades.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bannerY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['0%', '24%'])
  const copyY = useTransform(scrollYProgress, [0, 1], reduce ? ['0px', '0px'] : ['0px', '-120px'])
  const fade = useTransform(scrollYProgress, [0, 0.55], [1, 0])

  const go = useCallback(
    (n) =>
      setIndex((cur) => {
        const next = (n + SLIDES.length) % SLIDES.length
        if (next !== cur) setPrev(cur)
        return next
      }),
    [],
  )
  const autoplay = !paused && !hover && !reduce

  useEffect(() => {
    if (!autoplay) return
    const t = setTimeout(() => go(index + 1), INTERVAL)
    return () => clearTimeout(t)
  }, [autoplay, index, go])

  useEffect(() => {
    const v = () => document.hidden && setPaused(true)
    document.addEventListener('visibilitychange', v)
    return () => document.removeEventListener('visibilitychange', v)
  }, [])

  // Warm the next banner so the shutter never reveals an empty strip.
  useEffect(() => {
    const n = SLIDES[(index + 1) % SLIDES.length]
    const img = new Image()
    img.srcset = srcSet(n.name)
    img.sizes = '100vw'
  }, [index])

  const slide = SLIDES[index]

  return (
    <motion.section
      ref={ref}
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-wine-950 text-ivory"
      style={{ touchAction: 'pan-y' }}
      aria-roledescription="carousel"
      aria-label="Featured jewellery"
      onPanEnd={(_, info) => {
        if (Math.abs(info.offset.x) < 60 || Math.abs(info.offset.x) < Math.abs(info.offset.y)) return
        go(index + (info.offset.x < 0 ? 1 : -1))
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1)
        if (e.key === 'ArrowLeft') go(index - 1)
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* banners */}
      <motion.div style={{ y: bannerY }} className="absolute inset-0">
        {prev !== null && (
          <div className="absolute inset-0">
            <Banner slide={SLIDES[prev]} />
          </div>
        )}

        {reduce ? (
          <AnimatePresence initial={false}>
            <motion.div key={index} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
              <Banner slide={slide} eager={index === 0} />
            </motion.div>
          </AnimatePresence>
        ) : (
          // Shutter reveal: the incoming banner rises in five staggered vertical strips,
          // each strip showing its own slice of one continuous image, then settles with a slow zoom-out.
          <div key={index} className="absolute inset-0" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${SLIDES.length}: ${slide.label}`}>
            {Array.from({ length: STRIPS }, (_, i) => (
              <motion.div
                key={i}
                className="absolute inset-y-0 overflow-hidden"
                style={{ left: `${(i * 100) / STRIPS}%`, width: `${100 / STRIPS + 0.05}%` }}
                initial={{ clipPath: prev === null ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)' }}
                animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                transition={{ duration: 1.15, delay: i * 0.075, ease: EASE }}
              >
                <motion.div
                  className="absolute inset-y-0"
                  style={{ width: `${STRIPS * 100}%`, left: `-${i * 100}%` }}
                  initial={{ scale: 1.14 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: INTERVAL / 1000 + 1.5, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <Banner slide={slide} eager={index === 0} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* brand grade: burgundy tint + legibility gradients */}
      <div className="pointer-events-none absolute inset-0 bg-wine-800/15 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-wine-950/75 via-wine-950/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-wine-950/85 via-wine-950/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-wine-950/50 to-transparent" />

      {/* copy */}
      <motion.div style={{ y: copyY, opacity: fade }} className="container-hero relative flex h-full flex-col justify-end pb-28 sm:pb-32">
        <div className="max-w-xl" aria-live={autoplay ? 'off' : 'polite'}>
          <AnimatePresence mode="wait">
            <motion.div key={index} initial="hidden" animate="show" exit="exit">
              <motion.p
                variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.7, delay: 0.35, ease: EASE } }, exit: { opacity: 0, transition: { duration: 0.25 } } }}
                className="eyebrow text-[12px] text-gold"
              >
                {slide.eyebrow}
              </motion.p>
              <h1 className="mt-4 font-display text-[clamp(calc(1.6rem_-_3px),calc(7.6vw_-_3px),calc(2.4rem_-_6px))] sm:text-[clamp(calc(2.4rem_-_6px),calc(5.6vw_-_6px),calc(4.6rem_-_6px))] font-medium leading-[1.02]">
                {slide.title.map((line, i) => (
                  <motion.span
                    key={line}
                    className={`block whitespace-nowrap ${i === 1 ? 'text-gold-light' : ''}`}
                    variants={{
                      hidden: { opacity: 0, y: 24, filter: 'blur(12px)' },
                      show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, delay: 0.45 + i * 0.12, ease: EASE } },
                      exit: { opacity: 0, y: -10, filter: 'blur(6px)', transition: { duration: 0.3 } },
                    }}
                  >
                    {line}
                  </motion.span>
                ))}
              </h1>
            </motion.div>
          </AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.8, ease: EASE }} className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Link to="/shop" className="btn btn-gold group">
              Explore the Collection <IconArrow size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/corporate-gifting" className="btn btn-outline-light backdrop-blur-sm">Corporate Gifting &amp; Bulk Orders</Link>
          </motion.div>
        </div>
      </motion.div>

      {/* chapter navigation */}
      <div className="absolute inset-x-0 bottom-0 border-t border-ivory/15 bg-wine-950/30 backdrop-blur-md">
        <div className="container-site flex items-stretch">
          <div className="grid flex-1 grid-cols-4" role="tablist" aria-label="Choose slide">
            {SLIDES.map((s, i) => (
              <button
                key={s.name}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show slide ${i + 1}: ${s.label}`}
                onClick={() => go(i)}
                className="group relative flex min-h-[64px] items-center gap-3 pr-3 text-left"
              >
                <span className="absolute inset-x-0 top-0 h-px bg-ivory/10">
                  {i === index && (
                    <motion.span
                      key={`${index}-${autoplay}`}
                      className="absolute inset-0 origin-left bg-gold"
                      initial={{ scaleX: autoplay ? 0 : 1 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: autoplay ? INTERVAL / 1000 : 0.3, ease: 'linear' }}
                    />
                  )}
                </span>
                <span className={`num text-[12px] transition-colors ${i === index ? 'text-gold' : 'text-ivory/45 group-hover:text-ivory/80'}`}>0{i + 1}</span>
                <span className={`hidden text-[11.5px] uppercase tracking-[0.18em] transition-colors md:inline ${i === index ? 'text-ivory' : 'text-ivory/45 group-hover:text-ivory/80'}`}>{s.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 border-l border-ivory/15 pl-3 sm:pl-4">
            <Ctrl label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused((p) => !p)}>{paused ? <IconPlay size={13} /> : <IconPause size={13} />}</Ctrl>
            <Ctrl label="Previous slide" onClick={() => go(index - 1)}><IconArrowLeft size={14} /></Ctrl>
            <Ctrl label="Next slide" onClick={() => go(index + 1)}><IconArrow size={14} /></Ctrl>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function Ctrl({ label, onClick, children }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="inline-flex h-10 w-10 items-center justify-center border border-ivory/20 transition-colors hover:border-gold hover:bg-gold hover:text-wine-950">
      {children}
    </button>
  )
}
