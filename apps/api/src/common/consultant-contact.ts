import { DatabaseService } from '@mjn/database';

export type ConsultantContact = { name: string | null; email: string | null; phone: string | null };

/**
 * Engagement.consultantId holds a ConsultantProfile id, while some older records and
 * flows hold a Person id. Looks in both so notifications reach the consultant either way.
 */
export async function findConsultantContact(
  db: DatabaseService,
  consultantId?: string | null,
): Promise<ConsultantContact | null> {
  if (!consultantId) return null;
  const profile = await db.consultantProfile.findUnique({
    where: { id: consultantId },
    select: { name: true, email: true },
  });
  if (profile) return { name: profile.name, email: profile.email, phone: null };
  const person = await db.person.findUnique({
    where: { id: consultantId },
    select: { name: true, email: true, phone: true },
  });
  return person ? { name: person.name, email: person.email, phone: person.phone } : null;
}
