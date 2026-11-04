import { useState } from 'react'
import { Block, DraftNote, InfoBody, InfoHero } from '../components/InfoPage'
import { IconChevronDown } from '../components/Icons'
import { CONTACT } from '../data/site'
import useDocumentMeta from '../hooks/useDocumentMeta'

const FAQS = [
  { q: 'How do I place an order?', a: 'Add pieces to your bag, choose Proceed to checkout and share your delivery details. If you would rather order by chat, message us on WhatsApp and we will help.' },
  { q: 'Can I choose a finish?', a: 'Yes. Where a design is offered in more than one finish - gold, rose gold or silver - you can choose it on the product page before adding to your bag.' },
  { q: 'Do you offer gifting and bulk orders?', a: 'We do. Visit the Corporate Gifting page and send an enquiry, or message us on WhatsApp with your occasion and approximate quantity.' },
  { q: 'How do I look after my jewellery?', a: 'Our Jewellery Care page has simple everyday guidance for wearing, cleaning and storing your pieces.' },
  { q: 'How can I contact you about an order?', a: `Call or WhatsApp ${CONTACT.phoneDisplay}, or write to ${CONTACT.email}. Studio hours are ${CONTACT.hours}.` },
]

export function Faq() {
  useDocumentMeta('FAQs | Kridhya by Devanshi Agarwal', 'Answers to common questions about ordering, finishes, gifting and care.')
  const [open, setOpen] = useState(0)
  return (
    <>
      <InfoHero eyebrow="Help" title="Frequently asked questions" intro="Quick answers about ordering, finishes, gifting and care." />
      <InfoBody>
        <DraftNote />
        <ul className="divide-y divide-wine-900/15 border-y border-wine-900/15">
          {FAQS.map((f, i) => {
            const on = open === i
            return (
              <li key={f.q}>
                <h2>
                  <button type="button" aria-expanded={on} aria-controls={`faq-${i}`} onClick={() => setOpen(on ? -1 : i)} className="flex min-h-[64px] w-full items-center justify-between gap-6 py-4 text-left font-display text-[clamp(calc(1.4rem_-_1px),calc(2.4vw_-_1px),calc(1.8rem_-_1px))] font-medium leading-snug">
                    {f.q}
                    <IconChevronDown size={20} className={`shrink-0 text-gold-deep transition-transform duration-300 ${on ? 'rotate-180' : ''}`} />
                  </button>
                </h2>
                {on && <p id={`faq-${i}`} className="pb-5 pr-8 text-[15px] leading-[1.75] text-wine-900/80">{f.a}</p>}
              </li>
            )
          })}
        </ul>
      </InfoBody>
    </>
  )
}

export function JewelleryCare() {
  useDocumentMeta('Jewellery Care | Kridhya by Devanshi Agarwal', 'Simple, everyday guidance for wearing, cleaning and storing your Kridhya jewellery.')
  return (
    <>
      <InfoHero eyebrow="Help" title="Jewellery care" intro="Small habits that keep fine pieces looking their best, for longer." />
      <InfoBody>
        <DraftNote />
        <Block title="Wear it last, remove it first">
          <p>Put jewellery on after perfume, lotion and hairspray, and take it off before bathing, swimming, exercise or sleep.</p>
        </Block>
        <Block title="Clean gently">
          <p>Wipe each piece with a soft, dry cloth after wearing. For a deeper clean, use a soft cloth with a little mild soap and water, then dry it fully.</p>
        </Block>
        <Block title="Store separately">
          <p>Keep pieces apart in a soft pouch or lined box so chains do not tangle and stones are not scratched. Close clasps before storing.</p>
        </Block>
      </InfoBody>
    </>
  )
}

export function ShippingReturns() {
  useDocumentMeta('Shipping & Returns | Kridhya by Devanshi Agarwal', 'How delivery, exchanges and returns work at Kridhya by Devanshi Agarwal.')
  return (
    <>
      <InfoHero eyebrow="Help" title="Shipping & returns" intro="What to expect after you order, and what to do if a piece is not right." />
      <InfoBody>
        <DraftNote />
        <Block title="Delivery">
          <p>Orders are packed in Kridhya gift packaging. Delivery charges and timelines are confirmed with you when your order is accepted.</p>
        </Block>
        <Block title="Exchanges & returns">
          <p>If something arrives damaged or is not what you ordered, contact us as soon as you can with your order number and a photo. We will explain the next steps.</p>
          <p>The exact return and exchange window will be published here once confirmed.</p>
        </Block>
        <Block title="Need help?">
          <p>Call or WhatsApp {CONTACT.phoneDisplay}, or write to {CONTACT.email}.</p>
        </Block>
      </InfoBody>
    </>
  )
}

export function Privacy() {
  useDocumentMeta('Privacy Policy | Kridhya by Devanshi Agarwal', 'How Kridhya by Devanshi Agarwal collects, uses and protects your information.')
  return (
    <>
      <InfoHero eyebrow="Legal" title="Privacy policy" intro="How we handle the details you share with us." />
      <InfoBody>
        <DraftNote />
        <Block title="What we collect">
          <p>Details you give us when you order or enquire: your name, email, phone number and delivery address, plus anything you write in a message.</p>
        </Block>
        <Block title="How we use it">
          <p>To process and deliver orders, reply to your enquiries and, if you subscribe to The Kridhya Letter, to send you news. We do not sell your information.</p>
        </Block>
        <Block title="Your choices">
          <p>You can ask us to update or delete your details, or unsubscribe from our emails at any time by writing to {CONTACT.email}.</p>
        </Block>
      </InfoBody>
    </>
  )
}

export function Terms() {
  useDocumentMeta('Terms & Conditions | Kridhya by Devanshi Agarwal', 'Terms for using the Kridhya by Devanshi Agarwal website and placing orders.')
  return (
    <>
      <InfoHero eyebrow="Legal" title="Terms & conditions" intro="The simple terms that apply when you use this site and place an order." />
      <InfoBody>
        <DraftNote />
        <Block title="Orders & pricing">
          <p>Prices are shown in Indian rupees. An order is confirmed once we accept it and share the final details with you. Photographs are for guidance; slight variations in colour and finish can occur.</p>
        </Block>
        <Block title="Use of this site">
          <p>All images, text and designs on this site belong to Kridhya by Devanshi Agarwal and may not be copied or reused without written permission.</p>
        </Block>
        <Block title="Contact">
          <p>Questions about these terms? Write to {CONTACT.email}.</p>
        </Block>
      </InfoBody>
    </>
  )
}
