// Image slot registry - the single place to swap photography.
// When VK delivers final images: drop the new file into /public/images/<folder>/,
// update `src` + `alt` here and set `placeholder: false`. Layouts reserve aspect ratios,
// so no component needs to change.

const e = (name) => `/images/editorial/${name}.webp`
const g = (name) => `/images/generated/${name}.webp`

// Responsive sources for the enhanced editorial images (800 / 1600px wide).
const HIRES = ['who-we-are', 'story-hero', 'story-beginning', 'story-design', 'story-yours', 'philosophy-thoughtful', 'philosophy-timeless', 'philosophy-personal', 'hero-banner', 'story-still-life', 'model-portrait', 'design-sketch', 'artisan-detail', 'necklace-closeup', 'collection-still-life', 'woman-wearing', 'ring-still-life']
const UPSCALED_4K = ['woman-wearing', 'story-still-life', 'hero-banner', 'design-sketch', 'model-portrait']
const AI_4K = ['gift-box', 'gift-banner', 'gift-meaningful', 'gifting-hero', 'gifting-boxes', 'story-quote']
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
    // Images Direction PDF p.2 - Aevum earrings, pendant, bangle and ring on burgundy calla lilies (AI-upscaled to 4K)
    { name: 'calla', alt: 'Kridhya infinity earrings, pendant, bangle and ring resting on burgundy calla lilies and satin', position: '72% 50%', tabletPosition: '100% 50%', mobilePosition: '80% 50%' },
    // KRIDHYA/16.png and 17.png (AI-upscaled to 4K; picture lifted so the heart sits higher in the frame)
    { name: 'heart', alt: 'Gold infinity pendant and matching earrings on a burgundy velvet heart', position: '50% 50%', tabletPosition: '100% 50%', mobilePosition: '74% 45%' },
    { name: 'heart-necklace', alt: 'Gold infinity necklace and earrings resting on a burgundy velvet heart', position: '75% 55%', tabletPosition: '100% 55%', mobilePosition: '82% 55%' },
    // KRIDHYA/29.png (fuller frame of the same photo, beige band trimmed), AI-upscaled to 4K
    { name: 'necklace-hands', alt: 'Layered gold infinity necklaces and stacked infinity rings worn together', position: '68% 50%', tabletPosition: '69% 50%', mobilePosition: '50% 0%', portrait: true },
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
  // KRIDHYA/14.png - stacked infinity rings on burgundy silk, set on burgundy satin; copy sits on the darker left
  giftBanner: { src: e('gift-meaningful'), alt: 'Stacked Kridhya infinity rings on a twist of burgundy silk', position: '72% 50%' },
  // About 'Who we are' - KRIDHYA/24.png
  whoWeAre: { src: e('who-we-are'), alt: 'Woman in burgundy velvet wearing Kridhya drop earrings and an infinity pendant' },
  // Corporate Gifting hero - 'Golden Floral Ring in Velvet Box' (4K), mirrored so the gift box sits left and the copy reads on the right
  giftingHero: { src: e('gifting-hero'), alt: 'Floral gold ring in an open burgundy velvet gift box on draped velvet among dried flowers', position: '35% 55%', mobilePosition: '28% 55%' },
  // Images Direction PDF (Nov 2026) - Our Story, Corporate Gifting and About
  storyHero: { src: e('story-hero'), alt: 'Portrait of a woman wearing Kridhya infinity drop earrings in low warm light' },
  storyBeginning: { src: e('story-beginning'), alt: 'Stacked infinity rings on a twist of burgundy silk' },
  storyQuote: { src: e('story-quote'), alt: 'Gold infinity pendant and earrings on a burgundy velvet heart' },
  storyDesign: { src: e('story-design'), alt: 'Infinity eternity ring resting on a burgundy calla lily' },
  storyYours: { src: e('story-yours'), alt: 'Woman in burgundy velvet wearing Kridhya drop earrings and pendant' },
  giftingBoxes: { src: e('gifting-boxes'), alt: 'Kridhya bracelet, necklace and studs presented in burgundy gift boxes with branded ribbon', position: '45% 50%', mobilePosition: '30% 50%' },
  philosophy: [
    { src: e('philosophy-thoughtful'), alt: 'Layered infinity necklaces on a burgundy velvet bust beside infinity studs' },
    { src: e('philosophy-timeless'), alt: 'Rose gold drop earrings, pendant and bracelet on a burgundy bust and hand' },
    { src: e('philosophy-personal'), alt: 'Rose gold infinity bangle set with garnets on a stone among burgundy leaves' },
  ],
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
