// Shared types for the Content Studio wizard

export interface OutlineSection {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'faq' | 'conclusion' | 'intro';
  text: string;
  children?: OutlineSection[];
}

export interface EEATConfig {
  includeExamples: boolean;
  includeCaseStudy: boolean;
  includeStats: boolean;
  includeCitations: boolean;
  authorName: string;
  authorTitle: string;
  reviewerName: string;
  authorBio: string;
  citations: string[];
}

export interface ArticleSection {
  id: string;
  heading: string;
  content: string;
  accepted: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  keep: boolean;
}

export interface SEOAssets {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImageSuggestion: string;
  twitterTitle: string;
  twitterDescription: string;
  canonicalUrl: string;
  schemaJson: string;
}

export interface SEOAuditScores {
  keywordUsage: number;
  readability: number;
  internalLinks: number;
  eeat: number;
  headingStructure: number;
  faq: number;
  schema: number;
}

export interface WizardState {
  articleId: string | null;
  currentStep: number;

  // Step 1
  keyword: string;
  country: string;
  searchIntent: string;
  competitorUrls: string[];
  secondaryKeywords: string[];
  selectedKeywords: string[];
  lsiKeywords: string[];
  peopleAlsoAsk: string[];
  keywordDifficulty: number;
  searchVolume: string;
  targetWordCount: number;

  // Step 2
  serpHeadings: string[];
  competitorTopics: { topic: string; covered: boolean; isGap: boolean; selected: boolean }[];

  // Step 3
  brief: {
    title: string;
    metaTitle: string;
    metaDescription: string;
    slug: string;
  };

  // Step 4
  outline: OutlineSection[];

  // Step 5
  eeatConfig: EEATConfig;

  // Step 6
  sections: ArticleSection[];

  // Step 7
  humanizedContent: string;
  readabilityBefore: number;
  readabilityAfter: number;

  // Step 8
  keywordDensityReport: { keyword: string; count: number; density: number; status: 'good' | 'low' | 'over' }[];

  // Step 9
  internalLinks: { anchorText: string; url: string; reason: string; accepted: boolean }[];

  // Step 10
  faqItems: FAQItem[];

  // Step 11
  seoAssets: SEOAssets;

  // Step 12
  auditScores: SEOAuditScores;
  fullContent: string;
}

export const defaultEEATConfig: EEATConfig = {
  includeExamples: true,
  includeCaseStudy: false,
  includeStats: true,
  includeCitations: false,
  authorName: '',
  authorTitle: '',
  reviewerName: '',
  authorBio: '',
  citations: ['', '', '', '', ''],
};

export const defaultSEOAssets: SEOAssets = {
  metaTitle: '',
  metaDescription: '',
  ogTitle: '',
  ogDescription: '',
  ogImageSuggestion: '',
  twitterTitle: '',
  twitterDescription: '',
  canonicalUrl: '',
  schemaJson: '',
};

export const defaultAuditScores: SEOAuditScores = {
  keywordUsage: 0,
  readability: 0,
  internalLinks: 0,
  eeat: 0,
  headingStructure: 0,
  faq: 0,
  schema: 0,
};

export const COUNTRIES = ['USA', 'UK', 'Canada', 'Australia', 'Global', 'Germany', 'France', 'India', 'Brazil', 'Spain'];
export const SEARCH_INTENTS = ['Informational', 'Commercial', 'Transactional', 'Navigational'];
export const WORD_COUNT_OPTIONS = [600, 900, 1200, 1500, 2000, 3000];

export function getKeywordMinFrequency(wordCount: number): number {
  if (wordCount >= 1200) return 6;
  if (wordCount >= 900) return 4;
  return 3;
}

export function computeOverallScore(scores: SEOAuditScores): number {
  const vals = Object.values(scores);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
