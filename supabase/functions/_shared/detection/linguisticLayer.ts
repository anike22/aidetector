import type { LinguisticProfile, SentenceVerdict, ParagraphVerdict } from './types.ts';
import {
  SPANISH_AI_TRANSITIONS,
  SPANISH_FORMULAIC_STARTS,
  SPANISH_FORMULAIC_ENDS,
  SPANISH_AI_BOILERPLATE,
  ARABIC_AI_TRANSITIONS,
  ARABIC_FORMULAIC_STARTS,
  ARABIC_FORMULAIC_ENDS,
  ARABIC_AI_BOILERPLATE,
} from './calibration.ts';

export interface LinguisticLayerResult {
  profile: LinguisticProfile;
  sentenceFeatures: { aiSignal: number; humanSignal: number; mixedSignal: number }[];
  paragraphFeatures: { aiSignal: number; humanSignal: number; mixedSignal: number }[];
}

const AI_TRANSITIONS = [
  'furthermore', 'moreover', 'consequently', 'therefore', 'additionally', 'in conclusion', 'in summary',
  'it is important to note', 'it should be noted', 'it is worth noting', 'as a result', 'for instance',
  'on the other hand', 'in addition', 'more importantly', 'lastly', 'finally', 'overall', 'in this context',
  'in other words', 'with that said', 'having said that', 'to put it simply', 'at the same time',
  // Spanish
  'además', 'por lo tanto', 'en consecuencia', 'en conclusión', 'en resumen', 'es importante destacar',
  'por ejemplo', 'por otro lado', 'a su vez', 'asimismo', 'en definitiva', 'en el ámbito de', 'en este sentido',
  // French
  'en outre', 'de plus', 'par conséquent', 'par exemple', 'en conclusion', 'en résumé', 'dans ce contexte',
  // German
  'außerdem', 'darüber hinaus', 'folglich', 'zum beispiel', 'zusammenfassend', 'insgesamt', 'in diesem zusammenhang',
  // Portuguese
  'além disso', 'portanto', 'consequentemente', 'por exemplo', 'em conclusão', 'em resumo', 'neste contexto',
  // Italian
  'inoltre', 'quindi', 'pertanto', 'per esempio', 'in conclusione', 'in sintesi', 'in questo contesto',
  // Chinese simplified phrases
  '此外', '因此', '综上所述', '总而言之', '值得注意的是', '例如', '另一方面', '总的来说',
  // Japanese
  'さらに', 'したがって', '要約すると', '言い換えれば', '一方',
  // Arabic
  'بالإضافة إلى ذلك', 'لذلك', 'في الختام', 'على سبيل المثال', 'من ناحية أخرى',
  // Yoruba
  'tí ẹ sì mọ̀', 'nítorí náà', 'pápá jùlọ', 'fún àpẹẹrẹ',
  // Hausa
  'da kuma', 'saboda haka', 'a ƙarshe', 'misali',
  // Igbo
  'ọzọkwa', 'nke a bụ', 'n\'ikpeazụ', 'dị ka ọmụmaatụ',
  // Spanish (extended)
  ...SPANISH_AI_TRANSITIONS,
  // Arabic (extended)
  ...ARABIC_AI_TRANSITIONS,
];

const FORMULAIC_STARTS = [
  'in this essay', 'this essay will', 'the purpose of this', 'this paper aims to',
  'in recent years', 'with the development of', 'in the modern era', 'in today\'s world',
  'in recent decades', 'as we all know', 'it is widely accepted', 'there is no doubt',
  'the rapid development of', 'the rise of artificial intelligence', 'this article explores',
  // Spanish
  'en la actualidad', 'en los últimos años', 'en el siglo', 'la inteligencia artificial',
  'en el ámbito de', 'en este ensayo', 'el objetivo de este', 'es importante señalar',
  'el rápido desarrollo de', 'este artículo explora',
  // French
  'dans le monde actuel', 'aujourd\'hui', 'au cours des dernières années', 'l\'intelligence artificielle',
  'cet article explore', 'il est important de noter',
  // German
  'in der heutigen zeit', 'in den letzten jahren', 'künstliche intelligenz',
  'dieser artikel untersucht', 'es ist wichtig zu betonen',
  // Portuguese
  'na atualidade', 'nos últimos anos', 'inteligência artificial',
  'este artigo explora', 'é importante destacar',
  // Italian
  'nell\'era moderna', 'negli ultimi anni', 'intelligenza artificiale',
  'questo articolo esplora', 'è importante sottolineare',
  // Spanish (extended)
  ...SPANISH_FORMULAIC_STARTS,
  // Arabic (extended)
  ...ARABIC_FORMULAIC_STARTS,
];

const FORMULAIC_ENDS = [
  'in conclusion', 'to sum up', 'in summary', 'overall', 'in closing', 'to conclude',
  'taking everything into account', 'all things considered', 'in light of the above',
  'in conclusion', 'this essay has shown', 'these findings suggest',
  // Spanish
  'en conclusión', 'en resumen', 'en definitiva', 'en última instancia', 'en síntesis',
  'este ensayo ha demostrado', 'estos hallazgos sugieren',
  // French
  'en conclusion', 'en résumé', 'globalement', 'cette étude a montré',
  // German
  'zusammenfassend', 'insgesamt', 'abschließend', 'diese studie hat gezeigt',
  // Portuguese
  'em conclusão', 'em resumo', 'em síntese', 'este estudo mostrou',
  // Italian
  'in conclusione', 'in sintesi', 'in generale', 'questo studio ha mostrato',
  // Spanish (extended)
  ...SPANISH_FORMULAIC_ENDS,
  // Arabic (extended)
  ...ARABIC_FORMULAIC_ENDS,
];

const AI_BOILERPLATE = [
  'it is important to note that', 'it should be noted that', 'it is worth noting that',
  'plays a crucial role', 'plays an important role', 'plays a significant role',
  'a wide range of', 'a variety of', 'a number of', 'in order to',
  'this is because', 'due to the fact that', 'in the era of', 'with the advent of',
  // Spanish
  'desempeña un papel crucial', 'desempeña un papel importante', 'una amplia gama de',
  'debido a que', 'en la era de', 'con la llegada de',
  // French
  'joue un rôle crucial', 'joue un rôle important', 'un large éventail de',
  'en raison du fait que', 'à l\'ère de', 'avec l\'avènement de',
  // German
  'spielt eine entscheidende rolle', 'spielt eine wichtige rolle', 'eine breite palette von',
  'aufgrund der tatsache, dass', 'im zeitalter von', 'mit dem aufkommen von',
  // Spanish (extended)
  ...SPANISH_AI_BOILERPLATE,
  // Arabic (extended)
  ...ARABIC_AI_BOILERPLATE,
];

export function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?।॥。！？\u0964\u0965]+)\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
}

function tokenizeWords(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
}

function lexicalDiversity(words: string[]): number {
  if (words.length === 0) return 0;
  const unique = new Set(words).size;
  return unique / words.length;
}

function repetitionScore(words: string[]): number {
  if (words.length === 0) return 0;
  const counts: Record<string, number> = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  const repeated = Object.values(counts).filter((c) => c > 1).length;
  return repeated / words.length;
}

function transitionPredictability(text: string): number {
  const lower = text.toLowerCase();
  let matches = 0;
  for (const t of AI_TRANSITIONS) {
    const re = new RegExp(`(?:^|[^\\p{L}])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^\\p{L}]|$)`, 'gu');
    const m = lower.match(re);
    if (m) matches += m.length;
  }
  const words = tokenizeWords(text).length || 1;
  return Math.min(1, matches / Math.sqrt(words));
}

function syntacticRegularity(sentences: string[]): number {
  // Measure how often sentences start with the same grammatical pattern.
  if (sentences.length < 3) return 0;
  const firstWords = sentences.map((s) => s.split(/\s+/)[0]?.toLowerCase() || '');
  const counts: Record<string, number> = {};
  for (const w of firstWords) counts[w] = (counts[w] || 0) + 1;
  const max = Math.max(...Object.values(counts));
  return max / sentences.length;
}

function semanticRedundancy(paragraphs: string[]): number {
  if (paragraphs.length < 2) return 0;
  const wordSets = paragraphs.map((p) => new Set(tokenizeWords(p)));
  let overlap = 0;
  let pairs = 0;
  for (let i = 0; i < wordSets.length; i++) {
    for (let j = i + 1; j < wordSets.length; j++) {
      const a = wordSets[i];
      const b = wordSets[j];
      let common = 0;
      for (const w of a) if (b.has(w)) common++;
      overlap += common / Math.max(a.size, b.size, 1);
      pairs++;
    }
  }
  return pairs === 0 ? 0 : Math.min(1, overlap / pairs);
}

function punctuationConsistency(sentences: string[]): number {
  if (sentences.length === 0) return 0;
  const counts = sentences.map((s) => (s.match(/[.,;:!?]/g) || []).length);
  const avg = mean(counts);
  const v = variance(counts);
  return avg === 0 ? 0 : Math.min(1, Math.sqrt(v) / avg);
}

function paragraphSymmetry(paragraphs: string[]): number {
  if (paragraphs.length < 2) return 0;
  const lengths = paragraphs.map((p) => tokenizeWords(p).length);
  const avg = mean(lengths);
  const v = variance(lengths);
  return avg === 0 ? 0 : Math.min(1, Math.sqrt(v) / avg);
}

function formulaicScore(text: string, patterns: string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const p of patterns) {
    const re = new RegExp(`(?:^|[^\\p{L}])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^\\p{L}]|$)`, 'gu');
    const m = lower.match(re);
    if (m) hits += m.length;
  }
  const words = tokenizeWords(text).length || 1;
  return Math.min(1, hits / Math.max(1, words / 80));
}

function balancedPhrasingScore(sentences: string[]): number {
  // AI text often uses parallel structures such as "not only X but also Y".
  let score = 0;
  const patterns = [
    /not only\s+.+?\s+but also/gi,
    /both\s+.+?\s+and/gi,
    /either\s+.+?\s+or/gi,
    /neither\s+.+?\s+nor/gi,
    /on the one hand\s+.+?\s+on the other hand/gi,
  ];
  for (const s of sentences) {
    for (const p of patterns) {
      if (p.test(s)) score += 1;
    }
  }
  return Math.min(1, score / Math.max(1, sentences.length / 3));
}

function vocabularyDistributionScore(words: string[]): number {
  if (words.length === 0) return 0;
  const counts: Record<string, number> = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  const frequencies = Object.values(counts).sort((a, b) => b - a);
  if (frequencies.length < 2) return 0;
  // Compare observed top-word frequency to a healthy human Zipf-like baseline.
  const topShare = frequencies[0] / words.length;
  const expectedTopShare = 0.06 + 0.5 / Math.sqrt(words.length);
  return Math.min(1, Math.abs(topShare - expectedTopShare) / expectedTopShare);
}

function discourseStructureScore(paragraphs: string[]): number {
  if (paragraphs.length < 2) return 0;
  const positions = paragraphs.map((_, i) => i / (paragraphs.length - 1));
  const ideal = [0, 0.5, 1];
  let score = 0;
  for (const p of positions) {
    const nearest = ideal.reduce((min, v) => Math.min(min, Math.abs(p - v)), 1);
    score += nearest;
  }
  return Math.min(1, score / paragraphs.length);
}

function buildNgrams(words: string[], n: number): string[] {
  if (words.length < n) return [];
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join('|'));
  }
  return ngrams;
}

function phraseReuseScore(words: string[]): number {
  if (words.length < 8) return 0;
  const fourgrams = buildNgrams(words, 4);
  if (fourgrams.length === 0) return 0;
  const counts: Record<string, number> = {};
  for (const g of fourgrams) counts[g] = (counts[g] || 0) + 1;
  const repeated = Object.values(counts).filter((c) => c > 1).length;
  return Math.min(1, repeated / (fourgrams.length * 0.15));
}

function wordSetSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  for (const w of a) if (b.has(w)) common++;
  return common / Math.max(a.size, b.size);
}

function contextualCoherence(sentences: string[]): number {
  if (sentences.length < 2) return 0;
  const sets = sentences.map((s) => new Set(tokenizeWords(s)));
  let total = 0;
  let pairs = 0;
  for (let i = 1; i < sets.length; i++) {
    total += wordSetSimilarity(sets[i - 1], sets[i]);
    pairs++;
  }
  return pairs === 0 ? 0 : total / pairs;
}

function discourseFlowScore(sentences: string[]): number {
  if (sentences.length < 3) return 0;
  const lower = sentences.map((s) => s.toLowerCase());
  let flow = 0;
  const connectives = new Set(AI_TRANSITIONS);
  for (let i = 1; i < lower.length; i++) {
    const firstTwo = lower[i].split(/\s+/).slice(0, 2).join(' ');
    if (connectives.has(firstTwo)) flow += 1;
  }
  return Math.min(1, flow / (lower.length * 0.4));
}

function stylisticVariationScore(sentences: string[]): number {
  if (sentences.length < 3) return 0;
  const lengths = sentences.map((s) => tokenizeWords(s).length).filter((l) => l > 0);
  if (lengths.length < 3) return 0;
  const m = mean(lengths);
  const v = variance(lengths);
  const cv = m === 0 ? 0 : Math.sqrt(v) / m;
  // Normalize around typical human variation (CV ~0.5)
  return Math.min(1, cv / 0.7);
}

function humanEditingScore(sentences: string[]): number {
  if (sentences.length < 3) return 0;
  let score = 0;
  // Abrupt style shifts: sentence length swings and inconsistent punctuation.
  const lengths = sentences.map((s) => tokenizeWords(s).length).filter((l) => l > 0);
  let abruptSwings = 0;
  if (lengths.length >= 3) {
    for (let i = 1; i < lengths.length; i++) {
      const ratio = lengths[i] / Math.max(1, lengths[i - 1]);
      if (ratio > 3.5 || ratio < 0.285) abruptSwings++;
    }
  }
  // Only flag when multiple abrupt swings appear, avoiding one-off creative variation.
  if (abruptSwings >= 2) score += 0.25;
  // Inconsistent punctuation density across adjacent sentences.
  const punctCounts = sentences.map((s) => (s.match(/[.,;:!?]/g) || []).length);
  const m = mean(punctCounts);
  let punctOutliers = 0;
  for (const c of punctCounts) {
    if (m > 0 && Math.abs(c - m) > m * 1.2) punctOutliers++;
  }
  if (punctOutliers >= 2) score += 0.2;
  // Synonym-substitution-like low n-gram uniqueness in otherwise formal text.
  const words = tokenizeWords(sentences.join(' '));
  if (words.length >= 6) {
    const bigrams = buildNgrams(words, 2);
    const counts: Record<string, number> = {};
    for (const b of bigrams) counts[b] = (counts[b] || 0) + 1;
    const uniqueRatio = Object.keys(counts).length / bigrams.length;
    if (uniqueRatio > 0.95) score += 0.15;
  }
  return Math.min(1, score);
}

function aiBoilerplateScore(text: string): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const phrase of AI_BOILERPLATE) {
    const re = new RegExp(`(?:^|[^\\p{L}])${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^\\p{L}]|$)`, 'gu');
    const m = lower.match(re);
    if (m) hits += m.length;
  }
  const words = tokenizeWords(text).length || 1;
  return Math.min(1, hits / Math.max(1, words / 100));
}

// ---------------------------------------------------------------------------
// specificityScore: measures presence of concrete, specific details that are
// strong human-writing indicators. AI tends toward generic abstractions;
// humans cite numbers, dates, proper nouns, named entities, and measurements.
// ---------------------------------------------------------------------------
function specificityScore(text: string, sentences: string[]): number {
  let score = 0;
  const totalSents = sentences.length || 1;

  // Numbers and measurements (percentages, years, quantities)
  const numberPattern = /\b\d{1,3}(?:[,.]\d+)*\s*(?:%|percent|kg|km|ml|mb|gb|tb|ms|px|°|degrees?)?\b/gi;
  const numberMatches = text.match(numberPattern) || [];
  score += Math.min(0.4, numberMatches.length / Math.max(1, totalSents) * 0.12);

  // Proper nouns: capitalized words not at sentence start
  const properNounMatches = text.match(/(?<=[.!?]\s{1,3}|\n|^)(?:[A-Z][a-z]+\s){0,2}[A-Z][a-z]+|[A-Z]{2,}/g) || [];
  score += Math.min(0.3, properNounMatches.length / Math.max(1, totalSents) * 0.06);

  // Citations and references (academic human signal)
  const citationPattern = /\(\s*[A-Z][a-z]+(?:\s+(?:et al\.?|&|and)\s+[A-Z][a-z]+)?\s*,?\s*\d{4}\s*\)|(?:\[\d+\])/g;
  const citationMatches = text.match(citationPattern) || [];
  score += Math.min(0.3, citationMatches.length * 0.1);

  // Specific dates
  const datePattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/gi;
  const dateMatches = text.match(datePattern) || [];
  score += Math.min(0.2, dateMatches.length * 0.08);

  // URLs, DOIs, file paths (specific references)
  const refPattern = /https?:\/\/\S+|doi:\S+|\/[a-z]+\/[a-z]/gi;
  const refMatches = text.match(refPattern) || [];
  score += Math.min(0.2, refMatches.length * 0.07);

  return Math.min(1, score);
}

// ---------------------------------------------------------------------------
// personalVoiceScore: measures authentic human authorship signals.
// Distinguishes genuine first-person voice, hedging, and empirical language
// from generic hedges that AI also uses ("may", "might", "could").
// ---------------------------------------------------------------------------
function personalVoiceScore(text: string, sentences: string[]): number {
  let score = 0;
  const lower = text.toLowerCase();
  const totalSents = sentences.length || 1;

  // Strong first-person markers: "I found", "we show", "I argue", research voice
  const researchVoice = [
    'i found', 'i argue', 'i believe', 'i think', 'i noticed', 'i observed',
    'we found', 'we show', 'we argue', 'we propose', 'we demonstrate', 'we present',
    'in my view', 'in our view', 'from my experience', 'from our experience',
    'my research', 'our research', 'my analysis', 'our analysis',
    'i have', 'we have', 'i had', 'we had',
  ];
  for (const phrase of researchVoice) {
    if (lower.includes(phrase)) score += 0.08;
  }
  score = Math.min(0.5, score);

  // Contradictions and counterarguments: strong human critical-thinking signal
  const counterArgPatterns = [
    /however,?\s+(?:this|these|the|our|my)/i,
    /despite\s+(?:this|these|the|our)/i,
    /contrary\s+to/i,
    /on\s+the\s+contrary/i,
    /this\s+(?:does\s+not|doesn't|cannot|can't)\s+(?:mean|imply|suggest)/i,
    /(?:while|although|even\s+though)\s+.{5,50}(?:,|;)\s+(?:I|we)/i,
  ];
  for (const p of counterArgPatterns) {
    if (p.test(text)) score += 0.06;
  }
  score = Math.min(0.7, score);

  // Specific technical hedging (academic, not generic AI hedging)
  const academicHedge = [
    'to our knowledge', 'to the best of our knowledge', 'as far as we know',
    'the evidence suggests', 'the data indicate', 'the results show',
    'it appears that', 'it seems likely', 'tentatively',
  ];
  for (const phrase of academicHedge) {
    if (lower.includes(phrase)) score += 0.05;
  }
  score = Math.min(0.8, score);

  // Personal anecdotes or experiential language
  const experiential = /\b(?:when\s+I|after\s+I|before\s+I|once\s+I|as\s+I|while\s+I)\b/gi;
  const expMatches = text.match(experiential) || [];
  score += Math.min(0.2, expMatches.length * 0.08);

  // Contractions suggest natural human writing
  const contractionPattern = /\b(?:don't|doesn't|didn't|can't|couldn't|won't|wouldn't|isn't|aren't|wasn't|weren't|I'm|I've|I'd|I'll|we're|we've|we'd|that's|it's|there's)\b/gi;
  const contractionMatches = text.match(contractionPattern) || [];
  score += Math.min(0.15, contractionMatches.length / Math.max(1, totalSents) * 0.05);

  return Math.min(1, score);
}

export function analyzeLinguistic(text: string): LinguisticLayerResult {
  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);
  const words = tokenizeWords(text);

  const sentenceLengths = sentences.map((s) => tokenizeWords(s).length).filter((l) => l > 0);
  const avgSentenceLength = mean(sentenceLengths);
  const sentenceLengthVariance = variance(sentenceLengths);

  const profile: LinguisticProfile = {
    avgSentenceLength,
    sentenceLengthVariance,
    lexicalDiversity: lexicalDiversity(words),
    repetitionScore: repetitionScore(words),
    transitionPredictability: transitionPredictability(text),
    syntacticRegularity: syntacticRegularity(sentences),
    semanticRedundancy: semanticRedundancy(paragraphs),
    punctuationConsistency: punctuationConsistency(sentences),
    paragraphSymmetry: paragraphSymmetry(paragraphs),
    formulaicStartScore: formulaicScore(text.slice(0, Math.min(text.length, 300)), FORMULAIC_STARTS),
    formulaicEndScore: formulaicScore(text.slice(-Math.min(text.length, 300)), FORMULAIC_ENDS),
    balancedPhrasingScore: balancedPhrasingScore(sentences),
    vocabularyDistributionScore: vocabularyDistributionScore(words),
    discourseStructureScore: discourseStructureScore(paragraphs),
    contextualCoherence: contextualCoherence(sentences),
    phraseReuseScore: phraseReuseScore(words),
    discourseFlowScore: discourseFlowScore(sentences),
    stylisticVariationScore: stylisticVariationScore(sentences),
    humanEditingScore: humanEditingScore(sentences),
    aiBoilerplateScore: aiBoilerplateScore(text),
    specificityScore: specificityScore(text, sentences),
    personalVoiceScore: personalVoiceScore(text, sentences),
  };

  const sentenceFeatures = sentences.map((s) => sentenceSignals(s, profile));
  const paragraphFeatures = paragraphs.map((p) => paragraphSignals(p, profile));

  return { profile, sentenceFeatures, paragraphFeatures };
}

function sentenceSignals(sentence: string, docProfile: LinguisticProfile): { aiSignal: number; humanSignal: number; mixedSignal: number } {
  const words = tokenizeWords(sentence);
  const length = words.length;
  const lower = sentence.toLowerCase();

  let aiSignal = 0;
  let humanSignal = 0;
  let mixedSignal = 0;

  // Length uniformity — cap contribution to avoid dominating the signal.
  if (docProfile.avgSentenceLength > 0) {
    const z = Math.abs(length - docProfile.avgSentenceLength) / Math.sqrt(docProfile.sentenceLengthVariance + 1);
    if (z < 0.5) aiSignal += 0.08; // unusually uniform
    else if (z > 1.5) humanSignal += 0.06;
  }

  // Transition words — cap at one hit per sentence (0.12 max).
  // Previously was unbounded: a sentence with 3 transitions would add 0.45.
  // Formal human writing uses transitions legitimately; cap prevents over-flagging.
  let transitionHit = false;
  for (const t of AI_TRANSITIONS) {
    if (lower.includes(t)) { transitionHit = true; break; }
  }
  if (transitionHit) aiSignal += 0.12;

  // Formulaic starts within sentence
  for (const p of FORMULAIC_STARTS) {
    if (lower.startsWith(p)) { aiSignal += 0.15; break; } // cap at one match
  }

  // Personal markers — expanded to cover research voice
  if (/\b(i |my |we |our |me |us )\b/i.test(sentence)) humanSignal += 0.15;
  if (/\b(i found|i argue|i believe|we found|we show|we argue|we propose|in my view|in our view)\b/i.test(sentence)) humanSignal += 0.12;
  if (/\b(!|\?|actually|honestly|frankly|surprisingly|weirdly)\b/i.test(sentence)) humanSignal += 0.10;

  // Emotional or sensory language
  if (/\b(love|hate|angry|happy|sad|excited|worried|amazing|terrible|beautiful|ugly)\b/i.test(sentence)) humanSignal += 0.10;

  // Specificity: numbers, proper nouns, citations → strong human signal at sentence level
  if (/\b\d{1,3}(?:[,.]\d+)*\s*(?:%|percent|kg|km|ml|mb|gb|°)?/.test(sentence)) humanSignal += 0.08;
  if (/\([A-Z][a-z]+(?:,?\s+\d{4})?\)|\[\d+\]/.test(sentence)) humanSignal += 0.10; // citation

  // Contractions: natural human writing
  if (/\b(?:don't|doesn't|didn't|can't|I'm|I've|I'd|we're|we've|that's|it's|there's)\b/i.test(sentence)) humanSignal += 0.08;

  // Long complex words typical of domain expertise (not generic AI hedging)
  const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / Math.max(1, words.length);
  if (avgWordLen > 6.5) humanSignal += 0.05; // specialist vocabulary
  if (avgWordLen < 4 && length > 8) aiSignal += 0.05;

  // Generic AI hedging (distinguish from academic hedging by lack of specificity)
  const hasAcademicSpecificity = /\b\d+|\([A-Z]|\[\d+\]/.test(sentence);
  if (!hasAcademicSpecificity && /\b(may|might|could|potentially|arguably|generally|typically|often|some|many|several)\b/i.test(sentence)) {
    aiSignal += 0.05;
  }

  // AI boilerplate phrases
  for (const phrase of AI_BOILERPLATE) {
    if (lower.includes(phrase)) { aiSignal += 0.12; break; } // cap at one match
  }

  // Mixed signal only when BOTH strong AI and human patterns clearly coexist
  if (aiSignal > 0.20 && humanSignal > 0.15) mixedSignal += 0.15;

  return { aiSignal: Math.min(1, aiSignal), humanSignal: Math.min(1, humanSignal), mixedSignal: Math.min(1, mixedSignal) };
}

function paragraphSignals(paragraph: string, docProfile: LinguisticProfile): { aiSignal: number; humanSignal: number; mixedSignal: number } {
  const sentences = splitSentences(paragraph);
  const words = tokenizeWords(paragraph);
  let aiSignal = 0;
  let humanSignal = 0;
  let mixedSignal = 0;

  const localDiversity = lexicalDiversity(words);
  if (localDiversity < 0.35) aiSignal += 0.20;
  else if (localDiversity > 0.55) humanSignal += 0.15; // increased from 0.10

  const localTransition = transitionPredictability(paragraph);
  // Cap transition contribution: formal humans also use transitions.
  aiSignal += Math.min(0.15, localTransition * 0.25); // was 0.3 (no cap)

  const localStart = formulaicScore(paragraph.slice(0, 150), FORMULAIC_STARTS);
  const localEnd = formulaicScore(paragraph.slice(-150), FORMULAIC_ENDS);
  aiSignal += (localStart + localEnd) * 0.15; // was 0.2

  const lengths = sentences.map((s) => tokenizeWords(s).length);
  const localVariance = variance(lengths);
  if (localVariance < 5 && sentences.length > 2) aiSignal += 0.15;
  if (localVariance > 15) humanSignal += 0.12; // was: > 20 → 0.10

  // Local burstiness: high CV inside the paragraph is a human signal.
  if (sentences.length >= 3) {
    const localMean = mean(lengths);
    const localCV = localMean > 0 ? Math.sqrt(localVariance) / localMean : 0;
    if (localCV > 0.55) humanSignal += 0.10;
    else if (localCV < 0.20) aiSignal += 0.08;
  }

  // Specificity within paragraph (numbers, citations → human)
  const hasNumbers = /\b\d{2,}/.test(paragraph);
  const hasCitations = /\([A-Z][a-z]+,?\s*\d{4}\)|\[\d+\]/.test(paragraph);
  if (hasNumbers) humanSignal += 0.08;
  if (hasCitations) humanSignal += 0.12;

  if (aiSignal > 0.3 && humanSignal > 0.15) mixedSignal += 0.15;

  return { aiSignal: Math.min(1, aiSignal), humanSignal: Math.min(1, humanSignal), mixedSignal: Math.min(1, mixedSignal) };
}

export { tokenizeWords, lexicalDiversity, mean, variance };
