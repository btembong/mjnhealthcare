-- Topics clients actually ask about.
ALTER TYPE "TicketCategory" ADD VALUE IF NOT EXISTS 'ACCOUNT';
ALTER TYPE "TicketCategory" ADD VALUE IF NOT EXISTS 'SESSIONS';

-- A screenshot or file sent with a support message. The key is a storage path and never leaves the server.
ALTER TABLE "ticket_replies" ADD COLUMN "attachmentKey" TEXT;
ALTER TABLE "ticket_replies" ADD COLUMN "attachmentName" TEXT;
ALTER TABLE "ticket_replies" ADD COLUMN "attachmentType" TEXT;

-- When the client last opened the request, so "we replied" can be shown as unread until they do.
ALTER TABLE "support_tickets" ADD COLUMN "clientSeenAt" TIMESTAMP(3);
