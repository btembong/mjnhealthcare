'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api, isAuthenticated, clearToken } from '../lib/api';

type AdminState = {
  me: any | null;
  counts: {
    pendingDocs: number;
    pendingDrafts: number;
    leads: number;
    activeEngagements: number;
    totalPersons: number;
  };
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => void;
};

const AdminContext = createContext<AdminState | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [me, setMe] = useState<any>(null);
  const [counts, setCounts] = useState({
    pendingDocs: 0,
    pendingDrafts: 0,
    leads: 0,
    activeEngagements: 0,
    totalPersons: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    try {
      const [rMe, rPersons, rEngs, rDocs, rDrafts, rLeads] = await Promise.allSettled([
        api.getMe(),
        api.getPersons(),
        api.getAllEngagements(),
        api.getPendingDocuments(),
        api.getPendingDrafts(),
        api.getLeads(),
      ]);

      if (rMe.status === 'fulfilled') setMe(rMe.value);
      const persons = rPersons.status === 'fulfilled' ? rPersons.value ?? [] : [];
      const engs = rEngs.status === 'fulfilled' ? rEngs.value ?? [] : [];
      const docs = rDocs.status === 'fulfilled' ? rDocs.value ?? [] : [];
      const drafts = rDrafts.status === 'fulfilled' ? rDrafts.value ?? [] : [];
      const leads = rLeads.status === 'fulfilled' ? rLeads.value ?? [] : [];

      setCounts({
        pendingDocs: docs.length,
        pendingDrafts: drafts.length,
        leads: leads.length,
        activeEngagements: engs.filter((e: any) => e.status === 'ACTIVE').length,
        totalPersons: persons.length,
      });
    } catch {
      // handled by api client 401
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const signOut = useCallback(() => {
    clearToken();
    router.push('/login');
  }, [router]);

  return (
    <AdminContext.Provider value={{ me, counts, loading, refresh: load, signOut }}>
      {children}
    </AdminContext.Provider>
  );
}
