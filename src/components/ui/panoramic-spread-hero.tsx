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

// Adapted from 21st.dev "panoramic-spread-hero" for Kridhya: brand palette, local jewellery
// photography (placeholders until VK's final images), configurable copy, reduced-motion support.

export type PanoramicImage = { src: string; alt: string };

const DEFAULT_IMAGES: PanoramicImage[] = [
  { src: "/images/products/ashta-studa-14d0b223.webp", alt: "Ashta studs with peach pear stones" },
  { src: "/images/editorial/heart-necklace-gold-satin.webp", alt: "Gold infinity heart necklace" },
  { src: "/images/products/ananta-gulabi-914b1b68.webp", alt: "Ananta Gulabi infinity cuff" },
  { src: "/images/products/padmaraga-dbd399bc.webp", alt: "Padmaraga rose gold pendant" },
  { src: "/images/products/bindu-cuff-f7658393.webp", alt: "Bindu crossover ring" },
  { src: "/images/editorial/double-strand-rose-satin.webp", alt: "Rose gold double strand necklace" },
  { src: "/images/products/gulal-9fea571a.webp", alt: "Gulal magenta drop earrings" },
  { src: "/images/products/infinity-brooch-99dfbe5a.webp", alt: "Rose gold infinity brooch" },
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
const PROGRESS_SPRING = { stiffness: 80, damping: 25, mass: 0.5, restDelta: 0.001 };
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

  // S-curve easing
  const ease = useTransform(progress, (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2));

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
        className="pointer-events-auto rounded-[3px] shadow-2xl shadow-black/40 will-change-transform"
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
        <div className="group relative h-full w-full overflow-hidden rounded-[3px] bg-ivory p-1.5 pb-5 ring-1 ring-gold/20 max-md:p-1 max-md:pb-3">
          <div className="relative h-full w-full overflow-hidden rounded-[2px] bg-cream">
            <div className="pointer-events-none absolute inset-0 z-10 bg-wine-950/10 transition-colors duration-500 group-hover:bg-transparent" />
            <img
              src={item.src}
              alt={item.alt}
              draggable={false}
              loading="lazy"
              decoding="async"
              data-placeholder="true"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
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
  const smoothProgress = useSpring(scrollYProgress, PROGRESS_SPRING);
  // Reversed: the section opens fully spread (1); scrolling down gathers the cards into a closed stack (0),
  // scrolling back up opens them again.
  const scrubbed = useTransform(smoothProgress, [0.04, 0.82], [1, 0]);
  // Reduced motion: present the spread state with no scroll-driven movement.
  const still = useMotionValue(1);
  const progress = reduce ? still : scrubbed;

  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => setSpread(p > 0.95));
  const { tiltX, tiltY } = usePointerTilt(spread, !reduce);

  // Typography sits above the open arc and drifts down / fades as the cards close
  const textY = useTransform(progress, [0.45, 1], ["10vh", "-24vh"]);
  const textScale = useTransform(progress, [0.2, 1], [0.9, 1]);
  // heading is visible while the arc is open and fades before the stack forms
  const textOpacity = useTransform(progress, [0.62, 0.95], [0, 1]);

  return (
    <section ref={wrapRef} className={`relative w-full bg-wine-900 text-ivory ${reduce ? "h-[100svh]" : "h-[180vh] md:h-[220vh]"}`} aria-label="Collection preview">
      <div className="sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden" style={{ perspective: "1200px" }}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,164,106,0.14),transparent_60%)]" />

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
          <span className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.32em] text-gold">{eyebrow}</span>
          <h2 className="font-display text-[33px] font-light leading-none md:text-[3.4vw]">{title}</h2>
          <p className="mt-4 max-w-[46ch] text-[13px] leading-relaxed text-ivory/70 md:text-[13px]">{description}</p>
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
