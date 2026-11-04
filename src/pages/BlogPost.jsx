import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Breadcrumbs, Ornament, ProductCard } from '../components/ui'
import { EASE, FadeUp, Stagger } from '../components/motion'
import { POSTS, getPost } from '../data/blog'
import { srcSetFor } from '../data/images'
import { PRODUCTS } from '../data/products'
import { PostCard, fmtDate } from './Blog'
import useDocumentMeta from '../hooks/useDocumentMeta'
import NotFound from './NotFound'

export default function BlogPost() {
  const { slug } = useParams()
  const post = getPost(slug)
  if (!post) return <NotFound />
  return <Article key={slug} post={post} />
}

function Article({ post }) {
  useDocumentMeta(post.seo.title, post.seo.description)
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['0%', '20%'])
  const { scrollYProgress: read } = useScroll()
  const others = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3)
  const shop = PRODUCTS.filter((p) => p.badge).slice(0, 4)

  return (
    <>
      <article>
        <header className="bg-ivory pt-28 sm:pt-32">
          <div className="container-site max-w-4xl text-center">
            <div className="flex justify-center"><Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Journal', to: '/blog' }, { label: post.category }]} /></div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }} className="h-display mt-5">
              {post.title}
            </motion.h1>
            <p className="mt-6 text-[13px] uppercase tracking-[0.18em] text-wine-900/55">
              <time dateTime={post.date}>{fmtDate(post.date)}</time> · {post.readTime}
            </p>
          </div>
          <figure ref={ref} className="container-site mt-10">
            <div className="relative aspect-[21/9] overflow-hidden bg-cream">
              <motion.img style={{ y, scale: 1.15 }} src={post.cover} srcSet={srcSetFor(post.cover)} sizes="100vw" alt={post.coverAlt} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </figure>
        </header>

        <div className="bg-ivory py-8 sm:py-10">
          <div className="container-site relative grid gap-10 lg:grid-cols-12">
            {/* reading progress */}
            <aside className="hidden lg:col-span-2 lg:block">
              <div className="sticky top-32 h-40 w-px bg-wine-900/10">
                <motion.span style={{ scaleY: read }} className="absolute inset-0 origin-top bg-gold" />
              </div>
            </aside>
            <div className="mx-auto w-full max-w-[62ch] lg:col-span-8">
              <FadeUp as="p" className="border-l-2 border-gold/60 pl-5 font-display text-[clamp(calc(1.3rem_-_1px),calc(2vw_-_1px),calc(1.6rem_-_1px))] font-light italic leading-snug text-wine-700">{post.excerpt}</FadeUp>
              <div className="mt-8 space-y-5 text-[13px] leading-[1.8] text-wine-900/80">
                {post.body.map((b, i) => {
                  if (b.h2) return <h2 key={i} className="!mt-9 text-[clamp(calc(1.5rem_-_4px),calc(2.4vw_-_4px),calc(1.9rem_-_4px))] leading-tight text-wine-900">{b.h2}</h2>
                  if (b.h3) return <h3 key={i} className="!mt-8 font-display text-[23px] text-wine-900">{b.h3}</h3>
                  if (b.img)
                    return (
                      <figure key={i} className="!my-8">
                        <img src={b.img} srcSet={srcSetFor(b.img)} sizes="(min-width: 768px) 680px, 100vw" alt={b.caption} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                        <figcaption className="mt-3 text-center text-[13px] italic text-wine-900/55">{b.caption}</figcaption>
                      </figure>
                    )
                  return <p key={i}>{b.p}</p>
                })}
              </div>
              <div className="mt-8 border-t border-wine-900/10 pt-5 text-[13px] text-wine-900/70">
                Looking for the right piece? <Link to="/shop" className="link-underline text-wine-700">Explore the collection</Link> or read about <Link to="/corporate-gifting" className="link-underline text-wine-700">corporate gifting</Link>.
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className="section bg-cream">
        <div className="container-site">
          <Ornament className="mb-10" />
          <h2 className="h-section text-center">Shop the story</h2>
          <Stagger className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-4 lg:gap-x-5">
            {shop.map((p) => <ProductCard key={p.slug} product={p} />)}
          </Stagger>
        </div>
      </section>

      <section className="section bg-ivory">
        <div className="container-site">
          <h2 className="h-section">More from the Journal</h2>
          <Stagger className="mt-8 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((p) => <PostCard key={p.slug} post={p} />)}
          </Stagger>
        </div>
      </section>
    </>
  )
}
