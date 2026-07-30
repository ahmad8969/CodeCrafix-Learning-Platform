import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/loaders'
import { certificateService } from '@/services/certificate.service'
import { CertificateTemplateDesigner } from '@/components/certificates/certificate-widgets'

const empty = {
  name: 'Course Completion',
  type: 'course',
  titleText: 'Certificate of Completion',
  bodyText: 'This is to certify that {{studentName}} has successfully completed {{courseName}}.',
  primaryColor: '#0d9488',
  accentColor: '#134e4a',
  showQr: true,
  showSeal: true,
  active: true,
  isDefault: true,
  signatures: [{ name: 'Director', title: 'CodeCrafters Institute', imageUrl: '' }],
}

export default function CertificateTemplatesPage() {
  const qc = useQueryClient()
  const [draft, setDraft] = useState(empty)
  const [editingId, setEditingId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['cert-templates'],
    queryFn: () => certificateService.listTemplates(),
  })

  const save = useMutation({
    mutationFn: () =>
      editingId
        ? certificateService.updateTemplate(editingId, draft)
        : certificateService.createTemplate(draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cert-templates'] })
      setEditingId(null)
      setDraft(empty)
    },
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Certificate templates</h1>
        <p className="text-sm text-muted-foreground">Design logos, seals, signatures, and QR layout.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(data || []).map((t) => (
          <button
            key={t._id}
            type="button"
            className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary"
            onClick={() => {
              setEditingId(t._id)
              setDraft(t)
            }}
          >
            {t.name} {t.isDefault && <Badge className="ml-1">default</Badge>}
          </button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingId(null)
            setDraft(empty)
          }}
        >
          New template
        </Button>
      </div>

      <CertificateTemplateDesigner value={draft} onChange={setDraft} />
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {editingId ? 'Update template' : 'Create template'}
      </Button>
    </PageTransition>
  )
}
