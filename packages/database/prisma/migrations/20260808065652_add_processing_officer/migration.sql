-- AlterEnum
ALTER TYPE "PersonRole" ADD VALUE IF NOT EXISTS 'PROCESSING_OFFICER';

-- AlterTable
ALTER TABLE "engagements" ADD COLUMN     "officerId" TEXT;

-- CreateTable
CREATE TABLE "case_notes" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_tracking" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "portal" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "submittedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "nextActionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_escalations" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_escalations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tracking" ADD CONSTRAINT "application_tracking_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "engagements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_escalations" ADD CONSTRAINT "case_escalations_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_escalations" ADD CONSTRAINT "case_escalations_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
