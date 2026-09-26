import fs from 'fs';
import { analyzeAdvancedText } from './src/lib/detection/engine.ts';

const files = [
  'tasks/checked_article.txt',
  'tasks/checked_article_from_pdf.txt',
  'tasks/clean_checked_article.txt',
  'tasks/unwrapped_article.txt',
  'tasks/reconstructed_sample.txt',
  'tasks/browserText.txt',
  'tasks/sampleFromTest.txt'
];

async function check() {
  for (const f of files) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      const r = await analyzeAdvancedText(content, { contentType: 'auto' });
      console.log(`${f}: AI=${r.overall.aiProbability}%, Human=${r.overall.humanProbability}%, Mixed=${r.overall.mixedProbability}%, Verdict=${r.overall.verdict}, Conf=${r.overall.confidence}%`);
    }
  }
}
check();
