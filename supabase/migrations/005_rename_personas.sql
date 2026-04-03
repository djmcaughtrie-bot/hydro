-- supabase/migrations/005_rename_personas.sql
-- Rename personas from name-based slugs (sarah/marcus/elena)
-- to focus-based slugs (energy/performance/longevity).

BEGIN;

-- 1. Migrate existing content_items data
UPDATE public.content_items SET persona = 'energy'      WHERE persona = 'sarah';
UPDATE public.content_items SET persona = 'performance' WHERE persona = 'marcus';
UPDATE public.content_items SET persona = 'longevity'   WHERE persona = 'elena';

-- 2. Replace content_items persona check constraint (drop by column match, name may be auto-generated)
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
  WHERE conrelid = 'public.content_items'::regclass AND contype = 'c' AND conname LIKE '%persona%';
  IF c IS NOT NULL THEN EXECUTE 'ALTER TABLE public.content_items DROP CONSTRAINT ' || quote_ident(c); END IF;
END $$;
ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_persona_check
  CHECK (persona IN ('energy', 'performance', 'longevity'));

-- 3. Migrate existing leads data
UPDATE public.leads SET persona = 'energy'      WHERE persona = 'sarah';
UPDATE public.leads SET persona = 'performance' WHERE persona = 'marcus';
UPDATE public.leads SET persona = 'longevity'   WHERE persona = 'elena';

-- 4. Replace leads persona check constraint
DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
  WHERE conrelid = 'public.leads'::regclass AND contype = 'c' AND conname LIKE '%persona%';
  IF c IS NOT NULL THEN EXECUTE 'ALTER TABLE public.leads DROP CONSTRAINT ' || quote_ident(c); END IF;
END $$;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_persona_check
  CHECK (persona IN ('energy', 'performance', 'longevity', 'clinic', 'general'));

COMMIT;
