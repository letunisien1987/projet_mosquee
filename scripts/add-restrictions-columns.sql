-- Migration: Ajouter les colonnes pour les restrictions d'inscription
-- Date: 1er décembre 2025

-- Ajouter les colonnes à event_registrations
ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS participation_type VARCHAR(255) DEFAULT 'INDIVIDUAL',
ADD COLUMN IF NOT EXISTS number_of_adults INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS number_of_children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS participants JSONB,
ADD COLUMN IF NOT EXISTS participant_age INTEGER,
ADD COLUMN IF NOT EXISTS participant_gender VARCHAR(50);

-- Vérification
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;
