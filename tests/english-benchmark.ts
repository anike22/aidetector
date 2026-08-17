import { analyzeAdvancedText } from '../src/lib/detection/engine';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Sample {
  text: string;
  origin: 'human' | 'ai';
}

function loadHoldout(): Sample[] {
  const file = path.join(__dirname, '../tasks/classifier/data/splits/holdout/en.jsonl');
  const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
  return lines.map((line) => {
    const obj = JSON.parse(line);
    return { text: obj.text, origin: obj.origin };
  });
}

function verdictIsAi(verdict: string): boolean {
  return verdict === 'likely-ai' || verdict === 'mostly-ai-human-edited';
}

function verdictIsHuman(verdict: string): boolean {
  return verdict === 'likely-human' || verdict === 'mostly-human-ai-assisted';
}

async function main() {
  const samples = loadHoldout();
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let inconclusive = 0;
  const rows: Record<string, string | number>[] = [];

  for (let i = 0; i < samples.length; i++) {
    const { text, origin } = samples[i];
    const result = await analyzeAdvancedText(text);
    const pred = verdictIsAi(result.overall.verdict)
      ? 'ai'
      : verdictIsHuman(result.overall.verdict)
        ? 'human'
        : 'uncertain';
    if (pred === 'ai') {
      if (origin === 'ai') tp++;
      else fp++;
    } else if (pred === 'human') {
      if (origin === 'human') tn++;
      else fn++;
    } else {
      inconclusive++;
    }
    rows.push({
      index: i,
      expected: origin,
      predicted: pred,
      ai: result.overall.aiProbability,
      human: result.overall.humanProbability,
      mixed: result.overall.mixedProbability,
      verdict: result.overall.verdict,
      confidence: result.overall.confidence,
    });
  }

  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const specificity = tn / (tn + fp) || 0;

  console.log('=== English HC3 holdout benchmark ===');
  console.log(`Samples: ${samples.length}`);
  console.log(`TP=${tp} FP=${fp} TN=${tn} FN=${fn} uncertain=${inconclusive}`);
  console.log(`Accuracy: ${((tp + tn) / samples.length * 100).toFixed(1)}%`);
  console.log(`Precision: ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall: ${(recall * 100).toFixed(1)}%`);
  console.log(`F1: ${(f1 * 100).toFixed(1)}%`);
  console.log(`Specificity: ${(specificity * 100).toFixed(1)}%`);
  console.log('First 10 rows:');
  console.table(rows.slice(0, 10));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
