import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { POST_CATEGORIES, isScheduled, readTime, useAdmin } from '../store'
import { Button, Card, Confirm, Empty, Input, PageHeader, Pill, Select, StatusPill, Toast } from '../ui'

export default function Posts() {
  const { data, deletePost } = useAdmin()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [del, setDel] = useState(null)
  const [toast, setToast] = useState('')
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return [...data.posts]
      .filter((p) => (cat === 'all' || p.category === cat) && (!t || `${p.title} ${p.excerpt}`.toLowerCase().includes(t)))
      .sort((a, b) => (b.publishAt || b.date).localeCompare(a.publishAt || a.date))
  }, [data.posts, q, cat])

  return (
    <div className="space-y-5">
      <PageHeader title="Journal" subtitle={`${data.posts.length} posts · ${data.posts.filter((p) => p.status === 'published').length} published`}>
        <Link to="/admin/journal/new"><Button><Plus size={15} /> New post</Button></Link>
      </PageHeader>
      <Card className="p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
          <label className="relative">
            <span className="sr-only">Search posts</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-wine-900/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts" className="pl-9" />
          </label>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {[...new Set([...POST_CATEGORIES, ...data.posts.map((p) => p.category)])].map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>
      </Card>
      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <Empty icon={BookOpen} title={data.posts.length ? 'No posts match' : 'No posts yet'} action={<Link to="/admin/journal/new"><Button size="sm"><Plus size={14} /> Write a post</Button></Link>} />
        ) : (
          <ul className="divide-y divide-wine-900/10">
            {list.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-4 py-3 hover:bg-wine-900/[0.02] sm:px-5">
                <button type="button" onClick={() => nav(`/admin/journal/${p.id}`)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                  <img src={p.cover || '/images/generated/satin-beige.webp'} alt="" className="h-14 w-20 shrink-0 bg-cream object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-semibold hover:underline">{p.title || 'Untitled post'}</span>
                    <span className="mt-0.5 block truncate text-[12.5px] text-wine-900/55">{p.category} · {new Date(p.publishAt || p.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {readTime(p)}</span>
                  </span>
                </button>
                {isScheduled(p) ? <Pill tone="gold">Scheduled</Pill> : <StatusPill status={p.status} />}
                <div className="flex gap-1">
                  <Button size="sm" variant="quiet" onClick={() => nav(`/admin/journal/${p.id}`)} aria-label={`Edit ${p.title}`}><Pencil size={14} /></Button>
                  <Button size="sm" variant="quiet" onClick={() => setDel(p)} aria-label={`Delete ${p.title}`}><Trash2 size={14} /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Confirm open={!!del} title={`Delete “${del?.title}”?`} body="This removes the post from the journal and can't be undone." onConfirm={() => { deletePost(del.id); setToast('Post deleted') }} onClose={() => setDel(null)} />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  )
}
