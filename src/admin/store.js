// Admin catalogue store: products, journal posts and the pop-up banner.
// Two modes, same API for every admin screen:
//  - DATABASE (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set): reads/writes Supabase; every visitor sees published changes.
//  - PREVIEW (no keys): saved in this browser only (IndexedDB, see db.js).
// The public site's PRODUCTS / POSTS / POPUP are mirrored in place so existing pages just re-render.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PRODUCTS, CATEGORIES } from '../data/products'
import { POSTS } from '../data/blog'
import { DEFAULT_POPUP, POPUP, POPUP_LIBRARY } from '../data/popup'
import { hasBackend, rest } from '../lib/backend'
import { dbDel, dbGet, dbSet } from './db'

export { hasBackend }
const KEY = 'catalogue-v1'
const CACHE = 'kridhya-catalogue-cache'
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
    id: uid(), slug: p.slug, name: p.name, category: p.category, price: p.price, comparePrice: '',
    ribbon: p.badge || '', short: p.short || '', description: '', images: [...p.images], variants, lowStock: 3,
    status: 'published', placeholder: !!p.placeholder,
    createdAt: Date.now() - (DEFAULT_PRODUCTS.length - i) * 86400000, updatedAt: Date.now() - (DEFAULT_PRODUCTS.length - i) * 86400000,
  }
}

function postFromSite(p) {
  const body = p.body.map((b) =>
    b.h2 ? { id: uid(), type: 'h2', text: b.h2 }
      : b.h3 ? { id: uid(), type: 'h3', text: b.h3 }
        : b.img ? { id: uid(), type: 'img', src: b.img, text: b.caption || '', alt: b.alt || b.caption || '' }
          : b.quote ? { id: uid(), type: 'quote', text: b.quote, cite: b.cite || '' }
            : { id: uid(), type: 'p', text: b.p, size: b.size || 'md' },
  )
  return {
    id: uid(), slug: p.slug, title: p.title, category: p.category, date: p.date, publishAt: `${p.date}T09:00`,
    excerpt: p.excerpt, cover: p.cover, coverAlt: p.coverAlt || '', body,
    seoTitle: p.seo?.title || '', seoDescription: p.seo?.description || '', status: 'published',
    createdAt: new Date(p.date).getTime(), updatedAt: new Date(p.date).getTime(),
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
// publish moment of a post (scheduling); old records only have a date
export const publishTime = (p) => new Date(p.publishAt || `${p.date}T00:00`).getTime()
export const isScheduled = (p) => p.status === 'published' && publishTime(p) > Date.now()
const isLive = (p) => p.status === 'published' && publishTime(p) <= Date.now()

function productToSite(p) {
  const finishes = enabledVariants(p)
  const soldOut = stockOf(p) === 0
  return {
    priceStatus: 'listed', slug: p.slug, name: p.name, category: p.category,
    price: Number(p.price) || 0, comparePrice: Number(p.comparePrice) || undefined,
    finishes: finishes.length ? finishes : ['Gold'],
    stock: Object.fromEntries(finishes.map((v) => [v, Number(p.variants[v].stock) || 0])),
    soldOut, badge: soldOut ? 'Sold out' : p.ribbon || undefined,
    images: p.images.length ? p.images : ['/images/generated/satin-beige.webp'],
    short: p.short, description: p.description, placeholder: p.placeholder,
  }
}

function postToSite(p) {
  return {
    slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category,
    date: (p.publishAt || p.date || '').slice(0, 10), readTime: readTime(p),
    cover: p.cover || '/images/generated/satin-beige.webp', coverAlt: p.coverAlt || p.title,
    seo: { title: p.seoTitle || `${p.title} | Kridhya Journal`, description: p.seoDescription || p.excerpt },
    body: p.body.map((b) =>
      b.type === 'img' ? { img: b.src, caption: b.text, alt: b.alt || b.text }
        : b.type === 'quote' ? { quote: b.text, cite: b.cite }
          : b.type === 'p' ? { p: b.text, size: b.size || 'md' }
            : { [b.type]: b.text },
    ),
  }
}

// Browsers that stored an earlier default Diwali image (and never edited the pop-up) get the current one.
const OLD_DEFAULTS = ['/images/popups/diwali-2026.webp', '/images/popups/diwali-kridhya.webp']
const upgradePopup = (p) => (!p ? { ...DEFAULT_POPUP } : OLD_DEFAULTS.includes(p.image) && p.id === DEFAULT_POPUP.id && !p.updatedAt ? { ...p, image: DEFAULT_POPUP.image, alt: DEFAULT_POPUP.alt } : p)

// Mirror live items into the site's arrays (in place, so every existing import sees the change).
export function applyToSite(data) {
  if (!data) return
  PRODUCTS.splice(0, PRODUCTS.length, ...data.products.filter((p) => p.status === 'published').map(productToSite))
  POSTS.splice(0, POSTS.length, ...data.posts.filter(isLive).sort((a, b) => publishTime(b) - publishTime(a)).map(postToSite))
  Object.assign(POPUP, DEFAULT_POPUP, upgradePopup(data.popup))
}
function applyDefaults() {
  PRODUCTS.splice(0, PRODUCTS.length, ...structuredClone(DEFAULT_PRODUCTS))
  POSTS.splice(0, POSTS.length, ...structuredClone(DEFAULT_POSTS))
  Object.assign(POPUP, DEFAULT_POPUP)
}

export const seedData = () => ({ products: DEFAULT_PRODUCTS.map(productFromSite), posts: DEFAULT_POSTS.map(postFromSite), popup: { ...DEFAULT_POPUP }, updatedAt: Date.now() })

/* ---------- public site ---------- */

// Database mode: what every visitor sees (row-level security only returns published / live rows).
async function fetchLive() {
  const [products, posts, settings] = await Promise.all([
    rest('products?select=id,slug,status,data'),
    rest('posts?select=id,slug,status,publish_at,data'),
    rest('settings?select=value&key=eq.popup'),
  ])
  const row = (r) => ({ ...r.data, id: r.id, slug: r.slug, status: r.status })
  return { products: products.map(row), posts: posts.map(row), popup: settings[0]?.value || null }
}
const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE)) } catch { return null } }
const writeCache = (d) => { try { localStorage.setItem(CACHE, JSON.stringify(d)) } catch { /* full or blocked */ } }

// Called before the first render. Database mode: show the last copy instantly, refresh in the background
// (onFresh re-renders when it arrives). First ever visit waits up to ~2.5 s for the database, then falls back.
export async function hydrateSite(onFresh) {
  if (!hasBackend) {
    const saved = await dbGet(KEY)
    return saved?.products ? applyToSite(saved) : applyDefaults()
  }
  const cached = readCache()
  const fresh = fetchLive().then((d) => {
    const changed = JSON.stringify(d) !== JSON.stringify(cached)
    writeCache(d)
    if (d.products.length) applyToSite(d)
    return changed
  })
  if (cached?.products?.length) {
    applyToSite(cached)
    fresh.then((changed) => changed && onFresh?.()).catch(() => {})
    return
  }
  await Promise.race([fresh.catch(() => {}), new Promise((r) => setTimeout(r, 2500))])
  fresh.then((changed) => changed && onFresh?.()).catch(() => {})
}

// Re-read the catalogue whenever the admin saves (another tab), then call onChange to re-render.
export function onCatalogueChange(onChange) {
  let c
  try { c = new BroadcastChannel(CHANNEL) } catch { return () => {} }
  c.onmessage = () => hydrateSite(onChange).then(onChange)
  return () => c.close()
}

/* ---------- React store (admin) ---------- */

const Ctx = createContext(null)
const loadRemote = () => import('./remote')

export function AdminStoreProvider({ children, initialData = null }) {
  const [data, setData] = useState(initialData)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState('idle') // idle | saving | saved | error
  const first = useRef(true)
  const latest = useRef(null)
  const pending = useRef(false)
  const inflight = useRef(0)
  const timers = useRef({})

  /* preview mode: whole catalogue saved to IndexedDB (debounced) */
  const persist = useCallback((d) => {
    pending.current = false
    return dbSet(KEY, d).then(() => { setSaving('saved'); announce() }).catch(() => setSaving('error'))
  }, [])
  useEffect(() => {
    if (hasBackend) return
    const flush = () => { if (pending.current && latest.current) persist(latest.current) }
    window.addEventListener('pagehide', flush)
    return () => { window.removeEventListener('pagehide', flush); flush() }
  }, [persist])

  const reload = useCallback(async () => {
    if (!hasBackend) {
      const saved = await dbGet(KEY)
      setData(saved?.products ? { ...saved, popup: upgradePopup(saved.popup) } : seedData())
      return
    }
    try {
      const remote = await loadRemote()
      const d = await remote.loadCatalogue()
      setData({ ...d, popup: d.popup || { ...DEFAULT_POPUP }, empty: !d.products.length && !d.posts.length })
      setLoadError('')
    } catch (e) {
      setLoadError(e.message || 'Could not reach the database.')
    }
  }, [])
  useEffect(() => { if (!initialData) reload() }, [initialData, reload])

  // mirror to the site in this tab; in preview mode also persist the whole blob
  useEffect(() => {
    if (!data) return
    applyToSite(data)
    if (hasBackend) return
    if (first.current) { first.current = false; return }
    latest.current = data
    pending.current = true
    setSaving('saving')
    const t = setTimeout(() => persist(data), 300)
    return () => clearTimeout(t)
  }, [data, persist])

  // database mode: run a write, tracking the save indicator
  const remoteWrite = useCallback(async (fn) => {
    if (!hasBackend) return
    inflight.current += 1
    setSaving('saving')
    try {
      await fn(await loadRemote())
      inflight.current -= 1
      if (!inflight.current) { setSaving('saved'); announce() }
    } catch (e) {
      inflight.current -= 1
      setSaving('error')
      console.error('[admin] save failed', e)
    }
  }, [])
  // quick repeated edits (stock +/−) collapse into one write per product
  const debounced = useCallback((key, fn) => {
    clearTimeout(timers.current[key])
    setSaving('saving')
    timers.current[key] = setTimeout(() => remoteWrite(fn), 450)
  }, [remoteWrite])

  const mutate = useCallback((fn) => setData((d) => ({ ...fn(d), updatedAt: Date.now() })), [])

  const api = useMemo(() => {
    const upsertLocal = (list, item) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [{ ...item, createdAt: Date.now() }, ...list])
    return {
      data, saving, loadError, reload, backend: hasBackend,
      saveProduct: (p) => {
        const next = { ...p, updatedAt: Date.now() }
        mutate((d) => ({ ...d, products: upsertLocal(d.products, next) }))
        remoteWrite((r) => r.upsertProduct(next))
      },
      deleteProduct: (id) => {
        mutate((d) => ({ ...d, products: d.products.filter((x) => x.id !== id) }))
        remoteWrite((r) => r.deleteProduct(id))
      },
      setStock: (id, variant, stock) => {
        let next
        mutate((d) => ({
          ...d,
          products: d.products.map((x) => {
            if (x.id !== id) return x
            next = { ...x, updatedAt: Date.now(), variants: { ...x.variants, [variant]: { ...x.variants[variant], stock: Math.max(0, stock) } } }
            return next
          }),
        }))
        if (hasBackend) debounced(`p:${id}`, (r) => r.upsertProduct(next))
      },
      savePost: (p) => {
        const next = { ...p, date: (p.publishAt || p.date || '').slice(0, 10), updatedAt: Date.now() }
        mutate((d) => ({ ...d, posts: upsertLocal(d.posts, next) }))
        remoteWrite((r) => r.upsertPost(next))
      },
      deletePost: (id) => {
        mutate((d) => ({ ...d, posts: d.posts.filter((x) => x.id !== id) }))
        remoteWrite((r) => r.deletePost(id))
      },
      savePopup: (popup) => {
        const next = { ...popup, updatedAt: Date.now() }
        mutate((d) => ({ ...d, popup: next }))
        remoteWrite((r) => r.savePopup(next))
      },
      // photos: database mode uploads to Supabase Storage; preview mode keeps the data URL
      uploadImage: async (dataUrl) => (hasBackend ? (await loadRemote()).uploadImage(dataUrl) : dataUrl),
      // backup restore / first import into the database (uploads any embedded photos first)
      replaceAll: async (next, onProgress) => {
        if (!hasBackend) return setData({ ...next, popup: upgradePopup(next.popup), updatedAt: Date.now() })
        const r = await loadRemote()
        const up = async (src) => (src?.startsWith('data:') ? r.uploadImage(src) : src)
        const products = []
        for (const [i, p] of next.products.entries()) {
          onProgress?.(`Products ${i + 1} / ${next.products.length}`)
          products.push({ ...p, images: await Promise.all(p.images.map(up)) })
        }
        const posts = []
        for (const [i, p] of next.posts.entries()) {
          onProgress?.(`Posts ${i + 1} / ${next.posts.length}`)
          posts.push({ ...p, cover: await up(p.cover), body: await Promise.all(p.body.map(async (b) => (b.type === 'img' ? { ...b, src: await up(b.src) } : b))) })
        }
        const popup = next.popup ? { ...next.popup, image: await up(next.popup.image) } : null
        onProgress?.('Saving to the database…')
        if (products.length) await r.upsertProducts(products)
        if (posts.length) await r.upsertPosts(posts)
        if (popup) await r.savePopup(popup)
        announce()
        await reload()
      },
      reset: async () => {
        if (hasBackend) return
        await dbDel(KEY)
        announce()
        first.current = true
        setData(seedData())
      },
      // what this browser saved in preview mode, for copying into the database
      localCatalogue: async () => (await dbGet(KEY)) || null,
    }
  }, [data, saving, loadError, reload, mutate, remoteWrite, debounced])

  return createElement(Ctx.Provider, { value: api }, children)
}

export const useAdmin = () => useContext(Ctx)

export const newProduct = () => ({
  id: uid(), slug: '', name: '', category: CATEGORIES[0].slug, price: '', comparePrice: '', ribbon: '', short: '', description: '',
  images: [], variants: Object.fromEntries(VARIANTS.map((v, i) => [v, { enabled: i === 0, stock: 0, sku: '' }])),
  lowStock: 3, status: 'draft', placeholder: false,
})

const localNow = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }
export const newPost = () => ({
  id: uid(), slug: '', title: '', category: POST_CATEGORIES[0], publishAt: localNow(), date: localNow().slice(0, 10),
  excerpt: '', cover: '', coverAlt: '', body: [{ id: uid(), type: 'p', text: '', size: 'md' }],
  seoTitle: '', seoDescription: '', status: 'draft',
})

// Every photograph already on the site, offered as a library when adding images.
export const IMAGE_LIBRARY = [...new Set([...POPUP_LIBRARY, ...DEFAULT_PRODUCTS.flatMap((p) => p.images), ...DEFAULT_POSTS.map((p) => p.cover)])]

// Read an uploaded file, scale it to max 1600px and re-encode as WebP.
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
