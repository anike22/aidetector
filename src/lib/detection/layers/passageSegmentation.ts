import type { DetectedLanguage } from '../types';

export interface Passage {
  text: string;
  type: 'sentence' | 'paragraph' | 'section';
  start: number;
  end: number;
  index: number;
}

export interface SegmentationResult {
  passages: Passage[];
  sentenceRanges: Range[];
  paragraphRanges: Range[];
}

export interface Range {
  start: number;
  end: number;
}

// Sentence-ending punctuation by script family.
const SENTENCE_END_PUNCT = /[.!?。؟！？]+/;

function splitSentences(text: string): { text: string; start: number; end: number }[] {
  const sentences: { text: string; start: number; end: number }[] = [];
  let cursor = 0;
  // Split while keeping original offsets.
  const parts = text.split(SENTENCE_END_PUNCT);
  const matches = text.match(new RegExp(SENTENCE_END_PUNCT, 'g')) || [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const punct = matches[i] || '';
    const full = part + punct;
    if (full.trim().length === 0) {
      cursor += full.length;
      continue;
    }
    const start = cursor;
    const end = cursor + full.length;
    sentences.push({ text: full.trim(), start, end });
    cursor += full.length;
  }
  return sentences;
}

function splitParagraphs(text: string): { text: string; start: number; end: number }[] {
  const paragraphs: { text: string; start: number; end: number }[] = [];
  const split = text.split(/\n\n+/);
  let cursor = 0;
  for (const raw of split) {
    if (raw.trim().length === 0) {
      cursor += raw.length + 2; // account for \n\n
      continue;
    }
    const start = cursor;
    const end = cursor + raw.length;
    paragraphs.push({ text: raw.trim(), start, end });
    cursor = end + 2;
  }
  return paragraphs;
}

/**
 * Layer 3 — Passage Segmentation.
 *
 * Produces sentence, paragraph, and (for long documents) section passages.
 * Each passage carries absolute offsets so downstream explainability can link
 * evidence back to the original text.
 */
export function segmentPassages(
  cleanedText: string,
  _language: DetectedLanguage,
  maxSectionWords = 500,
): SegmentationResult {
  const sentenceRanges: Range[] = [];
  const paragraphRanges: Range[] = [];
  const passages: Passage[] = [];

  const sentences = splitSentences(cleanedText);
  for (const s of sentences) {
    sentenceRanges.push({ start: s.start, end: s.end });
  }

  const paragraphs = splitParagraphs(cleanedText);
  for (const p of paragraphs) {
    paragraphRanges.push({ start: p.start, end: p.end });
  }

  let passageIndex = 0;
  // Sentence passages for fine-grained highlighting.
  for (const s of sentences) {
    passages.push({
      text: s.text,
      type: 'sentence',
      start: s.start,
      end: s.end,
      index: passageIndex++,
    });
  }

  // Paragraph passages for mixed-authorship boundary detection.
  for (const p of paragraphs) {
    passages.push({
      text: p.text,
      type: 'paragraph',
      start: p.start,
      end: p.end,
      index: passageIndex++,
    });
  }

  // Section passages for long-document aggregation.
  let sectionStart = 0;
  let sectionWords = 0;
  let sectionText = '';
  const words = cleanedText.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    sectionText += (sectionText ? ' ' : '') + word;
    sectionWords++;
    if (sectionWords >= maxSectionWords || i === words.length - 1) {
      const start = sectionStart;
      const end = start + sectionText.length;
      passages.push({
        text: sectionText,
        type: 'section',
        start,
        end,
        index: passageIndex++,
      });
      sectionStart = end + 1;
      sectionWords = 0;
      sectionText = '';
    }
  }

  return { passages, sentenceRanges, paragraphRanges };
}
