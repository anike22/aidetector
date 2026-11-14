// Shared data and types for AIDetector.cx

import { articleContentHtml, faqData } from './articles/can-universities-detect-chatgpt';
import { AI_DIRECTORY_PRODUCTS } from './aiDirectoryData';

export interface AiTool {
  id: string;
  name: string;
  category: string;
  description: string;
  rating?: number;
  reviewCount?: number;
  pricing: string;
  pricingType: 'free' | 'freemium' | 'paid';
  logo: string;
  tags: string[];
  url: string;
  featured?: boolean;
}

export type ContentHub = 'guides' | 'research' | 'comparisons' | 'blog';

export interface BlogPostFaqItem {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  slug?: string;
  hub: ContentHub;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  image?: string | null;
  featured?: boolean;
  content?: string;
  contentHtml?: string;
  faq?: BlogPostFaqItem[];
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  category: string;
  replies: number;
  views: number;
  lastActivity: string;
  reputation: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  creator: string;
  creatorAvatar: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  badge?: string;
}

export const AI_TOOLS: AiTool[] = AI_DIRECTORY_PRODUCTS.map(product => {
  const pricingTypeLower = (
    product.pricingModel.toLowerCase().includes('free') && !product.pricingModel.toLowerCase().includes('trial')
      ? (product.pricingModel === 'Free' ? 'free' : 'freemium')
      : (product.hasFreePlan ? 'freemium' : 'paid')
  ) as 'free' | 'freemium' | 'paid';

  return {
    id: product.id,
    name: product.name,
    category: product.primaryCategory,
    description: product.summary || product.description,
    rating: product.editorialAssessment?.rating,
    reviewCount: product.verifiedReviews?.length,
    pricing: product.pricingSummary,
    pricingType: pricingTypeLower,
    logo: product.logo,
    tags: product.tags,
    url: `/tools/${product.id}`,
    featured: product.featured,
  };
});

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'can-turnitin-detect-chatgpt',
    hub: 'guides',
    title: 'Can Turnitin Detect ChatGPT? What Students and Educators Need to Know in 2026',
    excerpt: 'Understand what Turnitin’s AI Writing Report can flag, what its percentage means, the 20% threshold, file and language requirements, and why a score is not proof of misconduct.',
    category: 'AI Detection',
    author: 'AIDetector.cx Editorial Team',
    authorAvatar: '🎓',
    date: 'November 14, 2026',
    readTime: '10–12 min read',
    featured: false,
  },
  {
    id: 'understanding-ai-detection-scores',
    hub: 'guides',
    title: 'What Do AI Detection Scores Actually Mean?',
    excerpt: 'Understand what AI detection percentages measure, how probability differs from flagged text and detector accuracy, why scores vary, and how to interpret results responsibly.',
    category: 'AI Detection',
    author: 'AIDetector.cx Editorial Team',
    authorAvatar: '🔍',
    date: 'September 11, 2026',
    readTime: '26 min read',
    featured: false,
    content: "# What Do AI Detection Scores Actually Mean?\n\nAn AI detector reports **78% AI**.\n\nWhat does that number actually mean?\n\nDoes it mean 78% of the document was written by artificial intelligence? Does it mean there is a 78% chance ChatGPT wrote it? Does it mean 78% of the words are AI-generated? Or does it mean the detector is 78% accurate?\n\nPotentially, **none of those interpretations is correct**.\n\nAI detection scores are among the most misunderstood measurements in generative-AI detection. Different detectors calculate and present their scores differently, yet users frequently treat percentages from different systems as though they measure the same thing.\n\nThey do not necessarily do so.\n\nA score such as **10%, 45%, 80%, or 99% AI** only becomes meaningful when you understand what the detector is measuring, how its score is calibrated, what classification thresholds it uses, and how much uncertainty surrounds the result.\n\nThe most important principle is simple:\n\n> **An AI detection score is a measurement produced by a detection system. It is not automatically a measurement of how much of a document was written by AI.**\n\nThis guide explains what AI detection scores can mean, what they cannot establish, how probabilities differ from percentages of flagged text, why two detectors can produce radically different scores, and how students, educators, publishers, businesses, and researchers should interpret results responsibly.\n\n---\n\n## What Is an AI Detection Score?\n\nAn AI detection score is a numerical or categorical output produced after a detection system analyzes text for characteristics associated with machine-generated and human-written content.\n\nDepending on the detector, the result might appear as:\n\n- **82% AI**\n- **18% Human**\n- **Likely AI**\n- **Likely Human**\n- **Mixed**\n- **High AI probability**\n- **Medium risk**\n- **AI-generated**\n- **Human-generated**\n\nThese labels may look straightforward, but the underlying mathematics can be very different.\n\nOne detector's **80% AI** might represent a calibrated document-level probability.\n\nAnother detector's **80%** might indicate that 80% of analyzed segments crossed an internal AI threshold.\n\nA third system might transform a raw classifier score into a percentage for easier presentation.\n\nConsequently:\n\n> **80% from Detector A is not necessarily equivalent to 80% from Detector B.**\n\nBefore interpreting any score, you need to know what that particular detector means by it.\n\n---\n\n# The Four Measurements People Commonly Confuse\n\nMuch of the confusion surrounding AI detection comes from treating several different concepts as interchangeable.\n\nThey are not.\n\n## 1. AI Probability\n\nA detector may estimate how strongly the analyzed text belongs to an AI-generated class.\n\nConceptually, the detector might calculate:\n\n**P(AI | observed text features)**\n\nThis represents a model-based estimate conditioned on the evidence available to the detector.\n\nIf properly calibrated, a probability-like score can help express how strongly the evidence supports one classification over another.\n\nBut even then, it does **not** automatically mean that the corresponding percentage of words was written by AI.\n\n---\n\n## 2. Percentage of Text Flagged\n\nSome systems divide a document into sentences, passages, or other segments and classify those sections individually.\n\nImagine a 20-sentence document.\n\nIf 12 sentences exceed the detector's AI threshold, a system might report something resembling:\n\n**60% AI-detected content**\n\nThat is fundamentally different from saying:\n\n**There is a 60% probability that the entire document was generated by AI.**\n\nThe first describes the proportion of analyzed units that were flagged.\n\nThe second describes a document-level probability.\n\nBoth may be represented with a percentage sign, which is precisely why users can confuse them.\n\n---\n\n## 3. Confidence\n\nClassifier confidence describes how strongly a model favors a prediction under its internal scoring system.\n\nConfidence is not automatically the same as real-world probability.\n\nA poorly calibrated model can be extremely confident and still be wrong.\n\nFor example, a classifier could output:\n\n**99% AI confidence**\n\nfor a human-written passage.\n\nThe size of the number does not guarantee correctness.\n\nThis distinction is critical whenever a detector's result could affect a student, employee, author, applicant, or publisher.\n\n---\n\n## 4. Detector Accuracy\n\nAccuracy describes the performance of a detector across an evaluation dataset.\n\nIt is a property of an **evaluation**, not an individual document.\n\nIf a detector achieved 95% accuracy under a particular benchmark, that does not mean:\n\n> “Every document receiving 95% AI has a 95% chance of being AI-generated.”\n\nThese are entirely different measurements.\n\nA detector can perform well overall while still making individual false-positive and false-negative errors.\n\n---\n\n# What Does “80% AI” Actually Mean?\n\nThere is no universal answer.\n\nThat is one of the most important facts to understand about AI detection.\n\nThe meaning depends on the detector.\n\nAn **80% AI score** could theoretically mean:\n\n- the classifier assigns strong AI probability to the document;\n- 80% of analyzed sections were classified as AI-like;\n- the text received a normalized score of 0.80;\n- an ensemble of detection signals produced a high-risk result;\n- the detector transformed an internal score into a user-facing percentage.\n\nIt does **not automatically mean**:\n\n> “AI wrote 80% of this essay.”\n\nNor does it automatically mean:\n\n> “There is exactly an 80% chance ChatGPT wrote this.”\n\nAnd it certainly does not mean:\n\n> “The detector is 80% accurate.”\n\nBefore acting on a score, determine which quantity the system actually reports.\n\n---\n\n# AI Probability vs Percentage of AI-Written Text\n\nThis distinction deserves special attention.\n\nSuppose an essay contains 1,000 words and receives:\n\n**AI probability: 75%**\n\nThat does not necessarily mean AI generated 750 words.\n\nProbability and proportion are different mathematical concepts.\n\nConsider a weather forecast.\n\nIf there is a **75% probability of rain**, that does not mean rain will fall over exactly 75% of your house.\n\nLikewise, a document-level AI probability does not tell you what percentage of individual words originated from a machine.\n\nThis becomes especially important with mixed-authorship documents.\n\nA student might write an essay personally but use an AI assistant to rewrite two paragraphs.\n\nAnother author might begin with an AI-generated draft and completely rewrite most of it.\n\nA third might use AI only for an outline.\n\nReducing these very different workflows to a single percentage can create a false impression of precision.\n\n---\n\n# A Simple Example\n\nImagine three documents.\n\n### Document A\n\nWritten entirely by a person.\n\nDetector result:\n\n**12% AI**\n\nThis does not mean AI wrote 12% of the document.\n\nIt may simply mean that the human writing contains some patterns the detector associates with machine-generated text.\n\n### Document B\n\nGenerated entirely by an AI model.\n\nDetector result:\n\n**91% AI**\n\nThis represents strong machine-generation evidence under that detector.\n\nIt does not necessarily mean 91% of the words are AI-generated while 9% are human.\n\n### Document C\n\nHuman-written introduction, AI-assisted middle section, heavily edited conclusion.\n\nDetector result:\n\n**54% AI / Mixed**\n\nHere, the score might reflect conflicting signals across the document.\n\nWithout segment-level analysis and knowledge of the detector's scoring methodology, it would be inappropriate to conclude:\n\n> “AI wrote exactly 54% of this document.”\n\nThe number is evidence produced by the model—not a forensic reconstruction of the writing process.\n\n---\n\n# What Does 0% AI Mean?\n\nUsers frequently assume that **0% AI** proves a document was written entirely by a human.\n\nThat conclusion is too strong.\n\nA zero or extremely low AI score means the detector found little evidence, according to its methodology, supporting machine generation.\n\nIt does not establish authorship independently.\n\nAn AI-generated passage could potentially receive a low score because:\n\n- it was heavily edited;\n- it was paraphrased;\n- it is too short;\n- it differs from the detector's training distribution;\n- the generating model is difficult for that detector to recognize;\n- the detector simply made a false-negative error.\n\nTherefore:\n\n> **0% AI should not be interpreted as a cryptographic certificate of human authorship.**\n\nDetection and authorship verification are different problems.\n\n---\n\n# What Does 100% AI Mean?\n\nThe opposite mistake occurs at the upper end.\n\nA result of **100% AI**, **99% AI**, or **Highly Likely AI** indicates that the detector found extremely strong machine-associated evidence under its scoring system.\n\nIt still does not provide absolute proof.\n\nWhy?\n\nBecause classifiers can produce false positives.\n\nA model may encounter human writing that closely resembles patterns learned from machine-generated training samples.\n\nExtremely high confidence can make an error look more convincing, but it does not make errors mathematically impossible.\n\nHigh scores deserve attention.\n\nThey do not eliminate the need for interpretation.\n\n---\n\n# Is 10% AI Bad?\n\nNot necessarily.\n\nA 10% AI score may simply represent weak machine-associated evidence.\n\nWhether it matters depends on:\n\n- what the detector measures;\n- the document length;\n- which sections were flagged;\n- whether AI use is permitted;\n- the applicable institutional or workplace policy;\n- whether the score is stable when more text is analyzed;\n- the detector's false-positive behavior.\n\nThere is no universal rule stating that **10% AI means misconduct**.\n\nA low score should not automatically be converted into an accusation.\n\n---\n\n# Is 20% AI Bad?\n\nAgain, there is no universal threshold.\n\nA **20% AI score** might represent weak-to-moderate evidence in one detector while another system might interpret the same underlying patterns differently.\n\nFor students especially, the relevant question is not:\n\n> “Is 20% universally allowed?”\n\nThe better questions are:\n\n> “What does this detector's 20% represent?”\n\nand:\n\n> “What does my institution's AI-use policy actually permit?”\n\nThose questions cannot be answered from the percentage alone.\n\n---\n\n# Is 30% AI Bad?\n\nA 30% result deserves interpretation rather than panic.\n\nAt this range, possibilities might include:\n\n- genuine mixed human/AI writing;\n- human writing with highly predictable structures;\n- AI-assisted editing;\n- a false positive;\n- inconsistent patterns across the document;\n- an AI-generated section embedded in human writing.\n\nA responsible detector should help users investigate **where the evidence appears**, rather than treating the number as self-explanatory.\n\n---\n\n# Is 50% AI Bad?\n\nA score around 50% can be particularly easy to misunderstand.\n\nPeople often interpret it as:\n\n> “Half of the document was written by AI.”\n\nThat may be completely wrong.\n\nFor a probability-based classifier, a result near the middle may instead indicate **uncertainty**.\n\nThe evidence may not strongly favor either classification.\n\nFor a segment-based detector, however, 50% could have an entirely different meaning.\n\nThis demonstrates why a percentage without a methodology is incomplete information.\n\n---\n\n# Is 80% or 90% AI Proof?\n\nNo.\n\nAn 80%, 90%, or 99% result represents strong evidence only within the meaning assigned to that score by the detector.\n\nThe result may justify closer investigation.\n\nIt should not automatically be transformed into:\n\n> “You cheated.”\n\nor:\n\n> “ChatGPT definitely wrote this.”\n\nAI detection identifies patterns.\n\nAcademic misconduct, workplace misconduct, copyright ownership, and authorship are broader factual questions.\n\n---\n\n# Why AI Detection Scores Change\n\nUsers sometimes submit the same document twice after making a few changes and become concerned when the score moves dramatically.\n\nThat can happen because detection models analyze relationships between features.\n\nChanging one paragraph can affect:\n\n- sentence-length distribution;\n- lexical diversity;\n- semantic repetition;\n- predictability;\n- transition patterns;\n- document-level context;\n- segment boundaries;\n- classifier outputs.\n\nTherefore, changing 5% of the words does not guarantee the AI score will change by exactly 5%.\n\nAI detection is generally **nonlinear**.\n\nA score is produced from interacting features, not by counting “AI words.”\n\n---\n\n# Why Adding One Paragraph Can Change the Whole Score\n\nSuppose a 300-word passage is highly regular.\n\nA detector reports:\n\n**76% AI**\n\nYou add a 400-word human-written section containing much greater structural variation.\n\nThe result drops to:\n\n**41% AI**\n\nThat does not necessarily mean the detector changed its opinion about the original sentences.\n\nThe **document-level evidence changed**.\n\nLikewise, adding a long, highly predictable passage to human writing could increase a document-level AI score.\n\nThis is another reason to examine both overall and segment-level results where available.\n\n---\n\n# Why Short Text Produces Less Reliable Scores\n\nConsider:\n\n> “Thank you for contacting me. I look forward to hearing from you.”\n\nDid a person write it?\n\nDid ChatGPT?\n\nThere is insufficient evidence to answer confidently from the text alone.\n\nShort passages contain fewer observations of:\n\n- sentence variation;\n- vocabulary behavior;\n- repetition;\n- syntax;\n- stylistic consistency;\n- predictability;\n- paragraph organization.\n\nAs sample size increases, the detector generally has more evidence to analyze.\n\nTherefore, an extremely confident-looking percentage attached to a tiny passage should be interpreted cautiously.\n\n---\n\n# Why Human Text Can Receive a High AI Score\n\nA high AI score does not require actual AI involvement.\n\nFalse positives can occur when genuine human writing overlaps with characteristics the classifier associates with generated text.\n\nPotentially challenging material includes:\n\n### Academic writing\n\nAcademic prose often follows standardized structures and formal conventions.\n\n### Technical documentation\n\nTechnical instructions may prioritize clarity and consistency over stylistic variation.\n\n### Legal writing\n\nLegal language can be highly formulaic.\n\n### Business communication\n\nProfessional templates and conventional phrasing can increase regularity.\n\n### Non-native writing\n\nWriters working in a second language may rely on familiar vocabulary and grammatical structures.\n\n### Highly edited writing\n\nExtensive grammar correction can make writing more structurally uniform.\n\n### Formulaic assignments\n\nSome tasks naturally produce very similar answers regardless of authorship.\n\nNone of these categories should automatically be treated as AI-generated.\n\n---\n\n# What Is a False Positive?\n\nA **false positive** occurs when human-written content is incorrectly classified as AI-generated.\n\nFor example:\n\n**Actual:** Human\n**Detector:** AI\n\nThat is a false positive.\n\nFalse positives matter because the consequences are not symmetrical in every environment.\n\nFor a casual blogger checking a draft, an incorrect flag may be inconvenient.\n\nFor a student accused of academic misconduct, an incorrect flag can have much more serious consequences.\n\nThis is why a detector should not be evaluated only by how much AI content it catches.\n\nIts ability to correctly recognize **human writing** matters enormously.\n\n---\n\n# What Is a False Negative?\n\nA **false negative** occurs when AI-generated content is incorrectly classified as human.\n\nFor example:\n\n**Actual:** AI\n**Detector:** Human\n\nFalse negatives can happen because of:\n\n- sophisticated newer models;\n- human editing;\n- paraphrasing;\n- translation;\n- short samples;\n- domain shifts;\n- adversarial rewriting;\n- limitations in the detector.\n\nA detector tuned extremely conservatively to minimize false accusations may produce more false negatives.\n\nA highly aggressive detector may catch more AI content but potentially increase false positives.\n\nDetection therefore involves **trade-offs**.\n\n---\n\n# Thresholds: The Hidden Decision Behind the Score\n\nImagine an internal classifier produces values between 0 and 1.\n\nA system might define:\n\n**0.00–0.29 → Likely Human**\n\n**0.30–0.69 → Mixed/Uncertain**\n\n**0.70–1.00 → Likely AI**\n\nThose boundaries are **classification thresholds**.\n\nNow imagine another detector uses:\n\n**0.00–0.49 → Human**\n\n**0.50–1.00 → AI**\n\nThe same underlying score of **0.45** would produce different labels.\n\nDetector A:\n\n**Mixed/Uncertain**\n\nDetector B:\n\n**Human**\n\nNothing about the actual document changed.\n\nThe **decision rule changed**.\n\nThreshold design is therefore an important part of understanding detector behavior.\n\n---\n\n# Balanced vs Aggressive Detection\n\nThresholds also explain why detection systems may offer different sensitivity modes.\n\nA **balanced** configuration may prioritize a practical trade-off between identifying machine-generated text and avoiding unnecessary human false positives.\n\nA more **aggressive** configuration may lower the amount of machine-associated evidence required before flagging content for investigation.\n\nNeither approach is universally correct.\n\nThe appropriate sensitivity depends on the use case.\n\nFor example:\n\n**General writing assessment**\n\nmay benefit from balanced interpretation.\n\n**Investigative content screening**\n\nmay justify greater sensitivity, provided flagged material receives human review.\n\nThe mistake is assuming that a more aggressive detector is automatically more accurate simply because it reports more AI.\n\n---\n\n# How AIDetector.cx Presents AI Detection Risk\n\nAIDetector.cx is designed around an important principle:\n\n> **The score should help users understand the evidence, not replace their judgment.**\n\nThe platform's Balanced and Aggressive detection approaches serve different analytical purposes.\n\n### Balanced\n\nBalanced detection is intended for general-purpose analysis where avoiding unnecessary false positives is particularly important.\n\n### Aggressive\n\nAggressive detection increases sensitivity to subtler machine-associated characteristics and is useful when users want a stricter investigative signal.\n\nA stricter result should not be interpreted as stronger proof simply because the displayed AI score is higher.\n\nIt represents analysis under a different sensitivity profile.\n\nAIDetector.cx also distinguishes risk interpretation from the simplistic assumption that every percentage corresponds directly to the percentage of words generated by AI.\n\nThis distinction becomes particularly important for mixed human/AI documents.\n\n---\n\n# What Does “Mixed” Mean?\n\n“Mixed” can be a useful classification when the available evidence does not justify a clean binary conclusion.\n\nIt can indicate situations such as:\n\n- some sections appear strongly machine-like while others appear human-like;\n- the overall evidence falls between classification thresholds;\n- AI-assisted editing may be present;\n- the document contains inconsistent signals;\n- the detector has insufficient confidence for a stronger classification.\n\nImportantly:\n\n> **Mixed does not necessarily mean the detector has proven that one person and one AI system co-authored the document.**\n\nIt is a classification of the evidence.\n\nThe actual writing history may be more complicated.\n\n---\n\n# Sentence-Level Scores vs Document-Level Scores\n\nSuppose a detector reports:\n\n**Overall AI score: 64%**\n\nand highlights three paragraphs.\n\nUsers should not assume every sentence has a 64% score.\n\nDocument-level analysis can combine information across the entire sample.\n\nSentence-level analysis attempts to localize suspicious patterns.\n\nThese approaches answer different questions:\n\n**Document-level score:**\n\n> What does the overall evidence suggest?\n\n**Segment-level analysis:**\n\n> Where are the strongest AI-associated patterns?\n\nThe second can make the first much more interpretable.\n\nA useful detector should help users understand not merely **how much risk** it detected, but **where the evidence came from**.\n\n---\n\n# Why Two AI Detectors Can Give Completely Different Scores\n\nImagine submitting the same essay to three systems:\n\n| DetectorResult |        |\n| -------------- | ------ |\n| Detector A     | 17% AI |\n| Detector B     | 54% AI |\n| Detector C     | 92% AI |\n\nWhich one is correct?\n\nThe numbers alone cannot answer that question.\n\nThe detectors may differ in:\n\n- training datasets;\n- AI generators included during training;\n- human-writing datasets;\n- feature extraction;\n- model architecture;\n- calibration;\n- classification thresholds;\n- text preprocessing;\n- supported languages;\n- treatment of edited content;\n- sensitivity settings;\n- definition of “AI-generated.”\n\nThis is why averaging scores across unrelated detectors can be misleading.\n\nCalculating:\n\n**(17 + 54 + 92) ÷ 3 = 54.3%**\n\ndoes not magically produce a scientifically superior answer.\n\nYou may simply be averaging three measurements that do not represent the same quantity.\n\n---\n\n# What Is Calibration?\n\nCalibration is one of the most important concepts in interpreting probabilistic classifiers.\n\nSuppose a detector assigns approximately **80% probability** to 1,000 comparable samples.\n\nIf the probability is well calibrated under those conditions, roughly 800 of those cases should belong to the predicted class.\n\nA detector could rank AI text above human text very effectively while still producing poorly calibrated probability values.\n\nThis creates an important distinction between:\n\n**discrimination**\n\nand\n\n**calibration**.\n\nDiscrimination asks:\n\n> Can the detector separate AI and human examples?\n\nCalibration asks:\n\n> Do the probability values correspond appropriately to observed outcomes?\n\nA polished percentage interface does not guarantee good calibration.\n\n---\n\n# AI Score vs AI Detector Accuracy\n\nSuppose a detector advertises:\n\n**95% accuracy**\n\nand your essay receives:\n\n**35% AI**\n\nThese numbers describe different things.\n\n**95% accuracy** refers to performance under some evaluation methodology.\n\n**35% AI** refers to an output for your particular document.\n\nYou cannot multiply, subtract, or otherwise combine them to calculate the “real” probability.\n\nYou should instead examine how the accuracy claim was established.\n\nImportant questions include:\n\n- How many samples were tested?\n- Which AI models generated the machine samples?\n- Which human populations were represented?\n- Which languages were tested?\n- Were the samples edited?\n- Were short and long documents included?\n- Was the evaluation independent?\n- What was the false-positive rate?\n- What was the false-negative rate?\n- Were results reported by generator and domain?\n\nWithout this information, an impressive accuracy percentage provides limited insight.\n\n---\n\n# Why “99% Accurate” Is Not Enough\n\nImagine a detector tested on:\n\n**9,900 human documents**\n\nand\n\n**100 AI documents**.\n\nA classifier that labels every document “human” would correctly classify 9,900 out of 10,000 samples.\n\nThat equals:\n\n**99% accuracy.**\n\nYet it would detect **zero AI documents**.\n\nThis example demonstrates why overall accuracy can be misleading when classes are imbalanced.\n\nBetter evaluation should consider metrics such as:\n\n- precision;\n- recall;\n- sensitivity;\n- specificity;\n- false-positive rate;\n- false-negative rate;\n- F1 score;\n- ROC curves;\n- AUC.\n\nNo single metric tells the entire story.\n\n---\n\n# Understanding False-Positive Rate\n\nSuppose a detector analyzes 10,000 genuinely human essays.\n\nIt incorrectly flags 200 as AI.\n\nIts false-positive rate in that test is:\n\n**200 ÷ 10,000 = 2%**\n\nThat may sound small.\n\nBut if a university applies the system to 100,000 human assignments under comparable conditions, even a low false-positive rate could produce a substantial number of incorrect flags.\n\nThis illustrates a critical principle:\n\n> **Small error rates can matter enormously when detection is deployed at scale.**\n\nThat is why institutional users should understand the operating characteristics of a detector rather than relying on headline accuracy alone.\n\n---\n\n# Base Rates: The Missing Piece in Many AI-Score Discussions\n\nImagine a detector is used in two environments.\n\n### Environment A\n\nAI-generated submissions are extremely common.\n\n### Environment B\n\nAI-generated submissions are extremely rare.\n\nEven if the detector's technical performance remains identical, the meaning of a positive result can differ because the **base rate** of AI use differs.\n\nThis is a classic statistical problem.\n\nThe probability that a flagged document is genuinely AI-generated depends not only on detector sensitivity and specificity but also on how common AI-generated content is in the population being tested.\n\nThis is one reason an isolated detector score should not automatically determine a high-stakes outcome.\n\nContext matters.\n\n---\n\n# Should Students Worry About an AI Detection Percentage?\n\nStudents should understand the result, but a percentage alone should not cause panic.\n\nAsk four questions.\n\n### What does the percentage measure?\n\nIs it probability, confidence, flagged-text proportion, or something else?\n\n### Where is the evidence?\n\nIs one paragraph responsible for most of the result, or is the pattern distributed throughout the document?\n\n### What does the institution's policy say?\n\nAI-use policies vary significantly.\n\n### What evidence exists about the writing process?\n\nDrafts, version history, research notes, citations, outlines, and earlier writing can provide useful context.\n\nA detector result should be interpreted alongside this evidence.\n\n---\n\n# What Should Teachers Do With AI Detection Scores?\n\nTeachers should avoid treating a score as an automated misconduct decision.\n\nA better workflow is:\n\n**Detection result**\n\n↓\n\n**Review flagged sections**\n\n↓\n\n**Examine assignment context**\n\n↓\n\n**Check sources and citations**\n\n↓\n\n**Review drafts or revision history where appropriate**\n\n↓\n\n**Discuss the work with the student**\n\n↓\n\n**Apply institutional policy**\n\nThis preserves the detector's useful role without asking it to answer questions it was never designed to answer.\n\n---\n\n# What Should Publishers and Editors Do With AI Scores?\n\nPublishers face a different problem.\n\nThey may need to screen:\n\n- freelance submissions;\n- guest posts;\n- product descriptions;\n- news contributions;\n- user-generated content;\n- outsourced SEO content.\n\nFor these users, AI detection works best as part of a **risk-screening workflow**.\n\nA high-risk result can trigger:\n\n- editorial review;\n- source verification;\n- plagiarism checking;\n- citation validation;\n- author questions;\n- revision-history requests.\n\nThe objective should not necessarily be to ban all AI assistance.\n\nThe objective is to enforce the publication's actual editorial standards.\n\n---\n\n# What Should Businesses Do With AI Detection Scores?\n\nBusinesses should define the decision before choosing a threshold.\n\nFor example:\n\n**Use case:** Identify potentially automated customer reviews.\n\nThat may justify high sensitivity.\n\n**Use case:** Accuse an employee of violating policy.\n\nThat requires much stronger procedural safeguards.\n\n**Use case:** Screen thousands of marketplace submissions.\\*\\*\n\nA risk-ranking system may be more appropriate than binary classification.\n\nThe consequences of an error should influence how aggressively the score is used.\n\n---\n\n# Can AI Scores Tell Which Model Wrote the Text?\n\nUsually, a general AI score cannot establish whether content came specifically from:\n\n- ChatGPT;\n- GPT-family models;\n- Claude;\n- Gemini;\n- Llama;\n- another language model.\n\nDetermining that text appears machine-generated and attributing it to a particular model are different tasks.\n\nModel attribution is generally more difficult because modern language models can produce overlapping linguistic distributions.\n\nHeavy editing makes attribution even harder.\n\nTherefore:\n\n> **“Likely AI-generated” should not automatically become “written by ChatGPT.”**\n\n---\n\n# Can Grammar Tools Increase an AI Score?\n\nPotentially, depending on the amount and type of editing.\n\nA grammar tool that corrects a few spelling mistakes is different from a system that rewrites entire paragraphs.\n\nExtensive rewriting may alter:\n\n- syntax;\n- sentence lengths;\n- lexical choices;\n- predictability;\n- transitions;\n- stylistic variation.\n\nThose changes can affect detector features.\n\nHowever, a changed score does not reveal precisely which tool was used.\n\nThe detector observes the final text, not necessarily the complete editing history.\n\n---\n\n# Can Paraphrasing Change an AI Score?\n\nYes.\n\nParaphrasing can alter many characteristics used by AI detectors.\n\nA paraphraser may change:\n\n- word choice;\n- sentence structure;\n- phrase frequency;\n- predictability;\n- syntax;\n- rhythm.\n\nThis can lower, raise, or otherwise change a detector's result.\n\nTherefore, an AI score should not be interpreted as an immutable property of the underlying idea.\n\nIt is a measurement of the **specific text presented to the detector**.\n\n---\n\n# Can Human Editing Lower an AI Score?\n\nYes, substantial human rewriting can change the statistical characteristics of AI-generated material.\n\nBut that introduces a deeper authorship question.\n\nSuppose AI creates a draft and a human completely restructures it, verifies the sources, replaces examples, changes arguments, and rewrites every paragraph.\n\nWhat percentage was “written by AI”?\n\nThere may be no scientifically defensible single percentage.\n\nAuthorship is a process.\n\nText detection analyzes an artifact produced by that process.\n\nThose concepts should not be confused.\n\n---\n\n# What AI Detection Scores Cannot Tell You\n\nAn AI score generally cannot independently tell you:\n\n- who physically typed the text;\n- which person owns the work;\n- whether ChatGPT specifically generated it;\n- what prompt was used;\n- whether AI use violated a policy;\n- whether an author cheated;\n- whether a document is factually correct;\n- whether sources are genuine;\n- whether content is plagiarized;\n- whether the author owns the copyright;\n- exactly what percentage of intellectual contribution came from AI.\n\nSome of these questions require entirely different tools.\n\nPlagiarism detection investigates source overlap.\n\nCitation verification investigates references.\n\nAuthorship verification investigates provenance.\n\nFact-checking investigates truth.\n\nAI detection investigates evidence of machine generation.\n\n---\n\n# How to Interpret an AI Detection Result Correctly\n\nBefore acting on any score, use this framework.\n\n## Step 1: Identify the Measurement\n\nDetermine what the displayed percentage actually represents.\n\n## Step 2: Check the Sample\n\nExtremely short text provides limited evidence.\n\n## Step 3: Examine the Classification\n\nIs the system saying Likely Human, Mixed, or Likely AI?\n\n## Step 4: Review Local Evidence\n\nLook at the sentences or passages contributing most strongly to the result.\n\n## Step 5: Consider Alternative Explanations\n\nCould formal style, templates, editing, translation, technical language, or another factor explain the pattern?\n\n## Step 6: Consider the Consequences\n\nA low-stakes content review requires a different evidentiary standard from an academic misconduct investigation.\n\n## Step 7: Seek Supporting Evidence\n\nFor high-stakes decisions, combine detection with relevant contextual evidence.\n\nThis approach turns an AI detector from an **automated judge** into what it is better suited to be:\n\n**an analytical instrument.**\n\n---\n\n# AI Detection Score Interpretation Table\n\n| ResultReasonable InterpretationWhat You Should Not Assume |                                                 |                                     |\n| --------------------------------------------------------- | ----------------------------------------------- | ----------------------------------- |\n| Very low AI signal                                        | Little machine-generation evidence detected     | Guaranteed human authorship         |\n| Low AI signal                                             | Some weak AI-associated patterns may exist      | AI definitely wrote that percentage |\n| Mixed/uncertain                                           | Evidence is conflicting or intermediate         | Exactly half human and half AI      |\n| High AI signal                                            | Strong machine-associated evidence detected     | Proven ChatGPT use                  |\n| Very high AI signal                                       | Very strong evidence under the detector's model | Absolute proof of misconduct        |\n\nExact boundaries depend on the individual detector.\n\nThe purpose of this table is interpretation—not establishment of universal percentage thresholds.\n\n---\n\n# Frequently Asked Questions About AI Detection Scores\n\n## What does an AI detection percentage mean?\n\nIt depends on the detector. It may represent a document-level probability, classifier confidence, normalized score, proportion of flagged segments, or another proprietary measurement.\n\n## Does 80% AI mean 80% of the text was written by AI?\n\nNot necessarily. A probability score and a percentage of text classified as AI are different measurements.\n\n## Is 0% AI proof that a person wrote the text?\n\nNo. It means the detector found little or no machine-generation evidence according to its methodology. False negatives remain possible.\n\n## Is 100% AI proof that ChatGPT wrote the document?\n\nNo. Extremely high scores represent strong evidence under the detector but do not independently prove authorship or identify ChatGPT specifically.\n\n## What AI percentage is acceptable?\n\nThere is no universal acceptable AI percentage. Schools, universities, employers, publishers, and other organizations establish their own policies regarding AI assistance.\n\n## Is 20% AI detection bad?\n\nNot inherently. You first need to understand what the percentage represents, which sections contributed to it, and what policy applies.\n\n## Is 50% AI detection bad?\n\nA result around 50% may indicate uncertainty, mixed signals, or a proportion of flagged sections depending on the detector. It does not automatically mean half the document was AI-written.\n\n## Is 90% AI detection accurate?\n\nThe size of the score does not tell you the detector's overall accuracy. Score interpretation and benchmark accuracy are separate concepts.\n\n## Why does my AI score change between detectors?\n\nDifferent detectors use different training data, models, features, thresholds, calibration methods, and definitions of AI-generated text.\n\n## Why did my AI score change after editing?\n\nEditing changes linguistic and statistical characteristics of the analyzed text. Because detector features interact, even relatively small revisions can sometimes produce substantial score changes.\n\n## Can a human-written essay score high for AI?\n\nYes. False positives are possible, particularly with formal, predictable, technical, standardized, or otherwise highly regular writing.\n\n## Can AI-generated text receive a low score?\n\nYes. False negatives can occur, especially after extensive editing, paraphrasing, translation, or when newer generators differ from the detector's training distribution.\n\n## Can an AI detector prove cheating?\n\nNo. A detector analyzes textual characteristics. Determining misconduct requires additional evidence and application of the relevant rules or policies.\n\n## Should teachers trust AI detector scores?\n\nThey can use detection as one source of evidence, but high-stakes decisions should include contextual review rather than relying exclusively on a percentage.\n\n---\n\n# The Bottom Line: An AI Score Is Evidence, Not Authorship\n\nThe most important thing to remember about AI detection percentages is remarkably simple:\n\n> **The number is only meaningful when you understand what the number measures.**\n\nA **70% AI probability** is not necessarily the same thing as **70% of sentences flagged**.\n\nNeither means the detector itself is **70% accurate**.\n\nAnd none automatically means:\n\n> “ChatGPT wrote 70% of this document.”\n\nAI detection scores are outputs from statistical classification systems operating under uncertainty.\n\nThey can provide useful evidence.\n\nThey can help identify documents requiring closer examination.\n\nThey can help publishers screen large volumes of content, students understand detection risk, educators investigate suspicious submissions, and businesses incorporate content analysis into larger workflows.\n\nBut the score must be interpreted in context.\n\nThe future of responsible AI detection should therefore move beyond the question:\n\n> **“What percentage AI is this?”**\n\ntoward better questions:\n\n> **What does this score measure?**\n\n> **Which evidence produced it?**\n\n> **How uncertain is the classification?**\n\n> **What is the detector's false-positive behavior?**\n\n> **What alternative explanations exist?**\n\n> **And is the evidence strong enough for the decision being made?**\n\nThat is the difference between merely displaying an AI percentage and actually understanding an AI detection result.",
  },
  {
    id: 'best-practices-for-educators',
    hub: 'guides',
    title: 'Best Practices for Educators: AI Detection, Academic Integrity and Responsible AI Use',
    excerpt: 'A practical guide for teachers on fair AI detection, comparing Turnitin, GPTZero, Copyleaks and other tools, setting classroom AI policies, protecting student privacy and designing assessments that support genuine learning.',
    category: 'Education & AI Integrity',
    author: 'AIDetector.cx Editorial Team',
    authorAvatar: '🎓',
    date: 'November 5, 2026',
    readTime: '16 min read',
    image: '/images/educator-ai-integrity.svg',
    featured: true,
  },

  {
    id: 'can-universities-detect-chatgpt',
    hub: 'guides',
    title: 'Can Universities Detect ChatGPT? Complete 2026 Guide',
    excerpt: 'Universities do not detect ChatGPT directly. Learn how AI detectors, stylometry, draft history, citations, and human judgment are used, what the limits are, and how to use AI responsibly in academic work.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🎓',
    date: 'August 1, 2026',
    readTime: '24 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2725f082-7956-4e46-9f29-42f125b920fe.jpg',
    featured: true,
    contentHtml: articleContentHtml,
    faq: faqData,
  },
  {
    id: 'best-ai-detector',
    hub: 'guides',
    title: 'Best AI Detector in 2026: Definitive Comparison',
    excerpt: 'We tested AIDetector.cx, GPTZero, Originality.ai, Copyleaks, Winston AI, and ZeroGPT against GPT-5.5 and Gemini. See which detector wins for SEO, academic, and enterprise use.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🔍',
    date: 'June 1, 2026',
    readTime: '18 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/acxhgj25i5r.webp',
    featured: true,
  },
  {
    id: 'why-was-my-essay-flagged-as-ai',
    hub: 'guides',
    title: 'Why Was My Essay Flagged as AI? Complete Guide 2026',
    excerpt: 'Discover why AI detectors flag human essays, how detection works, and what to do if your writing is incorrectly identified as AI-generated. Evidence-based guide with original research.',
    category: 'AI Detection',
    author: 'Dr. Elena Voss',
    authorAvatar: '🎓',
    date: 'July 27, 2026',
    readTime: '14 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dd277352-e1ee-463e-8d0c-ed3988d35393.jpg',
  },
  {
    id: 'words-that-trigger-ai-detection',
    hub: 'guides',
    title: 'List of Words That Trigger AI Detection: What Actually Makes Text Look AI-Generated',
    excerpt: 'No magic list of forbidden words exists. Learn what AI detectors really analyze, which phrases are commonly associated with AI output, and how to write more naturally.',
    category: 'AI Detection',
    author: 'Dr. Elena Voss',
    authorAvatar: '✍️',
    date: 'June 1, 2026',
    readTime: '14 min read',
    image: null,
  },
  {
    id: 'turnitin-vs-aidetector-cx',
    hub: 'comparisons',
    title: 'Turnitin vs AIDetector.cx: 2026 Comparison',
    excerpt: 'A detailed comparison of Turnitin and AIDetector.cx for universities, publishers, SEO agencies, and recruiters. Accuracy, pricing, workflows, and final verdicts by audience.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🎓',
    date: 'June 1, 2026',
    readTime: '22 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/kx2xvfnoq7e.webp',
  },
  {
    id: 'how-ai-detection-works',
    hub: 'guides',
    title: 'How AI Detection Works: A Technical Guide',
    excerpt: 'Learn how AI text detectors use classifiers and statistical signals, how detection scores are evaluated, and why false positives and false negatives occur.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🧠',
    date: 'June 1, 2026',
    readTime: '14 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/zrk7ui8pebr.png',
  },
  {
    id: 'ai-detection-accuracy-tests',
    hub: 'research',
    title: 'AI Detection Accuracy Tests: Transparent Benchmark',
    excerpt: 'Independent benchmark of AIDetector.cx, Turnitin, GPTZero, Originality.ai, Copyleaks, Winston AI, and ZeroGPT across 400 documents.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '📊',
    date: 'June 1, 2026',
    readTime: '26 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/z3xhjuonmp.webp',
  },
  {
    id: 'avoid-false-positives-institutional-ai-detectors',
    hub: 'research',
    title: 'How to Avoid False Positives in Institutional AI Detectors',
    excerpt: 'A practical, evidence-aware guide for students, educators and institutions: understand why human writing can be misclassified, preserve authorship evidence, and use AI detector results fairly.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '⚖️',
    date: 'November 5, 2026',
    readTime: '12 min read',
    image: null,
    contentHtml: `
      <p class="lead">An AI detector can raise a question about a document, but its score cannot establish who wrote it. False positives—human-written work incorrectly flagged as AI-generated—can have serious consequences when institutions treat an automated signal as a verdict. The safest response is a combination of careful interpretation, transparent writing practices, reliable process records and fair human review.</p>
      <p>This guide develops the original article's advice into practical steps for writers and institutional decision-makers. It does not promise that any writing style can guarantee a particular detector result. No wording trick, sentence-length pattern or editing technique can reliably prove authorship or prevent every false positive.</p>
      <h2 id="what-a-false-positive-means">What a false positive means</h2>
      <p>A false positive occurs when a detector classifies human-authored text as likely AI-generated. A false negative is the reverse: AI-generated text is classified as human-written. These are different error types, and a system can perform well on one while still making mistakes on the other.</p>
      <p>Most AI detectors estimate whether patterns in a submitted text resemble patterns associated with machine-generated writing. Depending on the system, analysis may consider statistical regularities, token or phrase distributions, sentence-level patterns, or learned classifier features. The output is an estimate based on the text and model—not direct access to the author's process, identity, intent or drafting history.</p>
      <p>For that reason, an AI score should not be described as proof of misconduct. It should be treated as one limited signal that may justify a conversation or further review, subject to the institution's published policy and the tool's documented limitations.</p>
      <h2 id="why-human-writing-can-be-flagged">Why authentic human writing can be flagged</h2>
      <h3 id="predictable-or-formulaic-prose">Predictable or formulaic prose</h3>
      <p>Some legitimate writing follows familiar structures: lab reports, literature reviews, policy summaries, technical documentation and standard academic essays. Repeated terminology, conventional transitions and consistent formatting can make this work statistically regular. Regularity alone does not show that AI produced it.</p>
      <h3 id="language-proficiency-and-editing">Language proficiency, editing and translation</h3>
      <p>Writers may use clear, concise or grammatically consistent language because of their education, professional experience, proofreading, accessibility needs, translation or language-learning support. A detector may respond to surface patterns without knowing why those patterns are present. Institutions should therefore avoid treating non-native English writing, polished prose or a particular writing style as evidence of AI use.</p>
      <p>A frequently cited 2023 study by Liang and colleagues evaluated seven GPT-detection tools on 91 TOEFL essays written by non-native English authors and 88 essays by U.S. eighth-grade students. The researchers reported an average false-positive rate of 61.3% on the TOEFL essays; all seven detectors classified 19.8% of those human-written essays as AI-generated. After the researchers edited the essays to increase linguistic diversity, the average false-positive rate fell to 11.6%. The authorship had not changed—the linguistic characteristics had.</p>
      <p><strong>Important limitation:</strong> these figures describe that study's sample, detectors and test conditions in 2023. They are not a current error-rate estimate for every detector, language or institution. They do, however, illustrate why systems should be independently evaluated on diverse, verified human writing.</p>
      <p>Source: <a href="https://doi.org/10.1016/j.patter.2023.100779" target="_blank" rel="noopener noreferrer">Liang et al., “GPT detectors are biased against non-native English writers,” Patterns (2023)</a>.</p>
      <h3 id="short-and-specialist-text">Short texts and specialist material</h3>
      <p>Very short passages provide less material for analysis. Formulae, citations, code, technical definitions, quoted material, templates and discipline-specific vocabulary can also affect the text being assessed. Before interpreting a result, check whether the tool supports the document type, language and length submitted.</p>
      <h3 id="human-and-ai-assisted-revision">Human revision and permitted assistance</h3>
      <p>Human editing can make writing more consistent, while permitted assistive tools—such as spellcheckers, grammar support, dictation and translation—may change surface features. Institutional policies differ on which uses are allowed. A detector generally cannot determine from a score alone whether a particular use complied with a policy.</p>
      <h2 id="practices-for-authentic-writing">Practices that support authentic writing</h2>
      <p>The goal is not to write unnaturally to influence a detector. It is to produce work that accurately represents the writer's understanding and follows the applicable rules.</p>
      <ul>
        <li><strong>Develop the argument yourself.</strong> Start with your own question, outline, interpretation and evidence. Make sure you can explain why each section belongs in the final work.</li>
        <li><strong>Use specific evidence.</strong> Support claims with relevant sources, data, examples or documented observations. Check that quotations and references are accurate.</li>
        <li><strong>Explain your reasoning.</strong> Show how you move from evidence to conclusion instead of relying on generic statements or unsupported summaries.</li>
        <li><strong>Revise for clarity, not detector evasion.</strong> Improve structure, precision and readability while preserving your actual meaning and voice. Do not add errors or distort prose to chase a score.</li>
        <li><strong>Follow the institution's AI policy.</strong> Check what is permitted for brainstorming, research, translation, editing, coding and drafting. Disclose assistance when required.</li>
      </ul>
      <h2 id="keep-a-writing-process-record">Keep a record of the writing process</h2>
      <p>Process evidence can help explain how a document developed. It is not an automatic guarantee of authorship, but it gives a reviewer more context than a detector score alone.</p>
      <ul>
        <li>Keep dated outlines, research notes, source lists and early drafts.</li>
        <li>Use version history in tools such as Google Docs or Microsoft Word when available.</li>
        <li>Retain meaningful revision milestones and feedback, rather than manufacturing a history after a concern is raised.</li>
        <li>Keep assignment instructions and relevant policy guidance so you can explain which tools were allowed.</li>
        <li>Protect private information: share only the records relevant to the review and use the institution's approved submission channel.</li>
      </ul>
      <p>If you are asked to explain your work, be prepared to discuss your research question, sources, argument, drafting choices and revisions in your own words. Do not fabricate drafts, timestamps or evidence.</p>
      <h2 id="what-to-do-if-your-work-is-flagged">What to do if your work is flagged</h2>
      <ol>
        <li><strong>Ask for the exact result.</strong> Request the tool name, version if available, date of analysis, text that was assessed, score explanation and any highlighted passages.</li>
        <li><strong>Check the scope.</strong> Confirm that the correct document and language were submitted and that the text meets the tool's minimum length and supported-content requirements.</li>
        <li><strong>Read the policy.</strong> Identify the specific rule allegedly breached and distinguish prohibited generation from permitted assistance such as spelling or accessibility support.</li>
        <li><strong>Provide relevant process evidence.</strong> Share authentic drafts, notes, version history, sources or feedback that help explain how the work was produced.</li>
        <li><strong>Request human review.</strong> Ask that the result be considered alongside the work itself, the assignment context and your explanation—not used as the sole basis for a penalty.</li>
        <li><strong>Keep a written record.</strong> Save the notification, your response and the outcome, and follow the institution's appeal process if needed.</li>
      </ol>
      <h2 id="guidance-for-institutions">Guidance for schools, universities and certification bodies</h2>
      <p>Institutions should design procedures around the consequences of error. A detector can support an inquiry, but a fair process needs safeguards for both false positives and false negatives.</p>
      <ul>
        <li><strong>Publish clear rules.</strong> Explain permitted and prohibited AI uses, disclosure expectations, the role of automated tools and the review or appeal process.</li>
        <li><strong>Do not use a detector score as sole evidence.</strong> Require independent contextual assessment before reaching an adverse conclusion.</li>
        <li><strong>Train reviewers.</strong> Explain false-positive and false-negative risks, supported languages, document-length limits and the meaning of the tool's output.</li>
        <li><strong>Preserve procedural fairness.</strong> Tell the writer what evidence is being considered, allow a meaningful response and provide an impartial route to challenge a decision.</li>
        <li><strong>Evaluate tools locally.</strong> Test representative writing from the institution's disciplines, languages and student population. Measure false-positive rates on verified human-written samples, not just overall accuracy.</li>
        <li><strong>Monitor outcomes.</strong> Record error patterns, review overturned decisions and reassess the tool when its model, settings or the institution's use case changes.</li>
        <li><strong>Minimize data exposure.</strong> Review vendor retention, privacy, security and access terms before uploading student or employee work.</li>
      </ul>
      <h2 id="understand-detector-metrics">Understand the metrics before relying on a score</h2>
      <p>Overall accuracy alone can conceal important failure modes. Institutions evaluating a detector should examine at least:</p>
      <ul>
        <li><strong>False-positive rate:</strong> the share of verified human-written samples incorrectly flagged.</li>
        <li><strong>False-negative rate:</strong> the share of AI-generated samples incorrectly treated as human-written.</li>
        <li><strong>Precision:</strong> among samples flagged as AI-generated, the share that are actually AI-generated in the test set.</li>
        <li><strong>Recall:</strong> among AI-generated samples in the test set, the share the detector correctly identifies.</li>
      </ul>
      <p>Results depend on the composition of the evaluation dataset, the definition of AI-generated, the language, document length, model version and threshold. A benchmark on one collection of essays does not automatically predict performance on another institution's assignments. Ask vendors for class-specific results and test with representative, properly labelled material.</p>
      <h3 id="thresholds-and-error-trade-offs">Thresholds and error trade-offs</h3>
      <p>A detector's decision threshold affects how readily it flags text. A more sensitive setting may surface weaker AI-associated patterns, but it can also send more human-written material for review. A more conservative threshold may reduce false alarms while allowing more AI-generated text to go undetected. The appropriate operating point depends on the intended use and the consequences of each type of error.</p>
      <h3 id="why-detectors-disagree">Why detectors disagree</h3>
      <p>Different tools may use different training data, preprocessing, model architectures, thresholds and score-calibration methods. As a result, two products can return different numbers for the same passage. A score of 70 from one product is not automatically equivalent to 70 from another, and averaging unrelated scores does not produce a validated “true AI percentage.” Always check what the particular product says its score represents.</p>
      <h3 id="human-ai-assisted-and-hybrid-work">Human, AI-assisted and hybrid work</h3>
      <p>Real writing workflows are not always binary. A person may write the substantive work and use permitted AI support for brainstorming, outlining, grammar or translation; a document may also contain both human-written and AI-generated passages. Editing can change the patterns available to a detector, but a score alone cannot reliably establish which workflow occurred. Institutions should define their categories and rules clearly and assess evidence against those rules.</p>
      <h2 id="responsible-use-of-ai-tools">Use AI tools transparently and within policy</h2>
      <p>Where institutional rules permit AI assistance, use it in ways that support rather than replace your own learning and judgment. Verify factual claims and references, rewrite nothing merely to conceal tool use, and disclose assistance in the manner required by the assignment or organization. Where AI use is prohibited, do not use it for that task.</p>
      <p>There is no universal disclosure rule: requirements vary by institution, course, employer and assessment. When uncertain, ask the responsible instructor or administrator before submitting the work.</p>
      <h2 id="key-takeaway">Key takeaway</h2>
      <p>False positives cannot be eliminated by changing a writer's vocabulary or sentence rhythm. The more reliable safeguards are authentic work, honest disclosure, preserved process records, careful tool evaluation and fair human review. Institutions should treat detector outputs as fallible indicators—not as conclusive proof of authorship or misconduct.</p>
      <h2 id="frequently-asked-questions">Frequently asked questions</h2>
      <h3 id="can-a-human-written-essay-be-flagged-as-ai">Can a human-written essay be flagged as AI-generated?</h3>
      <p>Yes. AI detectors can make false-positive errors. A result should be interpreted in context and should not, by itself, establish who wrote a document.</p>
      <h3 id="does-good-grammar-trigger-ai-detection">Does good grammar trigger AI detection?</h3>
      <p>Clear or consistent writing may share surface patterns with some generated text, but good grammar is not proof of AI use. Writing style alone cannot establish authorship.</p>
      <h3 id="can-version-history-prove-i-wrote-my-work">Can version history prove I wrote my work?</h3>
      <p>Version history can provide useful evidence of a document's development, especially when considered with notes, drafts and the writer's explanation. No single record is conclusive in every case.</p>
      <h3 id="should-institutions-punish-students-based-on-an-ai-score">Should institutions punish students based on an AI score?</h3>
      <p>An automated score alone is not a sound basis for a misconduct finding. Institutions should apply their published rules, consider corroborating evidence, give the writer an opportunity to respond and provide a fair review process.</p>
      <h3 id="how-can-an-institution-test-a-detector">How can an institution test an AI detector?</h3>
      <p>Use a representative, verified dataset; separate human and AI-written samples; evaluate false-positive and false-negative rates as well as precision and recall; document thresholds and versions; and repeat testing when the tool or use case changes.</p>
      <h2 id="further-reading">Further reading</h2>
      <ul>
        <li><a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener noreferrer">NIST AI Risk Management Framework</a> — a framework for identifying and managing AI system risks.</li>
        <li><a href="https://unesdoc.unesco.org/ark:/48223/pf0000386693" target="_blank" rel="noopener noreferrer">UNESCO: Guidance for Generative AI in Education and Research</a> — considerations for responsible use of generative AI in education.</li>
      </ul>
    `,
    faq: [
      { question: 'Can a human-written essay be flagged as AI-generated?', answer: 'Yes. AI detectors can make false-positive errors. A result should be interpreted in context and should not, by itself, establish who wrote a document.' },
      { question: 'Does good grammar trigger AI detection?', answer: 'Clear or consistent writing may share surface patterns with some generated text, but good grammar is not proof of AI use. Writing style alone cannot establish authorship.' },
      { question: 'Can version history prove I wrote my work?', answer: 'Version history can provide useful evidence of a document\'s development, especially when considered with notes, drafts and the writer\'s explanation. No single record is conclusive in every case.' },
      { question: 'Should institutions punish students based on an AI score?', answer: 'An automated score alone is not a sound basis for a misconduct finding. Institutions should apply their published rules, consider corroborating evidence, give the writer an opportunity to respond and provide a fair review process.' },
      { question: 'How can an institution test an AI detector?', answer: 'Use a representative, verified dataset; separate human and AI-written samples; evaluate false-positive and false-negative rates as well as precision and recall; document thresholds and versions; and repeat testing when the tool or use case changes.' }
    ],
  },
  {
    id: 'chatgpt-detector-comparison',
    hub: 'comparisons',
    title: 'ChatGPT Detector Comparison: GPT-4 vs GPT-5.5',
    excerpt: 'Compare how top AI detectors handle raw and edited ChatGPT outputs from GPT-4, GPT-4o, and GPT-5.5 across academic, SEO, and marketing use cases.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '💬',
    date: 'June 1, 2026',
    readTime: '14 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/0mhkot6e6g8s.webp',
  },
  {
    id: 'gpt-5-vs-gemini-detection',
    hub: 'research',
    title: 'GPT-5.5 vs Gemini Detection: Algorithmic Differences',
    excerpt: 'Understand why GPT-5.5 and Gemini produce different AI detection scores and how modern detectors analyze their writing patterns.',
    category: 'AI Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '⚖️',
    date: 'June 1, 2026',
    readTime: '12 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/xbr1cs6frn8.webp',
  },
  {
    id: 'why-tiktok-flagged-my-real-video',
    slug: 'why-tiktok-flagged-my-real-video',
    hub: 'guides',
    title: 'Why Did TikTok Flag My Real Video as AI? Creator Troubleshooting Guide (2026)',
    excerpt: 'Step-by-step diagnostic guide for content creators falsely flagged by TikTok AI detection algorithms. Learn how compression, frame interpolation, and lighting trigger false positives.',
    category: 'Video Detection',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🎬',
    date: 'August 15, 2026',
    readTime: '16 min read',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2725f082-7956-4e46-9f29-42f125b920fe.jpg',
    featured: true,
  },
  {
    id: 'whatsapp-compression-ai-video',
    slug: 'whatsapp-compression-ai-video',
    hub: 'research',
    title: 'WhatsApp Video Compression & AI Detection: Macroblocking and Temporal Artifacts',
    excerpt: 'Technical study on how WhatsApp video encoding, bitrate quantization, and GOP structure trigger false alarms in neural video detectors.',
    category: 'Video Forensics',
    author: 'AIDetector.cx Forensics Lab',
    authorAvatar: '🔬',
    date: 'August 20, 2026',
    readTime: '18 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/z3xhjuonmp.webp',
    featured: true,
  },
  {
    id: 'authentic-video-false-positives',
    slug: 'authentic-video-false-positives',
    hub: 'guides',
    title: 'Authentic Video False Positive Guide: Why Pristine Footage Triggers AI Detectors',
    excerpt: 'Comprehensive analysis of optical flow artifacts, electronic image stabilization, and HDR tone mapping in authentic smartphone and cinema video.',
    category: 'Video Forensics',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '📹',
    date: 'August 28, 2026',
    readTime: '14 min read',
    image: 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/images/uploads/acxhgj25i5r.webp',
  },

  {
    id: 'language-benchmark-overview',
    slug: 'language-benchmark-overview',
    hub: 'research',
    title: 'Multilingual AI Detector Benchmark: Language Support, Accuracy and Evaluation',
    excerpt: 'Understand multilingual AI detector language support, benchmark quality, false-positive risks and how GPTZero, Copyleaks, Originality.ai, Turnitin and Winston AI document their capabilities.',
    category: 'AI Detection Research',
    author: 'AIDetector.cx Research Team',
    authorAvatar: '🌐',
    date: 'November 5, 2026',
    readTime: '16 min read',
    image: '/images/language-benchmark-framework.svg',
    featured: true,
  },
];

export const FORUM_POSTS: ForumPost[] = [
  {
    id: '1',
    title: 'Just hit $5k MRR with my AI content agency — here\'s everything I did',
    author: 'TechFounder_Alex',
    authorAvatar: '👨‍💻',
    category: 'Success Stories',
    replies: 87,
    views: 4200,
    lastActivity: '2h ago',
    reputation: 1240,
  },
  {
    id: '2',
    title: 'Best AI tools for solopreneurs in 2026 - comprehensive list',
    author: 'AIEnthusiast',
    authorAvatar: '🤖',
    category: 'AI Tools',
    replies: 64,
    views: 3800,
    lastActivity: '4h ago',
    reputation: 890,
  },
  {
    id: '3',
    title: 'How I automated my entire client onboarding with n8n',
    author: 'AutomationGuru',
    authorAvatar: '⚡',
    category: 'Automation',
    replies: 52,
    views: 2900,
    lastActivity: '6h ago',
    reputation: 675,
  },
  {
    id: '4',
    title: 'ChatGPT vs Claude vs Gemini for business writing — honest review',
    author: 'ContentCreator',
    authorAvatar: '✍️',
    category: 'AI Tools',
    replies: 45,
    views: 2400,
    lastActivity: '8h ago',
    reputation: 420,
  },
  {
    id: '5',
    title: 'Profitable niche ideas for AI-powered businesses in 2026',
    author: 'StartupHunter',
    authorAvatar: '🚀',
    category: 'Business Ideas',
    replies: 38,
    views: 1900,
    lastActivity: '12h ago',
    reputation: 310,
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Jessica Wu',
    role: 'Content Director',
    company: 'GrowthLabs',
    avatar: '👩‍💼',
    quote: 'AIDetector.cx transformed how our team validates content. We cut our QA time by 70% and our publishing risk dropped to near zero.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Marcus Thompson',
    role: 'Founder & CEO',
    company: 'Contentify',
    avatar: '👨‍🚀',
    quote: 'The AI tools directory alone saved us 40+ hours of research. We found our entire tech stack in one afternoon.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Priya Sharma',
    role: 'SEO Manager',
    company: 'ScaleUp Agency',
    avatar: '👩‍💻',
    quote: 'The business guides are next level. I went from 0 to $8k/month implementing just 3 of the monetization strategies.',
    rating: 5,
  },
  {
    id: '4',
    name: 'Daniel Kim',
    role: 'Indie Hacker',
    company: 'SoloBuilder',
    avatar: '👨‍💡',
    quote: 'The community here is unlike anything else. Real builders sharing real results. No fluff.',
    rating: 5,
  },
];

export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: '1',
    name: 'Ultimate ChatGPT Prompt Pack',
    creator: 'PromptMaster',
    creatorAvatar: '🧠',
    category: 'AI Prompts',
    price: 29,
    rating: 4.8,
    reviewCount: 342,
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e52096b9-e6de-48c0-b765-497c39543215.jpg',
    description: '500+ battle-tested prompts for business, marketing, and content creation.',
    badge: 'Best Seller',
  },
  {
    id: '2',
    name: 'SaaS Business Plan Template',
    creator: 'StartupOS',
    creatorAvatar: '📋',
    category: 'Business Plans',
    price: 49,
    rating: 4.7,
    reviewCount: 187,
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f36c530c-0579-4dc5-815f-a1ba3bd5ab93.jpg',
    description: 'Complete Notion-based business planning system used by 500+ founders.',
    badge: 'Popular',
  },
  {
    id: '3',
    name: 'Social Media Automation Workflow',
    creator: 'FlowBuilder',
    creatorAvatar: '⚡',
    category: 'Automation',
    price: 37,
    rating: 4.6,
    reviewCount: 156,
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e9d79c19-b626-4065-b0b8-ef3f139c6a0c.jpg',
    description: 'Complete n8n workflow for automated social media posting and analytics.',
  },
  {
    id: '4',
    name: 'Freelancer Notion System',
    creator: 'NotionPro',
    creatorAvatar: '📓',
    category: 'Notion Systems',
    price: 24,
    rating: 4.9,
    reviewCount: 428,
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_981d71f8-3d50-45cb-9051-24df2d68ef72.jpg',
    description: 'All-in-one Notion workspace for freelancers — clients, projects, and invoices.',
    badge: 'Top Rated',
  },
];
