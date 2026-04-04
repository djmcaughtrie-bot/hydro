BEGIN;

CREATE TABLE IF NOT EXISTS public.competitions (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  title           text not null,
  description     text,
  prize           text not null,          -- e.g. "H2 Revive device worth £1,400"
  is_active       boolean default false,
  starts_at       timestamptz,
  ends_at         timestamptz
);

CREATE TABLE IF NOT EXISTS public.competition_entries (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  competition_id  uuid references public.competitions(id) on delete cascade,
  name            text not null,
  email           text not null,
  marketing_consent boolean default false,
  consent_timestamp timestamptz,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_content     text,
  utm_term        text,
  UNIQUE(competition_id, email)
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;

-- Public can read active competitions
CREATE POLICY "competitions_public_read" ON public.competitions
  FOR SELECT USING (is_active = true);

-- Anonymous can insert entries
CREATE POLICY "competition_entries_insert" ON public.competition_entries
  FOR INSERT WITH CHECK (true);

-- Service role reads all
CREATE POLICY "competition_entries_service_role_select" ON public.competition_entries
  FOR SELECT USING (auth.role() = 'service_role');

-- Service role reads/manages all competitions
CREATE POLICY "competitions_service_role_all" ON public.competitions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
