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
  'Safety of Prolonged Inhalation of Hydrogen Gas in Air in Healthy Adults',
  'Cole AR, Sperotto F, Dinardo JA, et al.',
  'Critical Care Explorations',
  2021,
  'A prospective Phase I clinical study in 8 healthy adults at Boston Children''s Hospital. Participants inhaled 2.4% H₂ in air via high-flow nasal cannula at 15 L/min for up to 72 hours continuously. No clinically significant adverse events were recorded at 24, 48, or 72 hours. Vital signs and laboratory values remained within normal limits throughout.',
  'No clinically significant adverse events in any participant across 24, 48, or 72 hours of continuous 2.4% H₂ inhalation.',
  'Human',
  'Strong',
  ARRAY['safety'],
  'https://doi.org/10.1097/CCE.0000000000000543',
  'https://pubmed.ncbi.nlm.nih.gov/34651133/',
  true,
  40
),

(
  'Anti-inflammatory and antioxidant activity of high concentrations of hydrogen in lung diseases: a systematic review and meta-analysis',
  'Xiao K, Liu J, Sun Y, Chen S, Ma J, Cao M, Yang Y, Pan Z, Li P, Du Z.',
  'Frontiers in Immunology',
  2024,
  'A systematic review and meta-analysis of 12 in vivo animal (rodent) studies examining the effects of high-concentration hydrogen on inflammatory and oxidative markers in lung disease models. Pooled analysis showed significant reductions in TNF-α, IL-1β, IL-4, IL-8, MDA, and ROS. No significant effect on IL-6 was found. Note: all included studies are preclinical animal models — human trial data is not yet available at this concentration range.',
  'Significant reductions in TNF-α, IL-1β, IL-4, IL-8, MDA, and ROS across 12 preclinical animal studies of lung inflammation.',
  'Animal',
  'Moderate',
  ARRAY['inflammation','respiratory','safety'],
  'https://doi.org/10.3389/fimmu.2024.1444958',
  NULL,
  true,
  50
);
