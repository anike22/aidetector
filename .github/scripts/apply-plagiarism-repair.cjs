const fs = require('fs');

const pagePath = 'src/pages/PlagiarismCheckerPage.tsx';
let page = fs.readFileSync(pagePath, 'utf8');
const oldBox = 'className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2.5"';
const newBox = 'className="flex items-start gap-2 text-xs text-white/90 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5"';
if (page.includes(oldBox)) page = page.replace(oldBox, newBox);
page = page.replace('<p className="mt-1 opacity-70">{coverageSummary(result)}</p>', '<p className="mt-1 text-white/75">{coverageSummary(result)}</p>');
fs.writeFileSync(pagePath, page);

const backendPath = 'supabase/functions/plagiarism-checker/index.ts';
let code = fs.readFileSync(backendPath, 'utf8');
code = code.replace('const MAX_DISCOVERY_QUERIES = 6;', 'const MAX_DISCOVERY_QUERIES = 10;');
const start = code.indexOf('function extractDistinctivePhrases(text: string): string[] {');
const end = code.indexOf('\nfunction extractEntityFactQueries', start);
if (start < 0 || end < 0) throw new Error('Distinctive phrase function anchors not found');
const replacement = `function extractDistinctivePhrases(text: string): string[] {
  const sentences = splitSentences(text).slice(0, 24);
  const allToks = tokenise(text);
  const freq = new Map<string, number>();
  for (const t of allToks) freq.set(t, (freq.get(t) ?? 0) + 1);

  const perSentence: Array<{ phrase: string; score: number; sentenceIndex: number }> = [];
  for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
    const toks = tokenise(sentences[sentenceIndex].text);
    if (toks.length < 8) continue;
    let best: { phrase: string; score: number; sentenceIndex: number } | null = null;
    const maxStart = Math.min(Math.max(0, toks.length - 6), 10);
    for (let phraseStart = 0; phraseStart <= maxStart; phraseStart++) {
      const window = toks.slice(phraseStart, phraseStart + Math.min(8, toks.length - phraseStart));
      if (window.length < 6) continue;
      const ratio = contentWordRatio(window);
      const rareCount = window.filter((t) => isRareToken(t, freq)).length;
      if (ratio < 0.35) continue;
      const score = rareCount * 2 + ratio;
      const candidate = { phrase: window.join(' '), score, sentenceIndex };
      if (!best || candidate.score > best.score) best = candidate;
    }
    if (best) perSentence.push(best);
  }

  // Preserve mixed-document coverage: allocate one distinctive query to each
  // passage before allowing high-scoring phrases from one passage to dominate.
  const diverse = [...perSentence]
    .sort((a, b) => a.sentenceIndex - b.sentenceIndex)
    .map((x) => x.phrase);
  const ranked = [...perSentence]
    .sort((a, b) => b.score - a.score)
    .map((x) => x.phrase);
  return [...new Set([...diverse, ...ranked])].slice(0, 6);
}
`;
code = code.slice(0, start) + replacement + code.slice(end);
fs.writeFileSync(backendPath, code);
