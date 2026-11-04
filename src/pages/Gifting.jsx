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

function Hero() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bg = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['0%', '25%'])
  const back = useTransform(scrollYProgress, [0, 1], reduce ? ['0px', '0px'] : ['0px', '60px'])
  const front = useTransform(scrollYProgress, [0, 1], reduce ? ['0px', '0px'] : ['0px', '-90px'])
  return (
    <section ref={ref} className="grain relative isolate overflow-hidden bg-wine-900 text-ivory">
      <motion.img style={{ y: bg }} src={IMG.satinWineGold.src} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-wine-950/70 to-wine-900" />
      <div className="container-hero grid items-center gap-10 pb-16 pt-32 md:grid-cols-12 lg:min-h-[86svh] lg:pt-32">
        <div className="md:col-span-6 lg:col-span-5">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.8 }} className="eyebrow text-gold">Corporate gifting &amp; bulk orders</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.1, delay: 0.15, ease: EASE }} className="h-display mt-4">
            Gifts that are kept, not forgotten.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1, ease: EASE }} className="mt-5 max-w-md text-[14px] leading-relaxed text-ivory/75">
            Thoughtfully designed jewellery to celebrate your people - for festive seasons, milestones, clients and celebrations.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 1, ease: EASE }} className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <a href={whatsappLink(WHATSAPP_MESSAGES.gifting)} target="_blank" rel="noreferrer" className="btn btn-gold"><IconWhatsApp size={16} /> Enquire on WhatsApp</a>
            <a href="#enquire" className="btn btn-outline-light">Send an enquiry</a>
          </motion.div>
        </div>
        <div className="relative h-[380px] sm:h-[460px] md:col-span-6 lg:col-span-6 lg:col-start-7 lg:h-[540px]">
          <motion.div style={{ y: back }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.2 }} className="absolute right-0 top-0 w-[68%]">
            <img src={IMG.giftBox.src} srcSet={srcSetFor(IMG.giftBox.src)} sizes="(min-width: 1024px) 34vw, 70vw" alt={IMG.giftBox.alt} data-placeholder="true" className="aspect-[4/5] w-full object-cover" />
          </motion.div>
          <motion.div style={{ y: front }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.45 }} className="absolute bottom-0 left-0 w-[46%] border-[6px] border-wine-900">
            <img src={IMG.ringStill.src} srcSet={srcSetFor(IMG.ringStill.src)} sizes="(min-width: 1024px) 24vw, 46vw" alt={IMG.ringStill.alt} data-placeholder="true" className="aspect-square w-full object-cover" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
