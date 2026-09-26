import { assert, assertEquals, assertNotEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { analyzeAdvancedText } from '../engine.ts';
import { analyzeAIRisk } from '../../../../../src/pages/seo-assistant/analysisEngine.ts';

// Comprehensive regression tests for the AIDetector.cx dual-detector system.
// These tests assert the agreed-upon semantics: Balanced verdicts are evidence-based
// (human-editing claims require humanization evidence), and the High-Sensitivity
// engine presents its actual Low/Medium/High Risk levels without being relabeled as
// a mixed-authorship verdict.

const CONVENTIONAL_AI_TEXT = `Artificial intelligence has revolutionized the way businesses operate in the modern era. The implementation of machine learning algorithms enables companies to process vast amounts of data with unprecedented efficiency. Organizations leveraging these technologies experience substantial improvements in productivity metrics and operational cost reduction. The utilization of AI-powered tools represents a paradigm shift in how enterprises approach problem-solving and decision-making processes.`;

const HUMAN_TEXT = `I wrote this last night at my kitchen table while my cat knocked pens off the desk. The prompt asked us to reflect on a childhood memory, and I picked the afternoon my grandmother taught me to make dumplings.

It was hot, the kitchen smelled like scallions, and I kept complaining that the wrappers were sticking to my fingers. She didn't say much, just dusted more flour on the board and handed me another one. I tore three before she stopped me. "Gentle," she said. "The dough is listening."

That phrase stuck with me because I rush everything—emails, conversations, even meals. My brother says I eat like someone is going to steal my plate. I trimmed the opening twice because I kept starting with "I remember" and it sounded too generic. Anyway, that's the story. Not perfect, but it's mine.`;

const HUMAN_STYLE_AI_TEXT = `So, AI is kind of taking over everything, right? It's changing how companies work — like, they can crunch massive piles of data super fast. But honestly, the real kicker is that natural language stuff. It can spit out articles that look pretty human. Some firms are saving a ton of cash and moving way quicker. Anyway, at the end of the day, it's a huge deal for basically every industry out there.`;

const HUMANIZED_AI_TEXT = `AI is basically reshaping how companies operate these days. Like, they can process huge amounts of data in no time. But honestly, the wildest part is the natural language side — it can crank out articles that actually sound like a person wrote them. Some businesses are saving serious money and moving a lot faster. Anyway, long story short, it's a big deal for pretty much every industry.`;

const MIXED_AUTHORSHIP_TEXT = `I wrote this intro myself, so it has my usual quirks and sentence fragments. Okay.

The integration of artificial intelligence into enterprise workflows has yielded measurable improvements in operational efficiency. Machine learning algorithms facilitate the processing of large-scale datasets with unprecedented speed. Organizations that leverage these technologies report reduced costs and enhanced decision-making capabilities. Furthermore, the automation of routine tasks enables human capital to be redirected toward strategic priorities. In conclusion, the adoption of AI represents a transformative shift for modern business operations.`;

const HIGH_AI_TEXT = `Artificial intelligence has revolutionized the way businesses operate in the modern era. The implementation of machine learning algorithms enables companies to process vast amounts of data with unprecedented efficiency. Organizations across industries are leveraging AI-powered tools to automate routine tasks, enhance decision-making, and improve customer experiences. As the technology continues to evolve, businesses must adapt their strategies to remain competitive in an increasingly digital landscape. Furthermore, the integration of artificial intelligence into existing workflows requires careful planning, robust governance, and ongoing evaluation of ethical considerations. By adopting a thoughtful approach, companies can harness the potential of AI while minimizing associated risks and ensuring long-term sustainability. In conclusion, the transformative impact of artificial intelligence on modern business operations is undeniable, and organizations that embrace these innovations are likely to achieve significant advantages in the years ahead.`;

const NEAR_THRESHOLD_AI_TEXT = `The implementation of machine learning has improved productivity. Some writers argue this shift is beneficial. However, personal experience also matters. I think the results are interesting overall, and the data seems to support the claim that automation can help teams focus on more important work.`;

const SPANISH_AI_TEXT = `La inteligencia artificial ha transformado profundamente la manera en que las empresas operan en la era moderna. La implementación de algoritmos de aprendizaje automático permite a las compañías procesar grandes cantidades de datos con una eficiencia sin precedentes. Las organizaciones de diversas industrias aprovechan herramientas impulsadas por la inteligencia artificial para automatizar tareas rutinarias, mejorar la toma de decisiones y mejorar la experiencia de los clientes. En conclusión, el impacto transformador de la inteligencia artificial en las operaciones empresariales modernas es innegable.`;

const ARABIC_AI_TEXT = `لقد أحدث الذكاء الاصطناعي ثورة في طريقة عمل الشركات في العصر الحديث. يتيح تنفيذ خوارزميات التعلم الآلي للشركات معالجة كميات هائلة من البيانات بكفاءة غير مسبوقة. تستخدم المؤسسات عبر مختلف الصناعات أدوات تعتمد على الذكاء الاصطناعي لأتمتة المهام الروتينية وتحسين اتخاذ القرارات. وفي الختام، فإن التأثير التحويلي للذكاء الاصطناعي على عمليات الأعمال الحديثة لا يمكن إنكاره.`;

const LOW_RISK_TEXT = `Hi. I went to the store because my dog was out of food and my neighbor had already borrowed my car keys, so I walked all the way down the hill in the rain with my umbrella and my headphones, because I really did not want to deal with traffic or the bus or my brother's endless questions about why I still live in this neighborhood. The cashier smiled at me. I smiled back. I bought everything. I went home. My dog was happy. I was happy. We ate dinner together on the floor, because my table is covered in books I keep meaning to put away and my chair is broken, so we sat on the rug like animals.`;

const MEDIUM_RISK_TEXT = `I tried to write this in a way that sounds like me, which means a lot of run-on sentences and random references. My dog is currently asleep under my desk and I can hear my neighbor's lawnmower. Anyway, I don't think AI wrote this, mostly because I wrote it while annoyed about traffic.`;

function hasEditingEvidence(result: Awaited<ReturnType<typeof analyzeAdvancedText>>): boolean {
  return result.overall.mixedProbability > 0 || (result.humanization?.detected ?? false);
}

function isAiVerdict(verdict: string): boolean {
  return verdict === 'likely-ai' || verdict === 'mostly-ai-human-edited';
}

function isHumanVerdict(verdict: string): boolean {
  return verdict === 'likely-human' || verdict === 'mostly-human-ai-assisted';
}

function isNonDefiniteVerdict(verdict: string): boolean {
  return verdict === 'mixed' || verdict === 'inconclusive' || verdict === 'mostly-human-ai-assisted' || verdict === 'mostly-ai-human-edited';
}

Deno.test('Conventional AI text is classified on the AI side', async () => {
  const r = await analyzeAdvancedText(CONVENTIONAL_AI_TEXT, {});
  assertEquals(r.language.primary?.code, 'en');
  assert(isAiVerdict(r.overall.verdict) || isNonDefiniteVerdict(r.overall.verdict));
  assert(r.overall.aiProbability >= r.overall.humanProbability);
  if (r.overall.verdict === 'mostly-ai-human-edited') {
    assert(hasEditingEvidence(r), 'Human-edited verdict requires evidence');
  }
});

Deno.test('Human text is classified on the human side', async () => {
  const r = await analyzeAdvancedText(HUMAN_TEXT, {});
  assertEquals(r.language.primary?.code, 'en');
  assert(isHumanVerdict(r.overall.verdict) || isNonDefiniteVerdict(r.overall.verdict));
  assert(r.overall.humanProbability >= r.overall.aiProbability);
});

Deno.test('Human-style AI text is not forced to likely AI', async () => {
  const r = await analyzeAdvancedText(HUMAN_STYLE_AI_TEXT, {});
  assertEquals(r.language.primary?.code, 'en');
  assert(r.overall.confidenceLevel !== 'Very High', 'Human-style AI should not produce certainty');
  assert(r.overall.aiProbability < 85, 'Human-style AI should not be assigned overwhelming AI probability');
  if (r.overall.verdict === 'mostly-ai-human-edited') {
    assert(hasEditingEvidence(r), 'Human-edited verdict requires evidence');
  }
});

Deno.test('Human-edited AI text is detected as humanized', async () => {
  const r = await analyzeAdvancedText(HUMANIZED_AI_TEXT, { contentType: 'blog' });
  assertEquals(r.language.primary?.code, 'en');
  assert(r.humanization?.detected === true, 'Expected humanization/paraphrase signals to be detected');
  assert(r.overall.verdict !== 'likely-ai', 'Humanized AI should not be classified as pure AI');
  assert(r.overall.confidenceLevel !== 'Very High', 'Humanized AI should avoid false certainty');
});

Deno.test('Mixed authorship does not infer human editing without evidence', async () => {
  const r = await analyzeAdvancedText(MIXED_AUTHORSHIP_TEXT, {});
  assertEquals(r.language.primary?.code, 'en');
  if (r.overall.verdict === 'mostly-ai-human-edited') {
    assert(hasEditingEvidence(r), 'Human-edited verdict requires evidence');
  }
});

Deno.test('High AI text returns an AI-side verdict', async () => {
  const r = await analyzeAdvancedText(HIGH_AI_TEXT, {});
  assertEquals(r.language.primary?.code, 'en');
  assert(r.overall.aiProbability >= 60);
  assert(isAiVerdict(r.overall.verdict) || r.overall.verdict === 'mixed', `Unexpected verdict: ${r.overall.verdict}`);
  if (r.overall.verdict === 'mostly-ai-human-edited') {
    assert(hasEditingEvidence(r), 'Human-edited verdict requires evidence');
  }
});

Deno.test('High human text returns a human-side verdict', async () => {
  const r = await analyzeAdvancedText(HUMAN_TEXT, {});
  assert(r.overall.humanProbability >= 60);
  assert(isHumanVerdict(r.overall.verdict), `Expected human-side verdict, got ${r.overall.verdict}`);
});

Deno.test('Near-threshold result does not produce a false human-edited verdict', async () => {
  const r = await analyzeAdvancedText(NEAR_THRESHOLD_AI_TEXT, {});
  assertEquals(r.language.primary?.code, 'en');
  if (r.overall.verdict === 'mostly-ai-human-edited') {
    assert(hasEditingEvidence(r), 'Human-edited verdict requires evidence');
  }
});

Deno.test('Mixed = 0 with absent humanization does not claim human editing', async () => {
  const r = await analyzeAdvancedText(CONVENTIONAL_AI_TEXT, {});
  assert(r.overall.mixedProbability < 10, `Expected mixed ≈ 0, got ${r.overall.mixedProbability}`);
  if (r.overall.verdict === 'mostly-ai-human-edited') {
    assert(r.humanization?.detected === true, 'Human-edited verdict with mixed=0 requires humanization evidence');
    assert((r.humanization?.confidence ?? 0) >= 0.35, 'Humanization confidence below evidence gate');
  }
});

Deno.test('Humanization detected in rewritten AI content', async () => {
  const r = await analyzeAdvancedText(HUMANIZED_AI_TEXT, {});
  assert(r.humanization?.detected === true);
  assert((r.humanization?.confidence ?? 0) > 0);
});

Deno.test('Conventional AI text does not carry strong humanization evidence', async () => {
  const r = await analyzeAdvancedText(CONVENTIONAL_AI_TEXT, {});
  const confidence = r.humanization?.confidence ?? 0;
  // The evidence gate requires detected === true && confidence >= 35.
  assert(
    r.humanization?.detected === false || confidence < 35,
    `Conventional AI text should not cross the humanization evidence gate (confidence=${confidence})`
  );
});

Deno.test('English text is detected as English', async () => {
  const r = await analyzeAdvancedText(CONVENTIONAL_AI_TEXT, {});
  assertEquals(r.language.primary?.code, 'en');
  assertEquals(r.language.primary?.name, 'English');
});

Deno.test('Spanish text is detected and receives a non-inconclusive verdict', async () => {
  const r = await analyzeAdvancedText(SPANISH_AI_TEXT, { contentType: 'academic' });
  assertEquals(r.language.primary?.code, 'es');
  assert(r.overall.verdict !== 'insufficient-text');
  assert(r.overall.verdict !== 'inconclusive');
  assert(r.overall.aiProbability >= 50);
  if (r.overall.verdict === 'mostly-ai-human-edited') {
    assert(hasEditingEvidence(r), 'Human-edited verdict requires evidence');
  }
});

Deno.test('Arabic text is detected and receives a non-inconclusive verdict', async () => {
  const r = await analyzeAdvancedText(ARABIC_AI_TEXT, {});
  assertEquals(r.language.primary?.code, 'ar');
  assert(r.overall.verdict !== 'insufficient-text');
  assert(r.overall.verdict !== 'inconclusive');
  if (r.overall.verdict === 'mostly-ai-human-edited') {
    assert(hasEditingEvidence(r), 'Human-edited verdict requires evidence');
  }
});

Deno.test('High-Sensitivity engine reports Low Risk for informal human text', () => {
  const r = analyzeAIRisk(LOW_RISK_TEXT);
  assertEquals(r.riskLevel, 'Low');
  assert(r.aiScore < 40);
  assert(r.humanScore >= 60);
});

Deno.test('High-Sensitivity engine reports High Risk for conventional AI text', () => {
  const r = analyzeAIRisk(CONVENTIONAL_AI_TEXT);
  assertEquals(r.riskLevel, 'High');
  assert(r.aiScore >= 70);
  assert(r.humanScore <= 30);
});

Deno.test('High-Sensitivity engine reports Medium Risk for boundary text', () => {
  const r = analyzeAIRisk(MEDIUM_RISK_TEXT);
  assertEquals(r.riskLevel, 'Medium');
  assert(r.aiScore >= 40 && r.aiScore < 70, `Expected AI score in Medium range, got ${r.aiScore}`);
  // Medium Risk is the engine's own label; it must not be confused with a mixed-authorship verdict.
  assertNotEquals(r.riskLevel, 'Mixed');
});

Deno.test('Balanced and High-Sensitivity detectors can disagree on human-style AI', async () => {
  const [balanced, aggressive] = await Promise.all([
    analyzeAdvancedText(HUMAN_STYLE_AI_TEXT, {}),
    Promise.resolve(analyzeAIRisk(HUMAN_STYLE_AI_TEXT)),
  ]);
  assert(isHumanVerdict(balanced.overall.verdict) || balanced.overall.verdict === 'inconclusive', `Balanced should lean human, got ${balanced.overall.verdict}`);
  assert(aggressive.riskLevel === 'High' || aggressive.riskLevel === 'Medium', 'High-Sensitivity should flag the AI pattern');
  assert((aggressive.riskLevel as string) !== 'Low', 'High-Sensitivity should not report Low for this AI sample');
});

Deno.test('All result fields are present and stable across repeated analyses', async () => {
  const [a, b] = await Promise.all([
    analyzeAdvancedText(CONVENTIONAL_AI_TEXT, {}),
    analyzeAdvancedText(CONVENTIONAL_AI_TEXT, {}),
  ]);
  assertEquals(a.overall.aiProbability, b.overall.aiProbability);
  assertEquals(a.overall.humanProbability, b.overall.humanProbability);
  assertEquals(a.overall.mixedProbability, b.overall.mixedProbability);
  assertEquals(a.overall.verdict, b.overall.verdict);
  assertEquals(a.metadata.detectorVersion, b.metadata.detectorVersion);
  assertEquals(a.metadata.calibrationVersion, b.metadata.calibrationVersion);
  assert(typeof a.overall.confidence === 'number');
  assert(typeof a.overall.verdictLabel === 'string');
  assert(Array.isArray(a.sentences));
  assert(Array.isArray(a.highlights));
  assert(typeof a.explanation.simple === 'string');
  assert(typeof a.explanation.technical === 'string');
});

const VERIFIED_HUMAN_ARTICLE = `What does an AI Detector actually mean?
Have you been hit by the bug yet?. You might be wondering what “the bug” in this context means, freight not, because I am about to unveil what it means, (drumroll!!!!!!!). 
The influx of Artificial Intelligence has no doubt brought tremendous benefits to users across the board. However, there’s a popular saying that goes thus, too much of everything is sometimes too bad, and would consequently have its downside. With that being said, in order to curb the excessive use of artificial intelligence language models, some researchers, supervisors, and lecturers have resorted to the use of AI detectors models such as, AI Detector.cx, Pangram, and ZeroGPT, amongst several others, that would help them verify if their students made use of certain AI Language models such as; CHAPGPT, Gemini, and Claude 3.5 to generate their content. 
On that note, it is essential that we understand what AI Detector tools actually mean and how they operate. Just like the name implies, it is a tool that is used to detect, and verify if a content was being generated fully by AI (machine generated content), or it was being generated by a mix of AI, and human intelligence, or to also detect if a content was generated by human intelligence as well. It is pertinent to note that there’s no scientific evidence to prove the result of these AI Detectors models, that’s because each detector model operates based on different methodology, statistical analysis, and several thresholds that they implore in order to give their verdict/ report. 
What are the parameters that most AI Detectors adopt?
From our ongoing analysis it is important that we dissect the various elements upon which an AI Detector carries out its analysis. On top of the list of elements are thresholds. Why we would be starting with thresholds is based on the various factors associated with them, which includes, sentence disparity, Burstiness, grammatical error, punctuation accuracy. These are few of the factors that would be considered, however for the case of brevity, we would be highlighting briefly on the aforementioned mentioned factors, and would subsequently advise that you go through other articles on our website, in order to gain better clarity, as each of the factors above have been identified and discussed in details.
 
First on the list, we have sentence disparity, the case of sentence disparity is oftentimes associated with the fact that some AI detectors are regulated to understand that human writing is obscure in sentence consistency. Which is oftentimes based on the lack of coherent flow, as well as a mix of short sentences with long sentences. Hence, if a content is being evaluated by an AI detector that is regulated by such a threshold, there’s a high percentage that they would flag down a content that has incoherent sentences as human- like, and this would bring us to the case of False negative. 
The other threshold to be considered is Burstiness, which in simple terms means the volume of a particular sentence. Most AI detectors are regulated to understand that a particular volume of sentence can only be associated with machine generated content, without understanding or considering the fact that they are some professional writing writer that understands the pros and cons of writing. When such a content is generated and evaluated by an AI Detector, there is also a high chance that the result would report such content to be AI generated, which would further bring us to the case of false positives.
The next on the list is grammatical error. This simply refers to the fact that some AI detectors are regulated to understand that the existence of grammatical errors in a content clearly indicates that such content was generated by humans, because one thing that is often associated with Artificial Intelligence is the absence of errors. 
The last factor on the list, and certainly not the list is punctuation accuracy. As little as this factor seems like on the surface, it is not the same when analyzed under AI Detector. Similar to grammatical error, some AI detectors are regulated to understand that the presence of punctuation accuracy automatically means that such content is machine generated. Oftentimes than not, this is not entirely an accurate verdict, because it’s important to note that some professionals, and non- English language writers have been trained judiciously, and are quite vast with the use of punctuation.  With that being said, it is very pertinent that we understand that the use of AI detectors is not a means to an end, and should not be considered as a final verdict, bead certain irregularities associated with them, and also because there’s no scientific evidence that validates their report.
The various notable types of AI Detectors that we have.
In as much as there’s no scientific evidence surrounding the use of AI Detectors. We definitely need to acknowledge and give credit to notable AI Detectors that are doing an amazing job. 
Top of the list we have AI Detector.cx, this is one tool that has stood the test of time and has proven its relevance over time. You might ponder and wonder why I am giving all these accolades, I would like that you use the tool yourself, and come back and comment if indeed they deserve the accolades associated I attributed to them. Unlike other AI detectors, they have a distinct feature, which not only enables you with a valid result, it also gives a breakdown analysis as to how the detector arrived at its results. Which to me, is a very interesting and distinctive feature. That’s why I strongly implore that you make use of the tool, and give your honest feedback. 
Other high ranking AI detectors tools are Pangram, and ZeroGPT. They have quite distinctive features that make them stand out and are also frequently being used by users across the board. With that being said, it is important to note that the fact that if a content is being evaluated by the three detector tools listed above, and gives varying results, it is important to note that none of the results should be considered as a final verdict, that’s because there are different thresholds binding how each of these detectors tools operates. 
In the grand scheme of things, I sincerely do believe that the use of AI technologies has been to maximize time and efficiency, and not to tussle about which is more superior to which. I am also of the firm believe that a judicious use of AI technologies would automatically drive tremendous success in work rates.`;

Deno.test('Verified known-human article passes false-positive requirements on Edge', async () => {
  const r = await analyzeAdvancedText(VERIFIED_HUMAN_ARTICLE, { contentType: 'auto' });
  assert(r.overall.aiProbability < 55, `AI probability must be <55%, got ${r.overall.aiProbability}`);
  assert(r.overall.humanProbability > r.overall.aiProbability, `Human prob (${r.overall.humanProbability}) must exceed AI prob (${r.overall.aiProbability})`);
  assert(r.overall.verdict !== 'likely-ai', `Verdict cannot be likely-ai`);
  assert(r.overall.verdict !== 'mostly-ai-human-edited', `Verdict cannot be mostly-ai-human-edited`);
});
