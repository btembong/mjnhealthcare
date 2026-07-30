-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_engagementId_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "orderType" TEXT NOT NULL DEFAULT 'pipeline',
ADD COLUMN     "personId" TEXT,
ADD COLUMN     "tosAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "tosIpAddress" TEXT,
ALTER COLUMN "engagementId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "service_items" ADD COLUMN     "isAvailableStandalone" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
