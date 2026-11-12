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
        <h2 id="returns-exchange" className="mb-3 mt-14 scroll-mt-28 border-t border-wine-900/15 pt-12 font-display text-[clamp(1.7rem,3vw,2.2rem)] font-normal leading-tight">Returns &amp; Exchange Policy</h2>
        <p className="mb-8 text-[15px] leading-[1.75] text-wine-900/80">At Kridhya, every piece is thoughtfully crafted with care. If something isn’t right, we’re here to help.</p>
        <Block title="Exchanges">
          <p>We offer exchanges within <strong className="font-semibold text-wine-900">48 hours of delivery</strong>. Refunds to the original payment method are not available.</p>
        </Block>
        <Block title="Store Credit">
          <p>If an exchange isn’t possible, store credit equal to your order value may be issued, valid for <strong className="font-semibold text-wine-900">6 months</strong>.</p>
        </Block>
        <Block title="Customized Pieces">
          <p>Personalized, customized, or engraved jewellery is final sale and cannot be exchanged, except in the case of a manufacturing defect.</p>
        </Block>
        <Block title="Shipping Costs">
          <p>Kridhya covers return shipping for manufacturing defects or incorrect orders. For exchanges due to size, style, or preference, return shipping is the customer’s responsibility.</p>
        </Block>
        <Block title="How to Request an Exchange">
          <p>Email us at <a href={`mailto:${CONTACT.email}`} className="underline decoration-gold underline-offset-4">{CONTACT.email}</a> within 48 hours of delivery with your order number and reason for exchange.</p>
        </Block>
        <Block title="Eligibility">
          <p>Items must be unworn, undamaged, and returned in their original packaging, including the keepsake box.</p>
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

export function TermsOfService() {
  useDocumentMeta('Terms of Service | Kridhya by Devanshi Agarwal', 'The terms of service for using kridhyabydevanshi.com and shopping with Kridhya by Devanshi Agarwal.')
  return (
    <>
      <InfoHero eyebrow="Legal" title="Terms of service" intro="The terms that apply when you visit kridhyabydevanshi.com and shop with us." />
      <InfoBody>
        <Block title="Copyright">
          <p>The jewelry designs, written, visual and audio content, and website design and processes are the property of Kridhya by Devanshi Agarwal and its affiliates/vendors and are protected by The Indian and international copyright laws.</p>
        </Block>
        <Block title="Trademarks">
          <p>The trademarks or trade dress of Kridhya by Devanshi Agarwal and our affiliates may not be used without our written permission. Trademarks or trade dress include the Kridhya by Devanshi Agarwal name, logo and other graphics, page headers, button icons, scripts and service names of Kridhya by Devanshi Agarwal products and programs, are the property of Kridhya by Devanshi Agarwal and its affiliates and are protected by The Indian and international trademark laws. All other trademarks that appear on this site are the property of their respective owners, who may or may not be affiliated with, connected to, or sponsored by us or our affiliates.</p>
        </Block>
        <Block title="Use">
          <p>You have permission to electronically copy and print hard copies of pages from this website solely for personal, non-commercial purposes related to placing an order or shopping with kridhyabydevanshi.com. Unless we give you written permission in advance, any other use of this website, its content, and its information, including linking or framing to this website, are strictly prohibited.</p>
        </Block>
        <Block title="Errors and Inaccuracies">
          <p>Our goal is to provide complete, accurate, and up-to-date information on our website. Unfortunately, it is not possible to ensure that any website is completely free of human or technological errors. This site may contain typographical mistakes, inaccuracies, or omissions, some of which may relate to pricing and availability, and some information may not be complete or current. We reserve the right to correct any errors, inaccuracies, or omissions—including after an order has been submitted—and to change or update information at any time without prior notice. We sincerely apologize for any inconvenience this may cause.</p>
        </Block>
        <Block title="Disclaimer of liability">
          <p>We make no representations or warranties of any kind, whether expressed or implied, with respect to this website, its content, or the information available on or through it; they are provided “as is,” with all faults. Except as otherwise provided under applicable laws, we and our corporate affiliates, and the directors, officers, employees, agents, contractors, successors and assigns of each, will not be liable for any damages whatsoever arising out of, or related to the use of this website or any other website linked to it. This limitation of liability applies to direct, indirect, consequential, special, punitive, or other damages you or others may suffer, as well as damages for lost profits, business interruption, or the loss of data or information, even if we are notified in advance of the potential for any such damages.</p>
        </Block>
        <Block title="No Confidentiality">
          <p>Except for information necessary to place an order, we do not want to receive confidential or proprietary information or trade secrets through this website. Any information, materials, suggestions, ideas, or comments sent to us will be deemed non-confidential, and by submitting it, you are granting us an irrevocable and unrestricted license to use, modify, reproduce, transmit, display, and distribute it for any purpose whatsoever, with no payment or other compensation to you. However, we will not use your name unless we are required by law to identify the source of the materials, information, suggestions, ideas, or comments, or unless we first obtain your permission.</p>
        </Block>
        <Block title="Applicable Laws">
          <p>By visiting this website, you agree that the laws of India, without regard to principles of conflict of laws, will govern the Terms of Service / Conditions of Use of this Website and any dispute of any sort that might arise between you and us or any of our affiliates shall be subject to exclusive jurisdiction of Court in Jodhpur, India.</p>
        </Block>
        <Block title="Protecting Your Information">
          <p>As part of our ongoing commitment to ensure that your shopping experience with kridhyabydevanshi.com is protected, kridhyabydevanshi.com will prosecute all unauthorized or fraudulent transactions to the fullest extent allowed by law.</p>
          <p>Should you have other questions or concerns about these privacy policies, please call us at <a href={CONTACT.phoneHref} className="num underline decoration-gold underline-offset-4">{CONTACT.phoneDisplay}</a> or send us an email at <a href={`mailto:${CONTACT.email}`} className="underline decoration-gold underline-offset-4">{CONTACT.email}</a>.</p>
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
