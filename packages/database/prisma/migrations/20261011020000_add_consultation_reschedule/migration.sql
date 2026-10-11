-- A client may move a confirmed session once; this records that it happened.
ALTER TABLE "consultation_bookings" ADD COLUMN "rescheduleCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "consultation_bookings" ADD COLUMN "rescheduledAt" TIMESTAMP(3);
