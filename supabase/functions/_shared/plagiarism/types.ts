// Shared plagiarism types — used by both the Edge Function and the frontend client.

/** Status codes returned with every plagiarism result. */
export type PlagiarismStatus =
  | 'completed'            // full analysis done, ≥1 provider succeeded
  | 'partial'              // some providers failed but ≥1 returned results
  | 'no_verified_matches'  // all providers ran, none found a match
  | 'insufficient_text'    // text too short to analyse
  | 'provider_unavailable' // all providers failed / timed out
  | 'analysis_failed';     // unexpected internal error

/** A single verified matched span between submitted text and a source. */
export interface MatchedSpan {
  /** Character offset in the submitted text (start, inclusive). */
  submittedStart: number;
  /** Character offset in the submitted text (end, exclusive). */
  submittedEnd: number;
  /** The exact substring from the submitted text. */
  submittedPassage: string;
  /** The corresponding passage in the source. */
  sourcePassage: string;
  /** How the match was found. */
  matchType: 'exact' | 'near' | 'semantic';
  /** Normalised similarity for this span (0–1). */
  spanSimilarity: number;
}

/** One discovered and verified source. */
export interface VerifiedSource {
  /** Display title from the provider. */
  title: string;
  /** DOI if available (null otherwise). */
  doi: string | null;
  /** Canonical URL used to retrieve source text. */
  url: string;
  /** Publisher / domain label. */
  publisher: string;
  /** Which discovery provider found this. */
  provider: 'crossref' | 'openalex' | 'unpaywall';
  /** Percentage of the submitted document matched against this source (0–100). */
  matchContribution: number;
  /** Whether the match contribution is from cited/quoted material. */
  citedMaterial: boolean;
  /** All matched passages from this source. */
  matchedSpans: MatchedSpan[];
  /** Highest span similarity across all spans (0–100, rounded). */
  similarity: number;
  /** Dominant match type across spans. */
  matchType: 'Exact' | 'Near Match' | 'Semantic' | 'Mixed';
}

/** The complete result returned to the frontend. */
export interface PlagiarismAnalysisResult {
  status: PlagiarismStatus;

  // ── Scores (only present when status is completed / partial / no_verified_matches) ──
  /**
   * Percentage of the eligible document text that is covered by ≥1 verified match.
   * Formula: uniqueMatchedChars / eligibleChars * 100, rounded to nearest integer.
   * 0 when no matches found or status is not a scoring status.
   */
  similarityScore: number;
  /**
   * 100 - similarityScore. Not independently calculated.
   */
  originalityScore: number;
  /**
   * Percentage covered by exact matches.
   */
  exactMatchScore: number;
  /**
   * Percentage covered by near/fuzzy matches.
   */
  nearMatchScore: number;
  /**
   * Percentage covered by semantic-only matches (low lexical overlap).
   */
  semanticMatchScore: number;

  riskLevel: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';

  /** All verified sources with evidence. */
  sources: VerifiedSource[];

  /** Prose coverage note shown to users. */
  coverageNote: string;

  /** Per-provider status for transparency. */
  providerStatus: {
    crossref: 'ok' | 'failed' | 'skipped';
    openalex: 'ok' | 'failed' | 'skipped';
    unpaywall: 'ok' | 'failed' | 'skipped';
    gemini: 'ok' | 'failed' | 'skipped';
  };

  /** Human-readable error message when status indicates failure. */
  errorMessage?: string;
}
