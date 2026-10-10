-- Guided tours each person has already seen, so they are not replayed on a new device
ALTER TABLE "persons" ADD COLUMN "completedTours" TEXT[] DEFAULT ARRAY[]::TEXT[];
