import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ProductCard, SectionHeading } from '../components/ui'
import { EASE, Stagger, blurChild } from '../components/motion'
import ContactEnquiry from '../components/ContactEnquiry'
import { IMG, srcSetFor } from '../data/images'
import { getProduct } from '../data/products'
import { WHATSAPP_MESSAGES, whatsappLink } from '../data/site'
import { IconArrow, IconBox, IconPen, IconSparkle, IconWhatsApp } from '../components/Icons'
import useDocumentMeta from '../hooks/useDocumentMeta'

const OCCASIONS = [
  { title: 'Festive celebrations', body: 'Diwali, New Year and seasonal gifting for teams and partners.', img: IMG.collectionStill },
  { title: 'Employee milestones', body: 'Work anniversaries, promotions and recognition moments.', img: IMG.heartRose },
  { title: 'Client appreciation', body: 'A considered thank-you that stays long after the meeting.', img: IMG.giftBox },
  { title: 'Weddings & events', body: 'Bridesmaid gifts, family favours and celebration keepsakes.', img: IMG.womanWearing },
]
const STEPS = [
  { icon: IconWhatsApp, title: 'Share your brief', body: 'Occasion, quantity, timeline and budget range - on WhatsApp or via the form.' },
  { icon: IconSparkle, title: 'Receive a curation', body: 'We suggest pieces from the collection that suit your recipients.' },
  { icon: IconPen, title: 'Confirm the details', body: 'Finalise designs, quantities and delivery timelines with our team.' },
  { icon: IconBox, title: 'Gift with confidence', body: 'Your order is prepared and dispatched as agreed.' },
]
const HIGHLIGHTS = ['infinity-heart-necklace', 'bindu', 'ananta-gulabi', 'lemniscate-brooch'].map(getProduct)

export default function Gifting() {
  useDocumentMeta('Corporate Gifting & Bulk Orders | Kridhya by Devanshi Agarwal', 'Jewellery gifts for teams, clients and celebrations. Enquire about corporate gifting and bulk orders with Kridhya by Devanshi Agarwal.')
  return (
    <>
      <Hero />

      {/* value proposition */}
      <section className="section bg-ivory">
        <div className="container-site grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Why jewellery" title="A gift with meaning" />
          </div>
          <Stagger className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
            {[
              ['Personal', 'Worn close and remembered - a gesture that feels individual, even at scale.'],
              ['Lasting', 'Timeless silhouettes chosen to suit a wide range of tastes and ages.'],
              ['Effortless', 'One point of contact from first enquiry through to dispatch.'],
            ].map(([t, b]) => (
              <motion.div key={t} variants={blurChild} className="border-t border-gold/60 pt-5">
                <h3 className="font-display text-[25px]">{t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-wine-900/65">{b}</p>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* occasions - simple static cards */}
      <section className="section bg-cream">
        <div className="container-site">
          <SectionHeading eyebrow="Gifting occasions" title="For every reason to celebrate" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {OCCASIONS.map((o, i) => (
              <article key={o.title} className="flex flex-col border border-gold/40 bg-ivory p-2">
                <img src={o.img.src} srcSet={srcSetFor(o.img.src)} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" alt={o.img.alt} loading="lazy" data-placeholder="true" className="aspect-[4/3] w-full object-cover" />
                <div className="flex flex-1 flex-col p-4 pt-5">
                  <p className="num text-[12px] font-semibold text-gold-deep">0{i + 1}</p>
                  <h3 className="mt-1 font-display text-[25px] font-semibold leading-tight">{o.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] font-medium leading-relaxed text-wine-900/75">{o.body}</p>
                  <a href={whatsappLink(WHATSAPP_MESSAGES.gifting)} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-[44px] items-center gap-2 self-start text-[12px] font-semibold uppercase tracking-[0.18em] text-wine-800 hover:text-wine-600">
                    Enquire for this occasion <IconArrow size={13} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* collection highlights */}
      <section className="section bg-ivory">
        <div className="container-site">
          <SectionHeading eyebrow="Collection highlights" title="Pieces that suit everyone" intro="Understated, versatile designs that work across teams and tastes." />
          <Stagger className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4 lg:gap-x-5">
            {HIGHLIGHTS.map((p) => <ProductCard key={p.slug} product={p} />)}
          </Stagger>
        </div>
      </section>

      {/* process */}
      <section className="section grain relative bg-wine-900 text-ivory">
        <div className="container-site">
          <SectionHeading light eyebrow="How it works" title="A simple, personal process" />
          <Stagger className="mt-10 grid gap-px bg-ivory/10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: I, title, body }, i) => (
              <motion.div key={title} variants={blurChild} className="bg-wine-900 p-6">
                <div className="flex items-center justify-between">
                  <I size={20} className="text-gold" />
                  <span className="num text-[12px] text-ivory/40">0{i + 1}</span>
                </div>
                <h3 className="mt-6 font-display text-[25px]">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ivory/65">{body}</p>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      <ContactEnquiry
        id="enquire"
        eyebrow="Start an enquiry"
        title="Let’s plan your gifting"
        intro="Share your occasion, quantity and timeline - our team will come back with the options available."
        occasions={[...OCCASIONS.map((o) => o.title), 'Something else']}
        message={WHATSAPP_MESSAGES.gifting}
        showQuantity
      />
    </>
  )
}

// Full-bleed banner like the home hero: the gift box sits on the left of the photograph, the copy on the right.
function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bannerY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['0%', '22%'])
  const copyY = useTransform(scrollYProgress, [0, 1], reduce ? ['0px', '0px'] : ['0px', '-110px'])
  const fade = useTransform(scrollYProgress, [0, 0.55], [1, 0])
  const img = IMG.giftingHero
  return (
    <section ref={ref} className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-wine-950 text-ivory">
      <motion.div style={{ y: bannerY }} className="absolute inset-0">
        <motion.img
          src={img.src}
          srcSet={srcSetFor(img.src)}
          sizes="100vw"
          alt={img.alt}
          fetchpriority="high"
          initial={{ scale: reduce ? 1 : 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: EASE }}
          className="h-full w-full object-cover [object-position:var(--pos-m)] md:[object-position:var(--pos)]"
          style={{ '--pos': img.position, '--pos-m': img.mobilePosition }}
        />
      </motion.div>

      {/* brand grade: burgundy tint, copy-side gradient (right) and a soft foot for phones */}
      <div className="pointer-events-none absolute inset-0 bg-wine-800/15 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-l from-wine-950/85 via-wine-950/35 to-transparent md:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-wine-950/95 via-wine-950/55 to-transparent md:h-2/5 md:from-wine-950/60 md:via-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-wine-950/55 to-transparent" />

      <motion.div style={{ y: copyY, opacity: fade }} className="container-hero relative flex h-full flex-col justify-end pb-16 sm:pb-20 md:items-end md:justify-center md:pb-0 md:pt-20">
        <div className="max-w-xl md:w-[46%] md:max-w-[560px]">
          <motion.p initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: EASE }} className="eyebrow text-gold">
            Corporate gifting &amp; bulk orders
          </motion.p>
          <h1 className="mt-4 font-display text-[clamp(1.6rem,7.6vw,calc(2.4rem_-_3px))] font-medium leading-[1.04] sm:text-[clamp(calc(2.4rem_-_3px),calc(5vw_-_3px),calc(4.2rem_-_3px))]">
            {['Gifts that are kept,', 'not forgotten.'].map((line, i) => (
              <motion.span
                key={line}
                className={`block whitespace-nowrap ${i === 1 ? 'text-gold-light' : ''}`}
                initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1, delay: 0.45 + i * 0.12, ease: EASE }}
              >
                {line}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1, ease: EASE }} className="mt-5 max-w-md text-[15px] leading-relaxed text-ivory/80">
            Thoughtfully designed jewellery to celebrate your people - for festive seasons, milestones, clients and celebrations.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 1, ease: EASE }} className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <a href={whatsappLink(WHATSAPP_MESSAGES.gifting)} target="_blank" rel="noreferrer" className="btn btn-gold"><IconWhatsApp size={16} /> Enquire on WhatsApp</a>
            <a href="#enquire" className="btn btn-outline-light backdrop-blur-sm">Send an enquiry</a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
