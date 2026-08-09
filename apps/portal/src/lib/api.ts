const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000') + '/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mjn_token');
}

export function setToken(token: string) {
  localStorage.setItem('mjn_token', token);
  // Also set a cookie so middleware can read it
  document.cookie = `mjn_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearToken() {
  localStorage.removeItem('mjn_token');
  document.cookie = 'mjn_token=; path=/; max-age=0';
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
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
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────
  requestOtp: (email: string) =>
    request<{ message: string }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email, via: 'email' }),
    }),

  verifyOtp: (email: string, otp: string) =>
    request<{ access_token: string; isNew: boolean }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp, via: 'email' }),
    }),

  // ── Person ──────────────────────────────────────────────────────────────
  getMe: () => request<any>('/persons/me'),

  updateMe: (data: { name?: string; profession?: string; locale?: string }) =>
    request<any>('/persons/me', { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Engagement ──────────────────────────────────────────────────────────
  getEngagements: (personId: string) =>
    request<any[]>(`/engagements/client/${personId}`),

  // ── Licensing ───────────────────────────────────────────────────────────
  getProgress: (personId: string, engagementId: string) =>
    request<any>(`/licensing/progress/${personId}/${engagementId}`),

  // ── Documents ───────────────────────────────────────────────────────────
  getDocuments: (personId: string) =>
    request<any[]>(`/documents/person/${personId}`),

  getUploadUrl: (personId: string, documentType: string, fileName: string) =>
    request<{ url: string; key: string }>('/documents/upload-url', {
      method: 'POST',
      body: JSON.stringify({ personId, documentType, fileName }),
    }),

  confirmUpload: (personId: string, documentType: string, key: string, expiryDate?: string) =>
    request<any>('/documents/confirm', {
      method: 'POST',
      body: JSON.stringify({ personId, documentType, key, expiryDate }),
    }),

  getDocumentViewUrl: (id: string) =>
    request<{ url: string }>(`/documents/${id}/view-url`),

  // ── Orders ──────────────────────────────────────────────────────────────
  getOrder: (orderId: string) =>
    request<any>(`/orders/${orderId}`),

  getOrdersByEngagement: (engagementId: string) =>
    request<any[]>(`/orders/engagement/${engagementId}`),

  getOrdersByPerson: (personId: string) =>
    request<any[]>(`/orders/person/${personId}`),

  getServicePlan: (engagementId: string) =>
    request<any>(`/orders/service-plan/${engagementId}`),

  // ── Bookings ────────────────────────────────────────────────────────────
  getBookings: (personId: string) =>
    request<any[]>(`/bookings/person/${personId}`),

  getAvailableSlots: (resourceId: string, date: string) =>
    fetch(`${API_BASE}/bookings/slots/${resourceId}?date=${date}`).then((r) => r.json()),

  // ── Academy ─────────────────────────────────────────────────────────────
  getCourses: (locale: 'en' | 'fr' = 'en') =>
    request<any[]>(`/academy/courses?locale=${locale}`),

  getEnrollments: (personId: string) =>
    request<any[]>(`/academy/enrollments/${personId}`),

  getCourse: (id: string) =>
    request<any>(`/academy/courses/${id}`),

  updateProgress: (personId: string, courseId: string, progressPct: number) =>
    request<any>(`/academy/enrollments/${personId}/${courseId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progressPct }),
    }),

  getUpcomingLiveSessions: (courseIds: string[]) =>
    request<any[]>(`/academy/sessions/upcoming?courseIds=${courseIds.join(',')}`),

  getStudyPlan: (personId: string) =>
    request<any>(`/academy/study-plan/${personId}`),

  getPracticeHistory: (personId: string) =>
    request<any[]>(`/academy/practice/${personId}/history`),

  getWeakAreas: (personId: string) =>
    request<any[]>(`/academy/practice/${personId}/weak-areas`),

  markStudyItemComplete: (itemId: string) =>
    request<any>(`/academy/study-plan/items/${itemId}/complete`, { method: 'PATCH' }),

  enrollCourse: (personId: string, courseId: string) =>
    request<any>('/academy/enroll', { method: 'POST', body: JSON.stringify({ personId, courseId }) }),

  getQuestionBanks: (examType?: string) =>
    request<any[]>(`/academy/question-banks${examType ? `?examType=${examType}` : ''}`),

  getQuestions: (bankId: string) =>
    request<any[]>(`/academy/question-banks/${bankId}/questions`),

  submitPractice: (personId: string, topic: string, correct: number, total: number) =>
    request<any>('/academy/practice', {
      method: 'POST',
      body: JSON.stringify({ personId, topic, correctAnswers: correct, totalQuestions: total }),
    }),

  // ── Catalog ──────────────────────────────────────────────────────────────
  getCategories: () =>
    request<any[]>('/catalog/categories'),

  // ── Checkout / Payment ────────────────────────────────────────────────────
  createOrder: (engagementId: string, lines: { serviceItemId: string; variantKey?: string }[], paymentMode?: 'FULL' | 'INSTALLMENT') =>
    request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify({ engagementId, lines, paymentMode: paymentMode ?? 'FULL' }),
    }),

  initiatePayment: (orderId: string, phone?: string, email?: string) =>
    request<{ redirectUrl?: string; providerRef: string; status: string }>(`/payments/initiate/${orderId}`, {
      method: 'POST',
      body: JSON.stringify({ phone, email }),
    }),

  // ── Staffing ─────────────────────────────────────────────────────────────
  getOpportunities: (filters?: { country?: string; profession?: string }) => {
    const params = new URLSearchParams();
    if (filters?.country) params.set('country', filters.country);
    if (filters?.profession) params.set('profession', filters.profession);
    const qs = params.toString();
    return request<any[]>(`/staffing/opportunities${qs ? `?${qs}` : ''}`);
  },

  applyToOpportunity: (opportunityId: string, personId: string) =>
    request<any>(`/staffing/opportunities/${opportunityId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ personId }),
    }),

  getMyApplications: (personId: string) =>
    request<any[]>(`/staffing/applications/${personId}`),

  // ── Student Support ───────────────────────────────────────────────────────
  getInternships: (country?: string) =>
    request<any[]>(`/student-support/internships${country ? `?country=${country}` : ''}`),

  applyForInternship: (internshipId: string, personId: string) =>
    request<any>(`/student-support/internships/${internshipId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ personId }),
    }),

  getUniversityPrograms: () =>
    request<any[]>('/student-support/university-programs'),

  // ── Consultation sessions (client view) ───────────────────────────────────
  getMyConsultationBookings: (email: string) =>
    request<any[]>(`/consultations/client/${encodeURIComponent(email)}`),

  // ── Messaging ─────────────────────────────────────────────────────────────
  getMessages: (engagementId: string) =>
    request<any[]>(`/messages/engagement/${engagementId}`),

  sendMessage: (engagementId: string, content: string) =>
    request<any>(`/messages/engagement/${engagementId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  markMessagesRead: (engagementId: string) =>
    request<any>(`/messages/engagement/${engagementId}/read`, { method: 'PATCH' }),

  getUnreadCount: () =>
    request<{ unread: number }>('/messages/unread'),

  // ── Support Tickets ───────────────────────────────────────────────────────
  createTicket: (subject: string, category: string, content: string) =>
    request<any>('/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject, category, content }),
    }),

  getMyTickets: () =>
    request<any[]>('/tickets/mine'),

  getTicket: (id: string) =>
    request<any>(`/tickets/${id}`),

  replyToTicket: (id: string, content: string) =>
    request<any>(`/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // ── Engagement letter (self-hosted sign) ─────────────────────────────────
  getEngagement: (id: string) =>
    request<any>(`/engagements/${id}`),

  signEngagementLetter: (engagementId: string) =>
    request<{ ok: boolean }>(`/engagements/${engagementId}/sign`, { method: 'POST' }),

  getEngagementTracking: (engagementId: string) =>
    request<any[]>(`/engagements/${engagementId}/tracking`),

  getClientUpdates: (engagementId: string) =>
    request<any[]>(`/engagements/${engagementId}/client-updates`),

  // ── AI ───────────────────────────────────────────────────────────────────
  studyChat: (personId: string, messages: { role: 'user' | 'assistant'; content: string }[], locale: 'en' | 'fr') =>
    request<{ content: { type: string; text: string }; requiresReview: boolean }>('/ai/study-chat', {
      method: 'POST',
      body: JSON.stringify({ personId, messages, locale }),
    }),
};
