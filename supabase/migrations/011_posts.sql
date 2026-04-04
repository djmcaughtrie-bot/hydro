-- supabase/migrations/011_posts.sql
-- Journal posts / articles

create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  content         text not null default '',
  persona_tags    text[] not null default '{}',
  category        text check (category in ('science','lifestyle','product','research','general')),
  -- Mid-article CTA (inserted after the 2nd paragraph)
  mid_cta_headline text,
  mid_cta_body     text,
  mid_cta_label    text,
  mid_cta_url      text,
  -- Bottom CTA
  bottom_cta_headline text,
  bottom_cta_body     text,
  bottom_cta_label    text,
  bottom_cta_url      text,
  -- Publishing
  is_published    boolean not null default false,
  published_at    timestamptz,
  -- SEO
  seo_title       text,
  seo_description text
);

alter table public.posts enable row level security;

create policy "Service role full access" on public.posts
  for all using (auth.role() = 'service_role');

create policy "Public read published posts" on public.posts
  for select using (is_published = true);

create index posts_slug_idx on public.posts (slug);
create index posts_category_idx on public.posts (category);
create index posts_published_at_idx on public.posts (published_at desc nulls last);
