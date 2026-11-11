import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { LogoStacked } from '../components/Logo'
import Mandala from '../components/Mandala'
import { IconWhatsApp } from '../components/Icons'
import { CONTACT, WHATSAPP_MESSAGES, whatsappLink } from '../data/site'

// Shown to visitors while the admin has maintenance mode on.
export default function Maintenance({ message, until }) {
  const reduce = useReducedMotion()
  useEffect(() => {
    const prev = document.title
    document.title = 'We’ll be back soon | Kridhya by Devanshi Agarwal'
    return () => { document.title = prev }
  }, [])
  return (
    <main className="grain relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-wine-900 px-5 py-16 text-center text-ivory">
      <img src="/images/generated/satin-wine-gold.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-wine-950/75 to-wine-900/95" />
      <Mandala className="pointer-events-none absolute -bottom-56 -right-56 -z-10 h-[620px] w-[620px] text-gold/[0.1]" />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex max-w-xl flex-col items-center"
      >
        <LogoStacked />
        <span className="mt-10 h-px w-16 bg-gold/60" aria-hidden="true" />
        <p className="eyebrow mt-8 text-gold">A little polish in progress</p>
        <h1 className="h-display mt-4">We’ll be back soon.</h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ivory/75">
          {message || 'We’re making a few careful updates to the Kridhya store. Thank you for your patience - please visit us again shortly.'}
        </p>
        {until && <p className="mt-3 text-[13px] uppercase tracking-[0.18em] text-gold-light/80">Expected back: {until}</p>}
        <div className="mt-9 flex flex-col gap-2.5 sm:flex-row">
          <a href={whatsappLink(WHATSAPP_MESSAGES.general)} target="_blank" rel="noreferrer" className="btn btn-gold"><IconWhatsApp size={16} /> Message us on WhatsApp</a>
          <a href={`mailto:${CONTACT.email}`} className="btn btn-outline-light">{CONTACT.email}</a>
        </div>
        <a href={CONTACT.instagram.href} target="_blank" rel="noreferrer" className="mt-7 text-[13px] tracking-[0.12em] text-ivory/60 hover:text-gold-light">{CONTACT.instagram.handle}</a>
      </motion.div>
    </main>
  )
}
