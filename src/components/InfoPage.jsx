import { Link } from 'react-router-dom'
import Mandala from './Mandala'
import { FadeUp } from './motion'

// Shell for text pages (FAQ, care, policies): burgundy header band + readable column on beige.
export function InfoHero({ eyebrow, title, intro }) {
  return (
    <section className="grain relative isolate overflow-hidden bg-wine-900 text-ivory">
      <Mandala className="pointer-events-none absolute -right-28 top-1/2 -z-10 h-[520px] w-[520px] -translate-y-1/2 text-gold/[0.12]" />
      <div className="container-hero pb-10 pt-36 lg:pb-14 lg:pt-44">
        <p className="eyebrow font-semibold text-gold">{eyebrow}</p>
        <h1 className="h-display mt-4 max-w-2xl font-normal">{title}</h1>
        {intro && <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ivory/80">{intro}</p>}
      </div>
    </section>
  )
}

export function DraftNote() {
  return (
    <p className="mb-8 border-l-2 border-gold pl-4 text-[14px] leading-relaxed text-wine-900/70">
      Draft text for review - final wording is pending approval from Kridhya by Devanshi Agarwal.
    </p>
  )
}

export function InfoBody({ children, aside }) {
  return (
    <section className="section bg-ivory">
      <div className="container-site grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">{children}</div>
        <aside className="lg:col-span-3 lg:col-start-10">
          <div className="border border-gold/40 bg-cream/60 p-6">
            <p className="font-display text-[23px] leading-tight">Still have a question?</p>
            <p className="mt-2 text-[15px] text-wine-900/75">Write to us and we’ll help you choose, care for or send a piece.</p>
            <Link to="/contact" className="btn btn-wine mt-5 w-full">Contact us</Link>
            {aside}
          </div>
        </aside>
      </div>
    </section>
  )
}

export function Block({ title, children, delay = 0 }) {
  return (
    <FadeUp delay={delay} className="mb-10">
      <h2 className="font-display text-[clamp(calc(1.7rem_-_4px),calc(3vw_-_4px),calc(2.2rem_-_4px))] font-medium leading-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-[1.75] text-wine-900/80">{children}</div>
    </FadeUp>
  )
}
