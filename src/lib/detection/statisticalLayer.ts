import type { StatisticalProfile, DetectionWarning } from './types';
import { tokenizeWords, lexicalDiversity, mean, variance } from './linguisticLayer';

export interface StatisticalLayerResult {
  profile: StatisticalProfile;
  warnings: DetectionWarning[];
}

// Deterministic but pseudo-random seed for reproducible statistical noise per document.
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function charEntropy(text: string): number {
  const counts: Record<string, number> = {};
  for (const ch of text) counts[ch] = (counts[ch] || 0) + 1;
  const total = text.length || 1;
  let entropy = 0;
  for (const c of Object.values(counts)) {
    const p = c / total;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function ngramUniqueness(words: string[], n = 3): number {
  if (words.length < n) return 1;
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  const unique = new Set(ngrams).size;
  return unique / ngrams.length;
}

function repetitionDensity(words: string[]): number {
  if (words.length === 0) return 0;
  const counts: Record<string, number> = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  const repeats = Object.values(counts).filter((c) => c > 1).reduce((sum, c) => sum + c, 0);
  return repeats / words.length;
}

function vocabularyCompression(words: string[]): number {
  if (words.length === 0) return 0;
  const unique = new Set(words).size;
  return unique / Math.sqrt(words.length);
}

function sentenceVariance(sentenceLengths: number[]): number {
  return variance(sentenceLengths);
}

function tokenPredictabilityProxy(text: string, words: string[]): number {
  // Approximate predictability by counting common bigrams and repeated 3-grams.
  if (words.length < 3) return 0;
  const bigrams: Record<string, number> = {};
  for (let i = 0; i < words.length - 1; i++) {
    const key = `${words[i]} ${words[i + 1]}`;
    bigrams[key] = (bigrams[key] || 0) + 1;
  }
  const total = Object.keys(bigrams).length || 1;
  const repeated = Object.values(bigrams).filter((c) => c > 1).length;
  return Math.min(1, repeated / total);
}

function burstinessScore(sentenceLengths: number[]): number {
  if (sentenceLengths.length < 2) return 0;
  const avg = mean(sentenceLengths);
  if (avg === 0) return 0;
  const v = variance(sentenceLengths);
  const cv = Math.sqrt(v) / avg; // coefficient of variation
  // Humans tend to have higher CV; AI tends to have lower CV.
  return Math.min(1, cv / 0.8);
}

function computeShortTextPenalty(wordCount: number): number {
  if (wordCount >= 150) return 0;
  if (wordCount >= 80) return 0.15;
  if (wordCount >= 40) return 0.35;
  if (wordCount >= 20) return 0.55;
  return 0.75;
}

function buildNgrams(words: string[], n: number): string[] {
  if (words.length < n) return [];
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join('|'));
  }
  return ngrams;
}

function statPhraseReuse(words: string[]): number {
  if (words.length < 8) return 0;
  const fourgrams = buildNgrams(words, 4);
  if (fourgrams.length === 0) return 0;
  const counts: Record<string, number> = {};
  for (const g of fourgrams) counts[g] = (counts[g] || 0) + 1;
  const repeated = Object.values(counts).filter((c) => c > 1).reduce((sum, c) => sum + c, 0);
  return Math.min(1, repeated / fourgrams.length);
}

function statCoherence(sentences: string[]): number {
  if (sentences.length < 2) return 0;
  let total = 0;
  let pairs = 0;
  for (let i = 1; i < sentences.length; i++) {
    const a = new Set(tokenizeWords(sentences[i - 1]));
    const b = new Set(tokenizeWords(sentences[i]));
    if (a.size === 0 || b.size === 0) continue;
    let common = 0;
    for (const w of a) if (b.has(w)) common++;
    total += common / Math.max(a.size, b.size);
    pairs++;
  }
  return pairs === 0 ? 0 : total / pairs;
}

function statEditingSignal(sentences: string[], words: string[]): number {
  if (sentences.length < 3) return 0;
  let score = 0;
  // Abrupt length swings
  const lengths = sentences.map((s) => tokenizeWords(s).length).filter((l) => l > 0);
  let abruptSwings = 0;
  for (let i = 1; i < lengths.length; i++) {
    const ratio = lengths[i] / Math.max(1, lengths[i - 1]);
    if (ratio > 3.5 || ratio < 0.285) abruptSwings++;
  }
  if (abruptSwings >= 2) score += 0.25;
  // Localized n-gram inconsistency
  if (words.length >= 6) {
    const bigrams = buildNgrams(words, 2);
    const counts: Record<string, number> = {};
    for (const b of bigrams) counts[b] = (counts[b] || 0) + 1;
    const uniqueRatio = Object.keys(counts).length / bigrams.length;
    if (uniqueRatio > 0.95) score += 0.15;
  }
  return Math.min(1, score);
}

export function analyzeStatistical(text: string, languageCode: string): StatisticalLayerResult {
  const words = tokenizeWords(text);
  const wordCount = words.length;
  const sentences = text
    .replace(/([.!?।॥。！？\u0964\u0965]+)\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sentenceLengths = sentences.map((s) => tokenizeWords(s).length).filter((l) => l > 0);

  const seed = hashString(text.slice(0, 500));
  const rng = seededRandom(seed);

  // Language-specific baseline adjustments.
  let entropyScale = 5;
  let burstinessScale = 1;
  if (['zh', 'ja', 'ko', 'th', 'vi'].includes(languageCode)) {
    entropyScale = 8;
    burstinessScale = 1.2;
  } else if (['ar', 'he'].includes(languageCode)) {
    entropyScale = 6;
  }

  const rawEntropy = charEntropy(text);
  const entropy = Math.min(1, rawEntropy / entropyScale);

  const rawBurstiness = burstinessScore(sentenceLengths) / burstinessScale;
  const burstiness = Math.min(1, rawBurstiness);

  const tokenPredictability = tokenPredictabilityProxy(text, words);
  const ngramUnique = ngramUniqueness(words);
  const repDensity = repetitionDensity(words);
  const vocabCompression = Math.min(1, vocabularyCompression(words) / (languageCode === 'zh' || languageCode === 'ja' ? 15 : 8));
  const sentVariance = Math.min(1, sentenceVariance(sentenceLengths) / 100);
  const shortTextPenalty = computeShortTextPenalty(wordCount);

  const profile: StatisticalProfile = {
    entropy,
    burstiness,
    tokenPredictability,
    ngramUniqueness: ngramUnique,
    repetitionDensity: repDensity,
    vocabularyCompression: vocabCompression,
    sentenceVariance: sentVariance,
    shortTextPenalty,
    coherenceScore: statCoherence(sentences),
    phraseReuseScore: statPhraseReuse(words),
    editingSignalScore: statEditingSignal(sentences, words),
  };

  const warnings: DetectionWarning[] = [];
  if (wordCount < 40) {
    warnings.push({
      type: 'short-text',
      severity: 'warning',
      message: 'Text is short. Statistical signals are less reliable; confidence is reduced.',
    });
  }
  if (entropy > 0.85) {
    warnings.push({
      type: 'low-context',
      severity: 'info',
      message: 'High character entropy suggests unusual characters or mixed symbols, which can affect detection.',
    });
  }

  // Add tiny deterministic noise so repeated analyses of identical text produce stable but not identical values.
  for (const key of Object.keys(profile) as Array<keyof StatisticalProfile>) {
    if (key !== 'shortTextPenalty') {
      profile[key] = Math.min(1, Math.max(0, profile[key] + (rng() - 0.5) * 0.03));
    }
  }

  return { profile, warnings };
}
