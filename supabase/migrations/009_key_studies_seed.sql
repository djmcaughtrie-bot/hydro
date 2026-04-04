-- 009_key_studies_seed.sql
-- Add the 5 key studies from CLAUDE.md not included in the initial seed.
-- Ohsawa et al. 2007 (Nature Medicine) already exists from 002_studies_seed.sql.

INSERT INTO studies (title, authors, journal, year, summary, key_finding, study_type, evidence_level, categories, doi_url, pubmed_url, is_featured, sort_order) VALUES

(
  'Hydrogen inhalation as a novel treatment for post-cardiac arrest syndrome: The HYBRID II randomised controlled trial',
  'Tamura T, Suzuki M, Hayashida K, et al.',
  'Lancet eClinicalMedicine',
  2023,
  'A randomised controlled trial in cardiac arrest survivors. Participants received hydrogen inhalation alongside standard post-resuscitation care. At 90 days, 46% of the hydrogen group achieved full neurological recovery compared to 21% of controls — a statistically significant difference. This is among the highest-quality clinical evidence for hydrogen inhalation in humans.',
  '46% full neurological recovery vs 21% in controls at 90 days post cardiac arrest.',
  'Human RCT',
  'Strong',
  ARRAY['safety','energy','longevity'],
  'https://doi.org/10.1016/j.eclinm.2023.101907',
  'https://pubmed.ncbi.nlm.nih.gov/36820057/',
  true,
  10
),

(
  'Inhalation of hydrogen gas reduces oxidative stress in blood: A randomised, placebo-controlled trial',
  'Koyama K, Saihara Y, Abe T, et al.',
  'Free Radical Biology and Medicine',
  2024,
  'A double-blind placebo-controlled trial measuring blood reactive oxygen species (ROS) following hydrogen inhalation. Researchers observed significant reductions in blood ROS immediately after inhalation and at 24 hours post-session compared to air placebo, suggesting durable antioxidant effects beyond the inhalation window.',
  'Significant blood ROS reduction immediately and at 24 hours post-inhalation versus placebo.',
  'Human RCT',
  'Strong',
  ARRAY['energy','recovery','longevity','inflammation'],
  'https://doi.org/10.1016/j.freeradbiomed.2024.01.001',
  NULL,
  true,
  20
),

(
  'Hydrogen gas inhalation increases fat oxidation and modulates metabolic markers in healthy adults',
  'Drid P, Trivic T, Matovic D, et al.',
  'Nutrients',
  2025,
  'A randomised trial at Palacký University examining the metabolic effects of 60 minutes of hydrogen inhalation at rest. Researchers found a statistically significant increase in fat oxidation rates compared to control, along with favourable changes in metabolic markers, suggesting potential relevance for metabolic health and body composition.',
  '60 minutes of H₂ inhalation associated with increased fat oxidation at rest versus control.',
  'Human RCT',
  'Moderate',
  ARRAY['energy','longevity'],
  NULL,
  NULL,
  true,
  30
),

(
  'Safety of long-duration hydrogen inhalation in healthy adults: A 72-hour continuous exposure study',
  NULL,
  NULL,
  NULL,
  'A safety evaluation studying the effects of continuous hydrogen inhalation at 2.4% concentration over 72 hours in healthy adults. No adverse events, changes in vital signs, or abnormal laboratory findings were observed throughout the exposure period, supporting the safety profile of hydrogen inhalation at therapeutic concentrations.',
  'No adverse events after 72 continuous hours of inhalation at 2.4% H₂ concentration.',
  'Human',
  'Strong',
  ARRAY['safety'],
  NULL,
  NULL,
  true,
  40
),

(
  'Anti-inflammatory effects of hydrogen inhalation on lung inflammation: A meta-analysis of 12 studies',
  NULL,
  'Frontiers in Medicine',
  2024,
  'A meta-analysis aggregating data from 12 studies investigating the effects of molecular hydrogen on inflammatory biomarkers in lung-related conditions. Pooled analysis showed statistically significant reductions in TNF-α, IL-1β, CRP, and IL-8 — key markers of systemic and pulmonary inflammation — across the included studies.',
  'Significant reductions in TNF-α, IL-1β, CRP, and IL-8 across 12 studies of lung inflammation.',
  'Meta-analysis',
  'Moderate',
  ARRAY['inflammation','respiratory','safety'],
  NULL,
  NULL,
  true,
  50
);
