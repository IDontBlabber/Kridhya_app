import { Link } from 'react-router-dom'
import { COLLECTIONS as CATEGORIES, byCategory } from '../data/products'
import { IconArrow } from '../components/Icons'
import { FadeUp } from '../components/motion'
import useDocumentMeta from '../hooks/useDocumentMeta'

// Category names live in data/products.js (CATEGORIES) - one place to rename them.
export default function Collections() {
  useDocumentMeta('Collections | Kridhya by Devanshi Agarwal', 'Explore Kridhya jewellery by category - pendants, earrings, bracelets, rings, necklaces and brooches.')
  return (
    <>
      {/* hero: banner image behind the heading only - the category index sits below it, on its own ground */}
      <section className="grain relative isolate overflow-hidden bg-wine-950 text-ivory">
        <img
          src="/images/hero/hero-everyday-gold-1920.webp"
          srcSet="/images/hero/hero-everyday-gold-1080.webp 1080w, /images/hero/hero-everyday-gold-1920.webp 1920w, /images/hero/hero-everyday-gold-3840.webp 3840w"
          sizes="100vw"
          alt=""
          data-placeholder="true"
          fetchpriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[60%_40%]"
        />
        <div className="absolute inset-0 -z-10 bg-wine-950/45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-wine-950/85 via-wine-950/35 to-wine-950/55" />
        <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-wine-950/80 to-transparent" />

        <div className="container-hero pb-14 pt-36 sm:pb-16 lg:min-h-[52svh] lg:pb-20 lg:pt-48">
          <p className="eyebrow font-semibold text-gold">Collections</p>
          <h1 className="h-display mt-4 max-w-xl font-medium">Explore by category</h1>
          <p className="mt-5 max-w-md text-[15px] font-medium leading-relaxed text-ivory/85">
            Every piece, organised the way you shop - choose a category to see the full archive.
          </p>
          <Link to="/shop" className="btn btn-gold mt-8 font-semibold">Shop all jewellery <IconArrow size={14} /></Link>
        </div>
      </section>

      {/* category index - below the hero, on the page ground */}
      <section className="section bg-ivory" aria-labelledby="category-index">
        <div className="container-site">
          <h2 id="category-index" className="sr-only">Categories</h2>
          <nav aria-label="Categories">
            <ol className="border-t border-wine-900/20">
              {CATEGORIES.map((c, i) => (
                <li key={c.slug} className="border-b border-wine-900/20">
                  <FadeUp delay={i * 0.04}>
                    <Link to={`/collections/${c.slug}`} className="group flex min-h-[72px] items-center gap-4 py-4 transition-colors hover:text-wine-600 sm:gap-6">
                      <span className="num w-8 text-[12px] text-gold-deep">0{i + 1}</span>
                      <span className="flex-1 font-collection text-[clamp(calc(1.3rem_-_1px),calc(2.6vw_-_1px),calc(2rem_-_1px))] font-medium leading-none tracking-[0.06em]">{c.name}</span>
                      <span className="num text-[12px] font-semibold uppercase tracking-[0.16em] text-wine-900/65">{byCategory(c.slug).length} pieces</span>
                      <IconArrow size={16} className="text-gold-deep transition-transform duration-500 group-hover:translate-x-1" />
                    </Link>
                  </FadeUp>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      {/* category tiles */}
      <section className="section bg-cream">
        <div className="container-site grid grid-cols-2 gap-4 lg:grid-cols-6 lg:gap-5">
          {CATEGORIES.map((c, i) => (
            <div key={c.slug} className="lg:col-span-2">
              <Link to={`/collections/${c.slug}`} className="group block" aria-label={`View ${c.name}`}>
                <div className="overflow-hidden border border-gold/40 bg-cream p-1.5" style={{ aspectRatio: '4/3' }}>
                  <img src={c.cover} alt={`${c.name} by Kridhya`} loading="lazy" data-placeholder="true" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
                {/* phones/tablets: name, blurb and count stack so nothing overflows a narrow column; side by side from md */}
                <div className="mt-2.5 md:mt-3 md:flex md:items-start md:justify-between md:gap-3">
                  <div className="min-w-0">
                    <h2 className="font-collection text-[16px] font-semibold leading-tight tracking-[0.06em] sm:text-[19px] md:text-[21px] md:tracking-[0.08em]">{c.name}</h2>
                    <p className="mt-1 max-w-xs text-[13px] font-medium leading-snug text-wine-900/70 sm:text-[14px] md:text-[15px] md:leading-normal">{c.blurb}</p>
                  </div>
                  <span className="num mt-2 inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep md:mt-0 md:pt-1.5 md:text-[12px] md:tracking-[0.16em]">
                    {byCategory(c.slug).length} pieces <IconArrow size={13} />
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
