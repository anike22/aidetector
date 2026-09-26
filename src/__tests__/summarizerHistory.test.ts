import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSummaryHistory,
  saveSummaryToHistory,
  removeSummaryFromHistory,
  clearSummaryHistory,
} from '@/utils/summarizerHistory';
import type { SummarizeResult } from '@/lib/summarizerApi';

const mockResult: SummarizeResult = {
  success: true,
  summary: {
    format: 'paragraphs',
    items: ['This is a test summary paragraph highlighting key findings.'],
    label: 'Paragraphs',
  },
  stats: {
    input_words: 120,
    output_words: 10,
    reduction_pct: 92,
  },
  references: [],
  target_words: '40–60 words',
  coverage: {
    mode: 'single-pass',
    chunks: 1,
    processed_chunks: 1,
    full: true,
  },
  validation: {
    passed: true,
    checks_run: ['names', 'numbers', 'negation', 'coverage'],
    warnings: [],
  },
  settings: {
    length: 'short',
    format: 'paragraphs',
    focus: null,
    language: 'English',
  },
  usage: {
    is_trial_check: true,
    credits_charged: 0,
    trial_checks_remaining: 4,
    remaining_credits: 0,
  },
};

describe('summarizerHistory utility', () => {
  beforeEach(() => {
    clearSummaryHistory();
  });

  it('starts with an empty history', () => {
    expect(getSummaryHistory()).toEqual([]);
  });

  it('saves and retrieves recent summary items', () => {
    const item = saveSummaryToHistory({
      title: 'Stanford Remote Work Study',
      inputText: 'Full source text of the study...',
      inputWords: 120,
      fileName: 'study.txt',
      result: mockResult,
      settings: {
        length: 'short',
        format: 'paragraphs',
        language: 'English',
      },
    });

    expect(item.id).toBeDefined();
    expect(item.timestamp).toBeGreaterThan(0);

    const history = getSummaryHistory();
    expect(history.length).toBe(1);
    expect(history[0].title).toBe('Stanford Remote Work Study');
    expect(history[0].inputWords).toBe(120);
  });

  it('removes individual summary items', () => {
    const item1 = saveSummaryToHistory({
      title: 'Item 1',
      inputText: 'Text 1',
      inputWords: 50,
      result: mockResult,
      settings: { length: 'short', format: 'paragraphs', language: 'English' },
    });

    const item2 = saveSummaryToHistory({
      title: 'Item 2',
      inputText: 'Text 2',
      inputWords: 60,
      result: {
        ...mockResult,
        summary: { ...mockResult.summary, items: ['Unique summary 2'] },
      },
      settings: { length: 'medium', format: 'bullet_points', language: 'English' },
    });

    expect(getSummaryHistory().length).toBe(2);

    const after = removeSummaryFromHistory(item1.id);
    expect(after.length).toBe(1);
    expect(after[0].id).toBe(item2.id);
  });

  it('clears all history items completely', () => {
    saveSummaryToHistory({
      title: 'Item 1',
      inputText: 'Text 1',
      inputWords: 50,
      result: mockResult,
      settings: { length: 'short', format: 'paragraphs', language: 'English' },
    });

    clearSummaryHistory();
    expect(getSummaryHistory()).toEqual([]);
  });
});
