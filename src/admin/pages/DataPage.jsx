import { useRef, useState } from 'react'
import { DatabaseZap, Download, RotateCcw, Upload } from 'lucide-react'
import { seedData, useAdmin } from '../store'
import { Button, Confirm, PageHeader, Section, Toast } from '../ui'

export default function DataPage() {
  const { data, replaceAll, reset, backend, localCatalogue } = useAdmin()
  const fileRef = useRef(null)
  const [toast, setToast] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [confirm, setConfirm] = useState(null) // 'reset' | 'restore' | 'import-local' | 'import-seed'
  const [pendingFile, setPendingFile] = useState(null)
  const size = new Blob([JSON.stringify(data)]).size

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `kridhya-catalogue-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const run = async (label, next) => {
    setErr('')
    setBusy(label)
    try {
      await replaceAll(next, setBusy)
      setToast(`Saved ${next.products.length} products and ${next.posts.length} posts`)
    } catch (e) {
      setErr(`Something went wrong: ${e.message}`)
    } finally {
      setBusy('')
    }
  }

  const restore = async (file) => {
    try {
      const next = JSON.parse(await file.text())
      if (!Array.isArray(next.products) || !Array.isArray(next.posts)) throw new Error('shape')
      await run('Restoring…', next)
    } catch {
      setErr('That file is not a Kridhya catalogue backup.')
    }
  }

  const importLocal = async () => {
    const local = await localCatalogue()
    if (!local?.products) return setErr('This browser has no saved preview catalogue. Use “Import the original catalogue” instead.')
    await run('Importing…', local)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Data & backup" subtitle={backend ? 'Your catalogue lives in the database. Keep a backup file as well.' : 'Your catalogue is saved in this browser. Keep a backup, or move it to another computer.'} />
      {busy && <p role="status" className="border border-gold/40 bg-gold/10 px-4 py-3 text-[13.5px] font-medium">{busy} Please keep this page open.</p>}
      {err && <p role="alert" className="border border-[#e8b9c0] bg-[#fdf2f4] px-4 py-3 text-[13.5px] font-medium text-[#9b2335]">{err}</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        {backend && (
          <Section title="Import into the database" hint={data.empty ? 'The database is empty - bring in your catalogue to start.' : 'Adds or updates products and posts with the same IDs; nothing is deleted.'}>
            <div className="flex flex-wrap gap-2">
              <Button disabled={!!busy} onClick={() => setConfirm('import-local')}><DatabaseZap size={15} /> Copy this browser's preview edits</Button>
              <Button variant="ghost" disabled={!!busy} onClick={() => setConfirm('import-seed')}>Import the original catalogue</Button>
            </div>
            <p className="mt-3 text-[12.5px] text-wine-900/55">Photos uploaded in preview mode are moved to cloud storage automatically.</p>
          </Section>
        )}
        <Section title="Export a backup" hint={`${data.products.length} products, ${data.posts.length} posts · ${(size / 1024 / 1024).toFixed(1)} MB`}>
          <Button onClick={exportJson}><Download size={15} /> Download backup (.json)</Button>
        </Section>
        <Section title="Restore from a backup" hint={backend ? 'Adds or updates everything in the file; items not in the file are kept.' : 'Replaces everything here with the contents of the file.'}>
          <Button variant="ghost" disabled={!!busy} onClick={() => fileRef.current?.click()}><Upload size={15} /> Choose backup file</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { if (e.target.files[0]) { setPendingFile(e.target.files[0]); setConfirm('restore') } e.target.value = '' }} />
        </Section>
        {!backend && (
          <Section title="Reset to the original catalogue" hint="Discards every change made in this browser and restores the products and posts the site shipped with.">
            <Button variant="danger" onClick={() => setConfirm('reset')}><RotateCcw size={15} /> Reset catalogue</Button>
          </Section>
        )}
        {!backend && (
          <Section title="Going live for every visitor" hint="How this portal becomes the real store">
            <p className="text-[13.5px] leading-relaxed text-wine-900/70">
              Add the Supabase keys (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) to publish for every customer. Then use “Import into the database” on this page to bring this catalogue across.
            </p>
          </Section>
        )}
      </div>
      <Confirm open={confirm === 'reset'} title="Reset the catalogue?" body="All products, posts and photos added or changed in this browser will be lost. Download a backup first if you might need them." confirmLabel="Reset" onConfirm={async () => { await reset(); setToast('Catalogue reset') }} onClose={() => setConfirm(null)} />
      <Confirm open={confirm === 'restore'} title="Restore this backup?" body={`“${pendingFile?.name}” will be loaded into the ${backend ? 'database' : 'catalogue'}.`} confirmLabel="Restore" onConfirm={() => restore(pendingFile)} onClose={() => setConfirm(null)} />
      <Confirm open={confirm === 'import-local'} title="Copy preview edits to the database?" body="Everything saved in this browser's preview catalogue (products, posts, pop-up and uploaded photos) will be published to the live store." confirmLabel="Copy to database" onConfirm={importLocal} onClose={() => setConfirm(null)} />
      <Confirm open={confirm === 'import-seed'} title="Import the original catalogue?" body="The 31 products and 4 journal posts the site shipped with will be added to the database." confirmLabel="Import" onConfirm={() => run('Importing…', seedData())} onClose={() => setConfirm(null)} />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
