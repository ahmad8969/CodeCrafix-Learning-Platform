import { useCallback, useRef, useState } from 'react'
import JSZip from 'jszip'
import { PageLoader } from '@/components/loaders'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { MonacoEditorPane } from '@/components/workspace/monaco-editor-pane'
import { WorkspaceToolbar } from '@/components/workspace/workspace-toolbar'
import { FileExplorer, EditorTabs } from '@/components/workspace/file-explorer'
import { PreviewPanel } from '@/components/workspace/preview-panel'
import { ConsolePanel } from '@/components/workspace/console-panel'
import { WorkspaceStatusBar } from '@/components/workspace/status-bar'
import { VersionHistoryPanel } from '@/components/workspace/version-history-panel'
import { useCodeWorkspace } from '@/hooks/use-code-workspace'
import { downloadBlob } from '@/lib/workspace-preview'
import { notify } from '@/utils/error'
import { cn } from '@/lib/utils'
import { platformService } from '@/services/platform.service'

export function CodeWorkspace({ lessonId, className }) {
  const workspace = useCodeWorkspace(lessonId, { enabled: Boolean(lessonId) })
  const [logs, setLogs] = useState([])
  const [problems, setProblems] = useState([])
  const [device, setDevice] = useState('desktop')
  const [theme, setTheme] = useState('codecrafters')
  const [fontSize, setFontSize] = useState(14)
  const [wordWrap, setWordWrap] = useState(true)
  const [minimap, setMinimap] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [split, setSplit] = useState(0.55)
  const [showHistory, setShowHistory] = useState(false)
  const uploadRef = useRef(null)
  const dragging = useRef(false)

  const onConsoleMessage = useCallback((msg) => {
    setLogs((prev) => [...prev.slice(-200), { level: msg.level, args: msg.args, ts: msg.ts }])
    if (msg.level === 'error') {
      setProblems((prev) => [...prev.slice(-50), (msg.args || []).join(' ')])
    }
  }, [])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(workspace.active?.content || '')
      notify.success('Code copied')
    } catch {
      notify.error('Copy failed')
    }
  }

  const onDownload = async () => {
    const zip = new JSZip()
    workspace.files.forEach((f) => zip.file(f.path, f.content || ''))
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(`codecrafters-workspace-${lessonId}.zip`, blob)
    notify.success('Project downloaded')
  }

  const onUpload = async (event) => {
    const fileList = Array.from(event.target.files || [])
    if (!fileList.length) return
    const next = [...workspace.files]
    for (const file of fileList) {
      const content = await file.text()
      const path = file.name
      const idx = next.findIndex((f) => f.path === path)
      if (idx >= 0) next[idx] = { ...next[idx], content }
      else next.push({ path, language: path.endsWith('.css') ? 'css' : path.endsWith('.js') ? 'javascript' : 'html', content, entry: path === 'index.html' })
    }
    workspace.setFiles(next)
    notify.success(`Uploaded ${fileList.length} file(s)`)
    event.target.value = ''
  }

  const onResizeStart = (e) => {
    dragging.current = true
    const startX = e.clientX
    const startSplit = split
    const parent = e.currentTarget.parentElement
    const onMove = (ev) => {
      if (!dragging.current || !parent) return
      const rect = parent.getBoundingClientRect()
      const next = Math.min(0.75, Math.max(0.3, startSplit + (ev.clientX - startX) / rect.width))
      setSplit(next)
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (workspace.isLoading) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-2xl border border-border">
        <PageLoader />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-border bg-[#0b1220] shadow-elevation-2',
        fullscreen && 'fixed inset-2 z-[70]',
        className
      )}
    >
      <WorkspaceToolbar
        onRun={workspace.runPreview}
        onReset={() => setResetOpen(true)}
        onSave={async () => {
          const ok = await workspace.save({ source: 'manual' })
          if (ok) notify.success('Workspace saved')
        }}
        onCopy={onCopy}
        onDownload={onDownload}
        onUpload={() => uploadRef.current?.click()}
        onClearConsole={() => {
          setLogs([])
          setProblems([])
        }}
        onToggleFullscreen={() => setFullscreen((v) => !v)}
        onToggleHistory={() => setShowHistory((v) => !v)}
        showHistory={showHistory}
        fullscreen={fullscreen}
        theme={theme}
        onThemeChange={setTheme}
        fontSize={fontSize}
        onFontSize={(n) => setFontSize(Math.min(22, Math.max(11, n)))}
        wordWrap={wordWrap}
        onToggleWrap={() => setWordWrap((v) => !v)}
        minimap={minimap}
        onToggleMinimap={() => setMinimap((v) => !v)}
        dirty={workspace.dirty}
        saving={workspace.saving}
        lastSavedAt={workspace.lastSavedAt}
      />

      <input
        ref={uploadRef}
        type="file"
        multiple
        accept=".html,.css,.js,.txt,.json"
        className="hidden"
        onChange={onUpload}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[140px_minmax(0,1fr)] md:grid-cols-[160px_minmax(0,1fr)]">
        <FileExplorer
          files={workspace.files}
          activeFile={workspace.activeFile}
          onSelect={workspace.selectFile}
          onAdd={workspace.addFile}
        />
        <div className="flex min-h-0 min-w-0 flex-col">
          <EditorTabs
            files={workspace.files}
            activeFile={workspace.activeFile}
            onSelect={workspace.selectFile}
          />
          <div className="flex min-h-[280px] flex-1 flex-col lg:flex-row">
            <div className="min-h-[220px] min-w-0 flex-1" style={{ flex: split }}>
              <MonacoEditorPane
                value={workspace.active?.content || ''}
                language={workspace.active?.language || 'html'}
                onChange={(v) => workspace.updateFileContent(workspace.activeFile, v)}
                theme={theme}
                fontSize={fontSize}
                wordWrap={wordWrap}
                minimap={minimap}
                className="h-full rounded-none border-0"
              />
            </div>
            <div
              role="separator"
              aria-orientation="vertical"
              className="hidden w-1 cursor-col-resize bg-border hover:bg-primary/50 lg:block"
              onMouseDown={onResizeStart}
            />
            <div className="min-h-[220px] min-w-0 flex-1 border-t border-border lg:border-l lg:border-t-0" style={{ flex: 1 - split }}>
              <PreviewPanel
                files={workspace.files}
                previewKey={workspace.previewKey}
                onConsoleMessage={onConsoleMessage}
                onRefresh={workspace.runPreview}
                device={device}
                onDeviceChange={setDevice}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>

      <ConsolePanel
        logs={logs}
        problems={problems}
        onClear={() => {
          setLogs([])
          setProblems([])
        }}
        expectedOutput={workspace.meta?.expectedOutput}
        hints={workspace.meta?.hints}
        challengePlaceholder={workspace.meta?.challengePlaceholder}
        aiEnabled={workspace.meta?.aiEnabled}
        aiActions={workspace.meta?.aiActions}
        showTests={workspace.meta?.workspaceTypeMeta?.showTests}
        onAiAction={async (action) => {
          const result = await platformService.aiAction({
            action,
            payload: { code: workspace.active?.content || '', error: problems[0] },
          })
          notify.success(result.message || 'AI placeholder response')
        }}
      />

      {showHistory && (
        <VersionHistoryPanel
          lessonId={lessonId}
          currentVersion={workspace.currentVersion}
          onRestore={workspace.restoreVersion}
        />
      )}

      <WorkspaceStatusBar
        runtime={workspace.meta?.runtime || 'browser'}
        language={workspace.active?.language}
        dirty={workspace.dirty}
        version={workspace.currentVersion}
      />

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset workspace?"
        description="This restores the instructor starter template and discards your current edits."
        confirmLabel="Reset"
        onConfirm={async () => {
          await workspace.reset()
          setLogs([])
          setProblems([])
          setResetOpen(false)
        }}
      />
    </div>
  )
}
