import fs from 'fs';
import { analyzeAdvancedText } from './src/lib/detection/engine.ts';

const text = fs.readFileSync('tasks/browserText.txt', 'utf8');

async function run() {
  const res = await analyzeAdvancedText(text, { contentType: 'auto' });
  console.log("Overall:", res.overall);
  console.log("Breakdown:", JSON.stringify(res.breakdown, null, 2));
  console.log("Signals / Metadata:", JSON.stringify(res.metadata, null, 2));
}
run();
