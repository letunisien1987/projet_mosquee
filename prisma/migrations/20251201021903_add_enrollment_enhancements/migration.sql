-- AlterEnum
ALTER TYPE "EnrollmentStatus" ADD VALUE 'WAITING_LIST';
ALTER TYPE "EnrollmentStatus" ADD VALUE 'INTERVIEW_REQUIRED';
ALTER TYPE "EnrollmentStatus" ADD VALUE 'ACTIVE';

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;
