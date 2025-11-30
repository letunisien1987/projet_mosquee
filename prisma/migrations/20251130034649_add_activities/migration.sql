-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('QURAN', 'ARABIC', 'SUNDAY_SCHOOL', 'HALAQAT', 'WOMEN', 'SUPPORT', 'OTHER');

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ActivityCategory" NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "status" "ActivityStatus" NOT NULL DEFAULT 'ACTIVE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_levels" (
    "id" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "participants" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "price" DOUBLE PRECISION,
    "maxCapacity" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_levels_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "activity_levels" ADD CONSTRAINT "activity_levels_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename old activityId column
ALTER TABLE "enrollments" RENAME COLUMN "activityId" TO "activityIdOld";

-- Add new UUID activityId column (nullable first)
ALTER TABLE "enrollments" ADD COLUMN "activityId" UUID;
ALTER TABLE "enrollments" ADD COLUMN "levelId" UUID;

-- AddForeignKey (nullable for now)
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
