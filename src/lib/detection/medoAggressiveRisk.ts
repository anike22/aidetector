// Exact MeDo analyzeAIRisk scorer isolated for AI Text Detector.
// Extracted verbatim from uploaded MeDo src/pages/seo-assistant/analysisEngine.ts.
// Do not change production SEO Assistant.

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


export function analyzeAIRisk(text: string): AIRiskResult {
  if (!text.trim()) return { humanScore: 0, aiScore: 0, riskLevel: 'Low', recommendations: [] };

  const sentences = getSentences(text);
  const lengths = sentences.map((s) => getWords(s).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);

  // Variance in sentence length — humans vary more
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / (lengths.length || 1);
  const stdDev = Math.sqrt(variance);

  // Personal pronouns — humans use more
  const pronounMatches = (text.match(/\b(I|my|me|we|our|you|your)\b/g) || []).length;
  const pronounRate = pronounMatches / (getWords(text).length || 1);

  // Filler/AI phrases
  const aiPhrases = ['in conclusion', 'it is worth noting', 'it is important to note', 'needless to say', 'as previously mentioned', 'in this article', 'in this guide', 'without further ado', 'as we can see', 'this comprehensive'];
  const lower = text.toLowerCase();
  const aiPhraseCount = aiPhrases.filter((p) => lower.includes(p)).length;

  // Heuristic: high variance + pronouns = more human
  let humanScore = Math.min(100, Math.round(stdDev * 3 + pronounRate * 200));
  humanScore = Math.max(10, humanScore - aiPhraseCount * 10);
  const aiScore = 100 - humanScore;

  const riskLevel: AIRiskResult['riskLevel'] = aiScore > 70 ? 'High' : aiScore > 40 ? 'Medium' : 'Low';

  const recommendations: string[] = [];
  if (aiScore > 50) recommendations.push('Add personal anecdotes and first-person perspective to reduce AI risk.');
  if (stdDev < 3) recommendations.push('Vary sentence lengths more — uniform sentences are an AI signal.');
  if (aiPhraseCount > 1) recommendations.push('Remove generic AI phrases like "it is worth noting" and "in this article".');
  if (recommendations.length === 0) recommendations.push('Content reads as human-written.');

  return { humanScore, aiScore, riskLevel, recommendations };
}

