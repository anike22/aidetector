import fs from 'fs';
import { analyzeSemanticConsistency } from './src/lib/detection/layers/semanticConsistency.ts';
import { segmentPassages } from './src/lib/detection/layers/passageSegmentation.ts';

const text = fs.readFileSync('tasks/browserText.txt', 'utf8').trim();
const passages = segmentPassages(text, 'en');
const sem = analyzeSemanticConsistency(passages.passages);
console.log("Semantic:", sem);
