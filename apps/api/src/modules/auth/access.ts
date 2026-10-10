import { applyDecorators, createParamDecorator, ExecutionContext, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

export type AuthUser = { id: string; role?: string; email?: string; phone?: string };

export const STAFF_ROLES = ['ADMIN', 'CONSULTANT', 'PROCESSING_OFFICER', 'FINANCE', 'COMPLIANCE'];

const roleOf = (user?: AuthUser) => (user?.role ?? '').toUpperCase();

export const isStaff = (user?: AuthUser) => STAFF_ROLES.includes(roleOf(user));
export const isAdmin = (user?: AuthUser) => roleOf(user) === 'ADMIN';
export const isConsultant = (user?: AuthUser) => roleOf(user) === 'CONSULTANT';

/** Logged in with one of the given roles. Safe to stack on a controller that already requires a login. */
export const RolesOnly = (...roles: string[]) =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles(...roles));

export const StaffOnly = () => RolesOnly(...STAFF_ROLES);
export const AdminOnly = () => RolesOnly('ADMIN');
export const FinanceOnly = () => RolesOnly('ADMIN', 'FINANCE');

/** The authenticated user set by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
