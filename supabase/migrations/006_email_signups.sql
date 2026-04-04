-- supabase/migrations/006_email_signups.sql
-- Email sign-up infrastructure: email_signups table + UTM columns on leads

BEGIN;

-- 1. Add missing UTM columns to leads (utm_content and utm_term)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term    text;

-- 2. Create email_signups table
CREATE TABLE IF NOT EXISTS public.email_signups (
  id                        uuid primary key default gen_random_uuid(),
  created_at                timestamptz default now(),
  email                     text not null,
  name                      text,
  persona                   text,          -- 'energy' | 'performance' | 'longevity' | 'general'
  source                    text,          -- 'homepage-bar' | 'exit-intent' | 'inline-blog' | 'social-bio' | 'competition' | 'lead-magnet'
  lead_magnet               text,          -- 'cellular-energy-guide' | 'recovery-protocol' | 'research-summary' | 'clinic-guide' | null
  marketing_consent         boolean default false,
  consent_timestamp         timestamptz,
  utm_source                text,
  utm_medium                text,
  utm_campaign              text,
  utm_content               text,
  utm_term                  text,
  double_opt_in_sent        boolean default false,
  double_opt_in_confirmed   boolean default false,
  confirmed_at              timestamptz
);

-- 3. Enable RLS
ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous inserts (sign-up from public site)
CREATE POLICY "email_signups_insert" ON public.email_signups
  FOR INSERT WITH CHECK (true);

-- 5. Restrict reads to service role only (admin panel uses service role client)
CREATE POLICY "email_signups_service_role_select" ON public.email_signups
  FOR SELECT USING (auth.role() = 'service_role');

COMMIT;
