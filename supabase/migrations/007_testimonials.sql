-- supabase/migrations/007_testimonials.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.testimonials (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  customer_name       text not null,
  customer_context    text,
  persona             text not null,   -- 'energy' | 'performance' | 'longevity' | 'clinic'
  quote               text not null,
  short_quote         text,
  format              text default 'written',  -- 'written' | 'video'
  video_url           text,
  thumbnail_url       text,
  placement           text[],          -- e.g. ['homepage', 'product', 'science-energy']
  is_published        boolean default false,
  compliance_approved boolean default false,
  consent_on_file     boolean default false,
  source_page         text,
  collected_date      date
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public can read published testimonials
CREATE POLICY "testimonials_public_read" ON public.testimonials
  FOR SELECT USING (is_published = true);

-- Service role can do everything
CREATE POLICY "testimonials_service_role_all" ON public.testimonials
  USING (auth.role() = 'service_role');

COMMIT;
