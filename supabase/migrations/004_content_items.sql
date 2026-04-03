create table if not exists public.content_items (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  page            text not null,
  section         text not null,
  persona         text check (persona in ('sarah', 'marcus', 'elena')),
  content_type    text not null,
  content_json    jsonb not null default '{}',
  status          text not null default 'draft' check (status in ('draft', 'published', 'needs_review')),
  generation_prompt text,
  published_at    timestamptz
);

alter table public.content_items enable row level security;

create policy "Service role full access" on public.content_items
  for all using (auth.role() = 'service_role');
