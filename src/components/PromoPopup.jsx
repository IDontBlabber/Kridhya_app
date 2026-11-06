import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { POPUP, popupActive } from '../data/popup'
import { IconArrow, IconClose } from './Icons'
import { EASE } from './motion'

// Pages where a promotion would interrupt a task.
const SKIP = ['/checkout', '/order-confirmed']

// Remembers that this visitor has seen this version of the banner (changing the image or link shows it again).
const seenKey = (p) => `kridhya-popup:${p.id}:${p.image.slice(-40)}:${p.link}`
function alreadySeen(p) {
  try {
    if (p.frequency === 'always') return false
    if (p.frequency === 'day') return localStorage.getItem(seenKey(p)) === new Date().toDateString()
    return sessionStorage.getItem(seenKey(p)) === '1'
  } catch {
    return false
  }
}
function markSeen(p) {
  try {
    if (p.frequency === 'day') localStorage.setItem(seenKey(p), new Date().toDateString())
    else if (p.frequency === 'session') sessionStorage.setItem(seenKey(p), '1')
  } catch {
    /* storage blocked: it may show again, which is harmless */
  }
}

export default function PromoPopup() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const closeRef = useRef(null)
  const shown = useRef(false) // auto-open at most once per page load
  const p = POPUP

  useEffect(() => {
    if (shown.current) return
    // ?popup-preview from the admin shows the saved banner regardless of dates, on/off and "already seen"
    const preview = new URLSearchParams(window.location.search).has('popup-preview')
    if (!preview && (SKIP.includes(pathname) || !popupActive(p) || alreadySeen(p))) return
    if (!p.image) return
    const t = setTimeout(() => {
      shown.current = true
      setOpen(true)
      if (!preview) markSeen(p)
    }, preview ? 400 : Math.max(0, Number(p.delay) || 0) * 1000)
    return () => clearTimeout(t)
  }, [pathname, p, p.image, p.enabled])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const k = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])

  const close = () => setOpen(false)

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div className="absolute inset-0 bg-wine-950/70 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={p.name || 'Announcement'}
            className="relative w-full max-w-[860px] border border-gold/50 bg-wine-950 p-1.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 bg-wine-950 text-ivory shadow-lg transition-colors hover:bg-gold hover:text-wine-950 sm:-right-4 sm:-top-4">
              <IconClose size={18} />
            </button>
            <PopupLink href={p.link} onClick={close} className="group block">
              <img
                src={p.image}
                srcSet={p.image.endsWith('.webp') && p.image.startsWith('/images/popups/') ? `${p.image.replace('.webp', '-800.webp')} 800w, ${p.image} 1600w` : undefined}
                sizes="(min-width: 900px) 860px, 92vw"
                alt={p.alt || p.name || ''}
                className="block max-h-[78svh] w-full object-contain"
              />
              {p.link && p.buttonLabel && (
                <span className="flex items-center justify-center gap-2.5 border-t border-gold/25 bg-wine-950 py-3.5 font-sans text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-light transition-colors group-hover:text-ivory">
                  {p.buttonLabel} <IconArrow size={14} className="transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              )}
            </PopupLink>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// The whole banner is the link: internal paths use the router, full URLs open in a new tab.
function PopupLink({ href, onClick, className, children }) {
  if (!href) return <div className={className}>{children}</div>
  if (/^https?:\/\//.test(href)) return <a href={href} target="_blank" rel="noreferrer" onClick={onClick} className={className}>{children}</a>
  return <Link to={href} onClick={onClick} className={className}>{children}</Link>
}
