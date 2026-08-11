import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@mjn/database';

@Injectable()
export class PersonService {
  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string) {
    return this.db.person.findUnique({ where: { email } });
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
      where: { role: { in: ['CONSULTANT', 'ADMIN', 'COMPLIANCE'] as any[] } },
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
