import fs from 'fs';
import { analyzeAdvancedText } from './src/lib/detection/engine.ts';

const text1 = fs.readFileSync('tasks/checked_article.txt', 'utf8').trim();
const text2 = fs.readFileSync('tasks/browserText.txt', 'utf8').trim();

async function run() {
  const r1 = await analyzeAdvancedText(text1, { contentType: 'auto' });
  const r2 = await analyzeAdvancedText(text2, { contentType: 'auto' });
  console.log("--- checked_article.txt ---");
  console.log("Overall:", r1.overall);
  console.log("ContentType:", r1.metadata.contentType);
  console.log("WordCount:", r1.metadata.wordCount);
  console.log("ClassProbs:", r1.metadata.classProbabilities);

  console.log("\n--- browserText.txt ---");
  console.log("Overall:", r2.overall);
  console.log("ContentType:", r2.metadata.contentType);
  console.log("WordCount:", r2.metadata.wordCount);
  console.log("ClassProbs:", r2.metadata.classProbabilities);
}
run();
