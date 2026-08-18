'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, Button } from '@mjn/ui';
import {
  CircleNotch, User, Plus, X, WarningCircle, CaretDown,
  CheckCircle, XCircle, IdentificationBadge,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const ROLES = ['ADMIN', 'CONSULTANT', 'COMPLIANCE', 'PROCESSING_OFFICER', 'FINANCE'] as const;

const ROLE_STYLES: Record<string, string> = {
  CONSULTANT: 'bg-violet-100 text-violet-700',
  ADMIN: 'bg-rose-100 text-rose-700',
  COMPLIANCE: 'bg-amber-100 text-amber-700',
  FINANCE: 'bg-emerald-100 text-emerald-700',
  PROCESSING_OFFICER: 'bg-sky-100 text-sky-700',
};

const CATEGORIES = ['HEALTH', 'CAREER', 'BOTH'] as const;
const LANGUAGES = ['English', 'French', 'Arabic', 'Portuguese', 'Swahili'];

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [consultantProfiles, setConsultantProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Add staff modal fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CONSULTANT' | 'ADMIN' | 'COMPLIANCE' | 'PROCESSING_OFFICER' | 'FINANCE'>('CONSULTANT');

  // Create consultant profile modal
  const [profileTarget, setProfileTarget] = useState<{ name: string; email: string } | null>(null);
  const [cpBio, setCpBio] = useState('');
  const [cpSpecialty, setCpSpecialty] = useState('');
  const [cpCategory, setCpCategory] = useState<string>('CAREER');
  const [cpPrice, setCpPrice] = useState('150');
  const [cpLangs, setCpLangs] = useState<string[]>(['English']);
  const [cpSaving, setCpSaving] = useState(false);
  const [cpError, setCpError] = useState('');

  const [loadError, setLoadError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setLoadError('');
    try {
      const [all, profiles] = await Promise.all([
        api.getPersons(),
        api.getConsultants().catch(() => []),
      ]);
      setStaff(all.filter((p: any) => ['ADMIN', 'CONSULTANT', 'COMPLIANCE', 'PROCESSING_OFFICER', 'FINANCE'].includes(p.role?.toUpperCase())));
      setConsultantProfiles(profiles);
    } catch (err: any) {
      setLoadError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const created = await api.registerStaff({ name, email, password, role });
      setStaff((prev) => [...prev, created]);
      setShowModal(false);
      setName(''); setEmail(''); setPassword(''); setRole('CONSULTANT');
      toast.success('Staff member created.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    setActionId(id + '_role');
    try {
      await api.updateStaffRole(id, newRole);
      setStaff((s) => s.map((p) => p.id === id ? { ...p, role: newRole } : p));
      toast.success('Role updated.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionId(null);
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    setActionId(id + '_active');
    try {
      await api.setStaffActive(id, !current);
      setStaff((s) => s.map((p) => p.id === id ? { ...p, isActive: !current } : p));
      toast.success(!current ? 'Staff member reactivated.' : 'Staff member deactivated.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionId(null);
    }
  }

  function openProfileModal(person: any) {
    setProfileTarget({ name: person.name ?? '', email: person.email ?? '' });
    setCpBio('');
    setCpSpecialty('');
    setCpCategory('CAREER');
    setCpPrice('150');
    setCpLangs(['English']);
    setCpError('');
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profileTarget) return;
    setCpSaving(true);
    setCpError('');
    try {
      const created = await api.createConsultant({
        name: profileTarget.name,
        email: profileTarget.email,
        bio: cpBio,
        specialty: cpSpecialty,
        languages: cpLangs,
        type: 'STAFF',
        consultationCategory: cpCategory,
        priceUsd: parseFloat(cpPrice) || 150,
      });
      setConsultantProfiles((prev) => [...prev, created]);
      setProfileTarget(null);
      toast.success('Consultant profile created. Cases will now appear on their dashboard.');
    } catch (err: any) {
      setCpError(err.message ?? 'Failed to create profile.');
    } finally {
      setCpSaving(false);
    }
  }

  function toggleLang(lang: string) {
    setCpLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  const profileEmails = new Set(consultantProfiles.map((p: any) => p.email?.toLowerCase()));

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader title="Staff" subtitle={`${staff.length} member${staff.length !== 1 ? 's' : ''}`} />
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        </div>

        {loadError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <strong>Error loading staff:</strong> {loadError}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <CircleNotch className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : staff.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
            <User className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-foreground">No staff yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first consultant or admin above.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {staff.map((person: any) => {
                const isActive = person.isActive !== false;
                const isConsultant = person.role?.toUpperCase() === 'CONSULTANT';
                const hasProfile = isConsultant && profileEmails.has(person.email?.toLowerCase());
                return (
                  <div
                    key={person.id}
                    className={`flex flex-wrap items-center gap-4 px-6 py-4 transition-colors ${!isActive ? 'bg-muted/30 opacity-60' : 'hover:bg-muted/20'}`}
                  >
                    {/* Avatar + name/email */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {person.name?.slice(0, 2).toUpperCase() ?? '??'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{person.name ?? '—'}</p>
                          {isConsultant && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${hasProfile ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {hasProfile ? 'Profile linked' : 'No profile'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{person.email ?? '—'}</p>
                      </div>
                    </div>

                    {/* Joined date */}
                    <span className="hidden sm:block shrink-0 text-xs text-muted-foreground">
                      Joined {person.createdAt ? new Date(person.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                    </span>

                    {/* Create profile button for consultants without one */}
                    {isConsultant && !hasProfile && (
                      <button
                        onClick={() => openProfileModal(person)}
                        className="shrink-0 flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
                      >
                        <IdentificationBadge className="h-3 w-3" /> Create Profile
                      </button>
                    )}

                    {/* Role selector */}
                    <div className="relative shrink-0">
                      {actionId === person.id + '_role' ? (
                        <CircleNotch className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <>
                          <select
                            value={person.role}
                            onChange={(e) => handleRoleChange(person.id, e.target.value)}
                            disabled={!!actionId}
                            className={`h-8 appearance-none rounded-full pl-2.5 pr-6 text-xs font-bold outline-none cursor-pointer disabled:opacity-40 ${ROLE_STYLES[person.role] ?? 'bg-muted text-muted-foreground'}`}
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <CaretDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
                        </>
                      )}
                    </div>

                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(person.id, isActive)}
                      disabled={!!actionId}
                      className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                        isActive
                          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {actionId === person.id + '_active'
                        ? <CircleNotch className="h-3 w-3 animate-spin" />
                        : isActive
                          ? <><XCircle className="h-3 w-3" /> Deactivate</>
                          : <><CheckCircle className="h-3 w-3" /> Reactivate</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Add Staff Member</h2>
              <button onClick={() => { setShowModal(false); setError(''); }} className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Full name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Password</label>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="CONSULTANT">Consultant</option>
                  <option value="ADMIN">Admin</option>
                  <option value="COMPLIANCE">Compliance</option>
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-600">
                  <WarningCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'Creating…' : 'Create staff member'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); setError(''); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Consultant Profile Modal */}
      {profileTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Create Consultant Profile</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  For <span className="font-semibold text-foreground">{profileTarget.name}</span> ({profileTarget.email})
                </p>
              </div>
              <button onClick={() => setProfileTarget(null)} className="rounded-lg p-1.5 hover:bg-muted/60 transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-violet-50 border border-violet-200 px-4 py-3 text-xs text-violet-700">
              Once created, this consultant's cases will appear on their dashboard and they'll be bookable by clients.
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Specialty</label>
                <input required value={cpSpecialty} onChange={(e) => setCpSpecialty(e.target.value)}
                  placeholder="e.g. UAE Licensing, NCLEX Prep, Career Placement"
                  className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-foreground">Bio</label>
                <textarea required value={cpBio} onChange={(e) => setCpBio(e.target.value)}
                  rows={3} placeholder="Short professional bio shown to clients"
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-foreground">Consultation category</label>
                  <select value={cpCategory} onChange={(e) => setCpCategory(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-foreground">Session price (USD)</label>
                  <input required type="number" min="0" step="1" value={cpPrice} onChange={(e) => setCpPrice(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLang(lang)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                        cpLangs.includes(lang)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-white text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {cpError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-600">
                  <WarningCircle className="h-4 w-4 shrink-0" /> {cpError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={cpSaving || cpLangs.length === 0} className="flex-1">
                  {cpSaving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <IdentificationBadge className="h-4 w-4" />}
                  {cpSaving ? 'Creating…' : 'Create consultant profile'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setProfileTarget(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
