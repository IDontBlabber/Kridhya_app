import { Link } from 'react-router-dom'
import { HeroIndex, PageHero } from '../components/ui'
import { ExpandFrame, FadeUp, ParallaxImage, ParallaxLayer } from '../components/motion'
import { IMG } from '../data/images'
import { IconArrow } from '../components/Icons'
import useDocumentMeta from '../hooks/useDocumentMeta'

// EDITORIAL TEMPLATE - replace the paragraphs below with the client's existing "Our Story" copy.
// Keep the meaning unchanged; do not add brand history or craftsmanship claims that aren't approved.
export default function Story() {
  useDocumentMeta('Our Story | Kridhya by Devanshi Agarwal', 'The story behind Kridhya by Devanshi Agarwal - jewellery for the moments that matter.')
  return (
    <>
      <PageHero
        eyebrow="Our Story"
        title="Small details, lasting meaning."
        intro="How a simple belief - that jewellery can carry the moments we want to keep close - became Kridhya."
        image={IMG.womanWearing.src}
        imageAlt={IMG.womanWearing.alt}
        position="62% 28%"
        square
      >
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <a href="#beginning" className="btn btn-gold font-semibold">Read our story</a>
          <Link to="/about#founder" className="btn btn-outline-light font-semibold">Meet the founder</Link>
        </div>
        <HeroIndex
          items={[
            { label: 'I · The beginning', href: '#beginning' },
            { label: 'II · The design', href: '#design' },
            { label: 'III · Your story', href: '#your-story' },
          ]}
        />
      </PageHero>

      <Chapter
        id="beginning"
        n="I"
        label="The beginning"
        title="Kridhya began with a simple belief"
        img={IMG.storyStill}
        paras={[
          'That jewellery can carry the moments we want to keep close. What we wear says something about who we are - and the pieces we return to most often are the ones that remind us of a person, a place or a feeling.',
          'Our pieces are made to move easily between the everyday and the occasion, to be layered, gifted and worn for years.',
        ]}
      />

      <ExpandFrame src={IMG.heroBanner.src} alt={IMG.heroBanner.alt} placeholder className="bg-wine-950 text-ivory">
        <div className="container-site flex min-h-[52svh] items-center py-10">
          <FadeUp as="blockquote" className="max-w-md font-display text-[clamp(calc(1.75rem_+_1px),calc(3.2vw_+_1px),calc(2.6rem_+_1px))] italic leading-tight">
            “Jewellery is more than something we wear.”
          </FadeUp>
        </div>
      </ExpandFrame>

      <Chapter
        id="design"
        n="II"
        label="The design"
        title="Guided by symbols that last"
        img={IMG.designSketch}
        flip
        paras={[
          'From the endless line of the infinity loop to the quiet bloom of the lotus, our designs draw on shapes that feel timeless - simple enough to wear daily, meaningful enough to mark a milestone.',
          'Each silhouette is refined for balance and comfort, so it feels as natural on the hundredth wear as on the first.',
        ]}
      />

      <section id="your-story" className="section grain relative scroll-mt-6 bg-wine-900 text-ivory">
        <div className="container-site grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <ParallaxImage src={IMG.modelPortrait.src} alt={IMG.modelPortrait.alt} placeholder ratio="4/5" strength={8} />
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <FadeUp as="p" className="eyebrow text-gold">III · Your story</FadeUp>
            <FadeUp as="h2" delay={0.05} className="h-section mt-3">Made to be part of your story</FadeUp>
            <FadeUp as="p" delay={0.1} className="mt-4 max-w-[54ch] text-[15px] leading-[1.8] text-ivory/75">
              Whether it’s a gift chosen for someone you love, or a piece you choose for yourself, we hope Kridhya becomes part of the moments you remember.
            </FadeUp>
            <FadeUp delay={0.15} className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link to="/shop" className="btn btn-gold">Explore the collection <IconArrow size={14} /></Link>
              <Link to="/about" className="btn btn-outline-light">About Kridhya</Link>
            </FadeUp>
          </div>
        </div>
      </section>
    </>
  )
}

function Chapter({ id, n, label, title, paras, img, flip = false }) {
  return (
    <section id={id} className="section scroll-mt-6 bg-ivory">
      <article className="container-site grid items-center gap-10 md:grid-cols-12">
        <div className={`md:col-span-6 ${flip ? 'md:order-2 md:col-start-7' : ''}`}>
          <FadeUp as="p" className="eyebrow text-gold-deep">{n} · {label}</FadeUp>
          <FadeUp as="h2" delay={0.05} className="h-section mt-3">{title}</FadeUp>
          {paras.map((p, i) => (
            <FadeUp key={i} as="p" delay={0.1 + i * 0.05} className="mt-4 max-w-[58ch] text-[15px] leading-[1.8] text-wine-900/75">{p}</FadeUp>
          ))}
        </div>
        <ParallaxLayer distance={30} className={`md:col-span-5 ${flip ? 'md:order-1' : 'md:col-start-8'}`}>
          <ParallaxImage src={img.src} alt={img.alt} placeholder ratio="4/5" strength={8} />
        </ParallaxLayer>
      </article>
    </section>
  )
}
