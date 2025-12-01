-- Manual migration to add children management and payment system
-- Run this with: psql $DATABASE_URL -f prisma/migrations/manual_add_children_payment_system.sql

-- 1. Add new columns to children table
ALTER TABLE children ADD COLUMN IF NOT EXISTS "nickName" TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- 2. Add new columns to event_registrations table
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS "childId" UUID REFERENCES children(id) ON DELETE CASCADE;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS "requiresPayment" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS "paymentAmount" DOUBLE PRECISION;
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS "paymentId" UUID;

-- 3. Create PaymentStatus enum if not exists
DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create NotificationType enum if not exists
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM (
        'EVENT_CONFIRMATION',
        'EVENT_REMINDER',
        'EVENT_CANCELLED',
        'EVENT_WAITLIST_SPOT_AVAILABLE',
        'ENROLLMENT_CONFIRMATION',
        'ENROLLMENT_APPROVED',
        'ENROLLMENT_REJECTED',
        'PAYMENT_PENDING',
        'PAYMENT_CONFIRMED',
        'PAYMENT_FAILED',
        'SYSTEM',
        'REMINDER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users(id) ON DELETE SET NULL,
    "eventId" TEXT,
    "enrollmentId" UUID,
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CHF',
    status "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentId" TEXT UNIQUE,
    "stripeCheckoutId" TEXT,
    metadata JSONB,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create indexes for payments
CREATE INDEX IF NOT EXISTS "payments_userId_idx" ON payments("userId");
CREATE INDEX IF NOT EXISTS "payments_stripePaymentId_idx" ON payments("stripePaymentId");

-- 7. Add foreign key from event_registrations to payments
ALTER TABLE event_registrations
    ADD CONSTRAINT IF NOT EXISTS "event_registrations_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES payments(id) ON DELETE SET NULL;

-- 8. Create waiting_lists table
CREATE TABLE IF NOT EXISTS waiting_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users(id) ON DELETE SET NULL,
    "childId" UUID,
    "eventId" TEXT,
    "activityId" TEXT,
    "eventTitle" TEXT,
    "activityTitle" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactName" TEXT NOT NULL,
    notified BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "convertedToRegistration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create indexes for waiting_lists
CREATE INDEX IF NOT EXISTS "waiting_lists_eventId_notified_idx" ON waiting_lists("eventId", notified);
CREATE INDEX IF NOT EXISTS "waiting_lists_activityId_notified_idx" ON waiting_lists("activityId", notified);
CREATE INDEX IF NOT EXISTS "waiting_lists_userId_idx" ON waiting_lists("userId");

-- 10. Update notifications table: add emailSent column
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "emailSent" BOOLEAN NOT NULL DEFAULT false;

-- 11. Update notifications type column (if it's currently TEXT, we need to convert it)
-- Note: This requires careful handling if there's existing data
-- For now, we'll add a new column and migrate later if needed
-- ALTER TABLE notifications ALTER COLUMN type TYPE "NotificationType" USING type::"NotificationType";

COMMIT;
