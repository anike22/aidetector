/**
 * Explainable document-style evidence, independent of the character n-gram model.
 * Style is not provenance: none of these signals individually proves AI authorship.
 * Thresholds are conservative and require several independent cues to concur.
 */
export interface StyleEvidence {
  sectionCount: number;
  paragraphs: number;
  formulaicSectionRatio: number;
  cautionDensity: number;
  repeatedAdviceRatio: number;
  personalExperienceDensity: number;
  namedConcreteExampleDensity: number;
  uniformity: number;
  score: number;
  supportingCues: string[];
}
const caution = /\b(?:depends on|can vary|not guaranteed|no fixed answer|before (?:buying|spending|joining|paying)|keep in mind|be (?:especially )?cautious|shouldn.t (?:be|assume)|may (?:also |still )?change|could (?:also )?change|rather than|not automatically|there (?:is|are) no guarantees)\b/gi;
const advice = /\b(?:before|consider|check|calculate|compare|research|estimate|avoid|understand|review|look at)\b/gi;
const firsthand = /\b(?:i |we |my |our |i've |i.ve |i tested|we tested|my experience|i wrote|i noticed|we found)\b/gi;
const concrete = /(?:\$\s?\d|\b\d+(?:[.,]\d+)?\s?(?:TH\/s|kWh|watts|months|days|years|%|BTC)\b|https?:\/\/|\b(?:ASIC|SHA-256|Google|Semrush|Surfer|MiningLegit)\b)/gi;
const matches=(s:string,re:RegExp)=>[...s.matchAll(re)].length;
export function analyzeDocumentStyle(text:string):StyleEvidence {
  const sections=text.split(/^#{1,3}\s+.+$/m).map(s=>s.trim()).filter(s=>s.split(/\s+/).length>=35);
  const paragraphs=text.split(/\n\s*\n/).map(s=>s.trim()).filter(s=>s.length>35&&!s.startsWith('#'));
  const words=Math.max(1,text.trim().split(/\s+/).length);
  const cautionCount=matches(text,caution), adviceCount=matches(text,advice);
  const firsthandCount=matches(text,firsthand), concreteCount=matches(text,concrete);
  const sectionSignals=sections.map(s=>{
    const n=s.split(/\s+/).length;
    return {n,caution:matches(s,caution),advice:matches(s,advice)};
  });
  const formulaicSectionRatio=sectionSignals.length<5?0:
    sectionSignals.filter(s=>s.caution>0&&s.advice>0).length/sectionSignals.length;
  const cautionDensity=1000*cautionCount/words;
  const repeatedAdviceRatio=paragraphs.length<8?0:paragraphs.filter(p=>matches(p,advice)>0).length/paragraphs.length;
  const personalExperienceDensity=1000*firsthandCount/words;
  const namedConcreteExampleDensity=1000*concreteCount/words;
  const sectionLengths=sectionSignals.map(s=>s.n);
  const avg=sectionLengths.reduce((a,b)=>a+b,0)/Math.max(1,sectionLengths.length);
  const cv=sectionLengths.length<5?1:Math.sqrt(sectionLengths.reduce((sum,n)=>sum+(n-avg)**2,0)/sectionLengths.length)/Math.max(1,avg);
  const uniformity=Math.max(0,1-cv);
  const supportingCues:string[]=[];
  if(words>=600&&formulaicSectionRatio>=0.45) supportingCues.push('recurring explanatory-and-caution section pattern');
  if(words>=600&&cautionDensity>=4) supportingCues.push('frequent repeated qualification language');
  if(words>=600&&repeatedAdviceRatio>=0.42) supportingCues.push('repeated generic advice across paragraphs');
  if(words>=600&&personalExperienceDensity<1) supportingCues.push('limited first-person experience');
  if(words>=600&&sectionLengths.length>=7&&uniformity>=0.45) supportingCues.push('uniform section progression');
  // Concrete specificity is reported but cannot in itself establish authorship.
  const score=Math.min(100,Math.round(100*supportingCues.length/5));
  return {sectionCount:sections.length,paragraphs:paragraphs.length,formulaicSectionRatio,
    cautionDensity,repeatedAdviceRatio,personalExperienceDensity,namedConcreteExampleDensity,
    uniformity,score,supportingCues};
}
