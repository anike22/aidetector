import type { AdvancedTextAnalysisResult, Verdict, ContentType } from './types';
import { analyzeText } from './detectorApi';

export type BenchmarkLabel = 'human' | 'ai' | 'mixed' | 'humanized-ai' | 'translated' | 'short';

export interface BenchmarkSample {
  id: string;
  text: string;
  label: BenchmarkLabel;
  languageCode: string;
  contentType: ContentType;
  sourceModel?: string;
  regionalVariant?: string;
  category: string;
}

export interface BenchmarkPrediction {
  sampleId: string;
  predictedVerdict: Verdict;
  aiProbability: number;
  humanProbability: number;
  mixedProbability: number;
  confidence: number;
  detectedLanguage?: string;
}

export interface BenchmarkMetrics {
  total: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  calibrationError: number;
  byLabel: Record<BenchmarkLabel, { count: number; accuracy: number; avgConfidence: number }>;
  byLanguage: Record<string, { count: number; accuracy: number }>;
  byContentType: Record<ContentType, { count: number; accuracy: number }>;
}

const BUILTIN_SAMPLES: BenchmarkSample[] = [
  // English human
  {
    id: 'en-human-blog-1',
    text: `I spent yesterday afternoon trying to fix my bike and failing completely. The chain kept slipping, and I couldn't figure out why. My neighbor walked over, took one look, and said the rear derailleur was bent. Ten minutes later it was sorted. I still don't fully understand what he did, but I'm grateful anyway.`,
    label: 'human',
    languageCode: 'en',
    contentType: 'blog',
    category: 'English native',
  },
  {
    id: 'en-human-academic-1',
    text: `Participants were recruited through university mailing lists and community boards. We excluded anyone with prior exposure to the experimental materials. The study protocol received ethical approval from the departmental review board before data collection began.`,
    label: 'human',
    languageCode: 'en',
    contentType: 'academic',
    category: 'English academic',
  },
  // English AI
  {
    id: 'en-ai-business-1',
    text: `In the modern business landscape, companies must leverage cutting-edge technologies to remain competitive. Artificial intelligence enables organizations to streamline operations, reduce costs, and enhance customer experiences. Furthermore, machine learning algorithms can analyze vast datasets to uncover actionable insights. By embracing digital transformation, businesses position themselves for sustained growth and innovation.`,
    label: 'ai',
    languageCode: 'en',
    contentType: 'business',
    sourceModel: 'gpt',
    category: 'English AI',
  },
  {
    id: 'en-ai-seo-1',
    text: `Are you looking for the best AI content detector? Look no further! Our powerful tool uses advanced algorithms to identify AI-generated text with incredible accuracy. Whether you are a student, marketer, or educator, our solution delivers fast, reliable results you can trust. Try it today and experience the difference.`,
    label: 'ai',
    languageCode: 'en',
    contentType: 'seo',
    sourceModel: 'claude',
    category: 'English AI',
  },
  // Mixed / AI-assisted
  {
    id: 'en-mixed-1',
    text: `I've always found mornings difficult, so I decided to try a structured routine. Research suggests that consistent wake times can improve sleep quality and cognitive performance. After two weeks of waking at the same time, I noticed I was less groggy and more focused. My partner even commented that I seemed calmer during breakfast.`,
    label: 'mixed',
    languageCode: 'en',
    contentType: 'blog',
    category: 'Mixed',
  },
  // Humanized AI
  {
    id: 'en-humanized-1',
    text: `So, like, AI is everywhere now. It helps ppl write stuff super fast. But sometimes the wording feels kinda off, ya know? U can tweak it a bit and it sounds more natural. Teachers are catching on though, so be careful.`,
    label: 'humanized-ai',
    languageCode: 'en',
    contentType: 'social',
    category: 'Humanized AI',
  },
  // Short text
  {
    id: 'en-short-1',
    text: `This product is great. I love it. Highly recommended.`,
    label: 'short',
    languageCode: 'en',
    contentType: 'product',
    category: 'Short text',
  },
  // Spanish human
  {
    id: 'es-human-1',
    text: `Ayer fui al mercado con mi abuela. Ella siempre elige las verduras una por una, y habla con todos los vendedores. Le compré unas naranjas enormes y luego tomamos café en la plaza. Me contó historias de cuando era joven que nunca había escuchado.`,
    label: 'human',
    languageCode: 'es',
    contentType: 'social',
    category: 'Spanish native',
  },
  // Spanish AI
  {
    id: 'es-ai-1',
    text: `La inteligencia artificial está transformando la manera en que las empresas operan en la era moderna. La implementación de algoritmos de aprendizaje automático permite a las compañías procesar grandes volúmenes de datos con una eficiencia sin precedentes. Además, las capacidades de procesamiento de lenguaje natural facilitan la generación de contenido automatizado.`,
    label: 'ai',
    languageCode: 'es',
    contentType: 'business',
    sourceModel: 'gpt',
    category: 'Spanish AI',
  },
  // French human
  {
    id: 'fr-human-1',
    text: `Je ne comprends toujours pas pourquoi le boulangerie du coin ferme si tôt le dimanche. Leurs croissants sont les meilleurs du quartier, et le dimanche matin est justement le moment où j'en ai le plus envie. La propriétaire m'a dit qu'elle voulait passer plus de temps avec ses petits-enfants.`,
    label: 'human',
    languageCode: 'fr',
    contentType: 'blog',
    category: 'French native',
  },
  // Code-switched sample
  {
    id: 'yo-en-mixed-1',
    text: `I really tried to finish the assignment last night, sugbon mo ti rè. The network was slow and I couldn't access the journal articles. Mo ní láti lọ sí library lónìí.`,
    label: 'mixed',
    languageCode: 'yo',
    contentType: 'student',
    category: 'Code-switched Yoruba/English',
  },
];

function verdictToLabel(verdict: Verdict): BenchmarkLabel {
  if (verdict === 'likely-ai') return 'ai';
  if (verdict === 'likely-human') return 'human';
  if (verdict === 'mixed' || verdict === 'mostly-human-ai-assisted' || verdict === 'mostly-ai-human-edited') return 'mixed';
  return 'short';
}

function isCorrect(prediction: BenchmarkPrediction, sample: BenchmarkSample): boolean {
  if (sample.label === 'human') {
    return prediction.predictedVerdict === 'likely-human' || prediction.predictedVerdict === 'mostly-human-ai-assisted';
  }
  if (sample.label === 'ai') {
    return prediction.predictedVerdict === 'likely-ai' || prediction.predictedVerdict === 'mostly-ai-human-edited';
  }
  if (sample.label === 'mixed' || sample.label === 'humanized-ai' || sample.label === 'translated') {
    return prediction.predictedVerdict === 'mixed' || prediction.predictedVerdict === 'mostly-ai-human-edited' || prediction.predictedVerdict === 'mostly-human-ai-assisted';
  }
  // Short/insufficient
  return prediction.predictedVerdict === 'insufficient-text' || prediction.predictedVerdict === 'inconclusive';
}

function binaryAI(prediction: BenchmarkPrediction): boolean {
  return prediction.predictedVerdict === 'likely-ai' || prediction.predictedVerdict === 'mostly-ai-human-edited';
}

function binaryHuman(prediction: BenchmarkPrediction): boolean {
  return prediction.predictedVerdict === 'likely-human' || prediction.predictedVerdict === 'mostly-human-ai-assisted';
}

function binaryTrueAI(sample: BenchmarkSample): boolean {
  return sample.label === 'ai' || sample.label === 'humanized-ai';
}

export async function runBenchmark(samples = BUILTIN_SAMPLES, onProgress?: (done: number, total: number) => void): Promise<{ predictions: BenchmarkPrediction[]; metrics: BenchmarkMetrics }> {
  const predictions: BenchmarkPrediction[] = [];

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const result = await analyzeText(sample.text, { contentType: sample.contentType });
    predictions.push({
      sampleId: sample.id,
      predictedVerdict: result.overall.verdict,
      aiProbability: result.overall.aiProbability,
      humanProbability: result.overall.humanProbability,
      mixedProbability: result.overall.mixedProbability,
      confidence: result.overall.confidence,
      detectedLanguage: result.language.primary?.code,
    });
    if (onProgress) onProgress(i + 1, samples.length);
  }

  const metrics = computeMetrics(predictions, samples);
  return { predictions, metrics };
}

export function computeMetrics(predictions: BenchmarkPrediction[], samples: BenchmarkSample[]): BenchmarkMetrics {
  const total = samples.length || 1;
  const correct = predictions.filter((p, i) => isCorrect(p, samples[i])).length;

  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (let i = 0; i < samples.length; i++) {
    const predAI = binaryAI(predictions[i]);
    const trueAI = binaryTrueAI(samples[i]);
    if (predAI && trueAI) tp++;
    if (predAI && !trueAI) fp++;
    if (!predAI && trueAI) fn++;
    if (!predAI && !trueAI) tn++;
  }

  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  const falsePositiveRate = fp + tn === 0 ? 0 : fp / (fp + tn);
  const falseNegativeRate = fn + tp === 0 ? 0 : fn / (fn + tp);

  let calibrationError = 0;
  for (let i = 0; i < samples.length; i++) {
    const p = predictions[i];
    const confidenceAI = p.aiProbability / 100;
    const isActuallyAI = binaryTrueAI(samples[i]);
    calibrationError += Math.abs(confidenceAI - (isActuallyAI ? 1 : 0));
  }
  calibrationError /= total;

  const byLabel: BenchmarkMetrics['byLabel'] = {} as Record<BenchmarkLabel, { count: number; accuracy: number; avgConfidence: number }>;
  const byLanguage: BenchmarkMetrics['byLanguage'] = {};
  const byContentType: BenchmarkMetrics['byContentType'] = {} as Record<ContentType, { count: number; accuracy: number }>;

  for (const label of ['human', 'ai', 'mixed', 'humanized-ai', 'translated', 'short'] as BenchmarkLabel[]) {
    const indices = samples.map((s, i) => (s.label === label ? i : -1)).filter((i) => i >= 0);
    const count = indices.length;
    const acc = count === 0 ? 0 : indices.filter((i) => isCorrect(predictions[i], samples[i])).length / count;
    const avgConf = count === 0 ? 0 : indices.reduce((sum, i) => sum + predictions[i].confidence, 0) / count;
    byLabel[label] = { count, accuracy: acc, avgConfidence: avgConf };
  }

  for (let i = 0; i < samples.length; i++) {
    const lang = samples[i].languageCode || 'unknown';
    if (!byLanguage[lang]) byLanguage[lang] = { count: 0, accuracy: 0 };
    byLanguage[lang].count += 1;
    if (isCorrect(predictions[i], samples[i])) {
      byLanguage[lang].accuracy += 1;
    }
  }
  for (const k of Object.keys(byLanguage)) {
    const bucket = byLanguage[k];
    bucket.accuracy = bucket.count === 0 ? 0 : bucket.accuracy / bucket.count;
  }

  for (let i = 0; i < samples.length; i++) {
    const ct = samples[i].contentType;
    if (!byContentType[ct]) byContentType[ct] = { count: 0, accuracy: 0 };
    byContentType[ct].count += 1;
    if (isCorrect(predictions[i], samples[i])) byContentType[ct].accuracy += 1;
  }
  for (const k of Object.keys(byContentType)) {
    const bucket = byContentType[k as ContentType];
    bucket.accuracy = bucket.count === 0 ? 0 : bucket.accuracy / bucket.count;
  }

  return {
    total,
    accuracy: correct / total,
    precision,
    recall,
    f1,
    falsePositiveRate,
    falseNegativeRate,
    calibrationError,
    byLabel,
    byLanguage,
    byContentType,
  };
}

export { BUILTIN_SAMPLES };
