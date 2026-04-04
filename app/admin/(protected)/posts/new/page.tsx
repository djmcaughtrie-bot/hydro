import type { Metadata } from 'next'
import Link from 'next/link'
import { PostEditor } from '@/components/admin/PostEditor'

export const metadata: Metadata = { title: 'New post' }

export default function NewPostPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/posts" className="font-mono text-xs text-teal transition-colors hover:text-teal-dark">
          ← Posts
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">New post</h1>
      </div>
      <PostEditor />
    </div>
  )
}
