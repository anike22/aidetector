/**
 * Readability and Text Complexity Scoring Utilities
 * 
 * Calculates:
 * - Flesch Reading Ease (0-100 score)
 * - Flesch-Kincaid Grade Level (U.S. school grade)
 * - Gunning Fog Index
 * - Automated Readability Index (ARI)
 * - Syllable count estimation
 * - Reading complexity classification
 */

import { countWords, getSentences } from './wordCounter';

export interface ReadabilityMetrics {
  fleschReadingEase: number;
  fleschReadingEaseLabel: string;
  fleschKincaidGradeLevel: number;
  fleschKincaidGradeLabel: string;
  gunningFogIndex: number;
  automatedReadabilityIndex: number;
  syllablesCount: number;
  averageSyllablesPerWord: number;
  averageWordsPerSentence: number;
  complexWordsCount: number;
  complexWordsPercentage: number;
}

/**
 * Counts syllables in an English word using phonetic heuristics
 */
export function countSyllables(rawWord: string): number {
  if (!rawWord) return 0;
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;

  // Remove silent endings
  let cleaned = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  cleaned = cleaned.replace(/^y/, '');

  const vowelMatches = cleaned.match(/[aeiouy]{1,2}/g);
  const count = vowelMatches ? vowelMatches.length : 1;

  return Math.max(1, count);
}

/**
 * Returns true if a word is considered complex (3 or more syllables)
 */
export function isComplexWord(word: string): boolean {
  return countSyllables(word) >= 3;
}

/**
 * Computes all readability metrics for the given text
 */
export function calculateReadabilityMetrics(text: string): ReadabilityMetrics {
  if (!text || !text.trim()) {
    return {
      fleschReadingEase: 0,
      fleschReadingEaseLabel: 'N/A',
      fleschKincaidGradeLevel: 0,
      fleschKincaidGradeLabel: 'N/A',
      gunningFogIndex: 0,
      automatedReadabilityIndex: 0,
      syllablesCount: 0,
      averageSyllablesPerWord: 0,
      averageWordsPerSentence: 0,
      complexWordsCount: 0,
      complexWordsPercentage: 0,
    };
  }

  const wordsList = text.match(/[\p{L}\p{N}'’\-_]+/gu) || [];
  const wordsCount = wordsList.length || 1;
  const sentencesList = getSentences(text);
  const sentencesCount = Math.max(1, sentencesList.length);
  const charactersNoSpaces = text.replace(/\s+/g, '').length;

  let totalSyllables = 0;
  let complexWordsCount = 0;

  for (const w of wordsList) {
    const syl = countSyllables(w);
    totalSyllables += syl;
    if (syl >= 3) {
      complexWordsCount++;
    }
  }

  const avgWordsPerSentence = wordsCount / sentencesCount;
  const avgSyllablesPerWord = totalSyllables / wordsCount;
  const complexWordsPercentage = (complexWordsCount / wordsCount) * 100;

  // Flesch Reading Ease Formula:
  // 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
  let fleschReadingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  fleschReadingEase = Math.max(0, Math.min(100, Number(fleschReadingEase.toFixed(1))));

  let fleschReadingEaseLabel = 'Standard';
  if (fleschReadingEase >= 90) fleschReadingEaseLabel = 'Very Easy (5th grade)';
  else if (fleschReadingEase >= 80) fleschReadingEaseLabel = 'Easy (6th grade)';
  else if (fleschReadingEase >= 70) fleschReadingEaseLabel = 'Fairly Easy (7th grade)';
  else if (fleschReadingEase >= 60) fleschReadingEaseLabel = 'Standard (8th-9th grade)';
  else if (fleschReadingEase >= 50) fleschReadingEaseLabel = 'Fairly Difficult (10th-12th grade)';
  else if (fleschReadingEase >= 30) fleschReadingEaseLabel = 'Difficult (College)';
  else fleschReadingEaseLabel = 'Very Confusing (Graduate)';

  // Flesch-Kincaid Grade Level Formula:
  // 0.39 * (total words / total sentences) + 11.8 * (total syllables / total words) - 15.59
  let fleschKincaidGradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  fleschKincaidGradeLevel = Math.max(0, Number(fleschKincaidGradeLevel.toFixed(1)));

  let fleschKincaidGradeLabel = `Grade ${Math.round(fleschKincaidGradeLevel)}`;
  if (fleschKincaidGradeLevel <= 6) fleschKincaidGradeLabel = 'Elementary School';
  else if (fleschKincaidGradeLevel <= 8) fleschKincaidGradeLabel = 'Middle School';
  else if (fleschKincaidGradeLevel <= 12) fleschKincaidGradeLabel = 'High School';
  else if (fleschKincaidGradeLevel <= 16) fleschKincaidGradeLabel = 'Undergraduate College';
  else fleschKincaidGradeLabel = 'Graduate / Academic';

  // Gunning Fog Index:
  // 0.4 * ((words / sentences) + 100 * (complex words / words))
  let gunningFogIndex = 0.4 * (avgWordsPerSentence + complexWordsPercentage);
  gunningFogIndex = Math.max(0, Number(gunningFogIndex.toFixed(1)));

  // Automated Readability Index (ARI):
  // 4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43
  let automatedReadabilityIndex = 4.71 * (charactersNoSpaces / wordsCount) + 0.5 * avgWordsPerSentence - 21.43;
  automatedReadabilityIndex = Math.max(0, Number(automatedReadabilityIndex.toFixed(1)));

  return {
    fleschReadingEase,
    fleschReadingEaseLabel,
    fleschKincaidGradeLevel,
    fleschKincaidGradeLabel,
    gunningFogIndex,
    automatedReadabilityIndex,
    syllablesCount: totalSyllables,
    averageSyllablesPerWord: Number(avgSyllablesPerWord.toFixed(2)),
    averageWordsPerSentence: Number(avgWordsPerSentence.toFixed(1)),
    complexWordsCount,
    complexWordsPercentage: Number(complexWordsPercentage.toFixed(1)),
  };
}
