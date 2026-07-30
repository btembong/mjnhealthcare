export type Locale = 'en' | 'fr';

export type PersonRole = 'CANDIDATE' | 'STUDENT' | 'CONSULTANT' | 'ADMIN' | 'PARTNER';

export type EngagementStatus =
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'TERMINATED';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type OrderStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';

export type JwtUser = {
  id: string;
  email?: string;
  phone?: string;
  role: PersonRole;
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
