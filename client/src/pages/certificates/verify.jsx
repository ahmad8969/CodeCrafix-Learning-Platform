import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { certificateService } from '@/services/certificate.service'
import {
  CertificateViewer,
  QrVerificationCard,
} from '@/components/certificates/certificate-widgets'

export default function CertificateVerifyPage() {
  const { token } = useParams()
  const [params] = useSearchParams()
  const [manual, setManual] = useState(params.get('number') || '')
  const [lookup, setLookup] = useState(token || params.get('number') || '')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cert-verify', lookup],
    queryFn: () => certificateService.verify(lookup),
    enabled: Boolean(lookup),
  })

  return (
    <PageTransition className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <p className="text-sm text-muted-foreground">Public verification</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Verify a certificate</h1>
        <p className="mt-2 text-muted-foreground">
          Enter a certificate number or open a verification link. No login required.
        </p>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          setLookup(manual.trim())
          refetch()
        }}
      >
        <input
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2"
          placeholder="CC-2026-... or verification token"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <Button type="submit" disabled={isFetching}>
          Verify
        </Button>
      </form>

      {isLoading && lookup && <p className="text-sm text-muted-foreground">Checking…</p>}
      {data && <QrVerificationCard result={data} />}
      {data?.valid && (
        <CertificateViewer
          certificate={{
            ...data,
            title: data.title,
            snapshot: data.snapshot,
          }}
        />
      )}
    </PageTransition>
  )
}
