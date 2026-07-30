import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/loaders'
import { communicationService } from '@/services/communication.service'
import { ForumThreadCard, ReplyEditor } from '@/components/communication/comm-widgets'
import { courseService } from '@/services/course.service'
import { ROUTES } from '@/constants'
import { useAuth } from '@/contexts/auth-context'

function basePath(role) {
  if (role === 'student') return ROUTES.STUDENT
  if (role === 'teacher') return ROUTES.TEACHER
  if (role === 'super_admin') return ROUTES.SUPER_ADMIN
  return ROUTES.ADMIN
}

export default function ForumsPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const qc = useQueryClient()
  const [form, setForm] = useState({ course: '', title: '', body: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['forums'],
    queryFn: () => communicationService.listThreads({ limit: 40 }),
  })
  const { data: courses } = useQuery({
    queryKey: ['courses-forums'],
    queryFn: async () => {
      const res = await courseService.list({ limit: 50 })
      return res.items || res || []
    },
  })

  const create = useMutation({
    mutationFn: () => communicationService.createThread(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forums'] })
      setForm({ course: '', title: '', body: '' })
    },
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Discussion forums</h1>
        <p className="text-sm text-muted-foreground">Course → module → week → topic threads.</p>
      </div>

      <form
        className="grid gap-2 rounded-2xl border border-border p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate()
        }}
      >
        <select
          required
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.course}
          onChange={(e) => setForm({ ...form, course: e.target.value })}
        >
          <option value="">Course</option>
          {(Array.isArray(courses) ? courses : []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
        <input
          placeholder="Title"
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          required
          placeholder="Ask a question…"
          className="min-h-24 rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <Button className="sm:col-span-2" type="submit" disabled={create.isPending}>
          Start thread
        </Button>
      </form>

      <div className="grid gap-3">
        {(data?.items || []).map((t) => (
          <ForumThreadCard key={t._id} item={t} href={`${base}/forums/${t._id}`} />
        ))}
      </div>
    </PageTransition>
  )
}

export function ForumThreadPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const base = basePath(user?.role)
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['forum-thread', id],
    queryFn: () => communicationService.getThread(id),
  })

  const reply = useMutation({
    mutationFn: (payload) => communicationService.reply(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-thread', id] }),
  })
  const like = useMutation({
    mutationFn: (postId) => communicationService.like(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-thread', id] }),
  })
  const best = useMutation({
    mutationFn: (replyId) => communicationService.bestAnswer(id, replyId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-thread', id] }),
  })

  if (isLoading) return <PageLoader />
  const thread = data?.thread

  return (
    <PageTransition className="space-y-6">
      <Button variant="ghost" asChild className="px-0">
        <Link to={`${base}/forums`}>← Forums</Link>
      </Button>
      <div className="rounded-2xl border border-border p-4">
        <div className="mb-2 flex gap-2">
          {thread?.pinned && <Badge>Pinned</Badge>}
          {thread?.locked && <Badge variant="outline">Locked</Badge>}
        </div>
        <h1 className="text-2xl font-extrabold">{thread?.title || 'Discussion'}</h1>
        <p className="mt-2 whitespace-pre-wrap">{thread?.body}</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => like.mutate(thread._id)}>
            Like ({thread?.likes?.length || 0})
          </Button>
          <Button size="sm" variant="outline" onClick={() => communicationService.follow(id)}>
            Follow
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold">Replies</h2>
        {(data?.replies || []).map((r) => (
          <div key={r._id} className="rounded-xl border border-border p-3">
            <div className="mb-1 flex gap-2">
              {r.bestAnswer && <Badge>Best answer</Badge>}
              <span className="text-xs text-muted-foreground">{r.author?.fullName}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{r.body}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => like.mutate(r._id)}>
                Like ({r.likes?.length || 0})
              </Button>
              <Button size="sm" variant="ghost" onClick={() => best.mutate(r._id)}>
                Mark best
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!thread?.locked && <ReplyEditor onSubmit={(p) => reply.mutate(p)} />}
    </PageTransition>
  )
}
