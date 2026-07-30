/**
 * Dev-only: creates a test engagement (status=ACTIVE, letterStatus=SIGNED)
 * for the first person found in the DB (or pass an email as argv).
 *
 * Usage:
 *   npx ts-node --project tsconfig.json prisma/test-engagement.ts
 *   npx ts-node --project tsconfig.json prisma/test-engagement.ts you@example.com
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const emailArg = process.argv[2];

  const person = emailArg
    ? await prisma.person.findFirst({ where: { email: emailArg } })
    : await prisma.person.findFirst({ orderBy: { createdAt: 'desc' } });

  if (!person) {
    console.error('No person found. Log in to the portal first to create your account, then re-run this script.');
    process.exit(1);
  }

  console.log(`Found person: ${person.name ?? '(no name)'} <${person.email ?? person.phone}> (id: ${person.id})`);

  // Check for existing engagement
  const existing = await prisma.engagement.findFirst({ where: { personId: person.id } });
  if (existing) {
    // Update it to signed/active if needed
    const updated = await (prisma.engagement as any).update({
      where: { id: existing.id },
      data: { status: 'ACTIVE', letterSignedAt: new Date() },
    });
    console.log(`Updated existing engagement ${updated.id} → status=ACTIVE, letterStatus=SIGNED`);
    return;
  }

  // Find or create a consultant to assign
  let consultant = await prisma.person.findFirst({ where: { role: 'CONSULTANT' } });
  if (!consultant) {
    consultant = await prisma.person.findFirst({ where: { role: 'ADMIN' } });
  }

  // Use raw SQL to bypass stale Prisma client (DLL locked by API server)
  const id = `eng-test-${Date.now()}`;
  const consultantId = consultant?.id ?? person.id;
  const now = new Date().toISOString();

  await prisma.$executeRawUnsafe(
    `INSERT INTO engagements (id, "personId", status, "consultantId", "letterSignedAt", "letterUrl", "createdAt", "updatedAt")
     VALUES ($1, $2, 'ACTIVE'::"EngagementStatus", $3, NOW(), $4, NOW(), NOW())`,
    id, person.id, consultantId, 'https://example.com/signed-engagement-letter.pdf',
  );

  console.log(`\nEngagement created: ${id}`);
  console.log(`  Person : ${person.name ?? person.email} (${person.id})`);
  console.log(`  Status : ACTIVE`);
  console.log(`  Letter : SIGNED (letterSignedAt set)`);
  console.log(`\nYou can now visit localhost:3002/checkout to test the full checkout flow.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
