-- Add bufferMins to consultant_profiles
ALTER TABLE "consultant_profiles" ADD COLUMN "bufferMins" INTEGER NOT NULL DEFAULT 15;

-- Add hold fields to consultation_slots
ALTER TABLE "consultation_slots" ADD COLUMN "reservedUntil" TIMESTAMP(3);
ALTER TABLE "consultation_slots" ADD COLUMN "reservedBy" TEXT;

-- Add tracking fields to consultation_bookings
ALTER TABLE "consultation_bookings" ADD COLUMN "joinedAt" TIMESTAMP(3);
ALTER TABLE "consultation_bookings" ADD COLUMN "noShowAt" TIMESTAMP(3);

-- Create consultant_availability_rules table
CREATE TABLE "consultant_availability_rules" (
  "id"           TEXT NOT NULL,
  "consultantId" TEXT NOT NULL,
  "dayOfWeek"    INTEGER NOT NULL,
  "startTime"    TEXT NOT NULL,
  "endTime"      TEXT NOT NULL,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "consultant_availability_rules_pkey" PRIMARY KEY ("id")
);

-- Create consultant_blocked_times table
CREATE TABLE "consultant_blocked_times" (
  "id"           TEXT NOT NULL,
  "consultantId" TEXT NOT NULL,
  "startAt"      TIMESTAMP(3) NOT NULL,
  "endAt"        TIMESTAMP(3) NOT NULL,
  "reason"       TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "consultant_blocked_times_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "consultant_availability_rules"
  ADD CONSTRAINT "consultant_availability_rules_consultantId_fkey"
  FOREIGN KEY ("consultantId") REFERENCES "consultant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "consultant_blocked_times"
  ADD CONSTRAINT "consultant_blocked_times_consultantId_fkey"
  FOREIGN KEY ("consultantId") REFERENCES "consultant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for fast lookups
CREATE INDEX "consultant_availability_rules_consultantId_idx" ON "consultant_availability_rules"("consultantId");
CREATE INDEX "consultant_blocked_times_consultantId_idx" ON "consultant_blocked_times"("consultantId");
CREATE INDEX "consultation_slots_reservedUntil_idx" ON "consultation_slots"("reservedUntil");
