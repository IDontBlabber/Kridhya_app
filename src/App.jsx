import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'
import Lenis from 'lenis'
import Header from './components/Header'
import Footer from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'
import CartDrawer from './components/CartDrawer'
import { ScrollProgress, EASE } from './components/motion'
import { CartProvider } from './context/CartContext'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Collections from './pages/Collections'
import Product from './pages/Product'
import Gifting from './pages/Gifting'
import Story from './pages/Story'
import About from './pages/About'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import Checkout from './pages/Checkout'
import OrderConfirmed from './pages/OrderConfirmed'
import { Faq, JewelleryCare, ShippingReturns, Privacy, Terms } from './pages/Info'
import FontPicker from './components/FontPicker'
import { SHOW_FONT_PICKER } from './data/site'

let lenis

function useSmoothScroll() {
  const reduce = useReducedMotion()
  useEffect(() => {
    // Touch devices already have native momentum scrolling — skip the extra rAF loop there.
    if (reduce || window.matchMedia('(pointer: coarse)').matches) return
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    let id
    const raf = (t) => {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    }
    id = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      lenis = undefined
    }
  }, [reduce])
}

const scrollTop = () => (lenis ? lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0))

export default function App() {
  const location = useLocation()
  useSmoothScroll()

  return (
    <MotionConfig reducedMotion="user">
      <CartProvider>
        <a href="#main" className="sr-only z-[100] bg-gold px-4 py-3 text-wine-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <ScrollProgress />
        <Header />
        <AnimatePresence mode="wait" onExitComplete={scrollTop}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.6, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease: EASE } }}
          >
            <main id="main">
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/:slug" element={<Shop />} />
                <Route path="/product/:slug" element={<Product />} />
                <Route path="/corporate-gifting" element={<Gifting />} />
                <Route path="/our-story" element={<Story />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmed" element={<OrderConfirmed />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/jewellery-care" element={<JewelleryCare />} />
                <Route path="/shipping-returns" element={<ShippingReturns />} />
                <Route path="/privacy-policy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </motion.div>
        </AnimatePresence>
        <WhatsAppFloat />
        <CartDrawer />
        {SHOW_FONT_PICKER && <FontPicker />}
      </CartProvider>
    </MotionConfig>
  )
}
