-- Webinars can have an uploaded cover image.
-- AlterTable
ALTER TABLE "webinars" ADD COLUMN     "coverKey" TEXT,
ADD COLUMN     "coverUpdatedAt" TIMESTAMP(3);

