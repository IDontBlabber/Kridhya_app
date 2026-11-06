// Festival / promotion pop-up shown on the website. Managed from Admin > Pop-up banner; these are the shipped
// defaults. The admin store copies saved settings into POPUP (in place) so the site always reads the latest.

export const DEFAULT_POPUP = {
  id: 'diwali-2026',
  enabled: true,
  name: 'Diwali 2026',
  // client-supplied 'Luxurious Diwali Jewelry Celebration' (1536 x 1024)
  image: '/images/popups/diwali-luxe.webp',
  alt: 'Happy Diwali from Kridhya by Devanshi Agarwal - a rose gold infinity ring, pendant and drop earrings with diyas and lanterns',
  link: '/shop',
  buttonLabel: 'Shop the festive edit',
  startDate: '', // YYYY-MM-DD, empty = from now
  endDate: '', // YYYY-MM-DD, empty = no end
  frequency: 'session', // 'session' (once per visit) | 'day' (once a day) | 'always' (every page load)
  delay: 2, // seconds after the page opens
}

// Ready-made banners offered in Admin > Pop-up banner (the client's own WhatsApp-supplied artwork is kept as an option).
export const POPUP_LIBRARY = ['/images/popups/diwali-luxe.webp', '/images/popups/diwali-2026.webp']

export const POPUP = { ...DEFAULT_POPUP }

// Should the pop-up show today? (dates are inclusive, in the visitor's local time)
export function popupActive(p = POPUP) {
  if (!p.enabled || !p.image) return false
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
  if (p.startDate && today < p.startDate) return false
  if (p.endDate && today > p.endDate) return false
  return true
}
