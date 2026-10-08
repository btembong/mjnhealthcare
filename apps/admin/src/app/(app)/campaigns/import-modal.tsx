'use client';

import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
  UploadSimple, CheckCircle, Warning, Users, CircleNotch,
} from '@mjn/ui';
import { Contact, isValidEmail } from './shared';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves true once the list is stored. */
  onSave: (list: { name: string; contacts: Contact[] }) => Promise<boolean>;
};

export function ImportModal({ open, onOpenChange, onSave }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [colMap, setColMap] = useState({ name: '', email: '', phone: '' });
  const [listName, setListName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setParsed(false); setRows([]); setHeaders([]); setListName('');
  }

  async function parseFile(file: File) {
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      toast.error('Please upload an .xlsx, .xls, or .csv file.');
      return;
    }
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!data.length) { toast.error('File appears empty.'); return; }
      const hdrs = Object.keys(data[0]);
      setHeaders(hdrs);
      setRows(data);
      setColMap({
        name: hdrs.find((h) => /^name$/i.test(h) || /full.?name/i.test(h)) ?? hdrs[0] ?? '',
        email: hdrs.find((h) => /email/i.test(h)) ?? '',
        phone: hdrs.find((h) => /phone|mobile|tel/i.test(h)) ?? '',
      });
      setListName(file.name.replace(/\.[^.]+$/, ''));
      setParsed(true);
    } catch {
      toast.error('Could not read the file. Check that it is a valid Excel or CSV file.');
    }
  }

  const contacts = useMemo<Contact[]>(() => {
    if (!parsed || !colMap.email) return [];
    return rows.map((r) => ({
      name: colMap.name ? String(r[colMap.name] ?? '').trim() : '',
      email: String(r[colMap.email] ?? '').trim().toLowerCase(),
      phone: colMap.phone ? String(r[colMap.phone] ?? '').trim() || undefined : undefined,
    }));
  }, [rows, colMap, parsed]);

  const valid = contacts.filter((c) => isValidEmail(c.email));
  const invalidCount = contacts.length - valid.length;

  async function handleSave() {
    if (!listName.trim()) { toast.error('Enter a name for this list.'); return; }
    if (!valid.length) { toast.error('No valid email addresses found.'); return; }
    setSaving(true);
    const saved = await onSave({ name: listName.trim(), contacts: valid });
    setSaving(false);
    if (saved) { reset(); onOpenChange(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="border-b border-border px-6 py-4">
          <DialogTitle className="text-base font-bold text-foreground">Import contact list</DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
            Upload an Excel or CSV file. The list is saved and can be reused for any campaign.
          </DialogDescription>
        </div>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
          {!parsed ? (
            <button
              type="button"
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-14 transition-colors ${
                dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/20'
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <UploadSimple className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Drop your file here, or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">.xlsx, .xls or .csv — the first row must be column headers</p>
              </div>
            </button>
          ) : (
            <>
              <div>
                <p className="mb-3 text-xs font-semibold text-foreground">Match your columns</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['name', 'email', 'phone'] as const).map((field) => (
                    <div key={field}>
                      <label className="mb-1.5 block text-xs font-medium capitalize text-muted-foreground">
                        {field}{field === 'email' ? ' (required)' : ''}
                      </label>
                      <select
                        value={colMap[field]}
                        onChange={(e) => setColMap((m) => ({ ...m, [field]: e.target.value }))}
                        className="h-9 w-full rounded-xl border border-border bg-white px-2.5 text-xs outline-none focus:border-primary"
                      >
                        <option value="">None</option>
                        {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {colMap.email && (
                <div className="flex items-center gap-5 rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-700">{valid.length}</span>
                    <span className="text-xs text-muted-foreground">valid contacts</span>
                  </div>
                  {invalidCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Warning className="h-4 w-4 shrink-0 text-amber-500" />
                      <span className="text-sm font-bold text-amber-700">{invalidCount}</span>
                      <span className="text-xs text-muted-foreground">invalid, will be left out</span>
                    </div>
                  )}
                </div>
              )}

              {contacts.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr className="text-left text-muted-foreground">
                          <th className="px-3 py-2 font-semibold">Name</th>
                          <th className="px-3 py-2 font-semibold">Email</th>
                          {colMap.phone && <th className="px-3 py-2 font-semibold">Phone</th>}
                          <th className="px-3 py-2 font-semibold">Valid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {contacts.slice(0, 8).map((c, i) => {
                          const ok = isValidEmail(c.email);
                          return (
                            <tr key={i} className={ok ? '' : 'bg-amber-50/60'}>
                              <td className="px-3 py-2 text-foreground">{c.name || '—'}</td>
                              <td className="px-3 py-2 font-mono">{c.email || '—'}</td>
                              {colMap.phone && <td className="px-3 py-2 text-muted-foreground">{c.phone || '—'}</td>}
                              <td className="px-3 py-2">
                                {ok ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Warning className="h-3.5 w-3.5 text-amber-500" />}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {contacts.length > 8 && (
                    <div className="border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      Showing 8 of {contacts.length} rows
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">List name</label>
                <input
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="e.g. UAE Nurses July 2026"
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
          <button
            type="button"
            onClick={() => (parsed ? reset() : onOpenChange(false))}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {parsed ? 'Upload a different file' : 'Cancel'}
          </button>
          {parsed && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !valid.length || !listName.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Save list · {valid.length} contacts
            </button>
          )}
        </div>

        <input
          ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); e.target.value = ''; }}
        />
      </DialogContent>
    </Dialog>
  );
}
