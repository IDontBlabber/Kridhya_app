import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { NAV, WHATSAPP_MESSAGES, whatsappLink } from '../data/site'
import { useCart } from '../context/CartContext'
import { IconBag, IconChevron, IconClose, IconMenu, IconSearch, IconWhatsApp } from './Icons'

// Pages whose first section is dark — header text is beige there, burgundy on light pages.
const DARK_TOP = ['/', '/corporate-gifting', '/our-story', '/about', '/collections', '/checkout', '/order-confirmed', '/faq', '/jewellery-care', '/shipping-returns', '/privacy-policy', '/terms']

// Nested routes light up their section: products → Shop, category archives → Collections, posts → Journal.
function isSection(path, to) {
  if (to === '/shop') return path.startsWith('/shop') || path.startsWith('/product')
  return path === to || path.startsWith(to + '/')
}

// Sticky navbar: transparent over the top of the page; once scrolled it stays pinned as a solid burgundy bar
// (readable over any section). No hide/slide motion — only a short colour fade.
export default function Header() {
  const { pathname } = useLocation()
  const { count, setOpen } = useCart()
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  useEffect(() => setMenu(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setMenu(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menu])

  const tone = scrolled || DARK_TOP.includes(pathname) ? 'text-ivory' : 'text-wine-900'

  return (
    <>
      <header
        className={`fixed inset-x-0 z-50 transition-[background-color,border-color,padding] duration-200 ${
          scrolled
            ? 'top-0 border-b border-gold/15 bg-wine-950/95 pt-[env(safe-area-inset-top)] shadow-[0_10px_30px_-18px_rgba(26,5,11,0.8)] backdrop-blur-md'
            : 'top-[max(0.75rem,env(safe-area-inset-top))] border-b border-transparent sm:top-4'
        }`}
      >
        <div className="container-hero">
          <div className={`flex h-[68px] items-center justify-between gap-6 xl:grid xl:grid-cols-[auto_1fr_auto] xl:gap-x-10 2xl:gap-x-16 ${tone}`}>
            <Link to="/" aria-label="Kridhya by Devanshi Agarwal — home" className="shrink-0">
              <Logo />
            </Link>

            <nav aria-label="Primary" className="hidden justify-self-center xl:block">
              <ul className="flex items-center gap-5 2xl:gap-9">
                {NAV.map((n) => {
                  const active = isSection(pathname, n.to)
                  return (
                    <li key={n.to}>
                      <Link
                        to={n.to}
                        aria-current={active ? 'page' : undefined}
                        className={`inline-flex min-h-[44px] items-center whitespace-nowrap border-b text-[12.5px] font-medium uppercase tracking-[0.14em] hover:text-gold 2xl:text-[13px] 2xl:tracking-[0.18em] ${active ? 'border-gold text-gold' : 'border-transparent'}`}
                      >
                        {n.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="-mr-2 flex items-center justify-self-end">
              <Link to="/shop" className="hidden h-10 w-10 items-center justify-center hover:text-gold sm:inline-flex" aria-label="Search the shop">
                <IconSearch size={18} />
              </Link>
              <button type="button" onClick={() => setOpen(true)} className="relative inline-flex h-10 w-10 items-center justify-center hover:text-gold" aria-label={`Open shopping bag, ${count} items`}>
                <IconBag size={18} />
                {count > 0 && (
                  <span className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[11px] font-semibold text-wine-950 num">{count}</span>
                )}
              </button>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center xl:hidden" aria-label="Open menu" aria-expanded={menu} aria-controls="mobile-menu" onClick={() => setMenu(true)}>
                <IconMenu size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {menu && (
        <>
          <div className="fixed inset-0 z-[60] bg-wine-950/60 xl:hidden" onClick={() => setMenu(false)} />
          {/* phones: full-screen sheet; tablets: right-hand drawer */}
          <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[61] flex flex-col bg-wine-950 pt-[env(safe-area-inset-top)] text-ivory sm:left-auto sm:w-[86%] sm:max-w-sm xl:hidden">
            <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-gold/15 px-5 sm:px-8">
              <Link to="/" aria-label="Kridhya by Devanshi Agarwal — home" onClick={() => setMenu(false)}>
                <Logo />
              </Link>
              <button type="button" className="-mr-2 inline-flex h-11 w-11 items-center justify-center hover:text-gold" aria-label="Close menu" onClick={() => setMenu(false)}>
                <IconClose size={22} />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 pt-3 sm:px-8">
              <ul>
                {NAV.map((n) => {
                  const active = isSection(pathname, n.to)
                  return (
                    <li key={n.to}>
                      <Link to={n.to} aria-current={active ? 'page' : undefined} className={`flex min-h-[56px] items-center justify-between border-b border-ivory/10 font-display text-[21px] transition-colors hover:text-gold ${active ? 'text-gold' : ''}`}>
                        {n.label}
                        <IconChevron size={18} className={active ? 'text-gold' : 'text-ivory/45'} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-8">
              <a href={whatsappLink(WHATSAPP_MESSAGES.general)} target="_blank" rel="noreferrer" className="btn btn-gold w-full">
                <IconWhatsApp size={16} /> Chat with us
              </a>
            </div>
          </div>
        </>
      )}
    </>
  )
}
