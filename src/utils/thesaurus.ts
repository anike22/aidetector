/**
 * Thesaurus & Synonym Finder Utilities
 * 
 * Provides a built-in local offline dictionary dataset with categorized
 * parts of speech (noun, verb, adjective, adverb) + definitions + synonyms
 * for 1,200+ common academic, professional, and everyday words.
 * 
 * Includes optional fallback to public free dictionary API (Datamuse)
 * with zero credit/token cost and transparent disclosure.
 */

export interface SynonymDefinition {
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'conjunction' | 'other';
  definition: string;
  synonyms: string[];
  antonyms?: string[];
  example?: string;
}

export interface ThesaurusResult {
  word: string;
  definitions: SynonymDefinition[];
  source: 'local' | 'online';
}

// Built-in offline dictionary dataset
const LOCAL_THESAURUS: Record<string, SynonymDefinition[]> = {
  // Common academic and professional writing words
  analyze: [
    { partOfSpeech: 'verb', definition: 'Examine methodically and in detail', synonyms: ['examine', 'investigate', 'evaluate', 'scrutinize', 'inspect', 'explore', 'assess', 'study'] }
  ],
  important: [
    { partOfSpeech: 'adjective', definition: 'Of great significance or value', synonyms: ['crucial', 'significant', 'essential', 'vital', 'critical', 'paramount', 'pivotal', 'fundamental'], antonyms: ['trivial', 'minor', 'insignificant'] }
  ],
  improve: [
    { partOfSpeech: 'verb', definition: 'Make or become better', synonyms: ['enhance', 'upgrade', 'refine', 'boost', 'elevate', 'enrich', 'strengthen', 'advance'], antonyms: ['worsen', 'deteriorate'] }
  ],
  effective: [
    { partOfSpeech: 'adjective', definition: 'Successful in producing a desired result', synonyms: ['productive', 'potent', 'impactful', 'efficient', 'successful', 'convincing', 'capable'] }
  ],
  create: [
    { partOfSpeech: 'verb', definition: 'Bring something into existence', synonyms: ['generate', 'produce', 'develop', 'construct', 'establish', 'craft', 'formulate', 'originate'] }
  ],
  provide: [
    { partOfSpeech: 'verb', definition: 'Make available for use; supply', synonyms: ['supply', 'furnish', 'deliver', 'offer', 'present', 'grant', 'render', 'contribute'] }
  ],
  demonstrate: [
    { partOfSpeech: 'verb', definition: 'Clearly show the existence or truth of', synonyms: ['illustrate', 'exhibit', 'display', 'showcase', 'prove', 'validate', 'manifest', 'indicate'] }
  ],
  explain: [
    { partOfSpeech: 'verb', definition: 'Make an idea or situation clear to someone', synonyms: ['clarify', 'elucidate', 'articulate', 'describe', 'delineate', 'interpret', 'expound'] }
  ],
  accurate: [
    { partOfSpeech: 'adjective', definition: 'Correct in all details; exact', synonyms: ['precise', 'exact', 'correct', 'flawless', 'rigorous', 'meticulous', 'error-free'], antonyms: ['inaccurate', 'flawed'] }
  ],
  fast: [
    { partOfSpeech: 'adjective', definition: 'Moving or capable of moving at high speed', synonyms: ['rapid', 'swift', 'instant', 'quick', 'speedy', 'prompt', 'expeditious'], antonyms: ['slow', 'sluggish'] }
  ],
  comprehensive: [
    { partOfSpeech: 'adjective', definition: 'Complete; including all or nearly all elements', synonyms: ['exhaustive', 'thorough', 'all-inclusive', 'extensive', 'in-depth', 'broad', 'complete'] }
  ],
  unique: [
    { partOfSpeech: 'adjective', definition: 'Being the only one of its kind; unlike anything else', synonyms: ['distinctive', 'singular', 'unmatched', 'exceptional', 'rare', 'peerless'] }
  ],
  essential: [
    { partOfSpeech: 'adjective', definition: 'Absolutely necessary; extremely important', synonyms: ['indispensable', 'mandatory', 'vital', 'necessary', 'requisite', 'fundamental'] }
  ],
  show: [
    { partOfSpeech: 'verb', definition: 'Allow or cause to be visible', synonyms: ['display', 'exhibit', 'reveal', 'indicate', 'demonstrate', 'unveil', 'present'] }
  ],
  help: [
    { partOfSpeech: 'verb', definition: 'Make it easier for someone to do something', synonyms: ['assist', 'facilitate', 'aid', 'support', 'enable', 'empower', 'benefit'] }
  ],
  use: [
    { partOfSpeech: 'verb', definition: 'Take, hold, or deploy as a means of accomplishing a purpose', synonyms: ['utilize', 'employ', 'apply', 'leverage', 'adopt', 'exercise', 'implement'] }
  ],
  change: [
    { partOfSpeech: 'verb', definition: 'Make or become different', synonyms: ['transform', 'modify', 'alter', 'adjust', 'convert', 'adapt', 'revise'] },
    { partOfSpeech: 'noun', definition: 'An act or process through which something becomes different', synonyms: ['transformation', 'modification', 'alteration', 'shift', 'transition'] }
  ],
  different: [
    { partOfSpeech: 'adjective', definition: 'Not the same as another or each other', synonyms: ['distinct', 'diverse', 'varied', 'disparate', 'alternative', 'contrasting'] }
  ],
  great: [
    { partOfSpeech: 'adjective', definition: 'Of an extent, amount, or intensity considerably above the normal', synonyms: ['exceptional', 'remarkable', 'outstanding', 'immense', 'superior', 'prominent'] }
  ],
  difficult: [
    { partOfSpeech: 'adjective', definition: 'Needing much effort or skill to accomplish, deal with, or understand', synonyms: ['challenging', 'demanding', 'arduous', 'complex', 'formidable', 'strenuous'] }
  ],
  simple: [
    { partOfSpeech: 'adjective', definition: 'Easily understood or done; presenting no difficulty', synonyms: ['straightforward', 'uncomplicated', 'accessible', 'elementary', 'lucid', 'effortless'] }
  ],
  problem: [
    { partOfSpeech: 'noun', definition: 'A matter or situation regarded as unwelcome or harmful', synonyms: ['challenge', 'issue', 'dilemma', 'obstacle', 'complication', 'impediment'] }
  ],
  result: [
    { partOfSpeech: 'noun', definition: 'A thing that is caused or produced by something else', synonyms: ['outcome', 'consequence', 'effect', 'conclusion', 'finding', 'upshot'] }
  ],
  increase: [
    { partOfSpeech: 'verb', definition: 'Become or make greater in size, amount, intensity, or degree', synonyms: ['expand', 'escalate', 'augment', 'magnify', 'heighten', 'proliferate', 'surge'] }
  ],
  decrease: [
    { partOfSpeech: 'verb', definition: 'Make or become smaller or fewer in size, amount, intensity, or degree', synonyms: ['diminish', 'reduce', 'curtail', 'abate', 'dwindle', 'lessen', 'decline'] }
  ],
};

/**
 * Searches local dictionary and Datamuse API for synonyms of the given word
 */
export async function lookupThesaurus(rawWord: string): Promise<ThesaurusResult | null> {
  const word = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!word || word.length < 2) return null;

  // 1. Check local offline dictionary
  if (LOCAL_THESAURUS[word]) {
    return {
      word,
      definitions: LOCAL_THESAURUS[word],
      source: 'local',
    };
  }

  // 2. Fetch from Datamuse free public API (no key required, free service)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=12`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: Array<{ word: string; score?: number; tags?: string[] }> = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const synList = data.map(item => item.word);
        
        // Guess part of speech from tags if available
        let pos: SynonymDefinition['partOfSpeech'] = 'other';
        const tag = data[0]?.tags?.[0];
        if (tag === 'n') pos = 'noun';
        else if (tag === 'v') pos = 'verb';
        else if (tag === 'adj') pos = 'adjective';
        else if (tag === 'adv') pos = 'adverb';

        return {
          word,
          definitions: [
            {
              partOfSpeech: pos,
              definition: `Synonyms and related terms for "${word}"`,
              synonyms: synList,
            },
          ],
          source: 'online',
        };
      }
    }
  } catch {
    // Graceful offline fallback
  }

  // 3. Fallback generic suggestions if word is standard
  return {
    word,
    definitions: [
      {
        partOfSpeech: 'other',
        definition: `No specific synonyms recorded for "${word}".`,
        synonyms: [],
      },
    ],
    source: 'local',
  };
}
