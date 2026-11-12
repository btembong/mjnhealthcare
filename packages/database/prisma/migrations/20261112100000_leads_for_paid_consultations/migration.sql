-- Paid consultations did not create a lead, so a guest who paid and never signed in to the
-- portal appeared nowhere the team looks. Put each such person on the leads board once, as
-- Qualified, from their most recent paid booking. People with a client record or a lead are skipped.
INSERT INTO "leads" ("id", "name", "email", "phone", "serviceInterest", "status", "sourceBookingId", "source", "notes", "createdAt", "updatedAt")
SELECT DISTINCT ON (lower(b."clientEmail"))
  'pc_' || b."id",
  b."clientName",
  b."clientEmail",
  b."clientPhone",
  b."consultationCategory"::text,
  'QUALIFIED'::"LeadStatus",
  b."id",
  'paid_consultation',
  'Paid for a consultation. Added to leads on 2026-11-12, when paid bookings started creating leads.',
  COALESCE(b."paidAt", b."createdAt"),
  now()
FROM "consultation_bookings" b
JOIN "consultation_slots" s ON s."id" = b."slotId"
WHERE b."paidAt" IS NOT NULL
  AND s."isFree" = false
  AND NOT EXISTS (SELECT 1 FROM "persons" p WHERE lower(p."email") = lower(b."clientEmail"))
  AND NOT EXISTS (SELECT 1 FROM "leads" l WHERE lower(l."email") = lower(b."clientEmail"))
ORDER BY lower(b."clientEmail"), b."paidAt" DESC;
