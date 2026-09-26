import type { DetectedLanguage, LanguageSegment, RegionalVariant, DetectionWarning } from './types.ts';

export interface LanguageLayerResult {
  primary?: DetectedLanguage;
  secondary: DetectedLanguage[];
  segments: LanguageSegment[];
  regionalVariant?: RegionalVariant;
  codeSwitched: boolean;
  translationLikelihood: number;
  warnings: DetectionWarning[];
}

interface LanguageConfig {
  code: string;
  name: string;
  scripts: string[];
  stopwords: string[];
  regional?: { variant: string; signals: string[] }[];
}

const SCRIPT_REGEX: Record<string, RegExp> = {
  latin: /\p{Script=Latin}/u,
  cyrillic: /[\u0400-\u04FF]/u,
  arabic: /[\u0600-\u06FF\u0750-\u077F]/u,
  devanagari: /[\u0900-\u097F]/u,
  bengali: /[\u0980-\u09FF]/u,
  hanzi: /[\u4E00-\u9FFF]/u,
  hiragana: /[\u3040-\u309F]/u,
  katakana: /[\u30A0-\u30FF]/u,
  hangul: /[\uAC00-\uD7AF\u1100-\u11FF]/u,
  ethiopic: /[\u1200-\u137F]/u,
  thai: /[\u0E00-\u0E7F]/u,
  vietnamese: /[\u00C0-\u00FF\u0102-\u0103\u0110-\u0111\u0128-\u0129\u0168-\u0169\u01A0-\u01A1\u01AF-\u01B0\u1EA0-\u1EF9]/u,
};

const LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    scripts: ['latin'],
    stopwords: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'],
    regional: [
      { variant: 'American English', signals: ['color', 'behavior', 'center', 'organization', 'realize', 'traveling'] },
      { variant: 'British English', signals: ['colour', 'behaviour', 'centre', 'organisation', 'realise', 'travelling'] },
      { variant: 'Indian English', signals: ['lakh', 'crore', 'prepone', 'outstation', 'veg', 'non-veg', 'revert', 'do the needful'] },
      { variant: 'Nigerian English', signals: ['abi', 'sha', 'na', 'wahala', 'oga', 'abeg', 'japa', 'gbese'] },
      { variant: 'Australian English', signals: ['mate', 'arvo', 'bloke', 'ute', 'esky', 'bottle-o', 'servo'] },
      { variant: 'Canadian English', signals: ['toque', 'chesterfield', 'double-double', 'eh', 'tuque'] },
    ],
  },
  {
    code: 'fr',
    name: 'French',
    scripts: ['latin'],
    stopwords: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'avoir', 'ne', 'je', 'son', 'que', 'ce', 'qui', 'dans', 'en', 'du', 'elle', 'au', 'de'],
    regional: [
      { variant: 'France French', signals: ['voiture', 'bagnole', 'mec', 'truc', 'bise', 'chelou'] },
      { variant: 'Canadian French', signals: ['char', 'chum', 'blonde', 'pogner', 'niasse', 'jaser'] },
      { variant: 'African French', signals: ['tantine', 'oncle', 'garba', 'alloco', 'attieke', 'ndolo'] },
    ],
  },
  {
    code: 'es',
    name: 'Spanish',
    scripts: ['latin'],
    stopwords: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le'],
    regional: [
      { variant: 'Latin American Spanish', signals: ['computadora', 'carro', 'banqueta', 'chamarra', 'chela', 'chido'] },
      { variant: 'European Spanish', signals: ['ordenador', 'coche', 'acera', 'cazadora', 'cerveza', 'guay'] },
    ],
  },
  {
    code: 'pt',
    name: 'Portuguese',
    scripts: ['latin'],
    stopwords: ['o', 'a', 'de', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as'],
    regional: [
      { variant: 'Brazilian Portuguese', signals: ['você', 'trem', 'rapaz', 'cara', 'legal', 'bacana'] },
      { variant: 'European Portuguese', signals: ['tu', 'comboio', 'rapaz', 'tipo', 'fixe', 'giro'] },
    ],
  },
  {
    code: 'de',
    name: 'German',
    scripts: ['latin'],
    stopwords: ['der', 'die', 'und', 'in', 'den', 'von', 'mit', 'ist', 'das', 'für', 'auf', 'sich', 'dem', 'er', 'nicht', 'ein', 'die', 'eine', 'als', 'auch'],
  },
  {
    code: 'it',
    name: 'Italian',
    scripts: ['latin'],
    stopwords: ['il', 'di', 'che', 'è', 'la', 'per', 'un', 'sono', 'mi', 'ho', 'del', 'al', 'della', 'delle', 'dei', 'dagli', 'nel', 'con', 'gli', 'i'],
  },
  {
    code: 'nl',
    name: 'Dutch',
    scripts: ['latin'],
    stopwords: ['de', 'van', 'een', 'het', 'en', 'in', 'te', 'dat', 'is', 'voor', 'op', 'met', 'zijn', 'er', 'maar', 'die', 'heb', 'niet', 'aan', 'door'],
  },
  {
    code: 'ar',
    name: 'Arabic',
    scripts: ['arabic'],
    stopwords: ['في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'التي', 'الذي', 'كان', 'يكون', 'و', 'أن', 'لا', 'ما', 'قد', 'كل', 'بعد', 'أي', 'بين', 'عن'],
    regional: [
      { variant: 'Gulf Arabic', signals: ['هال', 'شلون', 'ياهل', 'ديرة', 'امبارح', 'كيف'] },
      { variant: 'Egyptian Arabic', signals: ['إزيك', 'بيه', 'يا', 'مش', 'عندي', 'كده'] },
      { variant: 'Levantine Arabic', signals: ['شو', 'كتير', 'حدا', 'هيدا', 'لأ', 'يلا'] },
      { variant: 'Modern Standard Arabic', signals: ['حيث', 'وهذا', 'لذلك', 'عليه', 'بناء', 'ينبغي'] },
    ],
  },
  {
    code: 'hi',
    name: 'Hindi',
    scripts: ['devanagari'],
    stopwords: ['का', 'है', 'में', 'की', 'और', 'से', 'को', 'के', 'ने', 'यह', 'पर', 'हो', 'भी', 'एक', 'हैं', 'नहीं', 'लिए', 'जो', 'कर', 'वह'],
  },
  {
    code: 'bn',
    name: 'Bengali',
    scripts: ['bengali'],
    stopwords: ['এবং', 'একটি', 'হয়', 'যে', 'এ', 'এর', 'করা', 'করে', 'হয়ে', 'থেকে', 'কে', 'না', 'ও', 'ছিল', 'করেছে', 'এই', 'জন্য', 'বলেন', 'তার', 'তিনি'],
  },
  {
    code: 'ur',
    name: 'Urdu',
    scripts: ['arabic'],
    stopwords: ['کا', 'ہے', 'میں', 'کی', 'اور', 'سے', 'کو', 'کے', 'نے', 'یہ', 'پر', 'ہو', 'بھی', 'ایک', 'ہیں', 'نہیں', 'لیے', 'جو', 'کر', 'وہ'],
  },
  {
    code: 'zh',
    name: 'Chinese',
    scripts: ['hanzi'],
    stopwords: ['的', '是', '在', '和', '了', '不', '我', '他', '就', '都', '你', '会', '对', '能', '也', '看', '这', '那', '有', '来'],
  },
  {
    code: 'ja',
    name: 'Japanese',
    scripts: ['hanzi', 'hiragana', 'katakana'],
    stopwords: ['の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として'],
  },
  {
    code: 'ko',
    name: 'Korean',
    scripts: ['hangul'],
    stopwords: ['이', '그', '의', '에', '은', '는', '을', '를', '가', '과', '와', '도', '으로', '로', '한', '하다', '있다', '되다', '수', '것'],
  },
  {
    code: 'ru',
    name: 'Russian',
    scripts: ['cyrillic'],
    stopwords: ['в', 'и', 'не', 'на', 'я', 'быть', 'он', 'с', 'что', 'а', 'по', 'это', 'она', 'к', 'но', 'мы', 'как', 'из', 'у', 'то'],
  },
  {
    code: 'tr',
    name: 'Turkish',
    scripts: ['latin'],
    stopwords: ['ve', 'bir', 'bu', 'için', 'mi', 'de', 'çok', 'ama', 'da', 'ile', 'ben', 'sen', 'o', 'ile', 'için', 'ise', 'ki', 'kadar', 'gibi', 'tüm'],
  },
  {
    code: 'id',
    name: 'Indonesian',
    scripts: ['latin'],
    stopwords: ['yang', 'dan', 'di', 'dari', 'pada', 'untuk', 'dengan', 'ini', 'adalah', 'sebagai', 'dalam', 'tidak', 'akan', 'juga', 'sudah', 'saya', 'kamu', 'kita', 'mereka', 'bisa'],
  },
  {
    code: 'ms',
    name: 'Malay',
    scripts: ['latin'],
    stopwords: ['yang', 'dan', 'di', 'dari', 'pada', 'untuk', 'dengan', 'ini', 'adalah', 'sebagai', 'dalam', 'tidak', 'akan', 'juga', 'sudah', 'saya', 'awak', 'kami', 'mereka', 'boleh'],
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    scripts: ['vietnamese', 'latin'],
    stopwords: ['của', 'và', 'là', 'có', 'được', 'trong', 'để', 'này', 'cho', 'với', 'người', 'không', 'về', 'một', 'đã', 'các', 'rất', 'như', 'cũng', 'từ'],
  },
  {
    code: 'th',
    name: 'Thai',
    scripts: ['thai'],
    stopwords: ['ใน', 'ของ', 'และ', 'ที่', 'มี', 'เป็น', 'ได้', 'จะ', 'ว่า', 'ไม่', 'ให้', 'แต่', 'ก็', 'จาก', 'นี้', 'โดย', 'คือ', 'กับ', 'อีก', 'แล้ว'],
  },
  {
    code: 'sw',
    name: 'Swahili',
    scripts: ['latin'],
    stopwords: ['na', 'wa', 'ya', 'ni', 'kwa', 'la', 'katika', 'ku', 'mwa', 'mimi', 'wewe', 'sisi', 'nyinyi', 'hao', 'yeye', 'wao', 'hii', 'hapa', 'pale', 'sasa'],
  },
  {
    code: 'ha',
    name: 'Hausa',
    scripts: ['latin', 'arabic'],
    stopwords: ['da', 'a', 'na', 'sun', 'ya', 'suna', 'wani', 'wata', 'ma', 'ba', 'ba', 'sai', 'don', 'ga', 'ko', 'amma', 'idan', 'yana', 'tana', 'muna'],
  },
  {
    code: 'yo',
    name: 'Yoruba',
    scripts: ['latin'],
    stopwords: ['ti', 'ni', 'ọ', 'fún', 'láti', 'gbogbo', 'a', 'mo', 'o', 'wa', 'yin', 'wọn', 'mi', 'rẹ̀', 'ìwọ', 'ní', 'sí', 'pẹ̀lú', 'tí', 'jẹ́'],
  },
  {
    code: 'ig',
    name: 'Igbo',
    scripts: ['latin'],
    stopwords: ['na', 'nke', 'a', 'ọ', 'dị', 'ya', 'ihe', 'mba', 'ka', 'ma', 'ụfọdụ', 'm', 'gị', 'anyị', 'ha', 'o', 'nke', 'na', 'bụ', 'mgbe'],
  },
  {
    code: 'am',
    name: 'Amharic',
    scripts: ['ethiopic'],
    stopwords: ['የ', 'እና', 'ይ', 'እንዲሁም', 'ነው', 'እንደ', 'ከ', 'እንዲህ', 'ወደ', 'ለ', 'እኔ', 'አንተ', 'እሷ', 'እነሱ', 'ይህ', 'እና', 'አይ', 'እንዴት', 'ሁሉ', 'ብቻ'],
  },
  {
    code: 'so',
    name: 'Somali',
    scripts: ['latin'],
    stopwords: ['wa', 'oo', 'ku', 'ka', 'aad', 'ay', 'u', 'ku', 'in', 'aad', 'la', 'wax', 'kasta', 'qof', 'meel', 'halkan', 'halkaas', 'dib', 'soo', 'mar'],
  },
  {
    code: 'af',
    name: 'Afrikaans',
    scripts: ['latin'],
    stopwords: ['die', 'van', 'en', 'in', 'is', 'dit', 'te', 'dat', 'nie', 'as', 'hy', 'sy', 'hulle', 'wat', 'jy', 'ons', 'kan', 'maar', 'ook', 'na'],
  },
];

function detectScript(text: string): string {
  const scriptCounts: Record<string, number> = {};
  for (const [name, regex] of Object.entries(SCRIPT_REGEX)) {
    const matches = text.match(regex);
    if (matches) {
      scriptCounts[name] = matches.reduce((sum, ch) => sum + (ch.length > 0 ? 1 : 0), 0);
    }
  }
  const sorted = Object.entries(scriptCounts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || 'latin';
}

const SCRIPT_WORD_BOUNDARY: Record<string, boolean> = {
  latin: true,
  cyrillic: true,
  greek: true,
  arabic: true,
  hebrew: true,
  devanagari: false,
  hanzi: false,
  hiragana: false,
  katakana: false,
  hangul: false,
  thai: false,
  ethiopic: false,
  vietnamese: true,
};

function scoreLanguage(text: string, lang: LanguageConfig): number {
  const lower = text.toLowerCase();
  const usesWordBoundaries = lang.scripts.every((s) => SCRIPT_WORD_BOUNDARY[s] ?? true);
  let score = 0;
  for (const word of lang.stopwords) {
    if (usesWordBoundaries) {
      const re = new RegExp(`(?:^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^\\p{L}]|$)`, 'gu');
      const matches = lower.match(re);
      if (matches) score += matches.length;
    } else {
      // For scripts without spaces between words, count substring occurrences.
      let idx = 0;
      while ((idx = lower.indexOf(word, idx)) !== -1) {
        score += 1;
        idx += Math.max(1, word.length);
      }
    }
  }
  return score;
}

function identifyLanguage(text: string): { language?: LanguageConfig; confidence: number } {
  const script = detectScript(text);
  const candidates = LANGUAGES.filter((l) => l.scripts.includes(script));
  if (candidates.length === 0) return { language: undefined, confidence: 0 };

  let best: LanguageConfig | undefined;
  let bestScore = 0;
  const scores: { lang: LanguageConfig; score: number }[] = [];
  for (const lang of candidates) {
    const score = scoreLanguage(text, lang);
    scores.push({ lang, score });
    if (score > bestScore) {
      bestScore = score;
      best = lang;
    }
  }

  const total = scores.reduce((sum, s) => sum + s.score, 0) || 1;
  const confidence = total === 0 ? 0 : Math.min(100, Math.round((bestScore / total) * 100));
  return { language: best, confidence };
}

function inferRegionalVariant(text: string, lang: LanguageConfig): RegionalVariant | undefined {
  if (!lang.regional) return undefined;
  const lower = text.toLowerCase();
  let bestVariant = '';
  let bestScore = 0;
  const signals: string[] = [];
  for (const region of lang.regional) {
    let score = 0;
    const found: string[] = [];
    for (const signal of region.signals) {
      const re = new RegExp(`(?:^|[^\\p{L}])${signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^\\p{L}]|$)`, 'gu');
      const matches = lower.match(re);
      if (matches && matches.length > 0) {
        score += matches.length;
        found.push(signal);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestVariant = region.variant;
      signals.splice(0, signals.length, ...found);
    }
  }
  if (bestScore === 0) return undefined;
  const confidence = Math.min(100, Math.round((bestScore / Math.max(5, bestScore + 3)) * 100));
  return { variant: bestVariant, confidence, signals };
}

function segmentByLanguage(text: string): LanguageSegment[] {
  // Simple script-based and word-boundary segmentation.
  const segments: LanguageSegment[] = [];
  const sentences = splitSentences(text);
  let current: LanguageSegment | null = null;

  for (const sentence of sentences) {
    const { language, confidence } = identifyLanguage(sentence);
    const script = detectScript(sentence);
    const start = text.indexOf(sentence, segments.reduce((max, s) => Math.max(max, s.end), 0));
    const end = start + sentence.length;

    if (current && current.languageCode === (language?.code || 'unknown') && current.isReliable === confidence >= 30) {
      current.text += ' ' + sentence;
      current.end = end;
    } else {
      if (current) segments.push(current);
      current = {
        start,
        end,
        text: sentence,
        languageCode: language?.code || 'unknown',
        languageName: language?.name || 'Unknown',
        script,
        isReliable: confidence >= 30,
      };
    }
  }
  if (current) segments.push(current);
  return segments;
}

function splitSentences(text: string): string[] {
  // Conservative sentence splitting for many scripts.
  return text
    .replace(/([.!?।॥。！？\u0964\u0965]+)\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function computeTranslationLikelihood(text: string, language?: LanguageConfig): number {
  if (!language) return 0;
  const lower = text.toLowerCase();
  let score = 0;
  // Common translation markers: awkward literal phrasings and unidiomatic connectors.
  const awkwardConnectors: Record<string, string[]> = {
    en: ['in the aspect of', 'from the point of view of', 'in the field of', 'it goes without saying'],
    fr: ['dans le cadre de'],
    es: ['en el marco de'],
    pt: ['no âmbito de'],
    de: ['im Rahmen von'],
  };
  const markers = awkwardConnectors[language.code] || [];
  for (const marker of markers) {
    if (lower.includes(marker)) score += 1;
  }
  return Math.min(100, score * 15);
}

export function analyzeLanguage(text: string, languageHint?: string): LanguageLayerResult {
  if (!text || text.trim().length === 0) {
    return {
      primary: undefined,
      secondary: [],
      segments: [],
      regionalVariant: undefined,
      codeSwitched: false,
      translationLikelihood: 0,
      warnings: [{ type: 'low-context', severity: 'critical', message: 'No text provided for language analysis.' }],
    };
  }

  const segments = segmentByLanguage(text);
  const languageCounts: Record<string, { code: string; name: string; script: string; score: number; segments: number }> = {};
  for (const seg of segments) {
    const key = seg.languageCode;
    if (!languageCounts[key]) {
      languageCounts[key] = { code: key, name: seg.languageName, script: seg.script, score: 0, segments: 0 };
    }
    languageCounts[key].score += seg.text.length;
    languageCounts[key].segments += 1;
  }

  const sortedLanguages = Object.values(languageCounts)
    .filter((l) => l.code !== 'unknown')
    .sort((a, b) => b.score - a.score);

  const totalScore = sortedLanguages.reduce((sum, l) => sum + l.score, 0) || 1;
  const detectedLanguages: DetectedLanguage[] = sortedLanguages.map((l) => ({
    code: l.code,
    name: l.name,
    confidence: Math.min(100, Math.round((l.score / totalScore) * 100)),
    script: l.script,
    isPrimary: false,
  }));

  const primary = detectedLanguages[0];
  if (primary) primary.isPrimary = true;
  const secondary = detectedLanguages.slice(1);

  const primaryConfig = LANGUAGES.find((l) => l.code === primary?.code);
  const regionalVariant = primaryConfig ? inferRegionalVariant(text, primaryConfig) : undefined;

  const codeSwitched = detectedLanguages.length > 1 && detectedLanguages[1].confidence >= 15;

  const warnings: DetectionWarning[] = [];
  if (codeSwitched) {
    warnings.push({
      type: 'mixed-language',
      severity: 'info',
      message: `The text contains multiple languages. Each segment was analyzed separately and results were combined.`,
    });
  }
  if (!primary || primary.confidence < 40) {
    warnings.push({
      type: 'unsupported-language',
      severity: 'warning',
      message: 'The primary language could not be identified confidently. Results may be less reliable.',
    });
  }

  return {
    primary,
    secondary,
    segments,
    regionalVariant,
    codeSwitched,
    translationLikelihood: computeTranslationLikelihood(text, primaryConfig),
    warnings,
  };
}

export function getLanguageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name || code;
}

export function isLanguageSupported(code: string): boolean {
  return LANGUAGES.some((l) => l.code === code);
}

export function getSupportedLanguageCodes(): string[] {
  return LANGUAGES.map((l) => l.code);
}
