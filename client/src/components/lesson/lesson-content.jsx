import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import { CodeBlock } from '@/components/lesson/code-block'
import { AlertBox } from '@/components/lesson/alert-box'
import { LessonSection } from '@/components/lesson/lesson-section'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'

const FLOW_SECTIONS = [
  'Introduction',
  'Learning Objectives',
  'Theory',
  'Explanation',
  'Examples',
  'Common Mistakes',
  'Best Practices',
  'Real World Usage',
  'Summary',
  'Key Takeaways',
  'Resources',
  "What's Next",
]

function normalizeHeading(text = '') {
  return String(text).trim().toLowerCase().replace(/[^a-z0-9\s']/g, '')
}

function parseSections(markdown = '') {
  const lines = String(markdown).split('\n')
  const sections = []
  let current = { title: 'Introduction', body: [] }

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/)
    if (match) {
      sections.push({ title: current.title, body: current.body.join('\n').trim() })
      current = { title: match[1].trim(), body: [] }
    } else {
      current.body.push(line)
    }
  }
  sections.push({ title: current.title, body: current.body.join('\n').trim() })

  const mapped = new Map()
  for (const section of sections) {
    const key = FLOW_SECTIONS.find(
      (s) => normalizeHeading(s) === normalizeHeading(section.title)
    )
    if (key) mapped.set(key, (mapped.get(key) ? mapped.get(key) + '\n\n' : '') + section.body)
    else {
      const fallback = mapped.get('Theory') || ''
      mapped.set(
        'Theory',
        `${fallback}${fallback ? '\n\n' : ''}## ${section.title}\n\n${section.body}`.trim()
      )
    }
  }

  if (![...mapped.values()].some(Boolean) && markdown.trim()) {
    mapped.set('Theory', markdown)
  }

  return FLOW_SECTIONS.map((title) => ({
    title,
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    body: mapped.get(title) || '',
  }))
}

function highlightText(text, query) {
  if (!query?.trim()) return text
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-amber-400/30 px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

function MarkdownBody({ content, highlightQuery }) {
  const components = useMemo(
    () => ({
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '')
        const isBlock = Boolean(match) || String(children).includes('\n')
        if (!isBlock) {
          return (
            <code className={cn('rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]', className)} {...props}>
              {children}
            </code>
          )
        }
        return <CodeBlock code={String(children)} language={match?.[1] || 'text'} />
      },
      pre({ children }) {
        return <>{children}</>
      },
      blockquote({ children }) {
        const text = String(children?.props?.children || children || '')
        if (/^\s*tip:/i.test(text)) {
          return <AlertBox variant="tip">{String(text).replace(/^\s*tip:\s*/i, '')}</AlertBox>
        }
        if (/^\s*warning:/i.test(text)) {
          return <AlertBox variant="warning">{String(text).replace(/^\s*warning:\s*/i, '')}</AlertBox>
        }
        if (/^\s*note:/i.test(text)) {
          return <AlertBox variant="note">{String(text).replace(/^\s*note:\s*/i, '')}</AlertBox>
        }
        return <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground">{children}</blockquote>
      },
      a({ href, children }) {
        return (
          <a href={href} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
            {children}
          </a>
        )
      },
      iframe({ src, ...props }) {
        return (
          <div className="my-4 aspect-video overflow-hidden rounded-xl border border-border">
            <iframe src={src} title="Embedded media" className="h-full w-full" allowFullScreen {...props} />
          </div>
        )
      },
      p({ children }) {
        if (typeof children === 'string' && highlightQuery) {
          return <p>{highlightText(children, highlightQuery)}</p>
        }
        return <p>{children}</p>
      },
    }),
    [highlightQuery]
  )

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={components}
    >
      {content || '_No content yet._'}
    </ReactMarkdown>
  )
}

export function LessonContent({ content, highlightQuery, className }) {
  const sections = useMemo(() => parseSections(content), [content])

  return (
    <div className={cn('space-y-1', className)}>
      {sections.map((section, index) => (
        <LessonSection
          key={section.id}
          id={section.id}
          title={`${index + 1}. ${section.title}`}
          defaultOpen={index < 3 || Boolean(section.body)}
        >
          {section.body ? (
            <MarkdownBody content={section.body} highlightQuery={highlightQuery} />
          ) : (
            <p className="text-sm text-muted-foreground">Section placeholder — add content in the lesson editor.</p>
          )}
        </LessonSection>
      ))}
    </div>
  )
}

export { FLOW_SECTIONS, parseSections }
