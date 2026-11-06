// Admin catalogue store: products + journal posts, persisted in the browser (see db.js), and mirrored into the
// public site's PRODUCTS / POSTS arrays so the shop and journal show the client's edits immediately.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PRODUCTS, CATEGORIES } from '../data/products'
import { POSTS } from '../data/blog'
import { DEFAULT_POPUP, POPUP, POPUP_LIBRARY } from '../data/popup'
import { dbDel, dbGet, dbSet } from './db'

const KEY = 'catalogue-v1'
// Tells other open tabs of the site that the catalogue changed, so they refresh without a reload.
const CHANNEL = 'kridhya-catalogue'
const announce = () => { try { const c = new BroadcastChannel(CHANNEL); c.postMessage('changed'); c.close() } catch { /* unsupported */ } }
export const VARIANTS = ['Gold', 'Rose Gold', 'Silver']
export const RIBBONS = ['', 'Bestseller', 'New', 'Limited edition', 'Gift favourite', 'Back in stock']
export const POST_CATEGORIES = ['Styling', 'Care', 'Gifting', 'Stories']
export { CATEGORIES }
export { DEFAULT_POPUP, popupActive } from '../data/popup'

// Snapshots of the shipped catalogue, taken before any hydration mutates the live arrays.
const DEFAULT_PRODUCTS = structuredClone(PRODUCTS)
const DEFAULT_POSTS = structuredClone(POSTS)

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
export const slugify = (s) =>
  s.toString().normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/* ---------- shape conversion: site <-> admin ---------- */

function productFromSite(p, i) {
  const variants = Object.fromEntries(
    VARIANTS.map((v) => [v, { enabled: p.finishes.includes(v), stock: p.finishes.includes(v) ? (i % 6 === 0 ? 2 : 8 + (i % 5)) : 0, sku: '' }]),
  )
  return {
    id: uid(),
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    comparePrice: '',
    ribbon: p.badge || '',
    short: p.short || '',
    description: '',
    images: [...p.images],
    variants,
    lowStock: 3,
    status: 'published',
    placeholder: !!p.placeholder,
    createdAt: Date.now() - (DEFAULT_PRODUCTS.length - i) * 86400000,
    updatedAt: Date.now() - (DEFAULT_PRODUCTS.length - i) * 86400000,
  }
}

function postFromSite(p) {
  const body = p.body.map((b) =>
    b.h2 ? { id: uid(), type: 'h2', text: b.h2 } : b.h3 ? { id: uid(), type: 'h3', text: b.h3 } : b.img ? { id: uid(), type: 'img', src: b.img, text: b.caption || '' } : { id: uid(), type: 'p', text: b.p },
  )
  return {
    id: uid(),
    slug: p.slug,
    title: p.title,
    category: p.category,
    date: p.date,
    excerpt: p.excerpt,
    cover: p.cover,
    coverAlt: p.coverAlt || '',
    body,
    seoTitle: p.seo?.title || '',
    seoDescription: p.seo?.description || '',
    status: 'published',
    createdAt: new Date(p.date).getTime(),
    updatedAt: new Date(p.date).getTime(),
  }
}

export const stockOf = (p) => VARIANTS.reduce((n, v) => n + (p.variants[v]?.enabled ? Number(p.variants[v].stock) || 0 : 0), 0)
export const enabledVariants = (p) => VARIANTS.filter((v) => p.variants[v]?.enabled)
export function stockState(p) {
  const n = stockOf(p)
  if (n === 0) return 'out'
  return enabledVariants(p).some((v) => (Number(p.variants[v].stock) || 0) <= p.lowStock) ? 'low' : 'ok'
}
export function readTime(post) {
  const words = [post.excerpt, ...post.body.map((b) => b.text || '')].join(' ').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min read`
}

function productToSite(p) {
  const finishes = enabledVariants(p)
  const soldOut = stockOf(p) === 0
  return {
    priceStatus: 'listed',
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: Number(p.price) || 0,
    comparePrice: Number(p.comparePrice) || undefined,
    finishes: finishes.length ? finishes : ['Gold'],
    stock: Object.fromEntries(finishes.map((v) => [v, Number(p.variants[v].stock) || 0])),
    soldOut,
    badge: soldOut ? 'Sold out' : p.ribbon || undefined,
    images: p.images.length ? p.images : ['/images/generated/satin-beige.webp'],
    short: p.short,
    description: p.description,
    placeholder: p.placeholder,
  }
}

function postToSite(p) {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    date: p.date,
    readTime: readTime(p),
    cover: p.cover || '/images/generated/satin-beige.webp',
    coverAlt: p.coverAlt || p.title,
    seo: { title: p.seoTitle || `${p.title} | Kridhya Journal`, description: p.seoDescription || p.excerpt },
    body: p.body.map((b) => (b.type === 'img' ? { img: b.src, caption: b.text } : { [b.type]: b.text })),
  }
}

// Mirror published items into the live arrays (in place, so every existing import sees the change).
// Browsers that stored an earlier default Diwali image (and never edited the pop-up) get the current one; other settings carry over.
const OLD_DEFAULTS = ['/images/popups/diwali-2026.webp', '/images/popups/diwali-kridhya.webp']
const upgradePopup = (p) => (!p ? { ...DEFAULT_POPUP } : OLD_DEFAULTS.includes(p.image) && p.id === DEFAULT_POPUP.id && !p.updatedAt ? { ...p, image: DEFAULT_POPUP.image, alt: DEFAULT_POPUP.alt } : p)

export function applyToSite(data) {
  if (!data) return
  PRODUCTS.splice(0, PRODUCTS.length, ...data.products.filter((p) => p.status === 'published').map(productToSite))
  POSTS.splice(0, POSTS.length, ...data.posts.filter((p) => p.status === 'published').sort((a, b) => b.date.localeCompare(a.date)).map(postToSite))
  Object.assign(POPUP, DEFAULT_POPUP, upgradePopup(data.popup))
}

export const seedData = () => ({ products: DEFAULT_PRODUCTS.map(productFromSite), posts: DEFAULT_POSTS.map(postFromSite), popup: { ...DEFAULT_POPUP }, updatedAt: Date.now() })

// Called once before the site renders: if the client has saved edits in this browser, show them.
export async function hydrateSite() {
  const saved = await dbGet(KEY)
  if (saved?.products) applyToSite(saved)
  else {
    // nothing saved (or the admin reset): the shipped catalogue, untouched
    PRODUCTS.splice(0, PRODUCTS.length, ...structuredClone(DEFAULT_PRODUCTS))
    POSTS.splice(0, POSTS.length, ...structuredClone(DEFAULT_POSTS))
    Object.assign(POPUP, DEFAULT_POPUP)
  }
}

// Site side: re-read the catalogue whenever the admin saves in any tab, then call onChange to re-render.
export function onCatalogueChange(onChange) {
  let c
  try { c = new BroadcastChannel(CHANNEL) } catch { return () => {} }
  c.onmessage = () => hydrateSite().then(onChange)
  return () => c.close()
}

/* ---------- React store ---------- */

const Ctx = createContext(null)

export function AdminStoreProvider({ children, initialData = null }) {
  const [data, setData] = useState(initialData)
  const [saving, setSaving] = useState('idle') // idle | saving | saved | error
  const first = useRef(true)
  const latest = useRef(null)
  const pending = useRef(false)

  const persist = useCallback((d) => {
    pending.current = false
    return dbSet(KEY, d)
      .then(() => { setSaving('saved'); announce() })
      .catch(() => setSaving('error'))
  }, [])

  // Leaving the admin (or closing the tab) never drops a save that is still waiting.
  useEffect(() => {
    const flush = () => { if (pending.current && latest.current) persist(latest.current) }
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('pagehide', flush); flush() }
  }, [persist])

  useEffect(() => {
    if (initialData) return
    dbGet(KEY).then((saved) => setData(saved?.products ? { ...saved, popup: upgradePopup(saved.popup) } : seedData()))
  }, [initialData])

  // persist + mirror on every change (debounced)
  useEffect(() => {
    if (!data) return
    if (first.current) {
      first.current = false
      applyToSite(data)
      return
    }
    // the shop in this tab updates at once; the browser database write is batched
    applyToSite(data)
    latest.current = data
    pending.current = true
    setSaving('saving')
    const t = setTimeout(() => persist(data), 300)
    return () => clearTimeout(t)
  }, [data, persist])

  const mutate = useCallback((fn) => setData((d) => ({ ...fn(d), updatedAt: Date.now() })), [])

  const api = useMemo(
    () => ({
      data,
      saving,
      saveProduct: (p) =>
        mutate((d) => {
          const next = { ...p, updatedAt: Date.now() }
          const exists = d.products.some((x) => x.id === p.id)
          return { ...d, products: exists ? d.products.map((x) => (x.id === p.id ? next : x)) : [{ ...next, createdAt: Date.now() }, ...d.products] }
        }),
      deleteProduct: (id) => mutate((d) => ({ ...d, products: d.products.filter((x) => x.id !== id) })),
      setStock: (id, variant, stock) =>
        mutate((d) => ({
          ...d,
          products: d.products.map((x) => (x.id === id ? { ...x, updatedAt: Date.now(), variants: { ...x.variants, [variant]: { ...x.variants[variant], stock: Math.max(0, stock) } } } : x)),
        })),
      savePost: (p) =>
        mutate((d) => {
          const next = { ...p, updatedAt: Date.now() }
          const exists = d.posts.some((x) => x.id === p.id)
          return { ...d, posts: exists ? d.posts.map((x) => (x.id === p.id ? next : x)) : [{ ...next, createdAt: Date.now() }, ...d.posts] }
        }),
      savePopup: (popup) => mutate((d) => ({ ...d, popup: { ...popup, updatedAt: Date.now() } })),
      deletePost: (id) => mutate((d) => ({ ...d, posts: d.posts.filter((x) => x.id !== id) })),
      replaceAll: (next) => setData({ ...next, updatedAt: Date.now() }),
      reset: async () => {
        await dbDel(KEY)
        announce()
        const s = seedData()
        first.current = true
        setData(s)
      },
    }),
    [data, saving, mutate],
  )

  return createElement(Ctx.Provider, { value: api }, children)
}

export const useAdmin = () => useContext(Ctx)

export const newProduct = () => ({
  id: uid(),
  slug: '',
  name: '',
  category: CATEGORIES[0].slug,
  price: '',
  comparePrice: '',
  ribbon: '',
  short: '',
  description: '',
  images: [],
  variants: Object.fromEntries(VARIANTS.map((v, i) => [v, { enabled: i === 0, stock: 0, sku: '' }])),
  lowStock: 3,
  status: 'draft',
  placeholder: false,
})

export const newPost = () => ({
  id: uid(),
  slug: '',
  title: '',
  category: POST_CATEGORIES[0],
  date: new Date().toISOString().slice(0, 10),
  excerpt: '',
  cover: '',
  coverAlt: '',
  body: [{ id: uid(), type: 'p', text: '' }],
  seoTitle: '',
  seoDescription: '',
  status: 'draft',
})

// Every photograph already on the site, offered as a library when adding images.
export const IMAGE_LIBRARY = [...new Set([...POPUP_LIBRARY, ...DEFAULT_PRODUCTS.flatMap((p) => p.images), ...DEFAULT_POSTS.map((p) => p.cover)])]

// Read an uploaded file, scale it to max 1600px and re-encode as WebP so the browser store stays small.
export function fileToImage(file, max = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Not an image'))
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k)
        c.height = Math.round(img.height * k)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/webp', 0.86))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
