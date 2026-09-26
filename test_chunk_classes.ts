import fs from 'fs';
import { getModel, getBinaryModel, partitionTextForClassification } from './src/lib/detection/classifier.ts';

const text = fs.readFileSync('tasks/browserText.txt', 'utf8').trim();

async function run() {
  const model = await getModel('en');
  const binaryModel = await getBinaryModel('en');
  const chunks = partitionTextForClassification(text, 1200, 200);
  console.log("Number of chunks:", chunks.length);
  
  // Let's test classifyWithClassifier with classProbs vs binary
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`\n--- Chunk ${i+1} (${chunk.text.length} chars) ---`);
    console.log(`Text preview: ${chunk.text.slice(0, 100)}...`);
  }
}
run();
