import { describe, it, expect } from 'vitest';
import {
  toUpperCase,
  toLowerCase,
  toSentenceCase,
  toTitleCase,
  applyCaseTransformation,
} from '../utils/caseConverter';
import {
  countSyllables,
  isComplexWord,
  calculateReadabilityMetrics,
} from '../utils/readability';
import {
  analyzeGrammar,
  applySuggestion,
} from '../utils/grammarAssistant';
import { lookupThesaurus } from '../utils/thesaurus';

describe('Editor Controls & Writing Assistant Utilities', () => {
  describe('Case Conversion Utilities', () => {
    it('converts text to UPPERCASE', () => {
      expect(toUpperCase('hello world')).toBe('HELLO WORLD');
      expect(toUpperCase('')).toBe('');
    });

    it('converts text to lowercase', () => {
      expect(toLowerCase('HELLO WORLD')).toBe('hello world');
      expect(toLowerCase('')).toBe('');
    });

    it('converts text to Sentence case properly', () => {
      const input = 'hello world. this is a TEST! another question? yes.';
      const expected = 'Hello world. This is a test! Another question? Yes.';
      expect(toSentenceCase(input)).toBe(expected);
    });

    it('converts text to Title Case respecting APA minor words', () => {
      const input = 'the lord of the rings and a tale of two cities';
      const expected = 'The Lord of the Rings and a Tale of Two Cities';
      expect(toTitleCase(input)).toBe(expected);

      const hyphenated = 'state-of-the-art technology in action';
      const expectedHyphen = 'State-of-the-Art Technology in Action';
      expect(toTitleCase(hyphenated)).toBe(expectedHyphen);
    });

    it('applies case transformation on highlighted text selection', () => {
      const fullText = 'The quick brown fox jumps over the lazy dog.';
      // Transform "brown fox" (indices 10 to 19) to UPPERCASE
      const result = applyCaseTransformation(fullText, 'upper', 10, 19);
      expect(result.newText).toBe('The quick BROWN FOX jumps over the lazy dog.');
      expect(result.transformedSelectionStart).toBe(10);
      expect(result.transformedSelectionEnd).toBe(19);
    });
  });

  describe('Readability Utilities', () => {
    it('accurately counts syllables for common words', () => {
      expect(countSyllables('the')).toBe(1);
      expect(countSyllables('simple')).toBe(2);
      expect(countSyllables('important')).toBe(3);
      expect(countSyllables('comprehensive')).toBe(4);
    });

    it('identifies complex words with >= 3 syllables', () => {
      expect(isComplexWord('cat')).toBe(false);
      expect(isComplexWord('wonderful')).toBe(true);
      expect(isComplexWord('extraordinary')).toBe(true);
    });

    it('calculates Flesch Reading Ease and Grade Level', () => {
      const simpleText = 'The cat sat on the mat. It was a good cat. The dog ran fast.';
      const simpleMetrics = calculateReadabilityMetrics(simpleText);
      expect(simpleMetrics.fleschReadingEase).toBeGreaterThan(80);
      expect(simpleMetrics.fleschKincaidGradeLevel).toBeLessThan(5);

      const complexText = 'The epidemiological investigations demonstrated statistically significant correlations between cardiovascular pathology and anthropogenic atmospheric particulate matter concentration.';
      const complexMetrics = calculateReadabilityMetrics(complexText);
      expect(complexMetrics.fleschReadingEase).toBeLessThan(30);
      expect(complexMetrics.fleschKincaidGradeLevel).toBeGreaterThan(12);
    });
  });

  describe('Grammar & Writing Assistant Utilities', () => {
    it('detects repeated consecutive words', () => {
      const text = 'This is the the best way to write.';
      const suggestions = analyzeGrammar(text);
      const repeated = suggestions.find(s => s.category === 'grammar' && s.title === 'Repeated Word');
      expect(repeated).toBeDefined();
      expect(repeated?.originalText).toBe('the the');
      expect(repeated?.replacementText).toBe('the');

      // Test applySuggestion
      const fixed = applySuggestion(text, repeated!);
      expect(fixed).toBe('This is the best way to write.');
    });

    it('detects wordy phrases and redundancies', () => {
      const text = 'We need this in order to succeed at the present time.';
      const suggestions = analyzeGrammar(text);
      expect(suggestions.some(s => s.originalText.toLowerCase() === 'in order to')).toBe(true);
      expect(suggestions.some(s => s.originalText.toLowerCase() === 'at the present time')).toBe(true);
    });

    it('detects spacing before punctuation and multiple question marks', () => {
      const text = 'Is this working ?? Yes , it is !!';
      const suggestions = analyzeGrammar(text);
      expect(suggestions.some(s => s.title === 'Multiple Punctuation Marks')).toBe(true);
      expect(suggestions.some(s => s.title === 'Space Before Punctuation')).toBe(true);
    });

    it('detects lowercase sentence starters', () => {
      const text = 'First sentence. second sentence starts lowercase.';
      const suggestions = analyzeGrammar(text, 'en');
      expect(suggestions.some(s => s.title === 'Capitalization' && s.replacementText === 'S')).toBe(true);
    });

    it('detects multi-language grammar and redundancy issues (Spanish, French, German)', () => {
      // Spanish: "en base a" -> "con base en"
      const spanishText = 'El informe fue elaborado en base a los datos recolectados.';
      const spanishSuggestions = analyzeGrammar(spanishText, 'es');
      expect(spanishSuggestions.some(s => s.originalText.toLowerCase() === 'en base a')).toBe(true);

      // French: "au jour d'aujourd'hui" -> "aujourd'hui"
      const frenchText = "Au jour d'aujourd'hui, la situation évolue rapidement.";
      const frenchSuggestions = analyzeGrammar(frenchText, 'fr');
      expect(frenchSuggestions.some(s => s.originalText.toLowerCase().includes("au jour d'aujourd'hui"))).toBe(true);

      // German: "Sinn machen" -> "Sinn ergeben"
      const germanText = 'Dieser Vorschlag kann durchaus Sinn machen.';
      const germanSuggestions = analyzeGrammar(germanText, 'de');
      expect(germanSuggestions.some(s => s.originalText.toLowerCase() === 'sinn machen')).toBe(true);
    });
  });

  describe('Thesaurus Utilities', () => {
    it('looks up synonyms in local dictionary', async () => {
      const result = await lookupThesaurus('important');
      expect(result).not.toBeNull();
      expect(result?.source).toBe('local');
      expect(result?.definitions[0].synonyms).toContain('crucial');
      expect(result?.definitions[0].synonyms).toContain('essential');
    });

    it('handles unknown words gracefully with fallback', async () => {
      const result = await lookupThesaurus('xyznonexistentword99');
      expect(result).not.toBeNull();
      expect(result?.word).toBe('xyznonexistentword');
    });
  });
});
