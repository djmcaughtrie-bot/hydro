-- supabase/migrations/010_content_items_public_read.sql
-- Allow the anon role to read published content_items so that
-- getPageContent (which uses the anon/server client) can serve
-- CMS content on public-facing pages.
--
-- Without this, RLS silently returns zero rows for every anon query,
-- meaning hardcoded fallbacks are always shown instead of CMS content.

create policy "Public read published content"
  on public.content_items
  for select
  using (status = 'published');
