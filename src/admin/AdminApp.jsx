import { useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BookOpen, Database, ExternalLink, Gem, LayoutDashboard, LogOut, Megaphone, Menu, ShoppingBag, X } from 'lucide-react'
import Logo, { BRAND } from '../components/Logo'
import Mandala from '../components/Mandala'
import Login from './Login'
import { getSession, signOut } from './auth'
import { AdminStoreProvider, hasBackend as backend, useAdmin } from './store'
import { cx } from './ui'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductEditor from './pages/ProductEditor'
import Posts from './pages/Posts'
import PostEditor from './pages/PostEditor'
import DataPage from './pages/DataPage'
import PopupPage from './pages/PopupPage'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products', icon: Gem },
  { to: '/admin/journal', label: 'Journal', icon: BookOpen },
  { to: '/admin/popup', label: 'Pop-up banner', icon: Megaphone },
  { to: '/admin/data', label: 'Data & backup', icon: Database },
]

export default function AdminApp() {
  useEffect(() => {
    const prev = document.title
    document.title = 'Admin | Kridhya by Devanshi Agarwal'
    return () => { document.title = prev }
  }, [])
  const [session, setSession] = useState(undefined) // undefined = still checking
  useEffect(() => { getSession().then((s) => setSession(s || null)) }, [])
  if (session === undefined) return <p className="p-10 text-center font-sans text-[14px] text-wine-900/60">Checking your session…</p>
  if (!session) return <Login onSignedIn={setSession} />
  return (
    <AdminStoreProvider>
      <Shell user={session.user} onSignOut={() => signOut().finally(() => setSession(null))} />
    </AdminStoreProvider>
  )
}

function Shell({ user, onSignOut }) {
  const { data, saving, loadError, reload } = useAdmin()
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setMenu(false), [pathname])

  return (
    <div className="min-h-screen bg-ivory font-sans text-wine-900 lg:grid lg:grid-cols-[248px_1fr]">
      {/* sidebar */}
      <aside className={cx('grain isolate overflow-hidden fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-wine-950 text-ivory transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0', menu ? 'translate-x-0' : '-translate-x-full')}>
        <Mandala className="pointer-events-none absolute -bottom-40 -left-40 -z-10 h-[420px] w-[420px] text-gold/[0.10]" />
        <div className="flex h-[72px] items-center justify-between border-b border-gold/15 px-5">
          <Link to="/admin" aria-label="Kridhya admin - dashboard" className="text-ivory"><Logo /></Link>
          <button type="button" className="rounded p-1 hover:bg-ivory/10 lg:hidden" onClick={() => setMenu(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <p className="px-6 pt-5 text-[10.5px] font-semibold uppercase tracking-[0.26em] text-gold/80">Admin portal</p>
        <nav aria-label="Admin" className="flex-1 space-y-1 px-3 py-3">
          {NAV.map(({ to, label, icon: I, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('flex h-11 items-center gap-3 px-3 text-[11.5px] font-semibold uppercase tracking-[0.16em] transition-colors', isActive ? 'border-l-2 border-gold bg-ivory/[0.07] text-gold-light' : 'border-l-2 border-transparent text-ivory/70 hover:bg-ivory/[0.04] hover:text-ivory')}>
              <I size={17} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 border-t border-ivory/10 p-4">
          <Link to="/" className="flex items-center gap-2 text-[13px] text-ivory/70 hover:text-gold-light"><ExternalLink size={14} /> View website</Link>
          <button type="button" onClick={onSignOut} className="flex items-center gap-2 text-[13px] text-ivory/70 hover:text-gold-light"><LogOut size={14} /> Sign out</button>
          <p className=" bg-ivory/5 p-3 text-[11.5px] leading-relaxed text-ivory/55">
            {backend ? (<><span className="font-semibold text-gold-light">Live store.</span> Changes are published to the website for every visitor.</>) : (<><span className="font-semibold text-gold-light">Preview mode.</span> Changes are saved in this browser only. Connect Supabase to publish for every visitor.</>)}
          </p>
        </div>
      </aside>
      {menu && <div className="fixed inset-0 z-40 bg-wine-950/50 lg:hidden" onClick={() => setMenu(false)} />}

      {/* main */}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-gold/30 bg-ivory/90 px-4 backdrop-blur sm:px-8">
          <button type="button" className="-ml-1 rounded p-2 hover:bg-wine-900/5 lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu size={20} /></button>
          <p className="hidden leading-tight sm:block">
            <span className="block font-display text-[16px] text-wine-900">{BRAND.name}</span>
            <span className="block text-[12px] text-wine-900/50">{BRAND.tagline}</span>
          </p>
          <span className="lg:hidden sm:hidden text-wine-900"><Logo compact /></span>
          <div className="ml-auto flex items-center gap-4">
            <SaveState state={saving} />
            <span className="hidden h-8 items-center gap-2 rounded-full bg-wine-900/[0.06] pl-1 pr-3 text-[12.5px] font-semibold md:inline-flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wine-800 text-[11px] uppercase text-ivory">{user[0]}</span> {user}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8 sm:py-8">
          {!data ? (
            loadError ? (
              <div className="mx-auto max-w-md py-20 text-center">
                <p className="text-[15px] font-semibold text-wine-900">Could not reach the database</p>
                <p className="mt-1 text-[13.5px] text-wine-900/60">{loadError}</p>
                <button type="button" onClick={reload} className="btn btn-wine mt-5">Try again</button>
              </div>
            ) : (
              <p className="py-20 text-center text-[14px] text-wine-900/55">Loading catalogue…</p>
            )
          ) : (
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ProductEditor />} />
              <Route path="products/:id" element={<ProductEditor />} />
              <Route path="journal" element={<Posts />} />
              <Route path="journal/new" element={<PostEditor />} />
              <Route path="journal/:id" element={<PostEditor />} />
              <Route path="popup" element={<PopupPage />} />
              <Route path="data" element={<DataPage />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  )
}

function SaveState({ state }) {
  const map = {
    idle: ['bg-wine-900/25', 'All changes saved'],
    saved: ['bg-[#2f8a52]', 'All changes saved'],
    saving: ['bg-gold animate-pulse', 'Saving…'],
    error: ['bg-[#9b2335]', 'Could not save - storage full?'],
  }[state]
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-wine-900/65" role="status">
      <span className={cx('h-2 w-2 rounded-full', map[0])} /> {map[1]}
    </span>
  )
}
