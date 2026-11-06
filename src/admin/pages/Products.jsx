import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Copy, Gem, Minus, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { CATEGORIES, VARIANTS, slugify, stockState, uid, useAdmin } from '../store'
import { formatPrice } from '../../data/site'
import { Button, Card, Confirm, Empty, Input, PageHeader, Pill, Select, StatusPill, StockPill, Toast } from '../ui'

export default function Products() {
  const { data, deleteProduct, saveProduct, setStock } = useAdmin()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [del, setDel] = useState(null)
  const [toast, setToast] = useState('')
  const cat = params.get('cat') || 'all'
  const stock = params.get('stock') || 'all'
  const status = params.get('status') || 'all'
  const setParam = (k, v) => setParams((p) => { const n = new URLSearchParams(p); v === 'all' ? n.delete(k) : n.set(k, v); return n }, { replace: true })

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return data.products.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false
      if (status !== 'all' && p.status !== status) return false
      const s = stockState(p)
      if (stock === 'attention' && s === 'ok') return false
      if (stock !== 'all' && stock !== 'attention' && s !== stock) return false
      return !t || `${p.name} ${p.short} ${p.ribbon}`.toLowerCase().includes(t)
    })
  }, [data.products, q, cat, stock, status])

  const duplicate = (p) => {
    const copy = { ...structuredClone(p), id: uid(), name: `${p.name} (copy)`, slug: `${slugify(p.name)}-copy-${uid().slice(0, 4)}`, status: 'draft' }
    saveProduct(copy)
    setToast('Duplicated as a draft')
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Products" subtitle={`${data.products.length} products in ${CATEGORIES.length} categories`}>
        <Link to="/admin/products/new"><Button><Plus size={15} /> Add product</Button></Link>
      </PageHeader>

      <Card className="p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_180px_170px_150px]">
          <label className="relative">
            <span className="sr-only">Search products</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-wine-900/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, description or ribbon" className="pl-9" />
          </label>
          <Select value={cat} onChange={(e) => setParam('cat', e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </Select>
          <Select value={stock} onChange={(e) => setParam('stock', e.target.value)} aria-label="Stock">
            <option value="all">Any stock level</option>
            <option value="attention">Needs attention</option>
            <option value="ok">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </Select>
          <Select value={status} onChange={(e) => setParam('status', e.target.value)} aria-label="Status">
            <option value="all">Any status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <Empty icon={Gem} title="No products match" body="Try a different search or filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13.5px]">
              <thead className="border-b border-wine-900/10 bg-wine-900/[0.03] text-[12px] font-semibold uppercase tracking-[0.06em] text-wine-900/55">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3 text-right">Price</th>
                  <th className="px-3 py-3">Stock by finish</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wine-900/10">
                {list.map((p) => (
                  <tr key={p.id} className="align-middle hover:bg-wine-900/[0.02]">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => nav(`/admin/products/${p.id}`)} className="flex items-center gap-3 text-left">
                        <img src={p.images[0] || '/images/generated/satin-beige.webp'} alt="" className="h-12 w-12 shrink-0 bg-cream object-cover" />
                        <span className="min-w-0">
                          <span className="block max-w-[220px] truncate font-semibold hover:underline">{p.name || 'Untitled product'}</span>
                          <span className="mt-0.5 flex flex-wrap gap-1">
                            {p.ribbon && <Pill tone="gold">{p.ribbon}</Pill>}
                            <StockPill state={stockState(p)} />
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-wine-900/70">{CATEGORIES.find((c) => c.slug === p.category)?.name}</td>
                    <td className="num px-3 py-3 text-right font-semibold">{formatPrice(Number(p.price) || 0)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {VARIANTS.filter((v) => p.variants[v]?.enabled).map((v) => (
                          <StockStepper key={v} label={v} value={Number(p.variants[v].stock) || 0} low={p.lowStock} onChange={(n) => setStock(p.id, v, n)} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="quiet" onClick={() => nav(`/admin/products/${p.id}`)} aria-label={`Edit ${p.name}`}><Pencil size={14} /></Button>
                        <Button size="sm" variant="quiet" onClick={() => duplicate(p)} aria-label={`Duplicate ${p.name}`}><Copy size={14} /></Button>
                        <Button size="sm" variant="quiet" onClick={() => setDel(p)} aria-label={`Delete ${p.name}`}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Confirm open={!!del} title={`Delete “${del?.name}”?`} body="This removes the product from the shop. You can't undo this (export a backup first if unsure)." onConfirm={() => { deleteProduct(del.id); setToast('Product deleted') }} onClose={() => setDel(null)} />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}

function StockStepper({ label, value, low, onChange }) {
  const tone = value === 0 ? 'border-[#e8b9c0] bg-[#fdf2f4]' : value <= low ? 'border-[#ecd29a] bg-[#fdf7ea]' : 'border-wine-900/20 bg-ivory/70'
  const short = { Gold: 'Gold', 'Rose Gold': 'Rose', Silver: 'Silver' }[label]
  return (
    <span className={`inline-flex h-8 items-center border text-[12.5px] ${tone}`}>
      <span className="px-2 font-medium text-wine-900/65">{short}</span>
      <button type="button" className="flex h-full w-6 items-center justify-center hover:bg-wine-900/5" onClick={() => onChange(value - 1)} aria-label={`Decrease ${label} stock`}><Minus size={12} /></button>
      <span className="num w-7 text-center font-semibold">{value}</span>
      <button type="button" className="flex h-full w-6 items-center justify-center hover:bg-wine-900/5" onClick={() => onChange(value + 1)} aria-label={`Increase ${label} stock`}><Plus size={12} /></button>
    </span>
  )
}
