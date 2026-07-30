-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('FULL', 'INSTALLMENT', 'PAY_PER_STAGE');

-- AlterTable
ALTER TABLE "engagements" ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'FULL';

-- AlterTable
ALTER TABLE "licensing_stages" ADD COLUMN     "serviceItemIds" TEXT[];

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "amountDueNow" DECIMAL(10,2),
ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'FULL',
ADD COLUMN     "stageId" TEXT;

-- CreateTable
CREATE TABLE "installment_schedules" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "installmentNo" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "triggerStageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoicedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "installment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_service_plans" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "serviceItemId" TEXT NOT NULL,
    "variantKey" TEXT,
    "priceUsd" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_service_plans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "installment_schedules" ADD CONSTRAINT "installment_schedules_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_service_plans" ADD CONSTRAINT "engagement_service_plans_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_service_plans" ADD CONSTRAINT "engagement_service_plans_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "licensing_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
