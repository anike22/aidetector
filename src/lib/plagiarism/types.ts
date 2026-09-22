/**
 * Advanced Plagiarism Intelligence & Source Forensics Types
 * AIDetector.cx
 */

import type { MatchedSpan, VerifiedSource, PlagiarismStatus } from '@/pages/detector/detectionEngine';

export type PlagiarismRiskLevel = 'None' | 'Low' | 'Medium' | 'High' | 'Critical' | 'Limited Coverage';

export type MatchCategory =
  | 'exact'
  | 'near'
  | 'paraphrase'
  | 'cross_lingual'
  | 'conceptual'
  | 'structural'
  | 'ai_rewrite'
  | 'properly_cited'
  | 'common_boilerplate';

export type FalsePositiveCategory =
  | 'common_knowledge'
  | 'common_phrase'
  | 'academic_terminology'
  | 'legal_boilerplate'
  | 'properly_cited'
  | 'template_boilerplate'
  | 'potential_self_reuse'
  | 'unattributed_match'
  | 'needs_review';

export type CitationStatus =
  | 'properly_cited'
  | 'missing_citation'
  | 'broken_reference'
  | 'incorrect_citation'
  | 'nonexistent_fabricated'
  | 'improperly_attributed_quote';

export type SourceCredibilityLevel = 'Verified Academic' | 'Reputable Publisher' | 'General Web' | 'Syndicated / Mirror' | 'Unverified / Suspicious';

export interface DistinctiveSegment {
  id: string;
  startIndex: number;
  endIndex: number;
  text: string;
  wordCount: number;
  distinctivenessScore: number; // 0 to 1
  rareTerms: string[];
  namedEntities: string[];
  isBoilerplateCandidate: boolean;
}

export interface CitationItem {
  id: string;
  inTextCitation: string;
  startIndex: number;
  endIndex: number;
  format: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Harvard' | 'Generic';
  citedAuthors?: string[];
  citedYear?: string;
  citedTitle?: string;
  citedDoi?: string;
  citedUrl?: string;
  status: CitationStatus;
  statusExplanation: string;
  associatedMatchId?: string;
  verifiedInCrossrefOrOpenAlex?: boolean;
}

export interface SourceCluster {
  clusterId: string;
  primarySource: VerifiedSource;
  mirrors: VerifiedSource[];
  earliestDate?: string;
  clusterType: 'syndication' | 'mirror' | 'republication' | 'independent';
  totalMirrorsCount: number;
}

export interface ChronologyEntry {
  sourceId: string;
  title: string;
  url: string;
  publisher: string;
  provider: string;
  publicationDate: string | null;
  formattedDate: string;
  isEarliestDiscovered: boolean;
  isArchiveEstimate?: boolean;
  doi?: string | null;
  similarityContribution: number;
}

export interface AiRewriteTraceMatch {
  id: string;
  submittedPassage: string;
  sourcePassage: string;
  sourceTitle: string;
  sourceUrl: string;
  confidence: number; // 40-75%
  cautiousVerdict: 'Possible AI-assisted rewrite' | 'Strong semantic relationship' | 'Possible paraphrased source' | 'Shows patterns consistent with AI transformation';
  evidenceSignals: string[];
  factProgressionMatch: number; // 0 to 100
  vocabularyShiftScore: number; // 0 to 100
  argumentOrderAlignment: number; // 0 to 100
}

export interface CrossLingualMatch {
  id: string;
  sourceLanguage: string;
  submittedLanguage: string;
  submittedPassage: string;
  sourcePassage: string;
  sourceTitle: string;
  sourceUrl: string;
  semanticSimilarity: number;
  confidence: number; // 50-85%
  translationPatternExplanation: string;
}

export interface ConceptualSimilarityItem {
  id: string;
  conceptName: string;
  submittedSection: string;
  matchedSourceConcept: string;
  sourceTitle: string;
  sourceUrl: string;
  similarityScore: number; // 40-80%
  description: string;
}

export interface StructuralSimilarityItem {
  id: string;
  sectionTitle: string;
  structuralPattern: string;
  sourceTitle: string;
  sourceUrl: string;
  similarityScore: number; // 30-70%
  alignmentDetails: string;
}

export interface FalsePositiveClassification {
  id: string;
  spanText: string;
  startIndex: number;
  endIndex: number;
  category: FalsePositiveCategory;
  categoryLabel: string;
  explanation: string;
  isExcludedFromRisk: boolean;
}

export interface ForensicEvidenceMatch {
  id: string;
  submittedStart: number;
  submittedEnd: number;
  submittedPassage: string;
  sourcePassage: string;
  sourceTitle: string;
  sourceUrl: string;
  sourcePublisher: string;
  sourceProvider: string;
  sourceDoi?: string | null;
  publicationDate?: string | null;
  category: MatchCategory;
  categoryLabel: string;
  confidence: number; // 0 to 100
  attributionStatus: CitationStatus;
  attributionExplanation: string;
  isExcludedByFalsePositiveFilter: boolean;
  falsePositiveReason?: string;
  aiRewriteTrace?: AiRewriteTraceMatch;
  crossLingualInfo?: CrossLingualMatch;
}

export interface IndividualSourceContribution {
  sourceTitle: string;
  sourceUrl: string;
  publisher: string;
  provider: string;
  matchContribution: number;
  uniqueNonOverlappingPercentage: number;
  matchType: string;
  isExcludedFromDoubleCounting: boolean;
}

export type ScanMode = 'standard' | 'deep_forensic';

export interface PlagiarismForensicIntelligence {
  // Core similarity vs Risk separation
  rawSimilarityPercentage: number;
  plagiarismRiskLevel: PlagiarismRiskLevel;
  uncitedDirectMatchPercentage: number;
  properlyCitedPercentage: number;
  falsePositiveFilteredPercentage: number;
  riskExplanation: string;

  // Language & parsing
  detectedLanguage: string;
  languageName: string;
  isMultilingual: boolean;
  totalWordCount: number;
  totalCharCount: number;
  documentHash: string; // SHA-256

  // Breakdown metrics
  exactMatchPercentage: number;
  nearMatchPercentage: number;
  paraphraseMatchPercentage: number;
  crossLingualPercentage: number;
  conceptualSimilarityScore: number;
  structuralSimilarityScore: number;
  aiRewriteTraceScore: number;

  // Detailed Collections
  evidenceMatches: ForensicEvidenceMatch[];
  individualSourceContributions: IndividualSourceContribution[];
  citations: CitationItem[];
  sourceClusters: SourceCluster[];
  chronologicalTimeline: ChronologyEntry[];
  aiRewriteTraces: AiRewriteTraceMatch[];
  crossLingualMatches: CrossLingualMatch[];
  conceptualSimilarities: ConceptualSimilarityItem[];
  structuralSimilarities: StructuralSimilarityItem[];
  falsePositiveClassifications: FalsePositiveClassification[];

  // Phase 2 Multimodal & Corpus Extensions
  tableSimilarityMatches: Array<import('./tableDatasetEngine').TableSimilarityMatch>;
  visualSimilarityMatches: Array<import('./visualPlagiarismEngine').VisualSimilarityMatch>;
  codePlagiarismMatches: Array<import('./codePlagiarismEngine').CodePlagiarismMatch>;
  selfSimilarityMatches: Array<import('./privateCorpusEngine').SelfSimilarityMatch>;
  searchCoverageReport: import('./coverageMatrix').SearchCoverageReport;

  // Provider & audit status
  earliestDiscoveredSource: ChronologyEntry | null;
  sourceCredibilityMap: Record<string, SourceCredibilityLevel>;
  overallOriginalityScore: number;
  generatedAt: string;
  auditPackageId: string;
}
