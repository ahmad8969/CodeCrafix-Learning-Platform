import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/loaders'
import { financeService } from '@/services/finance.service'
import { courseService } from '@/services/course.service'
import { DiscountCard, money } from '@/components/finance/finance-widgets'
import { ROUTES } from '@/constants'
import { useAuth } from '@/contexts/auth-context'

const emptyPlan = {
  name: '',
  planType: 'monthly',
  course: '',
  admissionFee: 5000,
  securityFee: 0,
  registrationFee: 2000,
  tuitionFee: 45000,
  labFee: 3000,
  otherCharges: 0,
  discount: 0,
  scholarship: 0,
  taxPercent: 0,
  installmentCount: 3,
  currency: 'PKR',
  active: true,
}

export default function FeePlansPage() {
  const { user } = useAuth()
  const base = user?.role === 'super_admin' ? ROUTES.SUPER_ADMIN : ROUTES.ADMIN
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyPlan)
  const [discountForm, setDiscountForm] = useState({
    name: 'Early bird 10%',
    type: 'early_bird',
    value: 10,
    active: true,
  })

  const { data: plans, isLoading } = useQuery({
    queryKey: ['fee-plans'],
    queryFn: () => financeService.listFeePlans(),
  })
  const { data: discounts } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => financeService.listDiscounts(),
  })
  const { data: courses } = useQuery({
    queryKey: ['courses-finance'],
    queryFn: async () => {
      const res = await courseService.list({ limit: 50 })
      return res.items || res || []
    },
  })

  const savePlan = useMutation({
    mutationFn: () =>
      financeService.createFeePlan({
        ...form,
        course: form.course || undefined,
        admissionFee: Number(form.admissionFee),
        tuitionFee: Number(form.tuitionFee),
        labFee: Number(form.labFee),
        registrationFee: Number(form.registrationFee),
        securityFee: Number(form.securityFee),
        otherCharges: Number(form.otherCharges),
        discount: Number(form.discount),
        scholarship: Number(form.scholarship),
        taxPercent: Number(form.taxPercent),
        installmentCount: Number(form.installmentCount),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-plans'] })
      setForm(emptyPlan)
    },
  })

  const saveDiscount = useMutation({
    mutationFn: () =>
      financeService.upsertDiscount({ ...discountForm, value: Number(discountForm.value) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discounts'] }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Fee plans & discounts</h1>
          <p className="text-sm text-muted-foreground">One-time, monthly, weekly, and custom installments.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`${base}/finance`}>Dashboard</Link>
        </Button>
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault()
          savePlan.mutate()
        }}
      >
        <label className="text-sm lg:col-span-2">
          <span className="mb-1 block text-muted-foreground">Plan name</span>
          <input
            required
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Type</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={form.planType}
            onChange={(e) => setForm({ ...form, planType: e.target.value })}
          >
            <option value="one_time">One-time</option>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Course</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={form.course}
            onChange={(e) => setForm({ ...form, course: e.target.value })}
          >
            <option value="">Any</option>
            {(Array.isArray(courses) ? courses : []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        {[
          ['admissionFee', 'Admission fee'],
          ['registrationFee', 'Registration'],
          ['tuitionFee', 'Tuition'],
          ['labFee', 'Lab'],
          ['securityFee', 'Security'],
          ['otherCharges', 'Other'],
          ['discount', 'Plan discount'],
          ['installmentCount', 'Installments'],
        ].map(([key, label]) => (
          <label key={key} className="text-sm">
            <span className="mb-1 block text-muted-foreground">{label}</span>
            <input
              type="number"
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
        <Button className="lg:col-span-4" type="submit" disabled={savePlan.isPending}>
          Create fee plan
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(plans || []).map((p) => (
          <div key={p._id} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex gap-2">
              <Badge>{p.planType}</Badge>
              {p.active ? <Badge variant="secondary">Active</Badge> : null}
            </div>
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-sm text-muted-foreground">{p.course?.title || 'All courses'}</p>
            <p className="mt-2 text-xl font-extrabold">{money(p.totalFee, p.currency)}</p>
            <p className="text-xs text-muted-foreground">
              {p.installmentCount || p.installments?.length || 1} installment(s)
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Discount engine</h2>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            saveDiscount.mutate()
          }}
        >
          <input
            className="rounded-xl border border-border bg-background px-3 py-2"
            value={discountForm.name}
            onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
            placeholder="Name"
          />
          <select
            className="rounded-xl border border-border bg-background px-3 py-2"
            value={discountForm.type}
            onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value })}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
            <option value="early_bird">Early bird</option>
            <option value="scholarship">Scholarship</option>
            <option value="staff">Staff</option>
            <option value="sibling">Sibling</option>
          </select>
          <input
            type="number"
            className="w-24 rounded-xl border border-border bg-background px-3 py-2"
            value={discountForm.value}
            onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
          />
          <Button type="submit">Save discount</Button>
        </form>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(discounts || []).map((d) => (
            <DiscountCard key={d._id} rule={d} />
          ))}
        </div>
      </section>
    </PageTransition>
  )
}
