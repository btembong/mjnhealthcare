'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@mjn/ui';
import {
  CircleNotch, CalendarBlank, Trash, Plus, CheckCircle,
  Clock, User, EnvelopeSimple,
} from '@mjn/ui';
import { api } from '../../../lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Douala',
  }) + ' WAT';
}

function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }

function buildDateOptions() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return toDateStr(d);
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FreeSlotsPage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState('');

  // New slot form
  const [newDate, setNewDate] = useState(buildDateOptions()[0]);
  const [newTimes, setNewTimes] = useState<string[]>(['09:00', '11:00', '14:00', '16:00']);
  const [customTime, setCustomTime] = useState('');

  const dateOptions = buildDateOptions();

  useEffect(() => {
    api.getGeneralConsultationSlots().then((data) => setSlots(data ?? [])).finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  function toggleTime(t: string) {
    setNewTimes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function addCustomTime() {
    const t = customTime.trim();
    if (!t || newTimes.includes(t)) return;
    setNewTimes((prev) => [...prev, t].sort());
    setCustomTime('');
  }

  async function handleCreate() {
    if (newTimes.length === 0) { showToast('Select at least one time slot'); return; }
    setCreating(true);
    try {
      const slotsPayload = newTimes.map((time) => {
        const [h, m] = time.split(':').map(Number);
        const start = new Date(`${newDate}T${time}:00.000Z`);
        const end = new Date(start.getTime() + 30 * 60 * 1000); // 30-min sessions
        return {
          date: newDate,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        };
      });
      await api.createFreeConsultationSlots(slotsPayload);
      const updated = await api.getGeneralConsultationSlots();
      setSlots(updated ?? []);
      showToast(`${slotsPayload.length} slot${slotsPayload.length > 1 ? 's' : ''} created`);
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(slotId: string) {
    setDeleting(slotId);
    try {
      await api.deleteFreeConsultationSlot(slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      showToast('Slot deleted');
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  const booked = slots.filter((s) => s.isBooked);
  const available = slots.filter((s) => !s.isBooked);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Free Consultation Slots"
        subtitle={`${available.length} available · ${booked.length} booked — these appear on the /get-started booking page`}
      />

      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toast}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

        {/* ── Add slots form ── */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-foreground">Add Availability</h3>

          {/* Date picker */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</label>
            <select
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              {dateOptions.map((d) => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          {/* Time slots */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time slots (WAT)</label>
            <div className="grid grid-cols-4 gap-2">
              {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTime(t)}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                    newTimes.includes(t)
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-white text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Custom time */}
          <div className="mb-5 flex gap-2">
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Custom time"
            />
            <button
              onClick={addCustomTime}
              className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted/60 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

          {/* Selected times preview */}
          {newTimes.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {newTimes.sort().map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
                  <Clock className="h-3 w-3" /> {t}
                  <button onClick={() => toggleTime(t)} className="ml-0.5 text-primary/60 hover:text-primary">×</button>
                </span>
              ))}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={creating || newTimes.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {creating
              ? <><CircleNotch className="h-4 w-4 animate-spin" /> Creating…</>
              : <><CalendarBlank className="h-4 w-4" /> Create {newTimes.length} slot{newTimes.length !== 1 ? 's' : ''}</>
            }
          </button>

          <p className="mt-3 text-xs text-muted-foreground">Each slot is 30 minutes. Times are in West Africa Time (WAT, UTC+1).</p>
        </div>

        {/* ── Slots list ── */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16"><CircleNotch className="h-7 w-7 animate-spin text-primary" /></div>
          ) : slots.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
              <CalendarBlank className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No upcoming slots. Add availability on the left — slots appear on the public booking page.</p>
            </div>
          ) : (
            <>
              {/* Available */}
              {available.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Available ({available.length})</h4>
                  <div className="space-y-2">
                    {available.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                            <Clock className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{formatSlotTime(slot.startTime)}</p>
                            <p className="text-xs text-muted-foreground">30 min · Available</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          disabled={deleting === slot.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                        >
                          {deleting === slot.id ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booked */}
              {booked.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Booked ({booked.length})</h4>
                  <div className="space-y-2">
                    {booked.map((slot) => {
                      const booking = slot.bookings?.[0];
                      const lead = booking?.lead;
                      return (
                        <div key={slot.id} className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <CheckCircle className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{formatSlotTime(slot.startTime)}</p>
                                <p className="text-xs text-muted-foreground">30 min · Booked</p>
                              </div>
                            </div>
                          </div>
                          {lead && (
                            <div className="mt-2 ml-11 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs text-foreground">
                                <User className="h-3 w-3 text-muted-foreground" /> {lead.name}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <EnvelopeSimple className="h-3 w-3" />
                                <a href={`mailto:${lead.email}`} className="hover:text-primary">{lead.email}</a>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
