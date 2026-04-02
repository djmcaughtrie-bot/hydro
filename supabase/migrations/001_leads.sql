create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  name            text,
  email           text not null,
  phone           text,
  persona         text check (persona in ('sarah', 'marcus', 'elena', 'clinic', 'general')),
  enquiry_type    text check (enquiry_type in ('product', 'clinic', 'waitlist', 'general')),
  message         text,
  source_page     text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  status          text default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  notes           text
);

-- Enable Row Level Security
alter table leads enable row level security;

-- Only service role can read/write (admin panel uses service role)
create policy "service role full access" on leads
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
