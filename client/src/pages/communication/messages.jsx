import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/loaders'
import { communicationService } from '@/services/communication.service'
import { ConversationList, ChatWindow } from '@/components/communication/comm-widgets'
import api from '@/services/api'
import { useAuth } from '@/contexts/auth-context'

const unwrap = (r) => r.data?.data ?? r.data

export default function MessagesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [active, setActive] = useState(null)
  const [peerId, setPeerId] = useState('')

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => communicationService.conversations(),
  })
  const { data: messages } = useQuery({
    queryKey: ['messages', active?._id],
    queryFn: () => communicationService.messages(active._id),
    enabled: Boolean(active?._id),
  })
  const { data: directory } = useQuery({
    queryKey: ['msg-directory'],
    queryFn: async () => {
      try {
        if (user?.role === 'student') return unwrap(await api.get('/users/instructors'))
        return unwrap(await api.get('/users/students'))
      } catch {
        return []
      }
    },
  })

  const send = useMutation({
    mutationFn: (payload) => communicationService.sendMessage(active._id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', active._id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const start = useMutation({
    mutationFn: () => communicationService.startDirect(peerId),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setActive(conv)
    },
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Messages</h1>
        <p className="text-sm text-muted-foreground">Direct, group, batch, and course chats.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
        >
          <option value="">Start chat with…</option>
          {(Array.isArray(directory) ? directory : []).map((u) => (
            <option key={u._id} value={u._id}>
              {u.fullName} ({u.role || 'student'})
            </option>
          ))}
        </select>
        <Button disabled={!peerId || start.isPending} onClick={() => start.mutate()}>
          Open chat
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <ConversationList
          items={conversations || []}
          activeId={active?._id}
          onSelect={(c) => {
            setActive(c)
            communicationService.markRead(c._id).catch(() => {})
          }}
        />
        {active ? (
          <ChatWindow messages={messages || []} onSend={(p) => send.mutate(p)} loading={send.isPending} />
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>
    </PageTransition>
  )
}
