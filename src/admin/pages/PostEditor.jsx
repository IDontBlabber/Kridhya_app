import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Heading2, Heading3, Image as ImageIcon, Pilcrow, Trash2 } from 'lucide-react'
import { POST_CATEGORIES, newPost, readTime, slugify, uid, useAdmin } from '../store'
import { Button, Card, Confirm, Field, ImageManager, Input, PageHeader, Section, Select, StatusPill, Textarea, Toast } from '../ui'

const BLOCKS = [
  { type: 'h2', label: 'Heading', icon: Heading2 },
  { type: 'h3', label: 'Subheading', icon: Heading3 },
  { type: 'p', label: 'Paragraph', icon: Pilcrow },
  { type: 'img', label: 'Image', icon: ImageIcon },
]

export default function PostEditor() {
  const { id } = useParams()
  const { data, savePost, deletePost } = useAdmin()
  const existing = data.posts.find((p) => p.id === id)
  const nav = useNavigate()
  const [p, setP] = useState(() => (existing ? structuredClone(existing) : newPost()))
  const [slugTouched, setSlugTouched] = useState(!!existing)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState('')
  const [del, setDel] = useState(false)
  const dirty = useMemo(() => JSON.stringify(p) !== JSON.stringify(existing ?? newPost()), [p, existing])

  if (id && !existing) return <p className="py-16 text-center text-wine-900/60">That post no longer exists. <Link className="font-semibold underline" to="/admin/journal">Back to journal</Link></p>

  const set = (k, v) => setP((x) => ({ ...x, [k]: v }))
  const setBlock = (bid, patch) => setP((x) => ({ ...x, body: x.body.map((b) => (b.id === bid ? { ...b, ...patch } : b)) }))
  const addBlock = (type) => setP((x) => ({ ...x, body: [...x.body, { id: uid(), type, text: '', src: '' }] }))
  const moveBlock = (i, d) => setP((x) => { const b = [...x.body]; [b[i], b[i + d]] = [b[i + d], b[i]]; return { ...x, body: b } })
  const removeBlock = (bid) => setP((x) => ({ ...x, body: x.body.filter((b) => b.id !== bid) }))

  const validate = (post) => {
    const e = {}
    if (!post.title.trim()) e.title = 'Give the post a title.'
    if (!post.slug) e.slug = 'A web address is required.'
    else if (data.posts.some((x) => x.slug === post.slug && x.id !== post.id)) e.slug = 'Another post already uses this address.'
    if (post.status === 'published') {
      if (!post.excerpt.trim()) e.excerpt = 'Add a short introduction before publishing.'
      if (!post.cover) e.cover = 'Add a cover image before publishing.'
      if (!post.body.some((b) => (b.type === 'img' ? b.src : b.text.trim()))) e.body = 'Write some content before publishing.'
    }
    setErrors(e)
    return !Object.keys(e).length
  }

  const save = (status) => {
    const next = { ...p, status, slug: slugify(p.slug || p.title), body: p.body.filter((b) => (b.type === 'img' ? b.src : b.text.trim())) }
    if (!next.body.length) next.body = p.body
    if (!validate(next)) return
    setP(next)
    savePost(next)
    setToast(status === 'published' ? 'Saved and published' : 'Saved as draft')
    if (!existing) nav(`/admin/journal/${next.id}`, { replace: true })
  }

  return (
    <div className="space-y-5 pb-24">
      <Link to="/admin/journal" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-wine-900/60 hover:text-wine-900"><ArrowLeft size={14} /> Journal</Link>
      <PageHeader title={existing ? p.title || 'Untitled post' : 'New post'} subtitle={`${readTime(p)} · ${p.body.length} blocks`}>
        <StatusPill status={p.status} />
        {existing?.status === 'published' && (
          <Link to={`/blog/${existing.slug}`} target="_blank" className="inline-flex h-10 items-center gap-1.5 px-2 text-[13px] font-semibold text-wine-700 hover:underline"><ExternalLink size={14} /> View post</Link>
        )}
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Section title="Post">
            <div className="grid gap-4">
              <Field label="Title" required error={errors.title}>
                <Input value={p.title} onChange={(e) => setP((x) => ({ ...x, title: e.target.value, slug: slugTouched ? x.slug : slugify(e.target.value) }))} placeholder="e.g. How to care for gold-plated jewellery" className="text-[15px]" />
              </Field>
              <Field label="Introduction" hint="Shown on the journal page and at the top of the post" error={errors.excerpt}>
                <Textarea rows={3} value={p.excerpt} onChange={(e) => set('excerpt', e.target.value)} placeholder="One or two sentences that invite the reader in." />
              </Field>
            </div>
          </Section>

          <Section title="Content" hint="Build the article from blocks - reorder them with the arrows." aside={errors.body && <span className="text-[12.5px] font-medium text-[#9b2335]">{errors.body}</span>}>
            <ol className="space-y-3">
              {p.body.map((b, i) => {
                const meta = BLOCKS.find((x) => x.type === b.type)
                return (
                  <li key={b.id} className="rounded-lg border border-wine-900/10 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-wine-900/50"><meta.icon size={14} /> {meta.label}</span>
                      <div className="flex gap-0.5">
                        <Button size="sm" variant="quiet" disabled={i === 0} onClick={() => moveBlock(i, -1)} aria-label="Move up"><ChevronUp size={14} /></Button>
                        <Button size="sm" variant="quiet" disabled={i === p.body.length - 1} onClick={() => moveBlock(i, 1)} aria-label="Move down"><ChevronDown size={14} /></Button>
                        <Button size="sm" variant="quiet" onClick={() => removeBlock(b.id)} aria-label="Remove block"><Trash2 size={14} /></Button>
                      </div>
                    </div>
                    {b.type === 'img' ? (
                      <div className="space-y-2">
                        <ImageManager multiple={false} label="Image" images={b.src ? [b.src] : []} onChange={(v) => setBlock(b.id, { src: v[0] || '' })} />
                        <Input value={b.text} onChange={(e) => setBlock(b.id, { text: e.target.value })} placeholder="Caption (also used as the image description)" />
                      </div>
                    ) : b.type === 'p' ? (
                      <Textarea rows={4} value={b.text} onChange={(e) => setBlock(b.id, { text: e.target.value })} placeholder="Write a paragraph…" />
                    ) : (
                      <Input value={b.text} onChange={(e) => setBlock(b.id, { text: e.target.value })} placeholder={b.type === 'h2' ? 'Section heading' : 'Subheading'} className={b.type === 'h2' ? 'font-display text-[18px]' : 'font-display text-[16px]'} />
                    )}
                  </li>
                )
              })}
            </ol>
            <div className="mt-3 flex flex-wrap gap-2">
              {BLOCKS.map(({ type, label, icon: I }) => (
                <Button key={type} size="sm" variant="ghost" onClick={() => addBlock(type)}><I size={14} /> {label}</Button>
              ))}
            </div>
          </Section>

          <Section title="Search engines" hint="Optional - defaults to the title and introduction.">
            <div className="grid gap-4">
              <Field label="SEO title" hint={`${(p.seoTitle || '').length}/60`}>
                <Input maxLength={70} value={p.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} placeholder={`${p.title || 'Post title'} | Kridhya Journal`} />
              </Field>
              <Field label="Meta description" hint={`${(p.seoDescription || '').length}/160`}>
                <Textarea rows={2} maxLength={170} value={p.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} placeholder={p.excerpt || 'A one-sentence summary shown in Google results.'} />
              </Field>
            </div>
          </Section>
        </div>

        <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <Section title="Cover image" aside={errors.cover && <span className="text-[12px] font-medium text-[#9b2335]">Required</span>}>
            <ImageManager multiple={false} label="Cover" images={p.cover ? [p.cover] : []} onChange={(v) => set('cover', v[0] || '')} />
            <Field label="Image description" hint="For accessibility" className="mt-3">
              <Input value={p.coverAlt} onChange={(e) => set('coverAlt', e.target.value)} placeholder="What the photo shows" />
            </Field>
          </Section>
          <Section title="Settings">
            <div className="grid gap-4">
              <Field label="Category">
                <Select value={p.category} onChange={(e) => set('category', e.target.value)}>
                  {[...new Set([...POST_CATEGORIES, p.category])].map((c) => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Publish date">
                <Input type="date" value={p.date} onChange={(e) => set('date', e.target.value)} />
              </Field>
              <Field label="Web address" hint={`/blog/${slugify(p.slug) || '…'}`} error={errors.slug}>
                <Input value={p.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value) }} />
              </Field>
            </div>
          </Section>
          {existing && (
            <Button variant="quiet" className="w-full text-[#9b2335] hover:bg-[#f8e3e6] hover:text-[#9b2335]" onClick={() => setDel(true)}><Trash2 size={15} /> Delete post</Button>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-wine-900/10 bg-white/95 backdrop-blur lg:left-[248px]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className="text-[13px] text-wine-900/60">{dirty ? 'You have unsaved changes' : 'No unsaved changes'}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => save('draft')}>{p.status === 'published' ? 'Unpublish' : 'Save draft'}</Button>
            <Button onClick={() => save('published')}>{existing?.status === 'published' ? 'Save changes' : 'Publish'}</Button>
          </div>
        </div>
      </div>

      <Confirm open={del} title={`Delete “${p.title}”?`} body="This removes the post from the journal and can't be undone." onConfirm={() => { deletePost(p.id); nav('/admin/journal') }} onClose={() => setDel(false)} />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
