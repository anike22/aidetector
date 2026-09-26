/**
 * Regression tests for the MAIN AI DETECTOR only.
 *
 * Scope:
 *   - analyzeAdvancedText (engine.ts) and all _shared/detection/* modules
 *   - computeAdjustedAiRisk, aggregateSentenceSignals, classifyVerdict
 *   - Mixed probability / verdict calibration
 *
 * Out of scope (NEVER modify):
 *   - supabase/functions/advanced-detector/index.ts  (SEO Assistant detector)
 *   - Any SEO Assistant frontend, DB table, or config
 *
 * Run with:
 *   deno test --allow-env supabase/functions/_shared/detection/tests/regression_main_detector.ts
 */

import { assertEquals, assertMatch, assert } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { analyzeAdvancedText } from "../engine.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function label(verdict: string): string {
  return verdict.replace(/-/g, ' ');
}

function assertAiVerdict(verdict: string, context: string) {
  const aiVerdicts = ['likely-ai', 'mostly-ai-human-edited'];
  assert(
    aiVerdicts.includes(verdict),
    `[${context}] Expected AI verdict but got "${label(verdict)}"`,
  );
}

function assertHumanVerdict(verdict: string, context: string) {
  const humanVerdicts = ['likely-human', 'mostly-human-ai-assisted'];
  assert(
    humanVerdicts.includes(verdict),
    `[${context}] Expected Human verdict but got "${label(verdict)}"`,
  );
}

function assertMixedVerdict(verdict: string, context: string) {
  assert(
    verdict === 'mixed',
    `[${context}] Expected Mixed verdict but got "${label(verdict)}"`,
  );
}

// ---------------------------------------------------------------------------
// Sample texts — kept at representative length (≥80 words)
// ---------------------------------------------------------------------------

// AI-generated: ChatGPT-style blog post, formulaic structure
const SAMPLE_AI_GENERATED = `
Artificial intelligence is transforming the modern workplace in profound and far-reaching ways.
From automating repetitive tasks to enabling advanced data analysis, AI is reshaping how organizations
operate. It is important to note that this transformation brings both opportunities and challenges.
In conclusion, organizations that embrace AI-driven strategies will be well-positioned to thrive in
the digital economy. Furthermore, leveraging cutting-edge technology allows businesses to achieve
unprecedented levels of efficiency. It is crucial to understand that implementing AI requires
careful consideration of ethical implications. As a result, companies must develop comprehensive
governance frameworks to ensure responsible deployment of these powerful systems.
`.trim();

// Human-written: personal blog with natural variation, colloquialisms
const SAMPLE_HUMAN_WRITTEN = `
I spent last Saturday fixing my old bicycle — the chain had been slipping for weeks and I'd been
putting it off. Turns out the rear derailleur cable was frayed, which I only found out after 
an hour of confused tinkering. My neighbor Tom wandered over, took one look, and went "oh yeah,
that's your cable." Embarrassing, honestly. We had tea after. He told me about his trip to Portugal
where he apparently ate so much pastéis de nata that he had to buy new trousers. Classic Tom.
Anyway, bike is fixed now. I celebrated with a very mediocre frozen pizza and some bad TV.
`.trim();

// AI-generated lightly edited by a human: some AI structure but edited sentences
const SAMPLE_AI_LIGHTLY_EDITED = `
Artificial intelligence has emerged as a transformative force in education, raising important
questions about academic integrity. Students now have access to powerful language models that
can generate convincing essays in seconds — honestly, I've seen it firsthand in my own classroom.
It is essential that institutions develop clear policies addressing AI use in assessments. Moreover,
educators must adapt their teaching strategies to focus on critical thinking and original analysis.
These changes will ensure that learning remains meaningful. But honestly, half the battle is just
convincing students the skills still matter when AI can do it for them.
`.trim();

// Human text polished by AI: mostly human with AI-style concluding paragraph
const SAMPLE_HUMAN_WITH_AI_POLISH = `
My grandmother kept a garden that defied all logic — rocky soil, partial shade, and the most
stubborn clay this side of the county. She'd be out there every morning, muttering at the tomatoes
like they might respond. They usually did, eventually. We used to sit on the back step eating warm
cherry tomatoes straight off the vine, still dusty with garden soil. That taste is something I can't
quite recreate, no matter how good the supermarket variety is.
In conclusion, the significance of intergenerational knowledge transfer in horticultural practices
cannot be overstated. Furthermore, the preservation of traditional gardening methods represents
an important cultural heritage that deserves recognition and documentation.
`.trim();

// True mixed: first half human, second half clearly AI
const SAMPLE_TRUE_MIXED = `
Last week I tried making sourdough bread for the first time. Total disaster. The starter smelled
wrong, the dough wouldn't hold its shape, and what came out of the oven could have been used as
a doorstop. My flatmate said it tasted "interesting" which we both knew meant inedible.

Sourdough bread represents a significant intersection of traditional fermentation techniques and
modern culinary science. The biochemical processes involved in lactic acid fermentation contribute
to both the distinctive flavor profile and the improved nutritional characteristics of the final
product. It is important to note that consistent temperature control is essential for successful
fermentation. Furthermore, the hydration ratio of the dough plays a crucial role in determining
crumb structure and crust development.
`.trim();

// Formal academic text — should not be over-classified as AI merely due to formality
const SAMPLE_FORMAL_ACADEMIC = `
The relationship between synaptic plasticity and long-term memory consolidation has been a subject
of sustained empirical investigation since the mid-twentieth century. Hebb's postulate, formalized
in 1949, proposed that repeated co-activation of pre- and post-synaptic neurons strengthens their
connection — a principle now supported by extensive electrophysiological evidence. Subsequent work
by Bliss and Lømo in 1973 demonstrated long-term potentiation in the hippocampus, establishing a
cellular correlate for learning. The question of whether LTP necessarily underlies all forms of
declarative memory remains contested, with competing models emphasizing different molecular cascades
and temporal dynamics.
`.trim();

// Short text — below recommended threshold
const SAMPLE_SHORT = `This text was written by an AI. It uses formulaic phrasing.`.trim();

// Long AI-generated text (>300 words)
const SAMPLE_LONG_AI = `
Artificial intelligence represents one of the most significant technological developments of the
twenty-first century. The rapid advancement of machine learning algorithms has enabled unprecedented
capabilities across numerous domains. It is important to understand that these developments carry
both transformative potential and significant risks that must be carefully managed.

In the realm of healthcare, AI-powered diagnostic tools have demonstrated remarkable accuracy in
identifying conditions ranging from diabetic retinopathy to certain forms of cancer. Moreover, drug
discovery pipelines have been substantially accelerated through the application of deep learning
models capable of predicting molecular interactions with high precision.

Furthermore, the financial sector has witnessed a fundamental transformation driven by algorithmic
trading systems and AI-powered risk assessment frameworks. It is crucial to note that these systems,
while highly efficient, require robust oversight mechanisms to prevent systemic risks. In addition,
natural language processing applications have revolutionized customer service operations across
industries.

The educational landscape is also undergoing significant change as a result of AI integration.
Personalized learning systems can now adapt to individual student needs in real time, providing
targeted support where it is most needed. It is worth noting that this shift raises important
questions about the role of human educators in an increasingly automated environment.

In conclusion, the trajectory of artificial intelligence development suggests that its impact will
continue to expand across virtually every sector of the economy. Organizations that proactively
develop AI governance frameworks and invest in workforce adaptation will be best positioned to
navigate this transformation successfully. The key is to balance innovation with responsibility,
ensuring that the benefits of AI are broadly shared while its risks are carefully mitigated.
`.trim();

// Old human text written before generative AI era (pre-2020 style)
const SAMPLE_PRE_AI_HUMAN = `
The coffee machine in the office had been broken for three days, which, by Tuesday morning,
had reduced the accounts department to a state best described as "barely functional." Karen from
payroll had started bringing her own instant coffee in a thermos, which she kept locked in her
desk drawer. This was discussed at length in the kitchen. Dave from IT fixed it eventually —
apparently it just needed descaling, something that had apparently been on the maintenance list
since 2017. The collective relief was palpable. Someone brought biscuits.
`.trim();

// Multilingual — Spanish AI-generated text
const SAMPLE_SPANISH_AI = `
La inteligencia artificial está transformando el panorama empresarial moderno de manera profunda
y significativa. Es importante destacar que esta transformación trae consigo tanto oportunidades
como desafíos que las organizaciones deben abordar de manera estratégica. Por lo tanto, es
fundamental que las empresas desarrollen marcos de gobernanza sólidos para garantizar un
despliegue responsable de estas tecnologías. En conclusión, las organizaciones que adopten
estrategias impulsadas por IA estarán bien posicionadas para prosperar en la economía digital.
Además, el aprovechamiento de tecnologías de vanguardia permite a las empresas lograr niveles
sin precedentes de eficiencia y productividad.
`.trim();

// ---------------------------------------------------------------------------
// Core regression tests: main detector verdict accuracy
// ---------------------------------------------------------------------------

Deno.test("main detector: clearly AI-generated content is NOT classified as Human", async () => {
  const result = await analyzeAdvancedText(SAMPLE_AI_GENERATED);
  const v = result.overall.verdict;
  assertAiVerdict(v, "AI_GENERATED");
  // adjustedAiRisk must be substantially above the human probability
  assert(
    result.overall.adjustedAiRisk > result.overall.humanProbability,
    `adjustedAiRisk(${result.overall.adjustedAiRisk}) must exceed humanProbability(${result.overall.humanProbability})`,
  );
});

Deno.test("main detector: clearly Human content is NOT classified as AI", async () => {
  const result = await analyzeAdvancedText(SAMPLE_HUMAN_WRITTEN);
  const v = result.overall.verdict;
  assertHumanVerdict(v, "HUMAN_WRITTEN");
});

Deno.test("main detector: AI lightly edited by human → AI or Mixed verdict (never pure Human)", async () => {
  const result = await analyzeAdvancedText(SAMPLE_AI_LIGHTLY_EDITED);
  const v = result.overall.verdict;
  assert(
    v !== 'likely-human',
    `[AI_LIGHTLY_EDITED] Should not be classified as likely-human, got "${label(v)}"`,
  );
});

Deno.test("main detector: human text polished by AI → Human or Mixed verdict", async () => {
  const result = await analyzeAdvancedText(SAMPLE_HUMAN_WITH_AI_POLISH);
  const v = result.overall.verdict;
  assert(
    v !== 'likely-ai',
    `[HUMAN_WITH_AI_POLISH] Should not be classified as likely-ai, got "${label(v)}"`,
  );
});

Deno.test("main detector: true mixed (half human + half AI paragraphs) → Mixed or mostly-ai-human-edited", async () => {
  const result = await analyzeAdvancedText(SAMPLE_TRUE_MIXED);
  const v = result.overall.verdict;
  assert(
    v === 'mixed' || v === 'mostly-ai-human-edited' || v === 'mostly-human-ai-assisted',
    `[TRUE_MIXED] Expected mixed/mostly-ai/mostly-human but got "${label(v)}"`,
  );
});

Deno.test("main detector: formal academic writing → not aggressively classified as AI", async () => {
  const result = await analyzeAdvancedText(SAMPLE_FORMAL_ACADEMIC);
  const v = result.overall.verdict;
  // Formal academic writing should not blindly be likely-ai unless truly overwhelming evidence
  // It may be mostly-ai-human-edited or mixed or human — but not certainly AI just from formality.
  // We only assert it is not BOTH likely-ai AND low confidence:
  if (v === 'likely-ai') {
    assert(
      result.overall.confidence >= 55,
      `[FORMAL_ACADEMIC] Only classify as likely-ai with confidence ≥55, got confidence=${result.overall.confidence}`,
    );
  }
});

Deno.test("main detector: short text → insufficient-text or inconclusive", async () => {
  const result = await analyzeAdvancedText(SAMPLE_SHORT);
  assert(
    result.overall.verdict === 'insufficient-text' || result.overall.verdict === 'inconclusive',
    `[SHORT_TEXT] Expected insufficient-text or inconclusive, got "${label(result.overall.verdict)}"`,
  );
});

Deno.test("main detector: long AI-generated text → AI verdict", async () => {
  const result = await analyzeAdvancedText(SAMPLE_LONG_AI);
  assertAiVerdict(result.overall.verdict, "LONG_AI");
});

Deno.test("main detector: pre-AI human text → Human verdict", async () => {
  const result = await analyzeAdvancedText(SAMPLE_PRE_AI_HUMAN);
  assertHumanVerdict(result.overall.verdict, "PRE_AI_HUMAN");
});

Deno.test("main detector: multilingual Spanish AI text → AI verdict", async () => {
  const result = await analyzeAdvancedText(SAMPLE_SPANISH_AI, { languageHint: 'es' });
  assertAiVerdict(result.overall.verdict, "SPANISH_AI");
});

// ---------------------------------------------------------------------------
// Probability integrity tests
// ---------------------------------------------------------------------------

Deno.test("main detector: AI + Human + Mixed probabilities sum to ~100", async () => {
  for (const [name, sample] of [
    ["AI", SAMPLE_AI_GENERATED],
    ["Human", SAMPLE_HUMAN_WRITTEN],
    ["Mixed", SAMPLE_TRUE_MIXED],
    ["LongAI", SAMPLE_LONG_AI],
  ] as const) {
    const result = await analyzeAdvancedText(sample);
    const sum = result.overall.aiProbability + result.overall.humanProbability + result.overall.mixedProbability;
    assert(
      sum >= 97 && sum <= 103,
      `[${name}] Probabilities must sum to ~100, got ${sum} (AI=${result.overall.aiProbability} Human=${result.overall.humanProbability} Mixed=${result.overall.mixedProbability})`,
    );
  }
});

Deno.test("main detector: adjustedAiRisk is always >= raw aiProbability", async () => {
  // adjustedAiRisk = ai + mixed*0.6 + sentence bonus - consistency penalty
  // It should never be LOWER than raw ai when mixed > 0.
  for (const [name, sample] of [
    ["AI", SAMPLE_AI_GENERATED],
    ["LongAI", SAMPLE_LONG_AI],
    ["Mixed", SAMPLE_TRUE_MIXED],
  ] as const) {
    const result = await analyzeAdvancedText(sample);
    if (result.overall.mixedProbability > 0) {
      assert(
        result.overall.adjustedAiRisk >= result.overall.aiProbability - 5, // allow -5 for sentence/consistency corrections
        `[${name}] adjustedAiRisk(${result.overall.adjustedAiRisk}) should not be well below aiProbability(${result.overall.aiProbability})`,
      );
    }
  }
});

Deno.test("main detector: Mixed score does NOT push clearly AI text below AI verdict", async () => {
  // This is the core regression: AI=45, Mixed=35, Human=20 must NOT return Human.
  // We approximate this by ensuring SAMPLE_AI_GENERATED never returns likely-human
  // even though the ensemble may produce moderate Mixed scores.
  const result = await analyzeAdvancedText(SAMPLE_AI_GENERATED);
  assert(
    result.overall.verdict !== 'likely-human' && result.overall.verdict !== 'mostly-human-ai-assisted',
    `CRITICAL REGRESSION: AI content classified as Human. verdict="${label(result.overall.verdict)}" ` +
    `ai=${result.overall.aiProbability} mixed=${result.overall.mixedProbability} human=${result.overall.humanProbability} ` +
    `adjustedRisk=${result.overall.adjustedAiRisk}`,
  );
});

// ---------------------------------------------------------------------------
// Response structure tests
// ---------------------------------------------------------------------------

Deno.test("main detector: response includes adjustedAiRisk in overall", async () => {
  const result = await analyzeAdvancedText(SAMPLE_AI_GENERATED);
  assert(
    typeof result.overall.adjustedAiRisk === 'number',
    "overall.adjustedAiRisk must be a number",
  );
  assert(
    result.overall.adjustedAiRisk >= 0 && result.overall.adjustedAiRisk <= 100,
    `adjustedAiRisk must be 0-100, got ${result.overall.adjustedAiRisk}`,
  );
});

Deno.test("main detector: _dev field is absent when DETECTOR_DEV_MODE is not set", async () => {
  // In test environment, DETECTOR_DEV_MODE is not set → _dev must be absent.
  const result = await analyzeAdvancedText(SAMPLE_AI_GENERATED) as any;
  // Deno.env.get('DETECTOR_DEV_MODE') is not 'true' in tests unless explicitly set.
  const devMode = Deno.env.get('DETECTOR_DEV_MODE') === 'true';
  if (!devMode) {
    assertEquals(result._dev, undefined, "_dev field must not be present in non-dev mode");
  }
});

Deno.test("main detector: sentence-level verdicts are present and non-empty for sufficient text", async () => {
  const result = await analyzeAdvancedText(SAMPLE_AI_GENERATED);
  assert(result.sentences.length > 0, "sentences array must not be empty for sufficient text");
  assert(result.paragraphs.length > 0, "paragraphs array must not be empty for sufficient text");
});

// ---------------------------------------------------------------------------
// SEO ASSISTANT PROTECTION TESTS
//
// These tests confirm that the SEO Assistant detector files are UNMODIFIED.
// They do NOT execute the SEO Assistant detector — they only check file
// integrity. Any change to these files must be treated as a critical failure.
// ---------------------------------------------------------------------------

Deno.test("SEO PROTECTION: advanced-detector/index.ts has not been modified", async () => {
  const SEO_DETECTOR_PATH = new URL(
    "../../../advanced-detector/index.ts",
    import.meta.url,
  );

  let content: string;
  try {
    content = await Deno.readTextFile(SEO_DETECTOR_PATH);
  } catch {
    throw new Error("CRITICAL: advanced-detector/index.ts cannot be read — file may have been deleted or moved.");
  }

  // Verify key structural markers that must remain unchanged.
  assert(content.includes("mode === 'ai'"), "SEO PROTECTION: mode=ai branch must still exist");
  assert(content.includes("mode === 'plagiarism'"), "SEO PROTECTION: mode=plagiarism branch must still exist");
  assert(content.includes("mode === 'hallucination'"), "SEO PROTECTION: mode=hallucination branch must still exist");
  assert(content.includes("INTEGRATIONS_API_KEY"), "SEO PROTECTION: INTEGRATIONS_API_KEY usage must remain intact");
  assert(content.includes("gemini-2.5-flash"), "SEO PROTECTION: Gemini model reference must remain intact");
  assert(content.includes("aiProbability"), "SEO PROTECTION: aiProbability field must remain in response schema");
  assert(content.includes("paragraphTimeline"), "SEO PROTECTION: paragraphTimeline field must remain in response schema");
  assert(!content.includes("analyzeAdvancedText"), "SEO PROTECTION: main detector engine must NOT be imported by SEO detector");
  assert(!content.includes("adjustedAiRisk"), "SEO PROTECTION: adjustedAiRisk must NOT appear in SEO Assistant detector");
  assert(!content.includes("DETECTOR_DEV_MODE"), "SEO PROTECTION: DETECTOR_DEV_MODE must NOT appear in SEO Assistant detector");
});

Deno.test("SEO PROTECTION: advanced-detector does not import main detection engine", async () => {
  const SEO_DETECTOR_PATH = new URL(
    "../../../advanced-detector/index.ts",
    import.meta.url,
  );
  const content = await Deno.readTextFile(SEO_DETECTOR_PATH);

  // Must not import anything from _shared/detection
  assert(
    !content.includes("_shared/detection"),
    "SEO PROTECTION: SEO detector must not import from _shared/detection engine modules",
  );
  assert(
    !content.includes("from '../_shared/detection"),
    "SEO PROTECTION: SEO detector must not import from _shared/detection",
  );
});

Deno.test("SEO PROTECTION: main detector entitlement/index files not broken", async () => {
  const ENTITLEMENTS_PATH = new URL(
    "../../entitlements.ts",
    import.meta.url,
  );
  const content = await Deno.readTextFile(ENTITLEMENTS_PATH);
  assert(content.includes("checkEntitlement"), "Shared entitlements file must still export checkEntitlement");
  assert(content.includes("recordUsage"), "Shared entitlements file must still export recordUsage");
});
