export interface Study {
  id: string
  title: string
  authors: string | null
  journal: string | null
  year: number | null
  summary: string
  key_finding: string | null
  study_type: 'Human RCT' | 'Human' | 'Animal' | 'Meta-analysis'
  evidence_level: 'Strong' | 'Moderate' | 'Emerging'
  categories: string[]
  doi_url: string | null
  pubmed_url: string | null
  is_featured: boolean
  is_published?: boolean
  sort_order?: number
}

export type ContentStatus = 'draft' | 'published' | 'needs_review'

export interface ContentItem {
  id: string
  created_at: string
  updated_at: string
  page: string
  section: string
  persona: string | null
  content_type: string
  content_json: Record<string, unknown>
  status: ContentStatus
  generation_prompt: string | null
  published_at: string | null
}

export interface MediaItem {
  id: string
  created_at: string
  filename: string
  url: string
  width: number
  height: number
  file_size_kb: number
  focal_point: string
  media_type: 'image' | 'video-ambient' | 'video-content'
  uploaded_at: string
}

export interface Testimonial {
  id: string
  created_at: string
  customer_name: string
  customer_context: string | null
  persona: string
  quote: string
  short_quote: string | null
  format: 'written' | 'video'
  video_url: string | null
  thumbnail_url: string | null
  placement: string[] | null
  is_published: boolean
  compliance_approved: boolean
  consent_on_file: boolean
  source_page: string | null
  collected_date: string | null
}
