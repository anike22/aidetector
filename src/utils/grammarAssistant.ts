/**
 * Client-Side Grammar & Writing Assistant Utilities
 * 
 * Provides fast, 100% private, local rule-based grammar, style, punctuation,
 * and redundancy checking with clear explanations, individual accept/dismiss actions,
 * language support, and zero keystroke uploads.
 */

export type GrammarCategory = 'grammar' | 'punctuation' | 'redundancy' | 'style' | 'spelling' | 'capitalization';

export interface GrammarSuggestion {
  id: string;
  category: GrammarCategory;
  title: string;
  explanation: string;
  originalText: string;
  replacementText: string;
  startIndex: number;
  endIndex: number;
  language?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_GRAMMAR_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English (US/UK)', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese (Português)', flag: '🇵🇹' },
];

// Common wordy phrases and their concise replacements (English)
const EN_REDUNDANT_PHRASES: Array<{ pattern: RegExp; replacement: string; explanation: string }> = [
  { pattern: /\bin order to\b/gi, replacement: 'to', explanation: 'Simplify wordy phrase "in order to" to "to".' },
  { pattern: /\bat the present time\b/gi, replacement: 'currently', explanation: 'Use "currently" or "now" instead of "at the present time".' },
  { pattern: /\bdue to the fact that\b/gi, replacement: 'because', explanation: 'Replace "due to the fact that" with "because".' },
  { pattern: /\ba large number of\b/gi, replacement: 'many', explanation: 'Use "many" or "numerous" for conciseness.' },
  { pattern: /\bfor the purpose of\b/gi, replacement: 'for', explanation: 'Simplify "for the purpose of" to "for" or "to".' },
  { pattern: /\bin the event that\b/gi, replacement: 'if', explanation: 'Replace "in the event that" with "if".' },
  { pattern: /\bwith the exception of\b/gi, replacement: 'except for', explanation: 'Use "except for" instead of "with the exception of".' },
  { pattern: /\bat this point in time\b/gi, replacement: 'now', explanation: 'Use "now" or "presently" instead of "at this point in time".' },
  { pattern: /\bin spite of the fact that\b/gi, replacement: 'although', explanation: 'Replace wordy clause with "although".' },
  { pattern: /\bhas the ability to\b/gi, replacement: 'can', explanation: 'Simplify "has the ability to" to "can".' },
  { pattern: /\bis able to\b/gi, replacement: 'can', explanation: 'Simplify "is able to" to "can".' },
  { pattern: /\btake into consideration\b/gi, replacement: 'consider', explanation: 'Use active verb "consider".' },
  { pattern: /\bmake a decision\b/gi, replacement: 'decide', explanation: 'Use active verb "decide".' },
  { pattern: /\bgive an indication of\b/gi, replacement: 'indicate', explanation: 'Use active verb "indicate".' },
  { pattern: /\bconduct an investigation of\b/gi, replacement: 'investigate', explanation: 'Simplify "conduct an investigation of" to "investigate".' },
  { pattern: /\ba majority of\b/gi, replacement: 'most', explanation: 'Replace "a majority of" with "most".' },
  { pattern: /\bin close proximity\b/gi, replacement: 'near', explanation: 'Simplify "in close proximity" to "near".' },
  { pattern: /\beach and every\b/gi, replacement: 'every', explanation: 'Use "every" instead of redundant "each and every".' },
  { pattern: /\bfirst and foremost\b/gi, replacement: 'first', explanation: 'Simplify "first and foremost" to "first".' },
  { pattern: /\bend result\b/gi, replacement: 'result', explanation: '"Result" implies the end; omit "end".' },
  { pattern: /\bfuture plans\b/gi, replacement: 'plans', explanation: 'Plans are inherently for the future; omit "future".' },
];

// Common confusing word pairs (English)
const EN_CONFUSING_WORDS: Array<{ pattern: RegExp; replacement: string; title: string; explanation: string }> = [
  {
    pattern: /\b(its)\s+(a|an|the|very|important|obvious|clear|going|ready|done|likely|crucial|essential)\b/gi,
    replacement: "it's",
    title: "Word Confusion (its vs it's)",
    explanation: 'Did you mean the contraction "it\'s" (it is) instead of the possessive "its"?'
  },
  {
    pattern: /\b(it's)\s+(own|tail|color|purpose|name|length|size|price|speed|weight|impact)\b/gi,
    replacement: "its",
    title: "Word Confusion (it's vs its)",
    explanation: 'Did you mean the possessive "its" instead of the contraction "it\'s" (it is)?'
  },
  {
    pattern: /\b(their)\s+(going|ready|done|supposed|coming|arriving)\b/gi,
    replacement: "they're",
    title: "Word Confusion (their vs they're)",
    explanation: 'Did you mean the contraction "they\'re" (they are) instead of possessive "their"?'
  },
  {
    pattern: /\b(your)\s+(welcome|right|wrong|going|done|invited|capable)\b/gi,
    replacement: "you're",
    title: "Word Confusion (your vs you're)",
    explanation: 'Did you mean the contraction "you\'re" (you are) instead of possessive "your"?'
  },
  {
    pattern: /\b(then)\s+(I|you|he|she|it|we|they)\s+thought\b/gi,
    replacement: "than",
    title: "Word Confusion (then vs than)",
    explanation: 'For comparison, use "than" rather than chronological "then".'
  },
  {
    pattern: /\bmore\s+([a-zA-Z]+)\s+(then)\b/gi,
    replacement: "than",
    title: "Word Confusion (then vs than)",
    explanation: 'In comparative structures ("more ... than"), use "than".'
  },
  {
    pattern: /\b(loose)\s+(weight|money|time|access|control|hope|power|sight)\b/gi,
    replacement: "lose",
    title: "Word Confusion (loose vs lose)",
    explanation: 'Use the verb "lose" (to misplace or shed) rather than the adjective "loose" (not tight).'
  },
  {
    pattern: /\b(affect)\s+(the\s+outcome|the\s+result|our\s+decision|the\s+growth)\b/gi,
    replacement: "affect",
    title: "Word Usage",
    explanation: 'Ensure active verb "affect" is intended.'
  },
  {
    pattern: /\b(could of|should of|would of)\b/gi,
    replacement: "could have",
    title: "Grammar (Nonstandard Construction)",
    explanation: 'Replace nonstandard "could of / should of" with "could have / should have".'
  },
];

// Spanish redundancies and common grammar rules
const ES_RULES: Array<{ pattern: RegExp; replacement: string; title: string; explanation: string; category: GrammarCategory }> = [
  { pattern: /\ben base a\b/gi, replacement: 'con base en', title: 'Locución preposicional', explanation: 'Se recomienda usar "con base en" o "a base de" en lugar de "en base a".', category: 'grammar' },
  { pattern: /\ba nivel de\b/gi, replacement: 'en el ámbito de', title: 'Locución imprecisa', explanation: 'Evite "a nivel de" si puede sustituirse por "en", "en el ámbito de" o "en la escala de".', category: 'style' },
  { pattern: /\bde acuerdo a\b/gi, replacement: 'de acuerdo con', title: 'Régimen preposicional', explanation: 'La norma culta prefiere "de acuerdo con" frente a "de acuerdo a".', category: 'grammar' },
  { pattern: /\bmas sin embargo\b/gi, replacement: 'sin embargo', title: 'Pleonasmo', explanation: 'Elimine "mas" ante "sin embargo" para evitar redundancia.', category: 'redundancy' },
];

// French redundancies and common grammar rules
const FR_RULES: Array<{ pattern: RegExp; replacement: string; title: string; explanation: string; category: GrammarCategory }> = [
  { pattern: /\bau jour d'aujourd'hui\b/gi, replacement: "aujourd'hui", title: 'Pléonasme', explanation: 'Utilisez simplement "aujourd\'hui" pour éviter la redondance.', category: 'redundancy' },
  { pattern: /\bmalgré que\b/gi, replacement: 'bien que', title: 'Conjonction incorrecte', explanation: '"Malgré que" est incorrect (sauf avec "avoir"). Préférez "bien que" + subjonctif.', category: 'grammar' },
  { pattern: /\bmonter en haut\b/gi, replacement: 'monter', title: 'Pléonasme', explanation: 'Le verbe "monter" implique déjà d\'aller en haut.', category: 'redundancy' },
];

// German redundancies and common grammar rules
const DE_RULES: Array<{ pattern: RegExp; replacement: string; title: string; explanation: string; category: GrammarCategory }> = [
  { pattern: /\bSinn machen\b/gi, replacement: 'Sinn ergeben', title: 'Anglizismus', explanation: 'Im Deutschen sagt man vorzugsweise "Sinn ergeben" oder "sinnvoll sein".', category: 'style' },
  { pattern: /\bdesweiteren\b/gi, replacement: 'des Weiteren', title: 'Rechtschreibung', explanation: 'Nach neuer Rechtschreibung getrennt: "des Weiteren".', category: 'spelling' },
  { pattern: /\bzukunftspläne\b/gi, replacement: 'Pläne', title: 'Pleonasmus', explanation: 'Pläne beziehen sich stets auf die Zukunft.', category: 'redundancy' },
];

/**
 * Scans text for rule-based grammar, punctuation, redundancy, and style issues.
 */
export function analyzeGrammar(text: string, langCode: string = 'en'): GrammarSuggestion[] {
  if (!text || !text.trim()) return [];

  const suggestions: GrammarSuggestion[] = [];
  let suggestionCount = 0;

  // 1. Repeated consecutive words across all languages ("the the", "is is", "de de", "la la")
  const repeatedWordRegex = /\b([a-zA-ZÀ-ÿ]+)\s+\1\b/gi;
  let match: RegExpExecArray | null;
  while ((match = repeatedWordRegex.exec(text)) !== null) {
    const word = match[1];
    suggestions.push({
      id: `rep_${suggestionCount++}_${match.index}`,
      category: 'grammar',
      title: 'Repeated Word',
      explanation: `The word "${word}" appears twice consecutively. Remove the duplicate.`,
      originalText: match[0],
      replacementText: word,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      language: langCode,
    });
  }

  // 2. Space before punctuation (Universal rule)
  const spaceBeforePunctRegex = /\s+([,.:;!?])/g;
  while ((match = spaceBeforePunctRegex.exec(text)) !== null) {
    // In French, space before ?, !, :, ; is standard, but before period or comma is wrong
    if (langCode === 'fr' && (match[1] === '?' || match[1] === '!' || match[1] === ':' || match[1] === ';')) {
      continue;
    }
    suggestions.push({
      id: `punc_${suggestionCount++}_${match.index}`,
      category: 'punctuation',
      title: 'Space Before Punctuation',
      explanation: 'Remove extraneous whitespace preceding punctuation marks.',
      originalText: match[0],
      replacementText: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      language: langCode,
    });
  }

  // 3. Repeated punctuation (e.g. "??", "!!", "?!")
  const multiplePunctRegex = /([?!]){2,}/g;
  while ((match = multiplePunctRegex.exec(text)) !== null) {
    suggestions.push({
      id: `mpunc_${suggestionCount++}_${match.index}`,
      category: 'punctuation',
      title: 'Multiple Punctuation Marks',
      explanation: 'Use a single punctuation mark for clean, professional writing.',
      originalText: match[0],
      replacementText: match[0].charAt(0),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      language: langCode,
    });
  }

  // 4. Multiple consecutive spaces
  const multipleSpacesRegex = /[^\S\r\n]{2,}/g;
  while ((match = multipleSpacesRegex.exec(text)) !== null) {
    suggestions.push({
      id: `space_${suggestionCount++}_${match.index}`,
      category: 'style',
      title: 'Multiple Consecutive Spaces',
      explanation: 'Replace multiple spaces with a single space.',
      originalText: match[0],
      replacementText: ' ',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      language: langCode,
    });
  }

  // 5. Sentence starting with lowercase letter after sentence punctuation
  const lowercaseSentenceRegex = /(?:^|[.!?]\s+)([a-zà-ÿ])/g;
  while ((match = lowercaseSentenceRegex.exec(text)) !== null) {
    const char = match[1];
    const fullMatch = match[0];
    const charOffset = match.index + fullMatch.length - 1;
    suggestions.push({
      id: `cap_${suggestionCount++}_${charOffset}`,
      category: 'capitalization',
      title: 'Capitalization',
      explanation: 'Capitalize the first letter of a sentence.',
      originalText: char,
      replacementText: char.toUpperCase(),
      startIndex: charOffset,
      endIndex: charOffset + 1,
      language: langCode,
    });
  }

  // 6. Language-specific rules
  if (langCode.startsWith('en')) {
    // English Redundancies
    for (const item of EN_REDUNDANT_PHRASES) {
      const regex = new RegExp(item.pattern.source, item.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        let rep = item.replacement;
        if (match[0].charAt(0) === match[0].charAt(0).toUpperCase()) {
          rep = rep.charAt(0).toUpperCase() + rep.slice(1);
        }
        suggestions.push({
          id: `red_${suggestionCount++}_${match.index}`,
          category: 'redundancy',
          title: 'Wordy Phrase',
          explanation: item.explanation,
          originalText: match[0],
          replacementText: rep,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          language: 'en',
        });
      }
    }

    // English Confusing words
    for (const item of EN_CONFUSING_WORDS) {
      const regex = new RegExp(item.pattern.source, item.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        let rep = item.replacement;
        if (match[0].charAt(0) === match[0].charAt(0).toUpperCase()) {
          rep = rep.charAt(0).toUpperCase() + rep.slice(1);
        }
        suggestions.push({
          id: `conf_${suggestionCount++}_${match.index}`,
          category: 'grammar',
          title: item.title,
          explanation: item.explanation,
          originalText: match[1] || match[0],
          replacementText: rep,
          startIndex: match.index,
          endIndex: match.index + (match[1] ? match[1].length : match[0].length),
          language: 'en',
        });
      }
    }
  } else if (langCode.startsWith('es')) {
    for (const item of ES_RULES) {
      const regex = new RegExp(item.pattern.source, item.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        suggestions.push({
          id: `es_${suggestionCount++}_${match.index}`,
          category: item.category,
          title: item.title,
          explanation: item.explanation,
          originalText: match[0],
          replacementText: item.replacement,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          language: 'es',
        });
      }
    }
  } else if (langCode.startsWith('fr')) {
    for (const item of FR_RULES) {
      const regex = new RegExp(item.pattern.source, item.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        suggestions.push({
          id: `fr_${suggestionCount++}_${match.index}`,
          category: item.category,
          title: item.title,
          explanation: item.explanation,
          originalText: match[0],
          replacementText: item.replacement,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          language: 'fr',
        });
      }
    }
  } else if (langCode.startsWith('de')) {
    for (const item of DE_RULES) {
      const regex = new RegExp(item.pattern.source, item.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        suggestions.push({
          id: `de_${suggestionCount++}_${match.index}`,
          category: item.category,
          title: item.title,
          explanation: item.explanation,
          originalText: match[0],
          replacementText: item.replacement,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          language: 'de',
        });
      }
    }
  }

  return suggestions.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Applies a specific suggestion replacement to the original text.
 * Validates that the originalText still matches the text at the expected offset.
 * If offset drifted due to previous replacements, performs safe local search.
 */
export function applySuggestion(text: string, suggestion: GrammarSuggestion): string {
  const { startIndex, endIndex, originalText, replacementText } = suggestion;

  // Direct exact match at index
  if (text.slice(startIndex, endIndex) === originalText) {
    return text.slice(0, startIndex) + replacementText + text.slice(endIndex);
  }

  // Fallback: Safe local fuzzy search within +/- 30 characters
  const windowStart = Math.max(0, startIndex - 30);
  const windowEnd = Math.min(text.length, endIndex + 30);
  const searchWindow = text.slice(windowStart, windowEnd);
  const localIndex = searchWindow.indexOf(originalText);

  if (localIndex !== -1) {
    const actualStart = windowStart + localIndex;
    const actualEnd = actualStart + originalText.length;
    return text.slice(0, actualStart) + replacementText + text.slice(actualEnd);
  }

  // Fallback 2: Global first occurrence
  const globalIndex = text.indexOf(originalText);
  if (globalIndex !== -1) {
    return text.slice(0, globalIndex) + replacementText + text.slice(globalIndex + originalText.length);
  }

  // If text was deleted or completely changed, return unchanged
  return text;
}
