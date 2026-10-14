-- Money received outside Tranzak and Stripe, recorded by staff and confirmed by an admin.
CREATE TABLE "manual_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" DECIMAL(12,4),
    "amountUsd" DECIMAL(10,2) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "proofKey" TEXT,
    "proofName" TEXT,
    "proofType" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECORDED',
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,

    CONSTRAINT "manual_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "manual_payments_orderId_idx" ON "manual_payments"("orderId");
CREATE INDEX "manual_payments_reference_idx" ON "manual_payments"("reference");
CREATE INDEX "manual_payments_status_idx" ON "manual_payments"("status");

ALTER TABLE "manual_payments" ADD CONSTRAINT "manual_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
