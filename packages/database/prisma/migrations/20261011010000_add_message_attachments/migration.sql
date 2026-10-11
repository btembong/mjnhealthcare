-- A file sent in chat belongs to the message, not to the client's document vault.
ALTER TABLE "engagement_messages" ADD COLUMN "attachmentKey" TEXT;
ALTER TABLE "engagement_messages" ADD COLUMN "attachmentName" TEXT;
ALTER TABLE "engagement_messages" ADD COLUMN "attachmentType" TEXT;

-- Chat files used to be filed as client documents. Take the unchecked ones out of the review
-- queue and out of clients' document lists. The stored files are untouched and still open from the chat.
DELETE FROM "documents" WHERE "type" IN ('CHAT_IMAGE', 'CHAT_FILE') AND "status" = 'PENDING';
