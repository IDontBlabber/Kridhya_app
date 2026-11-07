import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { loadCart, saveCart } from '../lib/auth'
import { PRODUCTS } from '../data/products'
import { useCatalogueVersion } from '../lib/catalogue'

// Most pieces of one kind a single order can hold (also the cap when a product has no stock count).
export const MAX_PER_ITEM = 10
// Units available for a product + finish, from the live catalogue (stock is kept in the database).
export function stockFor(slug, finish) {
  const p = PRODUCTS.find((x) => x.slug === slug)
  if (!p || p.soldOut) return 0
  if (p.stock && finish in p.stock) return Math.max(0, Math.min(MAX_PER_ITEM, Number(p.stock[finish]) || 0))
  return MAX_PER_ITEM
}

const CartContext = createContext(null)
const KEY = 'kridhya-bag'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable - bag stays in memory */
    }
  }, [items])

  // Signed-in customers: the bag is saved to their account, so it's waiting on any device.
  // On sign-in the saved bag and this device's bag are merged (higher quantity wins), then every change is saved.
  const { user } = useAuth()
  const syncedFor = useRef(null)
  useEffect(() => {
    if (!user) { syncedFor.current = null; return }
    if (syncedFor.current === user.id) return
    let live = true
    loadCart(user.id)
      .then((saved) => {
        if (!live) return
        setItems((local) => {
          const byId = new Map(saved.map((i) => [i.id, i]))
          local.forEach((i) => byId.set(i.id, byId.has(i.id) ? { ...i, qty: Math.max(i.qty, byId.get(i.id).qty) } : i))
          return [...byId.values()]
        })
        syncedFor.current = user.id
      })
      .catch(() => { syncedFor.current = user.id })
    return () => { live = false }
  }, [user])
  useEffect(() => {
    if (!user || syncedFor.current !== user.id) return
    const t = setTimeout(() => saveCart(user.id, items).catch(() => {}), 600)
    return () => clearTimeout(t)
  }, [items, user])

  // short message shown in the bag when a quantity had to be limited
  const [notice, setNotice] = useState(null) // { id, text }

  // current bag, readable synchronously (state updaters run later)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const add = useCallback((product, finish, qty = 1) => {
    const id = `${product.slug}:${finish}`
    const max = stockFor(product.slug, finish)
    const have = itemsRef.current.find((i) => i.id === id)?.qty || 0
    const next = Math.min(have + qty, max)
    setNotice(
      max === 0 ? { id, text: `${product.name} (${finish}) is sold out.` }
        : have + qty > max ? { id, text: next === have ? `Only ${max} available in ${finish} - ${max === 1 ? 'it’s' : 'they’re all'} already in your bag.` : `Only ${max} available in ${finish} - we’ve added ${next - have}.` }
          : null,
    )
    if (next > have) {
      setItems((prev) => {
        const found = prev.find((i) => i.id === id)
        if (found) return prev.map((i) => (i.id === id ? { ...i, qty: Math.min(max, next) } : i))
        return [...prev, { id, slug: product.slug, name: product.name, price: product.price, image: product.images[0], finish, qty: next }]
      })
    }
    setOpen(true)
  }, [])

  const update = useCallback((id, qty) => {
    const item = itemsRef.current.find((i) => i.id === id)
    if (item && qty > 0) {
      const max = stockFor(item.slug, item.finish)
      if (qty > max) setNotice({ id, text: max ? `Only ${max} available in ${item.finish}.` : 'This piece is now sold out - please remove it.' })
    }
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, stockFor(i.slug, i.finish) || i.qty)) } : i)),
    )
  }, [])

  // stock can drop while a piece sits in the bag (another order, or the shop edits stock): reduce quantities to match
  const version = useCatalogueVersion()
  useEffect(() => {
    setItems((prev) => {
      let changed = false
      const next = prev.map((i) => {
        const max = stockFor(i.slug, i.finish)
        if (max > 0 && i.qty > max) {
          changed = true
          return { ...i, qty: max }
        }
        return i
      })
      return changed ? next : prev
    })
  }, [version])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0)
    const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0)
    // pieces that can't be bought as they are (sold out) - checkout waits until they're removed
    const problems = items.filter((i) => stockFor(i.slug, i.finish) === 0).map((i) => i.id)
    return { items, count, subtotal, open, setOpen, add, update, clear, notice, setNotice, problems, limitFor: (i) => stockFor(i.slug, i.finish) }
  }, [items, open, add, update, clear, notice])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
