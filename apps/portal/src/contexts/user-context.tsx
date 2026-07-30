'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, isAuthenticated, clearToken } from '../lib/api';

type UserState = {
  me: any | null;
  engagement: any | null;
  allEngagements: any[];
  progress: any | null;
  documents: any[];
  orders: any[];
  bookings: any[];
  consultationBookings: any[];
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => void;
  switchEngagement: (eng: any) => void;
};

const UserContext = createContext<UserState | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [me, setMe] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [allEngagements, setAllEngagements] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [consultationBookings, setConsultationBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    try {
      const person = await api.getMe();
      setMe(person);

      const [engRes, docRes, ordRes, bookRes, consultRes] = await Promise.allSettled([
        api.getEngagements(person.id),
        api.getDocuments(person.id),
        api.getOrdersByPerson(person.id),
        api.getBookings(person.id),
        person.email ? api.getMyConsultationBookings(person.email) : Promise.resolve([]),
      ]);

      const engs = engRes.status === 'fulfilled' ? engRes.value ?? [] : [];
      const active = engs.find((e: any) => e.status === 'ACTIVE') ?? engs[0] ?? null;
      setAllEngagements(engs);
      setEngagement(active);
      setDocuments(docRes.status === 'fulfilled' ? docRes.value ?? [] : []);
      setOrders(ordRes.status === 'fulfilled' ? ordRes.value ?? [] : []);
      setBookings(bookRes.status === 'fulfilled' ? bookRes.value ?? [] : []);
      setConsultationBookings(consultRes.status === 'fulfilled' ? consultRes.value ?? [] : []);

      if (active) {
        api.getProgress(person.id, active.id).then(setProgress).catch(() => {});
      }
    } catch {
      // getMe failed — likely 401, clearToken already handled by api client
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const signOut = useCallback(() => {
    clearToken();
    router.push('/login');
  }, [router]);

  const switchEngagement = useCallback((eng: any) => {
    setEngagement(eng);
    setProgress(null);
    if (me && eng) {
      api.getProgress(me.id, eng.id).then(setProgress).catch(() => {});
    }
  }, [me]);

  return (
    <UserContext.Provider value={{
      me, engagement, allEngagements, progress,
      documents, orders, bookings, consultationBookings,
      loading, refresh: load, signOut, switchEngagement,
    }}>
      {children}
    </UserContext.Provider>
  );
}
