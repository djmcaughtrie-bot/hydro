-- supabase/migrations/003_media_table.sql

create table if not exists media (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  filename      text not null,
  url           text not null,
  width         integer not null default 0,
  height        integer not null default 0,
  file_size_kb  integer not null,
  focal_point   text not null default 'center'
                check (focal_point in (
                  'top-left','top','top-right',
                  'left','center','right',
                  'bottom-left','bottom','bottom-right'
                )),
  media_type    text not null
                check (media_type in ('image','video-ambient','video-content')),
  uploaded_at   timestamptz default now()
);

-- Row Level Security
alter table media enable row level security;

-- Only service role (admin panel) can read/write
create policy "service role full access" on media
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
