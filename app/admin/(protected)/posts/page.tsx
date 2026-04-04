import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Post } from '@/lib/types'

export const metadata: Metadata = { title: 'Journal posts' }

export default async function AdminPostsPage() {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('posts')
    .select('id, title, slug, category, persona_tags, is_published, published_at, updated_at')
    .order('updated_at', { ascending: false })

  const posts = (data ?? []) as Pick<Post, 'id' | 'title' | 'slug' | 'category' | 'persona_tags' | 'is_published' | 'published_at' | 'updated_at'>[]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Journal</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-teal px-4 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-teal-dark"
        >
          + New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <p className="font-sans text-sm text-ink-light">No posts yet.</p>
          <Link href="/admin/posts/new" className="mt-3 inline-block font-mono text-xs text-teal hover:text-teal-dark">
            Create your first post →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left font-mono text-xs font-medium text-ink-light">Title</th>
                <th className="hidden px-5 py-3 text-left font-mono text-xs font-medium text-ink-light sm:table-cell">Category</th>
                <th className="hidden px-5 py-3 text-left font-mono text-xs font-medium text-ink-light md:table-cell">Personas</th>
                <th className="px-5 py-3 text-left font-mono text-xs font-medium text-ink-light">Status</th>
                <th className="px-5 py-3 text-left font-mono text-xs font-medium text-ink-light">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="font-sans text-sm font-medium text-ink hover:text-teal"
                    >
                      {post.title}
                    </Link>
                    <p className="font-mono text-xs text-ink-light">/journal/{post.slug}</p>
                  </td>
                  <td className="hidden px-5 py-3 sm:table-cell">
                    <span className="font-sans text-xs text-ink-mid capitalize">{post.category ?? '—'}</span>
                  </td>
                  <td className="hidden px-5 py-3 md:table-cell">
                    <span className="font-sans text-xs text-ink-mid">
                      {post.persona_tags.length > 0 ? post.persona_tags.join(', ') : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded px-2 py-0.5 font-mono text-xs font-medium ${
                      post.is_published ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {post.is_published ? '● Published' : '○ Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-light">
                    {new Date(post.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
