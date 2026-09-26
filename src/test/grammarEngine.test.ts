import { describe, it, expect } from 'vitest';
import { analyzeGrammar } from '@/pages/seo-assistant/analysisEngine';

describe('Grammar & Spacing Accuracy Engine — Comprehensive Verification', () => {
  // =========================================================================
  // SECTION 11: REQUIRED REGRESSION TESTS (A to J)
  // =========================================================================

  it('TEST A: "Their content passed the evaluation." -> NO their/there/they\'re warning', () => {
    const text = 'Their content passed the evaluation.';
    const result = analyzeGrammar(text);
    const confusionIssues = result.issues.filter(i => /their|there|they're/i.test(i.text));
    expect(confusionIssues.length).toBe(0);
  });

  it('TEST B: "There are several reasons." -> NO confusion warning', () => {
    const text = 'There are several reasons.';
    const result = analyzeGrammar(text);
    const confusionIssues = result.issues.filter(i => /their|there|they're/i.test(i.text));
    expect(confusionIssues.length).toBe(0);
  });

  it('TEST C: "They\'re preparing their content." -> NO confusion warning', () => {
    const text = "They're preparing their content.";
    const result = analyzeGrammar(text);
    const confusionIssues = result.issues.filter(i => /their|there|they're/i.test(i.text));
    expect(confusionIssues.length).toBe(0);
  });

  it('TEST D: "There content passed the evaluation." -> likely suggest "Their"', () => {
    const text = 'There content passed the evaluation.';
    const result = analyzeGrammar(text);
    const issue = result.issues.find(i => i.text.toLowerCase() === 'there');
    expect(issue).toBeDefined();
    expect(issue?.suggestion.toLowerCase()).toBe('their');
    expect(issue?.ruleId).toBe('confusion-there-their');
  });

  it('TEST E: "The invention of AI detectors have led to significant changes." -> detect subject-verb disagreement and suggest "has"', () => {
    const text = 'The invention of AI detectors have led to significant changes.';
    const result = analyzeGrammar(text);
    const svaIssue = result.issues.find(i => i.type === 'Agreement' || i.ruleId.startsWith('sva-'));
    expect(svaIssue).toBeDefined();
    expect(svaIssue?.suggestion).toMatch(/has/i);
    expect(svaIssue?.text).toMatch(/have/i);
  });

  it('TEST F: "The results of the experiment are available." -> NO agreement warning', () => {
    const text = 'The results of the experiment are available.';
    const result = analyzeGrammar(text);
    const agreementIssues = result.issues.filter(i => i.type === 'Agreement');
    expect(agreementIssues.length).toBe(0);
  });

  it('TEST G: "This sentence contains  two spaces." -> exactly one spacing issue', () => {
    const text = 'This sentence contains  two spaces.';
    const result = analyzeGrammar(text);
    const spacingIssues = result.issues.filter(i => i.type === 'Spacing');
    expect(spacingIssues.length).toBe(1);
    expect(spacingIssues[0].text).toBe('  ');
    expect(spacingIssues[0].suggestion).toBe('Remove extra spaces');
  });

  it('TEST H: "This sentence contains one space." -> NO spacing warning', () => {
    const text = 'This sentence contains one space.';
    const result = analyzeGrammar(text);
    const spacingIssues = result.issues.filter(i => i.type === 'Spacing');
    expect(spacingIssues.length).toBe(0);
  });

  it('TEST I: "This is incorrect ." -> detect unwanted space before period', () => {
    const text = 'This is incorrect .';
    const result = analyzeGrammar(text);
    const punctIssue = result.issues.find(i => i.ruleId === 'spacing-before-punctuation');
    expect(punctIssue).toBeDefined();
    expect(punctIssue?.suggestion).toContain('Remove space before');
    expect(punctIssue?.text).toBe(' .');
  });

  it('TEST J: "Visit https://aidetector.cx for information." -> no false URL spacing/punctuation warnings', () => {
    const text = 'Visit https://aidetector.cx for information.';
    const result = analyzeGrammar(text);
    const urlIssues = result.issues.filter(i => i.text.includes('https') || i.text.includes('aidetector'));
    expect(urlIssues.length).toBe(0);
  });

  // =========================================================================
  // SECTION 12: PRODUCTION REGRESSION TEST
  // =========================================================================

  it('PRODUCTION REGRESSION: evaluates the exact production sentence accurately', () => {
    const productionSentence =
      'Furthermore, the invention of AI detectors, have led most users of AI language models to look for means to ensure that their content passes the test when being evaluated.';

    const result = analyzeGrammar(productionSentence);

    // 1. MUST NOT flag "their" (because "their content" is possessive and grammatically correct)
    const theirIssues = result.issues.filter(i => i.text.toLowerCase() === 'their');
    expect(theirIssues.length).toBe(0);

    // 2. MUST detect subject-verb agreement issue around "have led"
    const svaIssue = result.issues.find(i => i.type === 'Agreement' || i.ruleId.startsWith('sva-'));
    expect(svaIssue).toBeDefined();
    expect(svaIssue?.text).toMatch(/have/i);
    expect(svaIssue?.suggestion).toMatch(/has/i);

    // 3. Assesses the unnecessary comma separating the subject noun phrase from the verb
    const commaIssue = result.issues.find(i => i.ruleId === 'punctuation-comma-between-subject-verb');
    expect(commaIssue).toBeDefined();
    expect(commaIssue?.type).toBe('Punctuation');
    expect(commaIssue?.suggestion).toBe('Remove comma');

    // 4. Verify all returned issues have valid slice matches
    result.issues.forEach(issue => {
      expect(productionSentence.slice(issue.start, issue.end)).toBe(issue.text);
      expect(issue.confidence).toBeGreaterThanOrEqual(0.80);
    });
  });

  // =========================================================================
  // CONTEXT-AWARE CONFUSION WORDS AUDIT
  // =========================================================================

  it('accurately resolves your vs you\'re without false positives', () => {
    // Correct usage -> NO warnings
    const correct1 = 'Your content is valuable and you\'re welcome to share it.';
    const res1 = analyzeGrammar(correct1);
    expect(res1.issues.filter(i => /your|you're/i.test(i.text)).length).toBe(0);

    // Incorrect usage: "your going to" -> should suggest "you're"
    const wrong1 = 'I think your going to love this update.';
    const res2 = analyzeGrammar(wrong1);
    const yourIssue = res2.issues.find(i => i.text.toLowerCase() === 'your');
    expect(yourIssue).toBeDefined();
    expect(yourIssue?.suggestion).toMatch(/you're/i);

    // Incorrect usage: "you're idea" -> should suggest "your"
    const wrong2 = "You're idea was brilliant.";
    const res3 = analyzeGrammar(wrong2);
    const youreIssue = res3.issues.find(i => i.text.toLowerCase() === "you're");
    expect(youreIssue).toBeDefined();
    expect(youreIssue?.suggestion).toMatch(/your/i);
  });

  it('accurately resolves its vs it\'s without false positives', () => {
    // Correct usage -> NO warnings
    const correct = "The platform updated its algorithm because it's essential for quality.";
    const res1 = analyzeGrammar(correct);
    expect(res1.issues.filter(i => /its|it's/i.test(i.text)).length).toBe(0);

    // Incorrect: "its a sunny day" -> suggest "it's"
    const wrong1 = 'Its a major breakthrough.';
    const res2 = analyzeGrammar(wrong1);
    const itsIssue = res2.issues.find(i => i.text.toLowerCase() === 'its');
    expect(itsIssue).toBeDefined();
    expect(itsIssue?.suggestion).toMatch(/it's/i);

    // Incorrect: "it's policy" -> suggest "its"
    const wrong2 = "The organization revised it's policy yesterday.";
    const res3 = analyzeGrammar(wrong2);
    const itIsIssue = res3.issues.find(i => i.text.toLowerCase() === "it's");
    expect(itIsIssue).toBeDefined();
    expect(itIsIssue?.suggestion).toMatch(/its/i);
  });

  it('accurately resolves then vs than', () => {
    const correct = 'She is taller than her brother, and then we went outside.';
    expect(analyzeGrammar(correct).issues.filter(i => i.ruleId.startsWith('confusion-then-than')).length).toBe(0);

    const wrong = 'This model is faster then the older version.';
    const res = analyzeGrammar(wrong);
    const thenIssue = res.issues.find(i => i.ruleId === 'confusion-then-than');
    expect(thenIssue).toBeDefined();
    expect(thenIssue?.suggestion).toBe('than');
  });

  it('accurately resolves affect vs effect', () => {
    const correct = 'This change will affect the score, producing a positive effect.';
    expect(analyzeGrammar(correct).issues.filter(i => /affect|effect/i.test(i.text)).length).toBe(0);

    const wrongVerb = 'This update will effect the outcome drastically.';
    const res1 = analyzeGrammar(wrongVerb);
    const effectIssue = res1.issues.find(i => i.ruleId === 'confusion-effect-verb');
    expect(effectIssue).toBeDefined();
    expect(effectIssue?.suggestion).toBe('affect');

    const wrongNoun = 'It had an immediate affect on user engagement.';
    const res2 = analyzeGrammar(wrongNoun);
    const affectIssue = res2.issues.find(i => i.ruleId === 'confusion-affect-noun');
    expect(affectIssue).toBeDefined();
    expect(affectIssue?.suggestion).toBe('effect');
  });

  // =========================================================================
  // ADDITIONAL SVA EXAMPLES FROM USER REQUIREMENTS
  // =========================================================================

  it('detects SVA mismatch in "The collection of documents are available"', () => {
    const text = 'The collection of documents are available for review.';
    const res = analyzeGrammar(text);
    const svaIssue = res.issues.find(i => i.type === 'Agreement');
    expect(svaIssue).toBeDefined();
    expect(svaIssue?.suggestion).toMatch(/is/i);
  });

  // =========================================================================
  // EXACT HIGHLIGHTING & OFFSET VERIFICATION
  // =========================================================================

  it('guarantees originalText.slice(start, end) === text for every reported issue', () => {
    const complexArticle = `# Comprehensive Guide to AI Content Detection

There content passed the initial test  with flying colors. Furthermore, the invention of AI detectors, have led most teams to evaluate it's reliability.

Visit https://example.com/api for details. Note that its a major milestone.`;

    const result = analyzeGrammar(complexArticle);
    expect(result.issues.length).toBeGreaterThan(0);

    result.issues.forEach(issue => {
      const slice = complexArticle.slice(issue.start, issue.end);
      expect(slice).toBe(issue.text);
      expect(typeof issue.start).toBe('number');
      expect(typeof issue.end).toBe('number');
      expect(issue.end).toBeGreaterThan(issue.start);
      expect(issue.contextSnippet).toBeDefined();
    });
  });
});
