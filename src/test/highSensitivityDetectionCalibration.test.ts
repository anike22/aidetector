import { describe, it, expect } from 'vitest';
import { analyzeAIRisk } from '@/pages/seo-assistant/analysisEngine';
import { runAggressiveDetector } from '@/lib/detection/aggressiveDetectorService';
import { analyzeAdvancedText } from '@/lib/detection/engine';

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

  it('does not label a severe cross-engine conflict as high-confidence AI', async () => {
    const humanSample = `The seasonal migration of monarch butterflies spans thousands of miles between Canada and central Mexico.
Generations succeed one another along the journey, with no single insect completing the round trip.
Scientists still study how these fragile creatures orient themselves using the angle of the sun and the Earth's magnetic field.`;

    const [advanced, heuristic] = await Promise.all([
      analyzeAdvancedText(humanSample),
      Promise.resolve(analyzeAIRisk(humanSample)),
    ]);
    const aggressiveResult = await runAggressiveDetector(humanSample);
    console.info('[strict-false-positive-diagnostic]', JSON.stringify({
      heuristicAi: heuristic.aiScore,
      baseAi: advanced.overall.aiProbability,
      baseHuman: advanced.overall.humanProbability,
      baseVerdict: advanced.overall.verdict,
      confidence: advanced.overall.confidence,
      classProbabilities: advanced.metadata.classProbabilities,
      humanization: advanced.humanization,
      profile: {
        specificity: advanced.linguisticProfile.specificityScore,
        personalVoice: advanced.linguisticProfile.personalVoiceScore,
      },
      aggressiveAi: aggressiveResult.ai,
    }));
    // A conflicting raw classifier (AI) and independent heuristic (human)
    // should be marked uncertain, not force a human or AI verdict.
    expect(aggressiveResult.ai).toBeLessThan(65);
    expect(aggressiveResult.risk).not.toBe('High');
  });

  it('guarantees High-Sensitivity strict detector never drops below balanced AI and reflects weaker AI patterns', async () => {
    // User scenario: balanced detector gave 28% AI, 13% Mixed, 59% Human.
    // High-Sensitivity Strict mode must NEVER drop to 4% AI or cap at 32%!
    const mockBalancedResult: any = {
      ai: 28,
      human: 59,
      mixed: 13,
      verdict: 'mostly-human-ai-assisted',
      risk: 'Medium',
      confidence: 44,
      confidenceLevel: 'Medium',
      language: 'English',
      engineVersion: '2.5.1',
      modelVersion: 'ensemble-v4-classifier-v2',
      calibrationVersion: 'cal-v3-five-class',
      languagePipelineVersion: 'lang-v3',
      requestId: 'test_req',
      analyzedAt: new Date().toISOString(),
      full: {
        metadata: {
          classProbabilities: {
            ai: 0.634,
            human: 0.319,
            mixed: 0.001,
            'translated-ai': 0.027,
            'human-edited-ai': 0.019,
          },
        },
      } as any,
    };

    const text = 'Artificial intelligence provides key capabilities across various industries. Organizations adopt machine learning to optimize workflows.';
    const strictResult = await runAggressiveDetector(text, mockBalancedResult);

    // Strict score must decisively detect AI patterns and NOT cap at 32%
    expect(strictResult.ai).toBeGreaterThanOrEqual(85);
    expect(strictResult.human).toBeLessThanOrEqual(15);
    expect(strictResult.risk).toBe('High');
  });

  it('guarantees user AI text previously scoring 32% now scores decisively as AI (High Risk)', async () => {
    // Exact user telemetry reproduction from detector_results ID 792d817d-8f87-4a64-8ad1-db3ed11823e0
    const userTelemetryBalanced: any = {
      ai: 28,
      human: 59,
      mixed: 13,
      verdict: 'mostly-human-ai-assisted',
      risk: 'Medium',
      confidence: 44,
      confidenceLevel: 'Medium',
      language: 'English',
      engineVersion: '2.5.1',
      modelVersion: 'ensemble-v4-classifier-v2',
      calibrationVersion: 'cal-v3-five-class',
      languagePipelineVersion: 'lang-v3',
      requestId: 'det-1790421427023-7zay',
      analyzedAt: '2026-09-26T11:17:07.023Z',
      full: {
        metadata: {
          classProbabilities: {
            ai: 0.634,
            human: 0.319,
            mixed: 0.001,
            'translated-ai': 0.027,
            'human-edited-ai': 0.019,
          },
        },
      } as any,
    };

    const userText = 'Artificial intelligence models leverage extensive datasets to optimize predictive efficiency and operational performance across enterprise systems.';
    const result = await runAggressiveDetector(userText, userTelemetryBalanced);

    expect(result.ai).toBeGreaterThanOrEqual(85);
    expect(result.risk).toBe('High');
    expect(result.human).toBeLessThanOrEqual(15);
  });

  it('does not inflate low-confidence paraphrase evidence into near-certain AI', async () => {
    const humanizedAi = `AI is basically reshaping how companies operate these days. Like, they can process huge amounts of data in no time. But honestly, the wildest part is the natural language side — it can crank out articles that actually sound like a person wrote them. Some businesses are saving serious money and moving a lot faster. Anyway, long story short, it's a big deal for pretty much every industry.`;
    const balancedHumanized: any = {
      ai: 9,
      human: 91,
      mixed: 0,
      verdict: 'likely-human',
      risk: 'Low',
      confidence: 67,
      confidenceLevel: 'High',
      language: 'English',
      full: {
        metadata: { classProbabilities: { human: 0.922, ai: 0.008, 'human-edited-ai': 0.07, mixed: 0 } },
        humanization: { detected: true, confidence: 20, signals: ['paraphrase pattern'], explanation: 'Possible automated paraphrasing.' },
        linguisticProfile: { specificityScore: 0.06, personalVoiceScore: 0.01, contextualCoherence: 0.052 },
        statisticalProfile: { editingSignalScore: 0.154 },
        sentences: [],
      },
    };

    const result = await runAggressiveDetector(humanizedAi, balancedHumanized);

    expect(result.ai).toBeLessThan(90);
    expect(result.recommendations.some((r) => r.includes('Humanization/evasion'))).toBe(false);
  });

  it('does not mark natural-sounding prose near-certain AI based only on weak coherence and editing signals', async () => {
    const naturalAi = `The city library stays open late on Thursdays, which has quietly changed how people use the building. Parents arrive after work, students spread notebooks across the upstairs tables, and retirees join the weekly history discussion. The change seemed minor when it was announced, but attendance has climbed steadily. Staff members now say Thursday is their busiest evening, even though Saturday still brings more children through the doors.`;
    const balancedNaturalAi: any = {
      ai: 12,
      human: 88,
      mixed: 0,
      verdict: 'likely-human',
      risk: 'Low',
      confidence: 68,
      confidenceLevel: 'High',
      language: 'English',
      full: {
        metadata: { classProbabilities: { human: 0.987, ai: 0.011, 'human-edited-ai': 0, mixed: 0 } },
        humanization: { detected: true, confidence: 20, signals: ['coherence mismatch'], explanation: 'Possible automated rewriting.' },
        linguisticProfile: { specificityScore: 0.06, personalVoiceScore: 0, contextualCoherence: 0.057 },
        statisticalProfile: { editingSignalScore: 0.158 },
        sentences: [],
      },
    };

    const result = await runAggressiveDetector(naturalAi, balancedNaturalAi);
    expect(result.ai).toBeLessThan(90);
  });

  it('does not turn a low-confidence formal-human conflict into high-risk AI', async () => {
    const formalHuman = `The Roman aqueducts stand among the greatest engineering achievements of the ancient world. Engineers harnessed gravity alone to transport water across hundreds of kilometers into bustling urban centers. While modern cities rely heavily on pressurized pipes and mechanical pumps, ancient municipal builders achieved comparable flow rates through meticulous slope gradients and massive stone arches. Some systems, like the Aqua Claudia, remained in active operation for centuries. Archaeologists continue uncovering hidden distribution basins beneath the streets of Rome today.`;
    const balancedFormalHuman: any = {
      ai: 58,
      human: 42,
      mixed: 0,
      verdict: 'likely-ai',
      risk: 'High',
      confidence: 34,
      confidenceLevel: 'Low',
      language: 'English',
      full: {
        metadata: { classProbabilities: { human: 0.727, ai: 0.142, 'human-edited-ai': 0.064, 'translated-ai': 0.067 } },
        humanization: { detected: true, confidence: 20, signals: ['coherence mismatch'], explanation: 'Possible automated rewriting.' },
        linguisticProfile: { specificityScore: 0.06, personalVoiceScore: 0, contextualCoherence: 0.038 },
        statisticalProfile: { editingSignalScore: 0.139 },
        sentences: [],
      },
    };

    const result = await runAggressiveDetector(formalHuman, balancedFormalHuman);
    expect(result.ai).toBeLessThan(35);
    expect(result.risk).toBe('Low');
  });

  it('does not convert a mostly-human assisted result into near-certain AI', async () => {
    const humanText = `I drafted the introduction on Tuesday after reviewing my interview notes. The first version sounded stiff, so I moved the personal example to the opening and cut two paragraphs that repeated the same point. My editor suggested a shorter conclusion, but the observations and wording are mine.`;
    const balancedHuman: any = {
      ai: 26,
      human: 62,
      mixed: 12,
      verdict: 'mostly-human-ai-assisted',
      risk: 'Medium',
      confidence: 54,
      confidenceLevel: 'Medium',
      language: 'English',
      full: {
        metadata: { classProbabilities: { human: 0.62, ai: 0.08, 'human-edited-ai': 0.26, mixed: 0.04 } },
        humanization: { detected: false, confidence: 0, signals: [], explanation: 'No strong humanization signal.' },
        linguisticProfile: { specificityScore: 0.12, personalVoiceScore: 0.22, contextualCoherence: 0.14 },
        statisticalProfile: { editingSignalScore: 0.08 },
        sentences: [],
      },
    };

    const result = await runAggressiveDetector(humanText, balancedHuman);
    expect(result.ai).toBeLessThan(35);
    expect(result.human).toBeGreaterThan(65);
    expect(result.risk).toBe('Low');
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

  it('verifies that long formal human articles do not falsely return 98% in High-Sensitivity Strict mode', async () => {
    const longHumanArticle = `The development of urban transit infrastructure in twentieth-century metropolitan areas fundamentally altered residential patterns and economic mobility across North America. Prior to the widespread adoption of electric streetcars and grade-separated rapid transit, cities were characterized by dense pedestrian corridors centered around waterfront docks and rail terminals. As transit networks expanded into peripheral farmland, new residential suburbs emerged, creating the modern commuter landscape.

Municipal governments faced substantial logistical challenges during this rapid transition. Financing capital-intensive tunneling projects required innovative municipal bonding mechanisms and public-private partnerships. In cities like Boston and New York, private transit corporations initially operated competing subway and elevated lines before municipal consolidation became necessary to maintain uniform fares and coordinated transfer hubs. The physical construction itself demanded extensive cut-and-cover excavation through heavily populated commercial districts, disrupting surface traffic for years at a time.

Engineers and urban planners designed ventilation shafts, subterranean drainage networks, and electrical substations capable of powering multi-car trainsets. The introduction of third-rail power distribution systems resolved many earlier safety concerns associated with overhead wires in underground tunnels. At the same time, signal systems evolved from basic manual block signaling to automated electro-pneumatic interlocking, drastically reducing headway times and preventing catastrophic rear-end collisions on high-frequency trunk lines.

Despite these engineering triumphs, transit expansion was never socially neutral. The placement of elevated tracks often depressed adjacent property values and subjected working-class neighborhoods to persistent noise and soot. Decades later, urban highway construction would repeat and amplify these patterns of displacement. Nevertheless, early rapid transit systems remain the backbone of modern metropolitan economies, carrying millions of daily passengers and providing an alternative to automobile congestion.`;

    const strictResult = await runAggressiveDetector(longHumanArticle);
    expect(strictResult.ai).toBeLessThanOrEqual(30);
    expect(strictResult.human).toBeGreaterThanOrEqual(70);
    expect(strictResult.risk).toBe('Low');
  });

  it('proves that authentic human non-fiction evaluates naturally in single digits without artificial 26% floor', async () => {
    const historicalPaper = `The construction of the Erie Canal between 1817 and 1825 transformed the economic geography of the United States. Before its completion, transporting bulk agricultural commodities across the Appalachian Mountains cost nearly one hundred dollars per ton and took several weeks. By connecting the Hudson River at Albany with Lake Erie at Buffalo, the 363-mile waterway cut shipping costs to less than ten dollars per ton and reduced travel time to six days.

Governor DeWitt Clinton faced fierce political opposition when proposing the project, with critics dubbing it 'Clinton's Folly' or 'the Big Ditch.' However, the state legislature authorized financing through state-backed bonds that attracted eager European investors, particularly in London. Without any formal civil engineering schools in North America at the time, self-taught surveyors like Benjamin Wright and James Geddes designed the lock mechanisms, aqueducts, and towpaths through untamed wilderness.

The canal's commercial success was immediate and profound. Within its first year of full operation in 1826, thousands of canal boats carried wheat, lumber, and manufactured goods between New York City and the burgeoning settlements of the Midwest. Towns along the canal route—including Rochester, Syracuse, and Utica—experienced unprecedented industrial booms, while New York City eclipsed Philadelphia and Boston as the premier commercial port in the Western Hemisphere.`;

    const balancedForHistorical: any = {
      ai: 6,
      human: 92,
      mixed: 2,
      verdict: 'likely-human',
      risk: 'Low',
      confidence: 82,
      confidenceLevel: 'High',
      language: 'English',
      full: {
        metadata: {
          classProbabilities: {
            ai: 0.04,
            human: 0.94,
            mixed: 0.01,
            'translated-ai': 0.005,
            'human-edited-ai': 0.005,
          },
        },
      },
    };

    const strictResult = await runAggressiveDetector(historicalPaper, balancedForHistorical);
    // Verified human writing evaluates naturally to its true low score (< 15%) without being artificially clamped at 26%
    expect(strictResult.ai).toBeLessThanOrEqual(12);
    expect(strictResult.human).toBeGreaterThanOrEqual(88);
    expect(strictResult.risk).toBe('Low');
  });
});
