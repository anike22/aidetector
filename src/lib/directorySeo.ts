import type { DirectoryProduct } from '@/types/directory';

export function generateDirectoryItemListSchema(products: DirectoryProduct[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Tools & Software Directory',
    description: 'Comprehensive, verified directory of AI writing, coding, detection, and productivity tools with objective editorial assessments.',
    itemListElement: products.slice(0, 30).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: product.name,
        description: product.summary || product.description,
        applicationCategory: product.primaryCategory,
        operatingSystem: product.platforms.join(', '),
        offers: {
          '@type': 'Offer',
          price: product.hasFreePlan ? '0' : undefined,
          priceCurrency: 'USD',
          category: product.pricingModel,
        },
        url: `https://www.aidetector.cx/tools/${product.id}`,
      },
    })),
  };
}

export function generateProductDetailSchema(product: DirectoryProduct) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.description,
    applicationCategory: product.primaryCategory,
    operatingSystem: product.platforms.join(', '),
    url: `https://www.aidetector.cx/tools/${product.id}`,
    offers: {
      '@type': 'Offer',
      price: product.hasFreePlan ? '0' : undefined,
      priceCurrency: 'USD',
      category: product.pricingModel,
      description: product.pricingSummary,
    },
  };

  // Only include first-party editorial review if present
  if (product.editorialAssessment?.rating) {
    schema.review = {
      '@type': 'Review',
      author: {
        '@type': 'Organization',
        name: 'AIDetector.cx Editorial Staff',
        url: 'https://www.aidetector.cx',
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: product.editorialAssessment.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: product.editorialAssessment.summary,
      positiveNotes: product.editorialAssessment.pros
        ? {
            '@type': 'ItemList',
            itemListElement: product.editorialAssessment.pros.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: p,
            })),
          }
        : undefined,
      negativeNotes: product.editorialAssessment.cons
        ? {
            '@type': 'ItemList',
            itemListElement: product.editorialAssessment.cons.map((c, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: c,
            })),
          }
        : undefined,
    };
  }

  // Calculate legitimate first-party AggregateRating ONLY when verified user reviews exist
  const approvedUserReviews = (product.userReviews || []).filter(
    r => r.moderationStatus === 'approved' || !r.moderationStatus
  );

  if (approvedUserReviews.length > 0) {
    const totalScore = approvedUserReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgScore = Number((totalScore / approvedUserReviews.length).toFixed(1));

    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgScore,
      reviewCount: approvedUserReviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function generateProductMeta(product: DirectoryProduct) {
  const title = `${product.name} Review: Features, Pricing, Pros & Cons | AIDetector.cx`;
  const description = `In-depth review of ${product.name} covering verified pricing tiers, core capabilities, real-world benchmarks, pros, cons, and genuine user reviews.`;
  const canonicalUrl = `https://www.aidetector.cx/tools/${product.id}`;

  return {
    title,
    description,
    canonicalUrl,
    openGraph: {
      title: `${product.name} Review | AIDetector.cx`,
      description,
      url: canonicalUrl,
      type: 'article',
      siteName: 'AIDetector.cx',
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
