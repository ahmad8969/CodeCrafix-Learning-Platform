import { AlertTriangle, Info, Lightbulb, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  tip: {
    icon: Lightbulb,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    label: 'Tip',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
    label: 'Warning',
  },
  info: {
    icon: Info,
    className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
    label: 'Info',
  },
  note: {
    icon: StickyNote,
    className: 'border-border bg-muted/50 text-foreground',
    label: 'Note',
  },
}

export function AlertBox({ variant = 'info', title, children, className }) {
  const cfg = VARIANTS[variant] || VARIANTS.info
  const Icon = cfg.icon
  return (
    <div className={cn('my-4 rounded-xl border px-4 py-3', cfg.className, className)}>
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4" />
        {title || cfg.label}
      </div>
      <div className="text-sm opacity-90">{children}</div>
    </div>
  )
}

export function TipCard(props) {
  return <AlertBox variant="tip" {...props} />
}
export function WarningCard(props) {
  return <AlertBox variant="warning" {...props} />
}
export function InfoCard(props) {
  return <AlertBox variant="info" {...props} />
}
