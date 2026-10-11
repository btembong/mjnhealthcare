-- Support requests: notes only staff can see, and one "urgent" flag in place of three priorities.
ALTER TABLE "ticket_replies" ADD COLUMN "internal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "support_tickets" ADD COLUMN "urgent" BOOLEAN NOT NULL DEFAULT false;
UPDATE "support_tickets" SET "urgent" = true WHERE "priority" = 'HIGH';
