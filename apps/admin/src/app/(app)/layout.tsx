'use client';

import { AppShell, Skeleton } from '@mjn/ui';
import {
  UsersThree, FileText, Robot, BookOpen, UsersFour, Briefcase,
  ChartLineUp, SignOut, User, Tag, CalendarBlank, CurrencyDollar,
  MagnifyingGlass, VideoCamera, Gavel, GearSix, ClipboardText, Buildings,
  Headset, MegaphoneSimple, MapTrifold, ChartBar, ChatCircle,
  Clipboard, ListChecks, Warning,
} from '@phosphor-icons/react';
import { AdminProvider, useAdmin } from '../../contexts/admin-context';

// ── Role-gated sidebar sections ───────────────────────────────────────────────

type Role = 'ADMIN' | 'CONSULTANT' | 'COMPLIANCE' | 'PROCESSING_OFFICER' | string;

function getRoleFromToken(): string {
  if (typeof window === 'undefined') return '';
  const token = localStorage.getItem('mjn_admin_token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.role as string)?.toUpperCase() ?? '';
  } catch { return ''; }
}

function useSidebarSections(
  role: Role,
  counts: { pendingDocs: number; pendingDrafts: number; leads: number },
) {
  const isConsultant = role === 'CONSULTANT';
  const isCompliance = role === 'COMPLIANCE';
  const isOfficer = role === 'PROCESSING_OFFICER';

  if (isOfficer) {
    return [
      {
        items: [
          { label: 'My Caseload', href: '/officer/caseload', icon: UsersThree },
          { label: 'Documents', href: '/officer/documents', icon: FileText },
          { label: 'Stage Tracker', href: '/officer/stages', icon: ListChecks },
          { label: 'Case Notes', href: '/officer/notes', icon: Clipboard },
          { label: 'Escalations', href: '/officer/escalations', icon: Warning },
        ],
      },
      {
        title: 'Account',
        items: [
          { label: 'Settings', href: '/settings', icon: GearSix },
        ],
      },
    ];
  }

  if (isConsultant) {
    return [
      {
        items: [
          { label: 'My Dashboard', href: '/', icon: ChartLineUp },
          { label: 'My Caseload', href: '/caseload', icon: UsersThree },
          { label: 'Messages', href: '/messages', icon: ChatCircle },
          { label: 'Sessions', href: '/sessions', icon: VideoCamera },
          { label: 'Documents', href: '/documents', icon: FileText, badge: counts.pendingDocs > 0 ? String(counts.pendingDocs) : undefined },
          { label: 'AI Drafts', href: '/drafts', icon: Robot, badge: counts.pendingDrafts > 0 ? String(counts.pendingDrafts) : undefined },
          { label: 'Escalations', href: '/escalations', icon: Warning },
        ],
      },
      {
        title: 'Account',
        items: [
          { label: 'Settings', href: '/settings', icon: GearSix },
        ],
      },
    ];
  }

  if (isCompliance) {
    return [
      {
        items: [
          { label: 'Dashboard', href: '/', icon: ChartLineUp },
          { label: 'Documents', href: '/documents', icon: FileText, badge: counts.pendingDocs > 0 ? String(counts.pendingDocs) : undefined },
          { label: 'Caseload', href: '/caseload', icon: UsersThree },
        ],
      },
      {
        title: 'Compliance',
        items: [
          { label: 'Audit Log', href: '/audit', icon: Gavel },
          { label: 'Settings', href: '/settings', icon: GearSix },
        ],
      },
    ];
  }

  // ADMIN — full access
  return [
    {
      items: [
        { label: 'Dashboard', href: '/', icon: ChartLineUp },
        { label: 'Caseload', href: '/caseload', icon: UsersThree },
        { label: 'Clients', href: '/clients', icon: UsersFour },
        { label: 'Documents', href: '/documents', icon: FileText, badge: counts.pendingDocs > 0 ? String(counts.pendingDocs) : undefined },
        { label: 'AI Drafts', href: '/drafts', icon: Robot, badge: counts.pendingDrafts > 0 ? String(counts.pendingDrafts) : undefined },
      ],
    },
    {
      title: 'Academy',
      items: [
        { label: 'Courses', href: '/courses', icon: BookOpen },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Leads', href: '/leads', icon: UsersFour, badge: counts.leads > 0 ? String(counts.leads) : undefined },
        { label: 'Sessions', href: '/sessions', icon: VideoCamera },
        { label: 'Consultants', href: '/consultants', icon: Briefcase },
        { label: 'Jobs', href: '/jobs', icon: Briefcase },
        { label: 'Partners', href: '/partners', icon: Buildings },
        { label: 'Staff', href: '/staff', icon: User },
        { label: 'Officers', href: '/officers', icon: Clipboard },
        { label: 'Catalog', href: '/catalog', icon: Tag },
        { label: 'Bookings', href: '/bookings', icon: CalendarBlank },
        { label: 'Payments', href: '/payments', icon: CurrencyDollar },
      ],
    },
    {
      title: 'Engagement',
      items: [
        { label: 'Support Tickets', href: '/tickets', icon: Headset },
        { label: 'Campaigns', href: '/campaigns', icon: MegaphoneSimple },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Reports', href: '/reports', icon: ChartBar },
        { label: 'Pathways', href: '/pathways', icon: MapTrifold },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Audit Log', href: '/audit', icon: ClipboardText },
        { label: 'Settings', href: '/settings', icon: GearSix },
      ],
    },
  ];
}

// ── Shell Skeleton ────────────────────────────────────────────────────────────

function ShellSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
        <Skeleton className="lg:col-span-3 h-96 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

// ── Inner Layout ──────────────────────────────────────────────────────────────

function AdminShell({ children }: { children: React.ReactNode }) {
  const { me, counts, loading, signOut } = useAdmin();
  const role: Role = (me?.role as string)?.toUpperCase() || getRoleFromToken() || 'ADMIN';
  const sections = useSidebarSections(role, counts);

  const staffName = me?.name ?? 'Admin';
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  return (
    <AppShell
      sections={sections}
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
                placeholder="Search… (Ctrl+K)"
                readOnly
                onClick={() => {
                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
                }}
                className="h-9 rounded-xl border border-border bg-muted/50 pl-9 pr-4 text-sm outline-none cursor-pointer hover:border-primary/30 w-44 transition"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {/* Role badge */}
            <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              role === 'ADMIN' ? 'bg-primary/10 text-primary' :
              role === 'CONSULTANT' ? 'bg-violet-100 text-violet-700' :
              role === 'COMPLIANCE' ? 'bg-amber-100 text-amber-700' :
              'bg-muted text-muted-foreground'
            }`}>
              {roleLabel}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xs font-bold text-white shadow-sm">
              {staffName.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-foreground">{staffName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
        </>
      }
    >
      {loading ? <ShellSkeleton /> : children}
    </AppShell>
  );
}

// ── Exported Layout ───────────────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
