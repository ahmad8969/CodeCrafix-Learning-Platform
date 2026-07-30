import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/loaders'
import { communicationService } from '@/services/communication.service'
import { CrmKanbanBoard } from '@/components/communication/comm-widgets'

export default function CrmPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', source: 'website' })

  const { data, isLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: () => communicationService.listLeads(),
  })

  const create = useMutation({
    mutationFn: () => communicationService.createLead(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-leads'] })
      setForm({ fullName: '', email: '', phone: '', source: 'website' })
    },
  })

  const move = useMutation({
    mutationFn: ({ id, stage }) => communicationService.moveLead(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Student CRM</h1>
        <p className="text-sm text-muted-foreground">Lead → alumni pipeline with follow-ups.</p>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate()
        }}
      >
        <input
          required
          placeholder="Full name"
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <input
          placeholder="Email"
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Phone"
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="Source"
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.source}
          onChange={(e) => setForm({ ...form, source: e.target.value })}
        />
        <Button type="submit">Add lead</Button>
      </form>

      <CrmKanbanBoard
        board={data?.board || {}}
        stages={data?.stages || []}
        onMove={(id, stage) => move.mutate({ id, stage })}
      />
    </PageTransition>
  )
}
