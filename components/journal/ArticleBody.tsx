import { ArticleCta } from './ArticleCta'
import type { Post } from '@/lib/types'

interface Props {
  post: Post
}

// Simple inline parser: supports **bold** and [text](url)
function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.+?\*\*|\[.+?\]\(.+?\))/g)
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*(.+?)\*\*$/)
    if (bold) return <strong key={i}>{bold[1]}</strong>
    const link = part.match(/^\[(.+?)\]\((.+?)\)$/)
    if (link) return (
      <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer"
        className="text-teal underline-offset-2 hover:text-teal-dark hover:underline">
        {link[1]}
      </a>
    )
    return part
  })
}

// Parse a single block into a React element
function renderBlock(block: string, index: number): React.ReactNode {
  const trimmed = block.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('### ')) {
    return <h3 key={index} className="mb-3 mt-8 font-display text-xl text-ink">{trimmed.slice(4)}</h3>
  }
  if (trimmed.startsWith('## ')) {
    return <h2 key={index} className="mb-4 mt-10 font-display text-2xl text-ink">{trimmed.slice(3)}</h2>
  }
  // Unordered list block: each line starting with "- "
  if (trimmed.split('\n').every(l => l.startsWith('- ') || l.trim() === '')) {
    const items = trimmed.split('\n').filter(l => l.startsWith('- '))
    return (
      <ul key={index} className="mb-4 list-disc pl-5 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="font-sans text-base leading-relaxed text-ink-mid">
            {parseInline(item.slice(2))}
          </li>
        ))}
      </ul>
    )
  }
  return (
    <p key={index} className="mb-4 font-sans text-base leading-relaxed text-ink-mid">
      {parseInline(trimmed)}
    </p>
  )
}

export function ArticleBody({ post }: Props) {
  // Split content into blocks by blank lines
  const blocks = post.content.split(/\n{2,}/).filter(b => b.trim())

  const hasMidCta = !!(post.mid_cta_headline || post.mid_cta_label)
  // Insert mid-CTA after the 2nd paragraph (index 1, 0-based)
  const MID_CTA_AFTER = 1

  const elements: React.ReactNode[] = []
  let paragraphCount = 0

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const isHeading = block.trim().startsWith('## ') || block.trim().startsWith('### ')

    if (!isHeading) paragraphCount++

    elements.push(renderBlock(block, i))

    if (hasMidCta && paragraphCount === MID_CTA_AFTER + 1) {
      elements.push(
        <ArticleCta
          key="mid-cta"
          headline={post.mid_cta_headline}
          body={post.mid_cta_body}
          label={post.mid_cta_label}
          url={post.mid_cta_url}
          variant="mid"
        />
      )
    }
  }

  return <div className="prose-custom">{elements}</div>
}
