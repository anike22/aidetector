import { analyzeAdvancedText } from '../src/lib/detection/engine';

type ExpectedClass = 'ai' | 'human' | 'mixed' | 'humanized';

interface BenchmarkSample {
  id: string;
  language: string;
  contentType: 'academic' | 'blog' | 'creative' | 'news' | 'social' | 'technical';
  expected: ExpectedClass;
  text: string;
  notes?: string;
}

// The benchmark uses curated representative samples. It is designed to measure
// relative performance across languages and content types, not to train the model.
const SAMPLES: BenchmarkSample[] = [
  // English
  {
    id: 'en-ai-blog',
    language: 'en',
    contentType: 'blog',
    expected: 'ai',
    text: `Artificial intelligence has revolutionized the way businesses operate in the modern era. The implementation of machine learning algorithms enables companies to process vast amounts of data with unprecedented efficiency. Furthermore, natural language processing capabilities allow for automated content generation that is often indistinguishable from human writing. Organizations leveraging these technologies experience substantial improvements in productivity metrics and operational cost reduction. In conclusion, AI represents a transformative force across industries.`,
  },
  {
    id: 'en-human-creative',
    language: 'en',
    contentType: 'creative',
    expected: 'human',
    text: `Honestly? I have no idea what my cat was thinking at 3am. He knocked a glass off the counter, stared at me like I did it, and then sprinted down the hallway. Classic Tuesday move if you ask me. Anyway, I finally got around to repotting that sad-looking fern; fingers crossed it survives the winter because the kitchen window is drafty as heck. My neighbor brought over cookies though, so the day wasn't a total loss.`,
  },
  // Spanish
  {
    id: 'es-ai-academic',
    language: 'es',
    contentType: 'academic',
    expected: 'ai',
    text: `La inteligencia artificial se ha convertido en una de las tecnologías más transformadoras del siglo XXI. En el ámbito educativo, sus aplicaciones han permitido personalizar los procesos de enseñanza y aprendizaje de manera significativa. Los sistemas basados en algoritmos de aprendizaje automático pueden identificar las fortalezas y debilidades de cada estudiante, adaptando el contenido a su ritmo y estilo particular. Además, la inteligencia artificial facilita la automatización de tareas administrativas, liberando tiempo para que los docentes se concentren en la interacción humana.`,
  },
  {
    id: 'es-human-creative',
    language: 'es',
    contentType: 'creative',
    expected: 'human',
    text: `Ayer por la tarde salí a pasear por el barrio sin rumbo fijo. Me encontré con una librería antigua que nunca había visto y me pasé media hora hojeando libros de segunda mano. Al final me llevé una novela de detectives con las tapas gastadas. No sé si me gustará, pero la portada me hizo gracia y el vendedor me contó que antes perteneció a un actor de teatro local.`,
  },
  // French
  {
    id: 'fr-ai-academic',
    language: 'fr',
    contentType: 'academic',
    expected: 'ai',
    text: `L'intelligence artificielle transforme profondément de nombreux secteurs de l'économie contemporaine. Dans le domaine de l'éducation, elle offre des possibilités sans précédent de personnalisation des parcours d'apprentissage. Les algorithmes d'apprentissage automatique peuvent analyser les forces et les faiblesses de chaque étudiant, proposant ainsi des contenus adaptés à leur rythme. Par ailleurs, l'automatisation des tâches administratives permet aux enseignants de consacrer davantage de temps à l'accompagnement humain. Il reste essentiel de garantir une utilisation éthique et responsable de ces outils.`,
  },
  {
    id: 'fr-human-creative',
    language: 'fr',
    contentType: 'creative',
    expected: 'human',
    text: `Ce matin j'ai raté mon bus de peu, alors j'ai décidé de marcher jusqu'au bureau. Le ciel était gris mais l'air sentait bon la pluie. J'ai croisé un chien qui m'a regardé bizarrement, et ça m'a fait sourire. Au café du coin, la serveuse m'a servi un cappuccino un peu trop chaud, comme d'habitude. C'est ces petits détails qui rendent la journée supportable.`,
  },
  // Portuguese
  {
    id: 'pt-ai-academic',
    language: 'pt',
    contentType: 'academic',
    expected: 'ai',
    text: `A inteligência artificial tornou-se uma das tecnologias mais transformadoras do século XXI. No âmbito da educação, suas aplicações permitiram personalizar os processos de ensino e aprendizagem de forma significativa. Os sistemas baseados em algoritmos de aprendizado de máquina podem identificar as fortalezas e fraquezas de cada estudante, adaptando o conteúdo ao seu ritmo e estilo particulares. Além disso, a inteligência artificial facilita a automação de tarefas administrativas.`,
  },
  {
    id: 'pt-human-creative',
    language: 'pt',
    contentType: 'creative',
    expected: 'human',
    text: `Ontem à tarde fui até a praia sem planejar nada. O vento estava forte e a areia entrou nos meus olhos várias vezes. Acabei sentando num banco velho e ficou observando as crianças brincarem com pipas de cores estranhas. Uma senhora veio vender queijo coalho e eu comprei três espetos sem pensar. Hoje ainda sinto o gosto de limão na boca.`,
  },
  // German
  {
    id: 'de-ai-academic',
    language: 'de',
    contentType: 'academic',
    expected: 'ai',
    text: `Die künstliche Intelligenz hat sich zu einer der transformativsten Technologien des 21. Jahrhunderts entwickelt. Im Bildungsbereich ermöglichen ihre Anwendungen eine signifikante Personalisierung von Lehr- und Lernprozessen. Systeme, die auf Algorithmen des maschinellen Lernens basieren, können die Stärken und Schwächen jedes Schülers erkennen und den Inhalt an dessen Tempo und Stil anpassen. Darüber hinaus erleichtert künstliche Intelligenz die Automatisierung administrativer Aufgaben.`,
  },
  {
    id: 'de-human-creative',
    language: 'de',
    contentType: 'creative',
    expected: 'human',
    text: `Gestern Abend bin ich ohne Plan durch die Stadt spaziert. Es hat zwischendurch geregnet, aber ich hatte gerade keine Lust, nach Hause zu gehen. In einem kleinen Buchladen habe ich eine alte Krimiausgabe gefunden, deren Rücken bereits eingerissen war. Der Verkäufer erzählte mir, das Buch sei vor Jahrzehnten einmal verboten gewesen. Ich habe es gekauft, nur wegen der Geschichte.`,
  },
  // Arabic
  {
    id: 'ar-ai-academic',
    language: 'ar',
    contentType: 'academic',
    expected: 'ai',
    text: `أصبح الذكاء الاصطناعي واحداً من أهم التقنيات المتحولة في القرن الحادي والعشرين. في مجال التعليم، سمحت تطبيقاته بتخصيص عمليات التعليم والتعلم بشكل ملحوظ. يمكن للأنظمة القائمة على خوارزميات التعلم الآلي تحديد نقاط القوة والضعف لدى كل طالب، وتكييف المحتوى وفق سرعته وأسلوبه. بالإضافة إلى ذلك، يسهل الذكاء الاصطناعي أتمتة المهام الإدارية.`,
  },
  {
    id: 'ar-human-creative',
    language: 'ar',
    contentType: 'creative',
    expected: 'human',
    text: `المبارح طلعت أتمشى في الحارة بدون أي تخطيط. الهواء كان بارد شوي والسماء رمادية. شفت ولد صغير بيلعب بالكورة قدام البقالة، وضربتني الكورة في رجلي. ضحكنا الاتنين. بعدين دخلت مقهى قديم شربت قهوة مرّة زي ما بحب. الرجل اللي شغّال هناك عرفني من زمان وسأل عن أهلي.`,
  },
  // Chinese
  {
    id: 'zh-ai-academic',
    language: 'zh',
    contentType: 'academic',
    expected: 'ai',
    text: `人工智能已成为二十一世纪最具变革性的技术之一。在教育领域，它的应用显著地推动了教学过程的个性化。基于机器学习算法的系统可以识别每个学生的优势和劣势，并根据其节奏和风格调整内容。此外，人工智能还有助于自动化管理任务，使教师能够将更多时间投入到人际互动中。`,
  },
  {
    id: 'zh-human-creative',
    language: 'zh',
    contentType: 'creative',
    expected: 'human',
    text: `昨天傍晚我随便出门走走，没想好去哪儿。路过一家旧书店，看到门口摆着一盆快枯萎的绿萝，老板说要是喜欢就送我。我捧着它走回家，路上还买了两个热乎的糖炒栗子。晚上给它换了盆，也不知道能不能活，反正先试试呗。`,
  },
  // Japanese
  {
    id: 'ja-ai-academic',
    language: 'ja',
    contentType: 'academic',
    expected: 'ai',
    text: `人工知能は21世紀における最も変革的な技術の一つとなっています。教育分野では、その応用により学習プロセスの個別化が大きく進みました。機械学習アルゴリズムに基づくシステムは、各学生の強みと弱みを特定し、それぞれのペースやスタイルに合わせてコンテンツを調整できます。さらに、人工知能は事務作業の自動化も容易にします。`,
  },
  {
    id: 'ja-human-creative',
    language: 'ja',
    contentType: 'creative',
    expected: 'human',
    text: `昨日の夜、ふと思い立って近所の公園へ行った。風が強くて落ち葉がすごいことになってた。ベンチに座ってたら、野良猫が足元に寄ってきて鳴いた。名前も知らないのに、なんだか懐かしい感じがした。帰り道にコンビニでおでんを買って、家でゆっくり食べた。`,
  },
  // Korean
  {
    id: 'ko-ai-academic',
    language: 'ko',
    contentType: 'academic',
    expected: 'ai',
    text: `인공지능은 21세기 가장 변혁적인 기술 중 하나로 자리 잡았습니다. 교육 분야에서도 그 응용은 교수 학습 과정의 개인 맞춤화를 크게 촉진했습니다. 기계 학습 알고리즘에 기반한 시스템은 각 학생의 강점과 약점을 파악하고, 그들의 속도와 스타일에 맞춰 콘텐츠를 조정할 수 있습니다. 또한 인공지능은 행정 업무의 자동화도 용이하게 합니다.`,
  },
  {
    id: 'ko-human-creative',
    language: 'ko',
    contentType: 'creative',
    expected: 'human',
    text: `어제 저녁 갑자기 생각나서 동네 산책을 나갔어. 바람이 꽤 불어서 모자가 날아갈 뻔했어. 길 가다가 오래된 분식집을 발견했는데, 떡볶이 맛이 엄청 예전 같았어. 사장님이 반찬 하나 더 주셔서 고맙다고 인사했어. 집에 오는 길에는 달이 예쁘게 떠 있었어.`,
  },
  // Hindi
  {
    id: 'hi-ai-academic',
    language: 'hi',
    contentType: 'academic',
    expected: 'ai',
    text: `कृत्रिम बुद्धिमत्ता इक्कीसवीं सदी की सबसे महत्वपूर्ण तकनीकों में से एक बन गई है। शिक्षा के क्षेत्र में इसके अनुप्रयोगों ने सिखाने और सीखने की प्रक्रियाओं को व्यक्तिगत बनाने में मदद की है। मशीन लर्निंग एल्गोरिदम पर आधारित प्रणालियाँ प्रत्येक छात्र की ताकत और कमजोरी को पहचान सकती हैं और सामग्री को उसकी गति और शैली के अनुसार ढाल सकती हैं। इसके अलावा, कृत्रिम बुद्धिमत्ता प्रशासनिक कार्यों को स्वचालित करने में भी सहायता करती है।`,
  },
  {
    id: 'hi-human-creative',
    language: 'hi',
    contentType: 'creative',
    expected: 'human',
    text: `कल शाम मैं बिना किसी योजना के घूमने निकल पड़ा। हवा ठंडी थी और आसमान में बादल छाए हुए थे। रास्ते में एक पुरानी चाय की दुकान दिखी, वहाँ मैंने गरम गरम समोसे खाए। दुकान वाले अंकल ने बताया कि उनकी दुकान पचास साल पुरानी है। मैंने सोचा, कुछ चीज़ें बस नहीं बदलतीं।`,
  },
  // Yoruba
  {
    id: 'yo-ai-academic',
    language: 'yo',
    contentType: 'academic',
    expected: 'ai',
    text: `Ọgbọ́n àìṣeẹ̀dá jẹ́ ọ̀kan lára àwọn ìmọ̀ ẹ̀rọ tó yàtọ̀ sí i ni ògúnnìrán ojo odun 21. Nínú agbègbè ẹ̀kọ́, àwọn ìlò rẹ̀ ti gbà á ní ìṣeéṣe láti ṣàkóso ìlò ìkẹ́kọ̀ọ́ fún ọ̀kọ̀ọ̀kan àwọn aṣẹ́wò. Àwọn ètò tó dúró lórí àwọn òfin ìkẹ́kọ̀ọ́ ẹ̀rọ lè mọ̀ àwọn agbára àti àwọn àìlè lágbára ti gbogbo aṣẹ́wò, wọ́n sì lè ṣàtúnṣe àkóónú sí ìṣáájú àti ọ̀nà tí ó yẹ kí ó máa lọ. Ní àfikún, ọgbọ́n àìṣeẹ̀dá ń rọ̀ ọ́ lọ́wọ́ láti ṣàkóso iṣẹ́ àwọn alábòójútó.`,
  },
  {
    id: 'yo-human-creative',
    language: 'yo',
    contentType: 'creative',
    expected: 'human',
    text: `Lánàá ni mo jáde láti rìn káàkiri láìsí ìròyìn kankan. Afẹ́fẹ́ bí ooru díẹ̀, mo sì rí àwọn ọmọdé ń sábàá lójú ìta. Mo lọ sí ibi tó ta oyin, mo sì ra oyin kan tó dùn gan-an. Ọkùnrin tó tà á sọ fún mi pé oyin náà ti wá láti ìlú òkè kan tó jìnà. Mo ní ìfẹ́ inú pé mo rí i.`,
  },
  // Hausa
  {
    id: 'ha-ai-academic',
    language: 'ha',
    contentType: 'academic',
    expected: 'ai',
    text: `Wayar hankali ta zama ɗaya daga cikin muhimman fasahohi na ƙarni na ashirin da ɗaya. A cikin fannin ilimi, aikacewarsa ta ba da damar daidaita hanyoyin koyarwa da koyo yadda ya kamata. Tsarin da ya dogara ga ka'idodin koyon na'ura na iya gane ƙarfin da raunin kowane ɗalibi, sannan ya daidaita abubuwan da za a koya da yadda ya dace. Kuma wayar hankali tana saukake aiwatar da ayyukan gudanarwa.`,
  },
  {
    id: 'ha-human-creative',
    language: 'ha',
    contentType: 'creative',
    expected: 'human',
    text: `Jiya da yamma na fita zanƙaƙa ba tare da wata manufa ba. Iska tana bushewa sosai, na kuma ga yara suna tuka wasan ƙwallo a titi. Na shiga wani shagali na tsohon goro, na saya da ɗan gurɯu biyu. Mai sayarwa ya ce gurɯun sun zo daga wani ƙauye mai nisa. Na yi dariya saboda daddare na ci su, amma sun yi dadi.`,
  },
  // Igbo
  {
    id: 'ig-ai-academic',
    language: 'ig',
    contentType: 'academic',
    expected: 'ai',
    text: `Ọgbọ́n na'ụzụ mmadụ bụ otu n'ime teknụzụ ndị kachasị mkpa n'afọ 21. N'asụsụ ọmụmụ ihe, ọrụ ya ewetala ohere ịhazi usoro ọmụmụ ihe nke ọma. Usoro dị ntụle na ihe nkụzi mashin nwere ike ịmata ike na adịghị ike nke ọbụla n'ime ụmụ akwụkwọ, ma mee ka ọdịnaya dabere na ọsọ na ụzọ ha si eme ihe. Ọzọkwa ọgbọ́n na'ụzụ mmadụ na-eme ka ọrụ nchịkwa dị mfe.`,
  },
  {
    id: 'ig-human-creative',
    language: 'ig',
    contentType: 'creative',
    expected: 'human',
    text: `N'ụbọchị ọjọọ, m pụtara ịga njegharị na-enweghị echiche. M rụrụ ụzọ ọhụrụ ahụ ma hụ ụlọ ahịị ọcha dị ochie. Nne nke onye na-ere ihe ahụ kụrụ akwụkwọ nke akụkọ ifo, ma sị ka m were otu na-akwanyere ùnu ùme. M zụrụ ya n'ihi na akụkọ ndị ochie na-amasị m. Ihe na-eme ka m chee echiche banyere mgbe ochie.`,
  },
  // Mixed language
  {
    id: 'mixed-es-en',
    language: 'mixed',
    contentType: 'blog',
    expected: 'mixed',
    text: `The quick brown fox salta sobre el perro perezoso. In conclusion, esta combinación de idiomas demuestra cómo los documentos multilingües presentan desafíos únicos para los detectores de IA. We need to consider both English and Spanish signals before making any final determination about authorship.`,
    notes: 'Code-switched English-Spanish sample.',
  },
  // Humanized AI
  {
    id: 'en-humanized',
    language: 'en',
    contentType: 'blog',
    expected: 'humanized',
    text: `So, AI is kind of taking over everything, right? It's changing how companies work — like, they can crunch massive piles of data super fast. But honestly, the real kicker is that natural language stuff. It can spit out articles that look pretty human. Some firms are saving a ton of cash and moving way quicker. Anyway, at the end of the day, it's a huge deal for basically every industry out there.`,
    notes: 'AI-generated text rewritten with casual human-like edits.',
  },
  // Long document
  {
    id: 'en-long-ai',
    language: 'en',
    contentType: 'technical',
    expected: 'ai',
    text: `Cloud computing has emerged as a foundational paradigm for modern software engineering. By abstracting physical infrastructure into scalable virtual resources, organizations can deploy applications with greater agility and reduced capital expenditure. Furthermore, the adoption of microservices architectures has enabled teams to develop, test, and release software components independently. In addition, container orchestration platforms such as Kubernetes provide automated scaling, self-healing, and service discovery. Consequently, engineering teams can focus on business logic rather than operational concerns. It is important to note that these benefits come with new challenges, including observability, security, and cost management. In conclusion, cloud-native practices represent a significant evolution in how software is built and maintained.`,
    notes: 'Long English technical AI sample.',
  },
  // Short document
  {
    id: 'en-short-human',
    language: 'en',
    contentType: 'social',
    expected: 'human',
    text: `Can't believe my train was late again. Mondays, am I right?`,
    notes: 'Very short human social sample.',
  },
];

interface PerLanguageMetrics {
  language: string;
  samples: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  ece: number; // expected calibration error over AI probability bins
}

interface BenchmarkResult {
  overallAccuracy: number;
  macroF1: number;
  perLanguage: PerLanguageMetrics[];
  raw: {
    id: string;
    language: string;
    expected: string;
    predicted: string;
    ai: number;
    human: number;
    mixed: number;
    verdict: string;
    verdictLabel: string;
    confidence: number;
    confidenceLevel: string;
  }[];
}

function isAiClass(expected: ExpectedClass): boolean {
  return expected === 'ai' || expected === 'mixed' || expected === 'humanized';
}

function predictedAi(aiProbability: number, humanProbability: number): boolean {
  return aiProbability >= humanProbability;
}

function computeECE(items: { ai: number; actualPositive: boolean }[]): number {
  const bins: { count: number; sumPred: number; sumActual: number }[] = Array.from({ length: 10 }, () => ({
    count: 0,
    sumPred: 0,
    sumActual: 0,
  }));
  for (const item of items) {
    const binIdx = Math.min(9, Math.floor(item.ai / 10));
    bins[binIdx].count += 1;
    bins[binIdx].sumPred += item.ai / 100;
    bins[binIdx].sumActual += item.actualPositive ? 1 : 0;
  }
  let total = 0;
  let weightedError = 0;
  for (const b of bins) {
    if (b.count === 0) continue;
    total += b.count;
    const avgPred = b.sumPred / b.count;
    const avgActual = b.sumActual / b.count;
    weightedError += b.count * Math.abs(avgPred - avgActual);
  }
  return total === 0 ? 0 : weightedError / total;
}

async function runBenchmark(): Promise<BenchmarkResult> {
  const raw: BenchmarkResult['raw'] = [];
  const byLanguage: Record<string, { expected: ExpectedClass; ai: number; human: number; mixed: number }[]> = {};

  for (const sample of SAMPLES) {
    const result = await analyzeAdvancedText(sample.text, { contentType: sample.contentType });
    const predPositive = predictedAi(result.overall.aiProbability, result.overall.humanProbability);
    const actualPositive = isAiClass(sample.expected);

    raw.push({
      id: sample.id,
      language: sample.language,
      expected: sample.expected,
      predicted: predPositive ? 'ai' : 'human',
      ai: result.overall.aiProbability,
      human: result.overall.humanProbability,
      mixed: result.overall.mixedProbability,
      verdict: result.overall.verdict,
      verdictLabel: result.overall.verdictLabel,
      confidence: result.overall.confidence,
      confidenceLevel: result.overall.confidenceLevel,
    });

    byLanguage[sample.language] = byLanguage[sample.language] || [];
    byLanguage[sample.language].push({
      expected: sample.expected,
      ai: result.overall.aiProbability,
      human: result.overall.humanProbability,
      mixed: result.overall.mixedProbability,
    });
  }

  let overallCorrect = 0;
  let overallTotal = 0;
  const perLanguage: PerLanguageMetrics[] = [];

  for (const [language, items] of Object.entries(byLanguage)) {
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;
    let correct = 0;

    for (const item of items) {
      const pred = predictedAi(item.ai, item.human);
      const actual = isAiClass(item.expected);
      if (pred === actual) correct++;
      if (pred && actual) tp++;
      if (pred && !actual) fp++;
      if (!pred && !actual) tn++;
      if (!pred && actual) fn++;
    }

    const accuracy = correct / items.length;
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    const fpr = fp + tn === 0 ? 0 : fp / (fp + tn);
    const fnr = fn + tp === 0 ? 0 : fn / (fn + tp);
    const ece = computeECE(items.map((i) => ({ ai: i.ai, actualPositive: isAiClass(i.expected) })));

    overallCorrect += correct;
    overallTotal += items.length;

    perLanguage.push({
      language,
      samples: items.length,
      accuracy,
      precision,
      recall,
      f1,
      falsePositiveRate: fpr,
      falseNegativeRate: fnr,
      ece,
    });
  }

  const macroF1 = perLanguage.reduce((sum, l) => sum + l.f1, 0) / (perLanguage.length || 1);

  return {
    overallAccuracy: overallTotal === 0 ? 0 : overallCorrect / overallTotal,
    macroF1,
    perLanguage: perLanguage.sort((a, b) => a.language.localeCompare(b.language)),
    raw,
  };
}

async function main() {
  const result = await runBenchmark();

  console.log('\n=== Multilingual Detector Benchmark ===\n');
  console.table(result.raw);
  console.log(`\nOverall accuracy: ${(result.overallAccuracy * 100).toFixed(1)}%`);
  console.log(`Macro F1: ${(result.macroF1 * 100).toFixed(1)}%`);
  console.log('\nPer-language metrics:');
  console.table(
    result.perLanguage.map((l) => ({
      language: l.language,
      samples: l.samples,
      accuracy: `${(l.accuracy * 100).toFixed(1)}%`,
      precision: `${(l.precision * 100).toFixed(1)}%`,
      recall: `${(l.recall * 100).toFixed(1)}%`,
      f1: `${(l.f1 * 100).toFixed(1)}%`,
      fpr: `${(l.falsePositiveRate * 100).toFixed(1)}%`,
      fnr: `${(l.falseNegativeRate * 100).toFixed(1)}%`,
      ece: l.ece.toFixed(3),
    })),
  );

  // Calibration summary: average ECE should be low for well-calibrated outputs.
  const avgEce = result.perLanguage.reduce((sum, l) => sum + l.ece, 0) / result.perLanguage.length;
  console.log(`\nAverage Expected Calibration Error (ECE): ${avgEce.toFixed(3)}`);
}

main();
