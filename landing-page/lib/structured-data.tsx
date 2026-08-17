import Script from 'next/script'

const BASE_URL = 'https://aidetector.cx'
const PATH = '/algorithmic-updates'
const FULL_URL = `${BASE_URL}${PATH}`
const PUBLISHED = '2026-08-01T08:00:00+00:00'
const MODIFIED = '2026-08-01T08:00:00+00:00'
const TITLE = 'Algorithmic Updates: How Search Engine Algorithms Treat AI Content'
const DESCRIPTION =
  'Learn how Google and Bing evaluate AI content, what algorithm updates mean for publishers, and how to create AI-assisted content that ranks.'

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: TITLE,
  description: DESCRIPTION,
  image: `${FULL_URL}/og-image.jpg`,
  author: {
    '@type': 'Organization',
    name: 'AIDetector.cx Editorial Team',
    url: BASE_URL,
  },
  publisher: {
    '@type': 'Organization',
    name: 'AIDetector.cx',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
  },
  datePublished: PUBLISHED,
  dateModified: MODIFIED,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': FULL_URL,
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AIDetector.cx',
  url: BASE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  sameAs: [
    'https://twitter.com/aidetector',
    'https://www.linkedin.com/company/aidetector',
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: BASE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Algorithmic Updates',
      item: FULL_URL,
    },
  ],
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Does Google penalize AI content?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No. Google does not penalize content simply because it was written with AI. It penalizes low-quality, misleading, or spammy content regardless of how it was produced. The key is satisfying user intent and demonstrating E-E-A-T.",
      },
    },
    {
      '@type': 'Question',
      name: 'Can AI articles rank first?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, AI-assisted articles can rank highly when they are original, well-researched, fact-checked, and provide genuine value. The production method is less important than the quality and usefulness of the final content.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can I make AI content SEO friendly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Focus on original research, expert review, accurate citations, clear structure, helpful formatting, fast page speed, and satisfying search intent. Treat AI as a drafting assistant, not the final publisher.',
      },
    },
    {
      '@type': 'Question',
      name: 'Should every AI article be edited?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Human editing is essential to catch factual errors, add expertise, improve tone, verify citations, and ensure the content reflects real-world experience.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does E-E-A-T apply to AI content?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Experience, Expertise, Authoritativeness, and Trustworthiness apply to all content, including AI-assisted content. The presence of a human author, editor, or expert reviewer strengthens E-E-A-T signals.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Bing treat AI content?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Bing evaluates content based on quality, relevance, and trust. It does not ban AI-generated content but rewards authoritative, accurate, and helpful pages that demonstrate genuine expertise.',
      },
    },
  ],
}

export function StructuredData() {
  const data = [articleSchema, organizationSchema, breadcrumbSchema, faqSchema]
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  )
}
