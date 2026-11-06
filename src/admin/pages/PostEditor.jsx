import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bold, CalendarClock, ChevronDown, ChevronUp, ExternalLink, Heading2, Heading3, Image as ImageIcon, Italic, Link2, Pilcrow, Quote, Trash2 } from 'lucide-react'
import { POST_CATEGORIES, isScheduled, newPost, readTime, slugify, uid, useAdmin } from '../store'
import { plainText } from '../../lib/richtext'
import { Button, Confirm, Field, ImageManager, Input, PageHeader, Pill, Section, Select, StatusPill, Textarea, Toast } from '../ui'

const BLOCKS = [
  { type: 'h2', label: 'Heading', icon: Heading2 },
  { type: 'h3', label: 'Subheading', icon: Heading3 },
  { type: 'p', label: 'Paragraph', icon: Pilcrow },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'img', label: 'Image', icon: ImageIcon },
]

const fmtWhen = (v) => (v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '')

// Paragraph with a small formatting toolbar: wraps the selected text in **bold**, *italic* or [link](url).
function RichParagraph({ block, onChange }) {
  const ref = useRef(null)
  const [linking, setLinking] = useState(false)
  const [url, setUrl] = useState('')
  const wrap = (before, after = before, placeholder = 'text') => {
    const el = ref.current
    const { selectionStart: a, selectionEnd: b, value } = el
    const sel = value.slice(a, b) || placeholder
    onChange({ text: value.slice(0, a) + before + sel + after + value.slice(b) })
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + sel.length) })
  }
  const addLink = () => {
    if (url.trim()) wrap('[', `](${url.trim()})`, 'link text')
    setLinking(false)
    setUrl('')
  }
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1">
        <Button size="sm" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => wrap('**')} aria-label="Bold" title="Bold"><Bold size={14} /></Button>
        <Button size="sm" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => wrap('*')} aria-label="Italic" title="Italic"><Italic size={14} /></Button>
        <Button size="sm" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => setLinking((v) => !v)} aria-label="Add link" title="Link"><Link2 size={14} /></Button>
        <Select value={block.size || 'md'} onChange={(e) => onChange({ size: e.target.value })} aria-label="Text size" className="!h-8 !w-auto text-[12.5px]">
          <option value="sm">Small text</option>
          <option value="md">Regular text</option>
          <option value="lg">Large text</option>
        </Select>
      </div>
      {linking && (
        <div className="mb-2 flex gap-2">
          <Input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())} placeholder="Link address, e.g. /shop or https://…" />
          <Button size="sm" onMouseDown={(e) => e.preventDefault()} onClick={addLink}>Add</Button>
        </div>
      )}
      <Textarea ref={ref} rows={4} value={block.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="Write a paragraph… Select words, then press B or I to style them."
        className={block.size === 'lg' ? 'font-display text-[17px]' : block.size === 'sm' ? 'text-[13px]' : ''} />
    </div>
  )
}

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
  const addBlock = (type) => setP((x) => ({ ...x, body: [...x.body, { id: uid(), type, text: '', src: '', alt: '', cite: '', size: 'md' }] }))
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
      if (post.cover && !(post.coverAlt || '').trim()) e.coverAlt = 'Describe the cover photo before publishing.'
      post.body.forEach((b) => { if (b.type === 'img' && b.src && !(b.alt || '').trim()) e[`alt-${b.id}`] = 'Add alt text before publishing.' })
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
    setToast(status !== 'published' ? 'Saved as draft' : isScheduled(next) ? `Scheduled for ${fmtWhen(next.publishAt)}` : 'Saved and published')
    if (!existing) nav(`/admin/journal/${next.id}`, { replace: true })
  }

  return (
    <div className="space-y-5 pb-24">
      <Link to="/admin/journal" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-wine-900/60 hover:text-wine-900"><ArrowLeft size={14} /> Journal</Link>
      <PageHeader title={existing ? p.title || 'Untitled post' : 'New post'} subtitle={`${readTime(p)} · ${p.body.length} blocks`}>
        {isScheduled(p) ? <Pill tone="gold">Scheduled · {fmtWhen(p.publishAt)}</Pill> : <StatusPill status={p.status} />}
        {existing?.status === 'published' && !isScheduled(existing) && (
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
                  <li key={b.id} className="border border-gold/30 bg-ivory/70 p-3">
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
                        <Field label="Alt text" hint="Describes the photo for Google and screen readers" error={errors[`alt-${b.id}`]}>
                          <Input value={b.alt || ''} onChange={(e) => setBlock(b.id, { alt: e.target.value })} placeholder="e.g. Rose gold infinity necklace on ivory satin" />
                        </Field>
                        <Input value={b.text} onChange={(e) => setBlock(b.id, { text: e.target.value })} placeholder="Caption shown under the photo (optional)" />
                      </div>
                    ) : b.type === 'p' ? (
                      <RichParagraph block={b} onChange={(patch) => setBlock(b.id, patch)} />
                    ) : b.type === 'quote' ? (
                      <div className="space-y-2">
                        <Textarea rows={3} value={b.text} onChange={(e) => setBlock(b.id, { text: e.target.value })} placeholder="A line worth highlighting…" className="font-display text-[17px]" />
                        <Input value={b.cite || ''} onChange={(e) => setBlock(b.id, { cite: e.target.value })} placeholder="Who said it (optional)" />
                      </div>
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

          <Section title="SEO" hint="How the post appears on Google. Optional - defaults to the title and introduction.">
            <div className="mb-4 border border-wine-900/10 bg-white p-4">
              <p className="truncate text-[12.5px] text-[#4d5156]">kridhyabydevanshi.com › blog › {slugify(p.slug || p.title) || 'post'}</p>
              <p className="mt-0.5 truncate text-[18px] leading-snug text-[#1a0dab]">{p.seoTitle || `${p.title || 'Post title'} | Kridhya Journal`}</p>
              <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-[#4d5156]">{p.seoDescription || plainText(p.excerpt) || 'Your meta description appears here.'}</p>
            </div>
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
            <Field label="Cover alt text" hint="For Google and screen readers" error={errors.coverAlt} className="mt-3">
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
              <Field label="Publish on" hint="Pick a future time to schedule">
                <Input type="datetime-local" value={p.publishAt || `${p.date}T09:00`} onChange={(e) => setP((x) => ({ ...x, publishAt: e.target.value, date: e.target.value.slice(0, 10) }))} />
              </Field>
              {p.publishAt && new Date(p.publishAt) > new Date() && (
                <p className="-mt-2 flex items-center gap-1.5 text-[12.5px] text-gold-deep"><CalendarClock size={14} /> Goes live automatically on {fmtWhen(p.publishAt)}</p>
              )}
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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/30 bg-ivory/95 backdrop-blur lg:left-[248px]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className="text-[13px] text-wine-900/60">{dirty ? 'You have unsaved changes' : 'No unsaved changes'}</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => save('draft')}>{p.status === 'published' ? 'Unpublish' : 'Save draft'}</Button>
            <Button onClick={() => save('published')}>{p.publishAt && new Date(p.publishAt) > new Date() ? 'Schedule' : existing?.status === 'published' ? 'Save changes' : 'Publish'}</Button>
          </div>
        </div>
      </div>

      <Confirm open={del} title={`Delete “${p.title}”?`} body="This removes the post from the journal and can't be undone." onConfirm={() => { deletePost(p.id); nav('/admin/journal') }} onClose={() => setDel(false)} />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
