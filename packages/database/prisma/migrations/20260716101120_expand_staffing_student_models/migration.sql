/*
  Warnings:

  - Added the required column `university` to the `university_programs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "internship_applications" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "internship_placements" ADD COLUMN     "closingDate" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "field" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "stipend" TEXT,
ALTER COLUMN "host" DROP NOT NULL,
ALTER COLUMN "details" DROP NOT NULL;

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "closingDate" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "requirements" TEXT,
ADD COLUMN     "salaryRange" TEXT,
ALTER COLUMN "details" DROP NOT NULL;

-- AlterTable
ALTER TABLE "university_programs" ADD COLUMN     "applicationUrl" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "field" TEXT,
ADD COLUMN     "tuitionUsd" DECIMAL(10,2),
ADD COLUMN     "university" TEXT NOT NULL,
ALTER COLUMN "institution" DROP NOT NULL,
ALTER COLUMN "details" DROP NOT NULL;
