import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const Monaco = lazy(() => import('@monaco-editor/react'))

const THEME_MAP = {
  dark: 'vs-dark',
  light: 'light',
  codecrafters: 'codecrafters-dark',
}

function defineTheme(monaco) {
  monaco.editor.defineTheme('codecrafters-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5b6b7c', fontStyle: 'italic' },
      { token: 'keyword', foreground: '2dd4bf' },
      { token: 'string', foreground: '86efac' },
    ],
    colors: {
      'editor.background': '#0b1220',
      'editor.foreground': '#e2e8f0',
      'editorLineNumber.foreground': '#475569',
      'editorCursor.foreground': '#2dd4bf',
      'editor.selectionBackground': '#134e4a88',
      'editor.lineHighlightBackground': '#11182788',
    },
  })
}

export function MonacoEditorPane({
  value,
  language = 'html',
  onChange,
  theme = 'codecrafters',
  fontSize = 14,
  wordWrap = true,
  minimap = false,
  readOnly = false,
  className,
}) {
  return (
    <div className={cn('h-full min-h-[220px] overflow-hidden rounded-lg border border-border', className)}>
      <Suspense fallback={<Skeleton className="h-full w-full" />}>
        <Monaco
          height="100%"
          language={language}
          theme={THEME_MAP[theme] || 'vs-dark'}
          value={value}
          onChange={(v) => onChange?.(v ?? '')}
          beforeMount={defineTheme}
          options={{
            fontSize,
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            minimap: { enabled: minimap },
            wordWrap: wordWrap ? 'on' : 'off',
            automaticLayout: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            readOnly,
            padding: { top: 8 },
            renderLineHighlight: 'line',
            find: { addExtraSpaceOnTop: false },
          }}
        />
      </Suspense>
    </div>
  )
}
