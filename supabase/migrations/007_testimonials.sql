-- supabase/migrations/007_testimonials.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.testimonials (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  name                text not null,
  location            text,
  persona             text not null,   -- 'energy' | 'performance' | 'longevity' | 'clinic' | 'general'
  format              text default 'written',  -- 'written' | 'video'
  quote_short         text,
  quote_full          text not null,
  video_url           text,
  source              text,
  rating              integer check (rating >= 1 and rating <= 5),
  compliance_approved boolean default false,
  consent_on_file     boolean default false,
  is_published        boolean default false,
  published_at        timestamptz,
  placement           text[]
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public can read only fully-gated testimonials
CREATE POLICY "testimonials_public_read" ON public.testimonials
  FOR SELECT USING (is_published = true AND compliance_approved = true AND consent_on_file = true);

-- Service role can do everything
CREATE POLICY "testimonials_service_role_all" ON public.testimonials
  USING (auth.role() = 'service_role');

COMMIT;
