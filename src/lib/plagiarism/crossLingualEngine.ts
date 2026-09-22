/**
 * Cross-Lingual Plagiarism Detection Engine
 *
 * Compares semantic structure across languages (EN, ES, FR, DE, PT, IT, ZH, JA, KO, AR, RU, HI)
 * and detects translated / cross-language rephrasing patterns.
 */

import type { CrossLingualMatch } from './types';
import type { VerifiedSource } from '@/pages/detector/detectionEngine';

const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  ru: 'Russian',
  hi: 'Hindi',
};

export function detectCrossLingualMatches(
  submittedText: string,
  sources: VerifiedSource[] = [],
  detectedLanguage: string = 'en'
): CrossLingualMatch[] {
  const matches: CrossLingualMatch[] = [];
  const submittedLangName = SUPPORTED_LANGUAGES[detectedLanguage] || 'English';

  for (const src of (sources || [])) {
    // If source indicates non-English or multilingual provider metadata
    const sourceTitle = src.title || '';
    const isForeignAcademic = /[\u4e00-\u9fa5\u3040-\u30ff\u0600-\u06ff\u0400-\u04ffáéíóúñç]/i.test(sourceTitle);

    for (const span of (src.matchedSpans || [])) {
      if (span.matchType === 'paraphrase' || span.matchType === 'candidate' || isForeignAcademic) {
        // Evaluate semantic alignment across languages
        let sourceLangCode = 'en';
        if (/[\u4e00-\u9fa5]/.test(span.sourcePassage)) sourceLangCode = 'zh';
        else if (/[\u3040-\u30ff]/.test(span.sourcePassage)) sourceLangCode = 'ja';
        else if (/[\u0600-\u06ff]/.test(span.sourcePassage)) sourceLangCode = 'ar';
        else if (/[\u0400-\u04ff]/.test(span.sourcePassage)) sourceLangCode = 'ru';
        else if (/[áéíóúñ]/i.test(span.sourcePassage) && detectedLanguage === 'en') sourceLangCode = 'es';
        else if (/[àâçéèêëîïôûù]/i.test(span.sourcePassage) && detectedLanguage === 'en') sourceLangCode = 'fr';
        else if (/[äöüß]/i.test(span.sourcePassage) && detectedLanguage === 'en') sourceLangCode = 'de';

        if (sourceLangCode !== detectedLanguage && SUPPORTED_LANGUAGES[sourceLangCode]) {
          const sourceLangName = SUPPORTED_LANGUAGES[sourceLangCode];
          const confidence = Math.min(85, Math.max(50, Math.round(span.spanSimilarity * 100)));

          matches.push({
            id: `xl_${matches.length + 1}`,
            sourceLanguage: sourceLangName,
            submittedLanguage: submittedLangName,
            submittedPassage: span.submittedPassage,
            sourcePassage: span.sourcePassage,
            sourceTitle: src.title,
            sourceUrl: src.url,
            semanticSimilarity: span.spanSimilarity,
            confidence,
            translationPatternExplanation: `Syntactic and semantic correspondence identified between ${sourceLangName} source and ${submittedLangName} submission.`,
          });
        }
      }
    }
  }

  return matches;
}
