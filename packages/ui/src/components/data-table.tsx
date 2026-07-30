'use client';

import * as React from 'react';
import { cn } from '../lib/utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table';
import { Checkbox } from './ui/checkbox';

// ── Types ─────────────────────────────────────────────────────────────────────

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
};

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
  searchValue?: string;
  searchKeys?: string[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  onRowClick,
  selectable,
  selectedKeys,
  onSelectionChange,
  pageSize = 20,
  emptyMessage = 'No data.',
  className,
  searchValue,
  searchKeys,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(0);

  // Reset page when data or search changes
  React.useEffect(() => { setPage(0); }, [data.length, searchValue]);

  // Search filter
  let filtered = data;
  if (searchValue && searchKeys && searchKeys.length > 0) {
    const q = searchValue.toLowerCase();
    filtered = data.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
    );
  }

  // Sort
  let sorted = filtered;
  if (sort) {
    sorted = [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
      }
      return { key, dir: 'asc' };
    });
  }

  function toggleAll(checked: boolean) {
    if (!onSelectionChange) return;
    onSelectionChange(checked ? new Set(paged.map(rowKey)) : new Set());
  }

  function toggleRow(key: string) {
    if (!onSelectionChange || !selectedKeys) return;
    const next = new Set(selectedKeys);
    next.has(key) ? next.delete(key) : next.add(key);
    onSelectionChange(next);
  }

  const allChecked = paged.length > 0 && paged.every((r) => selectedKeys?.has(rowKey(r)));

  return (
    <div className={cn('rounded-2xl border border-border bg-white shadow-sm overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {selectable && (
                <TableHead className="w-10 px-4">
                  <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                    col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                    col.className,
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sort?.key === col.key && (
                      <span className="text-foreground">{sort.dir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {paged.map((row) => {
              const key = rowKey(row);
              return (
                <TableRow
                  key={key}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-muted/20',
                    selectedKeys?.has(key) && 'bg-primary/5',
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell className="w-10 px-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedKeys?.has(key)}
                        onCheckedChange={() => toggleRow(key)}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {sorted.length} result{sorted.length !== 1 ? 's' : ''}
            {searchValue && ` matching "${searchValue}"`}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <span className="px-2 text-xs text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
