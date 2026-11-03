import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Breadcrumbs } from '../components/ui'
import { EASE, Stagger, blurChild } from '../components/motion'
import { POSTS } from '../data/blog'
import { srcSetFor } from '../data/images'
import { IconArrow, IconSearch } from '../components/Icons'
import useDocumentMeta from '../hooks/useDocumentMeta'

export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Blog() {
  useDocumentMeta('The Journal | Kridhya by Devanshi Agarwal', 'Styling notes, jewellery care and gifting ideas from Kridhya by Devanshi Agarwal.')
  const cats = ['All', ...new Set(POSTS.map((p) => p.category))]
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const byCat = cat === 'All' ? POSTS : POSTS.filter((p) => p.category === cat)
  const list = term ? byCat.filter((p) => `${p.title} ${p.excerpt} ${p.category}`.toLowerCase().includes(term)) : byCat
  const [featured, ...rest] = list

  return (
    <>
      <section className="bg-ivory pb-8 pt-32 sm:pt-36">
        <div className="container-hero">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Journal' }]} />
          <motion.h1 initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1, ease: EASE }} className="h-display mt-5">
            The Journal
          </motion.h1>
          <div className="mt-6 flex flex-col gap-3 border-b border-wine-900/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Journal categories">
              {cats.map((c) => (
                <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)} className={`relative min-h-[44px] shrink-0 px-4 text-[11px] uppercase tracking-[0.2em] ${cat === c ? 'text-wine-900' : 'text-wine-900/55 hover:text-wine-900'}`}>
                  {c}
                  {cat === c && <span className="absolute -bottom-4 left-0 right-0 h-px bg-wine-900" />}
                </button>
              ))}
            </div>
            <label className="relative flex min-h-[44px] w-full items-center sm:w-64">
              <span className="sr-only">Search the journal</span>
              <IconSearch size={16} className="pointer-events-none absolute left-3 text-wine-900/50" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search the journal"
                className="h-11 w-full border border-wine-900/15 bg-transparent pl-9 pr-3 text-[13px] placeholder:text-wine-900/45 focus:border-wine-700 focus:outline-none"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="bg-ivory pb-12">
        <div className="container-hero">
          <AnimatePresence mode="wait">
            <motion.div key={`${cat}-${term}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {!featured && (
                <p className="py-16 text-center text-[13px] text-wine-900/70" role="status">
                  No articles match “{q.trim()}”. Try another word or <button type="button" onClick={() => { setQ(''); setCat('All') }} className="font-semibold text-wine-800 underline decoration-gold-deep/60 underline-offset-4">clear the search</button>.
                </p>
              )}
              {featured && (
                <Link to={`/blog/${featured.slug}`} className="group grid items-center gap-6 md:grid-cols-12 lg:gap-10">
                  <div className="aspect-[3/2] overflow-hidden bg-cream md:col-span-7">
                    <img src={featured.cover} srcSet={srcSetFor(featured.cover)} sizes="(min-width: 768px) 60vw, 100vw" alt={featured.coverAlt} className="h-full w-full object-cover transition-transform duration-[1.6s] ease-luxe group-hover:scale-105" />
                  </div>
                  <div className="md:col-span-5">
                    <p className="eyebrow text-gold-deep">Featured · {featured.category}</p>
                    <h2 className="mt-4 text-[clamp(calc(1.6rem_-_3px),calc(2.8vw_-_3px),calc(2.3rem_-_3px))] leading-[1.1] transition-colors group-hover:text-wine-600">{featured.title}</h2>
                    <p className="mt-3 text-[13px] leading-relaxed text-wine-900/70">{featured.excerpt}</p>
                    <p className="mt-6 text-[13px] text-wine-900/55">{fmtDate(featured.date)} · {featured.readTime}</p>
                    <span className="mt-8 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-wine-800">
                      <span className="link-underline">Read more</span> <IconArrow size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              )}
              {rest.length > 0 && (
                <Stagger className="mt-10 grid gap-x-5 gap-y-10 border-t border-wine-900/10 pt-8 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p) => <PostCard key={p.slug} post={p} />)}
                </Stagger>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  )
}

export function PostCard({ post }) {
  return (
    <motion.article variants={blurChild} className="group">
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="aspect-[3/2] overflow-hidden bg-cream">
          <img src={post.cover} srcSet={srcSetFor(post.cover)} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" alt={post.coverAlt} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.4s] ease-luxe group-hover:scale-105" />
        </div>
        <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-gold-deep">{post.category} · {post.readTime}</p>
        <h3 className="mt-1.5 font-display text-[19px] leading-snug transition-colors group-hover:text-wine-600">{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-[13px] text-wine-900/65">{post.excerpt}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-wine-800">
          <span className="link-underline">Read more</span> <IconArrow size={14} />
        </span>
      </Link>
    </motion.article>
  )
}