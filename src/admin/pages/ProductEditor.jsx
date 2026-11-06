import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react'
import { CATEGORIES, RIBBONS, VARIANTS, newProduct, slugify, stockOf, stockState, useAdmin } from '../store'
import { formatPrice } from '../../data/site'
import { FinishDot } from '../../components/ui'
import { Button, Card, Confirm, Field, ImageManager, Input, PageHeader, Section, Select, StatusPill, StockPill, Textarea, Toast, Toggle } from '../ui'

export default function ProductEditor() {
  const { id } = useParams()
  const { data, saveProduct, deleteProduct } = useAdmin()
  const existing = data.products.find((p) => p.id === id)
  const nav = useNavigate()
  const [p, setP] = useState(() => (existing ? structuredClone(existing) : newProduct()))
  const [slugTouched, setSlugTouched] = useState(!!existing)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState('')
  const [del, setDel] = useState(false)
  const dirty = useMemo(() => JSON.stringify(p) !== JSON.stringify(existing ?? newProduct()), [p, existing])

  if (id && !existing) return <p className="py-16 text-center text-wine-900/60">That product no longer exists. <Link className="font-semibold underline" to="/admin/products">Back to products</Link></p>

  const set = (k, v) => setP((x) => ({ ...x, [k]: v }))
  const setName = (name) => setP((x) => ({ ...x, name, slug: slugTouched ? x.slug : slugify(name) }))
  const setVariant = (v, k, val) => setP((x) => ({ ...x, variants: { ...x.variants, [v]: { ...x.variants[v], [k]: val } } }))

  const validate = (p) => {
    const e = {}
    if (!p.name.trim()) e.name = 'Give the product a name.'
    if (!p.slug.trim()) e.slug = 'A web address is required.'
    else if (data.products.some((x) => x.slug === p.slug && x.id !== p.id)) e.slug = 'Another product already uses this address.'
    if (!(Number(p.price) > 0)) e.price = 'Enter a price above zero.'
    if (p.comparePrice && Number(p.comparePrice) <= Number(p.price)) e.comparePrice = 'Should be higher than the price.'
    if (!VARIANTS.some((v) => p.variants[v].enabled)) e.variants = 'Turn on at least one finish.'
    if (p.status === 'published' && !p.images.length) e.images = 'Add at least one image before publishing.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const save = (status = p.status) => {
    const next = { ...p, status, slug: slugify(p.slug) }
    setP(next)
    if (!validate(next)) return
    saveProduct(next)
    setToast(status === 'published' ? 'Saved and published' : 'Saved as draft')
    if (!existing) nav(`/admin/products/${next.id}`, { replace: true })
  }

  const total = stockOf(p)

  return (
    <div className="space-y-5 pb-24">
      <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-wine-900/60 hover:text-wine-900"><ArrowLeft size={14} /> Products</Link>
      <PageHeader title={existing ? p.name || 'Untitled product' : 'New product'} subtitle={existing ? `Last updated ${new Date(existing.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Fill in the details, then save as a draft or publish.'}>
        <StatusPill status={p.status} />
        {existing?.status === 'published' && (
          <Link to={`/product/${existing.slug}`} target="_blank" className="inline-flex h-10 items-center gap-1.5 px-2 text-[13px] font-semibold text-wine-700 hover:underline"><ExternalLink size={14} /> View in shop</Link>
        )}
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Section title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" required error={errors.name} className="sm:col-span-2">
                <Input value={p.name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Infinity Heart Necklace" />
              </Field>
              <Field label="Web address" hint={`/product/${slugify(p.slug) || '…'}`} error={errors.slug} className="sm:col-span-2">
                <Input value={p.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value) }} placeholder="infinity-heart-necklace" />
              </Field>
              <Field label="Category" required>
                <Select value={p.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Ribbon" hint="Badge on the product photo">
                <Select value={RIBBONS.includes(p.ribbon) ? p.ribbon : '__custom'} onChange={(e) => set('ribbon', e.target.value === '__custom' ? 'Custom' : e.target.value)}>
                  {RIBBONS.map((r) => <option key={r} value={r}>{r || 'None'}</option>)}
                  <option value="__custom">Custom…</option>
                </Select>
                {!RIBBONS.includes(p.ribbon) && <Input className="mt-2" value={p.ribbon} maxLength={22} onChange={(e) => set('ribbon', e.target.value)} placeholder="Ribbon text" />}
              </Field>
              <Field label="Short description" hint={`${p.short.length}/160`} className="sm:col-span-2">
                <Textarea rows={2} maxLength={160} value={p.short} onChange={(e) => set('short', e.target.value)} placeholder="One line shown under the price and on product cards." />
              </Field>
              <Field label="Full description" hint="Materials, size, stones, story" className="sm:col-span-2">
                <Textarea rows={6} value={p.description} onChange={(e) => set('description', e.target.value)} placeholder="Shown in the Details section of the product page. Leave a blank line between paragraphs." />
              </Field>
            </div>
          </Section>

          <Section title="Images" hint="The first image is the cover; the second appears on hover in the shop." aside={errors.images && <span className="text-[12.5px] font-medium text-[#9b2335]">{errors.images}</span>}>
            <ImageManager images={p.images} onChange={(v) => set('images', v)} />
          </Section>

          <Section title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (₹)" required error={errors.price}>
                <Input type="number" min="0" inputMode="numeric" value={p.price} onChange={(e) => set('price', e.target.value)} placeholder="4200" />
              </Field>
              <Field label="Compare-at price (₹)" hint="Optional, shows as struck through" error={errors.comparePrice}>
                <Input type="number" min="0" inputMode="numeric" value={p.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} placeholder="5000" />
              </Field>
            </div>
          </Section>

          <Section title="Variants & stock" hint="Turn on the finishes this piece comes in and set the units available for each." aside={<StockPill state={stockState(p)} />}>
            {errors.variants && <p className="mb-3 text-[12.5px] font-medium text-[#9b2335]">{errors.variants}</p>}
            <div className="divide-y divide-wine-900/10 border border-wine-900/10">
              {VARIANTS.map((v) => {
                const on = p.variants[v].enabled
                return (
                  <div key={v} className="grid items-center gap-3 p-3 sm:grid-cols-[180px_1fr_1fr]">
                    <div className="flex items-center gap-3">
                      <Toggle checked={on} onChange={(c) => setVariant(v, 'enabled', c)} label={`Offer ${v}`} />
                      <span className="flex items-center gap-2 text-[14px] font-semibold"><FinishDot finish={v} size={14} /> {v}</span>
                    </div>
                    <Field label="Units in stock">
                      <Input type="number" min="0" inputMode="numeric" disabled={!on} value={p.variants[v].stock} onChange={(e) => setVariant(v, 'stock', Math.max(0, parseInt(e.target.value || '0', 10)))} />
                    </Field>
                    <Field label="SKU" hint="Optional">
                      <Input disabled={!on} value={p.variants[v].sku} onChange={(e) => setVariant(v, 'sku', e.target.value)} placeholder={`KDA-${(p.slug || 'item').slice(0, 6).toUpperCase()}-${v.split(' ').map((w) => w[0]).join('')}`} />
                    </Field>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <Field label="Low-stock alert at" hint="units per finish" className="w-44">
                <Input type="number" min="0" value={p.lowStock} onChange={(e) => set('lowStock', Math.max(0, parseInt(e.target.value || '0', 10)))} />
              </Field>
              <p className="pb-2.5 text-[13px] text-wine-900/60">Total: <span className="font-semibold text-wine-900">{total} units</span>{total === 0 && ' - shown as Sold out in the shop'}</p>
            </div>
          </Section>
        </div>

        {/* preview + publish */}
        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Section title="Visibility">
            <div className="grid grid-cols-2 gap-2">
              {[['published', 'Published', 'Visible in the shop'], ['draft', 'Draft', 'Hidden from visitors']].map(([v, t, d]) => (
                <button key={v} type="button" onClick={() => set('status', v)} className={` border p-3 text-left transition-colors ${p.status === v ? 'border-wine-800 bg-wine-900/[0.04]' : 'border-wine-900/12 hover:border-wine-900/30'}`}>
                  <span className="block text-[13.5px] font-semibold">{t}</span>
                  <span className="block text-[12px] text-wine-900/55">{d}</span>
                </button>
              ))}
            </div>
          </Section>
          <Card className="p-5">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-wine-900/50">Shop preview</p>
            <div className="relative aspect-square overflow-hidden bg-cream">
              {p.images[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover mix-blend-multiply" /> : <span className="absolute inset-0 flex items-center justify-center text-[12.5px] text-wine-900/40">No image yet</span>}
              {(total === 0 || p.ribbon) && <span className="absolute left-2.5 top-2.5 bg-ivory/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-wine-900">{total === 0 ? 'Sold out' : p.ribbon}</span>}
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep">{CATEGORIES.find((c) => c.slug === p.category)?.name}</p>
            <p className="mt-0.5 font-display text-[19px] leading-snug">{p.name || 'Product name'}</p>
            <p className="num mt-1 text-[14px] font-semibold">
              {formatPrice(Number(p.price) || 0)}
              {Number(p.comparePrice) > Number(p.price) && <span className="ml-2 font-normal text-wine-900/45 line-through">{formatPrice(Number(p.comparePrice))}</span>}
            </p>
            {p.short && <p className="mt-2 text-[13px] leading-snug text-wine-900/60">{p.short}</p>}
          </Card>
          {existing && (
            <Button variant="quiet" className="w-full text-[#9b2335] hover:bg-[#f8e3e6] hover:text-[#9b2335]" onClick={() => setDel(true)}><Trash2 size={15} /> Delete product</Button>
          )}
        </div>
      </div>

      {/* sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 bg-ivory/95 backdrop-blur lg:left-[248px]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className="text-[13px] text-wine-900/60">{dirty ? 'You have unsaved changes' : 'No unsaved changes'}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => save('draft')}>Save draft</Button>
            <Button onClick={() => save('published')}>{p.status === 'published' && existing?.status === 'published' ? 'Save changes' : 'Publish'}</Button>
          </div>
        </div>
      </div>

      <Confirm open={del} title={`Delete “${p.name}”?`} body="This removes the product from the shop and can't be undone." onConfirm={() => { deleteProduct(p.id); nav('/admin/products') }} onClose={() => setDel(false)} />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
