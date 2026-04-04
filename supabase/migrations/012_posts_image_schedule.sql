-- supabase/migrations/012_posts_image_schedule.sql
-- Add featured image, scheduling, and preview token to posts

alter table public.posts
  add column if not exists featured_image_url  text,
  add column if not exists featured_image_alt  text,
  add column if not exists scheduled_for       timestamptz,
  add column if not exists preview_token       uuid not null default gen_random_uuid();

create index if not exists posts_scheduled_idx on public.posts (scheduled_for)
  where is_published = false and scheduled_for is not null;
