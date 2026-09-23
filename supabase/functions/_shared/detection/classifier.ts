import { classifierModel } from './models/classifier_model.ts';
import { binaryClassifierModel } from './models/binary_classifier_model.ts';

export const CLASSIFIER_VERSION = (classifierModel as { version?: string }).version ?? 'unknown';

export interface ClassifierChunkScore {
  start: number;
  end: number;
  aiProbability: number;
  classProbabilities: Record<string, number>;
  textPreview: string;
}

export interface ClassifierClassProbability {
  className: string;
  probability: number;
}

export interface ClassifierResult {
  available: boolean;
  aiProbability: number;
  confidence: number; // std dev of chunk scores, scaled 0-100
  chunkScores: ClassifierChunkScore[];
  classifierVersion: string;
  languageModel: string;
  classProbabilities: Record<string, number>;
}

interface LanguageModel {
  vocab: string[];
  idf: number[];
  weights: number[][]; // shape (vocab, classes)
  biases: number[];
  classes: string[];
  maxFeatures: number;
  ngramRange: [number, number];
  trainingSamples: number;
}

interface ModelPackage {
  version: string;
  type: string;
  languages: string[];
  languageModels: Record<string, LanguageModel>;
}

let PKG: ModelPackage | undefined;
let BINARY_PKG:
  | { version: string; type: string; languages: string[]; languageModels: Record<string, BinaryLanguageModel> }
  | undefined;
const VOCAB_INDEX: Record<string, Record<string, number>> = {};
const BINARY_VOCAB_INDEX: Record<string, Record<string, number>> = {};

interface BinaryLanguageModel {
  vocab: string[];
  idf: number[];
  coef: number[];
  intercept: number;
  maxFeatures: number;
  ngramRange: [number, number];
  trainingSamples: number;
}

async function loadPackage(): Promise<ModelPackage> {
  if (PKG) return PKG;
  // Use the embedded TS module so the model data is included in the Edge Function bundle.
  PKG = classifierModel as unknown as ModelPackage;
  return PKG;
}

async function loadBinaryPackage(): Promise<{
  version: string;
  type: string;
  languages: string[];
  languageModels: Record<string, BinaryLanguageModel>;
}> {
  if (BINARY_PKG) return BINARY_PKG;
  // Use the embedded TS module so the model data is included in the Edge Function bundle.
  BINARY_PKG = binaryClassifierModel as unknown as {
    version: string;
    type: string;
    languages: string[];
    languageModels: Record<string, BinaryLanguageModel>;
  };
  return BINARY_PKG;
}

function buildVocabIndex(languageCode: string, model: LanguageModel) {
  const map: Record<string, number> = {};
  for (let i = 0; i < model.vocab.length; i++) {
    map[model.vocab[i]] = i;
  }
  VOCAB_INDEX[languageCode] = map;
}

function buildBinaryVocabIndex(languageCode: string, model: BinaryLanguageModel) {
  const map: Record<string, number> = {};
  for (let i = 0; i < model.vocab.length; i++) {
    map[model.vocab[i]] = i;
  }
  BINARY_VOCAB_INDEX[languageCode] = map;
}

async function getModel(languageCode: string): Promise<LanguageModel | undefined> {
  const pkg = await loadPackage();
  const code = languageCode.toLowerCase();
  const model = pkg.languageModels[code];
  if (!model) return undefined;
  if (!VOCAB_INDEX[code]) buildVocabIndex(code, model);
  return model;
}

async function getBinaryModel(languageCode: string): Promise<BinaryLanguageModel | undefined> {
  const pkg = await loadBinaryPackage();
  const code = languageCode.toLowerCase();
  const model = pkg.languageModels[code];
  if (!model) return undefined;
  if (!BINARY_VOCAB_INDEX[code]) buildBinaryVocabIndex(code, model);
  return model;
}

function sigmoid(z: number): number {
  if (z >= 0) {
    return 1 / (1 + Math.exp(-z));
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

function* charNgrams(text: string, minN: number, maxN: number): Generator<string> {
  const lowered = text.toLowerCase();
  for (let n = minN; n <= maxN; n++) {
    if (lowered.length < n) continue;
    for (let i = 0; i <= lowered.length - n; i++) {
      yield lowered.substring(i, i + n);
    }
  }
}

function scoreBinaryChunk(text: string, model: BinaryLanguageModel, vocabMap: Record<string, number>): number {
  const counts: Record<string, number> = {};
  for (const gram of charNgrams(text, model.ngramRange[0], model.ngramRange[1])) {
    if (vocabMap[gram] === undefined) continue;
    counts[gram] = (counts[gram] || 0) + 1;
  }
  if (Object.keys(counts).length === 0) return 0.5;

  let logit = model.intercept;
  for (const [gram, count] of Object.entries(counts)) {
    const idx = vocabMap[gram];
    const tf = Math.log(1 + count);
    const idf = model.idf[idx];
    logit += tf * idf * model.coef[idx];
  }
  return sigmoid(logit);
}

function scoreClasses(
  text: string,
  model: LanguageModel,
  vocabMap: Record<string, number>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const gram of charNgrams(text, model.ngramRange[0], model.ngramRange[1])) {
    if (vocabMap[gram] === undefined) continue;
    counts[gram] = (counts[gram] || 0) + 1;
  }
  const K = model.classes.length;
  const logits = new Float32Array(K);
  for (const [gram, count] of Object.entries(counts)) {
    const idx = vocabMap[gram];
    const tf = Math.log(1 + count);
    const idf = model.idf[idx];
    for (let k = 0; k < K; k++) {
      logits[k] += tf * idf * model.weights[idx][k];
    }
  }
  for (let k = 0; k < K; k++) {
    logits[k] += model.biases[k];
  }

  // Softmax
  const maxLogit = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - maxLogit));
  const sumExp = exps.reduce((a, b) => a + b, 0);
  const probs: Record<string, number> = {};
  for (let k = 0; k < K; k++) {
    probs[model.classes[k]] = exps[k] / sumExp;
  }
  return probs;
}

function splitChunks(text: string, targetChars = 1000, overlapChars = 100): { text: string; start: number; end: number }[] {
  if (text.length <= targetChars) {
    return [{ text, start: 0, end: text.length }];
  }
  // Prefer paragraph boundaries.
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const chunks: { text: string; start: number; end: number }[] = [];
  let cursor = 0;
  let buffer = '';
  let bufferStart = 0;

  const flush = (forceEnd = -1) => {
    if (buffer.length > 0) {
      chunks.push({
        text: buffer,
        start: bufferStart,
        end: forceEnd >= 0 ? forceEnd : bufferStart + buffer.length,
      });
      buffer = '';
    }
  };

  for (const p of paragraphs) {
    const idx = text.indexOf(p, cursor);
    const start = idx >= 0 ? idx : cursor;
    const end = start + p.length;
    cursor = end;

    if (buffer.length + p.length + 1 <= targetChars) {
      if (buffer.length === 0) bufferStart = start;
      buffer += (buffer.length ? '\n\n' : '') + p;
    } else {
      flush(start - 1);
      buffer = p;
      bufferStart = start;
    }
  }
  flush();

  // If a paragraph is huge, split on sentences.
  const refined: { text: string; start: number; end: number }[] = [];
  for (const chunk of chunks) {
    if (chunk.text.length <= targetChars * 1.5) {
      refined.push(chunk);
      continue;
    }
    const sentences = chunk.text.match(/[^.!?。？！]+[.!?。？！]+/g) || [chunk.text];
    let buffer2 = '';
    let start2 = chunk.start;
    for (const s of sentences) {
      const idx = chunk.text.indexOf(s, start2 - chunk.start);
      const sStart = idx >= 0 ? chunk.start + idx : start2;
      if (buffer2.length + s.length + 1 <= targetChars) {
        if (buffer2.length === 0) start2 = sStart;
        buffer2 += (buffer2.length ? ' ' : '') + s;
      } else {
        if (buffer2.length) {
          refined.push({ text: buffer2, start: start2, end: start2 + buffer2.length });
        }
        buffer2 = s;
        start2 = sStart;
      }
    }
    if (buffer2.length) {
      refined.push({ text: buffer2, start: start2, end: start2 + buffer2.length });
    }
  }

  // Add overlapping windows for long texts to smooth boundary effects.
  if (refined.length >= 3 && refined.every((c) => c.text.length >= targetChars * 0.5)) {
    const overlap: { text: string; start: number; end: number }[] = [];
    for (let i = 0; i < refined.length - 1; i++) {
      const a = refined[i];
      const b = refined[i + 1];
      const aOverlap = a.text.substring(Math.max(0, a.text.length - overlapChars));
      const bOverlap = b.text.substring(0, overlapChars);
      const text = aOverlap + ' ' + bOverlap;
      const start = Math.max(a.start, a.end - overlapChars);
      const end = Math.min(b.end, b.start + overlapChars);
      overlap.push({ text, start, end });
    }
    return [...refined, ...overlap];
  }

  return refined;
}

export async function classifyWithClassifier(text: string, languageCode: string): Promise<ClassifierResult> {
  const model = await getModel(languageCode);
  const binaryModel = await getBinaryModel(languageCode);
  if (!model || model.trainingSamples < 50) {
    return {
      available: false,
      aiProbability: 50,
      confidence: 0,
      chunkScores: [],
      classifierVersion: (await loadPackage()).version,
      languageModel: languageCode,
      classProbabilities: {},
    };
  }

  const vocabMap = VOCAB_INDEX[languageCode.toLowerCase()];
  const binaryVocabMap = binaryModel ? BINARY_VOCAB_INDEX[languageCode.toLowerCase()] : undefined;
  const chunks = splitChunks(text);
  const scored: ClassifierChunkScore[] = [];
  const classSums: Record<string, number> = {};
  let weightedAiSum = 0;
  let totalWeight = 0;

  for (const chunk of chunks) {
    const classProbs = scoreClasses(chunk.text, model, vocabMap);
    const weight = chunk.text.length;
    const multiclassAiProb =
      (classProbs.ai || 0) +
      (classProbs['translated-ai'] || 0) +
      0.5 * (classProbs['human-edited-ai'] || 0) +
      0.5 * (classProbs.mixed || 0);
    const legacyBinaryAiProb = binaryModel && binaryVocabMap
      ? scoreBinaryChunk(chunk.text, binaryModel, binaryVocabMap)
      : multiclassAiProb;

    // v2 is the current five-class model and was trained on twice as many English
    // samples as the legacy v1 binary model. Keep v1 as a secondary signal rather
    // than allowing its saturated binary score to define the classifier output.
    const binaryAiProb = Math.min(1, Math.max(0, multiclassAiProb * 0.75 + legacyBinaryAiProb * 0.25));
    weightedAiSum += binaryAiProb * weight;
    totalWeight += weight;
    for (const [cls, p] of Object.entries(classProbs)) {
      classSums[cls] = (classSums[cls] || 0) + p * weight;
    }
    scored.push({
      start: chunk.start,
      end: chunk.end,
      aiProbability: Math.round(binaryAiProb * 100),
      classProbabilities: classProbs,
      textPreview: chunk.text.substring(0, 80).replace(/\s+/g, ' '),
    });
  }

  const total = totalWeight || 1;
  const aggregateClassProbs: Record<string, number> = {};
  for (const [cls, s] of Object.entries(classSums)) {
    aggregateClassProbs[cls] = Math.round((s / total) * 1000) / 1000;
  }
  // Ensure all classes are present.
  for (const cls of model.classes) {
    aggregateClassProbs[cls] ??= 0;
  }

  const meanAiProb = weightedAiSum / total;
  const meanPct = meanAiProb * 100;
  const variance = scored.reduce((sum, c) => sum + Math.pow(c.aiProbability - meanPct, 2), 0) / (scored.length || 1);
  const stdDev = Math.sqrt(variance);

  return {
    available: true,
    aiProbability: Math.round(meanPct),
    confidence: Math.round(Math.min(100, stdDev)),
    chunkScores: scored,
    classifierVersion: (await loadPackage()).version,
    languageModel: languageCode,
    classProbabilities: aggregateClassProbs,
  };
}

export async function supportedClassifierLanguages(): Promise<string[]> {
  const pkg = await loadPackage();
  return Object.keys(pkg.languageModels).filter((lang) => pkg.languageModels[lang].trainingSamples >= 50);
}
