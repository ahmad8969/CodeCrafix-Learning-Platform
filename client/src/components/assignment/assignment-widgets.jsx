import { useCallback, useEffect, useState } from 'react'
import { Play, Send, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MonacoEditorPane } from '@/components/workspace/monaco-editor-pane'
import { FileExplorer, EditorTabs } from '@/components/workspace/file-explorer'
import { PreviewPanel } from '@/components/workspace/preview-panel'
import { assignmentService } from '@/services/assignment.service'
import { notify, getErrorMessage } from '@/utils/error'
import { cn } from '@/lib/utils'

/** Drag-and-drop file uploader with progress and retry. */
export function AssignmentFileUploader({
  onUploaded,
  maxFiles = 10,
  accept,
  className,
}) {
  const [dragging, setDragging] = useState(false)
  const [queue, setQueue] = useState([])
  const [uploading, setUploading] = useState(false)

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, maxFiles)
    if (!files.length) return
    setUploading(true)
    setQueue(files.map((f) => ({ name: f.name, progress: 10, error: null })))
    try {
      const fd = new FormData()
      files.forEach((f) => fd.append('files', f))
      setQueue((q) => q.map((x) => ({ ...x, progress: 60 })))
      const result = await assignmentService.upload(fd)
      setQueue((q) => q.map((x) => ({ ...x, progress: 100 })))
      onUploaded?.(result.files || [])
      notify.success(`Uploaded ${result.files?.length || 0} file(s)`)
    } catch (e) {
      setQueue((q) => q.map((x) => ({ ...x, error: getErrorMessage(e) })))
      notify.error(getErrorMessage(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          uploadFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition',
          dragging ? 'border-primary bg-primary/10' : 'border-border bg-muted/20'
        )}
      >
        <Upload className="mb-2 size-6 text-primary" />
        <p className="text-sm font-medium">Drag & drop files here</p>
        <p className="mt-1 text-xs text-muted-foreground">or choose from your device</p>
        <label className="mt-3">
          <input
            type="file"
            multiple
            accept={accept}
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
            disabled={uploading}
          />
          <span className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-border px-3 text-sm hover:bg-muted">
            Browse files
          </span>
        </label>
      </div>
      {queue.length > 0 && (
        <ul className="space-y-2 text-xs">
          {queue.map((item) => (
            <li key={item.name} className="rounded-lg border border-border px-3 py-2">
              <div className="flex justify-between gap-2">
                <span className="truncate">{item.name}</span>
                <span>{item.error ? 'Failed' : `${item.progress}%`}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full bg-primary transition-all', item.error && 'bg-destructive')}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              {item.error && <p className="mt-1 text-destructive">{item.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function AssignmentTimeline({ events = [], status }) {
  const steps = ['published', 'started', 'submitted', 'reviewed', 'approved', 'completed']
  const mapStatus = {
    draft: 'started',
    submitted: 'submitted',
    under_review: 'reviewed',
    approved: 'approved',
    rejected: 'reviewed',
    needs_revision: 'reviewed',
  }
  const current = mapStatus[status] || status || 'started'
  const idx = Math.max(0, steps.indexOf(current))

  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((step, i) => (
        <li
          key={step}
          className={cn(
            'rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide',
            i <= idx
              ? 'border-primary/40 bg-primary/15 text-primary'
              : 'border-border text-muted-foreground'
          )}
        >
          {step}
        </li>
      ))}
      {events?.length > 0 && (
        <li className="w-full pt-2 text-xs text-muted-foreground">
          Latest: {events[events.length - 1]?.status} ·{' '}
          {events[events.length - 1]?.at
            ? new Date(events[events.length - 1].at).toLocaleString()
            : ''}
        </li>
      )}
    </ol>
  )
}

export function Countdown({ dueAt }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    if (!dueAt) {
      setLabel('No due date')
      return undefined
    }
    const tick = () => {
      const diff = new Date(dueAt) - Date.now()
      if (diff <= 0) {
        setLabel('Past due')
        return
      }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setLabel(`${d}d ${h}h ${m}m left`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [dueAt])
  return <span className="text-sm font-semibold text-primary">{label}</span>
}

export function CodingAssignmentLab({ assignment, onSubmit, submitting }) {
  const [files, setFiles] = useState(assignment.starterFiles || [])
  const [activeFile, setActiveFile] = useState(
    assignment.starterFiles?.find((f) => f.entry)?.path ||
      assignment.starterFiles?.[0]?.path ||
      'index.html'
  )
  const [previewKey, setPreviewKey] = useState(0)
  const [device, setDevice] = useState('desktop')
  const [logs, setLogs] = useState([])

  useEffect(() => {
    setFiles(assignment.starterFiles || [])
  }, [assignment._id])

  const active = files.find((f) => f.path === activeFile) || files[0]
  const onConsoleMessage = useCallback((msg) => {
    setLogs((prev) => [...prev.slice(-80), msg])
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#0b1220]">
      <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2">
        <Button size="sm" variant="outline" onClick={() => setPreviewKey((k) => k + 1)}>
          <Play className="size-3.5" /> Run
        </Button>
        <Button
          size="sm"
          disabled={submitting}
          onClick={() => onSubmit?.({ codeSnapshot: files })}
        >
          <Send className="size-3.5" /> {submitting ? 'Submitting…' : 'Submit code'}
        </Button>
      </div>
      <div className="grid min-h-[400px] grid-cols-[120px_minmax(0,1fr)]">
        <FileExplorer files={files} activeFile={activeFile} onSelect={setActiveFile} />
        <div className="flex min-w-0 flex-col">
          <EditorTabs files={files} activeFile={activeFile} onSelect={setActiveFile} />
          <div className="grid flex-1 lg:grid-cols-2">
            <MonacoEditorPane
              value={active?.content || ''}
              language={active?.language || 'html'}
              onChange={(v) =>
                setFiles((prev) =>
                  prev.map((f) => (f.path === activeFile ? { ...f, content: v } : f))
                )
              }
              className="h-[240px] rounded-none border-0 lg:h-full"
            />
            <PreviewPanel
              files={files}
              previewKey={previewKey}
              onConsoleMessage={onConsoleMessage}
              onRefresh={() => setPreviewKey((k) => k + 1)}
              device={device}
              onDeviceChange={setDevice}
            />
          </div>
        </div>
      </div>
      <div className="max-h-24 overflow-auto border-t border-border p-2 font-mono text-[11px] text-slate-300">
        {logs.map((l, i) => (
          <p key={i}>{(l.args || []).join(' ')}</p>
        ))}
      </div>
    </div>
  )
}

export function SubmissionForm({ assignment, onDone, mode = 'submit' }) {
  const [files, setFiles] = useState([])
  const [githubUrl, setGithubUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [richText, setRichText] = useState('')
  const [busy, setBusy] = useState(false)
  const type = assignment.type

  const removeFile = (url) => setFiles((prev) => prev.filter((f) => f.url !== url))

  const submit = async (extra = {}) => {
    setBusy(true)
    try {
      let result
      if (type === 'coding') {
        result = await assignmentService.submitJson(assignment._id, {
          codeSnapshot: extra.codeSnapshot || [],
        })
      } else if (files.length) {
        const fd = new FormData()
        // files already uploaded — send metadata as JSON via filesJson, empty multipart
        fd.append('filesJson', JSON.stringify(files))
        if (githubUrl) fd.append('githubUrl', githubUrl)
        if (externalUrl) fd.append('externalUrl', externalUrl)
        if (richText) fd.append('richText', richText)
        result =
          mode === 'resubmit'
            ? await assignmentService.resubmit(assignment._id, fd)
            : await assignmentService.submit(assignment._id, fd)
      } else {
        const payload = { githubUrl, externalUrl, richText, files: [] }
        result = await assignmentService.submitJson(assignment._id, payload)
      }
      notify.success('Submitted')
      onDone?.(result)
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (type === 'coding') {
    return (
      <CodingAssignmentLab
        assignment={assignment}
        submitting={busy}
        onSubmit={(extra) => submit(extra)}
      />
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      {[
        'file_upload',
        'multiple_files',
        'pdf_submission',
        'zip_submission',
        'image_submission',
        'video_submission',
        'project',
      ].includes(type) && (
        <>
          <AssignmentFileUploader onUploaded={(f) => setFiles((prev) => [...prev, ...f])} />
          <ul className="space-y-1 text-xs">
            {files.map((f) => (
              <li key={f.url} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2 py-1.5">
                <a href={f.url} target="_blank" rel="noreferrer" className="truncate text-primary">
                  {f.originalName}
                </a>
                <button type="button" onClick={() => removeFile(f.url)}>
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {type === 'github_repository' && (
        <div className="grid gap-2">
          <label className="text-xs font-semibold">GitHub repository URL</label>
          <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
        </div>
      )}

      {['external_link', 'google_drive_link'].includes(type) && (
        <div className="grid gap-2">
          <label className="text-xs font-semibold">External URL</label>
          <Input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
        </div>
      )}

      {type === 'rich_text' && (
        <div className="grid gap-2">
          <label className="text-xs font-semibold">Your submission</label>
          <Textarea rows={8} value={richText} onChange={(e) => setRichText(e.target.value)} />
        </div>
      )}

      <Button onClick={() => submit()} disabled={busy}>
        <Send className="size-4" /> {busy ? 'Submitting…' : mode === 'resubmit' ? 'Resubmit' : 'Submit'}
      </Button>
    </div>
  )
}
