/*
  Warnings:

  - Added the required column `updatedAt` to the `event_registrations` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `event_registrations` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "event_registrations" ADD COLUMN     "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;
