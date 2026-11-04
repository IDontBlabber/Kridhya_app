import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { CONTACT, HELP, TAGLINE } from '../data/site'
import { COLLECTIONS } from '../data/products'
import { WHATSAPP_MESSAGES, whatsappLink } from '../data/site'
import { IconArrow, IconFacebook, IconInstagram, IconPlus, IconWhatsApp } from './Icons'

const HOUSE = [
  { label: 'Our Story', to: '/our-story' },
  { label: 'About Us', to: '/about' },
  { label: 'Corporate Gifting', to: '/corporate-gifting' },
  { label: 'Journal', to: '/blog' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <footer className="border-t border-gold/15 bg-wine-950 font-sans text-ivory">
      {/* phones: brand + newsletter, then the link columns as collapsible rows; tablets: four open columns; desktop: one 12-col row */}
      <div className="container-site grid grid-cols-1 py-10 md:grid-cols-4 md:gap-x-6 md:gap-y-10 lg:grid-cols-12 lg:gap-8">
        {/* brand + newsletter */}
        <div className="mb-8 md:col-span-4 md:mb-0 lg:col-span-3">
          <Link to="/" aria-label="Kridhya by Devanshi Agarwal - home"><Logo /></Link>
          <p className="mt-4 font-display text-[21px] leading-snug text-gold-light">{TAGLINE}</p>
          <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-ivory/60">
            Thoughtfully designed jewellery for everyday elegance, meaningful gifting and the moments that matter.
          </p>
          <form
            className="mt-6 md:max-w-xs"
            onSubmit={(e) => {
              e.preventDefault()
              if (email) setSent(true)
            }}
          >
            <label htmlFor="newsletter" className="text-[12px] font-medium uppercase tracking-[0.2em] text-gold">The Kridhya Letter</label>
            <div className="mt-2 flex border border-ivory/30 focus-within:border-gold md:border-0 md:border-b md:border-ivory/25">
              <input
                id="newsletter"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="h-12 min-w-0 flex-1 bg-transparent px-4 text-[14px] text-ivory placeholder:text-ivory/40 focus:outline-none md:h-10 md:px-0"
              />
              <button type="submit" className="inline-flex h-12 w-12 shrink-0 items-center justify-center bg-gold text-wine-950 hover:bg-gold-light md:h-10 md:w-10 md:bg-transparent md:text-gold md:hover:bg-transparent md:hover:text-gold-light" aria-label="Subscribe">
                <IconArrow size={15} />
              </button>
            </div>
            <p role="status" className="mt-2 h-4 text-[12px] text-gold-light">{sent ? 'Thank you - you’re on the list.' : ''}</p>
          </form>
        </div>

        <FooterCol title="Shop" className="border-t border-ivory/15 md:border-t-0 lg:col-span-2">
          <FooterLink to="/shop">All jewellery</FooterLink>
          {COLLECTIONS.map((c) => (
            <FooterLink key={c.slug} to={`/collections/${c.slug}`}>{c.name}</FooterLink>
          ))}
        </FooterCol>

        <FooterCol title="House" className="lg:col-span-2">
          {HOUSE.map((l) => <FooterLink key={l.to} to={l.to}>{l.label}</FooterLink>)}
        </FooterCol>

        <FooterCol title="Help" className="lg:col-span-2">
          {HELP.map((l) => <FooterLink key={l.to} to={l.to}>{l.label}</FooterLink>)}
        </FooterCol>

        <FooterCol title="Contact" className="lg:col-span-2">
          <li>
            <a href={whatsappLink(WHATSAPP_MESSAGES.general)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2 text-ivory/70 transition-colors hover:text-gold-light md:py-0">
              <IconWhatsApp size={14} /> <span className="link-underline">Chat on WhatsApp</span>
            </a>
          </li>
          <li>
            <a href={whatsappLink(WHATSAPP_MESSAGES.gifting)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2 text-ivory/70 transition-colors hover:text-gold-light md:py-0">
              <IconWhatsApp size={14} /> <span className="link-underline">Bulk &amp; gifting enquiries</span>
            </a>
          </li>
          <li>
            <a href={CONTACT.instagram.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2 text-ivory/70 transition-colors hover:text-gold-light md:py-0">
              <IconInstagram size={14} /> <span className="link-underline">Instagram</span>
            </a>
          </li>
          <li>
            <a href={CONTACT.facebook.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2 text-ivory/70 transition-colors hover:text-gold-light md:py-0">
              <IconFacebook size={14} /> <span className="link-underline">Facebook</span>
            </a>
          </li>
          <li className="py-2 text-ivory/45 md:py-0 md:pt-1">kridhyabydevanshi.com</li>
        </FooterCol>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-site flex flex-col gap-2 py-5 text-[12px] text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kridhya by Devanshi Agarwal. All rights reserved.</p>
          <p>Prices shown are indicative in this preview.</p>
        </div>
      </div>
    </footer>
  )
}

// Below md each column is a collapsible row (heading + plus icon), as in the mobile design; from md it is an open list.
function FooterCol({ title, className = '', children }) {
  const [open, setOpen] = useState(false)
  const id = `footer-${title.toLowerCase()}`
  return (
    <div className={`border-b border-ivory/15 md:border-b-0 ${className}`}>
      <p className="hidden text-[12px] font-medium uppercase tracking-[0.2em] text-gold md:block">{title}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[52px] w-full items-center justify-between text-[13px] font-semibold uppercase tracking-[0.2em] text-ivory md:hidden"
      >
        {title}
        <IconPlus size={18} className={`text-gold transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
      </button>
      <ul id={id} className={`${open ? 'block' : 'hidden'} pb-3 text-[15px] md:mt-4 md:block md:space-y-2.5 md:pb-0 md:text-[14px]`}>{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="link-underline inline-block py-2 text-ivory/70 transition-colors hover:text-gold-light md:py-0">{children}</Link>
    </li>
  )
}
