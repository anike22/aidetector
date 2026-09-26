import fs from 'fs';
import { analyzeAdvancedText } from './src/lib/detection/engine.ts';

const text = fs.readFileSync('tasks/browserText.txt', 'utf8');

async function run() {
  const res = await analyzeAdvancedText(text, { contentType: 'academic' as any });
  console.log("With academic:", res.overall);
  const res2 = await analyzeAdvancedText(text, { contentType: 'creative' as any });
  console.log("With creative:", res2.overall);
  const res3 = await analyzeAdvancedText(text, { contentType: 'blog' as any });
  console.log("With blog:", res3.overall);
}
run();
