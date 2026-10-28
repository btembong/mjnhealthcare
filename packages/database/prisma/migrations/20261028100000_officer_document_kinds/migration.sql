-- Officer-sent files are either a form to fill in and return, or a document for the client to keep.
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "needsReturn" BOOLEAN NOT NULL DEFAULT true;

-- Returning a form used to put the officer's blank into the review queue. Only the client's
-- returned copy is reviewed, so blanks go back to waiting on the client.
UPDATE "documents"
SET "status" = 'PENDING_CLIENT', "verifiedBy" = NULL, "verifiedAt" = NULL, "rejectionReason" = NULL
WHERE "origin" = 'OFFICER_SENT' AND "status" IN ('PENDING', 'REJECTED');
