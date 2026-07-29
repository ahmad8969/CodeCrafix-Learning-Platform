import {
  Play,
  RotateCcw,
  Save,
  Copy,
  Download,
  Upload,
  Trash2,
  Maximize2,
  Minimize2,
  WrapText,
  Moon,
  Sun,
  Minus,
  Plus,
  Map,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function WorkspaceToolbar({
  onRun,
  onReset,
  onSave,
  onCopy,
  onDownload,
  onUpload,
  onClearConsole,
  onToggleFullscreen,
  onToggleHistory,
  showHistory,
  fullscreen,
  theme,
  onThemeChange,
  fontSize,
  onFontSize,
  wordWrap,
  onToggleWrap,
  minimap,
  onToggleMinimap,
  dirty,
  saving,
  lastSavedAt,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 border-b border-border bg-[#0b1220] px-2 py-1.5',
        className
      )}
    >
      <Button size="sm" onClick={onRun}>
        <Play className="size-3.5" /> Run
      </Button>
      <Button size="sm" variant="outline" onClick={onSave} disabled={saving}>
        <Save className="size-3.5" /> {saving ? 'Saving…' : 'Save'}
      </Button>
      <Button size="sm" variant="outline" onClick={onReset}>
        <RotateCcw className="size-3.5" /> Reset
      </Button>
      <Button size="sm" variant="ghost" onClick={onCopy}>
        <Copy className="size-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onDownload}>
        <Download className="size-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onUpload}>
        <Upload className="size-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onClearConsole}>
        <Trash2 className="size-3.5" />
      </Button>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button size="sm" variant="ghost" onClick={() => onFontSize?.(fontSize - 1)}>
        <Minus className="size-3.5" />
      </Button>
      <span className="min-w-8 text-center text-[11px] text-muted-foreground">{fontSize}</span>
      <Button size="sm" variant="ghost" onClick={() => onFontSize?.(fontSize + 1)}>
        <Plus className="size-3.5" />
      </Button>
      <Button size="sm" variant={wordWrap ? 'secondary' : 'ghost'} onClick={onToggleWrap}>
        <WrapText className="size-3.5" />
      </Button>
      <Button size="sm" variant={minimap ? 'secondary' : 'ghost'} onClick={onToggleMinimap}>
        <Map className="size-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onThemeChange?.(theme === 'light' ? 'codecrafters' : 'light')}
      >
        {theme === 'light' ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      </Button>
      <Button size="sm" variant="ghost" onClick={onToggleFullscreen}>
        {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
      </Button>
      <Button size="sm" variant={showHistory ? 'secondary' : 'ghost'} onClick={onToggleHistory} title="Version history">
        <History className="size-3.5" />
      </Button>
      <div className="ml-auto flex items-center gap-2">
        {dirty ? (
          <Badge variant="warning">Unsaved</Badge>
        ) : (
          <Badge variant="success">Saved</Badge>
        )}
        {lastSavedAt && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(lastSavedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}
