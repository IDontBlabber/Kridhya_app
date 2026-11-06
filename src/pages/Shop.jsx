import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Breadcrumbs, FinishDot, ProductCard } from '../components/ui'
import { EASE, Stagger } from '../components/motion'
import { CATEGORIES, PRODUCTS, getCategory } from '../data/products'
import { IconChevronDown, IconClose, IconSearch } from '../components/Icons'
import useDocumentMeta from '../hooks/useDocumentMeta'
import { useCatalogueVersion } from '../lib/catalogue'

const PER_PAGE = 12
const SORTS = {
  featured: { label: 'Featured', fn: () => 0 },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
  name: { label: 'Name A-Z', fn: (a, b) => a.name.localeCompare(b.name) },
}
const FINISHES = ['Gold', 'Rose Gold', 'Silver']

export default function Shop() {
  const { slug } = useParams()
  const [params, setParams] = useSearchParams()
  const category = slug ?? params.get('category') ?? 'all'
  const finish = params.get('finish') ?? ''
  const sort = params.get('sort') ?? 'featured'
  const q = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page') ?? 1))
  const cat = getCategory(category)

  useDocumentMeta(
    `${cat ? cat.name : 'Shop All Jewellery'} | Kridhya by Devanshi Agarwal`,
    cat ? cat.blurb : 'browse pendants, earrings, bracelets, rings, necklaces and brooches from Kridhya by Devanshi Agarwal.',
  )

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all' && value !== 'featured') next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: key !== 'page' })
    if (key === 'page') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const version = useCatalogueVersion()
  const filtered = useMemo(() => {
    let list = PRODUCTS
    if (category !== 'all') list = list.filter((p) => p.category === category)
    if (finish) list = list.filter((p) => p.finishes.includes(finish))
    if (q) list = list.filter((p) => `${p.name} ${p.short}`.toLowerCase().includes(q.toLowerCase()))
    return [...list].sort(SORTS[sort]?.fn ?? SORTS.featured.fn)
  }, [category, finish, q, sort, version])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  // Category links: inside /collections/:slug navigate between archives, otherwise filter via query.
  const catHref = (s) => (slug ? (s === 'all' ? '/shop' : `/collections/${s}`) : null)

  return (
    <>
      <section className="bg-ivory pb-8 pt-32 sm:pt-36">
        <div className="container-hero">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, cat ? { label: 'Collections', to: '/collections' } : { label: 'Shop' }, ...(cat ? [{ label: cat.name }] : [])]} />
          <div className="mt-5 grid items-end gap-4 lg:grid-cols-12">
            <motion.h1 initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1, ease: EASE }} className="h-display font-medium lg:col-span-7">
              {cat ? <span className="font-collection tracking-[0.08em]">{cat.name}</span> : <>The Collection</>}
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }} className="max-w-sm text-[14px] font-medium text-wine-900/75 lg:col-span-5 lg:justify-self-end">
              {cat ? cat.blurb : 'Pendants, Earrings, Bracelets and Rings - designed for Everyday elegance and the moments you’ll remember.'}
            </motion.p>
          </div>
        </div>
      </section>

      {/* filter bar */}
      <div className="relative z-30 border-y border-wine-900/10 bg-ivory">
        <div className="container-hero flex flex-col gap-1 py-2 min-[1360px]:flex-row min-[1360px]:items-center min-[1360px]:justify-between min-[1360px]:gap-6">
          <nav aria-label="Categories" className="flex flex-wrap gap-x-5 gap-y-0 min-[1360px]:flex-nowrap">
            {[{ slug: 'all', name: 'All' }, ...CATEGORIES].map((c) => {
              const active = category === c.slug
              const cls = `min-h-[44px] min-w-[44px] shrink-0 border-b text-center text-[11.5px] font-semibold uppercase tracking-[0.14em] transition-colors ${active ? 'border-wine-900 text-wine-900' : 'border-transparent text-wine-900/55 hover:text-wine-900'}`
              const inner = c.name
              const href = catHref(c.slug)
              return href ? (
                <Link key={c.slug} to={href} className={`${cls} inline-flex items-center`} aria-current={active ? 'page' : undefined}>{inner}</Link>
              ) : (
                <button key={c.slug} type="button" onClick={() => setParam('category', c.slug)} className={cls} aria-pressed={active}>{inner}</button>
              )
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-2 pb-1 sm:gap-3 lg:justify-end min-[1360px]:flex-nowrap min-[1360px]:pb-0">
            <label className="relative flex min-h-[44px] basis-full items-center sm:basis-auto">
              <span className="sr-only">Search jewellery</span>
              <IconSearch size={16} className="pointer-events-none absolute left-3 text-wine-900/50" />
              <input
                type="search"
                value={q}
                onChange={(e) => setParam('q', e.target.value)}
                placeholder="Search"
                className="h-11 w-full border border-wine-900/15 bg-transparent pl-9 pr-3 text-[15px] placeholder:text-wine-900/45 focus:border-wine-700 focus:outline-none sm:w-40 xl:w-44"
              />
            </label>
            <div className="flex items-center gap-1.5" role="group" aria-label="Filter by finish">
              {FINISHES.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={finish === f}
                  aria-label={f}
                  title={f}
                  onClick={() => setParam('finish', finish === f ? '' : f)}
                  className={`inline-flex h-11 min-w-[44px] items-center justify-center gap-2 border px-3 text-[12px] font-semibold transition-colors ${finish === f ? 'border-wine-900 bg-wine-900 text-ivory' : 'border-wine-900/15 hover:border-wine-900/40'}`}
                >
                  <FinishDot finish={f} />
                  <span className="hidden sm:inline min-[1360px]:hidden">{f}</span>
                </button>
              ))}
            </div>
            <label className="relative">
              <span className="sr-only">Sort products</span>
              <select
                value={sort}
                onChange={(e) => setParam('sort', e.target.value)}
                className="h-11 cursor-pointer appearance-none font-semibold border border-wine-900/15 bg-transparent pl-3 pr-9 text-[14px] focus:border-wine-700 focus:outline-none"
              >
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <IconChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
            </label>
          </div>
        </div>
      </div>

      <section className="bg-ivory pb-12 pt-6">
        <div className="container-hero">
          <div className="mb-8 flex flex-wrap items-center gap-3 text-[15px] font-semibold text-wine-900/75" aria-live="polite">
            <span className="num">{filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}</span>
            {(finish || q) && (
              <>
                {finish && <Chip onClear={() => setParam('finish', '')}>{finish}</Chip>}
                {q && <Chip onClear={() => setParam('q', '')}>“{q}”</Chip>}
              </>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={`${category}-${finish}-${sort}-${q}-${current}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {visible.length ? (
                <Stagger className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
                  {visible.map((p, i) => <ProductCard key={p.slug} product={p} priority={i < 4} />)}
                </Stagger>
              ) : (
                <div className="py-24 text-center">
                  <p className="font-display text-[31px]">Nothing matches just yet.</p>
                  <p className="mt-2 text-wine-900/65">Try a different finish or clear your search.</p>
                  <Link to="/shop" className="btn btn-outline-dark mt-8">View all jewellery</Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setParam('page', String(n))}
                  aria-current={n === current ? 'page' : undefined}
                  aria-label={`Page ${n}`}
                  className={`h-11 w-11 font-display text-[19px] transition-colors ${n === current ? 'bg-wine-900 text-ivory' : 'border border-wine-900/15 hover:border-wine-900'}`}
                >
                  {n}
                </button>
              ))}
            </nav>
          )}

          <p className="mt-10 text-center text-[12px] text-wine-900/45">Mockup preview - prices and photography are placeholders pending client approval.</p>
        </div>
      </section>
    </>
  )
}

function Chip({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 border border-wine-900/15 py-1 pl-3 pr-1">
      {children}
      <button type="button" onClick={onClear} className="inline-flex h-7 w-7 items-center justify-center" aria-label={`Clear ${children}`}>
        <IconClose size={12} />
      </button>
    </span>
  )
}
