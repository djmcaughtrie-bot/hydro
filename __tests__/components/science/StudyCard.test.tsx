import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StudyCard } from '@/components/science/StudyCard'
import type { Study } from '@/lib/types'

const baseStudy: Study = {
  id: '1',
  title: 'H₂ selectively neutralises hydroxyl radicals',
  authors: 'Ohsawa I, et al.',
  journal: 'Nature Medicine',
  year: 2007,
  summary: 'A landmark study on selective antioxidant action.',
  key_finding: 'Selective neutralisation of hydroxyl radicals.',
  study_type: 'Animal',
  evidence_level: 'Strong',
  categories: ['energy', 'longevity'],
  doi_url: 'https://doi.org/10.1038/nm1577',
  pubmed_url: 'https://pubmed.ncbi.nlm.nih.gov/17486089/',
  is_featured: true,
}

describe('StudyCard', () => {
  it('renders title', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText('H₂ selectively neutralises hydroxyl radicals')).toBeInTheDocument()
  })

  it('renders journal and year', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText(/Nature Medicine/)).toBeInTheDocument()
    expect(screen.getByText(/2007/)).toBeInTheDocument()
  })

  it('renders summary', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText('A landmark study on selective antioxidant action.')).toBeInTheDocument()
  })

  it('renders evidence level badge', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })

  it('renders study type tag', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText('Animal')).toBeInTheDocument()
  })

  it('renders key finding callout when present', () => {
    render(<StudyCard study={baseStudy} />)
    expect(screen.getByText('Selective neutralisation of hydroxyl radicals.')).toBeInTheDocument()
  })

  it('does not render key finding callout when absent', () => {
    const study = { ...baseStudy, key_finding: null }
    render(<StudyCard study={study} />)
    expect(screen.queryByText('Selective neutralisation of hydroxyl radicals.')).not.toBeInTheDocument()
  })

  it('renders DOI link with correct href and target', () => {
    render(<StudyCard study={baseStudy} />)
    const doiLink = screen.getByRole('link', { name: /doi/i })
    expect(doiLink).toHaveAttribute('href', 'https://doi.org/10.1038/nm1577')
    expect(doiLink).toHaveAttribute('target', '_blank')
    expect(doiLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders PubMed link when present', () => {
    render(<StudyCard study={baseStudy} />)
    const pubmedLink = screen.getByRole('link', { name: /pubmed/i })
    expect(pubmedLink).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/17486089/')
  })

  it('does not render DOI link when doi_url is null', () => {
    const study = { ...baseStudy, doi_url: null }
    render(<StudyCard study={study} />)
    expect(screen.queryByRole('link', { name: /doi/i })).not.toBeInTheDocument()
  })

  it('applies correct badge style for Moderate evidence', () => {
    const study = { ...baseStudy, evidence_level: 'Moderate' as const }
    render(<StudyCard study={study} />)
    const badge = screen.getByText('Moderate')
    expect(badge).toHaveStyle({ color: '#854d0e' })
  })

  it('applies correct badge style for Emerging evidence', () => {
    const study = { ...baseStudy, evidence_level: 'Emerging' as const }
    render(<StudyCard study={study} />)
    const badge = screen.getByText('Emerging')
    expect(badge).toHaveStyle({ color: '#1e40af' })
  })
})
