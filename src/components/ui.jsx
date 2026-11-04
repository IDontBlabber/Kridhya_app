import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { formatPrice } from '../data/site'
import { getCategory } from '../data/products'
import { srcSetFor } from '../data/images'
import { useCart } from '../context/CartContext'
import { IconArrow, IconBag, IconChevron } from './Icons'
import { EASE, FadeUp, blurChild } from './motion'
import { LotusMark } from './Logo'

export function SectionHeading({ eyebrow, title, intro, align = 'left', light = false, action }) {
  const center = align === 'center'
  return (
    <div className={`flex flex-col gap-5 ${center ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'}`}>
      <div className={center ? 'max-w-2xl' : 'max-w-xl'}>
        {eyebrow && <FadeUp as="p" className={`eyebrow ${light ? 'text-gold' : 'text-gold-deep'}`}>{eyebrow}</FadeUp>}
        <FadeUp as="h2" delay={0.05} className={`h-section mt-3 ${light ? 'text-ivory' : 'text-wine-900'}`}>{title}</FadeUp>
        {intro && (
          <FadeUp as="p" delay={0.1} className={`mt-3 text-[15px] leading-relaxed ${center ? 'mx-auto' : ''} ${light ? 'text-ivory/70' : 'text-wine-900/65'}`}>
            {intro}
          </FadeUp>
        )}
      </div>
      {action && <FadeUp delay={0.15} className="shrink-0">{action}</FadeUp>}
    </div>
  )
}

export function TextLink({ to, children, light = false }) {
  return (
    <Link to={to} className={`group inline-flex min-h-[44px] items-center gap-2 text-[12px] font-medium uppercase tracking-[0.2em] ${light ? 'text-gold-light' : 'text-wine-800'}`}>
      <span className="link-underline">{children}</span>
      <IconArrow size={14} className="transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
    </Link>
  )
}

export function ProductCard({ product, priority = false }) {
  const { add } = useCart()
  const second = product.images[1]
  return (
    <motion.article variants={blurChild} className="group relative">
      <Link to={`/product/${product.slug}`} className="block" aria-label={`${product.name}, ${formatPrice(product.price)}`}>
        <div className="relative aspect-square overflow-hidden bg-cream">
          <img
            src={product.images[0]}
            alt={`${product.name} - ${product.short}`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            data-placeholder={product.placeholder ? 'true' : undefined}
            className="absolute inset-0 h-full w-full object-cover mix-blend-multiply transition-transform duration-700 ease-luxe group-hover:scale-[1.04]"
          />
          {second && (
            <img src={second} alt="" loading="eager" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none' }} className="absolute inset-0 h-full w-full bg-cream object-cover opacity-0 transition-[opacity,transform] duration-700 ease-luxe group-hover:scale-[1.04] [@media(hover:hover)]:group-hover:opacity-100" />
          )}
          {product.badge && (
            <span className="absolute left-2.5 top-2.5 bg-ivory/90 px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-wine-900">{product.badge}</span>
          )}
        </div>
      </Link>
      <button
        type="button"
        onClick={() => add(product, product.finishes[0])}
        className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center bg-wine-900/90 text-ivory transition-all duration-500 ease-luxe hover:bg-gold hover:text-wine-950 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        aria-label={`Add ${product.name} to bag`}
      >
        <IconBag size={16} />
      </button>
      {/* name and price stack below lg (narrow grid columns); side by side on desktop */}
      <div className="mt-2.5 sm:mt-3 lg:flex lg:items-start lg:justify-between lg:gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold-deep sm:text-[12px] sm:tracking-[0.16em]">{getCategory(product.category)?.name}</p>
          <h3 className="mt-0.5 line-clamp-2 font-display text-[16px] leading-snug sm:text-[19px] lg:text-[20px]">
            <Link to={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>
        <p className="num mt-1 shrink-0 text-[14px] font-semibold sm:text-[15px] lg:mt-0 lg:pt-4">{formatPrice(product.price)}</p>
      </div>
    </motion.article>
  )
}

const FINISH_COLORS = { Gold: '#D4AF6A', 'Rose Gold': '#D9A08A', Silver: '#C9CBCE' }
export function FinishDot({ finish, size = 12 }) {
  return <span title={finish} className="inline-block rounded-full ring-1 ring-black/10" style={{ width: size, height: size, background: `linear-gradient(135deg, ${FINISH_COLORS[finish]}, #fff8 60%, ${FINISH_COLORS[finish]})` }} />
}

// Page header in the Corporate Gifting style: plain burgundy satin behind the (transparent) site header,
// copy on the left, framed photography on the right - so nothing busy ever sits under the navigation.
export function PageHero({ eyebrow, title, intro, image, imageAlt = '', position = 'center', square = false, detail, detailAlt = '', children }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bg = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['0%', '25%'])
  const back = useTransform(scrollYProgress, [0, 1], reduce ? ['0px', '0px'] : ['0px', '60px'])
  const front = useTransform(scrollYProgress, [0, 1], reduce ? ['0px', '0px'] : ['0px', '-80px'])
  const textY = useTransform(scrollYProgress, [0, 1], reduce ? ['0px', '0px'] : ['0px', '-50px'])
  const o = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  return (
    <section ref={ref} className="grain relative isolate overflow-hidden bg-wine-900 text-ivory">
      <motion.img style={{ y: bg }} src="/images/generated/satin-wine-gold.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-wine-950/70 to-wine-900" />
      <div className={`${square ? 'container-site lg:gap-14' : 'container-hero'} grid items-center gap-10 pb-10 pt-32 md:grid-cols-12 lg:min-h-[72svh] lg:pb-12 lg:pt-36`}>
        <motion.div style={{ y: textY, opacity: o }} className={`md:col-span-6 ${square ? '' : 'lg:col-span-5'}`}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="eyebrow text-gold">{eyebrow}</motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
            className="h-display mt-4"
          >
            {title}
          </motion.h1>
          {intro && (
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4, ease: EASE }} className="mt-5 max-w-md text-[14px] leading-relaxed text-ivory/75">
              {intro}
            </motion.p>
          )}
          {children}
        </motion.div>
        {image && !detail && (
          <motion.div style={{ y: back }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.2 }} className={`w-full md:col-span-6 ${square ? '' : 'lg:col-span-5 lg:col-start-8'}`}>
            <div className={`mx-auto border border-gold/50 p-1.5 ${square ? 'max-w-[400px] sm:max-w-[480px] md:mr-0 lg:max-w-[540px]' : 'max-w-[460px] md:mr-0'}`}>
              <img src={image} srcSet={srcSetFor(image)} sizes="(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 100vw" alt={imageAlt} data-placeholder={image.includes('/brand/') ? undefined : 'true'} className={`${square ? 'aspect-square' : 'aspect-[4/5]'} w-full object-cover`} style={{ objectPosition: position }} />
            </div>
          </motion.div>
        )}
        {image && detail && (
          <div className="relative h-[340px] sm:h-[440px] md:col-span-6 lg:col-span-6 lg:col-start-7 lg:h-[520px]">
            <motion.div style={{ y: back }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.2 }} className="absolute right-0 top-0 w-[68%]">
              <img src={image} srcSet={srcSetFor(image)} sizes="(min-width: 1024px) 34vw, 70vw" alt={imageAlt} data-placeholder="true" className="aspect-[4/5] w-full object-cover" style={{ objectPosition: position }} />
            </motion.div>
            {detail && (
              <motion.div style={{ y: front }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.45 }} className="absolute bottom-0 left-0 w-[46%] border-[6px] border-wine-900">
                <img src={detail} srcSet={srcSetFor(detail)} sizes="(min-width: 1024px) 24vw, 46vw" alt={detailAlt} data-placeholder="true" className="aspect-square w-full object-cover" />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// Numbered "on this page" list for page heroes - fills the copy column with useful jump links.
export function HeroIndex({ items }) {
  return (
    <ol className="mt-9 max-w-md border-t border-ivory/15">
      {items.map((it, i) => (
        <li key={it.href} className="border-b border-ivory/15">
          <a href={it.href} className="flex min-h-[52px] items-center gap-4 py-2.5 hover:text-gold-light">
            <span className="num w-6 text-[12px] text-gold">0{i + 1}</span>
            <span className="flex-1 font-display text-[21px] font-medium leading-tight">{it.label}</span>
            <IconArrow size={15} className="rotate-90 text-gold" />
          </a>
        </li>
      ))}
    </ol>
  )
}

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-[12px] uppercase tracking-[0.16em] text-wine-900/55">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {it.to ? <Link to={it.to} className="link-underline inline-block py-2.5 hover:text-gold-deep">{it.label}</Link> : <span aria-current="page" className="text-wine-900">{it.label}</span>}
            {i < items.length - 1 && <IconChevron size={11} />}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Ornament({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/70" />
      <LotusMark className="h-6 w-6 text-gold" />
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/70" />
    </div>
  )
}
