-- Add requiresApproval, approvedAt, approvedById to case_notes
ALTER TABLE "case_notes" ADD COLUMN IF NOT EXISTS "requiresApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "case_notes" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "case_notes" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;

ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "persons"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add isAvailable to persons (officer availability)
ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "isAvailable" BOOLEAN NOT NULL DEFAULT true;
