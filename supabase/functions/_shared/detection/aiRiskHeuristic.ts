export interface AIRiskResult {
  humanScore: number;
  aiScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendations: string[];
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
}

function getWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

const AI_MARKER_PATTERNS = [
  /\bdelv(?:e|es|ed|ing)\s+(?:in|into)\b/i,
  /\bserves?\s+as\s+a\s+testament\b/i,
  /\ba\s+testament\s+to\b/i,
  /\b(?:rich|vibrant)\s+tapestry\b/i,
  /\ba\s+beacon\s+of\b/i,
  /\bplays?\s+a\s+(?:crucial|pivotal|vital|significant|key)\s+role\b/i,
  /\bit\s+is\s+worth\s+noting\b/i,
  /\bit\s+is\s+important\s+to\s+note\b/i,
  /\bit\s+is\s+crucial\s+to\s+(?:understand|remember|note)\b/i,
  /\bit\s+is\s+(?:essential|imperative)\s+to\b/i,
  /\bneedless\s+to\s+say\b/i,
  /\bas\s+previously\s+mentioned\b/i,
  /\bwithout\s+further\s+ado\b/i,
  /\bnavigat(?:e|ing)\s+(?:this|the)\s+(?:landscape|realm|complexities)\b/i,
  /\bin\s+(?:this\s+)?summary\b/i,
  /\bin\s+conclusion\b/i,
  /\bto\s+summarize\b/i,
  /\ball\s+in\s+all\b/i,
  /\bgame[- ]changer\b/i,
  /\bseamlessly\s+integrat(?:e|ed|ing|es)\b/i,
  /\bseamless\s+integration\b/i,
  /\bfosters?\s+a\s+sense\b/i,
  /\bsheds?\s+light\s+on\b/i,
  /\bharness(?:ing)?\s+the\s+power\s+of\b/i,
  /\bunlock(?:ing)?\s+the\s+potential\b/i,
  /\bembark(?:ing)?\s+on\s+a\s+journey\b/i,
  /\bin\s+today's\s+(?:fast-paced|digital|interconnected)\s+world\b/i,
  /\bat\s+the\s+forefront\s+of\b/i,
  /\bfurthermore\b/i,
  /\bmoreover\b/i,
  /\badditionally\b/i,
  /\bin\s+addition\b/i,
  /\bconsequently\b/i,
  /\bultimately\b/i,
  /\bnotably\b/i,
  /\bimportantly\b/i,
  /\bin\s+essence\b/i,
  /\bby\s+(?:understanding|embracing|leveraging|incorporating)\b/i,
  /\ba\s+wide\s+(?:array|range|variety)\s+of\b/i,
  /\bnot\s+only\b.+?\bbut\s+also\b/i,
  /\bkey\s+takeaways?\b/i,
  /\bprofound\s+impact\b/i,
  /\bever-evolving\b/i,
  /\blooking\s+ahead\b/i,
  /\bfirst\s+and\s+foremost\b/i,
  /\bin\s+the\s+realm\s+of\b/i,
  /\ba\s+plethora\s+of\b/i,
  /\bcornerstone\s+of\b/i,
  /\b(?:rapidly|continually)\s+(?:transforming|evolving|advancing)\b/i,
  /\bvast\s+amounts?\s+of\b/i,
  /\brobust\s+(?:validation|frameworks?|mechanisms?|solutions?)\b/i,
  /\bcreates?\s+lasting\s+value\b/i,
  /\bpav(?:e|es|ed|ing)\s+the\s+way\b/i,
  /\bdouble-edged\s+sword\b/i,
  /\bparadigm\s+shift\b/i,
  /\bcatalyst\s+for\b/i,
  /\bfostering\s+(?:innovation|growth|collaboration|sustainability)\b/i,
  /\bdelv(?:e|es|ed|ing)\s+into\b/i,
  /\btestament\s+to\b/i,
  /\bmultifaceted\s+(?:landscape|nature|approach)\b/i,
  /\bever-evolving\s+(?:landscape|world|digital)\b/i,
  /\bholistic\s+approach\b/i,
  /\bnavigat(?:e|es|ed|ing)\s+the\s+complexities\b/i,
  /\brich\s+tapestry\b/i,
  /\binterplay\s+between\b/i,
  /\bserves?\s+as\s+a\s+(?:reminder|testament|cornerstone|beacon)\b/i,
  /\bin\s+today's\s+(?:fast-paced|digital|interconnected|modern)\s+world\b/i,
  /\bharness(?:ing|es|ed)?\s+the\s+power\s+of\b/i,
  /\bseamless(?:ly)?\s+integrat(?:e|es|ed|ing)\b/i,
  /\bunprecedented\s+(?:levels?|advancements?|efficiency|scale)\b/i,
];

export function analyzeAIRisk(text: string, uncappedEvidence = false): AIRiskResult {
  if (!text.trim()) return { humanScore: 0, aiScore: 0, riskLevel: 'Low', recommendations: [] };

  const evidencePoints = (value: number, ceiling: number) => uncappedEvidence ? value : Math.min(ceiling, value);
  const sentences = getSentences(text);
  const words = getWords(text);
  const totalWords = words.length;

  if (totalWords < 6) {
    return {
      humanScore: 80,
      aiScore: 20,
      riskLevel: 'Low',
      recommendations: ['Provide a longer sample (at least 25 words) for in-depth AI risk inspection.'],
    };
  }

  const lengths = sentences.map((s) => getWords(s).length).filter((l) => l > 0);
  const count = lengths.length || 1;
  const avgLen = lengths.reduce((a, b) => a + b, 0) / count;

  // 1. Sentence length variance and Coefficient of Variation (Burstiness)
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  const cv = avgLen > 0 ? stdDev / avgLen : 0;

  // Consecutive sentence length difference (human prose has dynamic rhythm)
  let consecutiveDeltaSum = 0;
  for (let i = 1; i < lengths.length; i++) {
    consecutiveDeltaSum += Math.abs(lengths[i] - lengths[i - 1]);
  }
  const avgConsecutiveDelta = lengths.length > 1 ? consecutiveDeltaSum / (lengths.length - 1) : 0;

  // 2. Complex & diverse punctuation (em-dashes, semicolons, colons, parens)
  // Human writers use rich punctuation to structure complex thought; LLMs rely almost exclusively on commas and periods.
  const dashes = (text.match(/—|--/g) || []).length;
  const semicolons = (text.match(/;/g) || []).length;
  const colons = (text.match(/:/g) || []).length;
  const parens = (text.match(/\(/g) || []).length;
  const complexPunctuation = dashes + semicolons + colons + parens;

  // 3. Grounded concrete details (numbers, years, dates, currency)
  // Human non-fiction and essays cite empirical specifics; LLM prose tends toward abstract generalities.
  const numbersAndYears = (text.match(/\b(?:\d{1,4}(?:th|st|nd|rd)?|\d{4}s|\d+[\.,]\d+|\$\d+)\b/g) || []).length;

  // 4. Coordinating conjunction sentence openers ("And", "But", "Yet", "So")
  // Natural human writers freely start sentences with coordinating conjunctions for flow; LLMs rarely do.
  const coordinatingOpeners = sentences.filter((s) => /^\s*(?:And|But|Yet|So|Or|Nor)\b/i.test(s)).length;

  // 5. Lexical diversity (Type-Token Ratio)
  const cleanWords = words
    .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length > 1);
  const uniqueWordCount = new Set(cleanWords).size;
  const ttr = cleanWords.length > 0 ? uniqueWordCount / cleanWords.length : 0.5;

  // 6. Conversational / human punctuation (question marks, exclamation marks)
  const questionCount = (text.match(/\?/g) || []).length;
  const exclamationCount = (text.match(/!/g) || []).length;
  const humanPunctuation = questionCount + exclamationCount;

  // 7. Personal voice / pronouns (direct human perspective)
  const pronounMatches = (text.match(/\b(I|my|me|mine|myself|we|our|ours|us|you|your|yours)\b/gi) || []).length;
  const pronounRate = pronounMatches / (totalWords || 1);

  // 8. Detection of formulaic AI transition markers & clichés
  const foundAiPatterns: string[] = [];
  for (const pattern of AI_MARKER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      foundAiPatterns.push(match[0].toLowerCase());
    }
  }
  const aiMarkerHits = foundAiPatterns.length;

  // 9. Formulaic sentence openers (common in ChatGPT / LLM prose)
  const formulaicOpeners = sentences.filter((s) =>
    /^\s*(?:Furthermore|Moreover|Additionally|In addition|Consequently|Ultimately|Notably|Importantly|In essence|Specifically|To begin with|In conclusion|Overall),/i.test(s)
  ).length;

  // 10. Formulaic concluding sentence (classic LLM closing with gerund + abstract societal benefit)
  const lastSentence = sentences[sentences.length - 1] || '';
  const hasFormulaicConclusion = /(?:ensur(?:es|ing)|pav(?:es|ing)\s+the\s+way|creat(?:es|ing)\s+(?:lasting|meaningful)|foster(?:s|ing)\s+(?:sustainable|responsible)|shap(?:es|ing)\s+a)\s+(?:value|growth|future|transformation|society|progress)/i.test(lastSentence);

  // Scientific evidence accumulator for AI vs Human divergence
  let aiEvidence = 0;
  let humanEvidence = 0;

  // --- AI Evidence Accumulation ---
  // A. Robotic sentence length uniformity (Low Burstiness)
  // Requires sufficient sample size (>= 4 sentences and >= 70 words) for statistical significance
  if (lengths.length >= 4 && totalWords >= 70) {
    if (cv < 0.20 && avgConsecutiveDelta < 3.0) {
      aiEvidence += 32; // Strong robotic pacing hallmark across extended text
    } else if (cv < 0.26 && avgConsecutiveDelta < 4.0) {
      aiEvidence += 16;
    }
  } else if (lengths.length === 3 && totalWords >= 60) {
    if (cv < 0.14 && avgConsecutiveDelta < 2.0 && aiMarkerHits > 0) {
      aiEvidence += 14;
    }
  }

  // B. Formulaic sentence transition openers
  if (formulaicOpeners > 0) {
    const openerRatio = formulaicOpeners / (sentences.length || 1);
    aiEvidence += evidencePoints(formulaicOpeners * 14 + (openerRatio > 0.2 ? 16 : 0), 38);
  }

  // C. LLM Collocations & Clichés
  if (aiMarkerHits > 0) {
    aiEvidence += evidencePoints(aiMarkerHits * 16, 50);
  }

  // D. Formulaic Concluding Convention
  if (hasFormulaicConclusion) {
    aiEvidence += 20;
  }

  // E. Repetitive Lexical Distribution
  if (cleanWords.length >= 40 && ttr < 0.38) {
    aiEvidence += 14;
  }

  // --- Human Evidence Accumulation ---
  // A. Dynamic Burstiness (varied pacing with wide sentence length divergence)
  if (lengths.length >= 2) {
    if (cv >= 0.38 && avgConsecutiveDelta >= 5.5) {
      humanEvidence += 30; // Strong natural human burstiness
    } else if (cv >= 0.28 || avgConsecutiveDelta >= 4.0) {
      humanEvidence += 18;
    }
  }

  // B. Syntactic & Punctuation Complexity
  if (complexPunctuation >= 3) {
    humanEvidence += evidencePoints(complexPunctuation * 4, 18);
  } else if (complexPunctuation >= 1) {
    humanEvidence += 8;
  }

  // C. Concrete Grounded Details
  if (numbersAndYears >= 3) {
    humanEvidence += evidencePoints(numbersAndYears * 3, 16);
  } else if (numbersAndYears >= 1) {
    humanEvidence += 6;
  }

  // D. Natural Discourse Openers
  if (coordinatingOpeners >= 1) {
    humanEvidence += evidencePoints(coordinatingOpeners * 6, 14);
  }

  // E. Conversational / Perspective Markers
  if (pronounRate >= 0.03 || humanPunctuation >= 2) {
    humanEvidence += 18;
  } else if (pronounRate >= 0.01 || humanPunctuation >= 1) {
    humanEvidence += 8;
  }

  // F. Total Absence of AI Artifacts in Substantial Text
  if (aiMarkerHits === 0 && formulaicOpeners === 0 && !hasFormulaicConclusion && lengths.length >= 2) {
    humanEvidence += 24;
  }

  // Continuous score calculation:
  // Base neutral point is 40. AI evidence adds weight; Human evidence subtracts.
  // Clean human writing with dynamic pacing naturally evaluates to single digits (4%–12%).
  // Formulaic AI writing with clichés and robotic uniformity naturally evaluates to 86%–98%.
  const rawScore = 40 + (aiEvidence * 1.25) - (humanEvidence * 1.15);
  const aiScore = uncappedEvidence
    ? Math.max(0, Math.min(100, Math.round(rawScore)))
    : Math.max(4, Math.min(98, Math.round(rawScore)));
  const humanScore = 100 - aiScore;
  const riskLevel: AIRiskResult['riskLevel'] = aiScore >= 65 ? 'High' : aiScore >= 35 ? 'Medium' : 'Low';

  const recommendations: string[] = [];
  if (aiScore >= 65) {
    if (cv < 0.25 && lengths.length >= 3) {
      recommendations.push('Vary sentence lengths more — uniform sentence length is a strong AI hallmark.');
    }
    if (aiMarkerHits > 0) {
      recommendations.push(`Remove formulaic transition phrases (${foundAiPatterns.slice(0, 3).map((p) => `"${p}"`).join(', ')}).`);
    }
    if (cleanWords.length >= 30 && ttr < 0.45) {
      recommendations.push('Incorporate more diverse domain-specific vocabulary to break repetitive patterns.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Add personal examples, varied syntax, and direct insights to lower AI risk score.');
    }
  } else if (aiScore >= 35) {
    recommendations.push('Pacing and vocabulary are largely natural, with minor uniformities.');
    if (aiMarkerHits > 0) {
      recommendations.push(`Consider replacing transition phrases like "${foundAiPatterns[0]}".`);
    }
  } else {
    recommendations.push('Sentence rhythm, burstiness, and vocabulary variation align with natural human writing.');
    if (aiMarkerHits === 0) {
      recommendations.push('No formulaic AI transition markers or robotic length patterns detected.');
    }
  }

  return { humanScore, aiScore, riskLevel, recommendations };
}

