-- Free webinars: the webinar, its hosts and its registrations. Leads remember where they came from.
-- CreateEnum
CREATE TYPE "WebinarStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'LIVE', 'ENDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "webinars" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "language" "Locale" NOT NULL DEFAULT 'en',
    "topic" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "status" "WebinarStatus" NOT NULL DEFAULT 'DRAFT',
    "roomName" TEXT,
    "roomUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "recordingId" TEXT,
    "recordingStatus" TEXT,
    "replayReadyAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinar_hosts" (
    "webinarId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "webinar_hosts_pkey" PRIMARY KEY ("webinarId","personId")
);

-- CreateTable
CREATE TABLE "webinar_registrations" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "profession" TEXT,
    "destination" TEXT,
    "question" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "joinToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "leadId" TEXT,
    "personId" TEXT,
    "source" TEXT,
    "firstJoinedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "minutesWatched" INTEGER NOT NULL DEFAULT 0,
    "confirmationSentAt" TIMESTAMP(3),
    "replaySentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webinar_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webinars_slug_key" ON "webinars"("slug");

-- CreateIndex
CREATE INDEX "webinars_status_startAt_idx" ON "webinars"("status", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "webinar_registrations_joinToken_key" ON "webinar_registrations"("joinToken");

-- CreateIndex
CREATE INDEX "webinar_registrations_webinarId_status_idx" ON "webinar_registrations"("webinarId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "webinar_registrations_webinarId_email_key" ON "webinar_registrations"("webinarId", "email");

-- AddForeignKey
ALTER TABLE "webinar_hosts" ADD CONSTRAINT "webinar_hosts_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_hosts" ADD CONSTRAINT "webinar_hosts_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_registrations" ADD CONSTRAINT "webinar_registrations_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

