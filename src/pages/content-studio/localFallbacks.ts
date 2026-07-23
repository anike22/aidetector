/**
 * Local (deterministic) fallback generators for every Content Studio step.
 * Used when the AI edge function is unavailable or returns an error.
 * All functions are pure and produce reasonable placeholder data.
 */

import type {
  OutlineSection, ArticleSection, FAQItem, SEOAssets,
} from './types';

// ─── Seeded "random" ────────────────────────────────────────────────────────
function seed(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pick<T>(arr: T[], s: number, offset = 0): T {
  return arr[(s + offset) % arr.length];
}

// ─── Step 2: SERP analysis ───────────────────────────────────────────────────

export function localSERPFallback(keyword: string) {
  const kw = keyword.toLowerCase();
  const s = seed(kw);

  const headingTemplates = [
    `What Is ${keyword}? A Complete Guide`,
    `Top 10 Ways to Use ${keyword} Effectively`,
    `${keyword}: Benefits, Risks, and Best Practices`,
    `How to Get Started with ${keyword}`,
    `The Ultimate ${keyword} Checklist`,
    `${keyword} vs Traditional Approaches: Key Differences`,
    `Expert Tips for ${keyword} in 2025`,
    `Common ${keyword} Mistakes to Avoid`,
    `${keyword} for Beginners: Everything You Need to Know`,
    `Advanced ${keyword} Strategies That Actually Work`,
  ];

  const coveredTopicTemplates = [
    `Definition and overview of ${keyword}`,
    `Key benefits of ${keyword}`,
    `How ${keyword} works step-by-step`,
    `Best tools for ${keyword}`,
    `${keyword} use cases and examples`,
    `Getting started with ${keyword}`,
    `Common challenges with ${keyword}`,
    `${keyword} pricing and cost`,
  ];

  const gapTopicTemplates = [
    `${keyword} for enterprise teams`,
    `Integrating ${keyword} with existing workflows`,
    `Measuring ROI from ${keyword}`,
    `${keyword} compliance and security`,
    `Future of ${keyword} in the industry`,
    `${keyword} case studies and success stories`,
  ];

  return {
    serpHeadings: headingTemplates.map((t, i) =>
      i < 5 ? t : pick(headingTemplates, s, i)
    ).slice(0, 10),
    coveredTopics: coveredTopicTemplates.map((topic, i) => ({
      topic,
      covered: true,
      isGap: false,
      selected: true,
    })),
    gapTopics: gapTopicTemplates.map((topic) => ({
      topic,
      covered: false,
      isGap: true,
      selected: true,
    })),
  };
}

// ─── Step 3: Content brief ───────────────────────────────────────────────────

export function localBriefFallback(keyword: string, intent: string, wordCount: number) {
  const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const intentPhrases: Record<string, string> = {
    Informational: 'Complete Guide to',
    Commercial: 'Best',
    Transactional: 'How to Get',
    Navigational: 'About',
  };
  const prefix = intentPhrases[intent] || 'Guide to';

  return {
    title: `${prefix} ${keyword}: Everything You Need to Know`,
    metaTitle: `${prefix} ${keyword} (${new Date().getFullYear()} Guide)`.slice(0, 60),
    metaDescription: `Discover the complete guide to ${keyword}. Learn best practices, tips, and strategies to succeed. Approx. ${wordCount} words of expert insights.`.slice(0, 160),
    slug,
  };
}

// ─── Step 4: Article outline ─────────────────────────────────────────────────

export function localOutlineFallback(
  keyword: string,
  topics: string[],
  intent: string,
): OutlineSection[] {
  const topTopics = topics.slice(0, 4);
  const uid = (suffix: string) => `local-${seed(keyword + suffix)}`;

  const sections: OutlineSection[] = [
    {
      id: uid('intro'),
      type: 'intro',
      text: `Introduction to ${keyword}`,
      children: [],
    },
    {
      id: uid('h2-1'),
      type: 'h2',
      text: `What Is ${keyword}? A Comprehensive Overview`,
      children: [
        { id: uid('h3-1a'), type: 'h3', text: `Definition and key concepts`, children: [] },
        { id: uid('h3-1b'), type: 'h3', text: `Why ${keyword} matters today`, children: [] },
      ],
    },
    ...topTopics.slice(0, 2).map((topic, i) => ({
      id: uid(`h2-${i + 2}`),
      type: 'h2' as const,
      text: topic,
      children: [
        { id: uid(`h3-${i + 2}a`), type: 'h3' as const, text: `Key aspects of ${topic.toLowerCase()}`, children: [] },
      ],
    })),
    {
      id: uid('h2-best'),
      type: 'h2',
      text: `Best Practices for ${keyword}`,
      children: [
        { id: uid('h3-best-a'), type: 'h3', text: `Getting started quickly`, children: [] },
        { id: uid('h3-best-b'), type: 'h3', text: `Advanced tips and strategies`, children: [] },
      ],
    },
    {
      id: uid('faq'),
      type: 'faq',
      text: `Frequently Asked Questions about ${keyword}`,
      children: [],
    },
    {
      id: uid('conclusion'),
      type: 'conclusion',
      text: `Conclusion: Key Takeaways on ${keyword}`,
      children: [],
    },
  ];

  return sections;
}

// ─── Step 6: Article section content ────────────────────────────────────────

export function localSectionContent(heading: string, keyword: string, type: string): string {
  if (type === 'intro') {
    return `In today's rapidly evolving landscape, ${keyword} has become increasingly important for professionals and businesses alike. This comprehensive guide explores everything you need to know about ${keyword}, from foundational concepts to advanced strategies.\n\nWhether you're just getting started or looking to deepen your expertise, this article provides actionable insights based on current best practices.`;
  }
  if (type === 'conclusion') {
    return `Understanding ${keyword} is essential for staying competitive in the modern environment. By applying the strategies and best practices outlined in this guide, you can effectively leverage ${keyword} to achieve your goals.\n\nStart implementing these insights today and track your progress over time. For more resources on ${keyword}, explore our related articles and tools.`;
  }
  if (type === 'faq') {
    return `This section addresses the most common questions about ${keyword} based on what users frequently search for online.`;
  }
  return `${heading} is a critical component of any successful ${keyword} strategy. Understanding this aspect helps you make better decisions and achieve more consistent results.\n\nKey considerations for ${heading.toLowerCase()} include:\n\n• **Establishing clear objectives** — Define what success looks like before diving in\n• **Using proven methodologies** — Rely on tested approaches rather than guesswork\n• **Measuring outcomes** — Track relevant metrics to validate your efforts\n• **Iterating based on data** — Continuously refine your approach\n\nBy focusing on these principles, you can maximise the impact of your efforts related to ${keyword}.`;
}

export function localArticleSectionsFallback(
  outline: { id: string; heading: string; type: string }[],
  keyword: string,
): ArticleSection[] {
  return outline.map((item) => ({
    id: item.id,
    heading: item.heading,
    content: localSectionContent(item.heading, keyword, item.type),
    accepted: false,
  }));
}

// ─── Step 7: Humanization ────────────────────────────────────────────────────

export function localHumanizationFallback(content: string): string {
  // Simple text transformations to make content feel less robotic
  return content
    .replace(/\bIn conclusion,\b/g, "To wrap up,")
    .replace(/\bFurthermore,\b/g, "On top of that,")
    .replace(/\bMoreover,\b/g, "What's more,")
    .replace(/\bIt is important to note that\b/gi, "Keep in mind that")
    .replace(/\bIn order to\b/gi, "To")
    .replace(/\bUtilize\b/gi, "Use")
    .replace(/\bImplement\b/gi, "Apply")
    .replace(/\bLeverage\b/gi, "Make use of");
}

// ─── Step 8: SEO keyword density ────────────────────────────────────────────

export function localKeywordDensityFallback(content: string, keywords: string[]) {
  const words = content.toLowerCase().split(/\W+/).filter(Boolean);
  const totalWords = words.length || 1;

  return keywords.slice(0, 8).map((kw) => {
    const kwLower = kw.toLowerCase();
    const count = words.filter((w) => w === kwLower).length +
      (content.toLowerCase().split(kwLower).length - 1);
    const density = parseFloat(((count / totalWords) * 100).toFixed(2));
    const target = kw === keywords[0] ? 1.5 : 0.8;
    return {
      keyword: kw,
      count,
      density,
      target,
      status: density >= target * 0.5 && density <= target * 2 ? 'ok' : density < target * 0.5 ? 'low' : 'high',
    };
  });
}

// ─── Step 9: Internal links ───────────────────────────────────────────────────

export function localInternalLinksFallback(keyword: string, _content: string) {
  const kw = keyword.toLowerCase();
  return [
    {
      anchorText: `AI detection tools`,
      url: '/tools',
      reason: `Link from relevant mention of tools in the article`,
    },
    {
      anchorText: `${keyword} guide`,
      url: `/blog/${kw.replace(/\s+/g, '-')}`,
      reason: `Self-referencing canonical link for topical authority`,
    },
    {
      anchorText: `content studio`,
      url: '/content-studio',
      reason: `Mention of content creation workflow`,
    },
    {
      anchorText: `SEO best practices`,
      url: '/seo-assistant',
      reason: `Reference to SEO strategy and optimisation`,
    },
    {
      anchorText: `community discussion`,
      url: '/community',
      reason: `Mention of expert tips or community insights`,
    },
  ];
}

// ─── Step 10: FAQ ────────────────────────────────────────────────────────────

export function localFAQFallback(keyword: string): FAQItem[] {
  const uid = (n: number) => `faq-local-${seed(keyword + n)}`;
  return [
    {
      id: uid(1),
      question: `What is ${keyword}?`,
      answer: `${keyword} refers to a set of techniques and tools used to ${keyword.toLowerCase()} more effectively. It encompasses best practices for achieving consistent results and improving outcomes.`,
      keep: true,
    },
    {
      id: uid(2),
      question: `How does ${keyword} work?`,
      answer: `${keyword} works by analysing relevant data and applying proven methodologies. The process typically involves identifying key objectives, gathering insights, and implementing targeted strategies to achieve desired outcomes.`,
      keep: true,
    },
    {
      id: uid(3),
      question: `What are the benefits of ${keyword}?`,
      answer: `The main benefits of ${keyword} include improved efficiency, better decision-making, cost savings, and more predictable results. Many organisations see measurable improvements within weeks of implementation.`,
      keep: true,
    },
    {
      id: uid(4),
      question: `Is ${keyword} suitable for beginners?`,
      answer: `Yes, ${keyword} is accessible to beginners. Start with the fundamentals, use beginner-friendly tools, and gradually build your expertise. Many platforms offer tutorials and step-by-step guides to help you get started quickly.`,
      keep: true,
    },
    {
      id: uid(5),
      question: `What tools are best for ${keyword}?`,
      answer: `The best tools for ${keyword} depend on your specific needs and budget. Popular options include purpose-built platforms, analytics dashboards, and automation tools. Evaluate each based on features, integration capabilities, and ease of use.`,
      keep: true,
    },
  ];
}

// ─── Step 11: SEO assets ─────────────────────────────────────────────────────

export function localSEOAssetsFallback(
  keyword: string,
  brief: { title: string; metaTitle: string; metaDescription: string; slug: string },
): SEOAssets {
  const title = brief.title || `Complete Guide to ${keyword}`;
  const metaTitle = brief.metaTitle || title.slice(0, 60);
  const metaDesc = brief.metaDescription || `Learn everything about ${keyword}. Expert tips, best practices, and actionable strategies.`;
  const slug = brief.slug || keyword.toLowerCase().replace(/\s+/g, '-');

  const schemaObj = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: metaDesc,
    url: `https://aidetector.cx/blog/${slug}`,
    author: { '@type': 'Organization', name: 'AIDetector.cx' },
    publisher: {
      '@type': 'Organization',
      name: 'AIDetector.cx',
      logo: { '@type': 'ImageObject', url: 'https://aidetector.cx/logo.png' },
    },
    datePublished: new Date().toISOString().split('T')[0],
  };

  return {
    metaTitle,
    metaDescription: metaDesc,
    ogTitle: title,
    ogDescription: metaDesc,
    ogImageSuggestion: `A compelling featured image showing ${keyword} concept with professional photography`,
    twitterTitle: title.slice(0, 70),
    twitterDescription: metaDesc.slice(0, 200),
    canonicalUrl: `https://aidetector.cx/blog/${slug}`,
    schemaJson: JSON.stringify(schemaObj, null, 2),
  };
}
