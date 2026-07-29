import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ReadingProgress({ targetRef, onProgress, className }) {
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const el = targetRef?.current
    if (!el) return undefined

    const update = () => {
      const contentTop = el.offsetTop
      const contentHeight = el.scrollHeight
      const viewport = window.innerHeight
      const docScroll = window.scrollY
      const raw = ((docScroll + viewport - contentTop) / contentHeight) * 100
      const next = Math.min(100, Math.max(0, raw))
      setPercent(next)
      onProgress?.(next)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [targetRef, onProgress])

  return (
    <div className={cn('fixed left-0 right-0 top-0 z-[60] h-0.5 bg-transparent', className)}>
      <div
        className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-[width] duration-150"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function estimateTimeRemaining(estimatedMinutes, progressPercent) {
  const remaining = estimatedMinutes * (1 - progressPercent / 100)
  return Math.max(0, Math.ceil(remaining))
}
