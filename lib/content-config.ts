export type ContentType = 'headline' | 'body' | 'faq-item' | 'testimonial' | 'cta'

export interface FieldMeta {
  label: string
  hint: string
  multiline: boolean
  required: boolean
}

export interface ImageGuidelines {
  desktopDimensions: [number, number]
  mobileDimensions: [number, number]
  maxFileSizeKb: number
}

export interface SectionConfig {
  label: string
  contentType: ContentType
  fields: Record<string, FieldMeta>
  imageGuidelines?: ImageGuidelines
  videoType?: 'ambient' | 'content'  // undefined = no video (same as null in spec; ? is idiomatic TS)
  lazyLoadDefault?: boolean
}

export interface PageConfig {
  label: string
  sections: Record<string, SectionConfig>
}

export const CONTENT_CONFIG = {
  homepage: {
    label: 'Homepage',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:            { label: 'Headline',              hint: 'H1 · primary SEO title',        multiline: false, required: true  },
          subheading:          { label: 'Subheading',            hint: 'H2 · supports GEO snippet',     multiline: false, required: false },
          body:                { label: 'Body',                  hint: 'paragraph · GEO context',       multiline: true,  required: true  },
          cta_text:            { label: 'Primary CTA label',     hint: 'main button text',              multiline: false, required: true  },
          cta_url:             { label: 'Primary CTA link',      hint: 'e.g. /product or /product?persona=energy', multiline: false, required: true  },
          cta_secondary_text:  { label: 'Secondary CTA label',   hint: 'second button text',            multiline: false, required: false },
          cta_secondary_url:   { label: 'Secondary CTA link',    hint: 'e.g. /science',                 multiline: false, required: false },
        },
        imageGuidelines: { desktopDimensions: [1400, 900], mobileDimensions: [800, 1000], maxFileSizeKb: 400 },
        videoType: 'ambient',
        lazyLoadDefault: false,
      },
      features: {
        label: 'Science teaser',
        contentType: 'body',
        fields: {
          headline: { label: 'Section headline', hint: 'H2 · section anchor',     multiline: false, required: true  },
          body:     { label: 'Body',             hint: 'paragraph · GEO context', multiline: true,  required: true  },
          cta_text: { label: 'CTA label',        hint: 'link text',               multiline: false, required: false },
          cta_url:  { label: 'CTA link',         hint: 'e.g. /science',           multiline: false, required: false },
        },
      },
      'social-proof': {
        label: 'CEO intro',
        contentType: 'testimonial',
        fields: {
          quote:       { label: 'Quote',       hint: 'CEO quote · no quotation marks needed',  multiline: true,  required: true  },
          attribution: { label: 'Attribution', hint: 'name and title',                         multiline: false, required: false },
          cta_text:    { label: 'CTA label',   hint: 'link text e.g. Our story',               multiline: false, required: false },
          cta_url:     { label: 'CTA link',    hint: 'e.g. /about',                            multiline: false, required: false },
        },
        imageGuidelines: { desktopDimensions: [400, 400], mobileDimensions: [300, 300], maxFileSizeKb: 150 },
      },
      'trust-bar': {
        label: 'Trust bar',
        contentType: 'body',
        fields: {
          item1_label:       { label: 'Item 1 label',       hint: 'e.g. 1,000+ peer-reviewed studies', multiline: false, required: true  },
          item1_description: { label: 'Item 1 description', hint: 'e.g. Research-backed',              multiline: false, required: false },
          item2_label:       { label: 'Item 2 label',       hint: 'e.g. UK-based',                     multiline: false, required: true  },
          item2_description: { label: 'Item 2 description', hint: 'e.g. Designed and supported in Britain', multiline: false, required: false },
          item3_label:       { label: 'Item 3 label',       hint: 'e.g. 2-year warranty',              multiline: false, required: true  },
          item3_description: { label: 'Item 3 description', hint: 'e.g. Full UK coverage',             multiline: false, required: false },
          item4_label:       { label: 'Item 4 label',       hint: 'e.g. CE certified',                 multiline: false, required: true  },
          item4_description: { label: 'Item 4 description', hint: 'e.g. Safety certified',             multiline: false, required: false },
        },
      },
      'persona-cards': {
        label: 'Persona cards',
        contentType: 'body',
        fields: {
          energy_copy:      { label: 'Energy card copy',      hint: 'first-person · e.g. I want more energy and mental clarity', multiline: false, required: true },
          performance_copy: { label: 'Performance card copy', hint: 'first-person · e.g. I train hard and want to recover better', multiline: false, required: true },
          longevity_copy:   { label: 'Longevity card copy',   hint: "first-person · e.g. I'm investing in long-term health and longevity", multiline: false, required: true },
        },
      },
      'device-cta': {
        label: 'Device CTA',
        contentType: 'cta',
        fields: {
          headline: { label: 'Headline', hint: 'H2 · dark section',      multiline: false, required: true  },
          body:     { label: 'Body',     hint: 'supporting detail',       multiline: true,  required: false },
          cta_text: { label: 'CTA label', hint: 'button text',           multiline: false, required: true  },
          cta_url:  { label: 'CTA link',  hint: 'e.g. /product',         multiline: false, required: true  },
        },
        imageGuidelines: { desktopDimensions: [800, 1000], mobileDimensions: [600, 750], maxFileSizeKb: 300 },
      },
      faq: {
        label: 'FAQ',
        contentType: 'faq-item',
        fields: {
          question: { label: 'Question', hint: 'FAQ schema · voice search target',  multiline: false, required: true },
          answer:   { label: 'Answer',   hint: 'paragraph · GEO answer target',     multiline: true,  required: true },
        },
      },
    },
  },
  product: {
    label: 'Product',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:   { label: 'Headline',   hint: 'H1 · product page SEO title', multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',   multiline: false, required: true },
          body:       { label: 'Body',       hint: 'paragraph · GEO context',     multiline: true,  required: true },
          cta_text:   { label: 'CTA text',   hint: 'enquiry button label',        multiline: false, required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 900], mobileDimensions: [800, 1000], maxFileSizeKb: 400 },
        lazyLoadDefault: false,
      },
      features: {
        label: 'Features',
        contentType: 'body',
        fields: {
          headline: { label: 'Feature headline', hint: 'H3 · feature name',        multiline: false, required: true },
          body:     { label: 'Feature body',     hint: 'paragraph · GEO context',  multiline: true,  required: true },
        },
        imageGuidelines: { desktopDimensions: [700, 500], mobileDimensions: [600, 450], maxFileSizeKb: 200 },
      },
      'how-it-works': {
        label: 'How it works',
        contentType: 'body',
        fields: {
          headline: { label: 'Step headline', hint: 'H3 · step name',              multiline: false, required: true },
          body:     { label: 'Step body',     hint: 'paragraph · process context', multiline: true,  required: true },
        },
        videoType: 'content',
      },
      cta: {
        label: 'Enquiry CTA',
        contentType: 'cta',
        fields: {
          headline:   { label: 'CTA headline', hint: 'H2 · conversion anchor',    multiline: false, required: true },
          subheading: { label: 'Subheading',   hint: 'supporting context',        multiline: false, required: false },
          cta_text:   { label: 'Button text',  hint: 'enquiry button label',      multiline: false, required: true },
        },
      },
    },
  },
  science: {
    label: 'Science Hub',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline: { label: 'Headline', hint: 'H1 · science hub SEO title',  multiline: false, required: true },
          body:     { label: 'Body',     hint: 'paragraph · intro context',   multiline: true,  required: true },
        },
      },
      mechanism: {
        label: 'The Mechanism',
        contentType: 'body',
        fields: {
          headline:   { label: 'Headline',        hint: 'H2 · mechanism anchor',         multiline: false, required: true  },
          body:       { label: 'Body',            hint: 'paragraph · GEO answer target', multiline: true,  required: true  },
          study_text: { label: 'Study link text', hint: 'e.g. A 2007 study in Nature Medicine by Ohsawa et al.', multiline: false, required: false },
          study_url:  { label: 'Study link URL',  hint: 'DOI or PubMed URL',             multiline: false, required: false },
        },
      },
      cta: {
        label: 'Bottom CTA',
        contentType: 'cta',
        fields: {
          headline: { label: 'Headline', hint: 'H2 · dark section',  multiline: false, required: true  },
          cta_text: { label: 'CTA label', hint: 'button text',       multiline: false, required: true  },
          cta_url:  { label: 'CTA link',  hint: 'e.g. /product',     multiline: false, required: true  },
        },
      },
    },
  },
  about: {
    label: 'About',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:   { label: 'Headline',   hint: 'H1 · about page SEO title',  multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',  multiline: false, required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 800], mobileDimensions: [800, 900], maxFileSizeKb: 350 },
        lazyLoadDefault: false,
      },
      'ceo-story': {
        label: 'CEO story',
        contentType: 'body',
        fields: {
          headline: { label: 'Section headline', hint: 'H2 · narrative anchor',   multiline: false, required: true },
          body:     { label: 'Story body',       hint: 'long-form · GEO context', multiline: true,  required: true },
        },
        imageGuidelines: { desktopDimensions: [700, 900], mobileDimensions: [600, 700], maxFileSizeKb: 250 },
      },
    },
  },
  clinics: {
    label: 'Clinics',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:   { label: 'Headline',   hint: 'H1 · B2B SEO title',         multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',  multiline: false, required: true },
          body:       { label: 'Body',       hint: 'paragraph · B2B context',    multiline: true,  required: true },
          cta_text:   { label: 'CTA text',   hint: 'enquiry button label',       multiline: false, required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 900], mobileDimensions: [800, 1000], maxFileSizeKb: 400 },
        lazyLoadDefault: false,
      },
      benefits: {
        label: 'Benefits',
        contentType: 'body',
        fields: {
          headline: { label: 'Benefit headline', hint: 'H3 · benefit name',      multiline: false, required: true },
          body:     { label: 'Benefit body',     hint: 'paragraph · GEO context',multiline: true,  required: true },
        },
      },
      cta: {
        label: 'Clinic CTA',
        contentType: 'cta',
        fields: {
          headline:   { label: 'CTA headline', hint: 'H2 · conversion anchor',   multiline: false, required: true },
          subheading: { label: 'Subheading',   hint: 'supporting context',       multiline: false, required: false },
          cta_text:   { label: 'Button text',  hint: 'enquiry button label',     multiline: false, required: true },
        },
      },
    },
  },
  faq: {
    label: 'FAQ',
    sections: {
      hero: {
        label: 'Hero',
        contentType: 'headline',
        fields: {
          headline:   { label: 'Headline',   hint: 'H1 · FAQ page SEO title',    multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',  multiline: false, required: true },
        },
        lazyLoadDefault: false,
      },
      item: {
        label: 'FAQ item',
        contentType: 'faq-item',
        fields: {
          question: { label: 'Question', hint: 'FAQ schema · voice search target', multiline: false, required: true },
          answer:   { label: 'Answer',   hint: 'paragraph · GEO answer target',   multiline: true,  required: true },
        },
      },
    },
  },
} satisfies Record<string, PageConfig>
