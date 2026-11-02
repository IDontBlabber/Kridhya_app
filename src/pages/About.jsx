import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeroIndex, Ornament, PageHero, SectionHeading } from '../components/ui'
import { FadeUp, ParallaxImage, ParallaxLayer, Stagger, blurChild } from '../components/motion'
import { IMG } from '../data/images'
import { WHATSAPP_MESSAGES, whatsappLink } from '../data/site'
import { IconArrow, IconWhatsApp } from '../components/Icons'
import useDocumentMeta from '../hooks/useDocumentMeta'
import Founders from '../components/Founders'

// Copy follows the "Suggested About Us Copy — Draft for Client Approval" in the developer brief.
// Pending client sign-off; add verified brand facts only once approved.
export default function About() {
  useDocumentMeta('About Us | Kridhya by Devanshi Agarwal', 'At Kridhya by Devanshi Agarwal, we believe the smallest details can hold the most meaning.')
  const { hash } = useLocation()
  // Deep links like /about#founder land on the section once the page has rendered.
  useEffect(() => {
    if (!hash) return
    const t = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ block: 'start' }), 650)
    return () => clearTimeout(t)
  }, [hash])
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Jewellery for the moments that matter"
        intro="Thoughtful design, timeless elegance and pieces that feel personal — meet the people and the ideas behind Kridhya."
        image={IMG.necklaceCloseup.src}
        imageAlt={IMG.necklaceCloseup.alt}
        position="50% 40%"
        detail={IMG.storyStill.src}
        detailAlt={IMG.storyStill.alt}
      >
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <a href="#founder" className="btn btn-gold font-semibold">Meet the founder</a>
          <Link to="/shop" className="btn btn-outline-light font-semibold">Explore the collection</Link>
        </div>
        <HeroIndex
          items={[
            { label: 'Who we are', href: '#who-we-are' },
            { label: 'Meet the founder', href: '#founder' },
            { label: 'Our design philosophy', href: '#philosophy' },
            { label: 'Our approach', href: '#approach' },
          ]}
        />
      </PageHero>

      {/* introduction */}
      <section id="who-we-are" className="section scroll-mt-6 bg-ivory">
        <div className="container-site grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <FadeUp as="p" className="eyebrow text-gold-deep">Who we are</FadeUp>
            <FadeUp as="p" delay={0.05} className="mt-3 font-display text-[clamp(calc(1.6rem_+_2px),calc(2.6vw_+_2px),calc(2.2rem_+_2px))] font-light leading-[1.25]">
              At Kridhya by Devanshi Agarwal, we believe the smallest details can hold the most meaning.
            </FadeUp>
            <FadeUp as="p" delay={0.1} className="mt-4 max-w-[56ch] text-[16px] leading-[1.8] text-wine-900/75">
              Jewellery is more than something we wear — it can reflect our individuality, mark a special moment, or become part of a story we carry with us.
            </FadeUp>
          </div>
          <div className="grid grid-cols-2 gap-3 md:col-span-6">
            <ParallaxLayer distance={40} className="mt-10">
              <ParallaxImage src={IMG.modelPortrait.src} alt={IMG.modelPortrait.alt} placeholder ratio="3/4" strength={8} />
            </ParallaxLayer>
            <ParallaxLayer distance={-20}>
              <ParallaxImage src={IMG.storyStill.src} alt={IMG.storyStill.alt} placeholder ratio="3/4" strength={8} />
            </ParallaxLayer>
          </div>
        </div>
      </section>

      <Founders />

      {/* philosophy */}
      <section id="philosophy" className="section scroll-mt-6 bg-cream">
        <div className="container-site">
          <SectionHeading align="center" eyebrow="Our design philosophy" title="Thoughtful. Timeless. Personal." />
          <Stagger className="mt-10 grid gap-px bg-wine-900/10 sm:grid-cols-3">
            {[
              ['Thoughtful design', 'Our approach is guided by a love for considered design — pieces where every line has a reason to be there.', 'boutique', 'Watercolour illustration of the Kridhya boutique facade'],
              ['Timeless elegance', 'We favour silhouettes that outlast trends, so each piece feels as right years from now as it does today.', 'necklace-display', 'Watercolour illustration of a necklace on an ivory display bust'],
              ['Pieces that feel personal', 'From everyday expressions of style to gifts chosen for meaningful occasions, every design is made to feel uniquely yours.', 'jewellery-display', 'Watercolour illustration of jewellery displayed on burgundy velvet stands'],
            ].map(([t, b, img, alt], i) => (
              <motion.div key={t} variants={blurChild} className="bg-cream p-6 sm:p-8">
                {/* client-supplied illustration; its white ground was made transparent so it sits on the beige card */}
                <img src={`/images/illustrations/${img}.webp`} alt={alt} loading="lazy" className="mx-auto mb-5 aspect-square w-full max-w-[280px] object-contain" />
                <p className="num text-[13px] text-gold-deep">0{i + 1}</p>
                <h3 className="mt-3 font-display text-[26px]">{t}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-wine-900/65">{b}</p>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* approach + feeling */}
      <section id="approach" className="section scroll-mt-6 bg-ivory">
        <div className="container-site grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <ParallaxImage src={IMG.heartSilver.src} alt={IMG.heartSilver.alt} placeholder ratio="4/5" position="50% 40%" strength={8} />
          </div>
          <div className="space-y-10 md:col-span-6 md:col-start-7">
            <div>
              <FadeUp as="p" className="eyebrow text-gold-deep">Our approach to jewellery</FadeUp>
              <FadeUp as="h2" delay={0.05} className="h-section mt-3">From everyday style to meaningful occasions</FadeUp>
              <FadeUp as="p" delay={0.1} className="mt-4 max-w-[54ch] text-[16px] leading-[1.8] text-wine-900/75">
                We design for real life — pieces that layer with ease, sit comfortably through the day and still feel special when the moment calls for it.
              </FadeUp>
            </div>
            <div className="hairline" />
            <div>
              <FadeUp as="p" className="eyebrow text-gold-deep">What we want you to feel</FadeUp>
              <FadeUp as="p" delay={0.05} className="mt-3 font-display text-[clamp(calc(1.5rem_+_2px),calc(2.4vw_+_2px),calc(2rem_+_2px))] italic leading-snug text-wine-700">Seen, celebrated, and a little more yourself.</FadeUp>
              <FadeUp as="p" delay={0.1} className="mt-4 max-w-[54ch] text-[16px] leading-[1.8] text-wine-900/75">
                We invite you to discover jewellery that feels uniquely yours — a piece that speaks to your style, your story, and the moments you want to remember.
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* closing CTA */}
      <section className="section grain relative overflow-hidden bg-wine-900 text-center text-ivory">
        <img src={IMG.satinWine.src} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="container-site relative">
          <Ornament />
          <FadeUp as="h2" className="h-section mx-auto mt-6 max-w-xl">Find a piece that speaks to your story.</FadeUp>
          <FadeUp delay={0.1} className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row sm:flex-wrap">
            <Link to="/shop" className="btn btn-gold">Explore the collection <IconArrow size={14} /></Link>
            <a href={whatsappLink(WHATSAPP_MESSAGES.general)} target="_blank" rel="noreferrer" className="btn btn-outline-light"><IconWhatsApp size={16} /> Contact the team</a>
          </FadeUp>
        </div>
      </section>
    </>
  )
}
