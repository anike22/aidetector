/**
 * Word Counter & Text Analysis Utilities
 * 
 * Provides language-aware, grapheme-accurate word, character, sentence,
 * and paragraph counting with Intl.Segmenter support and tested fallback.
 * 
 * Basic counting is 100% local, unlimited, and free.
 */

export interface TextStatistics {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  readingTimeMinutes: number;
  readingTimeSeconds: number;
  readingTimeFormatted: string;
  speakingTimeMinutes: number;
  speakingTimeSeconds: number;
  speakingTimeFormatted: string;
  averageWordLength: number;
  averageSentenceLengthWords: number;
  longestSentenceWords: number;
  longestParagraphWords: number;
}

export interface WordFrequencyItem {
  word: string;
  count: number;
  percentage: number;
}

export interface SentenceAnalysis {
  index: number;
  text: string;
  wordCount: number;
  characterCount: number;
  startIndex: number;
  endIndex: number;
  exceedsLimit: boolean;
}

export interface ParagraphAnalysis {
  index: number;
  text: string;
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  startIndex: number;
  endIndex: number;
  exceedsLimit: boolean;
}

export interface WritingLimitsConfig {
  maxWordsPerSentence: number; // default 25
  maxWordsPerParagraph: number; // default 250
  enabled: boolean;
}

export interface SpeedConfig {
  wordsPerMinuteReading: number; // default 225 wpm
  wordsPerMinuteSpeaking: number; // default 140 wpm
}

export const DEFAULT_WRITING_LIMITS: WritingLimitsConfig = {
  maxWordsPerSentence: 25,
  maxWordsPerParagraph: 250,
  enabled: false,
};

export const DEFAULT_SPEEDS: SpeedConfig = {
  wordsPerMinuteReading: 225,
  wordsPerMinuteSpeaking: 130,
};

// Common English stop words for descriptive frequency analysis
export const COMMON_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each',
  'few', 'for', 'from', 'further',
  'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up',
  'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Checks if Intl.Segmenter is supported in the current environment
 */
export function isIntlSegmenterSupported(): boolean {
  return typeof Intl !== 'undefined' && typeof (Intl as any).Segmenter === 'function';
}

/**
 * Counts grapheme clusters (accurate for emoji, ZWJ sequences, combined marks)
 */
export function countGraphemes(text: string): number {
  if (!text) return 0;
  if (isIntlSegmenterSupported()) {
    try {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      let count = 0;
      for (const _ of segmenter.segment(text)) {
        count++;
      }
      return count;
    } catch {
      // fallback below
    }
  }
  // Fallback: Unicode code point iteration
  return Array.from(text).length;
}

/**
 * Counts characters without whitespace
 */
export function countCharactersWithoutWhitespace(text: string): number {
  if (!text) return 0;
  const noWhitespace = text.replace(/\s+/gu, '');
  return countGraphemes(noWhitespace);
}

/**
 * Regex matching CJK characters (Chinese, Japanese Kanji/Kana, Korean Hangul)
 */
const CJK_CHAR_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u30ff\u31f0-\u31ff\uac00-\ud7af]/gu;

/**
 * Counts words accurately across multiple writing systems.
 * 
 * Rules:
 * - Contractions ("don't", "it's", "O'Connor", "writers'") count as 1 word.
 * - Hyphenated compound words ("state-of-the-art", "user-friendly") count as 1 word.
 * - URLs, emails, numbers, currency ("https://aidetector.cx", "user@domain.com", "3.14159", "$49.99") count as 1 word.
 * - CJK characters (each Chinese/Japanese/Korean character) count as 1 word unit.
 * - Emoji / standalone punctuation do not count as words.
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;

  let cjkCount = 0;
  // Count CJK characters and replace them with spaces
  const nonCjkText = text.replace(CJK_CHAR_REGEX, (match) => {
    cjkCount += countGraphemes(match);
    return ' ';
  });

  // URL / Email / Western words regex:
  // 1. Matches URLs: (?:https?:\/\/|www\.)[^\s]+
  // 2. Matches Emails: [a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+
  // 3. Matches words with contractions, hyphens, numbers, currency: [$€£¥]?\w+(?:[-'’/.:]\w+)*[%]?
  const tokenRegex = /(?:https?:\/\/|www\.)[^\s,()<>]+|[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+|[$€£¥]?[\p{L}\p{N}]+(?:[-'’/.:][\p{L}\p{N}]+)*[%]?/gu;

  const matches = nonCjkText.match(tokenRegex);
  const westernCount = matches ? matches.length : 0;

  return westernCount + cjkCount;
}

/**
 * Standard Abbreviations that do not indicate sentence end
 */
const ABBREVIATIONS_SET = new Set([
  'dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr', 'vs', 'etc', 'eg', 'ie', 'al',
  'st', 'ave', 'rd', 'blvd', 'dept', 'univ', 'vol', 'no', 'rev', 'hon',
  'gen', 'col', 'maj', 'capt', 'lt', 'sgt', 'corp', 'rep', 'sen', 'gov',
  'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  'u.s', 'u.k', 'e.u', 'u.n', 'd.c', 'a.m', 'p.m', 'i.e', 'e.g', 'approx', 'est'
]);

/**
 * Segments text into sentences with boundary detection.
 * Correctly avoids splitting on abbreviations (Dr., e.g.), decimal numbers (3.14), URLs, ellipses (...).
 */
export function getSentences(text: string, maxWordsLimit: number = 0): SentenceAnalysis[] {
  if (!text || !text.trim()) return [];

  const sentences: SentenceAnalysis[] = [];
  const rawText = text;
  const len = rawText.length;
  let currentStart = 0;
  let i = 0;

  while (i < len) {
    // Skip leading whitespace
    while (i < len && /\s/.test(rawText[i])) {
      i++;
    }
    if (i >= len) break;
    currentStart = i;

    // Scan until genuine sentence terminator (. ! ? or CJK 。！？) or end of text
    while (i < len) {
      const char = rawText[i];
      const isWesternTerminator = char === '.' || char === '!' || char === '?';
      const isCjkTerminator = char === '。' || char === '！' || char === '？';

      if (isCjkTerminator) {
        i++;
        break;
      }

      if (isWesternTerminator) {
        // 1. Decimal number (e.g. 3.14, $19.99, v2.5)
        if (char === '.' && i > 0 && /\d/.test(rawText[i - 1]) && i + 1 < len && /\d/.test(rawText[i + 1])) {
          i++;
          continue;
        }

        // 2. Ellipses (e.g. "..." or "..")
        if (char === '.' && i + 1 < len && rawText[i + 1] === '.') {
          while (i < len && rawText[i] === '.') {
            i++;
          }
          continue;
        }

        // 3. Dot inside acronym / abbreviation / URL / email
        if (char === '.') {
          // Check if dot is followed immediately by non-space non-quote (e.g. U.S. or example.com)
          if (i + 1 < len && /[a-zA-Z0-9]/.test(rawText[i + 1])) {
            i++;
            continue;
          }

          // Extract token preceding this dot
          let wordStart = i - 1;
          while (wordStart >= currentStart && /[a-zA-Z0-9.]/.test(rawText[wordStart])) {
            wordStart--;
          }
          const fullToken = rawText.slice(wordStart + 1, i + 1).toLowerCase(); // e.g. "dr.", "u.s.", "prof."
          const tokenWithoutEndDot = fullToken.slice(0, -1); // e.g. "dr", "u.s", "prof"

          // If it matches known abbreviation
          if (ABBREVIATIONS_SET.has(fullToken) || ABBREVIATIONS_SET.has(tokenWithoutEndDot) || /^[a-z]\.[a-z]\.$/.test(fullToken) || /^[a-z]\.$/.test(fullToken)) {
            // Find next non-whitespace char
            let nextCharIdx = i + 1;
            while (nextCharIdx < len && /\s/.test(rawText[nextCharIdx])) {
              nextCharIdx++;
            }
            // If next char is lowercase or word continues (or title like Dr./Mr./Prof./U.S. before sentence end)
            if (nextCharIdx < len) {
              const isTitle = ['dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr', 'gen', 'rep', 'sen'].includes(tokenWithoutEndDot);
              const isAcronym = ['u.s', 'u.k', 'e.u', 'u.n', 'd.c', 'a.m', 'p.m', 'e.g', 'i.e'].includes(tokenWithoutEndDot) || fullToken.includes('.');
              
              if (isTitle || isAcronym || !/[A-Z]/.test(rawText[nextCharIdx])) {
                // If it's a.m. or p.m. at end of sentence followed by capital letter, it could end sentence
                if ((tokenWithoutEndDot === 'a.m' || tokenWithoutEndDot === 'p.m') && /[A-Z]/.test(rawText[nextCharIdx])) {
                  // This is the end of sentence
                } else if (isTitle || isAcronym || !/[A-Z]/.test(rawText[nextCharIdx])) {
                  i++;
                  continue;
                }
              }
            }
          }
        }

        // Advance past punctuation and closing quotes/brackets
        i++;
        while (i < len && /["'”’)\],]/.test(rawText[i])) {
          i++;
        }
        break;
      }

      // Paragraph boundary ends sentence
      if (char === '\n') {
        let newlineCount = 1;
        let lookAhead = i + 1;
        while (lookAhead < len && (rawText[lookAhead] === '\n' || rawText[lookAhead] === '\r')) {
          if (rawText[lookAhead] === '\n') newlineCount++;
          lookAhead++;
        }
        if (newlineCount >= 2) {
          i++;
          break;
        }
      }

      i++;
    }

    const sentenceText = rawText.slice(currentStart, i).trim();
    if (sentenceText) {
      const wCount = countWords(sentenceText);
      const cCount = countGraphemes(sentenceText);
      const exceeds = maxWordsLimit > 0 && wCount > maxWordsLimit;
      sentences.push({
        index: sentences.length,
        text: sentenceText,
        wordCount: wCount,
        characterCount: cCount,
        startIndex: currentStart,
        endIndex: i,
        exceedsLimit: exceeds,
      });
    }
  }

  return sentences;
}

/**
 * Counts sentences in text
 */
export function countSentences(text: string): number {
  if (!text || !text.trim()) return 0;
  return getSentences(text).length;
}

/**
 * Splits text into paragraphs and analyzes each paragraph
 */
export function getParagraphs(text: string, maxWordsLimit: number = 0): ParagraphAnalysis[] {
  if (!text || !text.trim()) return [];

  const rawParagraphs = text.split(/\n\s*\n+/);
  const result: ParagraphAnalysis[] = [];
  let searchIndex = 0;

  for (let i = 0; i < rawParagraphs.length; i++) {
    const rawP = rawParagraphs[i];
    const trimmedP = rawP.trim();
    if (!trimmedP) continue;

    const startIndex = text.indexOf(rawP, searchIndex);
    const endIndex = startIndex !== -1 ? startIndex + rawP.length : searchIndex + rawP.length;
    searchIndex = endIndex;

    const wCount = countWords(trimmedP);
    const cCount = countGraphemes(trimmedP);
    const sCount = countSentences(trimmedP);
    const exceeds = maxWordsLimit > 0 && wCount > maxWordsLimit;

    result.push({
      index: result.length,
      text: trimmedP,
      wordCount: wCount,
      characterCount: cCount,
      sentenceCount: sCount,
      startIndex: Math.max(0, startIndex),
      endIndex,
      exceedsLimit: exceeds,
    });
  }

  return result;
}

/**
 * Counts paragraphs in text
 */
export function countParagraphs(text: string): number {
  if (!text || !text.trim()) return 0;
  return getParagraphs(text).length;
}

/**
 * Calculates duration in exact integer seconds based on word count and WPM:
 * seconds = round(words / WPM * 60)
 */
export function calculateDurationSeconds(words: number, wpm: number): number {
  if (!words || words <= 0 || !wpm || wpm <= 0 || !isFinite(words) || !isFinite(wpm)) {
    return 0;
  }
  return Math.round((words / wpm) * 60);
}

/**
 * Formats duration in natural human-readable text from seconds:
 * - 0 words / 0s -> "0 sec"
 * - 41s -> "41 sec"
 * - 70s -> "1 min 10 sec"
 * - 120s -> "2 min"
 * - 3665s -> "1 hr 1 min 5 sec"
 * Never returns decimal minutes, NaN, Infinity, or "1 min 60 sec".
 */
export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0 || !isFinite(totalSeconds)) {
    return '0 sec';
  }

  const roundedSeconds = Math.round(totalSeconds);
  if (roundedSeconds <= 0) return '0 sec';

  if (roundedSeconds < 60) {
    return `${roundedSeconds} sec`;
  }

  const hours = Math.floor(roundedSeconds / 3600);
  const remainingSecs = roundedSeconds % 3600;
  const mins = Math.floor(remainingSecs / 60);
  const secs = remainingSecs % 60;

  if (hours > 0) {
    if (mins === 0 && secs === 0) return `${hours} hr`;
    if (secs === 0) return `${hours} hr ${mins} min`;
    if (mins === 0) return `${hours} hr ${secs} sec`;
    return `${hours} hr ${mins} min ${secs} sec`;
  }

  if (secs === 0) {
    return `${mins} min`;
  }
  return `${mins} min ${secs} sec`;
}

/**
 * Computes all text statistics for the given content
 */
export function computeTextStatistics(
  text: string,
  speeds: SpeedConfig = DEFAULT_SPEEDS
): TextStatistics {
  const readingWpm = Math.max(1, speeds.wordsPerMinuteReading || DEFAULT_SPEEDS.wordsPerMinuteReading);
  const speakingWpm = Math.max(1, speeds.wordsPerMinuteSpeaking || DEFAULT_SPEEDS.wordsPerMinuteSpeaking);

  if (!text || !text.trim()) {
    return {
      words: 0,
      charactersWithSpaces: 0,
      charactersWithoutSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      readingTimeMinutes: 0,
      readingTimeSeconds: 0,
      readingTimeFormatted: '0 sec',
      speakingTimeMinutes: 0,
      speakingTimeSeconds: 0,
      speakingTimeFormatted: '0 sec',
      averageWordLength: 0,
      averageSentenceLengthWords: 0,
      longestSentenceWords: 0,
      longestParagraphWords: 0,
    };
  }

  const words = countWords(text);
  const charactersWithSpaces = countGraphemes(text);
  const charactersWithoutSpaces = countCharactersWithoutWhitespace(text);
  
  const sentencesList = getSentences(text);
  const sentences = sentencesList.length;
  
  const paragraphsList = getParagraphs(text);
  const paragraphs = paragraphsList.length;

  const readingTimeSeconds = calculateDurationSeconds(words, readingWpm);
  const speakingTimeSeconds = calculateDurationSeconds(words, speakingWpm);

  const readingTimeMinutes = Number((readingTimeSeconds / 60).toFixed(2));
  const speakingTimeMinutes = Number((speakingTimeSeconds / 60).toFixed(2));

  const averageWordLength = words > 0 ? Number((charactersWithoutSpaces / words).toFixed(1)) : 0;
  const averageSentenceLengthWords = sentences > 0 ? Number((words / sentences).toFixed(1)) : 0;

  let longestSentenceWords = 0;
  for (const s of sentencesList) {
    if (s.wordCount > longestSentenceWords) {
      longestSentenceWords = s.wordCount;
    }
  }

  let longestParagraphWords = 0;
  for (const p of paragraphsList) {
    if (p.wordCount > longestParagraphWords) {
      longestParagraphWords = p.wordCount;
    }
  }

  return {
    words,
    charactersWithSpaces,
    charactersWithoutSpaces,
    sentences,
    paragraphs,
    readingTimeMinutes,
    readingTimeSeconds,
    readingTimeFormatted: formatDuration(readingTimeSeconds),
    speakingTimeMinutes,
    speakingTimeSeconds,
    speakingTimeFormatted: formatDuration(speakingTimeSeconds),
    averageWordLength,
    averageSentenceLengthWords,
    longestSentenceWords,
    longestParagraphWords,
  };
}

/**
 * Computes word frequency distribution with optional stop words filtering
 */
export function computeWordFrequency(
  text: string,
  filterStopWords: boolean = true,
  maxResults: number = 30
): WordFrequencyItem[] {
  if (!text || !text.trim()) return [];

  // Extract individual words in lowercase
  const rawMatches = text.toLowerCase().match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || [];
  
  // Also handle CJK characters if any
  const cjkChars = text.match(CJK_CHAR_REGEX) || [];
  
  const allTokens = [...rawMatches, ...cjkChars];
  if (allTokens.length === 0) return [];

  const counts: Record<string, number> = {};
  let totalValidTokens = 0;

  for (const token of allTokens) {
    const cleanToken = token.trim();
    if (!cleanToken) continue;
    
    // Ignore pure numbers or single special characters
    if (/^\d+$/.test(cleanToken)) continue;

    if (filterStopWords && COMMON_STOP_WORDS.has(cleanToken)) {
      continue;
    }

    counts[cleanToken] = (counts[cleanToken] || 0) + 1;
    totalValidTokens++;
  }

  if (totalValidTokens === 0) return [];

  const items: WordFrequencyItem[] = Object.entries(counts).map(([word, count]) => ({
    word,
    count,
    percentage: Number(((count / totalValidTokens) * 100).toFixed(1)),
  }));

  // Sort descending by count, then alphabetically
  items.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.word.localeCompare(b.word);
  });

  return items.slice(0, maxResults);
}

/**
 * Simple fast hash for text state tracking (detects if user edited text since check)
 */
export function hashText(text: string): string {
  if (!text) return 'empty';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${hash}_${text.length}`;
}
