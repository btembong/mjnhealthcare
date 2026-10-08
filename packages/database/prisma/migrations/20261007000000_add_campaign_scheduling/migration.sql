-- Campaign statuses for in-flight and paused recurring campaigns
ALTER TYPE "CampaignStatus" ADD VALUE IF NOT EXISTS 'SENDING';
ALTER TYPE "CampaignStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

CREATE TYPE "CampaignFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- Recurrence + scheduler fields
ALTER TABLE "campaigns" ADD COLUMN "frequency" "CampaignFrequency";
ALTER TABLE "campaigns" ADD COLUMN "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "campaigns" ADD COLUMN "dayOfMonth" INTEGER;
ALTER TABLE "campaigns" ADD COLUMN "timeOfDay" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Africa/Douala';
ALTER TABLE "campaigns" ADD COLUMN "cronExpression" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "endsAt" TIMESTAMP(3);
ALTER TABLE "campaigns" ADD COLUMN "maxRuns" INTEGER;
ALTER TABLE "campaigns" ADD COLUMN "runCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "campaigns" ADD COLUMN "nextRunAt" TIMESTAMP(3);
ALTER TABLE "campaigns" ADD COLUMN "lastRunAt" TIMESTAMP(3);

CREATE INDEX "campaigns_status_nextRunAt_idx" ON "campaigns"("status", "nextRunAt");

-- Send history
CREATE TABLE "campaign_runs" (
  "id"             TEXT NOT NULL,
  "campaignId"     TEXT NOT NULL,
  "trigger"        TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'RUNNING',
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "sentCount"      INTEGER NOT NULL DEFAULT 0,
  "failedCount"    INTEGER NOT NULL DEFAULT 0,
  "skippedCount"   INTEGER NOT NULL DEFAULT 0,
  "startedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"     TIMESTAMP(3),

  CONSTRAINT "campaign_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaign_runs_campaignId_startedAt_idx" ON "campaign_runs"("campaignId", "startedAt");

ALTER TABLE "campaign_runs" ADD CONSTRAINT "campaign_runs_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Saved imported contact lists
CREATE TABLE "contact_lists" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "contacts"     JSONB NOT NULL,
  "contactCount" INTEGER NOT NULL DEFAULT 0,
  "createdById"  TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "contact_lists_pkey" PRIMARY KEY ("id")
);

-- Marketing email opt-outs
CREATE TABLE "email_unsubscribes" (
  "id"         TEXT NOT NULL,
  "email"      TEXT NOT NULL,
  "campaignId" TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "email_unsubscribes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_unsubscribes_email_key" ON "email_unsubscribes"("email");
