insert into studies (title, authors, journal, year, summary, key_finding, study_type, evidence_level, categories, doi_url, pubmed_url, is_featured, sort_order) values

(
  'Hydrogen acts as a therapeutic antioxidant by selectively reducing cytotoxic oxygen radicals',
  'Ohsawa I, Ishikawa M, Takahashi K, et al.',
  'Nature Medicine',
  2007,
  'The landmark study establishing molecular hydrogen as a selective antioxidant. Researchers found H₂ selectively neutralises hydroxyl radicals and peroxynitrite — the most cytotoxic reactive oxygen species — without affecting other signalling ROS. This selectivity distinguishes H₂ from broad-spectrum antioxidants.',
  'H₂ selectively neutralises hydroxyl radicals without disrupting beneficial reactive oxygen species.',
  'Animal',
  'Strong',
  ARRAY['energy','recovery','longevity','safety','inflammation'],
  'https://doi.org/10.1038/nm1577',
  'https://pubmed.ncbi.nlm.nih.gov/17486089/',
  true,
  1
),

(
  'Effect of hydrogen-rich water on the antioxidant status of subjects with potential metabolic syndrome',
  'Nakao A, Toyoda Y, Sharma P, et al.',
  'Nutrition Research',
  2010,
  'A randomised crossover trial in which participants consumed hydrogen-rich water daily for 4 weeks. Researchers observed improvements in antioxidant enzyme activity and reductions in urinary 8-isoprostane — a marker of oxidative stress — compared to placebo.',
  'Daily H₂ intake was associated with improved antioxidant enzyme activity and reduced oxidative stress markers.',
  'Human RCT',
  'Moderate',
  ARRAY['energy','longevity'],
  'https://doi.org/10.1016/j.nutres.2010.10.001',
  'https://pubmed.ncbi.nlm.nih.gov/21130256/',
  false,
  2
),

(
  'Hydrogen inhalation during normoxic resuscitation improves neurological outcome in a rat model of cardiac arrest',
  'Hayashida K, Sano M, Ohsawa I, et al.',
  'Circulation',
  2008,
  'This early animal study explored hydrogen inhalation as a neuroprotective intervention during cardiac resuscitation. Neurological outcomes were significantly improved in the H₂ group compared to controls, providing the mechanistic basis for later human trials.',
  'H₂ inhalation during resuscitation significantly improved neurological recovery in animal models.',
  'Animal',
  'Strong',
  ARRAY['safety','longevity'],
  'https://doi.org/10.1161/CIRCULATIONAHA.108.799520',
  'https://pubmed.ncbi.nlm.nih.gov/18997194/',
  false,
  3
),

(
  'Hydrogen gas inhalation treatment in acute cerebral infarction: a randomized controlled clinical study on safety and neuroprotection',
  'Ono H, Nishijima Y, Ohta S, et al.',
  'Journal of Stroke and Cerebrovascular Diseases',
  2017,
  'A randomised controlled trial examining the safety and neuroprotective effects of H₂ inhalation in acute stroke patients. No adverse events were reported across the treatment group. Researchers observed trends toward improved neurological scores in the H₂ group.',
  'H₂ inhalation in acute stroke patients showed a strong safety profile with no adverse events.',
  'Human RCT',
  'Moderate',
  ARRAY['safety','longevity'],
  'https://doi.org/10.1016/j.jstrokecerebrovasdis.2017.02.012',
  'https://pubmed.ncbi.nlm.nih.gov/28359651/',
  false,
  4
),

(
  'Pilot study: Effects of drinking hydrogen-rich water on muscle fatigue caused by acute exercise in elite athletes',
  'Aoki K, Nakao A, Adachi T, et al.',
  'Medical Gas Research',
  2012,
  'A pilot study in elite athletes examining the effects of hydrogen-rich water on exercise-induced muscle fatigue. Researchers observed reduced blood lactate accumulation and improved muscle function scores compared to placebo, suggesting potential recovery benefits.',
  'H₂ intake was associated with reduced blood lactate and improved muscle function following acute exercise.',
  'Human',
  'Moderate',
  ARRAY['recovery','energy'],
  'https://doi.org/10.1186/2045-9912-2-12',
  'https://pubmed.ncbi.nlm.nih.gov/22520831/',
  true,
  5
),

(
  'Hydrogen gas inhalation inhibits progression to the ''irreversible'' stage of shock after severe hemorrhage in rats',
  'Yoshida A, Asanuma H, Sasaki H, et al.',
  'Journal of Critical Care',
  2012,
  'Animal study exploring H₂ inhalation as a potential intervention in hemorrhagic shock. The research demonstrated meaningful survival and haemodynamic improvements in the H₂ group, contributing to the safety and critical care evidence base.',
  'H₂ inhalation showed protective effects in a severe hemorrhagic shock model.',
  'Animal',
  'Emerging',
  ARRAY['safety','inflammation'],
  'https://doi.org/10.1016/j.jcrc.2011.08.013',
  'https://pubmed.ncbi.nlm.nih.gov/21996279/',
  false,
  6
),

(
  'Hydrogen-rich saline reduces oxidative stress and inflammation in lung injury induced by intestinal ischemia reperfusion',
  'Mao YF, Zheng XF, Cai JM, et al.',
  'Biochemical and Biophysical Research Communications',
  2009,
  'Research exploring molecular hydrogen''s effects on lung inflammation in an ischemia-reperfusion model. Reductions in TNF-α, IL-1β, and markers of oxidative stress were observed in the H₂ group, supporting the inflammation evidence base.',
  'H₂ was associated with significant reductions in TNF-α, IL-1β, and oxidative stress markers in lung tissue.',
  'Animal',
  'Moderate',
  ARRAY['inflammation','respiratory'],
  'https://doi.org/10.1016/j.bbrc.2009.04.069',
  'https://pubmed.ncbi.nlm.nih.gov/19383470/',
  false,
  7
),

(
  'Effects of inhaled hydrogen gas on survival rate and neurological deficits in mice after cardiac arrest',
  'Hayashida K, Sano M, Kamimura N, et al.',
  'PLoS ONE',
  2012,
  'Building on earlier animal work, this study examined survival and neurological outcomes following cardiac arrest and H₂ inhalation across multiple dose conditions. Results supported a dose-dependent neuroprotective effect and informed the design of subsequent human trials.',
  'H₂ inhalation demonstrated dose-dependent neuroprotective effects following cardiac arrest in animal models.',
  'Animal',
  'Strong',
  ARRAY['safety','longevity','respiratory'],
  'https://doi.org/10.1371/journal.pone.0051500',
  'https://pubmed.ncbi.nlm.nih.gov/23240030/',
  false,
  8
);
