// Brand-wide configuration. Items marked PENDING need client confirmation before launch.

// PENDING: replace with the verified business WhatsApp number (country code, digits only).
export const WHATSAPP_NUMBER = '919413548001'

export const WHATSAPP_MESSAGES = {
  general: 'Hello Kridhya by Devanshi Agarwal, I would love some help choosing a piece. Could you assist me?',
  gifting:
    'Hello Kridhya by Devanshi Agarwal, I’m interested in corporate gifting or bulk jewellery orders. Could you please share the available options and details?',
  product: (name) => `Hello Kridhya by Devanshi Agarwal, I’m interested in the ${name}. Could you share more details?`,
}

export const whatsappLink = (message = WHATSAPP_MESSAGES.general) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`

export const BRAND_NAME = 'Kridhya by Devanshi Agarwal'
export const TAGLINE = 'Small joys worn close to heart'

// Review tool: shows the floating "Aa" typeface picker so the client can compare font pairings. Set to false at launch.
export const SHOW_FONT_PICKER = true

export const NAV = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Collections', to: '/collections' },
  { label: 'Corporate Gifting', to: '/corporate-gifting' },
  { label: 'Our Story', to: '/our-story' },
  { label: 'About', to: '/about' },
  { label: 'Journals', to: '/blog' },
  { label: 'Contact', to: '/contact' },
]

// Help & policy pages (footer). Copy on these pages is draft text pending client approval.
export const HELP = [
  { label: 'Track your order', to: '/track-order' },
  { label: 'FAQs', to: '/faq' },
  { label: 'Jewellery Care', to: '/jewellery-care' },
  { label: 'Shipping & Returns', to: '/shipping-returns' },
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms & Conditions', to: '/terms' },
]

// Contact details shown on the Contact page and Corporate Gifting enquiry block.
// Phone/WhatsApp mirrors WHATSAPP_NUMBER above. PENDING: confirm email, Instagram handle and studio hours with the client.
export const CONTACT = {
  phoneDisplay: '+91 94135 48001',
  phoneHref: 'tel:+919413548001',
  email: 'kridhyabydevanshi@gmail.com',
  instagram: { handle: '@kridhyabydevanshi', href: 'https://instagram.com/kridhyabydevanshi' },
  facebook: { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61595468576080' },
  website: 'kridhyabydevanshi.com',
  hours: 'Monday - Saturday, 10 am - 7 pm IST',
}

export const formatPrice = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
