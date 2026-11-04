import { Link } from 'react-router-dom'
import ContactEnquiry from '../components/ContactEnquiry'
import Mandala from '../components/Mandala'
import { CONTACT } from '../data/site'
import useDocumentMeta from '../hooks/useDocumentMeta'

export default function Contact() {
  useDocumentMeta('Contact | Kridhya by Devanshi Agarwal', `Call or WhatsApp ${CONTACT.phoneDisplay}, email ${CONTACT.email}, or send us a message.`)
  return (
    <>
      <section className="grain relative isolate overflow-hidden bg-wine-900 text-ivory">
        <Mandala className="pointer-events-none absolute -right-28 top-1/2 -z-10 h-[560px] w-[560px] -translate-y-1/2 text-gold/[0.12]" />
        <div className="container-site pb-10 pt-32 lg:pb-12 lg:pt-36">
          <p className="eyebrow font-semibold text-gold">Contact</p>
          <h1 className="mt-4 max-w-2xl font-display text-[clamp(1.65rem,2.7vw,2.25rem)] font-normal leading-[1.12]">We’d love to hear from you</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ivory/80">
            Looking for something special, a thoughtful gift, or a larger order?
            We’d love to help you find just the right piece. For bulk and corporate orders, explore our{' '}
            <Link to="/corporate-gifting" className="text-gold-light underline decoration-gold/50 underline-offset-4 hover:decoration-gold">Corporate Gifting</Link> options.
          </p>
        </div>
      </section>
      <ContactEnquiry id="contact-form" eyebrow="Get in touch" title="Contact details" />
    </>
  )
}
