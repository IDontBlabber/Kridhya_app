import { useMemo, useState } from 'react'
import { ExternalLink, RotateCcw } from 'lucide-react'
import { DEFAULT_POPUP, popupActive, useAdmin } from '../store'
import { Button, Card, Field, ImageManager, Input, PageHeader, Pill, Section, Select, Toast, Toggle } from '../ui'

const LINKS = [
  ['/shop', 'Shop - all jewellery'],
  ['/collections', 'Collections'],
  ['/corporate-gifting', 'Corporate gifting'],
  ['/blog', 'Journal'],
  ['/contact', 'Contact'],
]

export function popupStatus(p) {
  const today = new Date().toLocaleDateString('en-CA')
  if (!p.enabled) return ['Off', 'draft']
  if (!p.image) return ['No image', 'warn']
  if (p.startDate && today < p.startDate) return [`Scheduled from ${fmt(p.startDate)}`, 'gold']
  if (p.endDate && today > p.endDate) return [`Ended ${fmt(p.endDate)}`, 'bad']
  return ['Live on website', 'ok']
}
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export default function PopupPage() {
  const { data, savePopup } = useAdmin()
  const [p, setP] = useState(() => ({ ...DEFAULT_POPUP, ...data.popup }))
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }))
  const dirty = useMemo(() => JSON.stringify(p) !== JSON.stringify({ ...DEFAULT_POPUP, ...data.popup }), [p, data.popup])
  const [label, tone] = popupStatus(p)
  const customLink = !LINKS.some(([v]) => v === p.link)

  const save = () => {
    setErr('')
    if (p.enabled && !p.image) return setErr('Add a banner image before switching the pop-up on.')
    if (p.startDate && p.endDate && p.endDate < p.startDate) return setErr('The end date is before the start date.')
    // a new image or link counts as a new banner, so visitors who closed the old one see it
    savePopup(p)
    setToast(popupActive(p) ? 'Saved - the pop-up is live' : 'Saved')
  }

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="Pop-up banner" subtitle="A festival or offer banner that opens when visitors arrive. Replace it for each occasion.">
        <Pill tone={tone}>{label}</Pill>
        <a href="/?popup-preview=1" target="_blank" rel="noreferrer"><Button variant="ghost"><ExternalLink size={15} /> Preview on website</Button></a>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Section title="Show the pop-up" hint="Turn off to hide it without losing the settings." aside={<Toggle checked={p.enabled} onChange={(v) => set('enabled', v)} label="Show pop-up" />}>
            <Field label="Name" hint="For you - also read aloud by screen readers">
              <Input value={p.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Diwali 2026" />
            </Field>
          </Section>

          <Section title="Banner image" hint="Wide images work best (16:9, at least 1280 × 720). Put any text you want inside the image itself.">
            <ImageManager multiple={false} label="Banner" images={p.image ? [p.image] : []} onChange={(v) => set('image', v[0] || '')} />
            <Field label="Image description" hint="What the banner says, for accessibility" className="mt-4">
              <Input value={p.alt} onChange={(e) => set('alt', e.target.value)} placeholder="Happy Diwali from Kridhya - festive jewellery with diyas" />
            </Field>
          </Section>

          <Section title="Where it leads" hint="Clicking the banner opens this page.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link">
                <Select value={customLink ? '__custom' : p.link} onChange={(e) => set('link', e.target.value === '__custom' ? '' : e.target.value)}>
                  {LINKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  <option value="__custom">Another page or website…</option>
                </Select>
                {customLink && <Input className="mt-2" value={p.link} onChange={(e) => set('link', e.target.value.trim())} placeholder="/collections/necklaces or https://…" />}
              </Field>
              <Field label="Button text" hint="Optional - shown under the image">
                <Input value={p.buttonLabel} maxLength={32} onChange={(e) => set('buttonLabel', e.target.value)} placeholder="Shop the festive edit" />
              </Field>
            </div>
          </Section>

          <Section title="Schedule & frequency" hint="Leave the dates empty to show it until you switch it off.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date"><Input type="date" value={p.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
              <Field label="End date"><Input type="date" value={p.endDate} onChange={(e) => set('endDate', e.target.value)} /></Field>
              <Field label="How often a visitor sees it">
                <Select value={p.frequency} onChange={(e) => set('frequency', e.target.value)}>
                  <option value="session">Once per visit (recommended)</option>
                  <option value="day">Once a day</option>
                  <option value="always">On every page load</option>
                </Select>
              </Field>
              <Field label="Open after" hint="seconds">
                <Input type="number" min="0" max="30" value={p.delay} onChange={(e) => set('delay', Math.min(30, Math.max(0, Number(e.target.value) || 0)))} />
              </Field>
            </div>
          </Section>
        </div>

        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-wine-900/50">Preview</p>
            <div className=" bg-wine-950/80 p-4">
              <div className={`border border-gold/50 bg-wine-950 p-1 ${p.enabled ? '' : 'opacity-50'}`}>
                {p.image ? <img src={p.image} alt="" className="block w-full object-contain" /> : <div className="flex aspect-video items-center justify-center text-[12.5px] text-ivory/50">No image yet</div>}
                {p.buttonLabel && <p className="border-t border-gold/25 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-light">{p.buttonLabel} →</p>}
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-wine-900/55">
              Opens {p.delay ? `${p.delay}s after arrival` : 'immediately'}, {p.frequency === 'session' ? 'once per visit' : p.frequency === 'day' ? 'once a day' : 'on every page load'}. Not shown during checkout.
            </p>
          </Card>
          <Button variant="quiet" className="w-full" onClick={() => setP({ ...DEFAULT_POPUP })}><RotateCcw size={14} /> Restore the Diwali banner</Button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 bg-ivory/95 backdrop-blur lg:left-[248px]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className={`text-[13px] ${err ? 'font-medium text-[#9b2335]' : 'text-wine-900/60'}`}>{err || (dirty ? 'You have unsaved changes' : 'No unsaved changes')}</p>
          <Button onClick={save}>Save pop-up</Button>
        </div>
      </div>
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
