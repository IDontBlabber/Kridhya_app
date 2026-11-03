// Kridhya by Devanshi Agarwal - brand mark redrawn as vector from the official logo artwork:
// a double square frame enclosing an inverted triangle between two rules, with a slender
// three-petal lotus meeting at a single point. Uses currentColor so it works in gold on
// burgundy and in burgundy on beige. Swap for the approved master SVG when the client supplies it.

export const BRAND = {
  name: 'Kridhya by Devanshi Agarwal',
  short: 'Kridhya',
  tagline: 'Small joys worn close to heart',
}

export function LotusMark({ className = '', strokeWidth = 1 }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
      {/* double frame */}
      <rect x="3" y="3" width="94" height="94" />
      <rect x="9" y="9" width="82" height="82" />
      {/* rules + inverted triangle */}
      <path d="M17 22h66M17 25h66" />
      <path d="M19 25 50 74 81 25" />
      <path d="M17 79h66" />
      {/* fine rays from the triangle edges toward the centre */}
      <path d="M30 25 50 74M70 25 50 74" strokeOpacity="0.45" strokeWidth={strokeWidth * 0.6} />
      {/* lotus: tall centre petal + two side petals, meeting at the point */}
      <path d="M50 74C43 60 43 44 50 31 57 44 57 60 50 74Z" />
      <path d="M50 74C40 66 36 53 39 41 45 49 49 61 50 74Z" />
      <path d="M50 74C60 66 64 53 61 41 55 49 51 61 50 74Z" />
      <path d="M50 74C46 63 46 52 50 42 54 52 54 63 50 74Z" strokeOpacity="0.6" />
      <circle cx="50" cy="74.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

// ── Logo variations ──────────────────────────────────────────────────────────────────────────────
//  <Logo />                horizontal lockup  - header, checkout, compact spots (mark + KRIDHYA / BY DEVANSHI AGARWAL)
//  <Logo compact />        horizontal, wordmark line only
//  <LogoStacked />         full stacked lockup - footer, 404, founder card (add withTagline for the brand line)
//  <LogoWordmark />        type only, no mark - inline sign-offs, emails, order confirmation
//  <LotusMark />           mark only - favicon, loaders, watermarks, tiny sizes
// All use currentColor / gold so they sit on burgundy (default) or beige (pass tone="dark").

// Header lockup: mark + KRIDHYA / BY DEVANSHI AGARWAL
export default function Logo({ className = '', compact = false }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LotusMark className="h-9 w-9 shrink-0 text-gold" />
      <span className="flex flex-col leading-none">
        <span className="font-brand text-[16px] font-medium tracking-[0.32em]">KRIDHYA</span>
        {!compact && <span className="mt-1.5 whitespace-nowrap font-brand text-[8.5px] font-medium tracking-[0.28em] text-gold">BY DEVANSHI AGARWAL</span>}
      </span>
      <span className="sr-only">{BRAND.name} - home</span>
    </span>
  )
}

// Type-only lockup (no mark)
export function LogoWordmark({ className = '', tone = 'light' }) {
  return (
    <span className={`inline-flex flex-col items-center text-center leading-none ${className}`}>
      <span className="font-brand text-[22px] font-medium tracking-[0.42em] [margin-right:-0.42em]">KRIDHYA</span>
      <span className={`mt-2 whitespace-nowrap font-brand text-[9.5px] font-medium tracking-[0.32em] [margin-right:-0.32em] ${tone === 'dark' ? 'text-gold-deep' : 'text-gold'}`}>BY DEVANSHI AGARWAL</span>
      <span className="sr-only">{BRAND.name}</span>
    </span>
  )
}

export const LogoMark = LotusMark

// Full stacked lockup as on the official artwork (footer, 404, founder card)
export function LogoStacked({ className = '', withTagline = false }) {
  return (
    <span className={`inline-flex flex-col items-center text-center ${className}`}>
      <LotusMark className="h-16 w-16 text-gold" />
      <span className="mt-4 font-brand text-[26px] font-medium tracking-[0.42em] [margin-right:-0.42em]">KRIDHYA</span>
      <span className="mt-2 h-px w-40 bg-gradient-to-r from-transparent via-gold/70 to-transparent" aria-hidden="true" />
      <span className="mt-2 whitespace-nowrap font-brand text-[10.5px] font-medium tracking-[0.32em] text-gold [margin-right:-0.32em]">BY DEVANSHI AGARWAL</span>
      <span className="mt-1.5 flex items-center gap-2 text-gold/80" aria-hidden="true">
        <span className="h-px w-6 bg-gold/60" />
        <span className="text-[13px] leading-none">~</span>
        <span className="h-px w-6 bg-gold/60" />
      </span>
      {withTagline && <span className="mt-4 font-display text-[16px] italic text-ivory/85">{BRAND.tagline}</span>}
      <span className="sr-only">{BRAND.name}</span>
    </span>
  )
}
