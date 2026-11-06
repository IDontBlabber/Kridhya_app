import { forwardRef, useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronUp, ImagePlus, Images, Search, Trash2, Upload, X } from 'lucide-react'
import { fileToImage, libraryGroups, useAdmin } from './store'

export const cx = (...c) => c.filter(Boolean).join(' ')

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gold/40 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow text-[11px] text-gold-deep">Kridhya admin</p>
        <h1 className="mt-2 font-display text-[clamp(26px,2.6vw,32px)] font-normal leading-tight text-wine-900">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] text-wine-900/60">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const v = {
    primary: 'bg-wine-800 text-ivory hover:bg-wine-700',
    gold: 'bg-gold text-wine-950 hover:bg-gold-light',
    ghost: 'border border-wine-900/25 bg-transparent text-wine-900 hover:border-wine-900 hover:bg-wine-900 hover:text-ivory',
    danger: 'bg-[#9b2335] text-ivory hover:bg-[#b02a3e]',
    quiet: 'text-wine-900/70 hover:bg-wine-900/[0.06] hover:text-wine-900',
  }[variant]
  const s = { sm: 'h-8 gap-1.5 px-2.5 text-[11px] tracking-[0.12em]', md: 'h-11 gap-2 px-5 text-[11.5px] tracking-[0.16em]' }[size]
  return (
    <button type="button" className={cx('inline-flex shrink-0 items-center justify-center font-sans font-semibold uppercase transition-colors duration-300 ease-luxe disabled:cursor-not-allowed disabled:opacity-50', v, s, className)} {...rest}>
      {children}
    </button>
  )
}

export function Card({ className = '', children }) {
  return <div className={cx('border border-gold/35 bg-[#f8f1e4] shadow-[0_18px_40px_-34px_rgba(43,9,18,0.45)]', className)}>{children}</div>
}

export function Section({ title, hint, children, aside }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[20px] font-normal leading-tight text-wine-900">{title}</h2>
          {hint && <p className="mt-0.5 text-[13px] text-wine-900/55">{hint}</p>}
        </div>
        {aside}
      </div>
      {children}
    </Card>
  )
}

export function Field({ label, hint, error, required, children, className = '' }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-wine-900">
        <span>{label} {required && <span className="text-wine-600">*</span>}</span>
        {hint && <span className="text-[12px] font-normal normal-case tracking-normal text-wine-900/50">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[12.5px] font-medium text-[#9b2335]">{error}</span>}
    </label>
  )
}

const control = 'w-full border border-wine-900/20 bg-ivory/60 px-3 text-[14px] text-wine-900 placeholder:text-wine-900/35 focus:border-wine-700 focus:bg-ivory focus:outline-none focus:ring-2 focus:ring-gold/25'
export const Input = (p) => <input {...p} className={cx(control, 'h-10', p.className)} />
export const Textarea = forwardRef((p, ref) => <textarea ref={ref} {...p} className={cx(control, 'py-2.5 leading-relaxed', p.className)} />)
export const Select = ({ children, ...p }) => (
  <select {...p} className={cx(control, 'h-10 cursor-pointer pr-8', p.className)}>
    {children}
  </select>
)

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-wine-800' : 'bg-wine-900/20')}>
      <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  )
}

export function Pill({ tone = 'neutral', children }) {
  const t = {
    neutral: 'bg-wine-900/[0.06] text-wine-900/75',
    ok: 'bg-[#e6f2ea] text-[#24663d]',
    warn: 'bg-[#fbf0d9] text-[#8a5a00]',
    bad: 'bg-[#f8e3e6] text-[#9b2335]',
    gold: 'bg-gold/20 text-gold-deep',
    draft: 'bg-wine-900/[0.06] text-wine-900/60',
  }[tone]
  return <span className={cx('inline-flex items-center whitespace-nowrap px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]', t)}>{children}</span>
}

export const StockPill = ({ state }) =>
  state === 'out' ? <Pill tone="bad">Out of stock</Pill> : state === 'low' ? <Pill tone="warn">Low stock</Pill> : <Pill tone="ok">In stock</Pill>
export const StatusPill = ({ status }) => (status === 'published' ? <Pill tone="ok">Published</Pill> : <Pill tone="draft">Draft</Pill>)

// In-page confirm (no browser dialogs).
export function Confirm({ open, title, body, confirmLabel = 'Delete', onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-wine-950/50 p-4" onClick={onClose}>
      <div role="alertdialog" aria-modal="true" className="w-full max-w-sm border border-gold/40 bg-ivory p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-[22px] font-normal leading-tight text-wine-900">{title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-wine-900/65">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [message, onDone])
  if (!message) return null
  return <div role="status" className="fixed bottom-5 left-1/2 z-[95] -translate-x-1/2 rounded-full bg-wine-950 px-5 py-2.5 text-[13.5px] font-medium text-ivory shadow-xl">{message}</div>
}

// Picker for photos already on the site (and earlier uploads), grouped and searchable.
function Library({ open, onPick, onClose, multiple }) {
  const store = useAdmin()
  const [sel, setSel] = useState([])
  const [q, setQ] = useState('')
  useEffect(() => { setSel([]); setQ('') }, [open])
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  const t = q.trim().toLowerCase()
  const groups = libraryGroups(store?.data)
    .map((g) => ({ ...g, items: t ? g.items.filter((i) => i.label.toLowerCase().includes(t)) : g.items }))
    .filter((g) => g.items.length)
  const toggle = (src) => setSel((s) => (s.includes(src) ? s.filter((x) => x !== src) : multiple ? [...s, src] : [src]))
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-wine-950/60 p-3 sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Choose from site photos" className="flex h-[88vh] w-full max-w-5xl flex-col border border-gold/40 bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gold/30 px-5 py-4">
          <h3 className="mr-auto font-display text-[22px] font-normal text-wine-900">Choose from site photos</h3>
          <label className="relative order-last w-full sm:order-none sm:w-64">
            <span className="sr-only">Search photos</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-wine-900/40" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by product or post" className="pl-9" />
          </label>
          <button type="button" onClick={onClose} className="p-1.5 text-wine-900/60 hover:bg-wine-900/5 hover:text-wine-900" aria-label="Close"><X size={20} /></button>
        </div>

        {/* scroll area: the grid inside keeps square tiles (content-start stops rows stretching) */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          {groups.length === 0 && <p className="py-16 text-center text-[14px] text-wine-900/55">No photos match “{q}”.</p>}
          {groups.map((g) => (
            <section key={g.title} className="pt-5">
              <h4 className="sticky top-0 z-10 -mx-5 mb-3 border-b border-gold/20 bg-ivory/95 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-deep backdrop-blur">
                {g.title} <span className="num ml-1 text-wine-900/40">{g.items.length}</span>
              </h4>
              <ul className="grid grid-cols-2 content-start gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {g.items.map(({ src, label }) => {
                  const on = sel.includes(src)
                  return (
                    <li key={src}>
                      <button type="button" onClick={() => toggle(src)} aria-pressed={on} title={label}
                        className={cx('group block w-full border bg-[#f8f1e4] p-1.5 text-left transition-shadow', on ? 'border-wine-800 shadow-[0_0_0_2px_#45101F]' : 'border-gold/30 hover:border-gold hover:shadow-[0_10px_24px_-18px_rgba(43,9,18,0.6)]')}>
                        <span className="relative block aspect-square overflow-hidden bg-cream">
                          <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                          {on && (
                            <span className="absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center bg-wine-800 px-1 text-[11px] font-bold text-ivory">
                              {multiple ? sel.indexOf(src) + 1 : <Check size={14} />}
                            </span>
                          )}
                        </span>
                        <span className="mt-1.5 block truncate px-0.5 text-[12px] text-wine-900/70">{label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gold/30 px-5 py-3">
          <p className="text-[13px] text-wine-900/60">{sel.length ? `${sel.length} selected${multiple ? ' - added in this order' : ''}` : multiple ? 'Select one or more photos' : 'Select a photo'}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button disabled={!sel.length} onClick={() => { onPick(sel); onClose() }}>Add{sel.length ? ` ${sel.length}` : ''}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Ordered image list: first image is the cover. Upload (resized in-browser) or pick from the site library.
export function ImageManager({ images, onChange, multiple = true, label = 'Images' }) {
  const store = useAdmin()
  const fileRef = useRef(null)
  const [lib, setLib] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const add = (list) => onChange(multiple ? [...images, ...list] : list.slice(0, 1))
  const upload = async (files) => {
    setErr('')
    setBusy(true)
    try {
      const out = []
      for (const f of files) out.push(await store.uploadImage(await fileToImage(f)))
      add(out)
    } catch (e) {
      setErr(e?.message === 'Not an image' ? 'That file could not be read as an image.' : `Upload failed: ${e?.message || 'please try again.'}`)
    } finally {
      setBusy(false)
    }
  }
  const move = (i, d) => {
    const n = [...images]
    ;[n[i], n[i + d]] = [n[i + d], n[i]]
    onChange(n)
  }
  return (
    <div>
      {images.length > 0 && (
        <ul className={cx('mb-3 grid gap-3', multiple ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-1 sm:max-w-xs')}>
          {images.map((src, i) => (
            <li key={src.slice(0, 80) + i} className="group relative overflow-hidden border border-wine-900/10 bg-cream">
              <img src={src} alt="" className="aspect-square w-full object-cover" />
              {multiple && i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-wine-900/85 px-1.5 py-0.5 text-[10.5px] font-semibold text-ivory">Cover</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <div className="flex gap-1">
                  {multiple && i > 0 && <IconBtn label="Move earlier" onClick={() => move(i, -1)}><ChevronUp size={14} className="-rotate-90" /></IconBtn>}
                  {multiple && i < images.length - 1 && <IconBtn label="Move later" onClick={() => move(i, 1)}><ChevronDown size={14} className="-rotate-90" /></IconBtn>}
                </div>
                <IconBtn label="Remove image" onClick={() => onChange(images.filter((_, j) => j !== i))}><Trash2 size={14} /></IconBtn>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={() => fileRef.current?.click()} disabled={busy}><Upload size={15} /> {busy ? 'Uploading…' : `Upload ${label.toLowerCase()}`}</Button>
        <Button variant="ghost" onClick={() => setLib(true)}><Images size={15} /> From site photos</Button>
      </div>
      {!images.length && <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-wine-900/50"><ImagePlus size={14} /> JPG, PNG or WebP. Large photos are resized to 1600px automatically.</p>}
      {err && <p className="mt-2 text-[12.5px] text-[#9b2335]">{err}</p>}
      <input ref={fileRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => { upload([...e.target.files]); e.target.value = '' }} />
      <Library open={lib} multiple={multiple} onClose={() => setLib(false)} onPick={add} />
    </div>
  )
}

function IconBtn({ label, children, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label} className="flex h-7 w-7 items-center justify-center rounded bg-white/90 text-wine-900 hover:bg-white" {...rest}>
      {children}
    </button>
  )
}

export function Empty({ icon: I, title, body, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {I && <I size={28} className="text-gold-deep" />}
      <p className="mt-3 text-[15px] font-semibold text-wine-900">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13.5px] text-wine-900/55">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
