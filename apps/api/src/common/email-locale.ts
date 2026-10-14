import { DatabaseService } from '@mjn/database';

/** The language to write to someone in, from their account if they have one; English otherwise. */
export async function localeForEmail(db: DatabaseService, email?: string | null): Promise<'en' | 'fr'> {
  if (!email) return 'en';
  try {
    const person = await db.person.findFirst({ where: { email: { equals: email.trim(), mode: 'insensitive' } }, select: { locale: true } });
    return person?.locale === 'fr' ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}
