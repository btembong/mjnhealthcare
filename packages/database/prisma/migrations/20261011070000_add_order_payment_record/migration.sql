-- Orders: when it was paid, why it was cancelled, and any refund recorded against it.
ALTER TABLE "orders" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "orders" ADD COLUMN "refundAmount" DECIMAL(10,2);
ALTER TABLE "orders" ADD COLUMN "refundedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "refundReason" TEXT;

-- Paid orders so far: the first receipt marks the payment date; without one, the order date.
UPDATE "orders" o
SET "paidAt" = COALESCE((SELECT MIN(r."issuedAt") FROM "receipts" r WHERE r."orderId" = o."id"), o."createdAt")
WHERE o."status" = 'PAID';
