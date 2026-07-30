import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/loaders'
import { financeService } from '@/services/finance.service'
import {
  FeeCard,
  LedgerTable,
  PaymentDialog,
  ReceiptViewer,
  StudentLedgerTimeline,
  money,
} from '@/components/finance/finance-widgets'
import { ROUTES } from '@/constants'
import { useAuth } from '@/contexts/auth-context'

export default function StudentFeesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-ledger'],
    queryFn: () => financeService.myLedger(),
  })
  const { data: receipts } = useQuery({
    queryKey: ['my-receipts'],
    queryFn: () => financeService.listReceipts({ limit: 20 }),
  })

  if (isLoading) return <PageLoader />

  const accounts = Array.isArray(data) ? data : []
  const outstanding = accounts.reduce((s, a) => s + (a.remainingAmount || 0), 0)

  return (
    <PageTransition className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Student portal</p>
        <h1 className="text-2xl font-extrabold">My fees</h1>
        <p className="text-muted-foreground">
          Outstanding balance: <strong>{money(outstanding)}</strong>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => (
          <FeeCard key={a._id} account={a} href={`${ROUTES.STUDENT}/fees/accounts/${a._id}`} />
        ))}
        {!accounts.length && <p className="text-sm text-muted-foreground">No fee accounts yet.</p>}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Receipts</h2>
        <div className="space-y-2 text-sm">
          {(receipts || []).map((r) => (
            <Link
              key={r._id}
              to={`${ROUTES.STUDENT}/fees/receipts/${r._id}`}
              className="flex justify-between rounded-xl border border-border px-3 py-2 hover:border-primary"
            >
              <span>
                {r.receiptNumber} · {r.type}
              </span>
              <span>{money(r.amount, r.currency)}</span>
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Online payment gateways (JazzCash, EasyPaisa, Stripe) are architecture-ready.
        </p>
      </section>
    </PageTransition>
  )
}

export function FeeAccountDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [payOpen, setPayOpen] = useState(false)
  const base =
    user?.role === 'student'
      ? ROUTES.STUDENT
      : user?.role === 'teacher'
        ? ROUTES.TEACHER
        : user?.role === 'super_admin'
          ? ROUTES.SUPER_ADMIN
          : ROUTES.ADMIN

  const { data, isLoading } = useQuery({
    queryKey: ['fee-account', id],
    queryFn: () => financeService.getAccount(id),
  })

  const pay = useMutation({
    mutationFn: (payload) =>
      financeService.recordPayment({ ...payload, feeAccountId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-account', id] })
      setPayOpen(false)
    },
  })

  if (isLoading) return <PageLoader />
  if (!data) return <p>Not found</p>

  const canCollect = ['admin', 'super_admin'].includes(user?.role)

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Button variant="ghost" asChild className="mb-2 px-0">
            <Link to={user?.role === 'student' ? `${ROUTES.STUDENT}/fees` : `${base}/finance`}>
              ← Back
            </Link>
          </Button>
          <h1 className="text-2xl font-extrabold">{data.course?.title}</h1>
          <p className="text-sm text-muted-foreground">{data.student?.fullName}</p>
        </div>
        {canCollect && (
          <Button onClick={() => setPayOpen(true)}>Collect payment</Button>
        )}
      </div>

      <FeeCard account={data} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold">Ledger</h2>
          <LedgerTable entries={[...(data.ledger || [])].reverse()} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold">Timeline</h2>
          <StudentLedgerTimeline entries={[...(data.ledger || [])].reverse().slice(0, 20)} />
        </div>
      </div>

      <PaymentDialog
        open={payOpen}
        onClose={() => setPayOpen(false)}
        loading={pay.isPending}
        defaultAmount={data.remainingAmount}
        onSubmit={(payload) => pay.mutate(payload)}
      />
    </PageTransition>
  )
}

export function ReceiptDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['receipt', id],
    queryFn: () => financeService.getReceipt(id),
  })
  if (isLoading) return <PageLoader />
  return (
    <PageTransition className="space-y-4">
      <h1 className="text-2xl font-extrabold">Receipt</h1>
      <ReceiptViewer receipt={data} />
    </PageTransition>
  )
}

export function ReceiptVerifyPage() {
  const { token } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['receipt-verify', token],
    queryFn: () => financeService.verifyReceipt(token),
    enabled: Boolean(token),
  })
  if (isLoading) return <PageLoader />
  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-10">
      <h1 className="text-2xl font-extrabold">
        {data?.valid ? 'Receipt verified' : 'Invalid receipt'}
      </h1>
      {data?.valid && (
        <ReceiptViewer
          receipt={{
            receiptNumber: data.receiptNumber,
            type: data.type,
            amount: data.amount,
            currency: data.currency,
            issuedAt: data.issuedAt,
            student: { fullName: data.studentName },
            course: { title: data.courseName },
            snapshot: data.snapshot,
            qrPayload: data.snapshot?.verificationUrl,
          }}
        />
      )}
      {!data?.valid && <p className="text-muted-foreground">{data?.message || 'Not found'}</p>}
    </div>
  )
}
