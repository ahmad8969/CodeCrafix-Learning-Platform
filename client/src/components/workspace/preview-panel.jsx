import { useEffect, useMemo, useRef } from 'react'
import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildPreviewDocument } from '@/lib/workspace-preview'
import { cn } from '@/lib/utils'

const DEVICES = {
  desktop: { label: 'Desktop', width: '100%', icon: Monitor },
  tablet: { label: 'Tablet', width: 768, icon: Tablet },
  mobile: { label: 'Mobile', width: 390, icon: Smartphone },
}

export function DeviceSwitcher({ value = 'desktop', onChange, className }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Object.entries(DEVICES).map(([key, cfg]) => {
        const Icon = cfg.icon
        return (
          <Button
            key={key}
            size="sm"
            variant={value === key ? 'secondary' : 'ghost'}
            onClick={() => onChange?.(key)}
            title={cfg.label}
          >
            <Icon className="size-3.5" />
          </Button>
        )
      })}
    </div>
  )
}

export function PreviewPanel({
  files,
  previewKey,
  onConsoleMessage,
  onRefresh,
  device = 'desktop',
  onDeviceChange,
  className,
}) {
  const iframeRef = useRef(null)
  const srcDoc = useMemo(() => buildPreviewDocument(files), [files, previewKey])
  const width = DEVICES[device]?.width || '100%'

  useEffect(() => {
    const handler = (event) => {
      if (event.data?.source !== 'codecrafters-preview') return
      onConsoleMessage?.(event.data)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onConsoleMessage])

  const openExternal = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={cn('flex h-full flex-col bg-[#080e1a]', className)}>
      <div className="flex items-center justify-between border-b border-border px-2 py-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Preview
        </p>
        <div className="flex items-center gap-1">
          <DeviceSwitcher value={device} onChange={onDeviceChange} />
          <Button size="sm" variant="ghost" onClick={openExternal} title="Open in new window">
            <ExternalLink className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRefresh?.()}
            title="Refresh"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex flex-1 items-start justify-center overflow-auto bg-[radial-gradient(circle_at_top,#132238,#080e1a)] p-3">
        <iframe
          key={previewKey}
          ref={iframeRef}
          title="Live preview"
          sandbox="allow-scripts"
          srcDoc={srcDoc}
          className="h-full min-h-[240px] rounded-lg border border-border bg-white shadow-elevation-2"
          style={{ width: typeof width === 'number' ? width : '100%', maxWidth: '100%' }}
        />
      </div>
    </div>
  )
}
