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
