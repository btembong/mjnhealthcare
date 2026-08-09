'use client';

import React, { useEffect, useState } from 'react';
import { PageHeader, Skeleton } from '@mjn/ui';
import {
  MagnifyingGlass, CheckCircle, Clock,
  WarningCircle, CurrencyDollar, User, X, CaretDown, ClipboardText,
  CheckSquare, XSquare, Briefcase, CalendarPlus, Trash, CircleNotch,
  CalendarBlank, Plus, Image, Check,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

type Consultant = {
  id: string;
  name: string;
  specialty: string;
  type: 'STAFF' | 'PARTNER';
  consultationCategory: string;
  commissionRate: number;
  priceUsd?: number;
  photoUrl?: string;
};

type Payout = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  consultant?: { person?: { name?: string } };
};

type Application = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  bio?: string;
  status: string;
  createdAt: string;
  reviewNotes?: string;
};

const TYPE_STYLES: Record<string, string> = {
  STAFF: 'bg-primary/10 text-primary border-primary/20',
  PARTNER: 'bg-violet-100 text-violet-700 border-violet-200',
};

const PAYOUT_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const APP_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
};

function formatCategory(c: string) {
  return c?.replace(/_/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase()) ?? '—';
}

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'consultants' | 'slots' | 'payouts' | 'applications'>('consultants');

  // ── Slot management state ──────────────────────────────────────────────────
  const [slotConsultant, setSlotConsultant] = useState<Consultant | null>(null);
  const [existingSlots, setExistingSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotCreating, setSlotCreating] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState<string | null>(null);
  // slot generator form
  const [genDays, setGenDays] = useState(14);
  const [genHours, setGenHours] = useState<number[]>([8, 10, 13, 15, 17]);
  const [genDuration, setGenDuration] = useState(45);
  const [genSkipWeekends, setGenSkipWeekends] = useState(true);

  const HOUR_OPTIONS = [7,8,9,10,11,12,13,14,15,16,17,18,19];

  async function openSlots(c: Consultant) {
    setSlotConsultant(c);
    setTab('slots');
    setSlotsLoading(true);
    try { setExistingSlots(await api.getConsultantSlots(c.id) ?? []); }
    catch { setExistingSlots([]); }
    finally { setSlotsLoading(false); }
  }

  async function handleGenerateSlots() {
    if (!slotConsultant) return;
    setSlotCreating(true);
    try {
      const slots: { consultantId: string; startAt: string; durationMinutes: number }[] = [];
      const now = new Date();
      for (let day = 1; day <= genDays; day++) {
        const date = new Date(now);
        date.setDate(now.getDate() + day);
        const dow = date.getDay();
        if (genSkipWeekends && (dow === 0 || dow === 6)) continue;
        for (const h of genHours) {
          const startAt = new Date(date);
          startAt.setUTCHours(h - 1, 0, 0, 0); // WAT UTC+1 → UTC
          // skip if already exists
          const exists = existingSlots.some(
            (s) => new Date(s.startAt).getTime() === startAt.getTime()
          );
          if (!exists) slots.push({ consultantId: slotConsultant.id, startAt: startAt.toISOString(), durationMinutes: genDuration });
        }
      }
      if (slots.length === 0) { alert('No new slots to create (all already exist).'); return; }
      await api.createSlotsBulk(slots);
      const updated = await api.getConsultantSlots(slotConsultant.id);
      setExistingSlots(updated ?? []);
    } catch (e) { console.error(e); alert('Failed to create slots.'); }
    finally { setSlotCreating(false); }
  }

  async function handleDeleteSlot(slotId: string) {
    setDeletingSlot(slotId);
    try {
      await api.deleteSlot(slotId);
      setExistingSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch { alert('Could not delete slot — it may already be booked.'); }
    finally { setDeletingSlot(null); }
  }
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [reviewingApp, setReviewingApp] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // deactivate / delete state
  const [togglingActive, setTogglingActive] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Consultant | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleToggleActive(c: Consultant) {
    setTogglingActive(c.id);
    try {
      if ((c as any).isActive !== false) {
        await api.deactivateConsultant(c.id);
        setConsultants(prev => prev.map(x => x.id === c.id ? { ...x, isActive: false } as any : x));
      } else {
        await api.reactivateConsultant(c.id);
        setConsultants(prev => prev.map(x => x.id === c.id ? { ...x, isActive: true } as any : x));
      }
    } catch { alert('Failed to update consultant status.'); }
    finally { setTogglingActive(null); }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await api.deleteConsultant(confirmDelete.id);
      setConsultants(prev => prev.filter(c => c.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e: any) { alert(e.message ?? 'Failed to delete consultant.'); }
    finally { setDeleting(false); }
  }

  // edit modal
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', specialty: '', bio: '', consultationCategory: '', languages: '', priceUsd: '', sessionDurationMins: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  function openEdit(c: Consultant) {
    setEditForm({
      name: c.name ?? '',
      email: (c as any).email ?? '',
      specialty: (c as any).specialty ?? '',
      bio: (c as any).bio ?? '',
      consultationCategory: c.consultationCategory ?? 'BOTH',
      languages: ((c as any).languages ?? []).join(', '),
      priceUsd: String(c.priceUsd ?? ''),
      sessionDurationMins: String((c as any).sessionDurationMins ?? '45'),
    });
    setSaveError('');
    setEditingConsultant(c);
  }

  async function handleEditSave() {
    if (!editingConsultant) return;
    setSaving(true);
    setSaveError('');
    try {
      await api.updateConsultant(editingConsultant.id, {
        name: editForm.name.trim() || undefined,
        email: editForm.email.trim() || undefined,
        specialty: editForm.specialty.trim() || undefined,
        bio: editForm.bio.trim() || undefined,
        consultationCategory: editForm.consultationCategory || undefined,
        languages: editForm.languages ? editForm.languages.split(',').map((l) => l.trim()).filter(Boolean) : undefined,
        priceUsd: editForm.priceUsd ? parseFloat(editForm.priceUsd) : undefined,
        sessionDurationMins: editForm.sessionDurationMins ? parseInt(editForm.sessionDurationMins) : undefined,
      });
      setConsultants((prev) => prev.map((c) => c.id === editingConsultant.id
        ? { ...c, name: editForm.name, specialty: editForm.specialty as any, consultationCategory: editForm.consultationCategory, priceUsd: parseFloat(editForm.priceUsd) }
        : c,
      ));
      setEditingConsultant(null);
    } catch (e: any) { setSaveError(e.message ?? 'Failed to save.'); }
    finally { setSaving(false); }
  }

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'CONSULTANT',
    specialty: '', bio: '', consultationCategory: 'BOTH', priceUsd: '', photoUrl: '',
  });

  // inline photo editing per consultant row
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null); // consultantId
  const [photoInput, setPhotoInput] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);

  // inline price editing per consultant row
  const [editingPrice, setEditingPrice] = useState<string | null>(null); // consultantId
  const [priceInput, setPriceInput] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  async function handleSavePrice(consultantId: string) {
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) { alert('Enter a valid price.'); return; }
    setSavingPrice(true);
    try {
      await api.updateConsultant(consultantId, { priceUsd: price });
      setConsultants((prev) => prev.map((c) => c.id === consultantId ? { ...c, priceUsd: price } : c));
      setEditingPrice(null);
      setPriceInput('');
    } catch { alert('Failed to update price.'); }
    finally { setSavingPrice(false); }
  }

  async function handleSavePhoto(consultantId: string) {
    setSavingPhoto(true);
    try {
      await api.updateConsultant(consultantId, { photoUrl: photoInput || undefined });
      setConsultants((prev) => prev.map((c) => c.id === consultantId ? { ...c, photoUrl: photoInput } : c));
      setEditingPhoto(null);
      setPhotoInput('');
    } catch { alert('Failed to save photo URL.'); }
    finally { setSavingPhoto(false); }
  }

  useEffect(() => {
    loadConsultants();
    loadPayouts();
    loadApplications();
  }, []);

  async function loadConsultants() {
    setLoading(true);
    try { setConsultants(await api.getConsultants() ?? []); } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function loadPayouts() {
    setPayoutsLoading(true);
    try { setPayouts(await api.getPayoutQueue() ?? []); } catch (e) { console.error(e); } finally { setPayoutsLoading(false); }
  }

  async function loadApplications() {
    setAppsLoading(true);
    try { setApplications(await api.getConsultantApplications() ?? []); } catch (e) { console.error(e); } finally { setAppsLoading(false); }
  }

  async function handleMarkPaid(id: string) {
    setMarkingPaid(id);
    try { await api.markPayoutPaid(id); setPayouts((prev) => prev.map((p) => p.id === id ? { ...p, status: 'PAID' } : p)); } catch (e) { console.error(e); } finally { setMarkingPaid(null); }
  }

  async function handleReview(id: string, decision: 'APPROVE' | 'REJECT') {
    setReviewingApp(id);
    try {
      await api.reviewApplication(id, decision, reviewNotes);
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', reviewNotes } : a));
      setSelectedApp(null);
      setReviewNotes('');
    } catch (e) { console.error(e); } finally { setReviewingApp(null); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      // Create auth account (Person record for login)
      await api.registerStaff({ name: form.name, email: form.email, password: form.password, role: form.role });
      // Create consultant profile (shown in this page's list)
      await api.createConsultant({
        name: form.name,
        email: form.email,
        bio: form.bio,
        specialty: form.specialty,
        languages: ['English'],
        type: form.role === 'PARTNER' ? 'PARTNER' : 'STAFF',
        consultationCategory: form.consultationCategory,
        priceUsd: parseFloat(form.priceUsd) || 0,
        photoUrl: form.photoUrl || undefined,
      });
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'CONSULTANT', specialty: '', bio: '', consultationCategory: 'BOTH', priceUsd: '', photoUrl: '' });
      await loadConsultants();
    } catch (err: any) { setCreateError(err.message); } finally { setCreating(false); }
  }

  const filtered = consultants.filter((c) => {
    const q = search.toLowerCase();
    return (c.name ?? '').toLowerCase().includes(q) || (c.specialty ?? '').toLowerCase().includes(q);
  });

  const pendingPayouts = payouts.filter((p) => p.status === 'PENDING');
  const paidPayouts = payouts.filter((p) => p.status === 'PAID');
  const pendingApps = applications.filter((a) => a.status === 'PENDING');

  const TABS = [
    { key: 'consultants', label: 'Consultants', badge: 0 },
    { key: 'slots',       label: 'Manage Slots', badge: 0 },
    { key: 'payouts',     label: 'Payouts', badge: pendingPayouts.length },
    { key: 'applications',label: 'Applications', badge: pendingApps.length },
  ] as const;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Consultants"
          subtitle={`${consultants.length} active · ${pendingPayouts.length} pending payout${pendingPayouts.length !== 1 ? 's' : ''} · ${pendingApps.length} application${pendingApps.length !== 1 ? 's' : ''} pending`}
          actions={
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              <User className="h-4 w-4" /> Add consultant
            </button>
          }
        />

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 w-fit">
          {TABS.map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
              {badge > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Consultants tab */}
        {tab === 'consultants' && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
                <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-semibold text-foreground">No consultants found</p>
                <p className="mt-1 text-sm text-muted-foreground">Add your first consultant to get started.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Consultant</th>
                      <th className="px-5 py-3 font-semibold">Position / Qualification</th>
                      <th className="px-5 py-3 font-semibold">Type</th>
                      <th className="px-5 py-3 font-semibold">Category</th>
                      <th className="px-5 py-3 font-semibold">Commission</th>
                      <th className="px-5 py-3 font-semibold">Price (USD)</th>
                      <th className="px-5 py-3 font-semibold">Photo</th>
                      <th className="px-5 py-3 font-semibold">Slots</th>
                      <th className="px-5 py-3 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((c) => (
                      <React.Fragment key={c.id}>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 shrink-0 overflow-hidden rounded-full ${(c as any).isActive === false ? 'opacity-40 grayscale' : 'bg-primary/10'}`}>
                              {c.photoUrl
                                ? <img src={c.photoUrl} alt={c.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                                : <span className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">{(c.name ?? 'CN').slice(0, 2).toUpperCase()}</span>
                              }
                            </div>
                            <div>
                              <p className={`font-semibold ${(c as any).isActive === false ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{c.name ?? '—'}</p>
                              {(c as any).isActive === false && (
                                <span className="text-xs font-medium text-amber-600">Deactivated</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{c.specialty || '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TYPE_STYLES[c.type] ?? 'bg-muted text-muted-foreground border-border'}`}>
                            {c.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{formatCategory(c.consultationCategory)}</td>
                        <td className="px-5 py-4">
                          {c.type === 'PARTNER' ? (
                            <span className="text-sm font-semibold text-foreground">{Math.round((c.commissionRate ?? 0.75) * 100)}%</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Staff (100% to MJN)</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => { setEditingPrice(editingPrice === c.id ? null : c.id); setPriceInput(String(c.priceUsd ?? '')); setEditingPhoto(null); }}
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-colors shadow-sm"
                          >
                            <CurrencyDollar className="h-3.5 w-3.5" />
                            {c.priceUsd != null ? `$${Number(c.priceUsd).toFixed(0)}` : 'Set'}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => { setEditingPhoto(editingPhoto === c.id ? null : c.id); setPhotoInput(c.photoUrl ?? ''); setEditingPrice(null); }}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm ${c.photoUrl ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10' : 'border-border bg-white text-muted-foreground hover:text-primary hover:border-primary/40'}`}
                          >
                            <Image className="h-3.5 w-3.5" />
                            {c.photoUrl ? 'Edit' : 'Add'}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => openSlots(c)}
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-colors shadow-sm"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" /> Manage
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(c)}
                              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors shadow-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(c)}
                              disabled={togglingActive === c.id}
                              title={(c as any).isActive === false ? 'Reactivate consultant' : 'Deactivate — hides from booking page'}
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 ${
                                (c as any).isActive === false
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              {togglingActive === c.id
                                ? <CircleNotch className="h-3.5 w-3.5 animate-spin" />
                                : (c as any).isActive === false ? 'Reactivate' : 'Deactivate'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(c)}
                              title="Permanently remove from system"
                              className="flex items-center justify-center h-7 w-7 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editingPrice === c.id && (
                        <tr className="bg-muted/30 border-t-0">
                          <td colSpan={9} className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <CurrencyDollar className="h-4 w-4 shrink-0 text-primary" />
                              <span className="text-xs font-semibold text-muted-foreground">New price (USD)</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={priceInput}
                                onChange={(e) => setPriceInput(e.target.value)}
                                placeholder="e.g. 35"
                                className="w-28 h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSavePrice(c.id)}
                                disabled={savingPrice}
                                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                              >
                                {savingPrice ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                Save
                              </button>
                              <button
                                onClick={() => { setEditingPrice(null); setPriceInput(''); }}
                                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {editingPhoto === c.id && (
                        <tr className="bg-primary/3 border-t-0">
                          <td colSpan={9} className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <Image className="h-4 w-4 shrink-0 text-primary" />
                              <input
                                type="url"
                                value={photoInput}
                                onChange={(e) => setPhotoInput(e.target.value)}
                                placeholder="Paste a direct image URL (https://…/photo.jpg)"
                                className="flex-1 h-9 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                autoFocus
                              />
                              {photoInput && (
                                <img src={photoInput} alt="Preview" className="h-9 w-9 rounded-lg object-cover border border-border shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                              )}
                              <button
                                onClick={() => handleSavePhoto(c.id)}
                                disabled={savingPhoto}
                                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                              >
                                {savingPhoto ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                Save
                              </button>
                              <button
                                onClick={() => { setEditingPhoto(null); setPhotoInput(''); }}
                                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Slots tab */}
        {tab === 'slots' && (
          <div className="space-y-5">
            {!slotConsultant ? (
              <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
                <CalendarBlank className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="font-semibold text-foreground">Select a consultant</p>
                <p className="mt-1 text-sm text-muted-foreground">Go to the Consultants tab and click "Manage" on a consultant to manage their availability slots.</p>
                <button onClick={() => setTab('consultants')} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                  Go to Consultants
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {slotConsultant.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{slotConsultant.name}</p>
                      <p className="text-xs text-muted-foreground">{slotConsultant.specialty} · {existingSlots.length} upcoming slots</p>
                    </div>
                  </div>
                  <button onClick={() => { setSlotConsultant(null); setExistingSlots([]); setTab('consultants'); }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <X className="h-3.5 w-3.5" /> Change consultant
                  </button>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {/* Generator */}
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                      <Plus className="h-4 w-4 text-primary" />
                      <p className="font-semibold text-foreground">Generate slots</p>
                    </div>

                    <div className="space-y-4">
                      {/* Days ahead */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground">Days ahead</label>
                        <select value={genDays} onChange={(e) => setGenDays(Number(e.target.value))}
                          className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary">
                          {[7, 14, 21, 30].map((d) => <option key={d} value={d}>{d} days</option>)}
                        </select>
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-foreground">Session duration</label>
                        <select value={genDuration} onChange={(e) => setGenDuration(Number(e.target.value))}
                          className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary">
                          {[30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} minutes</option>)}
                        </select>
                      </div>

                      {/* Time slots */}
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-foreground">Available hours (WAT)</label>
                        <div className="flex flex-wrap gap-2">
                          {HOUR_OPTIONS.map((h) => {
                            const selected = genHours.includes(h);
                            return (
                              <button key={h} type="button"
                                onClick={() => setGenHours(selected ? genHours.filter((x) => x !== h) : [...genHours, h].sort((a,b) => a-b))}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  selected ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:border-primary/50'
                                }`}
                              >
                                {h}:00
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Skip weekends */}
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input type="checkbox" checked={genSkipWeekends} onChange={(e) => setGenSkipWeekends(e.target.checked)}
                          className="h-4 w-4 rounded accent-primary" />
                        <span className="text-sm text-foreground">Skip weekends</span>
                      </label>

                      <button
                        onClick={handleGenerateSlots}
                        disabled={slotCreating || genHours.length === 0}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {slotCreating ? <><CircleNotch className="h-4 w-4 animate-spin" /> Generating…</> : <><CalendarPlus className="h-4 w-4" /> Generate slots</>}
                      </button>
                    </div>
                  </div>

                  {/* Existing slots list */}
                  <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarBlank className="h-4 w-4 text-primary" />
                        <p className="font-semibold text-foreground">Upcoming slots</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{existingSlots.length}</span>
                    </div>

                    {slotsLoading ? (
                      <div className="space-y-2">{[0,1,2].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />)}</div>
                    ) : existingSlots.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No upcoming slots. Generate some on the left.</p>
                    ) : (
                      <div className="max-h-[380px] space-y-1.5 overflow-y-auto pr-1">
                        {existingSlots.map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {new Date(slot.startAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Douala' })}
                                {' · '}
                                {new Date(slot.startAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Douala' })} WAT
                              </p>
                              <p className="text-[10px] text-muted-foreground">{slot.durationMinutes} min · {slot.status}</p>
                            </div>
                            {slot.status === 'AVAILABLE' && (
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                disabled={deletingSlot === slot.id}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                              >
                                {deletingSlot === slot.id ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Payouts tab */}
        {tab === 'payouts' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 p-2.5"><Clock className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold text-foreground">{pendingPayouts.length}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 p-2.5"><CurrencyDollar className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending amount</p>
                  <p className="text-xl font-bold text-foreground">
                    ${pendingPayouts.reduce((s, p) => s + Number(p.amount ?? 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-2.5"><CheckCircle weight="fill" className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid out</p>
                  <p className="text-xl font-bold text-foreground">{paidPayouts.length}</p>
                </div>
              </div>
            </div>

            {payoutsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
              </div>
            ) : payouts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
                <CurrencyDollar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No payouts yet. They appear when partner consultants complete sessions.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Consultant</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 font-medium text-foreground">{p.consultant?.person?.name ?? '—'}</td>
                        <td className="px-5 py-4 font-bold text-foreground">${Number(p.amount).toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PAYOUT_STATUS_STYLES[p.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4">
                          {p.status === 'PENDING' && (
                            <button
                              onClick={() => handleMarkPaid(p.id)}
                              disabled={markingPaid === p.id}
                              className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              {markingPaid === p.id ? 'Marking…' : 'Mark paid'}
                            </button>
                          )}
                          {p.status === 'PAID' && (
                            <CheckCircle weight="fill" className="h-5 w-5 text-emerald-500" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Applications tab */}
        {tab === 'applications' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 p-2.5"><ClipboardText className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending review</p>
                  <p className="text-xl font-bold text-foreground">{pendingApps.length}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-2.5"><CheckSquare className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Approved</p>
                  <p className="text-xl font-bold text-foreground">{applications.filter((a) => a.status === 'APPROVED').length}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm flex items-center gap-3">
                <div className="rounded-xl bg-rose-100 p-2.5"><XSquare className="h-5 w-5 text-rose-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                  <p className="text-xl font-bold text-foreground">{applications.filter((a) => a.status === 'REJECTED').length}</p>
                </div>
              </div>
            </div>

            {appsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
              </div>
            ) : applications.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
                <ClipboardText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-semibold text-foreground">No applications yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Partner consultant applications submitted from the website will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {app.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{app.name}</p>
                          <p className="text-sm text-muted-foreground">{app.email}{app.phone ? ` · ${app.phone}` : ''}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                              {formatCategory(app.category)}
                            </span>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${APP_STATUS_STYLES[app.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                              {app.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {app.status === 'PENDING' && (
                        <button
                          onClick={() => { setSelectedApp(app); setReviewNotes(''); }}
                          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors"
                        >
                          Review
                        </button>
                      )}
                    </div>
                    {app.bio && (
                      <p className="mt-3 text-sm text-muted-foreground border-t border-border pt-3 line-clamp-2">{app.bio}</p>
                    )}
                    {app.reviewNotes && app.status !== 'PENDING' && (
                      <div className="mt-3 rounded-xl bg-muted/40 px-4 py-3 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Review notes</p>
                        <p className="text-sm text-foreground">{app.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create consultant modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-base font-semibold text-foreground">Add Staff Consultant</p>
                <p className="text-xs text-muted-foreground mt-0.5">Creates a staff account with consultant access.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 hover:bg-muted/60 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Full name</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="jane@mjnhealth.com" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Temporary password</label>
                <input required type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Min. 8 characters" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Role</label>
                <div className="relative">
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="h-11 w-full appearance-none rounded-xl border border-border bg-white pl-4 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="CONSULTANT">Consultant</option>
                    <option value="ADMIN">Admin</option>
                    <option value="PARTNER">Partner</option>
                  </select>
                  <CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Specialty</label>
                  <input required value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Nursing, Career" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Category</label>
                  <select value={form.consultationCategory} onChange={(e) => setForm((f) => ({ ...f, consultationCategory: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="BOTH">Health + Career</option>
                    <option value="HEALTH">Health</option>
                    <option value="CAREER">Career</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Session price (USD)</label>
                <input required type="number" min="0" step="0.01" value={form.priceUsd} onChange={(e) => setForm((f) => ({ ...f, priceUsd: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. 80" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Short bio</label>
                <textarea required value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={2} className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Brief professional bio…" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  Photo URL <span className="text-xs font-normal text-muted-foreground">(optional — paste a direct image link)</span>
                </label>
                <input type="url" value={form.photoUrl} onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://…/photo.jpg" />
                {form.photoUrl && (
                  <img src={form.photoUrl} alt="Preview" className="mt-2 h-16 w-16 rounded-xl object-cover border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
              {createError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  <WarningCircle className="h-4 w-4 shrink-0" /> {createError}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {creating ? 'Creating…' : 'Create consultant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit consultant modal */}
      {editingConsultant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingConsultant(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-base font-semibold text-foreground">Edit Consultant</p>
                <p className="text-xs text-muted-foreground mt-0.5">{editingConsultant.name}</p>
              </div>
              <button onClick={() => setEditingConsultant(null)} className="rounded-lg p-1 hover:bg-muted/60 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Full name</label>
                <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Email address</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="consultant@mjnhealth.com"
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                <p className="mt-1 text-xs text-muted-foreground">Used for lead assignment notifications.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Specialty / Position</label>
                  <input value={editForm.specialty} onChange={(e) => setEditForm((f) => ({ ...f, specialty: e.target.value }))}
                    placeholder="e.g. General Medicine"
                    className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Category</label>
                  <div className="relative">
                    <select value={editForm.consultationCategory} onChange={(e) => setEditForm((f) => ({ ...f, consultationCategory: e.target.value }))}
                      className="h-11 w-full appearance-none rounded-xl border border-border bg-white pl-4 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="BOTH">Health + Career</option>
                      <option value="HEALTH">Health</option>
                      <option value="CAREER">Career</option>
                    </select>
                    <CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Bio</label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={4} className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  Languages <span className="font-normal text-muted-foreground">(comma-separated)</span>
                </label>
                <input value={editForm.languages} onChange={(e) => setEditForm((f) => ({ ...f, languages: e.target.value }))}
                  placeholder="English, French"
                  className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Price (USD)</label>
                  <input type="number" min="0" step="1" value={editForm.priceUsd} onChange={(e) => setEditForm((f) => ({ ...f, priceUsd: e.target.value }))}
                    placeholder="e.g. 40"
                    className="h-11 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Duration (min)</label>
                  <div className="relative">
                    <select value={editForm.sessionDurationMins} onChange={(e) => setEditForm((f) => ({ ...f, sessionDurationMins: e.target.value }))}
                      className="h-11 w-full appearance-none rounded-xl border border-border bg-white pl-4 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                      {[30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} min</option>)}
                    </select>
                    <CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  <WarningCircle className="h-4 w-4 shrink-0" /> {saveError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingConsultant(null)}
                  className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleEditSave} disabled={saving}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <Trash className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Remove consultant?</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <span className="font-semibold text-foreground">{confirmDelete.name}</span> will be removed from the system. All future available slots will be cleared. Past sessions and payout records are preserved for audit.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-5">
              <p className="text-xs font-semibold text-amber-700">
                If you only want to hide them from the booking page, use <span className="underline">Deactivate</span> instead — it's reversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? <><CircleNotch className="h-4 w-4 animate-spin" /> Removing…</> : <><Trash className="h-4 w-4" /> Yes, remove</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application review modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedApp(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-base font-semibold text-foreground">Review Application</p>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedApp.name} · {formatCategory(selectedApp.category)}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="rounded-lg p-1 hover:bg-muted/60 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div className="rounded-xl bg-muted/40 p-4 grid gap-2 sm:grid-cols-2 text-sm">
                <div><p className="text-xs font-semibold text-muted-foreground uppercase">Email</p><p className="mt-0.5 text-foreground">{selectedApp.email}</p></div>
                {selectedApp.phone && <div><p className="text-xs font-semibold text-muted-foreground uppercase">Phone</p><p className="mt-0.5 text-foreground">{selectedApp.phone}</p></div>}
                <div><p className="text-xs font-semibold text-muted-foreground uppercase">Category</p><p className="mt-0.5 text-foreground">{formatCategory(selectedApp.category)}</p></div>
                <div><p className="text-xs font-semibold text-muted-foreground uppercase">Applied</p><p className="mt-0.5 text-foreground">{new Date(selectedApp.createdAt).toLocaleDateString()}</p></div>
              </div>
              {selectedApp.bio && (
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Bio / Cover</p>
                  <p className="text-sm text-foreground">{selectedApp.bio}</p>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Review notes <span className="font-normal text-muted-foreground">(optional)</span></label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Internal notes — e.g. qualifications verified, reason for rejection…"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleReview(selectedApp.id, 'REJECT')}
                disabled={!!reviewingApp}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors"
              >
                <XSquare className="h-4 w-4" />
                {reviewingApp === selectedApp.id ? 'Rejecting…' : 'Reject'}
              </button>
              <button
                onClick={() => handleReview(selectedApp.id, 'APPROVE')}
                disabled={!!reviewingApp}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <CheckSquare className="h-4 w-4" />
                {reviewingApp === selectedApp.id ? 'Approving…' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
