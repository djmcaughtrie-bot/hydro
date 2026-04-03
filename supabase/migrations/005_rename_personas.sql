-- supabase/migrations/005_rename_personas.sql

-- 1. Migrate existing content_items data before dropping constraint
UPDATE public.content_items SET persona = 'energy'      WHERE persona = 'sarah';
UPDATE public.content_items SET persona = 'performance' WHERE persona = 'marcus';
UPDATE public.content_items SET persona = 'longevity'   WHERE persona = 'elena';

-- 2. Replace check constraint on content_items
ALTER TABLE public.content_items
  DROP CONSTRAINT IF EXISTS content_items_persona_check;
ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_persona_check
  CHECK (persona IN ('energy', 'performance', 'longevity'));

-- 3. Migrate existing leads data
UPDATE public.leads SET persona = 'energy'      WHERE persona = 'sarah';
UPDATE public.leads SET persona = 'performance' WHERE persona = 'marcus';
UPDATE public.leads SET persona = 'longevity'   WHERE persona = 'elena';

-- 4. Replace check constraint on leads
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_persona_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_persona_check
  CHECK (persona IN ('energy', 'performance', 'longevity', 'clinic', 'general'));
