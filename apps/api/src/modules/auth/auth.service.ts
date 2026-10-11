import { BadRequestException, ConflictException, Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Redis } from 'ioredis';
import { PersonService } from '../person/person.service';
import { NotificationService } from '../notification/notification.service';
import { REDIS_CLIENT } from './auth.constants';
import { randomBytes } from 'crypto';
import { tplOtp, tplPasswordReset, tplPasswordChanged, tplEmailChangeCode, tplEmailChanged } from '../notification/email-templates';
import { forgetSessionCutoff } from './strategies/jwt.strategy';

export type JwtPayload = {
  sub: string;
  email?: string;
  phone?: string;
  role: string;
};

const OTP_TTL_SECONDS = 600; // 10 minutes
const EMAIL_CHANGE_MAX_TRIES = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly personService: PersonService,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ── Staff (email + password) ────────────────────────────────────────────────

  async validateStaffLogin(email: string, password: string) {
    const person = await this.personService.findByEmail(email);
    if (!person || !person.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, person.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return person;
  }

  async loginStaff(person: { id: string; email?: string | null; role: string }) {
    const payload: JwtPayload = { sub: person.id, email: person.email ?? undefined, role: person.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  async registerStaff(data: {
    name: string;
    email: string;
    password: string;
    role: 'CONSULTANT' | 'ADMIN' | 'PARTNER' | 'PROCESSING_OFFICER' | 'FINANCE';
  }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.personService.create({
      name: data.name,
      email: data.email,
      locale: 'en',
      role: data.role,
      passwordHash,
    });
  }

  // ── Candidate OTP (email primary, phone fallback) ──────────────────────────

  async sendOtp(identifier: string, via: 'email' | 'phone' = 'email'): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.setex(`otp:${identifier}`, OTP_TTL_SECONDS, otp);

    if (via === 'email') {
      await this.notificationService.sendEmail(
        identifier,
        'Your MJN Healthcare verification code',
        tplOtp({ otp }),
        undefined,
        undefined,
        'security',
      );
    } else {
      await this.notificationService.sendSms(
        identifier,
        `Your MJN Healthcare verification code is: ${otp}. Valid for 10 minutes.`,
        // A sign-in code is always sent, whatever the person chose for case updates.
        { essential: true },
      );
    }
    this.logger.log(`OTP sent to ${identifier} via ${via}`);
  }

  async verifyOtp(
    identifier: string,
    otp: string,
    via: 'email' | 'phone' = 'email',
  ): Promise<{ access_token: string; isNew: boolean }> {
    const stored = await this.redis.get(`otp:${identifier}`);
    if (!stored || String(stored) !== otp) throw new UnauthorizedException('Invalid or expired OTP');
    await this.redis.del(`otp:${identifier}`);

    const person =
      via === 'email'
        ? await this.personService.findByEmail(identifier)
        : await this.personService.findByPhone(identifier);

    const isNew = !person;
    const resolved = person ?? (await this.personService.create({
      name: identifier,
      ...(via === 'email' ? { email: identifier } : { phone: identifier }),
      locale: 'en',
      role: 'CANDIDATE',
    }));

    const payload: JwtPayload = {
      sub: resolved.id,
      ...(via === 'email' ? { email: identifier } : { phone: identifier }),
      role: resolved.role,
    };
    return { access_token: this.jwtService.sign(payload), isNew };
  }

  // ── Changing the email address an account signs in with ───────────────────

  /** Sends a code to the new address. Nothing changes until it is entered. */
  async requestEmailChange(personId: string, newEmail: string): Promise<{ sentTo: string }> {
    const email = (newEmail ?? '').trim().toLowerCase();
    const person = await this.personService.findById(personId);
    if (!person) throw new UnauthorizedException();
    if ((person.email ?? '').toLowerCase() === email) throw new BadRequestException('That is already your email address.');
    const taken = await this.personService.findByEmailInsensitive(email);
    if (taken && taken.id !== personId) throw new ConflictException('Another account already uses that email address.');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.setex(`email-change:${personId}`, OTP_TTL_SECONDS, `${code}|0|${email}`);
    await this.notificationService.sendEmail(
      email,
      person.locale === 'fr' ? 'Confirmez votre nouvelle adresse e-mail' : 'Confirm your new email address',
      tplEmailChangeCode({ otp: code, locale: person.locale }),
      undefined,
      undefined,
      'security',
    );
    return { sentTo: email };
  }

  async confirmEmailChange(personId: string, code: string): Promise<{ access_token: string; email: string }> {
    const key = `email-change:${personId}`;
    const stored = await this.redis.get(key);
    if (!stored) throw new BadRequestException('That code has expired. Ask for a new one.');
    const [expected, triesText, ...rest] = String(stored).split('|');
    const email = rest.join('|');
    if (String(code ?? '').trim() !== expected) {
      const tries = Number(triesText) + 1;
      if (tries >= EMAIL_CHANGE_MAX_TRIES) {
        await this.redis.del(key);
        throw new BadRequestException('Too many wrong codes. Ask for a new one.');
      }
      await this.redis.setex(key, OTP_TTL_SECONDS, `${expected}|${tries}|${email}`);
      throw new BadRequestException('That code is not right. Check it and try again.');
    }
    await this.redis.del(key);

    const person = await this.personService.findById(personId);
    if (!person) throw new UnauthorizedException();
    const oldEmail = person.email;
    const taken = await this.personService.findByEmailInsensitive(email);
    if (taken && taken.id !== personId) throw new ConflictException('Another account already uses that email address.');
    await this.personService.changeEmail(personId, email, oldEmail);

    if (oldEmail) {
      // Tell the old address, so a change nobody asked for does not go unnoticed.
      await this.notificationService.sendEmail(
        oldEmail,
        person.locale === 'fr' ? 'Votre adresse e-mail a été modifiée' : 'Your email address was changed',
        tplEmailChanged({ name: person.name, newEmail: email, locale: person.locale }),
        person.name,
        undefined,
        'security',
      );
    }
    this.logger.log(`Email changed for person ${personId}`);
    const payload: JwtPayload = { sub: person.id, email, role: person.role };
    return { access_token: this.jwtService.sign(payload), email };
  }

  /** Ends every login for this person, on every device. They sign in again where they need to. */
  async signOutEverywhere(personId: string): Promise<{ ok: true }> {
    // Whole seconds, because a login records the second it was issued.
    const now = new Date(Math.floor(Date.now() / 1000) * 1000 + 1000);
    await this.personService.setSessionsValidAfter(personId, now);
    forgetSessionCutoff(personId);
    return { ok: true };
  }

  async changePassword(personId: string, currentPassword: string, newPassword: string) {
    const person = await this.personService.findById(personId);
    if (!person) throw new UnauthorizedException('User not found');
    if (!person.passwordHash) throw new UnauthorizedException('No password set on this account');
    const valid = await bcrypt.compare(currentPassword, person.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    const hash = await bcrypt.hash(newPassword, 12);
    await this.personService.updatePassword(personId, hash);
    return { ok: true };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // ── Forgot / reset password ─────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const person = await this.personService.findByEmail(email);
    // Always respond OK — don't reveal whether the email exists
    if (!person || !person.passwordHash) return;

    const token = randomBytes(32).toString('hex');
    const FIFTEEN_MIN = 15 * 60;
    await this.redis.setex(`pwd-reset:${token}`, FIFTEEN_MIN, person.id);

    const adminUrl = process.env.ADMIN_URL ?? 'http://localhost:3004';
    const resetUrl = `${adminUrl}/reset-password?token=${token}`;

    await this.notificationService.sendEmail(
      email,
      'Reset your MJN staff password',
      tplPasswordReset({ name: person.name, resetUrl }),
      undefined,
      undefined,
      'security',
    );
    this.logger.log(`Password reset link sent to ${email}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ access_token: string }> {
    const personId = await this.redis.get(`pwd-reset:${token}`);
    if (!personId) throw new UnauthorizedException('Reset link is invalid or has expired');

    // Consume token immediately (one-time use)
    await this.redis.del(`pwd-reset:${token}`);

    const hash = await bcrypt.hash(newPassword, 12);
    await this.personService.updatePassword(personId, hash);

    const person = await this.personService.findById(personId);
    if (!person) throw new UnauthorizedException('User not found');

    // Send security notification
    if (person.email) {
      await this.notificationService.sendEmail(
        person.email,
        'Your MJN staff password was changed',
        tplPasswordChanged({ name: person.name }),
        undefined,
        undefined,
        'security',
      ).catch(() => {}); // non-fatal
    }

    const payload: JwtPayload = { sub: person.id, email: person.email ?? undefined, role: person.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
