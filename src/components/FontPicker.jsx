import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { applyFontPair, FONT_KEY, FONT_PAIRS, getFontPair, initialFont } from '../data/fonts'
import { IconClose } from './Icons'

// Review tool: lets the client try different typeface pairings live. The choice is remembered in the browser.
// Remove <FontPicker /> from App.jsx (or set SHOW_FONT_PICKER = false in data/site.js) once a pairing is approved,
// and set DEFAULT_FONT in data/fonts.js to that pairing.
export default function FontPicker() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(initialFont)
  const panelRef = useRef(null)
  const onProduct = useLocation().pathname.startsWith('/product/')

  useEffect(() => {
    applyFontPair(active)
  }, [active])

  const choose = (id) => {
    setActive(id)
    try {
      localStorage.setItem(FONT_KEY, id)
    } catch {
      /* keep in memory */
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Preload every option's stylesheet when the panel opens so each preview shows in its own typeface.
  useEffect(() => {
    if (!open) return
    FONT_PAIRS.forEach((f) => {
      if (document.querySelector(`link[data-fp="${f.id}"]`)) return
      const l = document.createElement('link')
      l.rel = 'stylesheet'
      l.href = f.url
      l.dataset.fp = f.id
      document.head.appendChild(l)
    })
  }, [open])

  return (
    <div className={`fixed left-4 z-[70] ${onProduct ? 'bottom-[calc(84px+env(safe-area-inset-bottom))] lg:bottom-4' : 'bottom-[max(1rem,env(safe-area-inset-bottom))]'}`}>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose a typeface pairing"
          className="mb-3 flex max-h-[70svh] w-[min(22rem,calc(100vw-2rem))] flex-col border border-gold/40 bg-ivory text-wine-900 shadow-[0_24px_60px_-20px_rgba(26,5,11,0.6)]"
        >
          <div className="flex items-center justify-between border-b border-wine-900/10 px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-deep">Typeface options</p>
              <p className="text-[13px] text-wine-900/60">Tap one to preview it across the site.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close typeface options" className="-mr-2 inline-flex h-10 w-10 items-center justify-center">
              <IconClose size={18} />
            </button>
          </div>
          <ul className="overflow-y-auto">
            {FONT_PAIRS.map((f) => {
              const on = f.id === active
              return (
                <li key={f.id} className="border-b border-wine-900/10 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => choose(f.id)}
                    aria-pressed={on}
                    className={`block w-full px-4 py-3 text-left transition-colors ${on ? 'bg-cream' : 'hover:bg-cream/60'}`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-[26px] leading-tight" style={{ fontFamily: f.display, fontVariantNumeric: 'lining-nums' }}>{f.name}</span>
                      {on && <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-deep">In use</span>}
                    </span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-wine-900/70" style={{ fontFamily: f.sans, fontVariantNumeric: 'lining-nums' }}>
                      {f.note}
                    </span>
                    <span className="mt-1 block text-[14px] text-wine-900" style={{ fontFamily: f.sans, fontVariantNumeric: 'lining-nums tabular-nums' }}>
                      ₹3,450 · +91 98869 21568
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 border border-gold/50 bg-wine-950/90 px-4 text-[13px] font-medium uppercase tracking-[0.16em] text-gold-light backdrop-blur hover:border-gold hover:text-gold"
      >
        <span className="text-[17px] normal-case leading-none" style={{ fontFamily: 'var(--font-display)' }}>Aa</span>
        {getFontPair(active).name}
      </button>
    </div>
  )
}
