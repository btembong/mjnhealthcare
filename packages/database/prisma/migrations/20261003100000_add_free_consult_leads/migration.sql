-- Add isFree to consultation_slots
ALTER TABLE "consultation_slots" ADD COLUMN "isFree" BOOLEAN NOT NULL DEFAULT false;

-- Add caseNote to consultation_bookings
ALTER TABLE "consultation_bookings" ADD COLUMN "caseNote" TEXT;

-- Add new Lead fields
ALTER TABLE "leads" ADD COLUMN "sourceBookingId" TEXT;
ALTER TABLE "leads" ADD COLUMN "discountCode" TEXT;
ALTER TABLE "leads" ADD COLUMN "discountExpiry" TIMESTAMP(3);

-- Update LeadStatus enum to add new values
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'FREE_CONSULT_BOOKED';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'FREE_CONSULT_DONE';
ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'PROPOSAL_SENT';

-- Create free_session_usage table
CREATE TABLE "free_session_usage" (
  "id"        TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "category"  TEXT NOT NULL,
  "count"     INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "free_session_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "free_session_usage_email_category_key" ON "free_session_usage"("email", "category");
