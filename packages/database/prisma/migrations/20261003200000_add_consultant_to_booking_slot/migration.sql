-- Add consultantId to booking_slots so free consultation slots can be assigned to a specific consultant
ALTER TABLE "booking_slots" ADD COLUMN IF NOT EXISTS "consultantId" TEXT;

ALTER TABLE "booking_slots"
  ADD CONSTRAINT "booking_slots_consultantId_fkey"
  FOREIGN KEY ("consultantId") REFERENCES "consultant_profiles"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
