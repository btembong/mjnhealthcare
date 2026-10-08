-- Campaign emails use the MJN branded layout unless switched off
ALTER TABLE "campaigns" ADD COLUMN "useBrandTemplate" BOOLEAN NOT NULL DEFAULT true;
