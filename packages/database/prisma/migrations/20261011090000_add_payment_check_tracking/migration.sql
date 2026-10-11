-- Automatic payment checks: what the provider last said about a payment, and when we asked.
ALTER TABLE "payment_attempts" ADD COLUMN "checkedAt" TIMESTAMP(3);
ALTER TABLE "payment_attempts" ADD COLUMN "providerStatus" TEXT;

-- Consultations: when the booking was actually paid, the same check record, and the moment we
-- established that no payment will ever arrive on its reference.
ALTER TABLE "consultation_bookings" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "consultation_bookings" ADD COLUMN "paymentCheckedAt" TIMESTAMP(3);
ALTER TABLE "consultation_bookings" ADD COLUMN "paymentProviderStatus" TEXT;
ALTER TABLE "consultation_bookings" ADD COLUMN "paymentClosedAt" TIMESTAMP(3);

-- Bookings paid so far. A cancelled booking counts as paid only if it had been confirmed, which
-- is when its video room is created; no exact payment date was kept, so the booking date is used.
UPDATE "consultation_bookings" SET "paidAt" = "createdAt"
WHERE "status" IN ('CONFIRMED', 'COMPLETED', 'NO_SHOW')
   OR ("status" = 'CANCELLED' AND COALESCE("dailyRoomName", '') <> '');
