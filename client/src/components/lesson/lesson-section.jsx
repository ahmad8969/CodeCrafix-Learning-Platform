import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function LessonSection({ id, title, defaultOpen = true, children, className }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section id={id} className={cn('scroll-mt-28 border-b border-border/70 py-4', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <ChevronDown
          className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="prose-curriculum pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
