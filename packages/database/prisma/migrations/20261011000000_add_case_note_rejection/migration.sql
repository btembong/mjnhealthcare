-- A consultant can decline an officer's client update; the officer needs to see that and why.
ALTER TABLE "case_notes" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "case_notes" ADD COLUMN "rejectionReason" TEXT;
