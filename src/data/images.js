// Image slot registry - the single place to swap photography.
// When VK delivers final images: drop the new file into /public/images/<folder>/,
// update `src` + `alt` here and set `placeholder: false`. Layouts reserve aspect ratios,
// so no component needs to change.

const e = (name) => `/images/editorial/${name}.webp`
const g = (name) => `/images/generated/${name}.webp`

// Responsive sources for the enhanced editorial images (800 / 1600px wide).
const HIRES = ['hero-banner', 'story-still-life', 'model-portrait', 'design-sketch', 'artisan-detail', 'necklace-closeup', 'collection-still-life', 'woman-wearing', 'ring-still-life']
const UPSCALED_4K = ['woman-wearing', 'story-still-life', 'hero-banner', 'design-sketch', 'model-portrait']
const AI_4K = ['gift-box', 'gift-banner', 'gifting-hero']
export function srcSetFor(src) {
  // 4K hero banners: /images/hero/hero-<name>-<width>.webp
  const h = /^\/images\/hero\/(hero-[\w-]+?)-(1080|1920|3840)\.webp$/.exec(src || '')
  if (h) return [1080, 1920, 3840].map((w) => `/images/hero/${h[1]}-${w}.webp ${w}w`).join(', ')
  if (src === '/images/brand/kridhya-logo-square.webp') return '/images/brand/kridhya-logo-square-800.webp 800w, /images/brand/kridhya-logo-square.webp 1600w'
  const m = /^\/images\/editorial\/([\w-]+)\.webp$/.exec(src || '')
  if (!m) return undefined
  const base = `/images/editorial/${m[1]}`
  // AI-upscaled to 4K (Real-ESRGAN x4plus from the original file): 1080 / 1920 / 3840px
  if (AI_4K.includes(m[1])) return `${base}-1080.webp 1080w, ${base}.webp 1920w, ${base}-3840.webp 3840w`
  // composed gift-curation banner: 1080 / 1920 / 2560px
  if (m[1] === 'gift-curation') return `${base}-1080.webp 1080w, ${base}-1920.webp 1920w, ${base}.webp 2560w`
  if (!HIRES.includes(m[1])) return undefined
  // Real-ESRGAN x4plus upscales (Our Story set) also ship a 3840px 4K file
  if (UPSCALED_4K.includes(m[1])) return `${base}-800.webp 800w, ${base}.webp 1600w, ${base}-3840.webp 3840w`
  return `${base}-800.webp 800w, ${base}.webp 1600w`
}

export const IMG = {
  // Full-bleed hero carousel - 16:9 banners at 3840 / 1920 / 1080 widths (served via srcset).
  // TEMPORARY stock (Unsplash licence, see /public/images/hero/CREDITS.md) until VK's approved banners arrive.
  // To swap: export each banner at 3840×2160, save as hero-<name>-{3840,1920,1080}.webp, update `name` + `alt`.
  // `position` is the focal point kept in frame on narrow/portrait screens.
  heroSlides: [
    // client-supplied 'Elegant Jewelry in Natural Light' (mirrored so the pieces sit opposite the headline), AI-upscaled to 4K
    { name: 'infinity', alt: 'Kridhya infinity pendants in silver, rose gold and pearl displayed on driftwood with dried flowers', position: '82% 50%', mobilePosition: '64% 50%' },
    { name: 'bracelets', alt: 'Outstretched wrists wearing delicate gold chain bracelets against black drapery', position: '60% 45%', mobilePosition: '64% 50%', placeholder: true },
    { name: 'everyday-gold', alt: 'Layered gold necklaces and sculptural rings worn against warm skin tones', position: '50% 45%', mobilePosition: '50% 40%', placeholder: true },
    { name: 'gifting', alt: 'Polished gold herringbone necklace worn with a black blazer', position: '62% 40%', mobilePosition: '66% 40%', placeholder: true },
  ],
  // Editorial slots - the client's supplied photos, cleaned of edge bands and enhanced
  // (2-step Lanczos upscale + edge-aware sharpening) to 1600px, with an 800px version for phones.
  // Replace with VK's original high-resolution files when available for full clarity.
  heroBanner: { src: e('hero-banner'), alt: 'Lotus pendant displayed on stone amid burgundy florals', placeholder: true },
  storyStill: { src: e('story-still-life'), alt: 'Lotus ring and pendant arranged on stone with dried roses', placeholder: true },
  modelPortrait: { src: e('model-portrait'), alt: 'Woman wearing lotus drop earrings in warm light', placeholder: true },
  designSketch: { src: e('design-sketch'), alt: 'Hand sketching a lotus jewellery design in pencil', placeholder: true },
  artisanDetail: { src: e('artisan-detail'), alt: 'Close detail of a lotus pendant being finished by hand', placeholder: true },
  necklaceCloseup: { src: e('necklace-closeup'), alt: 'Delicate lotus necklace worn with a burgundy saree', placeholder: true },
  collectionStill: { src: e('collection-still-life'), alt: 'Lotus jewellery set displayed on a stone plinth', placeholder: true },
  womanWearing: { src: e('woman-wearing'), alt: 'Woman in a burgundy saree wearing fine jewellery', placeholder: true },
  ringStill: { src: e('ring-still-life'), alt: 'Lotus cocktail ring on textured stone', placeholder: true },
  giftBox: { src: e('gift-box'), alt: 'Lotus ring presented in a burgundy velvet gift box', placeholder: true },
  // Home 'Corporate gifting & bulk orders' banner - burgundy satin with one unframed photograph on the right
  // (lotus ring in its velvet gift box, soft shadow); the copy sits on the darker, plain left half
  giftBanner: { src: e('gift-curation'), alt: 'Gold lotus ring in an open burgundy velvet gift box on burgundy satin', position: '72% 50%' },
  // Corporate Gifting hero - 'Golden Floral Ring in Velvet Box' (4K), mirrored so the gift box sits left and the copy reads on the right
  giftingHero: { src: e('gifting-hero'), alt: 'Floral gold ring in an open burgundy velvet gift box on draped velvet among dried flowers', position: '35% 55%', mobilePosition: '28% 55%' },
  heartRose: { src: e('heart-necklace-rose-satin'), alt: 'Rose gold infinity heart necklace on satin', placeholder: true },
  heartSilver: { src: e('heart-necklace-silver-satin'), alt: 'Silver infinity heart necklace on satin', placeholder: true },
  doubleGold: { src: e('double-strand-gold-satin'), alt: 'Gold double strand infinity necklace on satin', placeholder: true },
  doubleRose: { src: e('double-strand-rose-satin'), alt: 'Rose gold double strand infinity necklace on satin', placeholder: true },
  lariatSilver: { src: e('lariat-silver-satin'), alt: 'Silver lariat necklace with heart drop', placeholder: true },

  // Generated art (procedural satin backdrops) - decorative, safe to keep after the swap
  satinWine: { src: g('satin-burgundy'), alt: '' },
  satinBeige: { src: g('satin-beige'), alt: '' },
  satinWineGold: { src: g('satin-wine-gold'), alt: '' },
}
