import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PostEditor } from '@/components/admin/PostEditor'
import type { Post } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const adminClient = createAdminClient()
  const { data } = await adminClient.from('posts').select('title').eq('id', id).single()
  return { title: data ? `Edit: ${data.title}` : 'Edit post' }
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.from('posts').select('*').eq('id', id).single()
  if (error || !data) notFound()

  const post = data as Post

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/posts" className="font-mono text-xs text-teal transition-colors hover:text-teal-dark">
          ← Posts
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="font-display text-2xl text-ink">{post.title}</h1>
          <span className={`rounded px-2 py-0.5 font-mono text-xs font-medium ${
            post.is_published ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {post.is_published ? '● Published' : '○ Draft'}
          </span>
        </div>
      </div>
      <PostEditor post={post} />
    </div>
  )
}
