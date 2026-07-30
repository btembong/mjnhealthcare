'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@mjn/ui';
import {
  CircleNotch, MagnifyingGlass, UsersFour,
} from '@phosphor-icons/react';
import { api } from '../../../lib/api';

const ROLE_STYLES: Record<string, string> = {
  CANDIDATE: 'bg-blue-100 text-blue-700',
  CONSULTANT: 'bg-violet-100 text-violet-700',
  ADMIN: 'bg-rose-100 text-rose-700',
  PARTNER: 'bg-amber-100 text-amber-700',
};

export default function ClientsPage() {
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getPersons('CANDIDATE').then(setPersons).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = persons.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.phone?.includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" subtitle={`${filtered.length} of ${persons.length} candidates`} />

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <CircleNotch className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <UsersFour className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-semibold text-foreground">No clients found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search ? 'Try a different search.' : 'Clients appear here once they sign in via the portal.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Profession</th>
                <th className="px-4 py-3 font-medium">Locale</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((person: any) => (
                <tr key={person.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {person.name?.slice(0, 2).toUpperCase() ?? '??'}
                      </div>
                      <span className="font-medium text-foreground">{person.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{person.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{person.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{person.profession ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground uppercase text-xs">{person.locale ?? 'en'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${ROLE_STYLES[person.role] ?? 'bg-muted text-muted-foreground'}`}>
                      {person.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {person.createdAt ? new Date(person.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
