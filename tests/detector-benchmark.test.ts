import { describe, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { analyzeAdvancedText } from '../src/lib/detection/engine';

const ROOT = process.cwd();
const SPLITS_DIR = path.join(ROOT, 'tasks', 'classifier', 'data', 'splits');
const MAX_PER_SPLIT = 60;

interface Record {
  text: string;
  origin: 'human' | 'ai';
  language: string;
}

function loadJsonl(split: string, lang: string): Record[] {
  const file = path.join(SPLITS_DIR, split, `${lang}.jsonl`);
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
  const records = lines.map((l) => JSON.parse(l)) as Record[];
  return records.filter((r) => r.origin === 'human' || r.origin === 'ai').slice(0, MAX_PER_SPLIT);
}

function isAiVerdict(verdict: string): boolean {
  return verdict === 'likely-ai' || verdict === 'mostly-ai-human-edited';
}

function isHumanVerdict(verdict: string): boolean {
  return verdict === 'likely-human' || verdict === 'mostly-human-ai-assisted';
}

async function evaluate(records: Record[], lang: string) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let aiCount = 0;
  let humanCount = 0;
  const errors: string[] = [];
  for (const rec of records) {
    try {
      const result = await analyzeAdvancedText(rec.text, { contentType: 'auto' });
      const predAi = isAiVerdict(result.overall.verdict);
      const predHuman = isHumanVerdict(result.overall.verdict);
      if (rec.origin === 'ai') {
        aiCount++;
        if (predAi) tp++;
        else if (predHuman) fn++;
        else fn++;
      } else {
        humanCount++;
        if (predHuman) tn++;
        else if (predAi) fp++;
        else fp++;
      }
    } catch (e) {
      errors.push(String(e));
      if (rec.origin === 'ai') fn++;
      else fp++;
    }
  }
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const specificity = tn / (tn + fp) || 0;
  const f1 = (2 * precision * recall) / (precision + recall) || 0;
  const accuracy = (tp + tn) / records.length || 0;
  return {
    lang,
    samples: records.length,
    ai: aiCount,
    human: humanCount,
    tp,
    fp,
    tn,
    fn,
    accuracy,
    precision,
    recall,
    specificity,
    f1,
    errors: errors.length,
  };
}

const PERTURBATIONS: Record<string, (text: string) => string> = {
  'humanize-style': (text) =>
    text
      .replace(/furthermore/gi, 'plus')
      .replace(/in conclusion/gi, 'so, basically')
      .replace(/additionally/gi, 'also')
      .replace(/\. /g, '. ')
      .replace(/^(\w)/, (m) => m.toLowerCase()) + ' Like, you know what I mean.',
  'add-typos': (text) =>
    text
      .split(' ')
      .map((w, i) => (i % 12 === 0 && w.length > 4 ? w.slice(0, 1) + w.slice(2) : w))
      .join(' '),
  'reorder': (text) => {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length < 3) return text;
    const mid = Math.floor(sentences.length / 2);
    return [...sentences.slice(mid), ...sentences.slice(0, mid)].join(' ');
  },
};

async function evaluateRobustness(aiRecords: Record[], lang: string) {
  const base = await evaluate(aiRecords.slice(0, 20).map((r) => ({ ...r, origin: 'ai' })), lang);
  const results: Record<string, ReturnType<typeof evaluate> extends Promise<infer T> ? T : never> = {
    baseline: base,
  };
  for (const [name, fn] of Object.entries(PERTURBATIONS)) {
    const perturbed = aiRecords.slice(0, 20).map((r) => ({ ...r, text: fn(r.text), origin: 'ai' as const }));
    results[name] = await evaluate(perturbed, lang);
  }
  return results;
}

describe('Detector benchmark suite', () => {
  it('benchmarks en/es/ar holdout and validation splits', { timeout: 180000 }, async () => {
    const languages = ['en', 'es', 'ar'];
    const allResults: Record<string, Awaited<ReturnType<typeof evaluate>>> = {};
    for (const lang of languages) {
      const records = [
        ...loadJsonl('holdout', lang),
        ...loadJsonl('validation', lang),
      ];
      const metrics = await evaluate(records, lang);
      allResults[lang] = metrics;
      // eslint-disable-next-line no-console
      console.log(`[${lang}]`, JSON.stringify(metrics, null, 2));
    }
    // eslint-disable-next-line no-console
    console.log('Benchmark summary:', JSON.stringify(allResults, null, 2));
  });

  it('benchmarks curated samples for nine additional languages', { timeout: 180000 }, async (context) => {
    const extraPath = path.join(SPLITS_DIR, '..', 'benchmark_extra.jsonl');
    if (!fs.existsSync(extraPath)) {
      context.skip(`Optional benchmark dataset not available: ${extraPath}`);
      return;
    }
    const lines = fs.readFileSync(extraPath, 'utf-8').split('\n').filter(Boolean);
    const records = lines.map((l) => JSON.parse(l)) as Record[];
    const byLang: Record<string, Record[]> = {};
    for (const r of records) {
      byLang[r.language] ||= [];
      byLang[r.language].push(r);
    }
    const results: Record<string, Awaited<ReturnType<typeof evaluate>>> = {};
    for (const [lang, recs] of Object.entries(byLang)) {
      const metrics = await evaluate(recs, lang);
      results[lang] = metrics;
      // eslint-disable-next-line no-console
      console.log(`[${lang} extra]`, JSON.stringify(metrics, null, 2));
    }
    // eslint-disable-next-line no-console
    console.log('Extra-language summary:', JSON.stringify(results, null, 2));
  });

  it('challenges English AI samples with style and noise perturbations', { timeout: 180000 }, async () => {
    const aiRecords = loadJsonl('holdout', 'en').filter((r) => r.origin === 'ai');
    const results = await evaluateRobustness(aiRecords, 'en');
    // eslint-disable-next-line no-console
    console.log('Robustness summary:', JSON.stringify(results, null, 2));
  });
});
