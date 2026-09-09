import type { AuthorshipPublicCertificate } from './types';

export interface AuthorshipSeoData {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  isIndexable: boolean;
  jsonLd: Record<string, any>[];
}

/**
 * Builds compliant, safe SEO metadata and JSON-LD structured data for public certificates.
 * SECURITY: Never includes private manuscript body or sensitive creator PII.
 */
export function buildAuthorshipSeo(
  cert: AuthorshipPublicCertificate,
  origin = 'https://www.aidetector.cx'
): AuthorshipSeoData {
  const authorName = cert.collaborators?.[0]?.name || 'Attested Creator';
  const trackingCode = cert.trackingCode;
  const canonicalUrl = `${origin}/verify/${trackingCode}`;
  
  // Format safe title
  const title = `Authorship Verification: ${cert.title} by ${authorName} | AIDetector.cx`;
  
  // Safe description using only public certificate metadata
  const description = `Cryptographically verified authorship record for "${cert.title}" by ${authorName}. Tracking code ${trackingCode}. Registered on AIDetector.cx with verified AI and originality screening.`;

  // Indexing rules: Index only active, non-disputed, non-revoked public certificates
  const isIndexable = cert.status === 'active';

  // Open Graph preview image (points to public OG badge generator)
  const ogImage = `${origin}/api/v1/authorship/${trackingCode}/og-image.png`;

  // JSON-LD Structured Data: CreativeWork + Person + Organization + BreadcrumbList
  const creativeWorkJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': canonicalUrl,
    name: cert.title,
    headline: cert.title,
    description: cert.subtitle || description,
    inLanguage: cert.language || 'en',
    datePublished: cert.createdAt,
    dateModified: cert.createdAt,
    identifier: trackingCode,
    url: canonicalUrl,
    author: {
      '@type': 'Person',
      name: authorName,
      url: cert.publishedUrl || canonicalUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AIDetector.cx Verified Authorship Authority',
      url: origin,
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/logo.png`,
      },
    },
    accessMode: ['textual'],
    accessibilityFeature: ['structuralNavigation'],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: origin,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Verified Authorship',
        item: `${origin}/authorship`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cert.title,
        item: canonicalUrl,
      },
    ],
  };

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'article',
    ogTitle: title,
    ogDescription: description,
    ogImage,
    twitterCard: 'summary_large_image',
    isIndexable,
    jsonLd: [creativeWorkJsonLd, breadcrumbJsonLd],
  };
}
