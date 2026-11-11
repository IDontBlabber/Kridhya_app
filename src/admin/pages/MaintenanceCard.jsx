import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import { hasBackend } from '../store'
import { Button, Card, Input, Pill, Textarea, Toggle } from '../ui'

// Dashboard card: switch the public site into maintenance mode (settings key 'maintenance').
export default function MaintenanceCard() {
  const [v, setV] = useState(null) // { on, message, until }
  const [saved, setSaved] = useState(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!hasBackend) return
    import('../remote').then(({ sb }) => sb.from('settings').select('value').eq('key', 'maintenance').maybeSingle())
      .then(({ data }) => {
        const val = { on: false, message: '', until: '', ...(data?.value || {}) }
        setV(val)
        setSaved(val)
      })
      .catch(() => setV({ on: false, message: '', until: '' }))
  }, [])

  const save = async (next) => {
    setBusy(true)
    setNote('')
    try {
      const { sb } = await import('../remote')
      const { error } = await sb.from('settings').upsert({ key: 'maintenance', value: next, updated_at: new Date().toISOString() })
      if (error) throw new Error(error.message)
      setV(next)
      setSaved(next)
      setNote(next.on ? 'Maintenance mode is ON - visitors now see the “We’ll be back soon” page and new orders are paused.' : 'Maintenance mode is OFF - the website is open to everyone again.')
    } catch (e) {
      setNote(`Could not save: ${e.message}`)
    } finally {
      setBusy(false)
    }
  }

  if (!hasBackend) return null
  const dirty = v && saved && (v.message !== saved.message || v.until !== saved.until)

  return (
    <Card className={v?.on ? 'border-[#9b2335]/50 bg-[#fbeef0]' : ''}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Wrench size={20} className="mt-0.5 shrink-0 text-gold-deep" />
          <div>
            <h2 className="flex flex-wrap items-center gap-2 font-display text-[20px] font-normal leading-tight">
              Maintenance mode {v && (v.on ? <Pill tone="warn">On - site closed</Pill> : <Pill tone="ok">Off - site live</Pill>)}
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-wine-900/65">
              When on, visitors see a “We’ll be back soon” page and no new orders can be placed. You (signed in here) still see the full site to check your changes.
            </p>
          </div>
        </div>
        {v ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold">{v.on ? 'On' : 'Off'}</span>
            <Toggle checked={v.on} label="Maintenance mode" onChange={(on) => !busy && save({ ...v, on })} />
          </div>
        ) : (
          <span className="text-[13px] text-wine-900/55">loading…</span>
        )}
      </div>
      {v && (
        <div className="grid gap-3 border-t border-wine-900/10 px-5 py-4 sm:grid-cols-[1fr_220px_auto] sm:items-end">
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-semibold">Message for visitors (optional)</span>
            <Textarea rows={2} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} placeholder="We’re making a few careful updates to the Kridhya store…" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-semibold">Back by (optional)</span>
            <Input value={v.until} onChange={(e) => setV({ ...v, until: e.target.value })} placeholder="e.g. 6 pm today" />
          </label>
          <Button variant="ghost" disabled={busy || !dirty} onClick={() => save(v)}>Save text</Button>
        </div>
      )}
      {note && <p role="status" className="border-t border-wine-900/10 px-5 py-3 text-[13px] font-medium text-wine-800">{note}</p>}
    </Card>
  )
}
