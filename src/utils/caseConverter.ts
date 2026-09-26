/**
 * Case Conversion Utilities
 * 
 * Provides robust transformations for:
 * - UPPERCASE
 * - lowercase
 * - Sentence case
 * - Title Case (with proper minor words handling: APA/Chicago standard)
 * 
 * Works seamlessly on full documents or selected ranges.
 */

// Minor words that should stay lowercase in title case unless at the beginning or end of a title/sentence
const MINOR_WORDS = new Set([
  'a', 'an', 'the',
  'and', 'but', 'or', 'for', 'nor', 'so', 'yet',
  'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'off', 'on', 'onto', 'per', 'to', 'up', 'via', 'with'
]);

/**
 * Converts text to UPPERCASE
 */
export function toUpperCase(text: string): string {
  if (!text) return '';
  return text.toUpperCase();
}

/**
 * Converts text to lowercase
 */
export function toLowerCase(text: string): string {
  if (!text) return '';
  return text.toLowerCase();
}

/**
 * Converts text to Sentence case.
 * Capitalizes the first letter of each sentence while lowercasing the rest,
 * preserving existing numbers, abbreviations, and sentence boundary punctuation.
 */
export function toSentenceCase(text: string): string {
  if (!text) return '';

  // Split by sentence terminators while capturing delimiters and whitespace
  // Regex matches sentence-ending punctuation followed by whitespace or linebreaks
  return text.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (match, prefix, char) => {
    return prefix + char.toUpperCase();
  });
}

/**
 * Converts text to Title Case following APA/Chicago editorial standards.
 * - Always capitalizes first and last word of sentences / lines.
 * - Capitalizes major words (nouns, verbs, adjectives, adverbs).
 * - Leaves minor prepositions, articles, and coordinating conjunctions lowercase (unless first/last).
 * - Preserves hyphenated compound words with proper capitalization.
 */
export function toTitleCase(text: string): string {
  if (!text) return '';

  return text.replace(/\b([^\s\n\r]+)\b/g, (rawWord, word, offset, fullStr) => {
    // Check if word contains internal apostrophes like "don't" or hyphens like "state-of-the-art"
    if (word.includes('-')) {
      return word
        .split('-')
        .map((sub: string, idx: number, arr: string[]) => {
          const lower = sub.toLowerCase();
          if (idx === 0 || idx === arr.length - 1 || !MINOR_WORDS.has(lower)) {
            return lower.charAt(0).toUpperCase() + lower.slice(1);
          }
          return lower;
        })
        .join('-');
    }

    const lower = word.toLowerCase();
    
    // Check if first word of document or immediately follows a newline or sentence punctuation (. ! ?)
    const precedingSlice = fullStr.slice(0, offset).trim();
    const isFirstInSentence = precedingSlice.length === 0 || /[.!?\n]$/.test(precedingSlice);
    
    // Check if last word in document or sentence
    const followingSlice = fullStr.slice(offset + word.length).trim();
    const isLastInSentence = followingSlice.length === 0 || /^[.!?\n]/.test(followingSlice);

    if (isFirstInSentence || isLastInSentence || !MINOR_WORDS.has(lower)) {
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }
    return lower;
  });
}

/**
 * Applies case conversion to either the selected portion of text or the entire text
 */
export function applyCaseTransformation(
  fullText: string,
  transformation: 'upper' | 'lower' | 'sentence' | 'title',
  selectionStart?: number,
  selectionEnd?: number
): { newText: string; transformedSelectionStart: number; transformedSelectionEnd: number } {
  const hasSelection = typeof selectionStart === 'number' && typeof selectionEnd === 'number' && selectionStart !== selectionEnd;

  if (!hasSelection) {
    let transformed = fullText;
    switch (transformation) {
      case 'upper':
        transformed = toUpperCase(fullText);
        break;
      case 'lower':
        transformed = toLowerCase(fullText);
        break;
      case 'sentence':
        transformed = toSentenceCase(fullText);
        break;
      case 'title':
        transformed = toTitleCase(fullText);
        break;
    }
    return {
      newText: transformed,
      transformedSelectionStart: 0,
      transformedSelectionEnd: transformed.length,
    };
  }

  const start = Math.min(selectionStart!, selectionEnd!);
  const end = Math.max(selectionStart!, selectionEnd!);
  const before = fullText.slice(0, start);
  const selected = fullText.slice(start, end);
  const after = fullText.slice(end);

  let transformedSub = selected;
  switch (transformation) {
    case 'upper':
      transformedSub = toUpperCase(selected);
      break;
    case 'lower':
      transformedSub = toLowerCase(selected);
      break;
    case 'sentence':
      transformedSub = toSentenceCase(selected);
      break;
    case 'title':
      transformedSub = toTitleCase(selected);
      break;
  }

  return {
    newText: before + transformedSub + after,
    transformedSelectionStart: start,
    transformedSelectionEnd: start + transformedSub.length,
  };
}
