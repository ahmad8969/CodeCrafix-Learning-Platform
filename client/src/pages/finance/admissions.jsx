import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/loaders'
import { financeService } from '@/services/finance.service'
import { courseService } from '@/services/course.service'
import api from '@/services/api'
import { ROUTES } from '@/constants'
import { useAuth } from '@/contexts/auth-context'

const unwrap = (response) => response.data?.data ?? response.data

export default function AdmissionsPage() {
  const { user } = useAuth()
  const base = user?.role === 'super_admin' ? ROUTES.SUPER_ADMIN : ROUTES.ADMIN
  const qc = useQueryClient()
  const [form, setForm] = useState({
    student: '',
    course: '',
    batch: '',
    feePlan: '',
    type: 'new',
    session: '2026',
    referralSource: '',
    remarks: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admissions'],
    queryFn: () => financeService.listAdmissions({ limit: 50 }),
  })
  const { data: courses } = useQuery({
    queryKey: ['courses-finance'],
    queryFn: async () => {
      const res = await courseService.list({ limit: 50 })
      return res.items || res || []
    },
  })
  const { data: students } = useQuery({
    queryKey: ['students-finance'],
    queryFn: async () => unwrap(await api.get('/users/students')),
  })
  const { data: plans } = useQuery({
    queryKey: ['fee-plans'],
    queryFn: () => financeService.listFeePlans({ active: true }),
  })

  const create = useMutation({
    mutationFn: () =>
      financeService.createAdmission({
        ...form,
        batch: form.batch || undefined,
        feePlan: form.feePlan || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions'] })
      setForm((f) => ({ ...f, remarks: '', referralSource: '' }))
    },
  })

  const approve = useMutation({
    mutationFn: (id) => financeService.approveAdmission(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions'] }),
  })
  const reject = useMutation({
    mutationFn: (id) => financeService.rejectAdmission(id, 'Rejected by admin'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admissions'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Admissions</h1>
          <p className="text-sm text-muted-foreground">New, re-admission, transfer, and online (ready).</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`${base}/finance`}>Dashboard</Link>
        </Button>
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate()
        }}
      >
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Student</span>
          <select
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={form.student}
            onChange={(e) => setForm({ ...form, student: e.target.value })}
          >
            <option value="">Select</option>
            {(Array.isArray(students) ? students : []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.fullName} ({s.email})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Course</span>
          <select
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={form.course}
            onChange={(e) => setForm({ ...form, course: e.target.value })}
          >
            <option value="">Select</option>
            {(Array.isArray(courses) ? courses : []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Fee plan</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={form.feePlan}
            onChange={(e) => setForm({ ...form, feePlan: e.target.value })}
          >
            <option value="">Select</option>
            {(plans || []).map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.totalFee} {p.currency})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Type</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="new">New</option>
            <option value="re_admission">Re-admission</option>
            <option value="transfer">Transfer</option>
            <option value="online">Online</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Session</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={form.session}
            onChange={(e) => setForm({ ...form, session: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Referral</span>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={form.referralSource}
            onChange={(e) => setForm({ ...form, referralSource: e.target.value })}
          />
        </label>
        <Button className="sm:col-span-2 lg:col-span-3" type="submit" disabled={create.isPending}>
          Create admission
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((a) => (
              <tr key={a._id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{a.admissionNumber}</td>
                <td className="px-3 py-2">{a.student?.fullName}</td>
                <td className="px-3 py-2">{a.course?.title}</td>
                <td className="px-3 py-2">
                  <Badge>{a.status}</Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {a.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => approve.mutate(a._id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reject.mutate(a._id)}>
                          Reject
                        </Button>
                      </>
                    )}
                    {a.feeAccount && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`${base}/finance/accounts/${a.feeAccount}`}>Ledger</Link>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageTransition>
  )
}
