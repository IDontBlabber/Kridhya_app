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
  const others = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3)
  const shop = PRODUCTS.filter((p) => p.badge && !p.soldOut).slice(0, 4)

  return (
    <>
      <article>
        <header className="bg-ivory pt-28 sm:pt-32">
          <div className="container-site max-w-4xl text-center">
            <div className="flex justify-center"><Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Journal', to: '/blog' }, { label: post.category }]} /></div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }} className="mx-auto mt-5 max-w-2xl font-display text-[clamp(1.65rem,3vw,2.35rem)] font-normal leading-[1.15]">
              {post.title}
            </motion.h1>
            <p className="mt-4 text-[12px] uppercase tracking-[0.18em] text-wine-900/55">
              <time dateTime={post.date}>{fmtDate(post.date)}</time> · {post.readTime}
            </p>
          </div>
          <figure ref={ref} className="container-site mt-8">
            <div className="relative mx-auto aspect-[16/9] max-w-3xl overflow-hidden bg-cream">
              <motion.img style={{ y, scale: 1.12 }} src={post.cover} srcSet={srcSetFor(post.cover)} sizes="(min-width: 800px) 768px, 100vw" alt={post.coverAlt} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </figure>
        </header>

        <div className="bg-ivory py-8 sm:py-10">
          <div className="container-site">
            <div className="mx-auto w-full max-w-3xl">
              <FadeUp as="p" className="font-display text-[clamp(1.15rem,1.6vw,1.35rem)] font-normal leading-relaxed text-wine-700">{post.excerpt}</FadeUp>
              <div className="mt-7 space-y-5 text-[15px] leading-[1.8] text-wine-900/80">
                {post.body.map((b, i) => {
                  if (b.h2) return <h2 key={i} className="!mt-9 font-display text-[clamp(1.25rem,1.9vw,1.5rem)] font-normal leading-snug text-wine-900">{b.h2}</h2>
                  if (b.h3) return <h3 key={i} className="!mt-8 font-display text-[19px] font-normal text-wine-900">{b.h3}</h3>
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
              <div className="mt-8 border-t border-wine-900/10 pt-5 text-[14px] text-wine-900/70">
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
