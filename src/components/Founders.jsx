import { Link } from 'react-router-dom'
import { FOUNDERS } from '../data/founders'
import { LotusMark } from './Logo'
import Mandala from './Mandala'
import { IconArrow } from './Icons'

// "Meet the founder" - full profile on About, a shorter teaser on Home.
export default function Founders({ variant = 'full' }) {
  const teaser = variant === 'teaser'
  return (
    <section id="founder" className="section relative isolate scroll-mt-6 overflow-hidden bg-ivory">
      <div className="container-site">
        <p className="eyebrow font-semibold text-gold-deep">{FOUNDERS.length > 1 ? 'Meet the founders' : 'Meet the founder'}</p>
        <div className="mt-8 space-y-16">
          {FOUNDERS.map((f, i) => (
            <article key={f.name} className="grid items-center gap-10 md:grid-cols-12 md:gap-12">
              <div className={`md:col-span-5 ${i % 2 ? 'md:order-2 md:col-start-8' : ''}`}>
                <Portrait founder={f} />
              </div>
              
              <div className={`relative isolate md:col-span-7 ${i % 2 ? 'md:order-1' : 'md:col-start-7 md:col-span-6'}`}>
                {/* light mandala centred behind the name, role and bio */}
                <Mandala className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 text-gold/[0.18] sm:h-[540px] sm:w-[540px]" strokeWidth={0.7} />
                <h2 className="text-[clamp(calc(2.3rem_-_3px),calc(4.4vw_-_3px),calc(3.6rem_-_3px))] font-medium leading-[1.02]">{f.name}</h2>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">Small joys worn close to heart</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">{f.role}</p>
                <div className="hairline my-6 max-w-sm" />
                {(teaser ? f.bio.slice(0, 1) : f.bio).map((para) => (
                  <p key={para} className="mt-4 max-w-[54ch] text-[13px] font-medium leading-[1.75] text-wine-900/80">{para}</p>
                ))}
                {teaser && (
                  <Link to="/about#founder" className="mt-8 inline-flex min-h-[44px] items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.2em] text-wine-800 hover:text-wine-600">
                    Read the full story <IconArrow size={14} />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// Framed portrait; until a photo is supplied, shows an on-brand monogram card instead of a stock face.
function Portrait({ founder }) {
  return (
    <div className="mx-auto max-w-sm border border-gold/60 bg-cream p-2 shadow-[0_30px_60px_-34px_rgba(43,9,18,0.6)] md:max-w-none">
      {founder.portrait ? (
        <img src={founder.portrait} alt={`Portrait of ${founder.name}`} loading="lazy" className="aspect-[4/5] w-full object-cover" />
      ) : (
        <div className="grain relative isolate flex aspect-[4/5] w-full flex-col items-center justify-center overflow-hidden bg-wine-900 text-ivory" data-placeholder="true">
          <Mandala className="absolute -z-10 h-[130%] w-[130%] text-gold/20" />
          <LotusMark className="h-14 w-14 text-gold" />
          <span className="mt-5 font-display text-[57px] font-medium tracking-[0.12em]">{founder.initials}</span>
          <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-light">{founder.name}</span>
        </div>
      )}
    </div>
  )
}
