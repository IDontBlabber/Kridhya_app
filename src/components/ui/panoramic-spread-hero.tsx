"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Mandala from "@/components/Mandala";

// Adapted from 21st.dev "panoramic-spread-hero" for Kridhya: brand palette, local jewellery
// photography (placeholders until VK's final images), configurable copy, reduced-motion support.

export type PanoramicImage = { src: string; alt: string; name?: string };

const DEFAULT_IMAGES: PanoramicImage[] = [
  { src: "/images/products/ashta-studa-14d0b223.webp", alt: "Ashta studs with peach pear stones", name: "Ashtā Studs" },
  { src: "/images/editorial/heart-necklace-gold-satin.webp", alt: "Gold infinity heart necklace", name: "Infinity Heart" },
  { src: "/images/products/ananta-gulabi-914b1b68.webp", alt: "Ananta Gulabi infinity cuff", name: "Ananta Gulābi" },
  { src: "/images/products/padmaraga-dbd399bc.webp", alt: "Padmaraga rose gold pendant", name: "Padmarāga" },
  { src: "/images/products/bindu-cuff-f7658393.webp", alt: "Bindu crossover ring", name: "Bindu Cuff" },
  { src: "/images/editorial/double-strand-rose-satin.webp", alt: "Rose gold double strand necklace", name: "Double Strand" },
  { src: "/images/products/gulal-9fea571a.webp", alt: "Gulal magenta drop earrings", name: "Gulāl" },
  { src: "/images/products/infinity-brooch-99dfbe5a.webp", alt: "Rose gold infinity brooch", name: "Infinity Brooch" },
];

type Pose = { x: number; y: number; rotateZ: number; rotateY: number; scale: number };
type Layout = { stacked: Pose; panoramic: Pose; size: { w: string; h: string; ml: string; mt: string } };
type Card = { item: PanoramicImage; z: number; desktop: Layout; mobile: Layout };

// Sweeping 3D arc around the centre point for both mobile and desktop
const generatePanoramicCards = (images: PanoramicImage[]): Card[] => {
  const centerIndex = (images.length - 1) / 2;
  return images.map((item, i) => {
    const offset = i - centerIndex;
    const absOffset = Math.abs(offset);
    return {
      item,
      z: Math.round(10 - absOffset),
      desktop: {
        // closed state: a neat, slightly fanned stack at the centre
        stacked: { x: offset * 1.8, y: offset * -1.2, rotateZ: offset * 3, rotateY: 0, scale: 1.3 },
        panoramic: { x: offset * 10.5, y: absOffset * 2.6, rotateZ: offset * 1.2, rotateY: offset * -11, scale: 1 - absOffset * 0.05 },
        size: { w: "15vw", h: "27vh", ml: "-7.5vw", mt: "-13.5vh" },
      },
      mobile: {
        stacked: { x: offset * 1.8, y: offset * -1.2, rotateZ: offset * 3.5, rotateY: 0, scale: 1.25 },
        // phones: wider, flatter arc so each piece reads (outer cards run off-screen, which fills the width)
        panoramic: { x: offset * 14, y: absOffset * 4.5, rotateZ: offset * 3, rotateY: offset * -6, scale: 1 - absOffset * 0.07 },
        size: { w: "30vw", h: "21vh", ml: "-15vw", mt: "-10.5vh" },
      },
    };
  });
};

// High damping, zero bounce - removes scroll jitter
const PARALLAX_SPRING = { stiffness: 50, damping: 25, mass: 0.5 };

function usePointerTilt(active: boolean, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const tiltX = useSpring(rawX, PARALLAX_SPRING);
  const tiltY = useSpring(rawY, PARALLAX_SPRING);

  useEffect(() => {
    if (!enabled || !active) {
      rawX.set(0);
      rawY.set(0);
      return;
    }
    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientY / window.innerHeight - 0.5) * -8);
      rawY.set((e.clientX / window.innerWidth - 0.5) * 8);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [active, enabled, rawX, rawY]);

  return { tiltX, tiltY };
}

function GalleryCard({ card, progress, isMobile }: { card: Card; progress: MotionValue<number>; isMobile: boolean }) {
  const { item, desktop, mobile, z } = card;
  const { stacked, panoramic, size } = isMobile ? mobile : desktop;

  const ease = progress;

  const xRaw = useTransform(ease, [0, 1], [stacked.x, panoramic.x]);
  const yRaw = useTransform(ease, [0, 1], [stacked.y, panoramic.y]);
  const x = useTransform(xRaw, (v) => `${v}vw`);
  const y = useTransform(yRaw, (v) => `${v}vh`);
  const rotateZ = useTransform(ease, [0, 1], [stacked.rotateZ, panoramic.rotateZ]);
  const rotateY = useTransform(ease, [0, 1], [stacked.rotateY, panoramic.rotateY]);
  const scale = useTransform(ease, [0, 1], [stacked.scale, panoramic.scale]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" style={{ zIndex: z }}>
      <motion.div
        className="pointer-events-auto rounded-[2px] shadow-[0_24px_48px_-20px_rgba(10,2,5,0.7)] will-change-transform [backface-visibility:hidden]"
        style={{
          width: size.w,
          height: size.h,
          marginLeft: size.ml,
          marginTop: size.mt,
          x,
          y,
          rotateZ,
          rotateY,
          scale,
          transformOrigin: "center center -50px",
        }}
      >
        <div className="relative flex h-full w-full flex-col rounded-[2px] bg-ivory p-1.5 pb-0 ring-1 ring-gold/30 max-md:p-1 max-md:pb-0">
          <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[1px] bg-cream">
            <img
              src={item.src}
              alt={item.alt}
              draggable={false}
              loading="eager"
              decoding="async"
              data-placeholder="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          {/* museum-label caption: classical capitals between two hairlines */}
          <div className="flex h-7 shrink-0 items-center justify-center gap-2 px-1 max-md:h-5 max-md:gap-1">
            <span className="h-px w-3 bg-gold/70 max-md:w-1.5" aria-hidden="true" />
            <span className="truncate font-collection text-[9.5px] font-medium uppercase tracking-[0.22em] text-wine-900 max-md:text-[7px] max-md:tracking-[0.14em]">{item.name}</span>
            <span className="h-px w-3 bg-gold/70 max-md:w-1.5" aria-hidden="true" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

type Props = {
  images?: PanoramicImage[];
  eyebrow?: string;
  title?: ReactNode;
  description?: string;
  children?: ReactNode;
};

export default function PanoramicSpreadHero({
  images = DEFAULT_IMAGES,
  eyebrow = "The Collection",
  title = "Unfolding, piece by piece.",
  description = "Pendants, earrings, bracelets and rings - designed for everyday elegance and the moments that matter.",
  children,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [cards] = useState(() => generatePanoramicCards(images));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  // The section opens as a closed stack (0); scrolling down fans the cards out into the panoramic arc (1).
  const scrubbed = useTransform(scrollYProgress, [0.02, 0.78], [0, 1]);
  // Reduced motion: present the spread state with no scroll-driven movement.
  const still = useMotionValue(1);
  const linear = reduce ? still : scrubbed;
  // S-curve easing, computed once and shared by every card
  const progress = useTransform(linear, (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2));

  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => setSpread(p > 0.95));
  const { tiltX, tiltY } = usePointerTilt(spread, !reduce);

  // Typography sits above the open arc and drifts down / fades as the cards close
  const textY = useTransform(linear, [0.45, 1], ["10vh", "-24vh"]);
  const textScale = useTransform(linear, [0.2, 1], [0.9, 1]);
  // heading is visible while the arc is open and fades before the stack forms
  // Edge mandalas fill the empty flanks beside the closed stack, then recede once the cards start to spread
  // closed stack: mandalas on the edges; as the arc opens they fade out and a single mandala rises behind the centre
  const mandalaOpacity = useTransform(linear, [0, 0.4], [1, 0]);
  const mandalaScale = useTransform(linear, [0, 1], [1, 1.12]);
  const centreOpacity = useTransform(linear, [0.3, 0.85], [0, 0.55]);
  const centreScale = useTransform(linear, [0.3, 1], [0.9, 1]);
  const textOpacity = useTransform(linear, [0.62, 0.95], [0, 1]);

  return (
    <section ref={wrapRef} className={`relative w-full bg-wine-900 text-ivory ${reduce ? "h-[100svh]" : "h-[180vh] md:h-[220vh]"}`} aria-label="Collection preview">
      <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden" style={{ perspective: "1200px" }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,164,106,0.14),transparent_60%)]" />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto h-[125vw] w-[125vw] will-change-transform md:h-[88vh] md:w-[88vh]"
          style={{ opacity: centreOpacity, scale: centreScale }}
        >
          <Mandala className="h-full w-full text-gold/30" strokeWidth={0.7} />
        </motion.div>
        {/* half-mandalas bleeding off the left and right edges fill the empty flanks beside the closed stack */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-[42vh] my-auto h-[84vh] w-[84vh] will-change-transform max-md:-left-[34vw] max-md:h-[68vw] max-md:w-[68vw]"
          style={{ opacity: mandalaOpacity, scale: mandalaScale }}
        >
          <Mandala className="h-full w-full text-gold/30" strokeWidth={0.7} />
        </motion.div>
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -right-[42vh] my-auto h-[84vh] w-[84vh] will-change-transform max-md:-right-[34vw] max-md:h-[68vw] max-md:w-[68vw]"
          style={{ opacity: mandalaOpacity, scale: mandalaScale }}
        >
          <Mandala className="h-full w-full text-gold/30" strokeWidth={0.7} />
        </motion.div>

        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
        >
          {cards.map((card, i) => (
            <GalleryCard key={i} card={card} progress={progress} isMobile={isMobile} />
          ))}
        </motion.div>

        <motion.div
          className="pointer-events-none absolute z-[5] flex flex-col items-center px-6 text-center"
          style={{ y: textY, scale: textScale, opacity: textOpacity }}
        >
          <span className="mb-3 font-sans text-[12px] font-medium uppercase tracking-[0.32em] text-gold">{eyebrow}</span>
          <h2 className="font-display text-[34px] font-light leading-none md:text-[calc(3.4vw-3px)]">{title}</h2>
          <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-ivory/70 md:text-[15px]">{description}</p>
        </motion.div>

        {children && (
          <motion.div className="absolute bottom-10 z-20" style={{ opacity: textOpacity }}>
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
