import type { DetectedLanguage } from '../types';

export interface PreprocessedDocument {
  cleanedText: string;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  charCount: number;
}

/**
 * Layer 2 — Document Preprocessing.
 *
 * Normalizes whitespace and structural markers while preserving paragraph
 * boundaries needed by downstream segmentation.
 */
export function preprocessDocument(rawText: string, _language: DetectedLanguage): PreprocessedDocument {
  if (!rawText || rawText.trim().length === 0) {
    return { cleanedText: '', wordCount: 0, sentenceCount: 0, paragraphCount: 0, charCount: 0 };
  }

  // Normalize line endings and collapse multiple blank lines into a single
  // paragraph separator.
  let cleaned = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t+/g, ' ')
    .replace(/[ \u00A0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const paragraphs = cleaned.split(/\n\n+/).filter((p) => p.trim().length > 0);
  // Rough sentence count based on sentence-ending punctuation.
  const sentences = cleaned
    .replace(/([.!?。؟！？]+)/g, '$1\n')
    .split('\n')
    .filter((s) => s.trim().length > 0);

  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

  return {
    cleanedText: cleaned,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    charCount: cleaned.length,
  };
}
