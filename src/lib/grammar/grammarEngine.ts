/**
 * Robust Grammar, Spacing, and Subject-Verb Agreement Engine
 * 
 * Provides high-accuracy, context-aware grammatical analysis:
 * - Contextual confusion word resolution (their/there/they're, its/it's, your/you're, etc.)
 * - Deep Subject-Verb Agreement detection across prepositional phrases
 * - Original-text exact spacing verification with URL/code/markdown protection
 * - 1:1 character offset mapping with exact substring verification
 * - Confidence scoring and false-positive deduplication
 */

export interface GrammarIssueItem {
  text: string;
  suggestion: string;
  type: string; // 'Grammar' | 'Agreement' | 'Spacing' | 'Punctuation' | 'Capitalization' | 'Style' | 'Clarity'
  start: number;
  end: number;
  sentenceIndex?: number;
  paragraphIndex?: number;
  contextSnippet?: string;
  // Extended fields for robust auditing and UI reporting
  issueId?: string;
  ruleId?: string;
  category?: string;
  startOffset?: number;
  endOffset?: number;
  originalText?: string;
  message?: string;
  confidence?: number;
}

export interface GrammarResult {
  score: number;
  issues: GrammarIssueItem[];
}

/**
 * Creates a masked string having the EXACT same length and character positions as originalText,
 * with code blocks, URLs, emails, citations, math, and tables masked out as spaces.
 */
function createMaskedText(text: string): string {
  let masked = text;

  const maskRange = (start: number, end: number) => {
    const len = end - start;
    if (len <= 0) return;
    masked = masked.slice(0, start) + ' '.repeat(len) + masked.slice(end);
  };

  // 1. Mask fenced code blocks (```...```)
  const codeBlockRegex = /```[\s\S]*?```/g;
  let m: RegExpExecArray | null;
  while ((m = codeBlockRegex.exec(text)) !== null) {
    maskRange(m.index, m.index + m[0].length);
  }

  // 2. Mask inline code (`...`)
  const inlineCodeRegex = /`[^`\n]+`/g;
  while ((m = inlineCodeRegex.exec(text)) !== null) {
    maskRange(m.index, m.index + m[0].length);
  }

  // 3. Mask URLs (https://..., http://..., ftp://..., www...)
  const urlRegex = /(https?:\/\/[^\s"'<>]+|www\.[^\s"'<>]+)/gi;
  while ((m = urlRegex.exec(text)) !== null) {
    maskRange(m.index, m.index + m[0].length);
  }

  // 4. Mask email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((m = emailRegex.exec(text)) !== null) {
    maskRange(m.index, m.index + m[0].length);
  }

  // 5. Mask DOIs
  const doiRegex = /\bdoi:\s*10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/gi;
  while ((m = doiRegex.exec(text)) !== null) {
    maskRange(m.index, m.index + m[0].length);
  }

  // 6. Mask markdown table lines (starts and ends with |)
  const tableRegex = /^[ \t]*\|.*\|[ \t]*$/gm;
  while ((m = tableRegex.exec(text)) !== null) {
    maskRange(m.index, m.index + m[0].length);
  }

  // 7. Mask markdown links URL target: [anchor](url) -> mask (url)
  const mdLinkTargetRegex = /\[[^\]]+\]\(([^)]+)\)/g;
  while ((m = mdLinkTargetRegex.exec(text)) !== null) {
    const urlStart = m.index + m[0].indexOf('(') + 1;
    const urlEnd = m.index + m[0].length - 1;
    maskRange(urlStart, urlEnd);
  }

  return masked;
}

/**
 * Common nouns, pronouns, and verb auxiliaries for grammatical parsing
 */
const SINGULAR_HEAD_EXCEPTIONS = new Set([
  'invention', 'collection', 'quality', 'number', 'group', 'variety', 'series',
  'set', 'majority', 'amount', 'level', 'standard', 'performance', 'development',
  'process', 'analysis', 'study', 'impact', 'use', 'growth', 'structure', 'system',
  'presence', 'evaluation', 'creation', 'generation', 'model', 'user', 'detector',
  'report', 'document', 'experiment', 'article', 'dataset', 'algorithm', 'team'
]);

const PLURAL_HEAD_EXCEPTIONS = new Set([
  'results', 'inventions', 'collections', 'experiments', 'models', 'users',
  'detectors', 'documents', 'studies', 'findings', 'data', 'articles', 'tools',
  'factors', 'reasons', 'problems', 'features', 'signals', 'authors', 'writers'
]);

/**
 * Helper to determine if a noun head is singular or plural.
 */
function isNounSingular(noun: string): boolean {
  const lower = noun.toLowerCase();
  if (SINGULAR_HEAD_EXCEPTIONS.has(lower)) return true;
  if (PLURAL_HEAD_EXCEPTIONS.has(lower)) return false;
  // Regular English morphology: ends with 's', 'es', 'ies' (and not 'ss' like 'process')
  if (lower.endsWith('ss') || lower.endsWith('us') || lower.endsWith('is')) return true;
  if (lower.endsWith('s')) return false;
  return true;
}

/**
 * Main grammar analysis engine
 */
export function analyzeGrammar(originalText: string): GrammarResult {
  if (!originalText || !originalText.trim()) {
    return { score: 100, issues: [] };
  }

  const rawIssues: GrammarIssueItem[] = [];
  const maskedText = createMaskedText(originalText);

  // Helper to safely register an issue candidate with exact verification
  const registerIssue = (candidate: {
    start: number;
    end: number;
    text: string;
    suggestion: string;
    type: string;
    category?: string;
    ruleId: string;
    message: string;
    confidence: number;
  }) => {
    const { start, end, text, suggestion, type, category, ruleId, message, confidence } = candidate;

    // Check bounds
    if (start < 0 || end > originalText.length || start >= end) return;

    // Verify exact slice matches original text
    const actualSlice = originalText.slice(start, end);
    if (actualSlice !== text) return;

    // Extract surrounding 15 chars for robust contextual locating
    const contextStart = Math.max(0, start - 15);
    const contextEnd = Math.min(originalText.length, end + 15);
    const contextSnippet = originalText.slice(contextStart, contextEnd);

    const issueId = `${ruleId}_${start}_${end}`;

    rawIssues.push({
      text,
      suggestion,
      type,
      category: category || type,
      ruleId,
      issueId,
      start,
      end,
      startOffset: start,
      endOffset: end,
      originalText: actualSlice,
      contextSnippet,
      message,
      confidence,
    });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RULE SET 1: SPACING ACCURACY (Operates on original text)
  // ──────────────────────────────────────────────────────────────────────────

  // 1A. Genuine double or multiple spaces between words on the same line
  // Do NOT match across newlines or at line indents/empty lines
  const doubleSpaceRegex = /(?<=[^\s\r\n])[ \t]{2,}(?=[^\s\r\n])/g;
  let spaceMatch: RegExpExecArray | null;
  while ((spaceMatch = doubleSpaceRegex.exec(originalText)) !== null) {
    const start = spaceMatch.index;
    const end = start + spaceMatch[0].length;

    // Verify that this spacing isn't inside a masked zone (e.g. code/URL/table)
    if (maskedText.slice(start, end) === ' '.repeat(end - start) && originalText.slice(start, end) !== maskedText.slice(start, end)) {
      continue;
    }

    registerIssue({
      start,
      end,
      text: spaceMatch[0],
      suggestion: 'Remove extra spaces',
      type: 'Spacing',
      category: 'Spacing',
      ruleId: 'spacing-double-space',
      message: 'Multiple consecutive spaces detected between words.',
      confidence: 0.98,
    });
  }

  // 1B. Unwanted space before punctuation marks ( . , ! ? ; : )
  // E.g. "This is incorrect ." -> space before period
  const spaceBeforePunctRegex = /(?<=[A-Za-z0-9)\]"'])\s+([.,!?;:])(?=[\s\r\n"')\]]|$)/g;
  let punctSpaceMatch: RegExpExecArray | null;
  while ((punctSpaceMatch = spaceBeforePunctRegex.exec(originalText)) !== null) {
    const fullMatch = punctSpaceMatch[0];
    const punctChar = punctSpaceMatch[1];
    const start = punctSpaceMatch.index;
    const end = start + fullMatch.length;

    // Verify not masked
    if (maskedText.slice(start, end).trim().length === 0 && originalText.slice(start, end) !== maskedText.slice(start, end)) {
      continue;
    }

    registerIssue({
      start,
      end,
      text: fullMatch,
      suggestion: `Remove space before '${punctChar}'`,
      type: 'Punctuation',
      category: 'Punctuation',
      ruleId: 'spacing-before-punctuation',
      message: `Unwanted space before punctuation mark '${punctChar}'.`,
      confidence: 0.95,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RULE SET 2: CONTEXT-AWARE CONFUSION WORDS
  // ──────────────────────────────────────────────────────────────────────────

  // 2A. "their" vs "there" vs "they're"
  // Rule: Do NOT flag "their" when followed by a noun, noun phrase, or possessive target.
  // Flag "their" ONLY when clearly functioning as expletive/adverb (e.g., "their is", "their are", "their have been")
  const theirAsThereRegex = /\b(their)\s+(is|are|was|were|has\s+been|have\s+been|had\s+been|will\s+be|could\s+be|can\s+be|should\s+be|would\s+be)\b/gi;
  let m2: RegExpExecArray | null;
  while ((m2 = theirAsThereRegex.exec(maskedText)) !== null) {
    const targetWord = m2[1];
    const start = m2.index;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: targetWord[0] === targetWord[0].toUpperCase() ? 'There' : 'there',
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-their-there',
      message: `Use 'there' to indicate existence or location before auxiliary verbs.`,
      confidence: 0.96,
    });
  }

  // Flag "there" when modifying a noun where possessive "their" is required:
  // e.g. "There content passed...", "There article was...", "There results showed..."
  const thereAsTheirRegex = /\b(there)\s+(content|article|post|data|work|ideas?|results?|car|books?|team|products?|models?|system|website|performance|analysis)\b/gi;
  while ((m2 = thereAsTheirRegex.exec(maskedText)) !== null) {
    const targetWord = m2[1];
    const start = m2.index;
    const end = start + targetWord.length;

    // Ensure it's not preceded by locational prepositions like "in there", "over there"
    const prefix = maskedText.slice(Math.max(0, start - 10), start).toLowerCase();
    if (/\b(in|over|out|from|up|down|stay|stayed|put|put\s+it)\s+$/.test(prefix)) {
      continue;
    }

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: targetWord[0] === targetWord[0].toUpperCase() ? 'Their' : 'their',
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-there-their',
      message: `Use possessive 'their' before a noun.`,
      confidence: 0.94,
    });
  }

  // Flag "they're" when modifying a noun: e.g. "they're content was..."
  const theyreAsTheirRegex = /\b(they're)\s+(content|article|post|data|work|ideas?|results?|team|products?|models?|system|website|performance|car|books?)\b/gi;
  while ((m2 = theyreAsTheirRegex.exec(maskedText)) !== null) {
    const targetWord = m2[1];
    const start = m2.index;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: targetWord[0] === targetWord[0].toUpperCase() ? 'Their' : 'their',
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-theyre-their',
      message: `Use possessive 'their' instead of contraction 'they're' before a noun.`,
      confidence: 0.95,
    });
  }

  // 2B. "your" vs "you're"
  // Flag "your" followed by predicate verbs/adjectives where "you're" (you are) is needed
  // e.g. "your going to", "your welcome", "your invited", "your able to", "your right"
  const yourAsYoureRegex = /\b(your)\s+(going\s+to|welcome|invited|able\s+to|right\s+(?:about|in)|doing\s+(?:well|great)|being\s+[a-z]+)\b/gi;
  while ((m2 = yourAsYoureRegex.exec(maskedText)) !== null) {
    const targetWord = m2[1];
    const start = m2.index;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: targetWord[0] === targetWord[0].toUpperCase() ? "You're" : "you're",
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-your-youre',
      message: `Use contraction 'you're' (you are) before a verb phrase or predicate adjective.`,
      confidence: 0.95,
    });
  }

  // Flag "you're" followed by a noun that acts as a direct object or subject without a verb
  // e.g. "you're idea is great", "you're content passes", "you're car is"
  const youreAsYourRegex = /\b(you're)\s+(idea|content|article|post|data|car|house|team|product|tone|structure|digital\s+presence)\b/gi;
  while ((m2 = youreAsYourRegex.exec(maskedText)) !== null) {
    const targetWord = m2[1];
    const start = m2.index;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: targetWord[0] === targetWord[0].toUpperCase() ? 'Your' : 'your',
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-youre-your',
      message: `Use possessive 'your' before a noun.`,
      confidence: 0.95,
    });
  }

  // 2C. "its" vs "it's"
  // Flag "its" before articles or adverbs or past participles where "it is" / "it has" is needed
  // e.g. "its a sunny day", "its been great", "its going to", "its obvious that"
  const itsAsItIsRegex = /\b(its)\s+(a|an|the|been|going\s+to|obvious|clear|important|time\s+to|not\s+[a-z]+)\b/gi;
  while ((m2 = itsAsItIsRegex.exec(maskedText)) !== null) {
    const targetWord = m2[1];
    const start = m2.index;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: targetWord[0] === targetWord[0].toUpperCase() ? "It's" : "it's",
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-its-it-is',
      message: `Use contraction 'it's' (it is / it has) in this context.`,
      confidence: 0.96,
    });
  }

  // Flag "it's" before noun where possessive "its" is needed
  // e.g. "updated it's policy", "chased it's tail", "check it's validity"
  const itIsAsItsRegex = /\b(it's)\s+(policy|tail|features?|content|validity|mechanisms?|authenticity|reach|release|growth|design|purpose)\b/gi;
  while ((m2 = itIsAsItsRegex.exec(maskedText)) !== null) {
    const targetWord = m2[1];
    const start = m2.index;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: targetWord[0] === targetWord[0].toUpperCase() ? 'Its' : 'its',
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-it-is-its',
      message: `Use possessive pronoun 'its' (no apostrophe) before a noun.`,
      confidence: 0.95,
    });
  }

  // 2D. "then" vs "than"
  // Flag "then" after comparative adjectives or adverbs
  // e.g. "bigger then", "more then", "better then", "rather then", "other then", "less then", "faster then"
  const thenAsThanRegex = /\b(more|less|better|worse|rather|other|sooner|earlier|faster|greater|higher|lower|wider|longer|shorter|bigger|smaller)\s+(then)\b/gi;
  while ((m2 = thenAsThanRegex.exec(maskedText)) !== null) {
    const targetWord = m2[2];
    const matchIdx = m2.index;
    const wordOffsetInMatch = m2[0].toLowerCase().lastIndexOf('then');
    const start = matchIdx + wordOffsetInMatch;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: 'than',
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-then-than',
      message: `Use 'than' for comparisons after '${m2[1]}'.`,
      confidence: 0.97,
    });
  }

  // 2E. "to" vs "too" vs "two"
  // Flag "to" acting as intensifier: "to hot", "to fast", "to much", "to many", "to late", "to far"
  const toAsTooRegex = /\b(to)\s+(much|many|late|far|fast|hot|cold|hard|soon|little|expensive|difficult)\b/gi;
  while ((m2 = toAsTooRegex.exec(maskedText)) !== null) {
    const targetWord = m2[1];
    const start = m2.index;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: targetWord[0] === targetWord[0].toUpperCase() ? 'Too' : 'too',
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-to-too-intensifier',
      message: `Use 'too' to mean 'excessively' or 'also' before '${m2[2]}'.`,
      confidence: 0.95,
    });
  }

  // 2F. "whose" vs "who's"
  // Flag "whose" followed by verb/participle: "whose going to", "whose responsible", "whose there"
  const whoseAsWhosRegex = /\b(whose)\s+(going\s+to|responsible|there|ready|able|been|coming|calling)\b/gi;
  while ((m2 = whoseAsWhosRegex.exec(maskedText)) !== null) {
    const targetWord = m2[1];
    const start = m2.index;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: targetWord[0] === targetWord[0].toUpperCase() ? "Who's" : "who's",
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-whose-whos',
      message: `Use contraction 'who's' (who is / who has) before a verb phrase or predicate.`,
      confidence: 0.95,
    });
  }

  // 2G. "affect" vs "effect"
  // Flag "effect" used as a verb after modals/auxiliaries
  // e.g. "will effect the outcome", "can effect your ranking"
  const effectAsVerbRegex = /\b(will|would|can|could|may|might|should|to|must|shall|adversely|negatively|positively|directly|significantly)\s+(effect)\s+(the|a|an|your|their|its|our|this|that|all)\b/gi;
  while ((m2 = effectAsVerbRegex.exec(maskedText)) !== null) {
    const targetWord = m2[2];
    const matchIdx = m2.index;
    const wordOffsetInMatch = m2[0].toLowerCase().indexOf('effect');
    const start = matchIdx + wordOffsetInMatch;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: 'affect',
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-effect-verb',
      message: `Use 'affect' as a verb meaning 'to influence'.`,
      confidence: 0.93,
    });
  }

  // Flag "affect" used as a noun: e.g. "a positive affect on", "the affect of"
  const affectAsNounRegex = /\b(the|a|an|this|that|positive|negative|side|adverse|immediate|profound)\s+(affect)\b(?!\s+(?:by|from|in))/gi;
  while ((m2 = affectAsNounRegex.exec(maskedText)) !== null) {
    const targetWord = m2[2];
    const matchIdx = m2.index;
    const wordOffsetInMatch = m2[0].toLowerCase().indexOf('affect');
    const start = matchIdx + wordOffsetInMatch;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: 'effect',
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'confusion-affect-noun',
      message: `Use 'effect' as a noun meaning 'a result' or 'impact'.`,
      confidence: 0.94,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RULE SET 3: DEEP SUBJECT-VERB AGREEMENT DETECTION
  // ──────────────────────────────────────────────────────────────────────────
  // Detects sentences with singular/plural subject heads modified by prepositional phrases
  // E.g. "The invention of AI detectors have led..."
  // Subject head = "invention" (singular)
  // Prepositional modifier = "of AI detectors"
  // Verb = "have led" (plural) -> Disagreement! Must be "has led".
  //
  // Reverse: "The results of the experiment are available" -> "results" (plural) + "are" (plural) -> OK!
  // "The collection of documents are available" -> "collection" (singular) + "are" (plural) -> Suggest "is".
  const svaRegex = /\b(?:the|a|an|this|that|these|those|every|each)?\s*([a-zA-Z]+)\s+(of|in|for|to|with|on|about|from|between)\s+([^,;:.?!]+?)(?:(,\s*))?\s+\b(have|has|are|is|were|was)\b(?:\s+([a-zA-Z]+))?/gi;
  let svaMatch: RegExpExecArray | null;
  while ((svaMatch = svaRegex.exec(maskedText)) !== null) {
    const headNoun = svaMatch[1];
    const prep = svaMatch[2];
    const modifier = svaMatch[3];
    const interveningComma = svaMatch[4]; // If an erroneous comma separates subject and verb
    const auxVerb = svaMatch[5].toLowerCase();
    const mainVerb = svaMatch[6] ? svaMatch[6].toLowerCase() : '';

    // Ignore known non-subject idioms or prepositional phrases starting clauses
    if (['example', 'terms', 'case', 'addition', 'spite', 'front', 'view'].includes(headNoun.toLowerCase())) {
      continue;
    }

    const isSingular = isNounSingular(headNoun);
    const verbIsPlural = (auxVerb === 'have' || auxVerb === 'are' || auxVerb === 'were');
    const verbIsSingular = (auxVerb === 'has' || auxVerb === 'is' || auxVerb === 'was');

    // Case 1: Singular Subject Head + Plural Verb
    if (isSingular && verbIsPlural) {
      // Find exact position of the verb phrase in originalText
      const matchIndex = svaMatch.index;
      const fullMatchStr = svaMatch[0];
      const verbPhraseStr = mainVerb ? `${svaMatch[5]} ${svaMatch[6]}` : svaMatch[5];
      const verbOffsetInMatch = fullMatchStr.lastIndexOf(svaMatch[5]);
      const verbStart = matchIndex + verbOffsetInMatch;
      const verbEnd = verbStart + verbPhraseStr.length;

      let suggestedVerb = '';
      if (auxVerb === 'have') suggestedVerb = mainVerb ? `has ${mainVerb}` : 'has';
      else if (auxVerb === 'are') suggestedVerb = mainVerb ? `is ${mainVerb}` : 'is';
      else if (auxVerb === 'were') suggestedVerb = mainVerb ? `was ${mainVerb}` : 'was';

      registerIssue({
        start: verbStart,
        end: verbEnd,
        text: originalText.slice(verbStart, verbEnd),
        suggestion: suggestedVerb,
        type: 'Agreement',
        category: 'Agreement',
        ruleId: 'sva-singular-subject-plural-verb',
        message: `Subject-verb disagreement: The singular subject head '${headNoun}' requires singular verb '${suggestedVerb}' (not '${verbPhraseStr}').`,
        confidence: 0.96,
      });

      // Also check if there is an unnecessary comma between the subject noun phrase and the verb!
      // E.g. "the invention of AI detectors, have led" -> comma after detectors
      if (interveningComma) {
        const commaOffsetInMatch = fullMatchStr.indexOf(',');
        if (commaOffsetInMatch !== -1) {
          const commaStart = matchIndex + commaOffsetInMatch;
          registerIssue({
            start: commaStart,
            end: commaStart + 1,
            text: ',',
            suggestion: 'Remove comma',
            type: 'Punctuation',
            category: 'Punctuation',
            ruleId: 'punctuation-comma-between-subject-verb',
            message: `Unnecessary comma separating the subject noun phrase from its verb.`,
            confidence: 0.94,
          });
        }
      }
    }

    // Case 2: Plural Subject Head + Singular Verb
    // E.g. "The results of the experiment is available" -> suggest "are"
    if (!isSingular && verbIsSingular) {
      const matchIndex = svaMatch.index;
      const fullMatchStr = svaMatch[0];
      const verbPhraseStr = mainVerb ? `${svaMatch[5]} ${svaMatch[6]}` : svaMatch[5];
      const verbOffsetInMatch = fullMatchStr.lastIndexOf(svaMatch[5]);
      const verbStart = matchIndex + verbOffsetInMatch;
      const verbEnd = verbStart + verbPhraseStr.length;

      let suggestedVerb = '';
      if (auxVerb === 'has') suggestedVerb = mainVerb ? `have ${mainVerb}` : 'have';
      else if (auxVerb === 'is') suggestedVerb = mainVerb ? `are ${mainVerb}` : 'are';
      else if (auxVerb === 'was') suggestedVerb = mainVerb ? `were ${mainVerb}` : 'were';

      registerIssue({
        start: verbStart,
        end: verbEnd,
        text: originalText.slice(verbStart, verbEnd),
        suggestion: suggestedVerb,
        type: 'Agreement',
        category: 'Agreement',
        ruleId: 'sva-plural-subject-singular-verb',
        message: `Subject-verb disagreement: The plural subject head '${headNoun}' requires plural verb '${suggestedVerb}' (not '${verbPhraseStr}').`,
        confidence: 0.96,
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RULE SET 4: CAPITALIZATION OF "I" & STANDARD PUNCTUATION
  // ──────────────────────────────────────────────────────────────────────────

  // 4A. Standalone lowercase "i" -> "I"
  const singleIRegex = /(?<=[^A-Za-z0-9_]|^)(i)(?=[^A-Za-z0-9_]|$)(?!\.)/g;
  let iMatch: RegExpExecArray | null;
  while ((iMatch = singleIRegex.exec(maskedText)) !== null) {
    const start = iMatch.index;
    const end = start + 1;
    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: 'I',
      type: 'Capitalization',
      category: 'Capitalization',
      ruleId: 'capitalization-single-i',
      message: `The personal pronoun 'I' must always be capitalized.`,
      confidence: 0.99,
    });
  }

  // 4B. "a" before vowel sound / "an" before consonant sound
  const aBeforeVowelRegex = /\b(a)\s+([aeio]|un[a-z]+|honest|hour)\b/gi;
  while ((m2 = aBeforeVowelRegex.exec(maskedText)) !== null) {
    const followingWord = m2[2].toLowerCase();
    // Exclude words starting with "u" pronounced as "yu" (user, university, unique, etc.) or "one"
    if (['user', 'users', 'unique', 'university', 'universities', 'useful', 'one'].includes(followingWord)) {
      continue;
    }
    const targetWord = m2[1];
    const start = m2.index;
    const end = start + targetWord.length;

    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: targetWord[0] === targetWord[0].toUpperCase() ? 'An' : 'an',
      type: 'Grammar',
      category: 'Grammar',
      ruleId: 'article-a-vs-an',
      message: `Use 'an' before words beginning with a vowel sound.`,
      confidence: 0.94,
    });
  }

  // 4C. Excessive punctuation: e.g. "!!" or "??" or "..", excluding standard ellipsis "..."
  const repeatedPunctRegex = /([!?]{2,}|(?<!\.)\.\.(?!\.))/g;
  while ((m2 = repeatedPunctRegex.exec(maskedText)) !== null) {
    const start = m2.index;
    const end = start + m2[0].length;
    registerIssue({
      start,
      end,
      text: originalText.slice(start, end),
      suggestion: m2[0][0],
      type: 'Punctuation',
      category: 'Punctuation',
      ruleId: 'punctuation-repeated',
      message: `Use single punctuation mark instead of repeated symbols.`,
      confidence: 0.92,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DEDUPLICATION & CONFIDENCE FILTERING
  // ──────────────────────────────────────────────────────────────────────────
  // Sort deterministically by start offset ascending, then by confidence descending
  rawIssues.sort((a, b) => a.start - b.start || (b.confidence || 0) - (a.confidence || 0));

  const filteredIssues: GrammarIssueItem[] = [];
  for (const issue of rawIssues) {
    // Check if overlaps with an already accepted issue of the same or higher priority
    const overlaps = filteredIssues.some((accepted) => {
      // Overlap occurs if ranges intersect
      return Math.max(accepted.start, issue.start) < Math.min(accepted.end, issue.end);
    });

    if (!overlaps && (issue.confidence || 0) >= 0.80) {
      filteredIssues.push(issue);
    }
  }

  // Final sort by start position in reading order
  filteredIssues.sort((a, b) => a.start - b.start);

  const score = Math.max(0, 100 - filteredIssues.length * 8);
  return {
    score,
    issues: filteredIssues,
  };
}
