import type { Persona } from './persona'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CtaLink {
  label: string
  href: string
}

export interface StudyReference {
  title: string
  citation: string
  evidenceLevel: 'Strong' | 'Moderate' | 'Emerging'
  studyType: 'Human RCT' | 'Human' | 'Animal' | 'Meta-analysis'
  summary: string
  doiUrl: string | null
  pubmedUrl: string | null
}

export interface FaqItem {
  question: string
  answer: string
}

export interface PersonaPageContent {
  hero: {
    headline: string
    subline: string
    primaryCta: CtaLink
    secondaryCta: CtaLink
  }
  problem: {
    headline: string
    body: string[]
  }
  mechanism: {
    /** Per-persona application paragraph — the shared intro is in MECHANISM_SHARED */
    application: string
  }
  session: {
    headline: string
    body: string
  }
  device: {
    leadSpec: 'purity' | 'flow' | 'membrane'
    leadLine: string
    ctaLabel: string
  }
  cta: {
    headline: string
    body: string
    primaryCta: CtaLink
  }
  faqs: FaqItem[]
  studies: StudyReference[]
  scienceLink: {
    label: string
    href: string
  }
}

// ---------------------------------------------------------------------------
// Shared mechanism intro (same on all three persona pages)
// ---------------------------------------------------------------------------

export const MECHANISM_SHARED = {
  headline: 'A selective antioxidant.',
  intro:
    'A 2007 study published in Nature Medicine — the first peer-reviewed documentation of molecular hydrogen\'s antioxidant mechanism — found that H\u2082 selectively neutralises hydroxyl radicals and peroxynitrite, the most cytotoxic reactive oxygen species, without affecting other ROS that the body uses for beneficial signalling. This selectivity is what distinguishes it from conventional antioxidants, which neutralise indiscriminately.',
  doi: 'https://doi.org/10.1038/nm1577',
  doiLabel: 'Ohsawa et al., Nature Medicine, 2007',
} as const

// ---------------------------------------------------------------------------
// Per-persona content
// ---------------------------------------------------------------------------

const energyContent: PersonaPageContent = {
  hero: {
    headline: "What if the reason nothing's working isn't you?",
    subline:
      "There's a level below where most wellness interventions work. Research suggests molecular hydrogen may be one of the few things that reaches it.",
    primaryCta: { label: 'Explore what might help', href: '/product?persona=energy' },
    secondaryCta: { label: 'See the science', href: '/science/energy' },
  },
  problem: {
    headline: 'The problem most people don\'t name.',
    body: [
      "The problem isn't laziness or poor sleep hygiene — most people reading this have already tried that. It's that chronic low energy, brain fog, and post-viral fatigue tend to operate at the cellular level, specifically in how mitochondria produce and sustain ATP. Conventional interventions — caffeine, adaptogens, sleep optimisation — don't reach that level. They manage symptoms. The underlying oxidative environment stays the same.",
    ],
  },
  mechanism: {
    application:
      'Mitochondria are the primary site of hydroxyl radical production during oxidative phosphorylation. Because H\u2082 is the smallest molecule in existence, it crosses cell membranes and enters mitochondria directly — targeting oxidative stress at the source of cellular energy production. Research suggests this mechanism may support mitochondrial efficiency and the sustained production of ATP.',
  },
  session: {
    headline: 'Twenty minutes. Once daily.',
    body: "Most people fit it into the morning — before the day accelerates. Twenty minutes while the coffee brews. Some use it in the early evening if brain fog is worst in the afternoon. Consistency appears to matter more than timing.",
  },
  device: {
    leadSpec: 'purity',
    leadLine: 'The concentration matters. 99.99% pure molecular hydrogen, at the output that research protocols use.',
    ctaLabel: 'Explore what might help',
  },
  cta: {
    headline: 'If any of this resonates, the next step is straightforward.',
    body: "We're taking enquiries ahead of UK launch. Tell us a little about where you are, and we'll be in touch.",
    primaryCta: { label: 'Enquire about the device', href: '/product?persona=energy' },
  },
  faqs: [
    {
      question: 'Will I feel a difference immediately, or does it take time?',
      answer:
        "Individual responses vary, and the honest answer is: we don't know exactly when you'll notice something, if at all. Some users report changes within the first two weeks of daily use; others describe a gradual shift over a month. The studies we've reviewed involved consistent daily use over extended periods. We'd suggest committing to 30 days before drawing any conclusions.",
    },
    {
      question: "I've tried everything — adaptogens, B vitamins, sleep supplements. Why would this be different?",
      answer:
        "Most interventions for energy and fatigue work at the level of symptoms or lifestyle inputs. The research into molecular hydrogen suggests a different point of action — mitochondrial oxidative stress. Whether that's the relevant variable in your case, we can't say. But if you've been thorough and nothing has worked, it may be worth understanding what you haven't yet tried.",
    },
    {
      question: 'Is this just a sophisticated antioxidant supplement?',
      answer:
        "Not exactly. The key distinction is delivery method and selectivity. Most oral antioxidants don't reach mitochondria in meaningful concentrations. Inhalation delivers H\u2082 directly to the bloodstream and from there to cells. The selectivity — targeting only the most damaging free radicals — is also distinct from broad-spectrum antioxidant supplementation.",
    },
    {
      question: 'Is it safe to use every day?',
      answer:
        'A 2023 study documented no adverse events following 72 continuous hours of hydrogen inhalation at 2.4% concentration. For daily wellness use at standard session lengths, the human safety evidence is strong. As with any wellness practice, if you have an existing medical condition, we\'d recommend speaking with your GP first.',
    },
    {
      question: "What's the difference between hydrogen inhalation and hydrogen water?",
      answer:
        'Hydrogen water delivers dissolved H\u2082 through the digestive system. Inhalation delivers H\u2082 directly to the lungs and bloodstream, achieving systemic distribution more rapidly and at higher concentrations. The majority of the human RCT evidence in the research literature uses inhalation as the delivery method.',
    },
  ],
  studies: [
    {
      title: 'Hydrogen inhalation and fat oxidation at rest',
      citation: 'Pala\u010dk\u00fd University, 2025',
      evidenceLevel: 'Moderate',
      studyType: 'Human RCT',
      summary:
        'A 2025 randomised controlled trial found that 60 minutes of hydrogen gas inhalation was associated with increased fat oxidation at rest. Researchers observed measurable metabolic changes during a single session, suggesting a potential influence on cellular energy substrate use.',
      doiUrl: null,
      pubmedUrl: null,
    },
    {
      title: 'Antioxidant status and oxidative stress markers',
      citation: 'Nakao et al., Nutrition Research, 2010',
      evidenceLevel: 'Moderate',
      studyType: 'Human RCT',
      summary:
        'A randomised crossover trial found that daily hydrogen intake over four weeks was associated with improved antioxidant enzyme activity and reductions in urinary 8-isoprostane — a biomarker of oxidative stress — compared to placebo.',
      doiUrl: 'https://doi.org/10.1016/j.nutres.2010.10.001',
      pubmedUrl: null,
    },
    {
      title: 'Acute blood ROS reduction following hydrogen inhalation',
      citation: 'Free Radical Biology & Medicine, 2024',
      evidenceLevel: 'Moderate',
      studyType: 'Human RCT',
      summary:
        'This study documented significant reductions in blood reactive oxygen species immediately following hydrogen inhalation, with effects persisting at 24 hours post-session. The findings support the acute antioxidant mechanism in a human population.',
      doiUrl: null,
      pubmedUrl: null,
    },
  ],
  scienceLink: {
    label: 'The full energy and fatigue research',
    href: '/science/energy',
  },
}

const performanceContent: PersonaPageContent = {
  hero: {
    headline: "The recovery tool serious athletes haven't found yet.",
    subline:
      '600ml/min output. 99.99% H\u2082 purity. PEM membrane technology. The specs matter — here\'s why.',
    primaryCta: { label: 'See the full spec', href: '/product?persona=performance' },
    secondaryCta: { label: 'See the evidence', href: '/science/recovery' },
  },
  problem: {
    headline: "The limiting factor isn't fitness.",
    body: [
      "The limiting factor for most serious athletes isn't fitness — it's recovery. Training is the stimulus; adaptation happens in the window after. If oxidative stress and inflammation in that window are higher than your body can clear, the adaptation is incomplete. You train again before you've fully recovered from the last session. Over time, the gap compounds.",
    ],
  },
  mechanism: {
    application:
      "During and after intense exercise, the body generates significant oxidative stress and inflammation — this is part of the adaptive signal, but excess hydroxyl radical accumulation can delay muscle repair and extend recovery windows. Because H\u2082 reaches mitochondria directly, research suggests it may support the body's management of exercise-induced oxidative stress without blunting the beneficial inflammatory response that drives adaptation.",
  },
  session: {
    headline: '30\u201360 minutes. In the recovery window.',
    body: "The most studied protocol is a 30\u201360 minute session. Some athletes use it in the recovery window after training; others use it the morning after a hard session when acute inflammation is highest. The evidence for session timing is still emerging — consistency appears to be the primary variable.",
  },
  device: {
    leadSpec: 'flow',
    leadLine: '600ml/min. The output that matches the sessions in the studies.',
    ctaLabel: 'See the full spec',
  },
  cta: {
    headline: "The spec is what it is. The question is whether it fits your stack.",
    body: "We're taking pre-launch enquiries. If you want the spec sheet and a conversation, we can arrange that.",
    primaryCta: { label: 'Enquire about the device', href: '/product?persona=performance' },
  },
  faqs: [
    {
      question: 'When should I use it in relation to training?',
      answer:
        "The evidence on timing is still emerging. Some studies have examined pre-session use; others focus on the recovery window immediately following training. Our read of the research suggests the post-session window — when oxidative stress and inflammation are highest — is the most mechanistically logical time for use. That said, consistent daily use appears to be the primary variable in most protocols.",
    },
    {
      question: 'How does this compare to other recovery tools — ice baths, compression, NormaTec, etc?',
      answer:
        "These are different interventions targeting different aspects of recovery. Cold exposure addresses acute inflammation through vasoconstriction; compression aids lymphatic clearance; hydrogen inhalation may address oxidative stress at the cellular level. They're not mutually exclusive. The athletes we find most interested in this are already doing the established recovery work and are looking for what else is at the frontier.",
    },
    {
      question: 'Is there evidence from elite or professional athletes specifically?',
      answer:
        "The Aoki et al. pilot study involved elite athletes, and the findings on blood lactate and muscle function are relevant to high-performance contexts. The broader human RCT evidence is not exclusively from athletic populations — much of it comes from clinical settings. The mechanistic case is strong; the elite sports-specific evidence base is still developing.",
    },
    {
      question: 'What are the exact output specs?',
      answer:
        '600ml/min flow rate. 99.99% H\u2082 purity. PEM/SPE membrane technology — not alkaline electrolysis, which produces lower purity output. Session length 20\u201360 minutes. Full spec table on the product page.',
    },
    {
      question: "Is it safe at the output levels you're describing?",
      answer:
        'Hydrogen gas at concentrations up to 4% is non-flammable (the flammable threshold is above 4.65%). The device operates well within the safe range. A 2023 study involved continuous inhalation for 72 hours with no adverse events reported. For reference, standard session use is 20\u201360 minutes daily.',
    },
  ],
  studies: [
    {
      title: 'Molecular hydrogen and exercise-induced muscle fatigue',
      citation: 'Aoki et al., Medical Gas Research, 2012',
      evidenceLevel: 'Moderate',
      studyType: 'Human',
      summary:
        'A pilot study in elite athletes found that hydrogen-rich water intake was associated with reduced blood lactate accumulation and improved muscle function scores following acute exercise, compared to placebo. Researchers noted potential implications for recovery between training sessions.',
      doiUrl: 'https://doi.org/10.1186/2045-9912-2-12',
      pubmedUrl: null,
    },
    {
      title: 'Acute blood ROS reduction following hydrogen inhalation',
      citation: 'Free Radical Biology & Medicine, 2024',
      evidenceLevel: 'Moderate',
      studyType: 'Human RCT',
      summary:
        'Significant blood reactive oxygen species reductions were observed immediately following and at 24 hours after hydrogen inhalation in this randomised controlled trial — the post-session persistence is particularly relevant to recovery applications.',
      doiUrl: null,
      pubmedUrl: null,
    },
    {
      title: 'Hydrogen and inflammatory markers: meta-analysis of lung studies',
      citation: 'Frontiers, 2024',
      evidenceLevel: 'Strong',
      studyType: 'Meta-analysis',
      summary:
        'A meta-analysis of 12 lung studies found that hydrogen was associated with significant reductions in TNF-\u03b1, IL-1\u03b2, CRP, and IL-8 — key markers of the inflammatory cascade. While derived from respiratory studies, the mechanism is systemic.',
      doiUrl: null,
      pubmedUrl: null,
    },
  ],
  scienceLink: {
    label: 'The full recovery and performance research',
    href: '/science/recovery',
  },
}

const longevityContent: PersonaPageContent = {
  hero: {
    headline: "The most interesting thing isn't what it does. It's how it decides what to target.",
    subline:
      'Molecular hydrogen is the only antioxidant known to selectively neutralise only the most damaging free radicals — leaving beneficial reactive oxygen species intact.',
    primaryCta: { label: 'Read the research case', href: '/product?persona=longevity' },
    secondaryCta: { label: 'See the studies', href: '/science/longevity' },
  },
  problem: {
    headline: 'The oxidative stress hypothesis.',
    body: [
      'Oxidative stress is one of the most studied drivers of cellular ageing. The free radicals that accumulate with age — particularly hydroxyl radicals — damage DNA, impair mitochondrial function, and drive the inflammation associated with neurodegeneration, cardiovascular disease, and metabolic decline. Most antioxidant interventions are blunt instruments. They neutralise indiscriminately, including the reactive oxygen species the body uses for beneficial signalling.',
    ],
  },
  mechanism: {
    application:
      "The Nrf2 pathway — one of the body's primary antioxidant defence systems — appears to be activated by molecular hydrogen in several studies, suggesting the effects may extend beyond direct radical neutralisation. Research into H\u2082 spans neurodegeneration, cardiovascular function, metabolic health, and mitochondrial ageing. The selectivity of the mechanism is particularly relevant here: interventions that reduce all ROS may interfere with cell signalling; H\u2082's selectivity means it may support cellular repair processes without this trade-off.",
  },
  session: {
    headline: 'Twenty minutes, once daily. A long-term practice.',
    body: "Twenty minutes, once daily. The device runs quietly — most users read or work alongside it. The longevity case for hydrogen is built on consistent, long-term use rather than acute effects. It's an investment in the daily oxidative environment, not a single intervention.",
  },
  device: {
    leadSpec: 'membrane',
    leadLine: 'PEM/SPE electrolysis, not alkaline. The difference in hydrogen purity is not marginal.',
    ctaLabel: 'Read the research case',
  },
  cta: {
    headline: "The research is there. The question is whether you're ready to act on it.",
    body: "We're taking pre-launch enquiries from people who've done their homework. If that's you, we'd like to hear from you.",
    primaryCta: { label: 'Enquire about the device', href: '/product?persona=longevity' },
  },
  faqs: [
    {
      question: 'How much of this evidence is from animals versus humans?',
      answer:
        'The longevity-relevant evidence is a mixture. The foundational mechanism study (Ohsawa, Nature Medicine, 2007) used animal models. The HYBRID II trial (Lancet, 2023) is a multi-centre human RCT. The ROS reduction study (2024) is human. We categorise all study cards on the Science Hub clearly — Human RCT, Human, Animal, Meta-analysis — so you can weigh the evidence yourself.',
    },
    {
      question: 'How does this compare to NAD+ precursors, NMN, or other longevity supplements?',
      answer:
        "Different mechanisms entirely. NAD+ precursors focus on the NAD+/NADH ratio and sirtuin activation. Molecular hydrogen targets reactive oxygen species directly and may activate the Nrf2 pathway. The research into H\u2082 and longevity is distinct from supplement-based approaches and, in some respects, more directly evidenced in human populations. They're not comparable interventions — they target different aspects of cellular ageing.",
    },
    {
      question: 'What is PEM electrolysis and why does it matter?',
      answer:
        'PEM (Proton Exchange Membrane) technology produces hydrogen through water electrolysis at a higher purity than alkaline electrolysis alternatives. 99.99% hydrogen purity means 0.01% impurities — important if you\'re making a daily wellness practice of inhalation. Alkaline electrolysis systems can produce ozone and chlorine as byproducts. The H2 Revive device uses PEM/SPE membrane technology exclusively.',
    },
    {
      question: 'What is the Nrf2 connection?',
      answer:
        "Nrf2 is one of the body's primary antioxidant defence transcription factors — it regulates the expression of enzymes that neutralise oxidative stress. Several studies have observed Nrf2 pathway activation in response to molecular hydrogen, suggesting H\u2082 may do more than directly neutralise free radicals — it may upregulate the body's own defence mechanisms. This is an active area of research; the evidence is promising but not yet definitive.",
    },
    {
      question: 'Is this a long-term investment or an acute intervention?',
      answer:
        'The longevity case is long-term. The mechanism involves reducing cumulative oxidative stress — a variable that matters over years and decades, not days. That said, the 2024 ROS reduction RCT documented measurable effects in a single session. Our recommendation: treat it as a daily practice with a long investment horizon, not a short-term protocol.',
    },
  ],
  studies: [
    {
      title: 'HYBRID II: hydrogen inhalation in cardiac arrest recovery',
      citation: 'Lancet eClinicalMedicine, 2023',
      evidenceLevel: 'Strong',
      studyType: 'Human RCT',
      summary:
        'The HYBRID II multi-centre randomised controlled trial — published in The Lancet — found that hydrogen inhalation was associated with a 46% rate of full neurological recovery compared to 21% in controls following cardiac arrest. This is the highest-profile human RCT in the hydrogen research literature.',
      doiUrl: null,
      pubmedUrl: null,
    },
    {
      title: 'Selective antioxidant mechanism of molecular hydrogen',
      citation: 'Ohsawa et al., Nature Medicine, 2007',
      evidenceLevel: 'Strong',
      studyType: 'Animal',
      summary:
        "The landmark study establishing molecular hydrogen's selective antioxidant mechanism. The finding that H\u2082 neutralises only the most damaging free radicals — not beneficial ROS — is the mechanistic foundation underlying the longevity research that followed.",
      doiUrl: 'https://doi.org/10.1038/nm1577',
      pubmedUrl: null,
    },
    {
      title: 'Acute blood ROS reduction following hydrogen inhalation',
      citation: 'Free Radical Biology & Medicine, 2024',
      evidenceLevel: 'Moderate',
      studyType: 'Human RCT',
      summary:
        'Measurable reductions in blood reactive oxygen species following a single hydrogen inhalation session, with effects maintained at 24 hours, were documented in this randomised controlled trial — directly relevant to the oxidative stress hypothesis of cellular ageing.',
      doiUrl: null,
      pubmedUrl: null,
    },
  ],
  scienceLink: {
    label: 'The full longevity research',
    href: '/science/longevity',
  },
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const PERSONA_PAGE_CONTENT: Record<Persona, PersonaPageContent> = {
  energy: energyContent,
  performance: performanceContent,
  longevity: longevityContent,
}
