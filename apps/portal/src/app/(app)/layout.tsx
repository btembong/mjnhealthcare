'use client';

import { AppShell, Skeleton } from '@mjn/ui';
import {
  SquaresFour, FileText, CreditCard, BookOpen, CalendarBlank,
  GearSix, SignOut, Bell, MagnifyingGlass, UploadSimple,
  CheckCircle, X, ShoppingCart, Briefcase, GraduationCap,
  WarningCircle, Signature, ArrowRight, ChatCircle, Headset,
} from '@phosphor-icons/react';
import { UserProvider, useUser } from '../../contexts/user-context';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ── Sidebar ──────────────────────────────────────────────────────────────────

const sidebarSections = [
  {
    items: [
      { label: 'Dashboard', href: '/', icon: SquaresFour },
      { label: 'My Case', href: '/case', icon: FileText },
      { label: 'Documents', href: '/documents', icon: UploadSimple },
      { label: 'Payments', href: '/payments', icon: CreditCard },
      { label: 'Checkout', href: '/checkout', icon: ShoppingCart },
    ],
  },
  {
    title: 'Opportunities',
    items: [
      { label: 'Job Opportunities', href: '/opportunities', icon: Briefcase },
      { label: 'Internships', href: '/internships', icon: GraduationCap },
    ],
  },
  {
    title: 'Academy',
    items: [
      { label: 'My Courses', href: '/academy', icon: BookOpen },
      { label: 'Bookings', href: '/bookings', icon: CalendarBlank },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Messages', href: '/messages', icon: ChatCircle },
      { label: 'Get Help', href: '/tickets', icon: Headset },
    ],
  },
  {
    title: 'Account',
    items: [{ label: 'Settings', href: '/settings', icon: GearSix }],
  },
];

// ── Notification Bell ─────────────────────────────────────────────────────────

function NotificationBell({ count }: { count: number }) {
  const router = useRouter();
  const { documents, orders, engagement } = useUser();
  const [open, setOpen] = useState(false);

  type Notif = { icon: typeof WarningCircle; color: string; text: string; sub: string; href: string };
  const notifs: Notif[] = [];

  documents.filter((d) => d.status === 'REJECTED').forEach((d) => {
    notifs.push({
      icon: WarningCircle,
      color: 'text-rose-500',
      text: `${d.type?.replace(/_/g, ' ')} rejected`,
      sub: 'Re-upload required',
      href: '/documents',
    });
  });

  documents.filter((d) => {
    if (!d.expiryDate) return false;
    return Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000) <= 30;
  }).forEach((d) => {
    const days = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000);
    notifs.push({
      icon: WarningCircle,
      color: 'text-amber-500',
      text: `${d.type?.replace(/_/g, ' ')} expiring`,
      sub: days <= 0 ? 'Expired — renew now' : `${days} days left`,
      href: '/documents',
    });
  });

  orders.filter((o) => o.status === 'PENDING' || o.status === 'PARTIALLY_PAID').forEach((o) => {
    notifs.push({
      icon: CreditCard,
      color: 'text-rose-500',
      text: `Payment due: $${Number(o.total).toLocaleString()}`,
      sub: 'Tap to pay now',
      href: '/payments',
    });
  });

  if (engagement && engagement.letterStatus !== 'SIGNED' && engagement.letterUrl) {
    notifs.push({
      icon: Signature,
      color: 'text-amber-500',
      text: 'Engagement letter pending',
      sub: 'Sign to activate your case',
      href: '/case',
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl border border-border bg-white p-2 shadow-sm hover:bg-muted/50 transition"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border bg-white shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Notifications</p>
                {count > 0 && <p className="text-xs text-muted-foreground">{count} item{count !== 1 ? 's' : ''} need attention</p>}
              </div>
              <button onClick={() => setOpen(false)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
            {notifs.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <CheckCircle weight="fill" className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                <p className="text-xs font-semibold text-foreground">All caught up</p>
                <p className="text-xs text-muted-foreground mt-0.5">No issues require your attention.</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {notifs.map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => { setOpen(false); router.push(n.href); }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                    >
                      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${n.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground capitalize">{n.text}</p>
                        <p className="text-xs text-muted-foreground">{n.sub}</p>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Shell Skeleton ───────────────────────────────────────────────────────────

function ShellSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-14 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

// ── Inner Layout (needs UserContext) ─────────────────────────────────────────

function PortalShell({ children }: { children: React.ReactNode }) {
  const { me, documents, orders, engagement, loading, signOut } = useUser();

  const rejectedDocs = documents.filter((d) => d.status === 'REJECTED').length;
  const expiringDocs = documents.filter((d) => {
    if (!d.expiryDate) return false;
    return Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000) <= 30;
  }).length;
  const pendingPayments = orders.filter((o) => o.status === 'PENDING' || o.status === 'PARTIALLY_PAID').length;
  const pendingLetter = engagement && engagement.letterStatus !== 'SIGNED' && engagement.letterUrl ? 1 : 0;
  const alertCount = rejectedDocs + expiringDocs + pendingPayments + pendingLetter;

  // Profile completion
  const profileSteps = [
    !!(me?.name && me.name !== me.email),
    !!me?.profession,
    documents.length > 0,
    orders.length > 0,
  ];
  const profileCompletion = Math.round((profileSteps.filter(Boolean).length / profileSteps.length) * 100);

  return (
    <AppShell
      sections={sidebarSections}
      mobileBottomNav
      profileCompletion={profileCompletion < 100 ? profileCompletion : undefined}
      sidebarFooter={
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-rose-600 transition-colors"
        >
          <SignOut className="h-4 w-4" /> Sign out
        </button>
      }
      topbar={
        <>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search... (Ctrl+K)"
                readOnly
                onClick={() => {
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
                }}
                className="h-9 rounded-xl border border-border bg-muted/50 pl-9 pr-4 text-sm outline-none cursor-pointer hover:border-primary/30 w-44 transition"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell count={alertCount} />
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xs font-bold text-white shadow-sm">
                {(me?.name ?? me?.email ?? '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-none">
                  {me?.name && me.name !== me.email ? me.name : me?.email ?? 'Loading...'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-muted-foreground capitalize">{me?.profession ?? 'Healthcare Professional'}</p>
                  {me?.locale && (
                    <span className="rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-muted text-muted-foreground">
                      {me.locale}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      }
    >
      {loading ? <ShellSkeleton /> : children}
    </AppShell>
  );
}

// ── Exported Layout ──────────────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <PortalShell>{children}</PortalShell>
    </UserProvider>
  );
}
