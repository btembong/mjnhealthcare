-- Webinar engagement: live questions with votes, polls, the host's offer button and the after-session survey.
-- AlterTable
ALTER TABLE "webinars" ADD COLUMN     "offerLabel" TEXT,
ADD COLUMN     "offerUrl" TEXT,
ADD COLUMN     "offerVisible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "webinar_registrations" ADD COLUMN     "offerClickedAt" TIMESTAMP(3),
ADD COLUMN     "surveyAt" TIMESTAMP(3),
ADD COLUMN     "surveyComment" TEXT,
ADD COLUMN     "surveyRating" INTEGER,
ADD COLUMN     "surveyWantsContact" BOOLEAN;

-- CreateTable
CREATE TABLE "webinar_questions" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "registrationId" TEXT,
    "authorName" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "webinar_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinar_question_votes" (
    "questionId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webinar_question_votes_pkey" PRIMARY KEY ("questionId","registrationId")
);

-- CreateTable
CREATE TABLE "webinar_polls" (
    "id" TEXT NOT NULL,
    "webinarId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "showResults" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "webinar_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinar_poll_votes" (
    "pollId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "option" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webinar_poll_votes_pkey" PRIMARY KEY ("pollId","registrationId")
);

-- CreateIndex
CREATE INDEX "webinar_questions_webinarId_createdAt_idx" ON "webinar_questions"("webinarId", "createdAt");

-- CreateIndex
CREATE INDEX "webinar_polls_webinarId_createdAt_idx" ON "webinar_polls"("webinarId", "createdAt");

-- AddForeignKey
ALTER TABLE "webinar_questions" ADD CONSTRAINT "webinar_questions_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_question_votes" ADD CONSTRAINT "webinar_question_votes_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "webinar_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_polls" ADD CONSTRAINT "webinar_polls_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinar_poll_votes" ADD CONSTRAINT "webinar_poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "webinar_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

