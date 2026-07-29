import * as React from 'react'
import { cva } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva('relative w-full rounded-xl border px-4 py-3 text-sm flex gap-3', {
  variants: {
    variant: {
      default: 'border-border bg-card text-foreground',
      success: 'border-success/30 bg-success/10 text-success',
      warning: 'border-warning/30 bg-warning/10 text-warning',
      danger: 'border-destructive/30 bg-destructive/10 text-destructive',
      info: 'border-primary/30 bg-primary/10 text-primary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const icons = {
  default: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
  info: Info,
}

function Alert({ className, variant = 'default', title, children, ...props }) {
  const Icon = icons[variant] || Info
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        {title && <p className="font-semibold leading-none">{title}</p>}
        {children && <div className="text-sm opacity-90">{children}</div>}
      </div>
    </div>
  )
}

export { Alert }
