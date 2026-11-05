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
