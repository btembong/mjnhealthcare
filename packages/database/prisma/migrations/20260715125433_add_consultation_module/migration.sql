-- CreateEnum
CREATE TYPE "ConsultantType" AS ENUM ('STAFF', 'PARTNER');

-- CreateEnum
CREATE TYPE "ConsultantStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ConsultationCategory" AS ENUM ('HEALTH', 'CAREER', 'BOTH');

-- CreateEnum
CREATE TYPE "ConsultationBookingStatus" AS ENUM ('AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "consultant_profiles" (
    "id" TEXT NOT NULL,
    "type" "ConsultantType" NOT NULL DEFAULT 'STAFF',
    "status" "ConsultantStatus" NOT NULL DEFAULT 'ACTIVE',
    "consultationCategory" "ConsultationCategory" NOT NULL DEFAULT 'BOTH',
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "photoUrl" TEXT,
    "specialty" TEXT NOT NULL,
    "languages" TEXT[],
    "licenseNumber" TEXT,
    "licenseBody" TEXT,
    "licenseVerifiedAt" TIMESTAMP(3),
    "priceUsd" DECIMAL(10,2) NOT NULL,
    "sessionDurationMins" INTEGER NOT NULL DEFAULT 45,
    "commissionRate" DECIMAL(4,3) NOT NULL DEFAULT 0.25,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "partnerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_slots" (
    "id" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "consultation_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_bookings" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "preSessionNote" TEXT,
    "consultationCategory" "ConsultationCategory" NOT NULL,
    "recordingConsent" BOOLEAN NOT NULL DEFAULT false,
    "dailyRoomUrl" TEXT,
    "dailyRoomName" TEXT,
    "recordingUrl" TEXT,
    "status" "ConsultationBookingStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "refundAmount" DECIMAL(10,2),
    "refundedAt" TIMESTAMP(3),
    "paymentRef" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_payouts" (
    "id" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paymentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultant_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_applications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "consultationCategory" "ConsultationCategory" NOT NULL,
    "specialty" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "licenseBody" TEXT,
    "bio" TEXT NOT NULL,
    "languages" TEXT[],
    "yearsExperience" INTEGER NOT NULL,
    "documentUrls" TEXT[],
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultant_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultation_bookings_slotId_key" ON "consultation_bookings"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_payouts_bookingId_key" ON "consultant_payouts"("bookingId");

-- AddForeignKey
ALTER TABLE "consultation_slots" ADD CONSTRAINT "consultation_slots_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "consultant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_bookings" ADD CONSTRAINT "consultation_bookings_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "consultation_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_bookings" ADD CONSTRAINT "consultation_bookings_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "consultant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_payouts" ADD CONSTRAINT "consultant_payouts_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "consultant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_payouts" ADD CONSTRAINT "consultant_payouts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "consultation_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
