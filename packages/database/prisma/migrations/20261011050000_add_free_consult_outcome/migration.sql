-- Free consultations: record a missed session and why a booking was cancelled.
ALTER TABLE "bookings" ADD COLUMN "noShowAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN "cancelReason" TEXT;
