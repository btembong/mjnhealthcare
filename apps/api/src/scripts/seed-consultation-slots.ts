/**
 * Seed consultation availability slots for the booking system.
 *
 * Usage (from apps/api):
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-consultation-slots.ts
 *
 * What it does:
 *   - Generates slots for the next 21 days (skipping Sundays)
 *   - 4 slots per day: 09:00, 11:00, 14:00, 16:00 WAT (UTC+1)
 *   - Resource ID: 'general-consultation' (matches CONSULTATION_RESOURCE_ID in the frontend)
 *   - Skips dates that already have slots (idempotent — safe to re-run)
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const RESOURCE_ID = 'general-consultation';
const DAYS_AHEAD = 21;

// Slot times in WAT (UTC+1) — stored as UTC
// WAT 09:00 = UTC 08:00, WAT 11:00 = UTC 10:00, etc.
const SLOT_TIMES_UTC = [
  { start: '08:00', end: '08:30' }, // 09:00–09:30 WAT
  { start: '10:00', end: '10:30' }, // 11:00–11:30 WAT
  { start: '13:00', end: '13:30' }, // 14:00–14:30 WAT
  { start: '15:00', end: '15:30' }, // 16:00–16:30 WAT
];

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log(`\nSeeding consultation slots for resource: "${RESOURCE_ID}"`);
  console.log(`Range: next ${DAYS_AHEAD} days (skipping Sundays)\n`);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let created = 0;
  let skipped = 0;

  for (let i = 1; i <= DAYS_AHEAD; i++) {
    const day = addDays(today, i);
    const dayOfWeek = day.getUTCDay(); // 0 = Sunday

    if (dayOfWeek === 0) {
      console.log(`  ${toDateOnly(day)} — Sunday, skipped`);
      continue;
    }

    for (const { start, end } of SLOT_TIMES_UTC) {
      const startTime = new Date(`${toDateOnly(day)}T${start}:00.000Z`);
      const endTime = new Date(`${toDateOnly(day)}T${end}:00.000Z`);

      // Check if slot already exists (idempotent)
      const existing = await db.bookingSlot.findFirst({
        where: { resourceId: RESOURCE_ID, startTime },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await db.bookingSlot.create({
        data: {
          resourceId: RESOURCE_ID,
          date: day,
          startTime,
          endTime,
          isBooked: false,
        },
      });
      created++;
    }

    console.log(`  ${toDateOnly(day)} — 4 slots created`);
  }

  console.log(`\nDone. Created: ${created} slots, Skipped (already exist): ${skipped}\n`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
