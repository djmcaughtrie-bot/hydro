export type ModelKey = 'pulse' | 'flow' | 'clinical'

export interface ProductModel {
  key: ModelKey
  name: string
  tagline: string
  description: string
  flowRate: number
  settings: string[]
  price: number
  weight: string
  noise: string
  runtime: string
  continuous: boolean
  dimensions: string
  lifespan: string
  badge: string | null
  badgeStyle: string
}

export const MODELS: Record<ModelKey, ProductModel> = {
  pulse: {
    key: 'pulse',
    name: 'H2 Revive Pulse',
    tagline: 'Daily home use. A serious entry point.',
    description:
      'The Pulse delivers 1,200\u00a0ml/min at full output \u2014 more than eight times the delivery rate of typical home devices. Three output settings let you start low and build a consistent practice.',
    flowRate: 1200,
    settings: ['450\u00a0ml/min', '900\u00a0ml/min', '1,200\u00a0ml/min'],
    price: 1950,
    weight: '9.8\u00a0kg',
    noise: '20\u00a0dB',
    runtime: '8\u00a0hours',
    continuous: false,
    dimensions: '22\u00a0\u00d7\u00a042\u00a0\u00d7\u00a042\u00a0cm',
    lifespan: '10,000\u00a0hours',
    badge: null,
    badgeStyle: '',
  },
  flow: {
    key: 'flow',
    name: 'H2 Revive Flow',
    tagline: 'The serious choice for daily practice.',
    description:
      'The Flow delivers 1,500\u00a0ml/min \u2014 the output range most referenced in the clinical research we cite. Quieter than a whisper at 20\u00a0dB. Designed for daily 20\u201360 minute sessions.',
    flowRate: 1500,
    settings: ['450\u00a0ml/min', '900\u00a0ml/min', '1,500\u00a0ml/min'],
    price: 2450,
    weight: '9.4\u00a0kg',
    noise: '20\u00a0dB',
    runtime: '8\u00a0hours',
    continuous: false,
    dimensions: '21\u00a0\u00d7\u00a043\u00a0\u00d7\u00a043\u00a0cm',
    lifespan: '10,000\u00a0hours',
    badge: 'Most popular',
    badgeStyle: 'bg-teal text-white',
  },
  clinical: {
    key: 'clinical',
    name: 'H2 Revive Clinical',
    tagline: 'For clinics and continuous professional use.',
    description:
      'The Clinical is built for continuous operation \u2014 24\u00a0hours, 3,000\u00a0ml/min, dual output. Designed for clinic environments where multiple sessions run back to back.',
    flowRate: 3000,
    settings: ['1,500\u00a0ml/min', '3,000\u00a0ml/min'],
    price: 4500,
    weight: '30\u00a0kg',
    noise: '35\u00a0dB',
    runtime: '24\u00a0hours (continuous)',
    continuous: true,
    dimensions: '28\u00a0\u00d7\u00a058\u00a0\u00d7\u00a058\u00a0cm',
    lifespan: '10,000\u00a0hours',
    badge: 'Professional',
    badgeStyle: 'bg-ink text-white',
  },
}

export const MODEL_KEYS: ModelKey[] = ['pulse', 'flow', 'clinical']
