/** Deterministic reading rubric. Its points are heuristics, not calibrated authorship probabilities. */
export interface ReadingEvidenceCheck {
  id: string;
  label: string;
  finding: string;
  value: number;
  weight: number;
  points: number;
  candidatePoints: number;
  excerpts: { text: string; start: number; end: number }[];
}
export interface ReadingEvidence {
  version: string;
  applicable: boolean;
  eligible: boolean;
  checks: ReadingEvidenceCheck[];
  positivePoints: number;
  counterPoints: number;
  netPoints: number;
  corroboratingFamilies: string[];
  limitations: string[];
}
const tokenize = (s: string) => (s.toLowerCase().match(/[a-z]+/g) || []);
const stops = new Set('the and that this with from have your their they you for can will are but not its into more some when what than these those also would could should which about there because'.split(' '));
const terms = (s: string) => new Set(tokenize(s).filter(w => w.length > 3 && !stops.has(w)));
const overlap = (a: Set<string>, b: Set<string>) => {
  let n = 0; for (const w of a) if (b.has(w)) n++;
  return n / Math.max(1, a.size + b.size - n);
};
const count = (s: string, re: RegExp) => [...s.matchAll(re)].length;
const qualification = /\b(?:depends on|can vary|not guaranteed|no fixed answer|keep in mind|assuming|rather than|not automatically|doesn.t mean|does not mean|shouldn.t (?:interpret|be|assume)|not a guaranteed|could (?:also )?change)\b/gi;
const recommendation = /\b(?:before (?:buying|spending|joining|paying)|consider|check|calculate|compare|research|estimate|avoid|review|run (?:the numbers|several))\b/gi;
const illustrative = /\b(?:suppose|imagine|for example|mathematical example|assuming|let.s say|hypothetically)\b/gi;
const observation = /\b(?:I|we)\s+(?:tested|measured|observed|recorded|operated|installed|repaired|interviewed|compared|checked|noticed|found|used|wrote|collected|researched|attended)\b/gi;
const attribution = /https?:\/\/[^\s)]+|\baccording to\s+(?=[A-Z])[^.!?\n]+|\[[0-9]+\]|\([A-Z][a-z]+(?: et al\.)?,?\s*(?:19|20)\d{2}\)/g;
const datedRecord = /\b(?:19|20)\d{2}[-/]\d{1,2}[-/]\d{1,2}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+(?:19|20)\d{2})?\b/gi;
function excerpts(text: string, re: RegExp) {
  return [...text.matchAll(re)].slice(0, 3).map(m => {
    const start = Math.max(0, m.index! - 45), end = Math.min(text.length, m.index! + m[0].length + 85);
    return { text: text.slice(start, end), start, end };
  });
}
function sectionsOf(text: string) {
  const headings = [...text.matchAll(/^#{1,6}\s+.+$/gm)];
  if (!headings.length) return [{ text, start: 0 }];
  return headings.map((h, i) => {
    const start = h.index! + h[0].length;
    return { text: text.slice(start, headings[i + 1]?.index ?? text.length), start };
  }).filter(s => tokenize(s.text).length >= 30);
}
export function analyzeReadingEvidence(text: string, languageCode = 'en'): ReadingEvidence {
  const words = Math.max(1, text.trim().split(/\s+/).length);
  const sections = sectionsOf(text);
  const headings = [...text.matchAll(/^#{1,6}\s+(.+)$/gm)];
  const applicable = languageCode === 'en' && words >= 600;
  const checks: ReadingEvidenceCheck[] = [];
  const add = (id: string, label: string, value: number, weight: number, finding: string, examples: ReadingEvidenceCheck['excerpts'] = []) => {
    const points = applicable ? Number((value * weight).toFixed(2)) : 0;
    checks.push({ id, label, value, weight, points, candidatePoints: points, finding, excerpts: examples });
  };
  const perThousand = (n: number) => n * 1000 / words;
  // Definition/explanation followed by illustration then a later qualification.
  const templates = sections.filter(s => {
    const example = [...s.text.matchAll(illustrative)][0];
    const caution = [...s.text.matchAll(qualification)].find(m => m.index! > (example?.index ?? Infinity));
    return Boolean(example && caution && tokenize(s.text.slice(0, example.index)).length >= 10);
  });
  const patternRatio = sections.length >= 5 ? templates.length / sections.length : 0;
  add('organization', 'Overall organization', headings.length, 0, `${headings.length} headings and ${sections.length} substantial sections. Organization alone is neutral.`);
  add('section-pattern', 'Explanation → example → qualification', patternRatio, 24, `${templates.length}/${sections.length} sections have an illustration followed by a later qualification.`, templates.slice(0, 3).map(s => ({ text: s.text.trim().slice(0, 220), start: s.start + s.text.indexOf(s.text.trim()), end: s.start + s.text.indexOf(s.text.trim()) + Math.min(220, s.text.trim().length) })));
  // Cross-section near-duplicate claims, not mere reuse of a topical word.
  const sentences = [...text.matchAll(/[^.!?\n]+[.!?]?/g)].map(m => ({ text: m[0].trim(), start: m.index! + m[0].indexOf(m[0].trim()), terms: terms(m[0]), section: sections.findIndex(s => m.index! >= s.start && m.index! < s.start + s.text.length) })).filter(s => s.terms.size >= 7 && s.section >= 0);
  const repeated = new Set<number>();
  for (let i = 0; i < sentences.length; i++) for (let j = i + 1; j < sentences.length; j++) {
    if (sentences[i].section !== sentences[j].section && overlap(sentences[i].terms, sentences[j].terms) >= 0.55) repeated.add(j);
  }
  const duplicateRate = repeated.size / Math.max(1, sentences.length);
  add('repeated-ideas', 'Repeated claims across sections', duplicateRate, 20, `${repeated.size}/${sentences.length} substantive sentences closely overlap earlier sentences in another section. This is lexical similarity, not full semantic understanding.`, [...repeated].slice(0, 3).map(i => ({ text: sentences[i].text, start: sentences[i].start, end: sentences[i].start + sentences[i].text.length })));
  const hypotheticalCount = count(text, illustrative);
  const sourceCount = count(text, attribution);
  const firsthandCount = count(text, observation);
  const hypothesisDensity = perThousand(hypotheticalCount);
  add('hypothetical-examples', 'Hypothetical rather than attributed examples', sourceCount === 0 && firsthandCount === 0 ? hypothesisDensity : 0, 3, `${hypotheticalCount} illustration markers, ${sourceCount} attribution markers and ${firsthandCount} firsthand-observation claims. Hypotheticals are weak supporting evidence only when other families concur.`, excerpts(text, illustrative));
  add('firsthand-experience', 'Firsthand operational or testing claims', perThousand(firsthandCount), -3, `${firsthandCount} claimed firsthand observations; their truth is not verified. Absence contributes zero AI points.`, excerpts(text, observation));
  const recordCount = count(text, datedRecord);
  const genericPattern = sections.length >= 8 && templates.length >= 2 && hypotheticalCount >= 2 && sourceCount === 0 && firsthandCount === 0 ? patternRatio : 0;
  add('grounding', 'Specificity and source attribution', genericPattern, 8, `${sourceCount} source markers and ${recordCount} dated-record markers. Only an existing repeated hypothetical pattern receives support; missing sources alone contribute zero.`, excerpts(text, attribution));
  add('attributed-evidence', 'Attributed evidence countercheck', perThousand(sourceCount + (firsthandCount > 0 ? recordCount : 0)), -2, 'Attributed sources and dates connected to firsthand claims mitigate style suspicion; they are not authenticated.');
  // Tone/regularity is a limited measurable proxy for the qualitative reading.
  const lengths = sections.map(s => tokenize(s.text).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const cv = lengths.length >= 5 ? Math.sqrt(lengths.reduce((n, v) => n + (v - mean) ** 2, 0) / lengths.length) / Math.max(1, mean) : 1;
  const uniformity = Math.max(0, 1 - cv);
  add('voice', 'Consistency of explanatory presentation', templates.length >= 2 ? uniformity : 0, 4, `Section-length regularity is ${uniformity.toFixed(2)}. This is a presentation proxy; polish or grammar alone is not AI evidence.`);
  const caveatCount = count(text, qualification);
  add('qualifications', 'Repeated qualification language', perThousand(caveatCount), 0.75, `${caveatCount} qualification matches (${perThousand(caveatCount).toFixed(2)} per 1,000 words).`, excerpts(text, qualification));
  const questionHeadings = headings.filter(h => h[1].includes('?')).length;
  add('seo', 'SEO framing and promotional closing', questionHeadings, 0, `${questionHeadings} question headings. Keyword framing and promotion are neutral, not authorship evidence.`);
  const lastHeading = headings[headings.length - 1];
  const hasConclusion = Boolean(lastHeading && /conclusion|final thoughts|summary|takeaways/i.test(lastHeading[1]));
  const conclusion = hasConclusion ? text.slice(lastHeading!.index! + lastHeading![0].length) : '';
  const earlierTerms = terms(hasConclusion ? text.slice(0, lastHeading!.index) : '');
  const conclusionTerms = terms(conclusion);
  const conclusionRecall = conclusionTerms.size ? [...conclusionTerms].filter(t => earlierTerms.has(t)).length / conclusionTerms.size : 0;
  // A recap is expected. Only near-duplicate claims in a recap contribute points.
  const repeatedConclusion = hasConclusion ? [...repeated].filter(i => sentences[i].start >= lastHeading!.index!).length : 0;
  add('conclusion', 'Conclusion repetition', perThousand(repeatedConclusion), 2, `${repeatedConclusion} near-duplicate concluding claims; vocabulary recap coverage ${conclusionRecall.toFixed(2)}. Ordinary summarization contributes zero.`);
  const prose = text.replace(/^#{1,6}.*$/gm, '').replace(/^\s*[-*]\s+.*$/gm, '');
  const sentenceLengths = prose.split(/[.!?](?=\s|$)/).map(s => tokenize(s).length).filter(n => n >= 3);
  const averageSentence = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(1, sentenceLengths.length);
  const sentenceCV = averageSentence ? Math.sqrt(sentenceLengths.reduce((n, v) => n + (v - averageSentence) ** 2, 0) / Math.max(1, sentenceLengths.length)) / averageSentence : 0;
  const contractions = count(text, /\b(?:isn.t|doesn.t|don.t|can.t|won.t|there.s|that.s|you.re|we.ll)\b/gi);
  const arithmetic = [...text.matchAll(/([\d,.]+)\s*[×÷*]\s*\$?([\d,.]+)\s*=\s*\$?([\d,.]+)/g)];
  const correctArithmetic = arithmetic.filter(m => {
    const number = (v: string) => Number(v.replace(/,/g, ''));
    const expected = m[0].includes('÷') ? number(m[1]) / number(m[2]) : number(m[1]) * number(m[2]);
    return Number.isFinite(expected) && Math.abs(expected - number(m[3])) <= Math.max(0.01, Math.abs(expected) * 0.001);
  }).length;
  const counterStrength = (sentenceCV >= 0.5 ? 1 : 0) + (contractions >= 3 ? 0.5 : 0) + (correctArithmetic > 0 ? 0.5 : 0);
  add('counter-evidence', 'Rhythm, conversational phrasing and arithmetic', counterStrength, -2, `Sentence-length CV ${sentenceCV.toFixed(2)}, ${contractions} contractions, ${correctArithmetic}/${arithmetic.length} checked arithmetic expressions correct. These are compatible with either origin, so mitigation is modest.`);
  add('prior-knowledge', 'Prior knowledge and provenance', 0, 0, 'Prior conversation, user authorship labels, filenames, website names and expected scores are excluded from this calculation.');
  const families = [patternRatio >= 0.1 && 'structure', duplicateRate >= 0.02 && 'repetition', hypothesisDensity >= 1 && 'illustration', perThousand(caveatCount) >= 3 && 'qualification'].filter((v): v is string => Boolean(v));
  const eligible = applicable && families.length >= 3;
  if (!eligible) for (const check of checks) check.points = 0;
  const positivePoints = Number(checks.reduce((n, c) => n + Math.max(0, c.points), 0).toFixed(2));
  const counterPoints = Number(checks.reduce((n, c) => n + Math.min(0, c.points), 0).toFixed(2));
  return { version: 'reading-rubric-v1', applicable, eligible, checks, positivePoints, counterPoints, netPoints: eligible ? Number((positivePoints + counterPoints).toFixed(2)) : 0, corroboratingFamilies: families, limitations: ['Rule weights are provisional and have not been calibrated on an independent labelled holdout.', 'English long-form rubric; short and other-language inputs receive no reading adjustment.', 'Lexical similarity and marker checks approximate contextual reading; sources and firsthand claims are not verified.', 'No target-score override, topic-specific authorship rule or provenance shortcut is used.'] };
}
