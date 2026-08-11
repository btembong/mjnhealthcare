const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.mjnhealthcare.com') + '/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mjn_admin_token');
}

export function setToken(token: string) {
  localStorage.setItem('mjn_admin_token', token);
  document.cookie = `mjn_admin_token=${token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`;
}

export function clearToken() {
  localStorage.removeItem('mjn_admin_token');
  document.cookie = 'mjn_admin_token=; path=/; max-age=0';
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorised');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).message ?? `Request failed: ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────
  loginStaff: (email: string, password: string) =>
    request<{ access_token: string }>('/auth/login/staff', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  registerStaff: (data: { name: string; email: string; password: string; role: string }) =>
    request<any>('/auth/register/staff', { method: 'POST', body: JSON.stringify(data) }),

  // ── Auth ─────────────────────────────────────────────────────────────────
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ access_token: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  // ── Persons ─────────────────────────────────────────────────────────────
  getMe: () => request<any>('/persons/me'),

  updateMe: (data: { name?: string; email?: string }) =>
    request<any>('/persons/me', { method: 'PATCH', body: JSON.stringify(data) }),

  getPersons: (role?: string) =>
    request<any[]>(`/persons${role ? `?role=${role}` : ''}`),

  getStaff: () => request<any[]>('/persons/staff/list'),

  updateStaffCredentials: (id: string, data: { name?: string; email?: string; password?: string }) =>
    request<any>(`/persons/${id}/credentials`, { method: 'PATCH', body: JSON.stringify(data) }),

  updateStaffRole: (id: string, role: string) =>
    request<any>(`/persons/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  setStaffActive: (id: string, isActive: boolean) =>
    request<any>(`/persons/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),

  // ── System Config ─────────────────────────────────────────────────────────
  getSystemConfig: () => request<Record<string, string>>('/persons/system/config'),

  updateSystemConfig: (data: Record<string, string>) =>
    request<Record<string, string>>('/persons/system/config', { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Compliance ────────────────────────────────────────────────────────────
  getAuditLog: (params?: { resourceType?: string; resourceId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.resourceType) qs.set('resourceType', params.resourceType);
    if (params?.resourceId) qs.set('resourceId', params.resourceId);
    const q = qs.toString();
    return request<any[]>(`/compliance/audit-log${q ? `?${q}` : ''}`);
  },

  // ── Engagements ─────────────────────────────────────────────────────────
  getAllEngagements: () => request<any[]>('/engagements'),

  // ── Documents ───────────────────────────────────────────────────────────
  getPendingDocuments: () => request<any[]>('/documents?status=PENDING'),

  getAllDocuments: (status?: string) =>
    request<any[]>(`/documents${status && status !== 'ALL' ? `?status=${status}` : ''}`),

  getDocumentsByPerson: (personId: string) =>
    request<any[]>(`/documents/person/${personId}`),

  verifyDocument: (id: string, verifiedBy: string) =>
    request<any>(`/documents/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ verifiedBy, status: 'VERIFIED' }),
    }),

  rejectDocument: (id: string, verifiedBy: string, rejectionReason?: string) =>
    request<any>(`/documents/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ verifiedBy, rejectionReason }),
    }),

  getDocumentViewUrl: (id: string) =>
    request<{ url: string }>(`/documents/${id}/view-url`),

  // ── AI Drafts ────────────────────────────────────────────────────────────
  getPendingDrafts: () => request<any[]>('/ai/drafts/pending'),

  approveDraft: (id: string, reviewedBy: string) =>
    request<any>(`/ai/drafts/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewedBy }),
    }),

  // ── Leads ────────────────────────────────────────────────────────────────
  getLeads: () => request<any[]>('/leads'),

  updateLeadStatus: (id: string, status: string) =>
    request<any>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  assignLeadConsultant: (id: string, consultantId: string) =>
    request<any>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'CONTACTED', assignedConsultantId: consultantId }) }),

  convertLead: (id: string) =>
    request<any>(`/leads/${id}/convert`, { method: 'PATCH' }),

  // ── Catalog (admin) ───────────────────────────────────────────────────────
  getCatalogCategories: () => request<any[]>('/catalog/categories'),

  updateCatalogItem: (id: string, data: { priceUsd?: number; name?: string; description?: string }) =>
    request<any>(`/catalog/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Orders (admin) ────────────────────────────────────────────────────────
  getAllOrders: () => request<any[]>('/orders/admin'),

  // ── Bookings (admin) ──────────────────────────────────────────────────────
  getAllBookings: () => request<any[]>('/bookings/admin'),

  // ── Academy (admin) ───────────────────────────────────────────────────────
  getCoursesAdmin: () => request<any[]>('/academy/courses/admin'),

  getCourse: (id: string) => request<any>(`/academy/courses/${id}`),

  createCourse: (data: { title: string; description?: string; locale: 'en' | 'fr'; examType: string; durationHours?: number; isPublished?: boolean }) =>
    request<any>('/academy/courses', { method: 'POST', body: JSON.stringify(data) }),

  updateCourse: (id: string, data: { title?: string; description?: string; isPublished?: boolean; durationHours?: number; examType?: string; locale?: string }) =>
    request<any>(`/academy/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  enrollPerson: (personId: string, courseId: string) =>
    request<any>('/academy/enroll', { method: 'POST', body: JSON.stringify({ personId, courseId }) }),

  // Modules
  createModule: (courseId: string, data: { title: string }) =>
    request<any>(`/academy/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify(data) }),

  updateModule: (id: string, data: { title?: string }) =>
    request<any>(`/academy/modules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteModule: (id: string) =>
    request<any>(`/academy/modules/${id}`, { method: 'DELETE' }),

  // Lessons
  createLesson: (moduleId: string, data: { title: string; type: 'VIDEO' | 'PDF' | 'TEXT'; contentUrl?: string; body?: string }) =>
    request<any>(`/academy/modules/${moduleId}/lessons`, { method: 'POST', body: JSON.stringify(data) }),

  updateLesson: (id: string, data: { title?: string; type?: string; contentUrl?: string; body?: string }) =>
    request<any>(`/academy/lessons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteLesson: (id: string) =>
    request<any>(`/academy/lessons/${id}`, { method: 'DELETE' }),

  // Live sessions
  scheduleLiveSession: (courseId: string, data: { title: string; scheduledAt: string; durationMins?: number }) =>
    request<any>(`/academy/courses/${courseId}/sessions`, { method: 'POST', body: JSON.stringify(data) }),

  getCourseSessions: (courseId: string) =>
    request<any[]>(`/academy/courses/${courseId}/sessions`),

  startLiveSession: (id: string) =>
    request<{ meetingUrl: string; hostToken: string }>(`/academy/sessions/${id}/start`, { method: 'POST' }),

  endLiveSession: (id: string) =>
    request<any>(`/academy/sessions/${id}/end`, { method: 'POST' }),

  cancelLiveSession: (id: string) =>
    request<any>(`/academy/sessions/${id}`, { method: 'DELETE' }),

  // Question banks
  getQuestionBanks: (examType?: string) =>
    request<any[]>(`/academy/question-banks${examType ? `?examType=${examType}` : ''}`),

  createQuestionBank: (data: { courseId?: string; title: string; examType: string; locale: 'en' | 'fr' }) =>
    request<any>('/academy/question-banks', { method: 'POST', body: JSON.stringify(data) }),

  getQuestions: (bankId: string) => request<any[]>(`/academy/question-banks/${bankId}/questions`),

  createQuestion: (bankId: string, data: { stem: string; options: string[]; correctIndex: number; explanation?: string; topic?: string }) =>
    request<any>(`/academy/question-banks/${bankId}/questions`, { method: 'POST', body: JSON.stringify(data) }),

  // ── Study Plans (admin) ───────────────────────────────────────────────────
  getStudyPlan: (personId: string) =>
    request<any>(`/academy/study-plan/${personId}`),

  createStudyPlan: (personId: string, items: { topic: string; dueDate?: string }[]) =>
    request<any>(`/academy/study-plan/${personId}`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  // ── Consultations ─────────────────────────────────────────────────────────
  getConsultants: () => request<any[]>('/consultations/admin/consultants'),

  createConsultant: (data: {
    name: string; email?: string; bio: string; specialty: string; languages: string[];
    type: 'STAFF' | 'PARTNER'; consultationCategory: string;
    priceUsd: number; commissionRate?: number; photoUrl?: string;
  }) => request<any>('/consultations/admin/consultants', { method: 'POST', body: JSON.stringify(data) }),

  updateConsultant: (id: string, data: {
    name?: string; email?: string; specialty?: string; bio?: string; photoUrl?: string;
    consultationCategory?: string; languages?: string[];
    priceUsd?: number; sessionDurationMins?: number;
    commissionRate?: number; isActive?: boolean; status?: string;
  }) =>
    request<any>(`/consultations/admin/consultants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deactivateConsultant: (id: string) =>
    request<any>(`/consultations/admin/consultants/${id}/deactivate`, { method: 'PATCH' }),

  reactivateConsultant: (id: string) =>
    request<any>(`/consultations/admin/consultants/${id}/reactivate`, { method: 'PATCH' }),

  deleteConsultant: (id: string) =>
    request<any>(`/consultations/admin/consultants/${id}`, { method: 'DELETE' }),

  getConsultantSlots: (consultantId: string) =>
    request<any[]>(`/consultations/admin/consultants/${consultantId}/slots`),

  createSlotsBulk: (slots: { consultantId: string; startAt: string; durationMinutes: number }[]) =>
    request<any>('/consultations/admin/slots/bulk', {
      method: 'POST',
      body: JSON.stringify({ slots }),
    }),

  deleteSlot: (slotId: string) =>
    request<any>(`/consultations/admin/slots/${slotId}`, { method: 'DELETE' }),

  getPayoutQueue: () => request<any[]>('/consultations/admin/payouts'),

  markPayoutPaid: (id: string) =>
    request<any>(`/consultations/admin/payouts/${id}/mark-paid`, { method: 'PATCH' }),

  getConsultantApplications: (status?: string) =>
    request<any[]>(`/consultations/admin/applications${status ? `?status=${status}` : ''}`),

  reviewApplication: (id: string, decision: 'APPROVE' | 'REJECT', notes?: string) =>
    request<any>(`/consultations/admin/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    }),

  getSessions: (params?: { consultantId?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.consultantId) qs.set('consultantId', params.consultantId);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString();
    return request<any[]>(`/consultations/admin/sessions${q ? `?${q}` : ''}`);
  },

  markSessionCompleted: (bookingId: string) =>
    request<any>(`/consultations/admin/bookings/${bookingId}/complete`, { method: 'POST' }),

  getHostJoinInfo: (bookingId: string) =>
    request<{ roomUrl: string | null; token: string | null; clientName: string; message: string | null }>(
      `/consultations/admin/bookings/${bookingId}/join`,
    ),

  // ── Partners (admin) ──────────────────────────────────────────────────────
  getPartners: (status?: string) =>
    request<any[]>(`/partners${status ? `?status=${status}` : ''}`),

  createPartner: (data: { name: string; type: string; contactEmail: string }) =>
    request<any>('/partners', { method: 'POST', body: JSON.stringify(data) }),

  verifyPartner: (id: string) =>
    request<any>(`/partners/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verifiedBy: 'admin' }) }),

  // ── Staffing (admin) ───────────────────────────────────────────────────────
  getOpportunities: (params?: { country?: string; profession?: string }) => {
    const qs = new URLSearchParams();
    if (params?.country) qs.set('country', params.country);
    if (params?.profession) qs.set('profession', params.profession);
    const q = qs.toString();
    return request<any[]>(`/staffing/opportunities${q ? `?${q}` : ''}`);
  },

  createOpportunity: (data: {
    partnerId: string; title: string; country: string;
    profession?: string; type: string; description?: string;
    requirements?: string; salaryRange?: string; closingDate?: string;
  }) => request<any>('/staffing/admin/opportunities', { method: 'POST', body: JSON.stringify(data) }),

  updateOpportunity: (id: string, data: Partial<{ title: string; description: string; requirements: string; salaryRange: string; status: string; closingDate: string }>) =>
    request<any>(`/staffing/admin/opportunities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteOpportunity: (id: string) =>
    request<any>(`/staffing/admin/opportunities/${id}`, { method: 'DELETE' }),

  getAllApplications: (params?: { status?: string; opportunityId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.opportunityId) qs.set('opportunityId', params.opportunityId);
    const q = qs.toString();
    return request<any[]>(`/staffing/admin/applications${q ? `?${q}` : ''}`);
  },

  updateApplicationStatus: (id: string, status: string, notes?: string) =>
    request<any>(`/staffing/admin/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  markDeployed: (personId: string, opportunityId: string) =>
    request<any>('/staffing/admin/deploy', { method: 'POST', body: JSON.stringify({ personId, opportunityId }) }),

  // ── Engagements (admin) ───────────────────────────────────────────────────
  getEngagementById: (id: string) => request<any>(`/engagements/${id}`),
  getClientEngagements: (personId: string) => request<any[]>(`/engagements/client/${personId}`),
  sendDocumentChecklist: (engagementId: string, pathwayKey: string) =>
    request<any>(`/engagements/${engagementId}/send-checklist`, { method: 'POST', body: JSON.stringify({ pathwayKey }) }),

  createEngagement: (data: { personId: string; consultantId?: string }) =>
    request<any>('/engagements', { method: 'POST', body: JSON.stringify(data) }),

  assignConsultant: (engagementId: string, consultantId: string) =>
    request<any>(`/engagements/${engagementId}/assign-consultant`, {
      method: 'PATCH',
      body: JSON.stringify({ consultantId }),
    }),

  sendEngagementLetter: (engagementId: string) =>
    request<any>(`/engagements/${engagementId}/send-signature`, { method: 'POST' }),

  updateEngagementStatus: (engagementId: string, status: string) =>
    request<any>(`/engagements/${engagementId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  addMilestone: (engagementId: string, label: string) =>
    request<any>(`/engagements/${engagementId}/milestones`, {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),

  completeMilestone: (milestoneId: string) =>
    request<any>(`/engagements/milestones/${milestoneId}/complete`, { method: 'PATCH' }),

  // ── Support Tickets (admin) ───────────────────────────────────────────────
  getAllTickets: (status?: string) =>
    request<any[]>(`/tickets${status ? `?status=${status}` : ''}`),

  getTicket: (id: string) => request<any>(`/tickets/${id}`),

  replyToTicket: (id: string, content: string) =>
    request<any>(`/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ content }) }),

  updateTicketStatus: (id: string, status: string, assignedConsultantId?: string) =>
    request<any>(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, assignedConsultantId }) }),

  updateTicketPriority: (id: string, priority: string) =>
    request<any>(`/tickets/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) }),

  // ── Campaigns (admin) ─────────────────────────────────────────────────────
  getCampaigns: (status?: string) =>
    request<any[]>(`/campaigns${status ? `?status=${status}` : ''}`),

  getCampaign: (id: string) => request<any>(`/campaigns/${id}`),

  createCampaign: (data: { name: string; subject: string; body: string; audienceFilter?: any; scheduledAt?: string }) =>
    request<any>('/campaigns', { method: 'POST', body: JSON.stringify(data) }),

  updateCampaign: (id: string, data: { name?: string; subject?: string; body?: string; scheduledAt?: string; audienceFilter?: Record<string, any> }) =>
    request<any>(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  sendCampaignNow: (id: string) =>
    request<any>(`/campaigns/${id}/send`, { method: 'POST' }),

  cancelCampaign: (id: string) =>
    request<any>(`/campaigns/${id}/cancel`, { method: 'PATCH' }),

  // ── Payment Admin ─────────────────────────────────────────────────────────
  getPaymentStats: () => request<any>('/admin/payments/stats'),

  listPayments: (params?: { search?: string; status?: string; type?: string; dateFrom?: string; dateTo?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    if (params?.type) qs.set('type', params.type);
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    const q = qs.toString();
    return request<any[]>(`/admin/payments${q ? `?${q}` : ''}`);
  },

  getPaymentByRef: (ref: string) => request<any>(`/admin/payments/${ref}`),

  verifyPaymentTranzak: (ref: string) =>
    request<any>(`/admin/payments/${ref}/verify-tranzak`, { method: 'POST' }),

  validatePayment: (ref: string, adminNote?: string) =>
    request<{ success: boolean; message: string }>(`/admin/payments/${ref}/validate`, {
      method: 'POST',
      body: JSON.stringify({ adminNote }),
    }),

  cancelPayment: (ref: string, reason: string) =>
    request<{ success: boolean; message: string }>(`/admin/payments/${ref}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getPaymentsExportUrl: (params?: { search?: string; status?: string; type?: string; dateFrom?: string; dateTo?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    if (params?.type) qs.set('type', params.type);
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    const q = qs.toString();
    return `${API_BASE}/admin/payments/export${q ? `?${q}` : ''}`;
  },

  // ── Licensing Pathways (admin) ────────────────────────────────────────────
  getLicensingPathways: () => request<any[]>('/licensing/pathways'),

  createLicensingPathway: (data: {
    country: string;
    regulatoryBody: string;
    profession?: string;
    stages: { label: string; order: number; requiredDocs: string[] }[];
  }) => request<any>('/licensing/pathways', { method: 'POST', body: JSON.stringify(data) }),

  deleteLicensingPathway: (id: string) =>
    request<any>(`/licensing/pathways/${id}`, { method: 'DELETE' }),

  // ── Engagement messages (admin) ───────────────────────────────────────────
  getEngagementMessages: (engagementId: string) =>
    request<any[]>(`/messages/engagement/${engagementId}`),

  sendEngagementMessage: (engagementId: string, content: string) =>
    request<any>(`/messages/engagement/${engagementId}`, { method: 'POST', body: JSON.stringify({ content }) }),

  // ── Officer module ────────────────────────────────────────────────────────
  listOfficers: () => request<any[]>('/admin/officers'),

  createOfficer: (data: { name: string; email: string; password: string }) =>
    request<any>('/admin/officers', { method: 'POST', body: JSON.stringify(data) }),

  assignOfficer: (engagementId: string, officerId: string | null, handoverNotes?: string) =>
    request<any>(`/engagements/${engagementId}/assign-officer`, {
      method: 'PATCH',
      body: JSON.stringify({ officerId, handoverNotes }),
    }),

  getOfficerCases: () => request<any[]>('/officer/my-cases'),

  getOfficerCase: (id: string) => request<any>(`/officer/cases/${id}`),

  addCaseNote: (engagementId: string, content: string, isInternal = true, requiresApproval = false) =>
    request<any>(`/officer/cases/${engagementId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, isInternal, requiresApproval }),
    }),

  getCaseNotes: (engagementId: string) =>
    request<any[]>(`/officer/cases/${engagementId}/notes`),

  addTracking: (engagementId: string, data: {
    portal: string; referenceNumber?: string; submittedAt?: string;
    status?: string; notes?: string; nextActionDate?: string;
  }) =>
    request<any>(`/officer/cases/${engagementId}/tracking`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTracking: (engagementId: string) =>
    request<any[]>(`/officer/cases/${engagementId}/tracking`),

  updateTracking: (engagementId: string, trackingId: string, data: {
    portal?: string; referenceNumber?: string; submittedAt?: string;
    status?: string; notes?: string; nextActionDate?: string;
  }) =>
    request<any>(`/officer/cases/${engagementId}/tracking/${trackingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  escalateCase: (engagementId: string, consultantId: string, reason: string) =>
    request<any>(`/officer/cases/${engagementId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ consultantId, reason }),
    }),

  getMyEscalations: () => request<any[]>('/officer/my-escalations'),

  getConsultantEscalationsInbox: () => request<any[]>('/officer/escalations/inbox'),

  resolveEscalation: (id: string, resolution: string) =>
    request<any>(`/officer/escalations/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution }),
    }),

  getOfficerActivity: (engagementId: string) =>
    request<any>(`/engagements/${engagementId}/officer-activity`),

  getEngagementTracking: (engagementId: string) =>
    request<any[]>(`/engagements/${engagementId}/tracking`),

  getClientUpdates: (engagementId: string) =>
    request<any[]>(`/engagements/${engagementId}/client-updates`),

  getPendingApprovals: () =>
    request<any[]>('/officer/pending-approvals'),

  getRecentOfficerNotes: (limit = 20) =>
    request<any[]>('/officer/recent-notes?limit=' + limit),

  getOfficerDashboard: () =>
    request<any>('/officer/my-dashboard'),

  approveNote: (noteId: string) =>
    request<any>(`/officer/notes/${noteId}/approve`, { method: 'PATCH' }),

  rejectNote: (noteId: string) =>
    request<any>(`/officer/notes/${noteId}/reject`, { method: 'PATCH' }),

  setOfficerAvailability: (officerId: string, isAvailable: boolean, reassignToOfficerId?: string | null) =>
    request<any>(`/admin/officers/${officerId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable, reassignToOfficerId }),
    }),
};
