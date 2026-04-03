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
          headline:   { label: 'Headline',   hint: 'H1 · primary SEO title',      multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',   multiline: false, required: true },
          body:       { label: 'Body',       hint: 'paragraph · GEO context',     multiline: true,  required: true },
          cta_text:   { label: 'CTA text',   hint: 'button label',                multiline: false, required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 900], mobileDimensions: [800, 1000], maxFileSizeKb: 400 },
        videoType: 'ambient',
        lazyLoadDefault: false,
      },
      features: {
        label: 'Features',
        contentType: 'body',
        fields: {
          headline: { label: 'Section headline', hint: 'H2 · section anchor',     multiline: false, required: true },
          body:     { label: 'Body',             hint: 'paragraph · GEO context', multiline: true,  required: true },
        },
        imageGuidelines: { desktopDimensions: [800, 600], mobileDimensions: [600, 500], maxFileSizeKb: 250 },
      },
      'social-proof': {
        label: 'Social proof',
        contentType: 'testimonial',
        fields: {
          quote:       { label: 'Quote',       hint: 'user testimonial · GEO trust signal', multiline: true,  required: true },
          attribution: { label: 'Attribution', hint: 'name and context',                    multiline: false, required: true },
        },
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
          headline:   { label: 'Headline',   hint: 'H1 · science hub SEO title',  multiline: false, required: true },
          subheading: { label: 'Subheading', hint: 'H2 · supports GEO snippet',   multiline: false, required: true },
          body:       { label: 'Body',       hint: 'paragraph · intro context',   multiline: true,  required: true },
        },
        imageGuidelines: { desktopDimensions: [1400, 700], mobileDimensions: [800, 800], maxFileSizeKb: 350 },
        lazyLoadDefault: false,
      },
      intro: {
        label: 'Introduction',
        contentType: 'body',
        fields: {
          headline: { label: 'Headline', hint: 'H2 · section anchor',            multiline: false, required: true },
          body:     { label: 'Body',     hint: 'paragraph · GEO answer target',  multiline: true,  required: true },
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
