import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Redis } from '@upstash/redis';
import { PersonService } from '../person/person.service';
import { NotificationService } from '../notification/notification.service';
import { REDIS_CLIENT } from './auth.constants';
import { tplOtp } from '../notification/email-templates';

export type JwtPayload = {
  sub: string;
  email?: string;
  phone?: string;
  role: string;
};

const OTP_TTL_SECONDS = 600; // 10 minutes

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
    role: 'CONSULTANT' | 'ADMIN' | 'PARTNER';
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
    await this.redis.set(`otp:${identifier}`, otp, { ex: OTP_TTL_SECONDS });

    if (via === 'email') {
      await this.notificationService.sendEmail(
        identifier,
        'Your MJN Healthcare verification code',
        tplOtp({ otp }),
      );
    } else {
      await this.notificationService.sendSms(
        identifier,
        `Your MJN Healthcare verification code is: ${otp}. Valid for 10 minutes.`,
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
}
