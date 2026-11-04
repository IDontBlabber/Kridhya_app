import { useRef, useState } from 'react'
import { Download, RotateCcw, Upload } from 'lucide-react'
import { useAdmin } from '../store'
import { Button, Confirm, PageHeader, Section, Toast } from '../ui'

export default function DataPage() {
  const { data, replaceAll, reset } = useAdmin()
  const fileRef = useRef(null)
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const size = new Blob([JSON.stringify(data)]).size

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `kridhya-catalogue-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file) => {
    setErr('')
    try {
      const next = JSON.parse(await file.text())
      if (!Array.isArray(next.products) || !Array.isArray(next.posts)) throw new Error('shape')
      replaceAll(next)
      setToast(`Imported ${next.products.length} products and ${next.posts.length} posts`)
    } catch {
      setErr('That file is not a Kridhya catalogue backup.')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Data & backup" subtitle="Your catalogue is saved in this browser. Keep a backup, or move it to another computer." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Export a backup" hint={`${data.products.length} products, ${data.posts.length} posts · ${(size / 1024 / 1024).toFixed(1)} MB including uploaded photos`}>
          <Button onClick={exportJson}><Download size={15} /> Download backup (.json)</Button>
        </Section>
        <Section title="Restore from a backup" hint="Replaces everything here with the contents of the file.">
          <Button variant="ghost" onClick={() => fileRef.current?.click()}><Upload size={15} /> Choose backup file</Button>
          {err && <p className="mt-2 text-[12.5px] font-medium text-[#9b2335]">{err}</p>}
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = '' }} />
        </Section>
        <Section title="Reset to the original catalogue" hint="Discards every change made in this browser and restores the products and posts the site shipped with.">
          <Button variant="danger" onClick={() => setConfirmReset(true)}><RotateCcw size={15} /> Reset catalogue</Button>
        </Section>
        <Section title="Going live for every visitor" hint="How this portal becomes the real store">
          <p className="text-[13.5px] leading-relaxed text-wine-900/70">
            In preview mode, edits are visible only in this browser. To publish them for every customer, connect a database such as Supabase.
            Products, posts and uploaded photos then save to the cloud, and the shop reads from it. The backup file above imports directly.
          </p>
        </Section>
      </div>
      <Confirm open={confirmReset} title="Reset the catalogue?" body="All products, posts and photos added or changed in this browser will be lost. Download a backup first if you might need them." confirmLabel="Reset" onConfirm={async () => { await reset(); setToast('Catalogue reset') }} onClose={() => setConfirmReset(false)} />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
