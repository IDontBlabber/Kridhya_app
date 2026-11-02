import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { CONTACT, HELP, TAGLINE } from '../data/site'
import { COLLECTIONS } from '../data/products'
import { WHATSAPP_MESSAGES, whatsappLink } from '../data/site'
import { IconArrow, IconFacebook, IconInstagram, IconWhatsApp } from './Icons'

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
      <div className="container-site grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-12 lg:gap-8">
        {/* brand + newsletter */}
        <div className="col-span-2 lg:col-span-3">
          <Link to="/" aria-label="Kridhya by Devanshi Agarwal — home"><Logo /></Link>
          <p className="mt-4 font-display text-[22px] Nunito Sans leading-snug text-gold-light">{TAGLINE}</p>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-ivory/60">
            Thoughtfully designed jewellery for everyday elegance, meaningful gifting and the moments that matter.
          </p>
          <form
            className="mt-6 max-w-xs"
            onSubmit={(e) => {
              e.preventDefault()
              if (email) setSent(true)
            }}
          >
            <label htmlFor="newsletter" className="text-[13px] font-medium uppercase tracking-[0.2em] text-gold">The Kridhya Letter</label>
            <div className="mt-2 flex border-b border-ivory/25 focus-within:border-gold">
              <input
                id="newsletter"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-ivory placeholder:text-ivory/40 focus:outline-none"
              />
              <button type="submit" className="inline-flex h-10 w-10 items-center justify-center text-gold hover:text-gold-light" aria-label="Subscribe">
                <IconArrow size={15} />
              </button>
            </div>
            <p role="status" className="mt-2 h-4 text-[13px] text-gold-light">{sent ? 'Thank you — you’re on the list.' : ''}</p>
          </form>
        </div>

        <FooterCol title="Shop" className="lg:col-span-2">
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

        <FooterCol title="Contact" className="col-span-2 sm:col-span-1 lg:col-span-2">
          <li>
            <a href={whatsappLink(WHATSAPP_MESSAGES.general)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2.5 text-ivory/70 transition-colors hover:text-gold-light sm:py-0">
              <IconWhatsApp size={14} /> <span className="link-underline">Chat on WhatsApp</span>
            </a>
          </li>
          <li>
            <a href={whatsappLink(WHATSAPP_MESSAGES.gifting)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2.5 text-ivory/70 transition-colors hover:text-gold-light sm:py-0">
              <IconWhatsApp size={14} /> <span className="link-underline">Bulk &amp; gifting enquiries</span>
            </a>
          </li>
          <li>
            <a href={CONTACT.instagram.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2.5 text-ivory/70 transition-colors hover:text-gold-light sm:py-0">
              <IconInstagram size={14} /> <span className="link-underline">Instagram</span>
            </a>
          </li>
          <li>
            <a href={CONTACT.facebook.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2.5 text-ivory/70 transition-colors hover:text-gold-light sm:py-0">
              <IconFacebook size={14} /> <span className="link-underline">Facebook</span>
            </a>
          </li>
          <li className="py-2 text-ivory/45 sm:py-0 sm:pt-1">kridhyabydevanshi.com</li>
        </FooterCol>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-site flex flex-col gap-2 py-5 text-[13px] text-ivory/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kridhya by Devanshi Agarwal. All rights reserved.</p>
          <p>Prices shown are indicative in this preview.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, className = '', children }) {
  return (
    <div className={className}>
      <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-gold">{title}</p>
      <ul className="mt-2 text-[16px] sm:mt-4 sm:space-y-2.5 sm:text-[15px]">{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link to={to} className="link-underline inline-block py-2.5 text-ivory/70 transition-colors hover:text-gold-light sm:py-0">{children}</Link>
    </li>
  )
}
