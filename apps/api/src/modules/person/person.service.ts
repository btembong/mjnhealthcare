import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class PersonService {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string) {
    return this.db.person.findUnique({ where: { email } });
  }

  async findByEmailInsensitive(email: string) {
    return this.db.person.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
  }

  /** Switches the sign-in address. A marketing opt-out made under the old address follows the person. */
  async changeEmail(id: string, email: string, oldEmail?: string | null) {
    await this.db.person.update({ where: { id }, data: { email } });
    if (oldEmail) {
      const optedOut = await this.db.emailUnsubscribe.findUnique({ where: { email: oldEmail.toLowerCase() } });
      if (optedOut) {
        await this.db.emailUnsubscribe.upsert({ where: { email }, update: {}, create: { email } });
      }
    }
  }

  async setSessionsValidAfter(id: string, when: Date) {
    await this.db.person.update({ where: { id }, data: { sessionsValidAfter: when } });
  }

  /**
   * What a person may change about themselves. Profession sets some prices, so once a case
   * exists a client can no longer change it on their own; staff still can.
   */
  async updateOwnProfile(id: string, isStaff: boolean, data: { name?: string; profession?: string; locale?: string; phone?: string }) {
    const current = await this.db.person.findUnique({ where: { id }, select: { profession: true, phone: true } });
    const change: Record<string, unknown> = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new BadRequestException('Your name cannot be empty.');
      change.name = name.slice(0, 120);
    }
    if (data.locale !== undefined) change.locale = data.locale;
    if (data.profession !== undefined && data.profession !== (current?.profession ?? '')) {
      if (!isStaff && (await this.db.engagement.count({ where: { personId: id } })) > 0) {
        throw new BadRequestException('Your prices are based on your profession, so it can no longer be changed here. Message your team to change it.');
      }
      change.profession = data.profession;
    }
    if (data.phone !== undefined && data.phone !== (current?.phone ?? '')) {
      const taken = await this.db.person.findFirst({ where: { phone: data.phone, NOT: { id } }, select: { id: true } });
      if (taken) throw new ConflictException('Another account already uses that phone number.');
      change.phone = data.phone;
    }
    if (Object.keys(change).length === 0) return this.findById(id);
    return this.db.person.update({ where: { id }, data: change as any });
  }

  /** The settings that are real: WhatsApp copies of case updates, and marketing email. */
  async getPreferences(id: string) {
    const person = await this.db.person.findUnique({ where: { id }, select: { email: true, whatsappUpdates: true } });
    const [optedOut, consent, cases] = await Promise.all([
      person?.email ? this.db.emailUnsubscribe.findUnique({ where: { email: person.email.toLowerCase() } }) : null,
      this.db.consentRecord.findFirst({
        where: { personId: id, type: { contains: 'privacy', mode: 'insensitive' } },
        orderBy: { recordedAt: 'desc' },
        select: { recordedAt: true },
      }),
      this.db.engagement.count({ where: { personId: id } }),
    ]);
    return {
      whatsappUpdates: person?.whatsappUpdates ?? true,
      marketingEmails: !optedOut,
      privacyConsentAt: consent?.recordedAt ?? null,
      professionLocked: cases > 0,
    };
  }

  async setPreferences(id: string, data: { whatsappUpdates?: boolean; marketingEmails?: boolean }) {
    if (data.whatsappUpdates !== undefined) {
      await this.db.person.update({ where: { id }, data: { whatsappUpdates: data.whatsappUpdates } });
    }
    if (data.marketingEmails !== undefined) {
      const person = await this.db.person.findUnique({ where: { id }, select: { email: true } });
      const email = person?.email?.toLowerCase();
      if (email) {
        // The same list the unsubscribe link in campaign emails writes to, so the two always agree.
        if (data.marketingEmails) await this.db.emailUnsubscribe.deleteMany({ where: { email } });
        else await this.db.emailUnsubscribe.upsert({ where: { email }, update: {}, create: { email } });
      }
    }
    return this.getPreferences(id);
  }

  async findByPhone(phone: string) {
    return this.db.person.findUnique({ where: { phone } });
  }

  async findById(id: string) {
    return this.db.person.findUnique({
      where: { id },
      include: { engagements: true, documents: true },
    });
  }

  async findAll(filters?: { role?: string; locale?: string }) {
    return this.db.person.findMany({
      where: {
        role: filters?.role as any,
        locale: filters?.locale as any,
      },
      orderBy: { createdAt: 'desc' },
    } as any);
  }

  async create(data: {
    name: string;
    email?: string;
    phone?: string;
    locale: 'en' | 'fr';
    role: string;
    passwordHash?: string;
    profession?: string;
  }) {
    return this.db.person.create({ data: data as any });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      locale: string;
      profession: string;
    }>,
  ) {
    return this.db.person.update({ where: { id }, data: data as any });
  }

  async completeTour(id: string, key: string) {
    const person = (await this.db.person.findUnique({
      where: { id },
      select: { completedTours: true } as any,
    })) as { completedTours?: string[] } | null;
    const done = person?.completedTours ?? [];
    if (done.includes(key) || done.length >= 200) return { completedTours: done };
    const completedTours = [...done, key];
    await this.db.person.update({ where: { id }, data: { completedTours } as any });
    return { completedTours };
  }

  async updateRole(id: string, role: string) {
    return this.db.person.update({ where: { id }, data: { role: role as any } });
  }

  async setActive(id: string, isActive: boolean) {
    return this.db.person.update({ where: { id }, data: { isActive } });
  }

  async updatePassword(id: string, passwordHash: string) {
    return this.db.person.update({ where: { id }, data: { passwordHash } });
  }

  async updateCredentials(id: string, data: { name?: string; email?: string; passwordHash?: string }) {
    return this.db.person.update({
      where: { id },
      data: data as any,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
  }

  async findStaff() {
    return this.db.person.findMany({
      // Only roles the database knows. Asking for one it does not have ("COMPLIANCE") made this fail every time.
      where: { role: { in: ['ADMIN', 'CONSULTANT', 'PROCESSING_OFFICER', 'FINANCE'] as any[] } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  }

  async getSystemConfig(): Promise<Record<string, string>> {
    const rows = await (this.db as any).systemConfig.findMany();
    return Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
  }

  async setSystemConfig(data: Record<string, string>) {
    for (const [key, value] of Object.entries(data)) {
      await (this.db as any).systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return this.getSystemConfig();
  }
}
