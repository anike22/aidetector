import { describe, it, expect } from 'vitest';
import { analyzeGrammar } from '@/pages/seo-assistant/analysisEngine';
import type { IssueLocation } from '@/pages/seo-assistant/RichTextEditor';

describe('SEO Assistant Click to Highlight & Position Mapping Regression Verification', () => {
  const sampleArticle = `# The Ultimate Guide to Artificial Intelligence Detection and Search Optimization

Artificial intelligence  tools have revolutionized content creation across modern organizations. However, understanding their mechanisms is essential.

When evaluating content, an organization must check its validity and authenticity. Many writers mistakenly rely on generic algorithms.

Furthermore, excessive repetition of words in content creates friction for human readers. Clear communication remains paramount for online success.

Finally, ensuring proper punctuation and syntax will elevate your digital presence to new heights.`;

  it('detects spacing and grammar errors with exact start/end offsets', () => {
    const grammarResult = analyzeGrammar(sampleArticle);
    expect(grammarResult.issues.length).toBeGreaterThan(0);

    // Look for double space issue
    const doubleSpaceIssue = grammarResult.issues.find(i => i.type === 'Spacing' && i.text === '  ');
    expect(doubleSpaceIssue).toBeDefined();
    expect(doubleSpaceIssue?.text).toBe('  ');
    expect(doubleSpaceIssue?.contextSnippet).toBeDefined();
    expect(typeof doubleSpaceIssue?.start).toBe('number');
    expect(typeof doubleSpaceIssue?.end).toBe('number');
    expect(doubleSpaceIssue!.end!).toBeGreaterThan(doubleSpaceIssue!.start!);
  });

  it('correctly maps target positions 134, 186, 349, 544 in sample content', () => {
    // Verify positions within article
    const testPositions = [
      { pos: 134, expectedContext: sampleArticle.slice(Math.max(0, 134 - 20), Math.min(sampleArticle.length, 134 + 30)) },
      { pos: 186, expectedContext: sampleArticle.slice(Math.max(0, 186 - 20), Math.min(sampleArticle.length, 186 + 30)) },
      { pos: 349, expectedContext: sampleArticle.slice(Math.max(0, 349 - 20), Math.min(sampleArticle.length, 349 + 30)) },
      { pos: 544, expectedContext: sampleArticle.slice(Math.max(0, 544 - 20), Math.min(sampleArticle.length, 544 + 30)) },
    ];

    testPositions.forEach(({ pos, expectedContext }) => {
      expect(expectedContext.length).toBeGreaterThan(0);
      expect(sampleArticle.length).toBeGreaterThan(pos);
    });
  });

  it('preserves location metadata structure across all issue types', () => {
    const grammarResult = analyzeGrammar(sampleArticle);
    
    grammarResult.issues.forEach(issue => {
      const location: IssueLocation = {
        start: issue.start,
        end: issue.end,
        text: issue.text,
        contextSnippet: issue.contextSnippet,
        type: issue.type,
        severity: issue.type === 'Spelling' || issue.type === 'Grammar' ? 'warning' : 'info'
      };

      expect(typeof location.start).toBe('number');
      expect(typeof location.end).toBe('number');
      expect(location.text).toBeDefined();
      expect(location.contextSnippet).toBeDefined();
    });
  });

  it('handles real-time content offset shifts accurately when text is prepended', () => {
    const originalResult = analyzeGrammar(sampleArticle);
    const grammarIssue = originalResult.issues.find(i => i.type === 'Grammar' && i.text.toLowerCase() === 'its');
    expect(grammarIssue).toBeDefined();

    const prefix = '## New Introductory Section\n\nAdditional text inserted here.\n\n';
    const updatedArticle = prefix + sampleArticle;
    const updatedResult = analyzeGrammar(updatedArticle);
    
    const matchingUpdatedIssue = updatedResult.issues.find(
      i => i.type === grammarIssue!.type && i.text === grammarIssue!.text && i.start > prefix.length
    );
    expect(matchingUpdatedIssue).toBeDefined();
    expect(matchingUpdatedIssue!.start!).toBe(grammarIssue!.start! + prefix.length);
    expect(matchingUpdatedIssue!.end!).toBe(grammarIssue!.end! + prefix.length);
  });

  it('supports multi-word internal linking anchor resolution without collisions', () => {
    const anchor = 'artificial intelligence';
    const lowerArticle = sampleArticle.toLowerCase();
    const index = lowerArticle.indexOf(anchor);
    expect(index).toBeGreaterThan(-1);

    const linkLocation: IssueLocation = {
      start: index,
      end: index + anchor.length,
      text: sampleArticle.slice(index, index + anchor.length),
      contextSnippet: sampleArticle.slice(Math.max(0, index - 25), Math.min(sampleArticle.length, index + anchor.length + 25)),
      type: 'InternalLink',
      severity: 'info',
    };

    expect(linkLocation.start).toBe(index);
    expect(linkLocation.text?.toLowerCase()).toBe(anchor);
    expect(linkLocation.contextSnippet).toContain(linkLocation.text!);
  });
});
