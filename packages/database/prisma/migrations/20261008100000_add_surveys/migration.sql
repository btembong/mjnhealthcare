CREATE TYPE "SurveyStatus" AS ENUM ('DRAFT', 'LIVE', 'CLOSED');
CREATE TYPE "SurveyQuestionType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'DROPDOWN', 'RATING', 'SCALE', 'YES_NO', 'DATE', 'EMAIL', 'PHONE');

CREATE TABLE "surveys" (
  "id"                TEXT NOT NULL,
  "slug"              TEXT NOT NULL,
  "status"            "SurveyStatus" NOT NULL DEFAULT 'DRAFT',
  "title"             TEXT NOT NULL,
  "titleFr"           TEXT,
  "description"       TEXT,
  "descriptionFr"     TEXT,
  "layout"            TEXT NOT NULL DEFAULT 'ONE_PER_PAGE',
  "identified"        BOOLEAN NOT NULL DEFAULT false,
  "onePerPerson"      BOOLEAN NOT NULL DEFAULT false,
  "captureLead"       BOOLEAN NOT NULL DEFAULT false,
  "showInPortal"      BOOLEAN NOT NULL DEFAULT false,
  "opensAt"           TIMESTAMP(3),
  "closesAt"          TIMESTAMP(3),
  "maxResponses"      INTEGER,
  "consentText"       TEXT,
  "consentTextFr"     TEXT,
  "thankYouTitle"     TEXT,
  "thankYouTitleFr"   TEXT,
  "thankYouMessage"   TEXT,
  "thankYouMessageFr" TEXT,
  "ctaLabel"          TEXT,
  "ctaLabelFr"        TEXT,
  "ctaUrl"            TEXT,
  "viewCount"         INTEGER NOT NULL DEFAULT 0,
  "createdById"       TEXT NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,

  CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "surveys_slug_key" ON "surveys"("slug");

CREATE TABLE "survey_questions" (
  "id"         TEXT NOT NULL,
  "surveyId"   TEXT NOT NULL,
  "order"      INTEGER NOT NULL,
  "type"       "SurveyQuestionType" NOT NULL,
  "label"      TEXT NOT NULL,
  "labelFr"    TEXT,
  "helpText"   TEXT,
  "helpTextFr" TEXT,
  "required"   BOOLEAN NOT NULL DEFAULT false,
  "options"    JSONB,
  "showIf"     JSONB,

  CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "survey_questions_surveyId_order_idx" ON "survey_questions"("surveyId", "order");
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_surveyId_fkey"
  FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "survey_responses" (
  "id"              TEXT NOT NULL,
  "surveyId"        TEXT NOT NULL,
  "respondentName"  TEXT,
  "respondentEmail" TEXT,
  "consentAt"       TIMESTAMP(3),
  "locale"          TEXT NOT NULL DEFAULT 'en',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "survey_responses_surveyId_createdAt_idx" ON "survey_responses"("surveyId", "createdAt");
CREATE INDEX "survey_responses_surveyId_respondentEmail_idx" ON "survey_responses"("surveyId", "respondentEmail");
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_surveyId_fkey"
  FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "survey_answers" (
  "id"         TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "value"      JSONB NOT NULL,

  CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "survey_answers_questionId_idx" ON "survey_answers"("questionId");
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_responseId_fkey"
  FOREIGN KEY ("responseId") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
