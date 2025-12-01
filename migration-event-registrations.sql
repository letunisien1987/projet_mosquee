-- Migration pour ajouter les champs manquants à event_registrations
-- Date: 1er décembre 2025
--
-- Exécutez ce script sur votre base de données PostgreSQL
-- via Prisma Data Platform Console ou psql

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS "eventDate" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "eventLocation" TEXT,
ADD COLUMN IF NOT EXISTS "numberOfParticipants" INTEGER;

-- 2. Mettre à jour numberOfParticipants avec les valeurs de attendees
UPDATE event_registrations
SET "numberOfParticipants" = attendees
WHERE "numberOfParticipants" IS NULL;

-- 3. Vérifier les changements
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;

-- 4. Afficher un échantillon des données mises à jour
SELECT
  id,
  "eventTitle",
  "eventDate",
  "eventLocation",
  attendees,
  "numberOfParticipants",
  status,
  "createdAt"
FROM event_registrations
ORDER BY "createdAt" DESC
LIMIT 10;
