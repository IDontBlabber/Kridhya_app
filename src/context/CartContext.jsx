import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { loadCart, saveCart } from '../lib/auth'

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

  const add = useCallback((product, finish, qty = 1) => {
    setItems((prev) => {
      const id = `${product.slug}:${finish}`
      const found = prev.find((i) => i.id === id)
      if (found) return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
      return [...prev, { id, slug: product.slug, name: product.name, price: product.price, image: product.images[0], finish, qty }]
    })
    setOpen(true)
  }, [])

  const update = useCallback((id, qty) => {
    setItems((prev) => (qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i))))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0)
    const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0)
    return { items, count, subtotal, open, setOpen, add, update, clear }
  }, [items, open, add, update, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
