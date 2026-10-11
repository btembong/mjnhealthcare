-- Case updates are always emailed; this turns their WhatsApp and SMS copies on or off.
ALTER TABLE "persons" ADD COLUMN "whatsappUpdates" BOOLEAN NOT NULL DEFAULT true;

-- Logins issued before this moment no longer work ("sign out on all devices").
ALTER TABLE "persons" ADD COLUMN "sessionsValidAfter" TIMESTAMP(3);

-- Requests for a copy of one's data, or for account deletion.
ALTER TYPE "TicketCategory" ADD VALUE IF NOT EXISTS 'PRIVACY';
