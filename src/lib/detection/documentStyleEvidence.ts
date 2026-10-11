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
  sectionTemplateRepetition: number;
  paragraphSimilarity: number;
  originalEvidenceDensity: number;
  toneConsistency: number;
  semanticRepetition: number;
  crossSectionSimilarity: number;
  contextualReasoning: number;
  evidenceExplanation: string[];
  score: number;
  supportingCues: string[];
}
const caution = /\b(?:depends on|can vary|not guaranteed|no fixed answer|before (?:buying|spending|joining|paying)|keep in mind|be (?:especially )?cautious|shouldn.t (?:be|assume)|may (?:also |still )?change|could (?:also )?change|rather than|not automatically|there (?:is|are) no guarantees)\b/gi;
const advice = /\b(?:before|consider|check|calculate|compare|research|estimate|avoid|understand|review|look at)\b/gi;
const firsthand = /\b(?:i |we |my |our |i've |i.ve |i tested|we tested|my experience|i wrote|i noticed|we found)\b/gi;
const concrete = /(?:\$\s?\d|\b\d+(?:[.,]\d+)?\s?(?:TH\/s|kWh|watts|months|days|years|%|BTC)\b|https?:\/\/|\b(?:ASIC|SHA-256|Google|Semrush|Surfer|MiningLegit)\b)/gi;
const matches=(s:string,re:RegExp)=>[...s.matchAll(re)].length;
const evidence = /\bb(?:according to (?:our|my) (?:research|test|data)|in (?:our|my) (?:tests?|experiments?|measurements?)|we (?:measured|observed|recorded|interviewed)|i (?:measured|observed|recorded|interviewed)|our (?:dataset|survey|results)|i (?:personally|tested)|we (?:personally|tested))\bb/gi;
const stop = new Set(['this','that','with','from','there','these','their','they','have','will','which','when','your','what','about','just','then','more','also','into','than','only','does','must','should','could','would','were','been','because','while','them','those','much','some','very','each','over','under']);
const wordsOf=(s:string)=>new Set((s.toLowerCase().match(/[a-z]{4,}/g)||[]).filter(w=>!stop.has(w)));
const jaccard=(a:Set<string>,b:Set<string>)=>{
  let intersection=0;for(const w of a)if(b.has(w))intersection++;
  return intersection/Math.max(1,a.size+b.size-intersection);
};
const cap=(x:number)=>Math.max(0,Math.min(1,x));
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
  // Overlap across nearby content paragraphs can reveal recycled explanations.
  // Use content words rather than headings or generic SEO keywords alone.
  const paragraphSets=paragraphs.filter(p=>p.split(/\s+/).length>=25).map(wordsOf);
  const similarities=paragraphSets.slice(1).map((set,i)=>jaccard(set,paragraphSets[i]));
  const paragraphSimilarity=similarities.length?similarities.reduce((a,b)=>a+b,0)/similarities.length:0;
  const originalEvidenceDensity=1000*matches(text,evidence)/words;
  const templates=sectionSignals.map(s=>s.caution>0&&s.advice>0?'caution-and-advice':s.advice>0?'advice':s.caution>0?'caution':'descriptive');
  const templateCount=templates.filter(t=>t==='caution-and-advice').length;
  const sectionTemplateRepetition=templates.length>=5?templateCount/templates.length:0;
  const toneMarkers=paragraphs.map(p=>({
    personal:matches(p,firsthand)>0,
    caution:matches(p,caution)>0,
    imperative:matches(p,advice)>0,
  }));
  const toneDominant=toneMarkers.length
    ?Math.max(...['personal','caution','imperative'].map(k=>toneMarkers.filter(p=>p[k as keyof typeof p]).length))/toneMarkers.length
    :0;
  const toneConsistency=cap(toneDominant);
  // Semantic repetition proxy: lexical overlap after ignoring frequent function words.
  // Not an embedding model; paraphrases with disjoint vocabulary may be missed.
  const pairScores:number[]=[];
  for(let i=0;i<paragraphSets.length;i++){
    for(let j=i+1;j<Math.min(paragraphSets.length,i+9);j++){
      pairScores.push(jaccard(paragraphSets[i],paragraphSets[j]));
    }
  }
  const semanticRepetition=pairScores.length?pairScores.filter(x=>x>=0.24).length/pairScores.length:0;
  const sectionSets=sections.filter(s=>s.split(/\s+/).length>=50).map(wordsOf);
  const crossScores=sectionSets.slice(1).map((v,i)=>jaccard(v,sectionSets[i]));
  const crossSectionSimilarity=crossScores.length?crossScores.reduce((a,b)=>a+b,0)/crossScores.length:0;
  // Contextual reasoning proxy: evidence-backed claims, measurable examples,
  // and causal explanations. It is NOT a factuality or original-research verifier.
  const reasoningCount=matches(text,/\b(?:because|therefore|consequently|as a result|for example|for instance|this means|which means|if .{3,75} then)\b/gi);
  const contextualReasoning=cap((reasoningCount*2+matches(text,evidence)*3)/Math.max(1,words/120));
  const evidenceExplanation:string[]=[
    'Specificity counts concrete examples and named entities; factual correctness is not checked.',
    'Original-evidence markers indicate claimed observations, not verified provenance.',
    'Semantic repetition and reasoning are lexical proxies, not full contextual understanding.',
  ];
  const supportingCues:string[]=[];
  if(words>=600&&formulaicSectionRatio>=0.45) supportingCues.push('recurring explanatory-and-caution section pattern');
  if(words>=600&&cautionDensity>=4) supportingCues.push('frequent repeated qualification language');
  if(words>=600&&repeatedAdviceRatio>=0.42) supportingCues.push('repeated generic advice across paragraphs');
  if(words>=600&&personalExperienceDensity<1) supportingCues.push('limited first-person experience');
  if(words>=600&&sectionLengths.length>=7&&uniformity>=0.45) supportingCues.push('uniform section progression');
  if(words>=600&&paragraphSimilarity>=0.26&&paragraphSets.length>=10) supportingCues.push('recurring content vocabulary in adjacent paragraphs');
  if(words>=600&&sectionTemplateRepetition>=0.6&&sections.length>=7) supportingCues.push('repeated section-level explanation template');
  if(words>=600&&semanticRepetition>=0.20) supportingCues.push('repeated content ideas across neighboring paragraphs');
  if(words>=600&&crossSectionSimilarity>=0.30&&sectionSets.length>=5) supportingCues.push('similar content vocabulary across sections');
  // Original research and detailed examples are mitigating context, not definitive human markers.
  // Neither their presence nor their absence establishes authorship.
  // Concrete specificity is reported but cannot in itself establish authorship.
  const score=Math.min(100,Math.round(100*supportingCues.length/9));
  return {sectionCount:sections.length,paragraphs:paragraphs.length,formulaicSectionRatio,
    cautionDensity,repeatedAdviceRatio,personalExperienceDensity,namedConcreteExampleDensity,
    uniformity,sectionTemplateRepetition,paragraphSimilarity,originalEvidenceDensity,toneConsistency,semanticRepetition,crossSectionSimilarity,contextualReasoning,evidenceExplanation,score,supportingCues};
}
