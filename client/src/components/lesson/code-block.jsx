import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import 'highlight.js/styles/github-dark.css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('json', json)

export function CodeBlock({ code = '', language = 'text', className }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const lines = String(code).replace(/\n$/, '').split('\n')
  const lang = language || 'text'

  let highlighted = null
  try {
    if (lang && lang !== 'text' && hljs.getLanguage(lang)) {
      highlighted = hljs
        .highlight(String(code).replace(/\n$/, ''), { language: lang })
        .value.split('\n')
    }
  } catch {
    highlighted = null
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={cn(
        'group my-4 overflow-hidden rounded-xl border border-border bg-[#0b1220]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <Badge
          variant="outline"
          className="border-white/15 bg-white/5 text-[10px] uppercase text-emerald-300"
        >
          {lang}
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={copy}
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[12.5px] leading-6">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-white/[0.03]">
                  <td className="select-none border-r border-white/10 px-3 text-right text-slate-500">
                    {i + 1}
                  </td>
                  <td className="whitespace-pre px-3 text-slate-100">
                    {highlighted ? (
                      <code
                        className={`language-${lang} hljs`}
                        dangerouslySetInnerHTML={{ __html: highlighted[i] || ' ' }}
                      />
                    ) : (
                      <code className={`language-${lang}`}>{line || ' '}</code>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
