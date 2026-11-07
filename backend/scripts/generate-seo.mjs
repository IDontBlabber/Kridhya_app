// Builds public/robots.txt, public/sitemap.xml and public/llms.txt before every `vite build` (see package.json "build").
// With the database configured (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY) it lists the live products and posts;
// otherwise it uses the catalogue shipped in src/data.
// Site address: SITE_URL (or VITE_SITE_URL), default https://kridhyabydevanshi.com
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SITE = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://kridhyabydevanshi.com').replace(/\/+$/, '')
const SB_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const SB_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

const { PRODUCTS, CATEGORIES } = await import('../../src/data/products.js')
const { POSTS } = await import('../../src/data/blog.js')
const { BRAND_NAME, TAGLINE, CONTACT } = await import('../../src/data/site.js')

let products = PRODUCTS.map((p) => ({ slug: p.slug, name: p.name, category: p.category, price: p.price, short: p.short }))
let posts = POSTS.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, date: p.date }))

if (SB_URL && SB_KEY) {
  try {
    const get = async (path) => {
      const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY, ...(SB_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${SB_KEY}` } : {}) } })
      if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`)
      return r.json()
    }
    const [pr, po] = await Promise.all([get('products?select=slug,data,updated_at'), get('posts?select=slug,publish_at,data,updated_at')])
    if (pr.length) products = pr.map((r) => ({ slug: r.slug, name: r.data.name, category: r.data.category, price: r.data.price, short: r.data.short, lastmod: r.updated_at }))
    if (po.length) posts = po.map((r) => ({ slug: r.slug, title: r.data.title, excerpt: r.data.excerpt, date: r.publish_at, lastmod: r.updated_at }))
    console.log(`[seo] using database: ${products.length} products, ${posts.length} posts`)
  } catch (e) {
    console.warn(`[seo] database unavailable (${e.message}) - using the shipped catalogue`)
  }
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
const STATIC = [
  ['/', '1.0', 'weekly'], ['/shop', '0.9', 'daily'], ['/collections', '0.8', 'weekly'], ['/corporate-gifting', '0.8', 'monthly'],
  ['/our-story', '0.6', 'monthly'], ['/about', '0.6', 'monthly'], ['/blog', '0.7', 'weekly'], ['/contact', '0.5', 'yearly'],
  ['/faq', '0.4', 'yearly'], ['/jewellery-care', '0.4', 'yearly'], ['/shipping-returns', '0.4', 'yearly'],
  ['/privacy-policy', '0.2', 'yearly'], ['/terms', '0.2', 'yearly'],
]
const urls = [
  ...STATIC.map(([path, priority, freq]) => ({ loc: path, priority, freq })),
  ...CATEGORIES.filter((c) => c.collection).map((c) => ({ loc: `/collections/${c.slug}`, priority: '0.7', freq: 'weekly' })),
  ...products.map((p) => ({ loc: `/product/${p.slug}`, priority: '0.8', freq: 'weekly', lastmod: p.lastmod })),
  ...posts.map((p) => ({ loc: `/blog/${p.slug}`, priority: '0.6', freq: 'monthly', lastmod: p.lastmod || p.date })),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(SITE + u.loc)}</loc><lastmod>${day(u.lastmod)}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`
writeFileSync(join(root, 'public', 'sitemap.xml'), sitemap)

const catName = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]))
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`
const llms = `# ${BRAND_NAME}

> ${TAGLINE}. Thoughtfully designed fine jewellery from India - pendants, earrings, bracelets, rings, necklaces and brooches in gold, rose gold and silver finishes - for everyday elegance, meaningful gifting and corporate gifting.

Prices are in Indian rupees (INR). Orders can be placed on the website or on WhatsApp (${CONTACT.phoneDisplay}). Customers track orders at ${SITE}/track-order.

## Shop
- [All jewellery](${SITE}/shop): the full catalogue with filters by category and finish
${CATEGORIES.filter((c) => c.collection).map((c) => `- [${c.name}](${SITE}/collections/${c.slug}): ${c.blurb}`).join('\n')}

## Products
${products.map((p) => `- [${p.name}](${SITE}/product/${p.slug}): ${catName[p.category] || p.category}, ${inr(p.price)}${p.short ? ` - ${p.short}` : ''}`).join('\n')}

## Gifting
- [Corporate gifting & bulk orders](${SITE}/corporate-gifting): jewellery gifts for teams, clients, festivals and events, with enquiry form and WhatsApp

## Journal
${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.excerpt}`).join('\n')}

## About & help
- [Our story](${SITE}/our-story)
- [About us and the founder](${SITE}/about)
- [Contact](${SITE}/contact): ${CONTACT.email}, ${CONTACT.phoneDisplay}, ${CONTACT.hours}
- [FAQs](${SITE}/faq)
- [Jewellery care](${SITE}/jewellery-care)
- [Shipping & returns](${SITE}/shipping-returns)
`
writeFileSync(join(root, 'public', 'llms.txt'), llms)
const robots = `# ${BRAND_NAME}
User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /order-confirmed
Disallow: /track-order
Disallow: /account

Sitemap: ${SITE}/sitemap.xml
`
writeFileSync(join(root, 'public', 'robots.txt'), robots)
console.log(`[seo] wrote robots.txt, sitemap.xml (${urls.length} URLs) and llms.txt for ${SITE}`)
