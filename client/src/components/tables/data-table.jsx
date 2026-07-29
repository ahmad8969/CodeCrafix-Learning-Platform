import { useMemo, useState } from 'react'
import { Download, Search, Trash2, Archive, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export function DataTable({
  columns,
  rows = [],
  total = 0,
  page = 1,
  limit = 10,
  search = '',
  onSearchChange,
  onPageChange,
  sortBy,
  sortOrder = 'desc',
  onSortChange,
  selected = [],
  onSelectedChange,
  onBulkDelete,
  onBulkArchive,
  onBulkPublish,
  onExport,
  loading = false,
  filtersSlot,
}) {
  const [visible, setVisible] = useState(() =>
    Object.fromEntries(columns.map((c) => [c.key, c.defaultVisible !== false]))
  )

  const visibleColumns = useMemo(
    () => columns.filter((c) => visible[c.key]),
    [columns, visible]
  )

  const pageCount = Math.max(1, Math.ceil(total / limit))
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r._id || r.id))

  const toggleAll = (checked) => {
    if (!onSelectedChange) return
    onSelectedChange(checked ? rows.map((r) => r._id || r.id) : [])
  }

  const toggleOne = (id, checked) => {
    if (!onSelectedChange) return
    onSelectedChange(checked ? [...selected, id] : selected.filter((x) => x !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search…"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filtersSlot}
          {selected.length > 0 && (
            <>
              <Badge variant="secondary">{selected.length} selected</Badge>
              {onBulkPublish && (
                <Button size="sm" variant="outline" onClick={onBulkPublish}>
                  <Upload className="size-3.5" /> Publish
                </Button>
              )}
              {onBulkArchive && (
                <Button size="sm" variant="outline" onClick={onBulkArchive}>
                  <Archive className="size-3.5" /> Archive
                </Button>
              )}
              {onBulkDelete && (
                <Button size="sm" variant="danger" onClick={onBulkDelete}>
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              )}
            </>
          )}
          {onExport && (
            <Button size="sm" variant="outline" onClick={onExport}>
              <Download className="size-3.5" /> Export CSV
            </Button>
          )}
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg border border-border px-3 py-2 text-xs font-medium">
              Columns
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-border bg-popover p-2 shadow-elevation-2">
              {columns.map((col) => (
                <label key={col.key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
                  <Checkbox
                    checked={visible[col.key]}
                    onCheckedChange={(v) => setVisible((s) => ({ ...s, [col.key]: Boolean(v) }))}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          </details>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur">
            <tr className="border-b border-border">
              {onSelectedChange && (
                <th className="w-10 p-3">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th key={col.key} className="p-3 font-semibold">
                  {col.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-primary"
                      onClick={() =>
                        onSortChange?.(
                          col.key,
                          sortBy === col.key && sortOrder === 'asc' ? 'desc' : 'asc'
                        )
                      }
                    >
                      {col.label}
                      {sortBy === col.key && (
                        <span className="text-xs text-muted-foreground">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => {
                const id = row._id || row.id
                return (
                  <tr
                    key={id}
                    className={cn(
                      'border-b border-border/60 transition hover:bg-muted/40',
                      selected.includes(id) && 'bg-primary/5'
                    )}
                  >
                    {onSelectedChange && (
                      <td className="p-3">
                        <Checkbox
                          checked={selected.includes(id)}
                          onCheckedChange={(c) => toggleOne(id, c)}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td key={col.key} className="p-3">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                )
              })}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center text-muted-foreground">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Page {page} of {pageCount} · {total} rows
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange?.(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export function exportRowsToCsv(filename, rows, columns) {
  const headers = columns.map((c) => c.label)
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const value = c.exportValue ? c.exportValue(row) : row[c.key]
        return `"${String(value ?? '').replace(/"/g, '""')}"`
      })
      .join(',')
  )
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
