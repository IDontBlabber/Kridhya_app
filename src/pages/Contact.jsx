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
          <h1 className="h-display mt-4 max-w-2xl font-normal">We’d love to hear from you</h1>
          <p className="mt-5 max-w-xl text-[15px] font-medium leading-relaxed text-ivory/80">
            Questions about a piece, help choosing a gift, or a bulk order for your team - reach us however suits you.
            For larger orders, see <Link to="/corporate-gifting" className="text-gold-light underline decoration-gold/50 underline-offset-4 hover:decoration-gold">Corporate Gifting</Link>.
          </p>
        </div>
      </section>
      <ContactEnquiry id="contact-form" eyebrow="Get in touch" title="Contact details" />
    </>
  )
}
