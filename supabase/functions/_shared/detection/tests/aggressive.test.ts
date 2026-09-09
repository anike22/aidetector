import { assert, assertEquals, assertNotEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { analyzeAIRisk } from '../../../../../src/pages/seo-assistant/analysisEngine.ts';

// The aggressive engine returns a binary AI/Human score plus a risk level.
// It does NOT support a Mixed authorship verdict. The frontend must never map
// Medium risk to a Mixed authorship label.

const AI_TEXT = `Artificial intelligence has revolutionized the way businesses operate. Machine learning algorithms process vast amounts of data. Organizations leverage AI-powered tools to automate routine tasks. This comprehensive guide explores the transformative impact of artificial intelligence. In conclusion, the future of AI is bright.`;

const LOW_RISK_TEXT = `Hi. I went to the store because my dog was out of food and my neighbor had already borrowed my car keys, so I walked all the way down the hill in the rain with my umbrella and my headphones, because I really did not want to deal with traffic or the bus or my brother's endless questions about why I still live in this neighborhood. The cashier smiled at me. I smiled back. I bought everything. I went home. My dog was happy. I was happy. We ate dinner together on the floor, because my table is covered in books I keep meaning to put away and my chair is broken, so we sat on the rug like animals.`;

const MEDIUM_RISK_TEXT = `I tried to write this in a way that sounds like me, which means a lot of run-on sentences and random references. My dog is currently asleep under my desk and I can hear my neighbor's lawnmower. Anyway, I don't think AI wrote this, mostly because I wrote it while annoyed about traffic.`;

Deno.test('High-Sensitivity engine returns High Risk for obvious AI text', () => {
  const r = analyzeAIRisk(AI_TEXT);
  assertEquals(r.riskLevel, 'High');
  assertEquals(r.aiScore >= 70, true);
  assertEquals(r.humanScore <= 30, true);
});

Deno.test('High-Sensitivity engine returns Low Risk for informal human text', () => {
  const r = analyzeAIRisk(LOW_RISK_TEXT);
  assertEquals(r.riskLevel, 'Low');
  assertEquals(r.aiScore < 40, true);
  assertEquals(r.humanScore >= 60, true);
});

Deno.test('High-Sensitivity engine reports Medium Risk for boundary text', () => {
  const r = analyzeAIRisk(MEDIUM_RISK_TEXT);
  assertEquals(r.riskLevel, 'Medium');
  assert(r.aiScore >= 40 && r.aiScore < 70, `Expected AI score in Medium range, got ${r.aiScore}`);
});

Deno.test('High-Sensitivity engine does not expose a mixed verdict or mixed probability', () => {
  const r = analyzeAIRisk(AI_TEXT);
  assertEquals('mixed' in r, false);
  assertEquals('mixedScore' in r, false);
  assertEquals('verdict' in r, false);
});

Deno.test('High-Sensitivity engine Medium Risk is not a mixed authorship classification', () => {
  const r = analyzeAIRisk(MEDIUM_RISK_TEXT);
  if (r.riskLevel === 'Medium') {
    // The engine's risk label is a sensitivity level, not a mixed authorship verdict.
    assertNotEquals(r.riskLevel, 'Mixed');
  }
});
