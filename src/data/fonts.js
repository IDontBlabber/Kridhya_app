// Typeface pairings. `collection` = collection / category names (a distinct third voice). `display` = headings, `sans` = body / UI / numerals, `brand` = logo wordmark capitals.
// The picker (components/FontPicker.jsx) loads a pairing's Google Fonts stylesheet on demand and swaps the
// CSS variables below, so every page re-types itself instantly. To add an option, add one entry here.
// Numerals: every pairing is forced to lining figures (see index.css) and prices/quantities use the body font.

const gf = (...fams) =>
  `https://fonts.googleapis.com/css2?${fams.map((f) => `family=${f}`).join('&')}&display=swap`

export const FONT_PAIRS = [
  {
    id: 'playfair-nunito',
    name: 'Playfair + Nunito Sans',
    note: 'Playfair Display headings with regular Nunito Sans body — soft, elegant, very readable.',
    display: '"Playfair Display", Georgia, serif',
    sans: '"Nunito Sans", system-ui, sans-serif',
    brand: 'Cinzel, Georgia, serif',
    collection: 'Cinzel, Georgia, serif',
    url: gf('Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500', 'Nunito+Sans:wght@300;400;500;600', 'Cinzel:wght@400;500;600'),
  },
  {
    id: 'fraunces-plex',
    name: 'Fraunces + IBM Plex Sans',
    note: 'Warm, characterful Fraunces with crisp IBM Plex Sans for prices and UI.',
    display: 'Fraunces, Georgia, serif',
    sans: '"IBM Plex Sans", system-ui, sans-serif',
    brand: 'Cinzel, Georgia, serif',
    collection: '"Playfair Display", Georgia, serif',
    url: gf('Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500', 'IBM+Plex+Sans:wght@300;400;500;600', 'Cinzel:wght@400;500;600'),
  },
  {
    id: 'cinzel-nunito',
    name: 'Cinzel + Nunito Sans',
    note: 'Regal Cinzel capitals for headings, Nunito Sans for everything else.',
    display: 'Cinzel, Georgia, serif',
    sans: '"Nunito Sans", system-ui, sans-serif',
    brand: 'Cinzel, Georgia, serif',
    collection: 'Fraunces, Georgia, serif',
    url: gf('Cinzel:wght@400;500;600', 'Nunito+Sans:wght@300;400;500;600'),
  },
  {
    id: 'playfair-plex',
    name: 'Playfair + IBM Plex Sans',
    note: 'High-contrast Playfair with precise IBM Plex Sans.',
    display: '"Playfair Display", Georgia, serif',
    sans: '"IBM Plex Sans", system-ui, sans-serif',
    brand: 'Cinzel, Georgia, serif',
    collection: 'Cinzel, Georgia, serif',
    url: gf('Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500', 'IBM+Plex+Sans:wght@300;400;500;600', 'Cinzel:wght@400;500;600'),
  },
  {
    id: 'fraunces-nunito',
    name: 'Fraunces + Nunito Sans',
    note: 'Soft, friendly luxury: Fraunces with Nunito Sans. Default.',
    display: 'Fraunces, Georgia, serif',
    sans: '"Nunito Sans", system-ui, sans-serif',
    brand: 'Cinzel, Georgia, serif',
    collection: 'Cinzel, Georgia, serif',
    url: gf('Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500', 'Nunito+Sans:wght@300;400;500;600', 'Cinzel:wght@400;500;600'),
  },
  {
    id: 'cinzel-plex',
    name: 'Cinzel + IBM Plex Sans',
    note: 'Inscriptional headings with a technical, tidy body font.',
    display: 'Cinzel, Georgia, serif',
    sans: '"IBM Plex Sans", system-ui, sans-serif',
    brand: 'Cinzel, Georgia, serif',
    collection: '"Playfair Display", Georgia, serif',
    url: gf('Cinzel:wght@400;500;600', 'IBM+Plex+Sans:wght@300;400;500;600'),
  },
]

export const DEFAULT_FONT = 'fraunces-nunito'
export const FONT_KEY = 'kridhya-font-v2'
export const getFontPair = (id) => FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0]

// Applies a pairing: loads its stylesheet once, then sets the CSS variables the Tailwind font families read.
const loaded = new Set()
export function applyFontPair(id) {
  const f = getFontPair(id)
  if (f.url && !loaded.has(f.url)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = f.url
    document.head.appendChild(link)
    loaded.add(f.url)
  }
  const s = document.documentElement.style
  s.setProperty('--font-display', f.display)
  s.setProperty('--font-sans', f.sans)
  s.setProperty('--font-brand', f.brand)
  s.setProperty('--font-collection', f.collection)
  document.documentElement.dataset.font = f.id
  return f
}

export function initialFont() {
  try {
    const q = new URLSearchParams(window.location.search).get('font')
    if (q && FONT_PAIRS.some((f) => f.id === q)) return q
    const saved = localStorage.getItem(FONT_KEY)
    if (saved && FONT_PAIRS.some((f) => f.id === saved)) return saved
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_FONT
}
