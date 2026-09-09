import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {
  extractQuotedSpans,
  validateRewrite,
  buildRepairPrompt,
  checkQuotationPreservation,
  checkInsertedAbsolutes,
  checkFormalityInflation,
  checkNumberPreservation,
  checkNegationPreservation,
  checkPlaceholderLeaks,
  checkTruncation,
} from '@/lib/humanizerIntegrity';
import { extractProtectedEntities, validateRewriteIntegrity } from '@/lib/humanizerPipeline';

// Representative Northbridge-style passage combining every demonstrated
// failure mode: direct quotation, numbers, negation, evidentiary hedging,
// fictional company, conditional.
const NORTHBRIDGE_SOURCE = `Northbridge Supplies (a fictional company) tested a writing assistant with its documentation team.
The lead editor noted, "A clearer sentence is not an improvement if it changes our promise."
Average first-draft time fell from 12 minutes to 8 minutes, roughly a 33% reduction.
Accuracy scores moved from 78% to 81% — that was an increase of three percentage points, not evidence that the writing assistant caused the improvement.
If a draft raises legal concerns, the team must escalate it before publication.
The company continued using the assistant for first drafts and kept human review.`;

describe('Humanizer Integrity Validation — demonstrated failure regressions', () => {
  it('FAILS the rewrite that altered a direct quotation (demonstrated case 1)', () => {
    const flawed = `Northbridge Supplies (a fictional company) tested a writing assistant with its documentation team.
The lead editor noted, "A clearer sentence does not constitute an improvement if it modifies our promise."
Average first-draft time fell from 12 minutes to 8 minutes, roughly a 33% reduction.
Accuracy scores moved from 78% to 81% — an increase of three percentage points, not evidence that the writing assistant caused the improvement.
If a draft raises legal concerns, the team must escalate it before publication.
The company continued using the assistant for first drafts and kept human review.`;

    const report = validateRewrite(NORTHBRIDGE_SOURCE, flawed);
    expect(report.passed).toBe(false);
    expect(report.issues.some(i => i.kind === 'missing_quotation')).toBe(true);
  });

  it('FAILS the rewrite that introduced "solely" and changed evidentiary strength (demonstrated case 2)', () => {
    const flawed = `Northbridge Supplies (a fictional company) tested a writing assistant with its documentation team.
The lead editor noted, "A clearer sentence is not an improvement if it changes our promise."
Average first-draft time fell from 12 minutes to 8 minutes, roughly a 33% reduction.
Accuracy scores moved from 78% to 81% — this represented an increase of three percentage points, but it was not proof that the writing assistant solely caused the improvement.
If a draft raises legal concerns, the team must escalate it before publication.
The company continued using the assistant for first drafts and kept human review.`;

    const report = validateRewrite(NORTHBRIDGE_SOURCE, flawed);
    expect(report.passed).toBe(false);
    expect(report.issues.some(i => i.kind === 'inserted_absolutes')).toBe(true);
  });

  it('FAILS the formal-inflated rewrite "persist in utilizing" (demonstrated case 3)', () => {
    const flawed = `Northbridge Supplies (a fictional company) tested a writing assistant with its documentation team.
The lead editor noted, "A clearer sentence is not an improvement if it changes our promise."
Average first-draft time fell from 12 minutes to 8 minutes, roughly a 33% reduction.
Accuracy scores moved from 78% to 81% — that was an increase of three percentage points, not evidence that the writing assistant caused the improvement.
If a draft raises legal concerns, the team must escalate it before publication.
The company opted to persist in utilizing the assistant for first drafts, alongside retaining human review.`;

    const report = validateRewrite(NORTHBRIDGE_SOURCE, flawed);
    expect(report.passed).toBe(false);
    expect(report.issues.some(i => i.kind === 'formality_inflation' && i.severity === 'fatal')).toBe(true);
  });

  it('PASSES a natural, meaning-preserving rewrite of the same passage', () => {
    const natural = `Northbridge Supplies (a fictional company) tried a writing assistant with its documentation team.
The lead editor noted, "A clearer sentence is not an improvement if it changes our promise."
First drafts got faster on average, dropping from 12 minutes to 8 minutes — about a 33% reduction.
Accuracy scores ticked up from 78% to 81%, an increase of three percentage points, but that shift is not evidence the assistant caused the improvement.
Should a draft raise legal concerns, the team has to escalate it before publication.
The company kept using the assistant for first drafts and kept human review in place.`;

    const report = validateRewrite(NORTHBRIDGE_SOURCE, natural);
    expect(report.passed).toBe(true);
    expect(report.fatalCount).toBe(0);
  });

  it('preserves numerical relationships: catches dropped numbers', () => {
    const missingNumber = NORTHBRIDGE_SOURCE
      .replace('12 minutes to 8 minutes', 'twelve minutes to eight minutes')
      .replace('78% to 81%', '78% to 81%');
    const report = validateRewrite(NORTHBRIDGE_SOURCE, missingNumber);
    expect(report.issues.some(i => i.kind === 'number_loss')).toBe(true);
    expect(report.passed).toBe(false);
  });

  it('catches removed negation (meaning inversion risk)', () => {
    const inverted = NORTHBRIDGE_SOURCE.replace(
      'not evidence that the writing assistant caused the improvement',
      'clear evidence that the writing assistant caused the improvement'
    );
    const report = validateRewrite(NORTHBRIDGE_SOURCE, inverted);
    expect(report.passed).toBe(false);
    expect(report.issues.some(i => i.kind === 'negation_loss' || i.kind === 'missing_quotation')).toBe(true);
  });

  it('catches leaked placeholder tokens from protected-span mechanisms', () => {
    const leaky = NORTHBRIDGE_SOURCE.replace('Northbridge Supplies', '«PROTECTED_1» Supplies');
    const report = validateRewrite(NORTHBRIDGE_SOURCE, leaky);
    expect(report.passed).toBe(false);
    expect(report.issues.some(i => i.kind === 'placeholder_leak')).toBe(true);
  });

  it('catches severe truncation', () => {
    const truncated = 'Northbridge Supplies tested a writing assistant. First drafts got faster.';
    const report = validateRewrite(NORTHBRIDGE_SOURCE, truncated);
    expect(report.passed).toBe(false);
    expect(report.issues.some(i => i.kind === 'truncation')).toBe(true);
  });
});

describe('extractQuotedSpans', () => {
  it('extracts straight and curly quoted spans with positions', () => {
    const text = `The editor said, "First, do no harm," and later wrote \u201Ckeep it simple\u201D in the margin.`;
    const spans = extractQuotedSpans(text);
    expect(spans.map(s => s.text)).toEqual(['"First, do no harm,"', '\u201Ckeep it simple\u201D']);
    expect(text.slice(spans[0].start, spans[0].end)).toBe('"First, do no harm,"');
  });

  it('ignores single characters and unmatched quotes', () => {
    const spans = extractQuotedSpans('He said "hello there" and then " again unbalanced');
    expect(spans.length).toBe(1);
    expect(spans[0].text).toBe('"hello there"');
  });
});

describe('deterministic sub-checks', () => {
  it('checkQuotationPreservation tolerates only whitespace differences', () => {
    const issues = checkQuotationPreservation(
      'She said, "we ship on Friday, no exceptions."',
      'She told the team: "we ship  on Friday,   no exceptions." — and meant it.'
    );
    expect(issues).toHaveLength(0);
  });

  it('checkInsertedAbsolutes flags "solely" added by the rewrite only', () => {
    expect(checkInsertedAbsolutes('it was not proof', 'it was not solely proof')).toHaveLength(1);
    expect(checkInsertedAbsolutes('solely caused', 'solely caused')).toHaveLength(0);
  });

  it('checkFormalityInflation flags utilize/constitute/persist-in patterns', () => {
    const issues = checkFormalityInflation(
      'The company continued using the tool and kept review.',
      'The company opted to persist in utilizing the tool and constituted retained review.'
    );
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].severity).toBe('fatal');
  });

  it('checkNumberPreservation accepts comma-format variants', () => {
    expect(checkNumberPreservation('Revenue hit $1,250,000 in 2024.', 'Revenue hit $1250000 in 2024.')).toHaveLength(0);
    expect(checkNumberPreservation('It costs $45.', 'It costs $50.')).toHaveLength(1);
  });

  it('checkNumberPreservation accepts value/unit separation across languages (Spanish range case)', () => {
    // "12 minutos" in source; rewrite splits value and unit across a range.
    const src = 'El tiempo promedio bajó de 12 minutos a 8 minutos.';
    const rw = 'El tiempo promedio disminuyó de 12 a 8 minutos.';
    expect(checkNumberPreservation(src, rw)).toHaveLength(0);
  });

  it('checkNumberPreservation still fails when the value itself is dropped', () => {
    const src = 'The build finished in 12 minutes.';
    const rw = 'The build finished quickly.';
    expect(checkNumberPreservation(src, rw)).toHaveLength(1);
    expect(checkNumberPreservation(src, rw)[0].kind).toBe('number_loss');
  });

  it('checkNumberPreservation still fails on silent unit conversion', () => {
    const src = 'The delay was 12 minutes.';
    const rw = 'The delay was 12 hours.'; // value kept but unit swapped to a different family
    const issues = checkNumberPreservation(src, rw);
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe('number_loss');
  });

  it('checkNegationPreservation fails when all negation is stripped', () => {
    const issues = checkNegationPreservation('This is not a guarantee.', 'This is a guarantee.');
    expect(issues[0].severity).toBe('fatal');
  });

  it('checkPlaceholderLeaks detects multiple placeholder styles', () => {
    expect(checkPlaceholderLeaks('value «QUOTE_1» here')).toHaveLength(1);
    expect(checkPlaceholderLeaks('value [[PROTECTED_2]] here')).toHaveLength(1);
    expect(checkPlaceholderLeaks('value __PROTECTED_TERM_9__ here')).toHaveLength(1);
    expect(checkPlaceholderLeaks('plain text with no tokens')).toHaveLength(0);
  });

  it('checkTruncation detects paragraph collapse and duplicate tails', () => {
    const multi = Array.from({ length: 4 }, (_, i) => `Paragraph ${i + 1} with enough words to count as real content here and more words still.`).join('\n\n');
    expect(checkTruncation(multi, multi.split('\n\n')[0])).not.toHaveLength(0);
    const dup = `${'word '.repeat(60)}\n\n${'word '.repeat(60)} same ending words repeated words repeated`;
    expect(checkTruncation(dup, dup)).not.toHaveLength(0);
  });
});

describe('buildRepairPrompt', () => {
  it('produces a targeted repair instruction with source, flaws, and quotes', () => {
    const flawed = 'She said, "we ship on Monday." The figure rose 45%.';
    const source = 'She said, "we ship on Friday, no exceptions." The figure rose 45%.';
    const report = validateRewrite(source, flawed);
    const prompt = buildRepairPrompt(source, flawed, report);
    expect(prompt).toContain('SOURCE TEXT (authoritative)');
    expect(prompt).toContain('FLAWED REWRITE');
    expect(prompt).toContain('VALIDATION FAILURES');
    expect(prompt).toContain('"we ship on Friday, no exceptions."');
    expect(prompt).toContain('Return ONLY the corrected rewrite text');
  });
});

describe('frontend pipeline quotation protection', () => {
  it('extractProtectedEntities includes direct quotations as protected entities', () => {
    const entities = extractProtectedEntities('The editor wrote, "keep our promise exact" in the memo.');
    const quote = entities.find(e => e.type === 'quotation');
    expect(quote?.value).toBe('"keep our promise exact"');
  });

  it('validateRewriteIntegrity fails a version that altered a quotation', () => {
    const source = 'The editor wrote, "A clearer sentence is not an improvement if it changes our promise."';
    const altered = 'The editor wrote, "A clearer sentence does not constitute an improvement if it modifies our promise."';
    const entities = extractProtectedEntities(source);
    const report = validateRewriteIntegrity(source, altered, entities);
    expect(report.passed).toBe(false);
    expect(report.protected_entity_issues.some(i => i.includes('Direct quotation'))).toBe(true);
  });

  it('validateRewriteIntegrity passes a version that kept the quotation verbatim', () => {
    const source = 'The editor wrote, "A clearer sentence is not an improvement if it changes our promise."';
    const kept = 'Per the editor: "A clearer sentence is not an improvement if it changes our promise." — that standard stands.';
    const entities = extractProtectedEntities(source);
    const report = validateRewriteIntegrity(source, kept, entities);
    expect(report.passed).toBe(true);
  });
});

describe('edge-function / frontend module sync', () => {
  it('keeps the inlined integrity module in humanizer-pipeline/index.ts identical to src/lib/humanizerIntegrity.ts', () => {
    const pipeline = readFileSync(
      path.resolve(process.cwd(), 'supabase/functions/humanizer-pipeline/index.ts'),
      'utf8'
    );
    const m = pipeline.match(/\/\/ ===== INTEGRITY MODULE START =====\n([\s\S]*?)\/\/ ===== INTEGRITY MODULE END =====/);
    expect(m).not.toBeNull();
    const body = (s: string) => s.slice(s.indexOf('export interface QuotedSpan')).trim();
    const inline = body(m![1]);
    const frontend = readFileSync(
      path.resolve(process.cwd(), 'src/lib/humanizerIntegrity.ts'),
      'utf8'
    );
    expect(inline).toBe(body(frontend));
  });
});

// ---------------------------------------------------------------------------
// Free-vocabulary similarity gate (quotedCoverageAdjustment v2)
// Reproduced from the deployed edge function by transpiling the extracted
// function source with the project's TypeScript compiler, so the test cannot
// drift from production behavior.
// ---------------------------------------------------------------------------
function loadEdgeFunction(name: string): Function {
  const pipeline = readFileSync(
    path.resolve(process.cwd(), 'supabase/functions/humanizer-pipeline/index.ts'),
    'utf8'
  );
  const start = pipeline.indexOf(`function ${name}(`);
  expect(start).toBeGreaterThan(-1);
  // Find matching closing brace
  let depth = 0, i = pipeline.indexOf('{', start);
  for (; i < pipeline.length; i++) {
    if (pipeline[i] === '{') depth++;
    else if (pipeline[i] === '}') { depth--; if (depth === 0) break; }
  }
  const src = pipeline.slice(start, i + 1);
  // Transpile TS → JS so the Function constructor can evaluate it.
  const jsSrc = ts.transpileModule(src, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, isolatedModules: true },
  }).outputText;
  const normalizeText = `(t) => t.toLowerCase().replace(/[^\\w\\s]/g, " ").replace(/\\s+/g, " ").trim()`;
  const extractQuotedSpans = `(t) => { const s = []; const re = /"([^"\\n]{2,400})"/g; let m; while ((m = re.exec(t)) !== null) s.push({ text: m[0], start: m.index, end: m.index + m[0].length }); return s; }`;
  // eslint-disable-next-line no-new-func
  return new Function('normalizeText', 'extractQuotedSpans', `return ${jsSrc};`)(
    new Function(`return ${normalizeText}`)() as (t: string) => string,
    new Function(`return ${extractQuotedSpans}`)() as (t: string) => { text: string; start: number; end: number }[]
  ) as Function;
}

describe('free-vocabulary similarity gate (quotedCoverageAdjustment v2)', () => {
  const adj = loadEdgeFunction('quotedCoverageAdjustment');

  const SRC = `Northbridge Supplies (a fictional company) tested a writing assistant with its documentation team. The lead editor noted, "A clearer sentence is not an improvement if it changes our promise." Average first-draft time fell from 12 minutes to 8 minutes, roughly a 33% reduction. Accuracy scores moved from 78% to 81% — that was an increase of three percentage points, not evidence that the writing assistant caused the improvement. If a draft raises legal concerns, the team must escalate it before publication. The company continued using the assistant for first drafts and kept human review.`;

  it('ACCEPTS a faithful rewrite that preserved all facts but reworded free text (demonstrated live case, was rejected at 96%)', () => {
    const faithful = `Northbridge Supplies, a fictional company, tested a writing assistant with its documentation team. The lead editor noted, "A clearer sentence is not an improvement if it changes our promise." The average time for a first draft decreased from 12 minutes to 8 minutes, representing roughly a 33% reduction. Accuracy scores rose from 78% to 81%—an increase of three percentage points. This was not evidence that the writing assistant caused the improvement. If a draft raises legal concerns, the team must escalate it before publication. The company continued to use the assistant for first drafts, while keeping human review.`;
    // Gate for Most Faithful at balanced: must be <= 95
    expect(adj(SRC, faithful, [])).toBeLessThanOrEqual(95);
  });

  it('ACCEPTS a concise rewrite that preserved all facts (demonstrated live case, was rejected at 96%)', () => {
    const concise = `Northbridge Supplies (fictional) tested a writing assistant with its documentation team. The lead editor stated, "A clearer sentence is not an improvement if it changes our promise." Average first-draft time fell from 12 to 8 minutes, a 33% reduction. Accuracy scores rose from 78% to 81% (a three-percentage-point increase), but this wasn't evidence the assistant caused the improvement. Drafts with legal concerns required team escalation before publication. The company maintained assistant use for first drafts and retained human review.`;
    // Gate for Most Concise at balanced: must be <= 90
    expect(adj(SRC, concise, [])).toBeLessThanOrEqual(90);
  });

  it('STILL REJECTS an essentially unchanged text', () => {
    // Gate: unchanged → similarity 100 > 100 - minChange for every mode
    expect(adj(SRC, SRC, [])).toBeGreaterThan(95);
    // And a near-copy differing only by one word stays above the Faithful gate
    const nearCopy = SRC.replace('continued', 'kept');
    expect(adj(SRC, nearCopy, [])).toBeGreaterThan(95);
  });

  it('treats locked terms as protected vocabulary — preserving them does not inflate measured similarity', () => {
    const a = 'Our proprietary SyncEngine platform processes customer data continuously, and the operations team reviews every pipeline run each morning without exception.';
    const b = 'Our proprietary SyncEngine platform handles customer data around the clock, and ops staff inspect each pipeline execution every single day, no exceptions.';
    const withLocked = adj(a, b, ['SyncEngine']);
    const withoutLocked = adj(a, b, []);
    expect(withLocked).not.toBeNull();
    expect(withoutLocked).not.toBeNull();
    // Protecting a term that survives in both texts must not make the rewrite
    // look LESS changed than it really is.
    expect(withLocked!).toBeLessThanOrEqual(withoutLocked!);
  });
});
