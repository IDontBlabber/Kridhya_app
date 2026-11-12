import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Block, InfoBody, InfoHero } from '../components/InfoPage'
import { IconChevronDown } from '../components/Icons'
import { CONTACT } from '../data/site'
import useDocumentMeta from '../hooks/useDocumentMeta'

// Client-approved FAQ (Nov 2026), grouped by topic.
const FAQ_GROUPS = [
  ['About Kridhya', [
    { q: 'What does “Kridhya” mean?', a: 'Kridhya comes from the Sanskrit krīḍā, meaning divine play, or joy. Every piece is designed to be one of life’s small joys, worn close to the heart.' },
    { q: 'Who is behind Kridhya?', a: 'Kridhya is designed by Devanshi Agarwal, a GIA-certified Graduate Diamonds jeweller. Each piece is considered down to the last detail, from the first sketch to the box it arrives in.' },
    { q: 'What is demi-fine jewellery?', a: 'Demi-fine sits between fashion jewellery and fine jewellery. It uses real precious metals, so it’s made to last and to be worn every day, at a price that lets you collect pieces for yourself and not only for occasions.' },
  ]],
  ['Materials & Quality', [
    { q: 'What are your pieces made of?', a: 'Every Kridhya piece is crafted in 925 sterling silver and finished in gold vermeil, a layer of 2.5 micron thickness gold over the silver base.' },
    { q: 'Will the gold fade or tarnish?', a: 'With proper care, vermeil keeps its warmth for a long time.' },
    { q: 'Is your jewellery hypoallergenic?', a: 'Sterling silver and gold vermeil suit most sensitive skin. Our pieces are nickel-free. If you have a specific metal allergy, write to us before ordering and we’ll help.' },
    { q: 'Is your silver hallmarked?', a: 'Yes, all pieces carry a 925 stamp and hallmark details.' },
  ]],
  ['Care', [
    { q: 'How do I care for my Kridhya jewellery?', a: 'Put your jewellery on last and take it off first. Keep it away from perfume, lotion, chlorine, and saltwater, and remove it before bathing or working out. Wipe gently with a soft dry cloth after wearing, and store each piece in its Kridhya box to protect it from air and scratches.' },
  ]],
  ['Orders & Shipping', [
    { q: 'Where do you ship?', a: 'We ship across India.' },
    { q: 'How long will my order take?', a: 'Orders are dispatched within 8-10 business days and usually arrive within 5-7 days of dispatch. You’ll receive tracking details by email once your order ships.' },
    { q: 'How will my order arrive?', a: 'Every piece arrives in our signature Kridhya keepsake box, ready to keep or to gift.' },
    { q: 'Can I add a gift note?', a: 'Yes, add your message at checkout.' },
  ]],
  ['Returns & Exchanges', [
    { q: 'What is your return policy?', a: 'Exchanges are accepted within 2 days of delivery, unworn and in original packaging. For hygiene reasons, earrings cannot be returned.' },
    { q: 'What if my piece arrives damaged?', a: 'We’re so sorry if this happens. Email us within 48 hours of delivery with photos of the piece and packaging, and we’ll make it right.' },
  ]],
  ['Sizing', [
    { q: 'How do I find my ring size?', a: 'Ring sizes are adjustable.' },
    { q: 'Are your chains adjustable?', a: 'Chains are adjustable.' },
  ]],
  ['Get in Touch', [
    { q: 'How can I reach you?', a: <>We’d love to hear from you. Write to us at <a href={`mailto:${CONTACT.email}`} className="underline decoration-gold underline-offset-4">{CONTACT.email}</a> or send us a message on Instagram at <a href={CONTACT.instagram.href} target="_blank" rel="noreferrer" className="underline decoration-gold underline-offset-4">{CONTACT.instagram.handle}</a>.</> },
  ]],
]

export function Faq() {
  useDocumentMeta('FAQs | Kridhya by Devanshi Agarwal', 'Answers to common questions about Kridhya, materials, care, shipping, exchanges and sizing.')
  const [open, setOpen] = useState('0-0')
  return (
    <>
      <InfoHero eyebrow="Help" title="Frequently asked questions" intro="Everything you need to know about our pieces, from materials and care to shipping and exchanges." />
      <InfoBody>
        {FAQ_GROUPS.map(([group, items], g) => (
          <section key={group} className={g ? 'mt-14' : ''}>
            <p className="eyebrow mb-4 font-semibold text-gold-deep">{group}</p>
            <ul className="divide-y divide-wine-900/15 border-y border-wine-900/15">
              {items.map((f, i) => {
                const id = `${g}-${i}`
                const on = open === id
                return (
                  <li key={f.q}>
                    <h2>
                      <button type="button" aria-expanded={on} aria-controls={`faq-${id}`} onClick={() => setOpen(on ? null : id)} className="flex min-h-[64px] w-full items-center justify-between gap-6 py-4 text-left font-display text-[clamp(calc(1.4rem_-_1px),calc(2.4vw_-_1px),calc(1.8rem_-_1px))] font-medium leading-snug">
                        {f.q}
                        <IconChevronDown size={20} className={`shrink-0 text-gold-deep transition-transform duration-300 ${on ? 'rotate-180' : ''}`} />
                      </button>
                    </h2>
                    {on && <p id={`faq-${id}`} className="pb-5 pr-8 text-[15px] leading-[1.75] text-wine-900/80">{f.a}</p>}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </InfoBody>
    </>
  )
}

const policyLink = (to, label) => <Link to={to} className="underline decoration-gold underline-offset-4 hover:text-wine-700">{label}</Link>

// Client-approved care guide (Nov 2026). Strings render as paragraphs, arrays as bullet lists.
const CARE = [
  ['1. Avoid Water & Moisture', [[
    'Keep your jewellery away from water, showers, swimming pools and excessive sweat.',
    'Remove your jewellery before bathing or exercising.',
    'Avoid exposing it to humidity for extended periods.',
  ]]],
  ['2. Keep Away from Chemicals', [[
    'Avoid direct contact with perfumes, deodorants, hairsprays, lotions and cosmetics.',
    'Apply your beauty products first and wear your jewellery once they have dried.',
    'Keep jewellery away from cleaning agents and harsh chemicals.',
  ]]],
  ['3. Store Your Jewellery Properly', [[
    'Store each jewellery piece separately in a soft pouch or airtight jewellery box.',
    'Keep it in a cool, dry place away from direct sunlight.',
    'Avoid storing multiple pieces together to prevent scratches and tangling.',
  ]]],
  ['4. Clean with Care', [[
    'Gently wipe your jewellery using a clean, soft and dry microfibre cloth after every use.',
    'Do not use abrasive cleaners, polishing compounds or rough brushes.',
    'Avoid excessive rubbing, as it may affect the plating.',
  ]]],
  ['5. Handle with Love', [[
    'Wear your jewellery after getting dressed and remove it before changing clothes.',
    'Avoid pulling, bending or dropping delicate jewellery pieces.',
    'Handle clasps, chains and intricate designs gently.',
  ]]],
  ['Special Care for Different Platings', [
    <><strong className="font-semibold text-wine-900">Silver-Plated Jewellery.</strong> Keep away from moisture, perfumes and chemicals. Gently wipe after every use to help preserve its beautiful silver finish.</>,
    <><strong className="font-semibold text-wine-900">Gold-Plated Jewellery.</strong> Avoid friction, sweat and chemical exposure. Store separately and clean gently to help maintain its elegant golden shine.</>,
    <><strong className="font-semibold text-wine-900">Rose Gold-Plated Jewellery.</strong> Protect the delicate rose gold finish from moisture, cosmetics and harsh cleaning products. Use only a soft, dry cloth for cleaning.</>,
  ]],
  ['A Little Love Goes a Long Way!', [
    'With proper care and mindful storage, your favourite Kridhya by Devanshi jewellery pieces can continue to complement your special moments.',
    <strong className="font-semibold text-wine-900">Kridhya by Devanshi – Jewellery that reflects your elegance.</strong>,
    <>Shop your favourites: {policyLink('/shop', 'kridhyabydevanshi.com')}</>,
  ]],
]

// Renders [title, body] sections: strings/JSX become paragraphs, arrays become bullet lists.
function PolicyBlocks({ sections, numbered = false }) {
  return sections.map(([title, body], i) => (
    <Block key={title} title={numbered ? `${i + 1}. ${title}` : title}>
      {body.map((item, j) =>
        Array.isArray(item) ? (
          <ul key={j} className="list-disc space-y-1.5 pl-5 marker:text-gold-deep">
            {item.map((li, k) => <li key={k}>{li}</li>)}
          </ul>
        ) : (
          <p key={j}>{item}</p>
        ),
      )}
    </Block>
  ))
}

export function JewelleryCare() {
  useDocumentMeta('Jewellery Care | Kridhya by Devanshi Agarwal', 'Simple jewellery care tips to keep your Kridhya pieces beautiful, radiant and timeless.')
  return (
    <>
      <InfoHero eyebrow="Help" title="Jewellery care" intro="Keep your favourite jewellery beautiful, radiant and timeless with the right care." />
      <InfoBody>
        <p className="mb-10 text-[15px] leading-[1.75] text-wine-900/80">
          At <strong className="font-semibold text-wine-900">Kridhya by Devanshi</strong>, our silver-plated, gold-plated and rose gold-plated jewellery is designed to complement your style. Follow these simple jewellery care tips to maintain its shine and finish for longer.
        </p>
        <PolicyBlocks sections={CARE} />
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
        <Block title="Shipping">
          <p>We ship across India. Orders are dispatched within 8-10 business days and usually arrive within 5-7 days of dispatch. You’ll receive tracking details by email once your order ships.</p>
          <p>Every piece arrives in our signature Kridhya keepsake box, ready to keep or to gift.</p>
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
      </InfoBody>
    </>
  )
}

// Client-approved Privacy Policy (Nov 2026).
const PRIVACY = [
  ['Introduction', [
    'Welcome to Kridhya by Devanshi.',
    'At Kridhya by Devanshi, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, process and protect your personal information when you visit our website, create an account, purchase jewellery, make payments or interact with our services.',
    'This policy applies to all customers, visitors and users accessing our website or purchasing our products from anywhere in India.',
    'By accessing our website or placing an order, you acknowledge that you have read this Privacy Policy.',
  ]],
  ['Information We Collect', [
    'When you browse our website, register an account or place an order, we may collect the following information:',
    <strong className="font-semibold text-wine-900">A. Personal Information</strong>,
    ['Full name', 'Mobile number', 'Email address', 'Billing address', 'Shipping and delivery address'],
    <strong className="font-semibold text-wine-900">B. Order Information</strong>,
    ['Products purchased', 'Order history', 'Transaction reference numbers', 'Payment status', 'Return, exchange and refund details'],
    <strong className="font-semibold text-wine-900">C. Payment Information</strong>,
    'Payments made through our website may be processed by authorised third-party payment gateways.',
    'We may receive transaction confirmations, payment status and limited transaction-related information. We do not intend to store your complete debit card, credit card, CVV, UPI PIN or banking passwords on our website.',
    <strong className="font-semibold text-wine-900">D. Technical Information</strong>,
    'We may automatically collect:',
    ['IP address', 'Browser type and device information', 'Website usage information', 'Cookies and browsing activity', 'Pages visited and interaction details'],
  ]],
  ['How We Use Your Information', [
    'We collect and process your information for legitimate business purposes, including:',
    [
      'Processing and confirming your jewellery orders.',
      'Arranging packaging, dispatch and delivery.',
      'Sharing shipping information with courier and logistics partners.',
      'Sending order confirmations and delivery updates.',
      'Processing returns, cancellations and refunds.',
      'Providing customer support and resolving complaints.',
      'Maintaining customer accounts and purchase history.',
      'Improving website performance and shopping experience.',
      'Preventing fraudulent transactions and unauthorised activities.',
      'Sending promotional offers, product updates and marketing communications where permitted.',
    ],
    'We do not sell your personal information to third parties.',
  ]],
  ['Shipping and Delivery Information', [
    'Kridhya by Devanshi may deliver products to customers across India, subject to serviceability and applicable shipping conditions.',
    'To fulfil your orders, we may share the necessary customer information with:',
    [
      'Courier and logistics companies.',
      'Shipping and delivery service providers.',
      'Order fulfilment and packaging partners.',
      'Delivery personnel responsible for completing your shipment.',
    ],
    'The information shared may include your name, contact number, delivery address and order or shipment reference.',
    'This information is shared only to facilitate order processing, shipment tracking and successful delivery, subject to applicable laws and appropriate safeguards.',
    'We are not responsible for the independent privacy practices of third-party courier companies. However, we expect our service providers to handle customer information responsibly.',
  ]],
  ['Payment Security', [
    'We may use authorised third-party payment gateways to facilitate online transactions.',
    'Your payment information is handled in accordance with the applicable security practices and privacy policies of the respective payment service providers.',
    'Kridhya by Devanshi does not request or collect your UPI PIN, banking password or OTP through unsolicited calls, emails or messages.',
    'Customers are advised not to share confidential payment credentials with anyone claiming to represent our brand.',
  ]],
  ['Cookies and Tracking Technologies', [
    'Our website may use cookies and similar technologies to:',
    [
      'Improve website functionality.',
      'Remember shopping preferences.',
      'Maintain shopping cart sessions.',
      'Understand website traffic and visitor behaviour.',
      'Improve our products and customer experience.',
      'Support relevant advertising and marketing activities.',
    ],
    'You may manage or disable cookies through your browser settings. However, disabling certain cookies may affect some website functionalities.',
    'Where required by applicable law, we will obtain the necessary consent for non-essential cookies and tracking technologies.',
  ]],
  ['Sharing of Personal Information', [
    'We may share your information with trusted third parties only where necessary for the purposes described in this policy.',
    'These may include:',
    [
      'Payment gateway providers.',
      'Courier and logistics partners.',
      'Website hosting and infrastructure providers.',
      'Website analytics and performance service providers.',
      'Customer support platforms.',
      'Marketing and communication service providers.',
      'Government authorities, regulators or law enforcement agencies where legally required.',
    ],
    'We do not authorise these service providers to use your personal information for unrelated purposes.',
  ]],
  ['Data Storage and Security', [
    'We take reasonable technical and organisational measures to protect customer information against:',
    ['Unauthorised access.', 'Accidental loss or destruction.', 'Misuse or alteration.', 'Unauthorised disclosure.', 'Data breaches.'],
    'Access to personal information is restricted to authorised personnel and service providers who require it for legitimate business operations.',
    'Although we take reasonable steps to protect your information, no online platform or electronic transmission can be guaranteed to be completely secure.',
  ]],
  ['Data Retention', [
    'We retain personal information only for as long as necessary to:',
    [
      'Complete customer orders and deliveries.',
      'Provide customer support.',
      'Manage returns, refunds and disputes.',
      'Maintain business and transaction records.',
      'Comply with applicable Indian tax, accounting and legal requirements.',
      'Establish, exercise or defend legal claims.',
    ],
    'When personal information is no longer required for these purposes, we will take appropriate steps to delete or anonymise it, subject to applicable legal retention requirements.',
  ]],
  ['Your Privacy Rights', [
    'Subject to applicable Indian laws and their effective dates, you may have the right to:',
    [
      'Request information about the personal data we process.',
      'Request correction of inaccurate or incomplete personal information.',
      'Request deletion of personal information where legally permissible.',
      'Withdraw consent for processing where processing is based on consent.',
      'Raise concerns regarding the handling of your personal information.',
      'Nominate another individual to exercise applicable rights in the event of your death or incapacity, as provided under applicable law.',
    ],
    'Withdrawal of consent does not affect processing already carried out lawfully before the withdrawal. Certain information may need to be retained to meet statutory and regulatory obligations.',
    'To exercise your privacy rights, contact us using the details provided in the Contact Us section.',
  ]],
  ['Marketing Communications', [
    'We may send you information about new jewellery collections, special offers, festive promotions and other brand updates through email, SMS or WhatsApp where permitted by applicable law.',
    'You may opt out of promotional communications at any time by using the unsubscribe option, replying with an appropriate opt-out request or contacting us directly.',
    'Please note that transactional messages relating to your orders, payments and deliveries may still be sent when necessary.',
  ]],
  ['Third-Party Websites', [
    'Our website may contain links to third-party websites, payment gateways or external services.',
    'Kridhya by Devanshi does not control the privacy policies, security practices or content of these external websites.',
    'We recommend reviewing their respective privacy policies before sharing personal information with them.',
  ]],
  ['Children’s Privacy', [
    'Our website and products are intended for general consumers. We do not knowingly seek to collect personal information from children in violation of applicable Indian laws.',
    'Where processing of a child’s personal data is subject to parental or lawful guardian consent requirements, we will follow the applicable legal requirements.',
  ]],
  ['Data Breach and Security Incidents', [
    'In the event of a personal data breach, we will take appropriate steps to investigate, contain and address the incident.',
    'We will provide notifications to affected individuals and relevant authorities wherever required under applicable Indian data protection laws and regulations.',
  ]],
  ['Legal Compliance – Indian Laws', [
    'This Privacy Policy is intended to comply with applicable laws and regulations in India, including:',
    [
      <><strong className="font-semibold text-wine-900">Digital Personal Data Protection Act, 2023:</strong> Governs the processing of digital personal data and establishes rights and obligations relating to personal data protection.</>,
      <><strong className="font-semibold text-wine-900">Digital Personal Data Protection Rules, 2025:</strong> Provides the regulatory framework for implementing the DPDP Act.</>,
      <><strong className="font-semibold text-wine-900">Information Technology Act, 2000:</strong> Applicable provisions relating to electronic transactions, information security and data protection.</>,
      <><strong className="font-semibold text-wine-900">Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011:</strong> Applicable provisions during the relevant transitional period.</>,
      <><strong className="font-semibold text-wine-900">Consumer Protection Act, 2019:</strong> Applicable provisions concerning consumer rights and protection.</>,
      <><strong className="font-semibold text-wine-900">Consumer Protection (E-Commerce) Rules, 2020:</strong> Applicable requirements relating to online commerce and consumer protection, including subsequent amendments when effective.</>,
      'Other applicable Indian laws, rules and regulations governing electronic commerce, taxation, payments and consumer transactions.',
    ],
    'We will update this policy as necessary to reflect changes in applicable legislation and regulatory requirements.',
  ]],
  ['Changes to This Privacy Policy', [
    'Kridhya by Devanshi reserves the right to modify or update this Privacy Policy at any time to reflect changes in our business operations, website functionality or applicable legal requirements.',
    'Any updated version will be published on this page with a revised effective date.',
    'Customers are encouraged to review this page periodically.',
  ]],
]

export function Privacy() {
  useDocumentMeta('Privacy Policy | Kridhya by Devanshi Agarwal', 'How Kridhya by Devanshi collects, uses, stores and protects your personal information.')
  return (
    <>
      <InfoHero eyebrow="Legal" title="Privacy policy" intro="How we collect, use, store and protect your personal information." />
      <InfoBody>
        <p className="mb-10 text-[14px] leading-relaxed text-wine-900/70">
          Effective Date: 12 November 2026<br />
          Website: <a href="https://kridhyabydevanshi.com/" className="underline decoration-gold underline-offset-4">https://kridhyabydevanshi.com/</a>
        </p>
        <PolicyBlocks sections={PRIVACY} numbered />
        <Block title={`${PRIVACY.length + 1}. Contact Us`}>
          <p>For questions, concerns, requests or complaints regarding this Privacy Policy or the handling of your personal information, please contact us:</p>
          <p>
            Brand: Kridhya by Devanshi<br />
            Website: <a href="https://kridhyabydevanshi.com/" className="underline decoration-gold underline-offset-4">https://kridhyabydevanshi.com/</a><br />
            Email: <a href={`mailto:${CONTACT.email}`} className="underline decoration-gold underline-offset-4">{CONTACT.email}</a><br />
            Phone: <a href={CONTACT.phoneHref} className="num underline decoration-gold underline-offset-4">{CONTACT.phoneDisplay}</a>
          </p>
          <p>We will review and respond to privacy-related requests in accordance with applicable Indian laws.</p>
          <p>Thank you for trusting Kridhya by Devanshi.</p>
          <p>Your privacy and trust are important to us.</p>
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

// Client-approved Terms & Conditions (Nov 2026). Strings render as paragraphs, arrays as bullet lists.
const TERMS = [
  ['General Information', [
    'Kridhya by Devanshi Agarwal operates this website to showcase and sell its jewellery collections and related products. Throughout the website, the terms “we”, “us” and “our” refer to Kridhya by Devanshi Agarwal.',
    'We reserve the right to update, modify or change these Terms & Conditions whenever necessary. Any changes will become effective once published on the website.',
  ]],
  ['Product Information & Description', [
    'We make every effort to display our jewellery products, descriptions, images, colours and details as accurately as possible.',
    [
      'Product images are provided for reference and may have slight variations in colour, texture, appearance or finish due to lighting, photography and screen settings.',
      'Minor variations in handmade or individually crafted products may occur.',
      'Product descriptions and specifications are provided to help customers make informed purchasing decisions.',
      'We reserve the right to modify product descriptions, designs, specifications or availability without prior notice.',
    ],
    'Such variations do not necessarily indicate a defect in the product.',
  ]],
  ['Orders & Order Confirmation', [
    'Placing an order on our website constitutes a purchase request. An order will be considered confirmed once it has been accepted by Kridhya by Devanshi Agarwal and the relevant order confirmation has been communicated to the customer.',
    [
      'Customers are responsible for providing accurate contact, billing and delivery information.',
      'We reserve the right to accept or decline an order under circumstances such as product unavailability, pricing errors, suspected fraudulent activity or other operational reasons.',
      'If an order cannot be fulfilled after payment, the customer will be informed and an applicable refund will be processed.',
      'Any changes to an order after confirmation will be subject to approval by our team.',
    ],
  ]],
  ['Pricing & Payments', [
    'All product prices displayed on our website are listed in Indian Rupees (INR), unless otherwise specified.',
    [
      'Prices are subject to change without prior notice.',
      'Applicable taxes, shipping charges and other additional costs, if any, will be displayed during checkout or communicated before order confirmation.',
      'Customers must complete payment through the payment methods made available on our website.',
      'An order will be processed according to the payment and order confirmation status.',
      'In case of an incorrect price or technical error, we reserve the right to review and correct the displayed information.',
    ],
  ]],
  ['Shipping & Delivery', [
    'We aim to deliver all orders within the estimated delivery timelines communicated during checkout or order confirmation.',
    [
      'Delivery timelines may vary depending on the delivery location, product availability and courier operations.',
      'Customers are responsible for providing a complete and accurate shipping address.',
      'Delays caused by courier partners, weather conditions, public holidays or circumstances beyond our control may occur.',
      'Shipping charges, if applicable, will be communicated during checkout.',
      'Once an order has been dispatched, tracking details may be shared with the customer, wherever available.',
    ],
    'Kridhya by Devanshi Agarwal shall not be responsible for delays caused by circumstances beyond its reasonable control.',
  ]],
  ['Returns, Refunds & Exchanges', [
    'Customers are requested to carefully review product details before placing an order.',
    <>Returns, refunds and exchanges will be governed by the separate {policyLink('/shipping-returns#returns-exchange', 'Return & Refund Policy')} published on our website.</>,
    [
      'Products must meet the applicable return or exchange eligibility requirements.',
      'Items showing signs of use, damage caused after delivery or alteration may not qualify for a return or exchange.',
      'Certain customised, personalised or made-to-order products may be excluded from return or exchange, subject to the applicable policy.',
      'Refunds, where approved, will be processed through the applicable payment or refund method.',
    ],
    <>Please refer to our {policyLink('/shipping-returns#returns-exchange', 'Return & Refund Policy')} for complete details.</>,
  ]],
  ['Order Cancellation', [
    'Customers wishing to cancel an order must contact our support team as soon as possible.',
    [
      'Cancellation requests will be considered based on the current order processing and dispatch status.',
      'Orders that have already been dispatched may not be eligible for cancellation.',
      'Refunds for approved cancellations will be processed in accordance with our refund policy.',
      'Customised or personalised orders may have separate cancellation conditions.',
    ],
  ]],
  ['Intellectual Property & Copyright', [
    'All content available on this website, including jewellery designs, photographs, product descriptions, graphics, logos, videos, written content, website layouts and other creative materials, belongs to Kridhya by Devanshi Agarwal or its respective licensors and is protected under applicable Indian and international intellectual property laws.',
    'No content may be copied, reproduced, distributed, modified, published or commercially used without prior written permission.',
  ]],
  ['Trademarks', [
    'The name Kridhya by Devanshi Agarwal, its logo, brand identity, graphics, page designs, product names and other associated branding elements are the property of Kridhya by Devanshi Agarwal.',
    'Unauthorised use of these trademarks or brand elements is strictly prohibited.',
    'All third-party trademarks appearing on this website belong to their respective owners.',
  ]],
  ['Permitted Use of the Website', [
    'Customers may access and use this website for personal, lawful and non-commercial shopping purposes.',
    'Users agree not to:',
    [
      'Use the website for fraudulent or unlawful activities.',
      'Attempt to gain unauthorised access to website systems or information.',
      'Copy, reproduce or misuse website content or product designs.',
      'Disrupt website functionality or interfere with its security.',
      'Provide false, misleading or inaccurate information while placing orders.',
    ],
    'We reserve the right to restrict or terminate access to the website in cases of misuse or violation of these terms.',
  ]],
  ['Errors, Inaccuracies & Omissions', [
    'We make reasonable efforts to ensure that all information on our website is accurate and up to date.',
    'However, the website may occasionally contain typographical errors, incorrect pricing, incomplete descriptions or inaccuracies relating to product availability.',
    'We reserve the right to correct such errors, update information, modify product details or cancel affected orders where necessary, subject to applicable laws. In cases where payment has already been received for an order that cannot be fulfilled, an applicable refund will be initiated.',
  ]],
  ['Limitation of Liability', [
    'To the extent permitted under applicable law, Kridhya by Devanshi Agarwal shall not be responsible for indirect or consequential losses arising from the use of the website, temporary website interruptions or circumstances beyond our reasonable control.',
    'Nothing in these Terms & Conditions shall exclude or limit any liability that cannot legally be excluded or limited under applicable Indian law, including rights available to consumers under applicable consumer protection laws.',
  ]],
  ['Third-Party Services & Links', [
    'Our website may contain links to third-party websites, payment gateways, delivery partners or other external services.',
    'These services are operated independently, and their use may be subject to their own terms and privacy policies.',
    'We are not responsible for the content, policies or practices of external websites or services, except where applicable law provides otherwise.',
  ]],
  ['Privacy & Protection of Information', [
    'We respect the privacy of our customers and take reasonable steps to protect the personal information shared through our website.',
    'Customer information may be collected and used for purposes such as:',
    [
      'Processing and delivering orders.',
      'Communicating order updates and customer support information.',
      'Processing payments and refunds.',
      'Improving website functionality and customer experience.',
      'Meeting applicable legal and regulatory requirements.',
    ],
    <>For more information about how personal information is collected, used and protected, please refer to our {policyLink('/privacy-policy', 'Privacy Policy')}.</>,
  ]],
  ['Applicable Law & Jurisdiction', [
    'These Terms & Conditions shall be governed by and interpreted in accordance with the laws of India.',
    'Any disputes arising from the use of this website or purchases made through it shall be subject to the jurisdiction of the competent courts in Jodhpur, Rajasthan, India, subject to applicable consumer protection laws and other mandatory legal provisions.',
  ]],
]

export function Terms() {
  useDocumentMeta('Terms & Conditions | Kridhya by Devanshi Agarwal', 'The terms that govern your use of kridhyabydevanshi.com and purchases from Kridhya by Devanshi Agarwal.')
  return (
    <>
      <InfoHero eyebrow="Legal" title="Terms & conditions" intro="The terms that govern your use of our website and the purchase of our jewellery." />
      <InfoBody>
        <p className="mb-10 text-[15px] leading-[1.75] text-wine-900/80">
          Welcome to Kridhya by Devanshi Agarwal. These Terms &amp; Conditions govern your access to and use of our website and the purchase of products offered through it. By visiting our website or placing an order, you agree to comply with the terms outlined below. Please read them carefully before making a purchase.
        </p>
        <PolicyBlocks sections={TERMS} numbered />
        <Block title={`${TERMS.length + 1}. Contact Information`}>
          <p>For questions, concerns or assistance regarding these Terms &amp; Conditions, please contact us:</p>
          <p>
            Brand: Kridhya by Devanshi Agarwal<br />
            Email: <a href={`mailto:${CONTACT.email}`} className="underline decoration-gold underline-offset-4">{CONTACT.email}</a><br />
            Phone: <a href={CONTACT.phoneHref} className="num underline decoration-gold underline-offset-4">{CONTACT.phoneDisplay}</a>
          </p>
          <p>We will be happy to assist you with your queries.</p>
        </Block>
        <p className="border-t border-wine-900/15 pt-6 text-[13px] text-wine-900/60">Last updated: 12 November 2026</p>
      </InfoBody>
    </>
  )
}
