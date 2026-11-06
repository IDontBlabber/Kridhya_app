import { Link } from 'react-router-dom'
import { AlertTriangle, BookOpen, Boxes, Gem, IndianRupee, Megaphone, PackageX, Plus } from 'lucide-react'
import { popupStatus } from './PopupPage'
import { CATEGORIES, VARIANTS, stockOf, stockState, useAdmin } from '../store'
import { formatPrice } from '../../data/site'
import { Button, Card, Empty, PageHeader, Pill, StatusPill, StockPill } from '../ui'

export default function Dashboard() {
  const { data } = useAdmin()
  const { products, posts } = data
  const live = products.filter((p) => p.status === 'published')
  const low = products.filter((p) => stockState(p) === 'low')
  const out = products.filter((p) => stockState(p) === 'out')
  const units = products.reduce((n, p) => n + stockOf(p), 0)
  const value = products.reduce((n, p) => n + stockOf(p) * (Number(p.price) || 0), 0)
  const alerts = [...out, ...low].slice(0, 8)
  const byCat = CATEGORIES.map((c) => ({ ...c, n: products.filter((p) => p.category === c.slug).length, units: products.filter((p) => p.category === c.slug).reduce((n, p) => n + stockOf(p), 0) }))
  const maxCat = Math.max(1, ...byCat.map((c) => c.n))
  const byVariant = VARIANTS.map((v) => ({ v, units: products.reduce((n, p) => n + (p.variants[v]?.enabled ? Number(p.variants[v].stock) || 0 : 0), 0) }))
  const recentPosts = [...posts].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4)
  const recentProducts = [...products].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)

  return (
    <div className="space-y-6">
      <PageHeader title="Welcome back" subtitle="Kridhya by Devanshi Agarwal · an overview of your catalogue, stock and journal.">
        <Link to="/admin/journal/new"><Button variant="ghost"><Plus size={15} /> New post</Button></Link>
        <Link to="/admin/products/new"><Button><Plus size={15} /> New product</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi icon={Gem} label="Products" value={products.length} note={`${live.length} published · ${products.length - live.length} draft`} />
        <Kpi icon={Boxes} label="Units in stock" value={units.toLocaleString('en-IN')} note={`across ${VARIANTS.length} finishes`} />
        <Kpi icon={IndianRupee} label="Stock value" value={formatPrice(value)} note="at listed prices" />
        <Kpi icon={AlertTriangle} label="Needs attention" value={low.length + out.length} note={`${out.length} out · ${low.length} low`} tone={low.length + out.length ? 'warn' : 'ok'} />
      </div>

      {/* festival pop-up at a glance */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        {data.popup?.image ? <img src={data.popup.image} alt="" className="h-20 w-full rounded-md bg-wine-950 object-cover sm:w-36" /> : <span className="flex h-20 w-36 items-center justify-center rounded-md bg-wine-900/5 text-wine-900/40"><Megaphone size={22} /></span>}
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-wine-900/55">Pop-up banner</p>
          <p className="mt-0.5 truncate text-[16px] font-semibold">{data.popup?.name || 'Not set'}</p>
          <p className="mt-1"><Pill tone={popupStatus(data.popup || {})[1]}>{popupStatus(data.popup || {})[0]}</Pill></p>
        </div>
        <Link to="/admin/popup"><Button variant="ghost">Change banner</Button></Link>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-wine-900/10 px-5 py-4">
            <h2 className="text-[15px] font-semibold">Stock alerts</h2>
            <Link to="/admin/products?stock=attention" className="text-[13px] font-semibold text-wine-700 hover:underline">View all</Link>
          </div>
          {alerts.length ? (
            <ul className="divide-y divide-wine-900/10">
              {alerts.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-wine-900/[0.03]">
                    <img src={p.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-md bg-cream object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{p.name}</p>
                      <p className="truncate text-[12.5px] text-wine-900/55">
                        {VARIANTS.filter((v) => p.variants[v]?.enabled).map((v) => `${v}: ${p.variants[v].stock}`).join(' · ')}
                      </p>
                    </div>
                    <StockPill state={stockState(p)} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={Boxes} title="Everything is well stocked" body="Products running low will appear here." />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold">Products by category</h2>
          <ul className="mt-4 space-y-3">
            {byCat.map((c) => (
              <li key={c.slug}>
                <div className="flex justify-between text-[13px]">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-wine-900/55">{c.n} · {c.units} units</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-wine-900/[0.07]">
                  <div className="h-full rounded-full bg-wine-700" style={{ width: `${(c.n / maxCat) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-[13px] font-semibold text-wine-900/70">Units by finish</h3>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {byVariant.map(({ v, units: u }) => (
              <div key={v} className="rounded-lg bg-wine-900/[0.04] p-2.5 text-center">
                <p className="text-[17px] font-semibold">{u}</p>
                <p className="text-[11.5px] text-wine-900/55">{v}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-wine-900/10 px-5 py-4">
            <h2 className="text-[15px] font-semibold">Recently updated products</h2>
            <Link to="/admin/products" className="text-[13px] font-semibold text-wine-700 hover:underline">All products</Link>
          </div>
          <ul className="divide-y divide-wine-900/10">
            {recentProducts.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-wine-900/[0.03]">
                  <img src={p.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-md bg-cream object-cover" />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{p.name || 'Untitled product'}</span>
                  <span className="num text-[13px] text-wine-900/65">{formatPrice(Number(p.price) || 0)}</span>
                  <StatusPill status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex items-center justify-between border-b border-wine-900/10 px-5 py-4">
            <h2 className="text-[15px] font-semibold">Journal</h2>
            <Link to="/admin/journal" className="text-[13px] font-semibold text-wine-700 hover:underline">All posts</Link>
          </div>
          {recentPosts.length ? (
            <ul className="divide-y divide-wine-900/10">
              {recentPosts.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/journal/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-wine-900/[0.03]">
                    <img src={p.cover || '/images/generated/satin-beige.webp'} alt="" className="h-10 w-14 shrink-0 rounded-md bg-cream object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{p.title || 'Untitled post'}</p>
                      <p className="text-[12px] text-wine-900/50">{p.category} · {p.date}</p>
                    </div>
                    <StatusPill status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon={BookOpen} title="No posts yet" action={<Link to="/admin/journal/new"><Button size="sm"><Plus size={14} /> Write a post</Button></Link>} />
          )}
        </Card>
      </div>

      {out.length > 0 && (
        <p className="flex items-center gap-2 text-[13px] text-wine-900/60"><PackageX size={15} /> Out-of-stock products stay on the site marked <Pill tone="bad">Sold out</Pill> - set them to Draft to hide them.</p>
      )}
    </div>
  )
}

function Kpi({ icon: I, label, value, note, tone }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-wine-900/55">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone === 'warn' ? 'bg-[#fbf0d9] text-[#8a5a00]' : 'bg-gold/15 text-gold-deep'}`}><I size={16} /></span>
      </div>
      <p className="num mt-2 text-[24px] font-semibold leading-none sm:text-[28px]">{value}</p>
      <p className="mt-1.5 text-[12.5px] text-wine-900/55">{note}</p>
    </Card>
  )
}
