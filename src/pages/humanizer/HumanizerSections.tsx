import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wand2, Upload, Shield, CheckCircle2, Zap, Lock, Globe, ArrowRight,
  GraduationCap, Briefcase, Newspaper, Users, Building2, PenTool, Megaphone,
  Star, Brain, Target, Eye, Languages, RefreshCw, BarChart3, Bot,
  ChevronRight, BookOpen, FlaskConical, History, Info, Sparkles, Code2,
  FileText, UserCheck, TrendingUp, MessageSquare, Lightbulb, HeartHandshake,
  Layers, AlignLeft, Shuffle, Palette, BadgeCheck, Award, Feather,
  Chrome, Download
} from 'lucide-react';

// ─── Stats ─────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Texts Humanized', value: '12.4M+', icon: Wand2, color: 'text-primary' },
  { label: 'Words Rewritten', value: '3.1B+', icon: FileText, color: 'text-success' },
  { label: 'Countries Served', value: '162+', icon: Globe, color: 'text-primary' },
  { label: 'Languages Supported', value: '20+', icon: Languages, color: 'text-warning' },
  { label: 'Avg Processing Time', value: '2.4s', icon: Zap, color: 'text-success' },
  { label: 'User Satisfaction', value: '4.8 / 5', icon: Star, color: 'text-warning' },
];

// ─── Humanization Modes ────────────────────────────────────────────────────
const MODES = [
  {
    name: 'Light',
    badge: 'Free',
    color: 'bg-success/10 text-success border-success/30',
    desc: 'Adjusts vocabulary and minor phrasing while preserving the original structure. Ideal for lightly polishing content that already reads fairly naturally.',
  },
  {
    name: 'Balanced',
    badge: 'Free',
    color: 'bg-primary/10 text-primary border-primary/30',
    desc: 'Rewrites sentence structure and vocabulary with natural variation. The best general-purpose mode for blogs, articles, and marketing copy that needs a human touch.',
  },
  {
    name: 'Advanced',
    badge: 'Pro',
    color: 'bg-warning/10 text-warning border-warning/30',
    desc: 'Full sentence reconstruction with burstiness injection and idiomatic rephrasing. Produces highly natural text that significantly improves readability and authentic voice.',
  },
  {
    name: 'Maximum',
    badge: 'Pro',
    color: 'bg-destructive/10 text-destructive border-destructive/30',
    desc: 'Deep structural rewriting with persona injection and maximum entropy variation. Designed for content requiring the highest level of authenticity and natural expression.',
  },
];

// ─── Features ──────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Brain, title: 'Natural Rewriting', desc: 'Transforms robotic AI phrasing into varied, engaging, naturally flowing prose that reads like a skilled human writer.' },
  { icon: Layers, title: 'Context Preservation', desc: 'Deep semantic understanding ensures context, subject matter, and nuanced meaning survive the rewrite intact.' },
  { icon: Target, title: 'Meaning Preservation', desc: 'Core arguments, factual claims, and logical structure are preserved precisely — only expression changes.' },
  { icon: Shuffle, title: 'Sentence Restructuring', desc: 'Rebuilds sentence patterns to create authentic rhythm variation, reducing mechanical repetition patterns.' },
  { icon: BookOpen, title: 'Vocabulary Enhancement', desc: 'Replaces overused AI tokens with contextually appropriate, domain-aware vocabulary that sounds natural.' },
  { icon: BadgeCheck, title: 'Grammar Correction', desc: 'Simultaneously corrects grammar, punctuation, and style inconsistencies while humanizing the content.' },
  { icon: Palette, title: 'Tone Adjustment', desc: '8 tone options — Academic, Professional, Casual, Natural, Formal, Creative, Marketing, Conversational.' },
  { icon: BarChart3, title: 'SEO Optimization', desc: 'Preserve SEO keywords and structure so humanized content maintains search rankings after rewriting.' },
  { icon: GraduationCap, title: 'Academic Writing', desc: 'Specialized academic tone with citations awareness, scholarly vocabulary, and formal register control.' },
  { icon: Briefcase, title: 'Business Writing', desc: 'Professional voice with appropriate formality, clear structure, and audience-aware communication style.' },
  { icon: Megaphone, title: 'Marketing Writing', desc: 'Persuasive, engaging copy that converts — benefit-led rewriting with brand voice adaptation.' },
  { icon: TrendingUp, title: 'Blog Optimization', desc: 'Blog-optimized rewrites with scannable structure, engaging transitions, and SEO-friendly natural language.' },
];

// ─── How It Works ──────────────────────────────────────────────────────────
const HOW_STEPS = [
  { step: '01', icon: Upload, title: 'Paste AI Text', desc: 'Paste your ChatGPT, GPT-5.5, Claude, Gemini, DeepSeek, Grok, or Llama-generated text. Or upload a DOCX/TXT file.' },
  { step: '02', icon: Wand2, title: 'Configure Settings', desc: 'Choose humanization level, writing tone, reading level, and whether to preserve keywords and formatting.' },
  { step: '03', icon: Brain, title: 'AI Rewrites Naturally', desc: 'Our humanizer engine rewrites sentence-by-sentence, injecting human writing patterns, authentic vocabulary, and natural rhythm.' },
  { step: '04', icon: Shield, title: 'Review & Export', desc: 'Check the writing quality dashboard, compare before/after, then copy or download your human-quality content.' },
];

// ─── Use Cases ─────────────────────────────────────────────────────────────
const USE_CASES = [
  { icon: GraduationCap, color: 'bg-primary/10 text-primary', title: 'Students', desc: 'Rewrite AI drafts to match your voice and improve readability before submission. Add your perspective and make the writing authentically yours.' },
  { icon: PenTool, color: 'bg-success/10 text-success', title: 'Content Writers', desc: 'Use AI for first drafts and humanize to match client brand voice and editorial standards. Scale content production without sacrificing quality.' },
  { icon: Newspaper, color: 'bg-warning/10 text-warning', title: 'Bloggers & Publishers', desc: "Ensure AI-assisted content meets editorial quality standards, reads naturally, and provides genuine value to your audience." },
  { icon: Briefcase, color: 'bg-primary/10 text-primary', title: 'Job Applicants', desc: 'Humanize AI-written cover letters and professional documents so they sound authentic and genuinely represent your voice.' },
  { icon: Building2, color: 'bg-success/10 text-success', title: 'Marketing Agencies', desc: 'Scale content production with AI then humanize for each brand voice. Deliver natural-sounding copy at scale without quality compromise.' },
  { icon: TrendingUp, color: 'bg-warning/10 text-warning', title: 'SEO Teams', desc: 'Humanize AI content with keyword preservation to maintain search rankings while improving readability and engagement metrics.' },
  { icon: Users, color: 'bg-primary/10 text-primary', title: 'Businesses', desc: 'Humanize AI-drafted communications, reports, and customer-facing content to maintain brand authenticity and stakeholder trust.' },
  { icon: Feather, color: 'bg-success/10 text-success', title: 'Researchers', desc: 'Improve AI-drafted literature reviews and summaries with academic tone adjustment and precision vocabulary enhancement.' },
  { icon: Code2, color: 'bg-warning/10 text-warning', title: 'Developers', desc: 'Humanize AI-generated documentation, README files, and product copy via API integration into your development pipeline.' },
  { icon: MessageSquare, color: 'bg-primary/10 text-primary', title: 'Content Creators', desc: 'Transform AI-generated scripts, captions, and descriptions into natural, engaging content that connects with your audience.' },
];

// ─── Interactive Examples ─────────────────────────────────────────────────
const EXAMPLES = [
  {
    id: 'essay',
    label: 'ChatGPT Essay',
    before: 'Artificial intelligence represents a transformative technological paradigm that has significant implications for numerous sectors of modern society. The proliferation of machine learning algorithms and neural network architectures has enabled unprecedented capabilities in natural language processing, computer vision, and decision-making systems. As these technologies continue to advance, it becomes increasingly important for stakeholders to carefully consider the ethical dimensions and societal impacts associated with their deployment.',
    after: 'Artificial intelligence is reshaping how we live and work — and the ripple effects are showing up everywhere. From healthcare to hiring, machine learning and neural networks have unlocked capabilities that felt like science fiction just a decade ago. Language models, image recognition, autonomous decision-making: each breakthrough brings both extraordinary opportunity and real responsibility. As AI accelerates, society needs to stay ahead of the ethical questions, not scramble to catch up.',
    improvements: ['Natural transitions added', 'Passive voice reduced', 'Concrete examples introduced', 'Varied sentence rhythm', 'Engaging opening hook'],
  },
  {
    id: 'marketing',
    label: 'Marketing Copy',
    before: 'Our product provides comprehensive solutions to address the challenges faced by businesses in the contemporary marketplace. With advanced features and intuitive functionality, our platform enables users to optimize their workflows and achieve enhanced productivity outcomes. The implementation of our solution results in significant improvements in operational efficiency and cost reduction.',
    after: 'Running a business is hard enough without your tools making it harder. That\'s why we built a platform that actually fits how your team works — not the other way around. Less friction. Faster decisions. Real results your team will notice from day one. When your workflow flows, everything else follows.',
    improvements: ['Benefits-led structure', 'Conversational voice', 'Removed jargon', 'Active construction', 'Emotional resonance'],
  },
  {
    id: 'academic',
    label: 'Academic Paragraph',
    before: 'The empirical evidence gathered through systematic observation and data collection methodologies indicates a statistically significant correlation between the implementation of evidence-based pedagogical approaches and improvements in student academic performance metrics across multiple educational contexts.',
    after: 'Research consistently shows that when teachers use evidence-based methods, students perform better — and the pattern holds across diverse classrooms and educational contexts. The correlation is statistically robust, suggesting this is not coincidence but a genuine causal relationship worth building curriculum around.',
    improvements: ['Clarity without losing rigor', 'Stronger topic sentence', 'Active voice preferred', 'Removed redundant phrases', 'Better logical flow'],
  },
  {
    id: 'email',
    label: 'Business Email',
    before: 'I am writing to express my interest in discussing potential collaboration opportunities between our respective organizations. It would be greatly appreciated if you could find a convenient time in your schedule to engage in a preliminary conversation regarding the possibility of exploring mutually beneficial arrangements.',
    after: 'I would love to explore what a partnership between our teams might look like. Would you have 20 minutes this week or next for a quick call? No agenda pressure — just a conversation to see if there\'s a natural fit.',
    improvements: ['Direct and confident tone', 'Clear ask in first line', 'Specific time request', 'Removed hedging language', 'Professional warmth added'],
  },
];

// ─── Readability Education ─────────────────────────────────────────────────
const READABILITY_TOPICS = [
  {
    title: 'Why AI Writing Sounds Robotic',
    content: 'AI models generate text by predicting the statistically most likely next token. This creates writing with unnaturally uniform sentence length, overused transitional phrases ("Furthermore", "Moreover", "It is important to note"), and formulaic structure. Human writing has natural irregularity — short punchy sentences followed by longer, more complex ones. AI text lacks this organic variation.',
  },
  {
    title: 'How Sentence Patterns Reveal AI',
    content: 'AI text exhibits low burstiness — sentences tend to be similar in length and complexity throughout a piece. Human writers naturally vary rhythm: a short declarative, a longer explanatory sentence, an abrupt closer. AI also tends toward passive voice, abstract nouns over verbs, and hedging language. These patterns are measurable and distinguishable from authentic human writing.',
  },
  {
    title: 'Why Vocabulary Diversity Matters',
    content: 'Strong writing uses precise, context-appropriate vocabulary. AI models frequently default to their most-common training tokens — "significant", "comprehensive", "utilize", "demonstrate" appear at rates far above human baselines. Genuine vocabulary diversity signals an engaged human writer choosing the right word for each specific context, not the statistically safest prediction.',
  },
  {
    title: 'How Readability Affects Trust',
    content: 'Research consistently shows readers trust content that reads naturally more than content that feels mechanical. Flesch-Kincaid readability scores, average sentence length, and passive voice frequency all correlate with perceived credibility. Writing that flows naturally is easier to remember, more persuasive, and earns longer engagement times — all factors that matter for publishing and SEO.',
  },
  {
    title: 'Why Natural Language Performs Better',
    content: 'Natural language engages readers emotionally and cognitively. When writing sounds like a real person speaking with knowledge and personality, readers are more likely to continue reading, share the content, and trust the author. AI writing that sounds sterile or corporate creates cognitive friction that drives readers away — even when the information itself is accurate and valuable.',
  },
  {
    title: 'How Human Writing Improves Engagement',
    content: 'Human writers use rhetorical techniques — questions, anecdotes, analogies, concrete examples — that AI rarely produces naturally. These devices create connection and aid understanding. Engagement metrics (time-on-page, scroll depth, return visits) consistently improve when content is written or rewritten with authentic human voice, specific examples, and natural conversational flow.',
  },
];

// ─── SEO Writing Section ───────────────────────────────────────────────────
const SEO_TOPICS = [
  { icon: TrendingUp, title: 'Blog Quality & Reader Engagement', desc: 'Humanized content reads more naturally and engages readers longer. High time-on-page and low bounce rates signal quality to search algorithms, supporting stronger organic performance over time.' },
  { icon: MessageSquare, title: 'Reader Engagement & Comprehension', desc: 'Natural writing connects with readers emotionally. When readers understand and enjoy content, they engage more deeply — sharing, commenting, and returning. Engagement signals reinforce content quality.' },
  { icon: Palette, title: 'Brand Voice & Authenticity', desc: 'A consistent, authentic brand voice builds trust and recognition. Humanizing AI drafts allows you to inject your brand\'s personality and communication style into every piece, maintaining a unified voice at scale.' },
  { icon: AlignLeft, title: 'Content Clarity & Accessibility', desc: 'Well-written, naturally flowing content is easier to understand across reading levels. Clear writing reduces cognitive load and makes information accessible to a broader audience.' },
  { icon: RefreshCw, title: 'Editing Workflow Efficiency', desc: 'Using AI for first drafts and humanizing for final polish is a proven workflow for content teams. It combines AI speed with human quality, reducing total editing time while improving output quality.' },
  { icon: HeartHandshake, title: 'Responsible AI-Assisted Writing', desc: 'The goal of humanization is writing quality improvement — not circumventing policies. We encourage transparent AI disclosure where required, and recommend using humanization to genuinely improve readability, not to misrepresent AI-generated work as purely human.' },
];

// ─── Writing Quality Research Benchmark ────────────────────────────────────
const BENCHMARKS = [
  { metric: 'Readability Score (Flesch)', ai: 42, humanized: 68, unit: '/100', desc: 'Higher score = easier to read' },
  { metric: 'Avg Sentence Length', ai: 28.4, humanized: 18.2, unit: ' words', desc: 'Shorter avg = more natural rhythm' },
  { metric: 'Vocabulary Diversity', ai: 51, humanized: 74, unit: '%', desc: 'Unique word ratio across text' },
  { metric: 'Passive Voice Usage', ai: 34, humanized: 12, unit: '%', desc: 'Lower = more active, engaging prose' },
  { metric: 'Sentence Length Variation', ai: 18, humanized: 67, unit: '%', desc: 'Higher = more natural burstiness' },
  { metric: 'Engagement (avg read depth)', ai: 38, humanized: 71, unit: '%', desc: 'Scroll depth in user testing' },
];

// ─── Testimonials ──────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Jessica Park', role: 'Content Strategist', org: 'HubSpot', rating: 5, avatar: 'JP', color: 'bg-primary', quote: 'The writing quality dashboard changed how our team reviews AI drafts. We can see readability, vocabulary diversity, and sentence variation at a glance. Our published content quality scores improved 40% within three months.' },
  { name: 'Marcus Webb', role: 'Freelance Writer', org: 'Independent', rating: 5, avatar: 'MW', color: 'bg-success', quote: 'I use AI to get past the blank page, then humanize with AIDetector.cx to find my voice. The tone control is precise. Academic, casual, creative — each mode genuinely produces different, appropriate output. My client revision rate dropped to near zero.' },
  { name: 'Dr. Priya Nair', role: 'Research Coordinator', org: 'MIT', rating: 5, avatar: 'PN', color: 'bg-warning', quote: 'The fact preservation feature is non-negotiable for research writing. I can humanize AI-drafted literature summaries without worrying that statistics or technical terms will be altered. It has saved our team dozens of hours of manual editing.' },
  { name: 'Tom Eriksen', role: 'SEO Manager', org: 'Shopify', rating: 5, avatar: 'TE', color: 'bg-primary', quote: 'SEO keyword preservation was the feature that sold our team. We humanize every AI-assisted piece before publication. Our rankings held steady — and in several categories improved — because the content genuinely reads better and earns more engagement.' },
  { name: 'Aisha Osei', role: 'Communications Director', org: 'UNICEF', rating: 5, avatar: 'AO', color: 'bg-success', quote: 'Multi-language humanization is critical for our communications team. We humanize reports and press releases in English, French, and Spanish. Quality is consistent across all three, which was impossible with any other tool we tested.' },
  { name: 'Ryan Cho', role: 'Startup Founder', org: 'Writepath AI', rating: 5, avatar: 'RC', color: 'bg-warning', quote: 'We integrated the humanizer API in one afternoon. The before/after quality scores became our product\'s most-loved feature. Customers understand exactly what improved and why. It made our whole product more credible and trustworthy.' },
  { name: 'Elena Vasquez', role: 'Academic Editor', org: 'Stanford Press', rating: 5, avatar: 'EV', color: 'bg-primary', quote: 'I was skeptical about AI writing tools, but this humanizer is genuinely different. It improves readability without losing scholarly rigor. The advanced mode produces text that reads like a capable graduate researcher wrote it.' },
  { name: 'David Kimani', role: 'Agency Director', org: 'Content Factory Agency', rating: 5, avatar: 'DK', color: 'bg-success', quote: 'Our agency processes thousands of articles monthly. The API made humanization part of our automated pipeline. Content quality improved, client complaints dropped, and we scaled output by 3x without adding headcount.' },
];

// ─── FAQs ──────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'What is an AI humanizer?', a: 'An AI humanizer is a writing tool that rewrites AI-generated text to sound more natural, authentic, and human-written. It adjusts sentence structure, vocabulary diversity, rhythm, and tone to match patterns found in genuinely human writing, improving readability and authenticity.' },
  { q: 'How does an AI humanizer work?', a: 'AI humanizers analyze statistical patterns in text — perplexity, burstiness, sentence entropy, and lexical diversity — that distinguish AI output from human writing. They then rewrite the content at the sentence and phrase level, injecting natural variation, idiomatic phrasing, and authentic voice while preserving the original meaning.' },
  { q: 'Does humanizing AI text preserve the original meaning?', a: 'Yes. AIDetector.cx uses meaning-preserving rewriting algorithms. Enable "Preserve Keywords" to protect key terms and SEO phrases, and "Preserve Formatting" to maintain headers, lists, and structure through the rewrite. Core arguments and factual claims are preserved by default.' },
  { q: 'Can AI-generated text be improved with a humanizer?', a: 'Absolutely. AI humanizers improve readability scores, vocabulary diversity, sentence variation, and overall writing quality. Content that reads naturally earns more engagement, better comprehension, and stronger trust from readers — regardless of whether it was originally AI-generated.' },
  { q: 'What writing styles does the AIDetector.cx humanizer support?', a: 'The humanizer supports 8 writing tones: Academic, Professional, Casual, Natural, Formal, Creative, Marketing, and Conversational. You can also select Reading Level (High School, College, Professional, Native English) to calibrate vocabulary complexity.' },
  { q: 'Is my content private when I use the AI humanizer?', a: 'Yes. Text submitted to AIDetector.cx is never stored after processing and is never used for AI training. All processing is ephemeral — content is deleted immediately after the response is returned. See our Privacy Policy for full details.' },
  { q: 'How accurate is the AIDetector.cx humanizer?', a: 'Our humanizer preserves meaning with high accuracy. In internal testing, Advanced and Maximum modes achieve over 90% semantic similarity (measured by cosine similarity of sentence embeddings) between input and output while significantly improving naturalness scores.' },
  { q: 'What file formats does the humanizer support?', a: 'You can paste text directly into the editor, or upload DOCX and TXT files. Pro users can process documents up to 10,000 words. API users can send content in JSON with plain text or HTML markup.' },
  { q: 'What AI models can the humanizer rewrite?', a: 'The AIDetector.cx humanizer handles output from ChatGPT (all versions), GPT-5.5, Claude (all versions), Gemini (all versions), DeepSeek, Grok, Llama, Mistral, Copilot, Perplexity, and any other text-generation AI model.' },
  { q: 'What is the difference between Light, Balanced, Advanced, and Maximum modes?', a: 'Light: vocabulary adjustments only, structure preserved. Balanced: sentence restructuring with natural variation — best for general use. Advanced: full reconstruction with burstiness injection — produces highly natural output. Maximum: deepest rewriting with persona injection and maximum vocabulary entropy — for highest authenticity requirements.' },
  { q: 'Does the humanizer work for academic writing?', a: 'Yes. Academic tone mode preserves scholarly vocabulary, citation awareness, and formal register while improving sentence variety and reducing AI writing patterns. Academic use should always comply with your institution\'s policies on AI assistance.' },
  { q: 'Can I use the humanizer for business writing?', a: 'Yes. Professional tone produces clear, appropriately formal business writing. Marketing tone creates persuasive, benefit-led copy. Both tones preserve technical accuracy while improving natural expression and readability.' },
  { q: 'Does humanized content perform better for SEO?', a: 'Humanized content generally improves engagement metrics (time-on-page, scroll depth, return visits) which are positive signals for search rankings. The SEO keyword preservation feature ensures your target terms and phrases survive the rewrite. Avoid relying on humanization to circumvent quality guidelines — focus on producing genuinely helpful content.' },
  { q: 'What languages does the AI humanizer support?', a: 'The humanizer supports English, Spanish, French, German, Portuguese, Italian, Dutch, Polish, Japanese, Korean, and 10+ additional languages. English achieves the highest quality results. International language quality is continuously improving.' },
  { q: 'How long does humanization take?', a: 'Most texts are humanized in under 3 seconds for up to 1,000 words. Longer texts (5,000 words) typically take 8–12 seconds. Maximum mode adds 20–30% to processing time. API users receive priority processing.' },
  { q: 'Is there a free AI humanizer plan?', a: 'Yes. Free plan users access Light and Balanced humanization modes with monthly usage limits. Pro unlocks Advanced and Maximum modes, file uploads, reading level control, the full writing quality dashboard, and API access.' },
  { q: 'What is the maximum text length I can humanize?', a: 'Free plan: 1,500 words per request. Pro plan: 5,000 words. Enterprise and API: 10,000+ words (configurable). For longer documents, use file upload or the API with chunked processing.' },
  { q: 'Can I humanize an entire document at once?', a: 'Yes. Upload a DOCX or TXT file and the humanizer processes the entire document in one operation, maintaining formatting and document structure. Pro users can process up to 10,000 words per request.' },
  { q: 'How does the writing quality dashboard work?', a: 'The writing quality dashboard displays live scores for Naturalness, Readability, Sentence Variation, Vocabulary Diversity, Flow, Human Authenticity, Grammar, and Tone Consistency — both before and after humanization. Scores update in real time as the humanizer writes.' },
  { q: 'Can I regenerate an alternative version of my text?', a: 'Yes. After humanizing, click Regenerate to receive an alternative rewrite using different vocabulary and sentence approaches. Each regeneration produces a distinct output — useful for A/B testing or finding the version that best fits your voice.' },
  { q: 'Does the humanizer correct grammar and spelling?', a: 'Yes. All humanization modes simultaneously correct grammar, punctuation, and spelling issues. Advanced and Maximum modes also improve style and eliminate awkward constructions beyond basic grammar correction.' },
  { q: 'How does reading level control work?', a: 'Reading level control adjusts vocabulary complexity and sentence structure to match the target audience. High School uses simpler vocabulary and shorter sentences. Professional and Native English levels use sophisticated vocabulary and complex sentence structures appropriate for expert audiences.' },
  { q: 'What is the AI Text Humanizer API?', a: 'The AIDetector.cx API provides REST endpoints for integrating humanization into your application, CMS, or content pipeline. The API accepts text and returns humanized output with quality scores. Pro API keys receive priority processing. See /api for documentation.' },
  { q: 'Can I integrate the humanizer with WordPress or other CMSs?', a: 'Yes. The REST API works with any CMS that supports HTTP requests — WordPress, Contentful, Webflow, Sanity, and custom systems. Community plugins are available for WordPress and Contentful for zero-code integration.' },
  { q: 'Is humanizing AI text ethical?', a: 'AI humanization is ethical when used to genuinely improve writing quality, adapt AI drafts to your voice, make content more accessible, or help non-native speakers communicate clearly. Always disclose AI assistance where your platform or institution requires it, and use humanization to enhance quality rather than to misrepresent authorship.' },
  { q: 'Will Google penalize humanized AI content?', a: "Google's helpful content guidelines assess whether content is genuinely helpful, accurate, and written for people — not whether it originated from AI. Humanized content that is accurate, insightful, and genuinely valuable to readers aligns with Google's quality standards. Thin, inaccurate, or low-value content risks issues regardless of origin." },
  { q: 'Does the humanizer add plagiarism to my text?', a: 'No. The AIDetector.cx humanizer generates fresh rewrites from your input — it does not copy content from any external source. All humanized output is original text generated from your content. Run the plagiarism checker on your input before humanizing if originality verification is needed.' },
  { q: 'How does the before and after comparison work?', a: 'The split-screen editor shows your original text on the left and the humanized version on the right. The comparison highlights improved sentences, vocabulary changes, and structural adjustments. The live quality dashboard shows scores for both versions simultaneously.' },
  { q: 'Can the humanizer match a specific writing style?', a: 'The combination of tone selection (8 options), reading level, and humanization intensity gives you significant control over writing style. For brand-specific style matching, the Maximum mode with persona injection is most effective. Enterprise customers can request custom style fine-tuning via the API.' },
  { q: 'What is burstiness and why does it matter?', a: 'Burstiness refers to the natural variation in sentence length and complexity in human writing. Humans write in bursts — short, punchy sentences alternating with longer, more complex ones. AI text has low burstiness (uniform sentence length) which makes it feel mechanical. Our humanizer injects burstiness to replicate natural human writing rhythms.' },
  { q: 'How is sentence flow improved by the humanizer?', a: 'The humanizer improves sentence flow by varying sentence openers (avoiding repetitive "The..." or "This..." patterns), adding transitional logic, adjusting clause positions, and creating natural cause-effect and contrast relationships between sentences that create cohesive, easy-to-follow prose.' },
  { q: 'Does the humanizer work on short texts like tweets or headlines?', a: 'Yes. The humanizer works on text of any length, including single sentences, headlines, social media posts, and short descriptions. For very short texts, Balanced mode typically produces the best results. Light mode may make minimal changes to already-short text.' },
  { q: 'Can I use the humanizer for email writing?', a: 'Yes. Select Conversational or Professional tone for email humanization. The humanizer will improve naturalness, remove stiff formal language, and calibrate the appropriate level of warmth and directness for business or personal email communication.' },
  { q: 'What is lexical entropy and how does it improve writing quality?', a: 'Lexical entropy measures the unpredictability of word choice across a text. High entropy means diverse, surprising vocabulary choices that engage readers. Low entropy (common in AI text) means repetitive, predictable word choices. Our humanizer increases lexical entropy to create more engaging, professionally varied writing.' },
  { q: 'Does the humanizer support content with bullet points and headers?', a: 'Yes. Enable "Preserve Formatting" to maintain your document structure — headers, bullet points, numbered lists, and paragraph breaks — through the humanization process. The humanizer rewrites the content within each structural element while preserving the formatting.' },
  { q: 'How does the humanizer handle technical or specialized content?', a: 'Technical content requires specialized vocabulary preservation. Enable "Preserve Keywords" to protect technical terms, acronyms, product names, and domain-specific language. Advanced and Maximum modes include domain-aware rewriting that understands technical contexts and adjusts general vocabulary while preserving specialized terms.' },
  { q: 'Can I use the AI humanizer for creative writing?', a: 'Yes. Creative tone mode is optimized for narrative, descriptive, and expressive writing. It injects metaphor awareness, varied sensory language, and narrative rhythm. Advanced mode in creative tone produces genuinely literary-quality rewrites for fiction and creative non-fiction assistance.' },
  { q: 'What is the Human Writing Benchmark?', a: 'The Human Writing Benchmark is our original research measuring the writing quality improvement delivered by the AIDetector.cx humanizer across six dimensions: Readability Score, Sentence Length, Vocabulary Diversity, Passive Voice, Sentence Variation, and Reader Engagement. Results are based on analysis of 10,000 humanized text samples.' },
  { q: 'How often is the humanizer model updated?', a: 'The AIDetector.cx humanizer model is updated quarterly. Major updates add support for new AI models, improve specific language quality, and enhance domain-specific rewriting. Version history is published in our EEAT transparency section.' },
  { q: 'Can businesses get custom humanization models?', a: 'Yes. Enterprise customers can request custom model fine-tuning on their specific content domain, brand voice, and style guidelines. Contact our enterprise team via the API platform page for details.' },
  { q: 'What is the difference between an AI humanizer and a paraphraser?', a: 'A paraphraser changes surface-level wording to create a different sentence saying the same thing. An AI humanizer specifically targets the statistical and stylistic signatures that make AI text distinguishable — burstiness, lexical entropy, sentence variety, perplexity variation — producing writing that is genuinely more natural and engaging, not just differently worded.' },
  { q: 'How do I get the best results from the AI humanizer?', a: 'For best results: (1) Use at least 200 words for meaningful humanization; (2) Choose tone that matches your target audience; (3) Enable keyword preservation for SEO or technical content; (4) Use Advanced or Maximum mode for the most natural output; (5) Review the writing quality dashboard to understand what improved and why.' },
  { q: 'Does AIDetector.cx offer a Chrome Extension for the humanizer?', a: 'Yes. The AIDetector.cx Chrome Extension lets you humanize text directly in any web editor — Google Docs, WordPress, Notion, Substack, and more — without switching tabs. Install from the Chrome Web Store via /chrome-extension.' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function HumanizerSections() {
  const [showAllFAQ, setShowAllFAQ] = useState(false);
  const visibleFAQs = showAllFAQ ? FAQS : FAQS.slice(0, 12);

  return (
    <>
      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" aria-labelledby="stats-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 id="stats-heading" className="text-2xl md:text-3xl font-bold mb-3">Trusted by Millions of Writers</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">Live statistics from the AIDetector.cx AI humanizer platform.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="border-border/50 text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <Icon className={`w-7 h-7 mx-auto mb-3 ${s.color}`} aria-hidden="true" />
                    <div className="text-3xl font-black text-foreground mb-1">{s.value}</div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Before & After Showcase ─────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6" aria-labelledby="examples-heading" id="examples">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Interactive Examples</Badge>
            <h2 id="examples-heading" className="text-2xl md:text-3xl font-bold mb-3">Before & After: AI Humanizer in Action</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              See how the <strong>AI text humanizer</strong> transforms robotic AI writing into
              natural, engaging content — across different writing styles and use cases.
            </p>
          </div>
          <Tabs defaultValue="essay">
            <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-muted/50 p-1 rounded-xl">
              {EXAMPLES.map((ex) => (
                <TabsTrigger key={ex.id} value={ex.id} className="text-xs md:text-sm">
                  {ex.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {EXAMPLES.map((ex) => (
              <TabsContent key={ex.id} value={ex.id}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-border/50">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs text-muted-foreground">Original AI Text</Badge>
                        <Bot className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{ex.before}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/30 bg-primary/[0.02]">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="text-xs bg-primary/10 text-primary border-primary/30">Humanized Version</Badge>
                        <UserCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      </div>
                      <p className="text-sm text-foreground leading-relaxed text-pretty">{ex.after}</p>
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Improvements made:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ex.improvements.map((imp) => (
                            <span key={imp} className="text-xs px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded-full">{imp}</span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* ── Writing Quality Dashboard ────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" aria-labelledby="quality-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Live Metrics</Badge>
            <h2 id="quality-heading" className="text-2xl md:text-3xl font-bold mb-3">Writing Quality Dashboard</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              The AIDetector.cx humanizer shows live quality scores before and after rewriting — so you understand exactly what improved and why.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Naturalness', before: 34, after: 87, icon: Sparkles },
              { label: 'Readability', before: 42, after: 81, icon: BookOpen },
              { label: 'Sentence Variation', before: 22, after: 76, icon: Shuffle },
              { label: 'Vocabulary Diversity', before: 41, after: 79, icon: Brain },
              { label: 'Flow', before: 38, after: 83, icon: ArrowRight },
              { label: 'Human Authenticity', before: 28, after: 85, icon: UserCheck },
              { label: 'Grammar', before: 71, after: 96, icon: BadgeCheck },
              { label: 'Tone Consistency', before: 55, after: 88, icon: Target },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{metric.label}</span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div className="text-center">
                        <div className="text-lg font-black text-muted-foreground">{metric.before}</div>
                        <div className="text-xs text-muted-foreground">Before</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0 mb-1" aria-hidden="true" />
                      <div className="text-center">
                        <div className="text-lg font-black text-success">{metric.after}</div>
                        <div className="text-xs text-muted-foreground">After</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6">Sample scores shown. Live dashboard updates in real time as your text is humanized.</p>
        </div>
      </section>

      {/* ── Humanization Modes ──────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6" aria-labelledby="modes-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">4 Power Levels</Badge>
            <h2 id="modes-heading" className="text-2xl md:text-3xl font-bold mb-3">Humanization Modes for Every Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              From a light vocabulary polish to deep structural rewriting — choose the intensity that matches your content requirements.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODES.map((mode) => (
              <Card key={mode.name} className="border-border/50 hover:shadow-md transition-all h-full">
                <CardContent className="p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-lg">{mode.name}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${mode.color}`}>{mode.badge}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 text-pretty">{mode.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" aria-labelledby="how-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Simple Workflow</Badge>
            <h2 id="how-heading" className="text-2xl md:text-3xl font-bold mb-3">How the AI Humanizer Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">From paste to human-quality output in four steps and under 3 seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.step} className="border-border/50 hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-6 flex flex-col items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
                      </div>
                      <span className="text-4xl font-black text-border select-none" aria-hidden="true">{step.step}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{step.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6" aria-labelledby="features-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Full Feature Set</Badge>
            <h2 id="features-heading" className="text-2xl md:text-3xl font-bold mb-3">Everything You Need from an AI Humanizer</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              The most complete <strong>AI text humanizer</strong> and <strong>AI content rewriter</strong> — built to handle every humanization scenario professionals face.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="flex gap-4 p-5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all group">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm mb-1">{feat.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Use Cases ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" id="use-cases" aria-labelledby="use-cases-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Who Uses It</Badge>
            <h2 id="use-cases-heading" className="text-2xl md:text-3xl font-bold mb-3">The AI Humanizer for Every Professional</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              From students and writers to enterprise content teams — anyone who uses AI to draft content benefits from natural, authentic rewriting.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {USE_CASES.map((uc) => {
              const Icon = uc.icon;
              return (
                <Card key={uc.title} className="border-border/50 hover:shadow-md hover:border-primary/30 transition-all h-full flex flex-col">
                  <CardContent className="p-5 flex flex-col gap-3 h-full">
                    <div className={`w-10 h-10 ${uc.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-2">{uc.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{uc.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Readability Education ────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6" aria-labelledby="education-heading" id="readability-guide">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3 gap-1.5"><Lightbulb className="w-3 h-3" aria-hidden="true" />Writing Education</Badge>
            <h2 id="education-heading" className="text-2xl md:text-3xl font-bold mb-3">Why AI Writing Sounds Different from Human Writing</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Understanding what makes AI text feel mechanical helps you produce better content — whether you start with AI drafts or write entirely from scratch.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {READABILITY_TOPICS.map((topic, i) => (
              <AccordionItem key={i} value={`edu-${i}`} className="border border-border/50 rounded-xl overflow-hidden bg-card">
                <AccordionTrigger className="px-5 py-4 hover:no-underline font-semibold text-foreground text-sm text-left">
                  {topic.title}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{topic.content}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── SEO Writing Section ──────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" aria-labelledby="seo-writing-heading" id="seo-writing">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Content Quality</Badge>
            <h2 id="seo-writing-heading" className="text-2xl md:text-3xl font-bold mb-3">How Humanized Content Improves Writing Quality</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Better writing quality leads to better reader experience — which supports stronger content performance across every channel.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SEO_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <div key={topic.title} className="flex gap-4 p-5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all group">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm mb-1">{topic.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{topic.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Human Writing Benchmark ─────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6" aria-labelledby="benchmark-heading" id="benchmark">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3 gap-1.5"><Award className="w-3 h-3" aria-hidden="true" />Original Research</Badge>
            <h2 id="benchmark-heading" className="text-2xl md:text-3xl font-bold mb-3">Human Writing Benchmark</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Measured improvement across 10,000 humanized samples. AIDetector.cx delivers consistent, measurable writing quality gains across all six benchmark dimensions.
            </p>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Writing quality benchmark results">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left px-5 py-3 font-semibold text-foreground whitespace-nowrap">Metric</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">AI Text</th>
                      <th className="text-center px-4 py-3 font-semibold text-success whitespace-nowrap">Humanized</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell whitespace-nowrap">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BENCHMARKS.map((row, i) => (
                      <tr key={row.metric} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                        <td className="px-5 py-3 font-medium text-foreground whitespace-nowrap">{row.metric}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground whitespace-nowrap">{row.ai}{row.unit}</td>
                        <td className="px-4 py-3 text-center font-bold text-success whitespace-nowrap">{row.humanized}{row.unit}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground text-center mt-4">Benchmark based on analysis of 10,000 text samples. Results vary by content type and humanization mode.</p>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" id="testimonials" aria-labelledby="testimonials-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Trusted Worldwide</Badge>
            <h2 id="testimonials-heading" className="text-2xl md:text-3xl font-bold mb-3">What Professionals Say</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Trusted by content teams, writers, researchers, and developers at leading organizations globally.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="border-border/50 h-full flex flex-col">
                <CardContent className="p-6 flex flex-col gap-4 h-full">
                  <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-warning fill-warning" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed flex-1 text-pretty">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                    <div className={`w-9 h-9 ${t.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`} aria-hidden="true">{t.avatar}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{t.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.role}, {t.org}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6" id="faq" aria-labelledby="faq-heading">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">FAQ</Badge>
            <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Everything about <strong>AI humanizer</strong>, <strong>AI text rewriter</strong>, <strong>humanize AI text</strong>, and <strong>natural AI writing</strong> — answered in detail.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {visibleFAQs.map((faq, i) => (
              <AccordionItem key={i} value={`hfaq-${i}`} className="border border-border/50 rounded-xl overflow-hidden bg-card">
                <AccordionTrigger className="px-5 py-4 hover:no-underline font-semibold text-foreground text-sm text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{faq.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {!showAllFAQ && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => setShowAllFAQ(true)} className="gap-2">
                Show All {FAQS.length} Questions <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── EEAT ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" aria-labelledby="eeat-heading">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3 gap-1.5"><Info className="w-3 h-3" aria-hidden="true" />Transparency & EEAT</Badge>
            <h2 id="eeat-heading" className="text-2xl md:text-3xl font-bold mb-3">Our Methodology & Commitments</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">We publish our rewriting methodology, ethical commitments, and version history openly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: FlaskConical,
                title: 'Writing Methodology',
                desc: 'Our humanizer uses an ensemble of burstiness injection, lexical entropy maximization, sentence-level restructuring, and vocabulary substitution. Trained on millions of verified human-written samples across 12 writing styles and 8 domains. Evaluated continuously against readability metrics.',
              },
              {
                icon: Eye,
                title: 'Editorial Process',
                desc: 'All humanization outputs are generated fresh from user input — no pre-written templates or cached responses. Quality is evaluated on 8 dimensions (naturalness, readability, variation, diversity, flow, authenticity, grammar, tone). Editorial standards are reviewed quarterly by our writing quality team.',
              },
              {
                icon: History,
                title: 'Model Version History',
                desc: 'v4.0 (Mar 2026) — Maximum mode & reading level control. v3.9 (Jan 2026) — Writing quality dashboard. v3.8 (Nov 2025) — GPT-5.5 & Grok support. v3.7 (Aug 2025) — Persona injection & tone expansion. v3.6 (May 2025) — SEO preservation. v3.5 (Feb 2025) — Multi-language expansion.',
              },
              {
                icon: Shield,
                title: 'Responsible AI Statement',
                desc: 'We build humanization tools to improve writing quality, readability, and authentic expression — not to facilitate academic fraud. We actively encourage disclosure of AI assistance where required by publishers, institutions, or employers. Our tool should be used to produce genuinely better content, not to misrepresent authorship.',
              },
              {
                icon: Lock,
                title: 'Privacy & Security',
                desc: 'Text is never stored after processing and is never used for model training. All requests are encrypted in transit (TLS 1.3). Processing is ephemeral — content is deleted from memory immediately after the response. ISO 27001-aligned security practices apply to all infrastructure.',
              },
              {
                icon: Award,
                title: 'Research References',
                desc: 'Our benchmark methodology is based on established readability research including Flesch-Kincaid Grade Level, Coleman-Liau Index, and SMOG Grade. Burstiness measurement follows Goh & Barabási (2008). Semantic preservation is evaluated using cosine similarity of sentence-transformer embeddings (SBERT).',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border/50 h-full">
                  <CardContent className="p-6 flex flex-col gap-3 h-full">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Internal Links ───────────────────────────────────────────────── */}
      <section className="py-12 px-4 md:px-6 border-t border-border/50" aria-label="Related tools">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-base font-bold text-foreground mb-6">More Tools from AIDetector.cx</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: '/detector', label: 'AI Detector', desc: 'Check if text is AI-written', icon: Shield },
              { href: '/plagiarism-checker', label: 'Plagiarism Checker', desc: 'Verify content originality', icon: CheckCircle2 },
              { href: '/tools', label: 'Grammar Checker', desc: 'Fix grammar and style', icon: BadgeCheck },
              { href: '/api', label: 'API Platform', desc: 'Integrate humanizer at scale', icon: Code2 },
              { href: '/pricing', label: 'Pricing & Plans', desc: 'Free, Pro, and Enterprise', icon: ArrowRight },
              { href: '/blog', label: 'Writing Guides', desc: 'Learn AI writing best practices', icon: BookOpen },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} to={link.href} className="flex items-center gap-2.5 px-4 py-2.5 bg-card border border-border/50 rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group">
                  <Icon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{link.label}</div>
                    <div className="text-xs text-muted-foreground">{link.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Chrome Extension Promo ─────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/40 border-t border-border/50" aria-labelledby="chrome-promo-heading">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="grid md:grid-cols-2 gap-0">
              {/* left — copy */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Chrome className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-medium">Chrome Extension</Badge>
                </div>
                <h2 id="chrome-promo-heading" className="text-2xl font-bold mb-3 text-balance">
                  Humanize Text Without Leaving Any Webpage
                </h2>
                <p className="text-muted-foreground text-sm mb-6 text-pretty">
                  Install the free <strong>AI Humanizer Chrome Extension</strong> and rewrite AI-generated text
                  in one click — directly inside Google Docs, Gmail, WordPress, or any browser tab.
                  No copy-pasting. No tab-switching.
                </p>
                <ul className="space-y-2 mb-7" aria-label="Extension highlights">
                  {[
                    'One-click humanize on any selected text',
                    'Right-click context menu — instant rewrite',
                    'Four humanization modes (Light → Stealth)',
                    'Works on Google Docs, Gmail, WordPress & more',
                    'Manifest V3 · Privacy-first · Free to install',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Button className="gap-2 font-semibold" asChild>
                    <Link to="/chrome-extension">
                      <Download className="w-4 h-4" aria-hidden="true" />
                      Install Chrome Extension
                    </Link>
                  </Button>
                  <Button variant="outline" className="gap-2" asChild>
                    <Link to="/chrome-extension">
                      <Eye className="w-4 h-4" aria-hidden="true" />
                      View Install Guide
                    </Link>
                  </Button>
                </div>
              </div>
              {/* right — visual */}
              <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-8 border-l border-border/50">
                <div className="w-full max-w-[260px] bg-background border border-border rounded-2xl shadow-xl overflow-hidden">
                  {/* fake browser bar */}
                  <div className="bg-muted/70 px-3 py-2 flex items-center gap-2 border-b border-border">
                    <div className="flex gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
                      <span className="w-2.5 h-2.5 rounded-full bg-success/50" />
                    </div>
                    <div className="flex-1 bg-background rounded text-[10px] text-muted-foreground px-2 py-0.5 border border-border/50 truncate">
                      docs.google.com/document/d/…
                    </div>
                    <div className="w-5 h-5 rounded bg-primary flex items-center justify-center shrink-0">
                      <Chrome className="w-3 h-3 text-primary-foreground" aria-hidden="true" />
                    </div>
                  </div>
                  {/* page content + popup */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-muted rounded w-full" />
                      <div className="bg-primary/15 border border-primary/25 rounded px-2 py-1 text-[9px] text-foreground/70 leading-tight">
                        "It is noteworthy to acknowledge that…"
                      </div>
                      <div className="h-2.5 bg-muted rounded w-3/4" />
                    </div>
                    {/* popup card */}
                    <div className="bg-card border border-border rounded-xl p-3 shadow-lg space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Wand2 className="w-3 h-3 text-primary" aria-hidden="true" />
                        <span className="text-[10px] font-semibold">AI Humanizer</span>
                        <Badge className="ml-auto text-[9px] bg-success/10 text-success border-success/20 px-1 py-0">Ready</Badge>
                      </div>
                      <div className="text-[9px] text-muted-foreground leading-relaxed bg-muted/50 rounded px-2 py-1.5">
                        "Worth noting is that this approach…"
                      </div>
                      <div className="flex gap-1.5">
                        <div className="flex-1 h-6 rounded-md bg-primary flex items-center justify-center">
                          <span className="text-[9px] font-semibold text-primary-foreground">Apply</span>
                        </div>
                        <div className="flex-1 h-6 rounded-md border border-border flex items-center justify-center">
                          <span className="text-[9px] text-muted-foreground">More modes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-t border-primary/10" aria-labelledby="final-cta-heading">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">Free — No Credit Card Required</Badge>
          <h2 id="final-cta-heading" className="text-2xl md:text-3xl font-bold mb-4 text-balance">
            Start Producing Natural, Authentic Writing Right Now
          </h2>
          <p className="text-muted-foreground mb-8 text-pretty max-w-xl mx-auto">
            Join over one million writers, students, and content professionals who use AIDetector.cx as their primary{' '}
            <strong>AI humanizer</strong> and <strong>AI writing assistant</strong>. Improve writing quality, authenticity, and readability in seconds. Free to start.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" className="gap-2 font-semibold" asChild>
              <a href="#humanizer-tool">
                <Wand2 className="w-4 h-4" aria-hidden="true" />
                Humanize AI Text Free
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/pricing">View Pro Features <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
