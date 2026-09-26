import { describe, it, expect } from 'vitest';
import { analyzeAIRisk } from '@/pages/seo-assistant/analysisEngine';
import { runAggressiveDetector } from '@/lib/detection/aggressiveDetectorService';

describe('High-Sensitivity Analysis — Strict: Calibration & False Positive Elimination', () => {
  it('correctly classifies third-person human article as human text (no false 72% AI score)', () => {
    // A natural third-person human article without first-person pronouns
    const humanThirdPerson = `The Roman aqueducts stand among the greatest engineering achievements of the ancient world.
Engineers harnessed gravity alone to transport water across hundreds of kilometers into bustling urban centers.
While modern cities rely heavily on pressurized pipes and mechanical pumps, ancient municipal builders achieved comparable flow rates through meticulous slope gradients and massive stone arches.
Some systems, like the Aqua Claudia, remained in active operation for centuries.
Archaeologists continue uncovering hidden distribution basins beneath the streets of Rome today.`;

    const result = analyzeAIRisk(humanThirdPerson);

    // Previously this text scored 72% AI ("High Risk") due to lack of first-person pronouns
    expect(result.aiScore).toBeLessThan(35);
    expect(result.humanScore).toBeGreaterThanOrEqual(65);
    expect(result.riskLevel).not.toBe('High');
    expect(result.recommendations.some((r) => r.includes('align with natural human writing'))).toBe(true);
  });

  it('correctly classifies personal reflective human text with low AI risk score', () => {
    const humanReflective = `When I first started hiking in the Pacific Northwest, my gear was completely inadequate for the torrential rains.
I remember shivering through a cold night on Mount Rainier because my tent leaked at the seams.
Over the years, we learned how to properly layer wool and waterproof membranes.
If you are planning your first trip into the backcountry, take my advice and invest in sturdy boots before anything else.`;

    const result = analyzeAIRisk(humanReflective);

    expect(result.aiScore).toBeLessThan(25);
    expect(result.humanScore).toBeGreaterThanOrEqual(75);
    expect(result.riskLevel).toBe('Low');
  });

  it('reliably catches and flags formulaic AI-generated prose with High Risk score (>= 70%)', () => {
    // Typical ChatGPT / Claude formulaic essay
    const aiText = `In this comprehensive guide, we delve into the multifaceted landscape of modern technology.
It is important to note that artificial intelligence plays a crucial role in shaping our collective future.
Furthermore, these unprecedented advancements serve as a testament to the relentless ingenuity of human innovation.
Needless to say, navigating this intricate realm requires a seamless and meticulous strategic framework.
In conclusion, we must harness the power of ethical governance to unlock the full potential of digital transformation.`;

    const result = analyzeAIRisk(aiText);

    expect(result.aiScore).toBeGreaterThanOrEqual(70);
    expect(result.riskLevel).toBe('High');
    expect(result.recommendations.some((r) => r.includes('formulaic transition phrases') || r.includes('AI hallmark'))).toBe(true);
  });

  it('adapter runAggressiveDetector accurately exposes calibrated scores and risk level', async () => {
    const humanSample = `The seasonal migration of monarch butterflies spans thousands of miles between Canada and central Mexico.
Generations succeed one another along the journey, with no single insect completing the round trip.
Scientists still study how these fragile creatures orient themselves using the angle of the sun and the Earth's magnetic field.`;

    const aggressiveResult = await runAggressiveDetector(humanSample);

    expect(aggressiveResult.ai).toBeLessThan(35);
    expect(aggressiveResult.human).toBeGreaterThan(65);
    expect(aggressiveResult.risk).not.toBe('High');
  });

  it('guarantees High-Sensitivity strict detector never drops below balanced AI and reflects weaker AI patterns', async () => {
    // User scenario: balanced detector gave 28% AI, 13% Mixed, 59% Human.
    // High-Sensitivity Strict mode must NEVER drop to 4% AI!
    const mockBalancedResult: any = {
      ai: 28,
      human: 59,
      mixed: 13,
      verdict: 'Mostly Human, AI-Assisted',
      risk: 'Medium',
      confidence: 44,
      confidenceLevel: 'Medium',
      language: 'English',
      engineVersion: '2.5.0',
      modelVersion: '1.4.0',
      calibrationVersion: 'cal-2.5',
      languagePipelineVersion: '1.2.0',
      requestId: 'test_req',
      analyzedAt: new Date().toISOString(),
      full: {} as any,
    };

    const text = 'Artificial intelligence provides key capabilities across various industries. Organizations adopt machine learning to optimize workflows.';
    const strictResult = await runAggressiveDetector(text, mockBalancedResult);

    // Strict score must be at least as sensitive as balanced (>= 28%) and absorb the 13% mixed signal
    expect(strictResult.ai).toBeGreaterThanOrEqual(28);
    expect(strictResult.ai).toBeGreaterThanOrEqual(40);
    expect(strictResult.human).toBe(100 - strictResult.ai);
    expect(strictResult.risk).toMatch(/Medium|High/);
  });

  it('correctly flags modern AI text with connectors without dropping to floor 4%', () => {
    const modernAiText = `Artificial intelligence has seen rapid advancements in recent years, transforming various industries across the globe.
From healthcare to finance, organizations are adopting machine learning systems to optimize workflows and enhance decision-making capabilities.
Moreover, predictive algorithms allow businesses to analyze massive amounts of data in real time.
Furthermore, the widespread implementation of automated tools raises important considerations regarding data privacy, security, and ethical deployment.
Ultimately, developing balanced governance frameworks will be essential for ensuring sustainable technological progress.`;

    const result = analyzeAIRisk(modernAiText);
    expect(result.aiScore).toBeGreaterThanOrEqual(50);
    expect(result.riskLevel).not.toBe('Low');
  });

  it('completely detects clear ChatGPT text and scores it decisively high (>= 85%) in aggressive mode', async () => {
    const chatGptSample = `Artificial intelligence is rapidly transforming modern industries. Machine learning models process vast amounts of data to uncover actionable insights. Businesses leverage these predictive tools to automate repetitive tasks and improve operational efficiency. Cloud computing infrastructure provides the scalable resources necessary to train complex deep learning architectures. As adoption expands across sectors, organizations must address key challenges around data governance, algorithm bias, and privacy compliance. Developing clear ethical guidelines and robust validation frameworks ensures technology creates lasting value for society.`;

    // 1. Underlying analyzeAIRisk heuristic engine should catch collocations & pacing
    const riskResult = analyzeAIRisk(chatGptSample);
    expect(riskResult.aiScore).toBeGreaterThanOrEqual(70);
    expect(riskResult.riskLevel).toBe('High');

    // 2. High-Sensitivity Analysis — Strict detector (standalone or with balanced) must score decisively high (>= 85%)
    const strictResult = await runAggressiveDetector(chatGptSample);
    expect(strictResult.ai).toBeGreaterThanOrEqual(85);
    expect(strictResult.human).toBeLessThanOrEqual(15);
    expect(strictResult.risk).toBe('High');
  });
});
