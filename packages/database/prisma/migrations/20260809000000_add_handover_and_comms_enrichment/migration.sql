-- Add handover notes to engagements
ALTER TABLE "engagements" ADD COLUMN IF NOT EXISTS "handoverNotes" TEXT;

-- Enrich communication_logs with engagement and sender references
ALTER TABLE "communication_logs" ADD COLUMN IF NOT EXISTS "engagementId" TEXT;
ALTER TABLE "communication_logs" ADD COLUMN IF NOT EXISTS "sentById" TEXT;

-- Add foreign key constraints (safe — both columns are nullable)
ALTER TABLE "communication_logs" DROP CONSTRAINT IF EXISTS "communication_logs_engagementId_fkey";
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_engagementId_fkey"
  FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "communication_logs" DROP CONSTRAINT IF EXISTS "communication_logs_sentById_fkey";
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_sentById_fkey"
  FOREIGN KEY ("sentById") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
