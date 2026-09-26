import fs from 'fs';
import { analyzeAdvancedText } from './src/lib/detection/engine.ts';

const text = fs.readFileSync('tasks/browserText.txt', 'utf8').trim();

async function run() {
  // Let's test with options.contentType = 'auto' but where inferContentType returns 'auto'
  const res = await analyzeAdvancedText(text, { contentType: 'auto' });
  console.log("Current result (inferred email):", res.overall);

  // If we test with contentType = 'technical' or others:
  for (const ct of ['auto', 'blog', 'academic', 'technical', 'news'] as const) {
    const r = await analyzeAdvancedText(text, { contentType: ct });
    console.log(`${ct}: AI=${r.overall.aiProbability}%, H=${r.overall.humanProbability}%, M=${r.overall.mixedProbability}%, V=${r.overall.verdict}, Label=${r.overall.verdictLabel}`);
  }
}
run();
