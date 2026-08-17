import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { analyzeAdvancedText } from '../engine.ts';

// Deno regression tests for AIDetector.cx verdict semantics.
// These tests verify that verdicts are evidence-based, not merely threshold-based.

const HIGH_AI_TEXT = `Artificial intelligence has revolutionized the way businesses operate in the modern era. The implementation of machine learning algorithms enables companies to process vast amounts of data with unprecedented efficiency. Organizations across industries are leveraging AI-powered tools to automate routine tasks, enhance decision-making, and improve customer experiences. As the technology continues to evolve, businesses must adapt their strategies to remain competitive in an increasingly digital landscape. Furthermore, the integration of artificial intelligence into existing workflows requires careful planning, robust governance, and ongoing evaluation of ethical considerations. By adopting a thoughtful approach, companies can harness the potential of AI while minimizing associated risks and ensuring long-term sustainability. In conclusion, the transformative impact of artificial intelligence on modern business operations is undeniable, and organizations that embrace these innovations are likely to achieve significant advantages in the years ahead.`;

const HIGH_HUMAN_TEXT = `I wrote this last night at my kitchen table while my cat knocked pens off the desk. The prompt asked us to reflect on a childhood memory, and I picked the afternoon my grandmother taught me to make dumplings.\n\nIt was hot, the kitchen smelled like scallions, and I kept complaining that the wrappers were sticking to my fingers. She didn't say much, just dusted more flour on the board and handed me another one. I tore three before she stopped me. "Gentle," she said. "The dough is listening."\n\nThat phrase stuck with me because I rush everything—emails, conversations, even meals. My brother says I eat like someone is going to steal my plate. I trimmed the opening twice because I kept starting with "I remember" and it sounded too generic. Anyway, that's the story. Not perfect, but it's mine.`;

const FORMAL_HUMAN_TEXT = `The proliferation of artificial intelligence in contemporary legal practice presents both opportunities and challenges for attorneys and their clients. This article examines the ethical implications of deploying predictive algorithms in criminal sentencing and bail determinations. Drawing on the doctrinal frameworks of due process and equal protection, it argues that opaque risk-assessment tools may perpetuate historical biases while simultaneously offering efficiencies that the adversarial system cannot easily replicate.\n\nThe analysis proceeds in three parts. First, it surveys the landscape of algorithmic decision-making tools currently used by state and federal courts. Second, it evaluates the dominant critiques in the scholarly literature, including concerns about accuracy, transparency, and accountability. Third, it proposes a limited framework for audibility and contestability that balances institutional competence with individual rights.\n\nThe conclusion suggests that regulation should focus on process rather than outcomes, ensuring that defendants have meaningful opportunities to challenge the inputs and assumptions underlying automated recommendations. Such an approach preserves the dignity interests central to procedural fairness without requiring courts to abandon useful analytical tools.`;

const SPANISH_TEXT = `La inteligencia artificial ha transformado profundamente la manera en que las empresas operan en la era moderna. La implementación de algoritmos de aprendizaje automático permite a las compañías procesar grandes cantidades de datos con una eficiencia sin precedentes. Las organizaciones de diversas industrias aprovechan herramientas impulsadas por la inteligencia artificial para automatizar tareas rutinarias, mejorar la toma de decisiones y mejorar la experiencia de los clientes. A medida que la tecnología continúa evolucionando, las empresas deben adaptar sus estrategias para mantenerse competitivas en un panorama digital cada vez más complejo. En conclusión, el impacto transformador de la inteligencia artificial en las operaciones empresariales modernas es innegable, y las organizaciones que adoptan estas innovaciones probablemente lograrán ventajas significativas en los próximos años.`;

const ARABIC_TEXT = `لقد أحدث الذكاء الاصطناعي ثورة في طريقة عمل الشركات في العصر الحديث. يتيح تنفيذ خوارزميات التعلم الآلي للشركات معالجة كميات هائلة من البيانات بكفاءة غير مسبوقة. تستخدم المؤسسات عبر مختلف الصناعات أدوات تعتمد على الذكاء الاصطناعي لأتمتة المهام الروتينية وتحسين اتخاذ القرارات وتحسين تجربة العملاء. مع استمرار تطور التكنولوجيا، يجب على الشركات تكييف استراتيجياتها للبقاء competitive في المشهد الرقمي المتزايد التعقيد. وفي الختام، فإن التأثير التحويلي للذكاء الاصطناعي على عمليات الأعمال الحديثة لا يمكن إنكاره، والمؤسسات التي تعتمد هذه الابتكارات من المحتمل أن تحقق مزايا كبيرة في السنوات القادمة.`;

Deno.test('English high AI text returns an AI-side verdict', async () => {
  const r = await analyzeAdvancedText(HIGH_AI_TEXT, {});
  assertEquals(r.language.primary?.code, 'en');
  assertNotEquals(r.overall.verdict, 'likely-human');
  assertNotEquals(r.overall.verdict, 'mostly-human-ai-assisted');
});

Deno.test('English high AI text does not imply human editing when mixed and humanization evidence is absent', async () => {
  const r = await analyzeAdvancedText(HIGH_AI_TEXT, {});
  if (r.overall.verdict === 'mostly-ai-human-edited') {
    const hasEditingEvidence =
      r.overall.mixedProbability > 0 || (r.humanization?.detected ?? false);
    if (!hasEditingEvidence) {
      throw new Error(
        `Expected no 'mostly-ai-human-edited' verdict without editing evidence, got ${r.overall.verdict} ` +
        `(mixed=${r.overall.mixedProbability}, humanized=${r.humanization?.detected})`
      );
    }
  }
});

Deno.test('English informal human text returns human-side verdict', async () => {
  const r = await analyzeAdvancedText(HIGH_HUMAN_TEXT, {});
  assertEquals(r.language.primary?.code, 'en');
  assertNotEquals(r.overall.verdict, 'likely-ai');
  assertNotEquals(r.overall.verdict, 'mostly-ai-human-edited');
});

Deno.test('English formal text does not imply human editing without evidence', async () => {
  const r = await analyzeAdvancedText(FORMAL_HUMAN_TEXT, {});
  assertEquals(r.language.primary?.code, 'en');
  if (r.overall.verdict === 'mostly-ai-human-edited') {
    const hasEditingEvidence =
      r.overall.mixedProbability > 0 || (r.humanization?.detected ?? false);
    if (!hasEditingEvidence) {
      throw new Error(
        `Expected no 'mostly-ai-human-edited' verdict without editing evidence, got ${r.overall.verdict} ` +
        `(mixed=${r.overall.mixedProbability}, humanized=${r.humanization?.detected})`
      );
    }
  }
});

Deno.test('Spanish text is detected and receives a non-inconclusive verdict', async () => {
  const r = await analyzeAdvancedText(SPANISH_TEXT, {});
  assertEquals(r.language.primary?.code, 'es');
  assertNotEquals(r.overall.verdict, 'insufficient-text');
  assertNotEquals(r.overall.verdict, 'inconclusive');
});

Deno.test('Arabic text is detected and receives a non-inconclusive verdict', async () => {
  const r = await analyzeAdvancedText(ARABIC_TEXT, {});
  assertEquals(r.language.primary?.code, 'ar');
  assertNotEquals(r.overall.verdict, 'insufficient-text');
  assertNotEquals(r.overall.verdict, 'inconclusive');
});

Deno.test('Balanced detector exposes humanization evidence for inspection', async () => {
  const r = await analyzeAdvancedText(HIGH_AI_TEXT, {});
  assertEquals(typeof r.humanization?.detected, 'boolean');
  assertEquals(typeof r.humanization?.confidence, 'number');
});
