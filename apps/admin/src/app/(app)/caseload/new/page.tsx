'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@mjn/ui';
import {
  MagnifyingGlass, User, Briefcase, ArrowLeft,
  CircleNotch, Check, UserPlus,
} from '@phosphor-icons/react';
import { api } from '../../../../lib/api';

type Person = {
  id: string;
  name?: string;
  email?: string;
  profession?: string;
  role?: string;
};

type Consultant = {
  id: string;
  name?: string;
  specialty?: string;
  category?: string;
};

export default function NewEngagementPage() {
  const router = useRouter();
  const [persons, setPersons] = useState<Person[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [personSearch, setPersonSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.allSettled([api.getPersons(), api.getConsultants(true)])
      .then(([rPersons, rConsultants]) => {
        if (rPersons.status === 'fulfilled') setPersons(rPersons.value ?? []);
        if (rConsultants.status === 'fulfilled') setConsultants(rConsultants.value ?? []);
      })
      .finally(() => setLoadingData(false));
  }, []);

  const filteredPersons = persons.filter((p) => {
    if (!personSearch) return true;
    const q = personSearch.toLowerCase();
    return (
      (p.name ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q) ||
      (p.profession ?? '').toLowerCase().includes(q)
    );
  });

  async function handleSubmit() {
    if (!selectedPerson) return;
    setError('');
    setSubmitting(true);
    try {
      const eng = await api.createEngagement({
        personId: selectedPerson.id,
        consultantId: selectedConsultant?.id,
      });
      router.push('/caseload/' + eng.id);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create engagement');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <PageHeader
        title="New Engagement"
        subtitle="Create a consulting engagement and optionally assign a consultant."
      />

      {/* Step 1 — Select client */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">1</div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Select client</h3>
            <p className="text-xs text-muted-foreground">Choose the person this engagement is for.</p>
          </div>
          {selectedPerson && (
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <Check className="h-3 w-3" /> {selectedPerson.name ?? selectedPerson.email}
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={personSearch}
              onChange={(e) => setPersonSearch(e.target.value)}
              placeholder="Search by name, email or profession…"
              className="h-10 w-full rounded-xl border border-border bg-muted/30 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white transition-colors"
            />
          </div>

          {/* Person list */}
          {loadingData ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {filteredPersons.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No persons found.</p>
              ) : (
                filteredPersons.map((p) => {
                  const isSelected = selectedPerson?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPerson(isSelected ? null : p)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/30 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#00A896] text-white text-xs font-bold">
                        {(p.name ?? p.email ?? '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{p.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email ?? p.id}</p>
                      </div>
                      {p.profession && (
                        <span className="shrink-0 rounded-full bg-muted/60 px-2.5 py-0.5 text-xs text-muted-foreground capitalize">
                          {p.profession.toLowerCase()}
                        </span>
                      )}
                      {isSelected && (
                        <div className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 2 — Assign consultant (optional) */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">2</div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Assign consultant <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
            </h3>
            <p className="text-xs text-muted-foreground">You can assign or reassign from the case page later.</p>
          </div>
          {selectedConsultant && (
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
              <Check className="h-3 w-3" /> {selectedConsultant.name}
            </div>
          )}
        </div>

        <div className="p-5">
          {loadingData ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : consultants.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No consultants registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {consultants.map((c) => {
                const isSelected = selectedConsultant?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConsultant(isSelected ? null : c)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-200'
                        : 'border-border hover:border-violet-300 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white text-xs font-bold">
                      {(c.name ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{c.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground capitalize truncate">
                        {(c.specialty ?? c.category ?? 'Consultant').toLowerCase().replace(/_/g, ' ')}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedPerson || submitting}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#00A896] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {submitting ? (
            <CircleNotch className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {submitting ? 'Creating…' : 'Create engagement'}
        </button>
      </div>
    </div>
  );
}
