import fs from 'fs';
import { analyzeLanguage } from './src/lib/detection/languageLayer.ts';
import { analyzeLinguistic } from './src/lib/detection/linguisticLayer.ts';
import { analyzeStatistical } from './src/lib/detection/statisticalLayer.ts';
import { classifyWithClassifier } from './src/lib/detection/classifier.ts';
import { evaluateDocumentConsistency } from './src/lib/detection/layers/documentConsistency.ts';
import { detectHumanEdits } from './src/lib/detection/layers/humanEditDetection.ts';
import { runEnsemble } from './src/lib/detection/ensemble.ts';

const text = fs.readFileSync('tasks/browserText.txt', 'utf8').trim();

async function trace() {
  const lang = analyzeLanguage(text);
  const ling = analyzeLinguistic(text);
  const stat = analyzeStatistical(text, 'en');
  const cls = await classifyWithClassifier(text, 'en');
  const consistency = evaluateDocumentConsistency(text, 'en');
  const edits = detectHumanEdits(text, {
    statistical: stat,
    classifier: cls,
    linguistic: ling,
  });

  console.log("=== LAYER OUTPUTS ===");
  console.log("Linguistic:", { aiProbability: ling.aiProbability, humanProbability: ling.humanProbability, confidence: ling.confidence });
  console.log("Statistical:", { aiProbability: stat.aiProbability, humanProbability: stat.humanProbability, burstiness: stat.burstinessScore, perplexity: stat.perplexityScore });
  console.log("Classifier:", { ai: cls.ai, human: cls.human, mixed: cls.mixed, humanEditedAi: cls.humanEditedAi, translatedAi: cls.translatedAi });
  console.log("Consistency:", { mixedAuthorshipProbability: consistency.mixedAuthorshipProbability, styleShiftCount: consistency.styleShiftCount });
  console.log("HumanEdits:", { isEdited: edits.isEdited, confidence: edits.confidence, score: edits.score, indicators: edits.indicators });

  const ensemble = runEnsemble({
    linguistic: ling,
    statistical: stat,
    classifier: cls,
    consistency: consistency,
    humanEdit: edits,
    contentType: 'auto',
    language: 'en',
    wordCount: 1112,
  });

  console.log("=== ENSEMBLE OUTPUT ===");
  console.log(ensemble);
}
trace();
