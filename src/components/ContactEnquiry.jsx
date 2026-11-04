import { useState } from 'react'
import { CONTACT, WHATSAPP_MESSAGES, whatsappLink } from '../data/site'
import { IconArrow, IconInstagram, IconWhatsApp } from './Icons'
import { LotusMark } from './Logo'
import Mandala from './Mandala'

const DEFAULT_OCCASIONS = ['Festive celebrations', 'Employee milestones', 'Client appreciation', 'Weddings & events', 'Personal purchase', 'Something else']

// Contact details + enquiry form. Used on /contact and as the Corporate Gifting "Start an enquiry" block.
// Big, bold type throughout so it stays legible on the light beige ground.
export default function ContactEnquiry({
  id,
  eyebrow = 'Start an enquiry',
  title = 'Let’s talk',
  intro = 'Share a few details and our team will be in touch. Prefer to chat? Message us on WhatsApp.',
  occasions = DEFAULT_OCCASIONS,
  message = WHATSAPP_MESSAGES.general,
  showQuantity = false,
}) {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', quantity: '', occasion: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (!form.name.trim()) err.name = 'Please share your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Please enter a valid email address.'
    setErrors(err)
    if (!Object.keys(err).length) setSent(true)
  }

  return (
    <section id={id} className="section scroll-mt-6 bg-ivory">
      <div className="container-site grid overflow-hidden border border-gold/40 lg:grid-cols-12">
        {/* contact details */}
        <div className="grain relative isolate bg-wine-900 p-7 text-ivory sm:p-10 lg:col-span-5">
          <Mandala className="pointer-events-none absolute -bottom-40 -right-40 -z-10 h-[420px] w-[420px] text-gold/[0.14]" />
          <p className="eyebrow font-semibold text-gold">{eyebrow}</p>
          <h2 className="mt-3 font-display text-[clamp(calc(2.2rem_+_1px),calc(4vw_+_1px),calc(3.2rem_+_1px))] font-normal leading-[1.05]">{title}</h2>
          <p className="mt-4 max-w-sm text-[15px] font-medium leading-relaxed text-ivory/80">{intro}</p>

          <dl className="mt-9 divide-y divide-ivory/10 [&>div]:py-4 first:[&>div]:pt-0">
            <Detail label="Call or WhatsApp">
              <a href={CONTACT.phoneHref} className="hover:text-gold-light">{CONTACT.phoneDisplay}</a>
            </Detail>
            <Detail label="Email">
              <a href={`mailto:${CONTACT.email}`} className="hover:text-gold-light">{CONTACT.email}</a>
            </Detail>
            <Detail label="Instagram">
              <a href={CONTACT.instagram.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 hover:text-gold-light">
                <IconInstagram size={20} /> {CONTACT.instagram.handle}
              </a>
            </Detail>
            <Detail label="Studio hours">
              <span>{CONTACT.hours}</span>
            </Detail>
          </dl>

          <a href={whatsappLink(message)} target="_blank" rel="noreferrer" className="btn btn-gold mt-9 w-full font-semibold sm:w-auto">
            <IconWhatsApp size={17} /> Chat on WhatsApp
          </a>
        </div>

        {/* form */}
        <div className="bg-cream/60 p-7 sm:p-10 lg:col-span-7">
          {sent ? (
            <div role="status" className="flex h-full flex-col items-start justify-center">
              <LotusMark className="h-12 w-12 text-gold-deep" />
              <h3 className="mt-5 font-display text-[37px] font-medium">Thank you, {form.name.split(' ')[0]}.</h3>
              <p className="mt-3 text-[15px] font-medium text-wine-900/80">We’ve received your enquiry and will be in touch soon.</p>
            </div>
          ) : (
            <form noValidate onSubmit={submit} className="grid gap-x-7 gap-y-7 sm:grid-cols-2">
              <p className="font-display text-[29px] font-medium leading-tight sm:col-span-2">Send us a message</p>
              <Field id={`${id}-name`} label="Full name" required value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
              <Field id={`${id}-email`} label="Email" type="email" required value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
              <Field id={`${id}-phone`} label="Phone" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
              {showQuantity ? (
                <Field id={`${id}-quantity`} label="Approx. quantity" inputMode="numeric" value={form.quantity} onChange={set('quantity')} helper="An estimate is fine." />
              ) : (
                <Field id={`${id}-company`} label="Company (optional)" value={form.company} onChange={set('company')} autoComplete="organization" />
              )}
              <div className="sm:col-span-2">
                <label htmlFor={`${id}-occasion`} className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-wine-900">Occasion</label>
                <select id={`${id}-occasion`} value={form.occasion} onChange={set('occasion')} className="h-12 w-full cursor-pointer border-b-2 border-wine-900/30 bg-transparent text-[15px] font-medium focus:border-wine-700 focus:outline-none">
                  <option value="">Select an occasion</option>
                  {occasions.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`${id}-message`} className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-wine-900">Tell us more</label>
                <textarea id={`${id}-message`} rows={4} value={form.message} onChange={set('message')} className="w-full resize-none border-b-2 border-wine-900/30 bg-transparent py-2 text-[15px] font-medium placeholder:font-normal placeholder:text-wine-900/45 focus:border-wine-700 focus:outline-none" placeholder="Timelines, budget range, preferences…" />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn btn-wine h-12 w-full text-[12px] font-semibold sm:w-auto sm:px-8">Send enquiry <IconArrow size={15} /></button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">{label}</dt>
      <dd className="num mt-1.5 break-words text-[15px] font-normal leading-snug tracking-[0.005em] sm:text-[20px]">{children}</dd>
    </div>
  )
}

function Field({ id, label, error, helper, required, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.16em] text-wine-900">
        {label} {required && <span className="text-wine-600" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : helper ? `${id}-help` : undefined}
        className={`h-12 w-full border-b-2 bg-transparent text-[15px] font-medium focus:outline-none ${error ? 'border-wine-600' : 'border-wine-900/30 focus:border-wine-700'}`}
        {...rest}
      />
      {error ? <p id={`${id}-err`} className="mt-1.5 text-[15px] font-semibold text-wine-600">{error}</p> : helper ? <p id={`${id}-help`} className="mt-1.5 text-[15px] font-medium text-wine-900/60">{helper}</p> : null}
    </div>
  )
}
