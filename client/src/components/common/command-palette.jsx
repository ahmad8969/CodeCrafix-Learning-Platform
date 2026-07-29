import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

/** Command palette placeholder — wire search in a later prompt. */
export function CommandPalette({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>
            Search and quick actions will be available in a later prompt. Press Esc to close.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
          Placeholder — Ctrl / ⌘ K
        </div>
      </DialogContent>
    </Dialog>
  )
}
