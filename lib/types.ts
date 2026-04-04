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

export interface Post {
  id: string
  created_at: string
  updated_at: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  persona_tags: string[]
  category: string | null
  mid_cta_headline: string | null
  mid_cta_body: string | null
  mid_cta_label: string | null
  mid_cta_url: string | null
  bottom_cta_headline: string | null
  bottom_cta_body: string | null
  bottom_cta_label: string | null
  bottom_cta_url: string | null
  featured_image_url: string | null
  featured_image_alt: string | null
  scheduled_for: string | null
  preview_token: string
  is_published: boolean
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
}

export interface Testimonial {
  id: string
  created_at: string
  updated_at: string
  name: string
  location: string | null
  persona: string
  format: 'written' | 'video'
  quote_short: string | null
  quote_full: string
  video_url: string | null
  source: string | null
  rating: number | null
  compliance_approved: boolean
  consent_on_file: boolean
  is_published: boolean
  published_at: string | null
  placement: string[] | null
}
