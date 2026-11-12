import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import HeroSlideshow from '../components/HeroSlideshow'
import PanoramicSpreadHero from '@/components/ui/panoramic-spread-hero'
import { SectionHeading, TextLink } from '../components/ui'
import CoverflowCarousel from '../components/CoverflowCarousel'
import { FadeUp, ParallaxImage, Stagger, TiltCard, VelocityMarquee, blurChild } from '../components/motion'
import { IMG, srcSetFor } from '../data/images'
import { CATEGORIES, COLLECTIONS, HIGHLIGHTS, byCategory, PRODUCTS, getProduct } from '../data/products'
import { POSTS } from '../data/blog'
import { TAGLINE, WHATSAPP_MESSAGES, formatPrice, whatsappLink } from '../data/site'
import { IconArrow, IconWhatsApp } from '../components/Icons'
import { LotusMark } from '../components/Logo'
import Mandala from '../components/Mandala'
import Founders from '../components/Founders'
import useDocumentMeta from '../hooks/useDocumentMeta'
import { useCatalogueVersion } from '../lib/catalogue'

export default function Home() {
  useDocumentMeta('Kridhya by Devanshi Agarwal - Jewellery for the Moments That Matter', 'Thoughtfully designed jewellery for everyday elegance and meaningful gifting.')
  return (
    <>
      <HeroSlideshow />
      <PanoramicSpreadHero>
        <Link to="/shop" className="btn btn-gold">Shop the collection <IconArrow size={14} /></Link>
      </PanoramicSpreadHero>
      <Categories />
      <Band />
      <Highlights />
      <Bestsellers />
      <ParallaxColumns />
      <Gifting />
      <Founders variant="teaser" />
      <Journal />
    </>
  )
}

/* Categories - compact tiles with pointer tilt and an inner parallax image */
function Categories() {
  return (
    <section className="section bg-ivory">
      <div className="container-site">
        <SectionHeading eyebrow="Shop by category" title="Find your signature" compact action={<TextLink to="/collections">All collections</TextLink>} />
        {/* phones & tablets: compact 3-up tiles (name + count); full cards with blurb from md */}
        <Stagger className="mt-7 grid grid-cols-3 gap-2.5 sm:mt-10 sm:gap-4 lg:gap-5">
          {COLLECTIONS.map((c, i) => (
            <motion.div key={c.slug} variants={blurChild}>
              <Link to={`/collections/${c.slug}`} className="group flex h-full flex-col border border-gold/40 bg-cream/70 p-1 transition-colors hover:border-gold sm:p-1.5 md:p-2">
                <div className="aspect-[5/4] overflow-hidden bg-cream md:aspect-[4/3]">
                  <img src={c.cover} alt={`${c.name} by Kridhya`} loading="lazy" data-placeholder="true" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-luxe group-hover:scale-[1.04]" />
                </div>
                <div className="flex flex-1 flex-col items-center px-1 pb-1.5 pt-2 text-center md:items-stretch md:p-4 md:pb-3 md:text-left">
                  <span className="num hidden text-[12px] text-gold-deep md:block">0{i + 1}</span>
                  <h3 className="font-collection text-[13.5px] font-medium leading-tight tracking-[0.04em] sm:text-[17px] md:mt-1 md:text-[21px] md:tracking-[0.08em]">{c.name}</h3>
                  <p className="mt-2 hidden text-[14px] leading-relaxed text-wine-900/75 md:block">{c.blurb}</p>
                  <span className="mt-auto inline-flex items-center justify-center gap-1 pt-1 text-[10.5px] font-medium tracking-[0.04em] text-wine-900/70 md:justify-between md:gap-3 md:pt-4 md:text-[12px] md:font-semibold md:uppercase md:tracking-[0.16em] md:text-wine-700">
                    <span className="num">{byCategory(c.slug).length} pieces</span>
                    <IconArrow size={12} className="transition-transform duration-500 group-hover:translate-x-1 md:h-3.5 md:w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/* Thin brand band - drifts, and speeds up / reverses with scroll velocity */
function Band() {
  const words = [TAGLINE, 'Everyday elegance', 'Meaningful gifting', 'Timeless design']
  return (
    <VelocityMarquee className="border-y border-gold/15 bg-wine-900 py-3 text-ivory" baseVelocity={-1.5}>
      {words.map((w) => (
        <span key={w} className="flex items-center gap-6 pr-6 font-display text-[12px] italic tracking-[0.03em] sm:text-[13px]">
          {w}
          <LotusMark className="h-3 w-3 text-gold" />
        </span>
      ))}
    </VelocityMarquee>
  )
}

/* Jewellery Highlights - one large feature plus four supporting pieces */
function Highlights() {
  const items = HIGHLIGHTS.map((h) => ({ ...h, product: getProduct(h.slug) })).filter((h) => h.product)
  const [lead, ...rest] = items
  if (!lead) return null
  return (
    <section className="section bg-cream" aria-labelledby="highlights-title">
      <div className="container-site">
        <SectionHeading eyebrow="Handpicked for you" title={<span id="highlights-title">Jewellery Highlights</span>} compact intro="The pieces we reach for first - loved for gifting, layering and everyday wear." action={<TextLink to="/shop">Shop all jewellery</TextLink>} />
        <Stagger className="mt-7 grid grid-cols-2 gap-2.5 sm:mt-10 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2">
          <motion.div variants={blurChild} className="col-span-2 lg:row-span-2">
            <HighlightCard item={lead} big />
          </motion.div>
          {rest.map((h) => (
            <motion.div key={h.slug} variants={blurChild}>
              <HighlightCard item={h} />
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

function HighlightCard({ item, big = false }) {
  const { product } = item
  return (
    <Link to={`/product/${product.slug}`} className="group relative block h-full overflow-hidden border border-gold/40 bg-cream">
      <div className={`overflow-hidden ${big ? 'aspect-[4/3] sm:aspect-[4/5] lg:aspect-auto lg:h-full lg:min-h-[560px]' : 'aspect-square'}`}>
        <img src={product.images[0]} alt={`${product.name} - ${product.short}`} loading="lazy" className="h-full w-full object-cover mix-blend-multiply transition-transform duration-[1.2s] ease-luxe group-hover:scale-[1.04]" />
      </div>
      {/* phones: small cards carry their caption under the photo (nothing covers the piece); the lead card and larger screens keep the overlay */}
      <div className={big
        ? 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-wine-950/80 via-wine-950/30 to-transparent p-4 pt-16 text-ivory sm:p-5 sm:pt-16'
        : 'px-2.5 pb-3 pt-2.5 text-wine-900 sm:absolute sm:inset-x-0 sm:bottom-0 sm:bg-gradient-to-t sm:from-wine-950/85 sm:via-wine-950/45 sm:to-transparent sm:p-5 sm:pt-16 sm:text-ivory'}>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[12px] sm:tracking-[0.18em] ${big ? 'text-gold-light' : 'text-gold-deep sm:text-gold-light'}`}>{item.tag}</p>
        <h3 className={`mt-1 font-display font-medium leading-tight ${big ? 'text-[22px] sm:text-[30px]' : 'text-[15px] sm:text-[20px]'}`}>{product.name}</h3>
        {big && <p className="mt-1.5 max-w-sm text-[13.5px] leading-snug text-ivory/80 sm:text-[15px]">{item.line}</p>}
        <p className={`num mt-1 text-[13px] sm:mt-1.5 sm:text-[15px] ${big ? 'text-ivory/90' : 'text-wine-900/75 sm:text-ivory/90'}`}>{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}

function Bestsellers() {
  const tabs = [{ slug: 'all', name: 'All' }, ...COLLECTIONS.slice(0, 3)]
  const [tab, setTab] = useState('all')
  const version = useCatalogueVersion()
  const list = useMemo(
    () => (tab === 'all' ? [...PRODUCTS].filter((p) => !p.soldOut).sort((a, b) => !!b.badge - !!a.badge) : PRODUCTS.filter((p) => p.category === tab)).slice(0, 8),
    [tab, version],
  )
  return (
    <section className="section overflow-hidden bg-ivory">
      <div className="container-site">
        <SectionHeading eyebrow="Most loved" title="Pieces our clients return to" compact action={<TextLink to="/shop">Shop all</TextLink>} />
        <div className="scrollbar-none -mx-5 mt-8 flex gap-6 overflow-x-auto border-b border-wine-900/10 px-5 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter bestsellers">
          {tabs.map((t) => (
            <button
              key={t.slug}
              role="tab"
              aria-selected={tab === t.slug}
              onClick={() => setTab(t.slug)}
              className={`-mb-px min-h-[44px] min-w-[44px] shrink-0 border-b text-center text-[12px] uppercase tracking-[0.18em] transition-colors ${tab === t.slug ? 'border-wine-900 text-wine-900' : 'border-transparent text-wine-900/55 hover:text-wine-900'}`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <FadeUp className="mt-10">
          <CoverflowCarousel key={tab} products={list} />
        </FadeUp>
      </div>
    </section>
  )
}

/* Three image columns travelling at different speeds and directions */
// Phones/tablets get the auto-scrolling gallery (AevumScroller); desktop keeps the scroll-linked parallax.
const SMALL = '(max-width: 1023px)'
function useSmallScreen() {
  const [small, setSmall] = useState(() => typeof window !== 'undefined' && window.matchMedia(SMALL).matches)
  useEffect(() => {
    const mq = window.matchMedia(SMALL)
    const on = () => setSmall(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return small
}

const AEVUM_A = [['/images/products/ananta-gulabi-914b1b68.webp', 'Ananta Gulabi cuff'], ['/images/products/bindu-246a05b3.webp', 'Bindu studs'], ['/images/products/the-lemniscate-5dd8e835.webp', 'The Lemniscate necklace']]
const AEVUM_B = [['/images/editorial/double-strand-gold-satin.webp', 'Double strand necklace'], ['/images/products/infinity-brooch-faff9bb7.webp', 'Infinity brooch'], ['/images/products/sandhya-studs-2a48f163.webp', 'Sandhya studs']]
const AEVUM_C = [['/images/products/layered-eternity-336df71a.webp', 'Layered eternity ring'], ['/images/editorial/heart-necklace-rose-satin.webp', 'Infinity heart necklace'], ['/images/products/ashta-studa-ff8ef6aa.webp', 'Ashta studs']]

// Gallery print: thin gold rule around an ivory mount.
const Print = ({ src, alt, eager }) => (
  <div className="border border-gold/60 bg-ivory p-1.5 shadow-[0_18px_40px_-26px_rgba(43,9,18,0.55)] sm:p-2">
    <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" data-placeholder="true" className="aspect-[4/5] w-full object-cover outline outline-1 outline-offset-0 outline-gold/30" />
  </div>
)

// Phones/tablets: two columns of prints gliding endlessly in opposite directions inside a softly faded window.
// Pure CSS animation (smooth, battery-friendly); touching the gallery pauses it; still for reduce-motion users.
function AevumScroller() {
  const colA = [...AEVUM_A, ...AEVUM_C.slice(0, 2)]
  const colB = [...AEVUM_B, ...AEVUM_C.slice(2)]
  const lane = (list, dir, dur) => (
    <div className="aevum-lane overflow-hidden">
      <div className={`aevum-track ${dir}`} style={{ '--dur': `${dur}s` }}>
        {/* the list twice, so the loop is seamless */}
        {[...list, ...list].map(([src, alt], i) => (
          <div key={`${src}-${i}`} aria-hidden={i >= list.length || undefined} className="pb-3">
            <Print src={src} alt={i < list.length ? alt : ''} />
          </div>
        ))}
      </div>
    </div>
  )
  return (
    <div className="aevum-window relative">
      <div className="grid h-[440px] grid-cols-2 gap-3 sm:h-[560px] sm:gap-4" role="group" aria-label="Aevum pieces">
        {lane(colA, 'up', 34)}
        {lane(colB, 'down', 40)}
      </div>
    </div>
  )
}

function ParallaxColumns() {
  const ref = useRef(null)
  const small = useSmallScreen()
  const reduce = useReducedMotion()
  const Text = FadeUp
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4 })
  const up = useTransform(p, [0, 1], reduce || small ? [0, 0] : [60, -160])
  const down = useTransform(p, [0, 1], reduce || small ? [0, 0] : [-140, 80])
  const upSlow = useTransform(p, [0, 1], reduce || small ? [0, 0] : [30, -90])

  const col = (srcs, y, extra = '') => (
    <motion.div style={{ y }} className={`flex flex-col gap-4 ${extra}`}>
      {srcs.map(([src, alt]) => <Print key={src} src={src} alt={alt} />)}
    </motion.div>
  )

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-cream">
      {/* mandala backdrop (original, light, static): a large wheel behind the gallery, a smaller one under the copy */}
      <Mandala className="pointer-events-none absolute -right-48 top-1/2 -z-10 h-[900px] w-[900px] -translate-y-1/2 text-gold/25 sm:-right-40" strokeWidth={0.7} />
      <Mandala className="pointer-events-none absolute -left-40 -top-24 -z-10 h-[460px] w-[460px] text-wine-700/[0.09]" strokeWidth={0.8} />
      <div className="container-site grid items-center gap-6 py-8 sm:gap-8 sm:py-10 lg:grid-cols-12 lg:py-0">
        <div className="lg:col-span-4">
          <Text as="p" className="eyebrow text-[12px] font-semibold text-gold-deep">The collection</Text>
          <Text as="h2" delay={0.05} className="font-collection mt-2 text-[30px] font-medium leading-[1] tracking-[0.08em] sm:mt-3 sm:text-[38px] sm:tracking-[0.1em] lg:text-[clamp(calc(2.6rem_-_2px),calc(4.6vw_-_2px),calc(5rem_-_2px))]">Aevum</Text>
          <Text as="p" delay={0.08} className="mt-1.5 font-display text-[18px] italic leading-tight text-wine-700 sm:mt-2 sm:text-[21px] lg:text-[clamp(calc(1.5rem_-_1px),calc(2.4vw_-_1px),calc(2rem_-_1px))]">The Infinity Edit</Text>
          <Text as="p" delay={0.1} className="mt-3 max-w-sm text-[14px] font-medium leading-relaxed text-wine-900/75 sm:mt-5 sm:text-[15px]">
            A line with no beginning and no end - an endless loop reimagined in Gold, Rose Gold and Silver, for bonds, promises and everyday rituals.
          </Text>
          <Text delay={0.15} className="mt-5 sm:mt-6">
            <Link to="/shop" className="btn btn-wine">Discover Aevum <IconArrow size={14} /></Link>
          </Text>
        </div>
        {small ? (
          <AevumScroller />
        ) : (
          <div className="grid grid-cols-3 gap-4 overflow-hidden lg:col-span-7 lg:col-start-6 lg:h-[700px]">
            {col(AEVUM_A, up)}
            {col(AEVUM_B, down, '-mt-40')}
            {col(AEVUM_C, upSlow)}
          </div>
        )}
      </div>
    </section>
  )
}

/* Gifting - one static banner image, copy on its plain left half (no scroll animation) */
function Gifting() {
  return (
    <section className="relative isolate overflow-hidden bg-wine-950 text-ivory">
      {/* tablets and up: the wide banner, copy on its plain dark left half */}
      <img
        src={IMG.giftBanner.src}
        srcSet={srcSetFor(IMG.giftBanner.src)}
        sizes="100vw"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 -z-10 hidden h-full w-full object-cover md:block"
        style={{ objectPosition: IMG.giftBanner.position }}
      />
      {/* phones: soft wine backdrop, the framed photo as its own card above the copy (nothing sits on top of the jewellery) */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_70%_at_50%_0%,#5a1a2a_0%,#2a0a12_60%,#1a060b_100%)] md:hidden" />
      <div className="container-site flex flex-col gap-9 py-14 md:min-h-[56vw] md:flex-row md:items-center md:py-14 lg:min-h-[min(56.25vw,720px)]">
        <img
          src="/images/editorial/gift-meaningful-card-800.webp"
          srcSet="/images/editorial/gift-meaningful-card-800.webp 800w, /images/editorial/gift-meaningful-card-1200.webp 1200w"
          sizes="80vw"
          alt={IMG.giftBanner.alt}
          loading="lazy"
          decoding="async"
          className="mx-auto aspect-[4/5] w-[78%] max-w-[340px] object-cover shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)] ring-1 ring-gold/25 md:hidden"
        />
        <div className="max-w-md">
          <p className="eyebrow text-gold">Corporate gifting &amp; bulk orders</p>
          <h2 className="h-section mt-3">Gifting, made meaningful.</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ivory/75">
            Celebrate teams, clients and milestones with jewellery chosen to be kept. Tell us about your occasion and we’ll share the options available.
          </p>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Link to="/corporate-gifting" className="btn btn-gold">Explore gifting <IconArrow size={14} /></Link>
            <a href={whatsappLink(WHATSAPP_MESSAGES.gifting)} target="_blank" rel="noreferrer" className="btn btn-outline-light"><IconWhatsApp size={16} /> Enquire</a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Journal() {
  return (
    <section className="section bg-ivory">
      <div className="container-site">
        <SectionHeading eyebrow="The Journals" title="Notes on style, care & gifting" action={<TextLink to="/blog">Read the journal</TextLink>} />
        {/* phones/tablets: swipeable row with the next card peeking; 3-up grid from md */}
        <Stagger className="scrollbar-none -mx-5 mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 md:mx-0 md:mt-10 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
          {POSTS.slice(0, 3).map((p) => (
            <motion.article key={p.slug} variants={blurChild} className="group w-[80%] shrink-0 snap-start sm:w-[46%] md:w-auto">
              <Link to={`/blog/${p.slug}`} className="block">
                <div className="aspect-[3/2] overflow-hidden bg-cream">
                  <img src={p.cover} srcSet={srcSetFor(p.cover)} sizes="(min-width: 768px) 33vw, 100vw" alt={p.coverAlt} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-luxe group-hover:scale-105" />
                </div>
                <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-gold-deep sm:mt-4">{p.category} · {p.readTime}</p>
                <h3 className="mt-1.5 font-display text-[18px] leading-snug transition-colors group-hover:text-wine-600 sm:text-[22px]">{p.title}</h3>
              </Link>
            </motion.article>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

