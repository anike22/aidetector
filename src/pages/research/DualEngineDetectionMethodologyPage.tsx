import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Activity, BookOpen, BrainCircuit, CheckCircle2, ChevronRight, CircleHelp, Layers3, Scale, ShieldCheck } from 'lucide-react';

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  "headline": "Dual-Engine AI Detection Methodology",
  "description": "A technical overview of how AIDetector.cx combines linguistic and statistical analysis, ensemble scoring, and language-aware calibration to assess text.",
  "author": { "@type": "Organization", "name": "AIDetector.cx Research Team" },
  "publisher": { "@type": "Organization", "name": "AIDetector.cx" },
  "mainEntityOfPage": "https://www.aidetector.cx/research/dual-engine-detection-methodology"
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What does dual-engine mean?", "acceptedAnswer": { "@type": "Answer", "text": "It describes two complementary analysis layers: linguistic analysis of writing structure and statistical analysis of measurable text patterns. Their signals are combined rather than treated as two independent verdicts." } },
    { "@type": "Question", "name": "Does the detector rely only on perplexity?", "acceptedAnswer": { "@type": "Answer", "text": "No. The methodology considers multiple linguistic and statistical features, including predictability, variation, repetition, lexical diversity, sentence patterns, and coherence." } },
    { "@type": "Question", "name": "Can the system make mistakes?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Human writing can be incorrectly flagged and AI-generated text can be missed. Scores are probabilistic signals and should be interpreted with context, not as proof of authorship." } },
    { "@type": "Question", "name": "Does every language receive identical calibration?", "acceptedAnswer": { "@type": "Answer", "text": "No. Language reliability and calibration can vary by language. The implementation includes language-aware handling, with dedicated calibration paths for some supported languages." } }
  ]
};

export default function DualEngineDetectionMethodologyPage() {
  return (
    <MainLayout>
      <PageMeta
        title="Dual-Engine AI Detection Methodology | AIDetector.cx Research"
        description="Explore the AIDetector.cx dual-engine methodology: linguistic pattern analysis, statistical signals, ensemble scoring, language-aware calibration, and known limitations."
        canonicalUrl="https://www.aidetector.cx/research/dual-engine-detection-methodology"
        schemas={[articleSchema, faqSchema]}
      />
      <article className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Home</Link><ChevronRight className="w-4 h-4 mx-2" />
          <Link to="/research" className="hover:text-primary">Research</Link><ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-foreground">Dual-Engine Detection Methodology</span>
        </nav>

        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">Technical methodology</span>
            <span className="text-sm text-muted-foreground">AIDetector.cx Research Team</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-navy mb-6">Dual-Engine AI Detection Methodology</h1>
          <p className="text-xl leading-relaxed text-muted-foreground">How complementary linguistic and statistical analysis layers are combined to assess whether a text contains patterns commonly associated with AI-generated writing—while accounting for uncertainty and the risk of false positives.</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-8">
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"><BrainCircuit className="w-6 h-6 text-primary shrink-0" /><span className="text-sm font-medium">Linguistic analysis</span></div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"><Activity className="w-6 h-6 text-primary shrink-0" /><span className="text-sm font-medium">Statistical analysis</span></div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"><Layers3 className="w-6 h-6 text-primary shrink-0" /><span className="text-sm font-medium">Ensemble calibration</span></div>
          </div>
        </header>

        <nav className="rounded-2xl border border-border bg-card p-6 mb-12" aria-label="Table of contents">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-primary" /> In this methodology</h2>
          <ol className="grid sm:grid-cols-2 gap-3 text-sm list-decimal list-inside text-muted-foreground">
            <li><a className="hover:text-primary hover:underline" href="#overview">Architecture overview</a></li>
            <li><a className="hover:text-primary hover:underline" href="#linguistic">Linguistic analysis layer</a></li>
            <li><a className="hover:text-primary hover:underline" href="#statistical">Statistical analysis layer</a></li>
            <li><a className="hover:text-primary hover:underline" href="#ensemble">Ensemble and calibration</a></li>
            <li><a className="hover:text-primary hover:underline" href="#interpretation">Interpreting results</a></li>
            <li><a className="hover:text-primary hover:underline" href="#limitations">Limitations and safeguards</a></li>
          </ol>
        </nav>

        <div className="prose prose-lg max-w-none prose-headings:text-navy prose-a:text-primary">
          <h2 id="overview">1. Architecture overview</h2>
          <p>AIDetector.cx uses two complementary analytical layers as part of a larger detection pipeline. The linguistic layer examines how ideas and sentences are expressed; the statistical layer measures distributional and repetition patterns in the text. An ensemble stage brings these signals together, followed by calibration and reliability handling.</p>
          <p>The high-level processing sequence is:</p>
          <ol>
            <li><strong>Language identification:</strong> determine the likely language and the confidence of that determination.</li>
            <li><strong>Preprocessing and normalization:</strong> prepare the submitted text for consistent analysis while retaining the writing characteristics needed by downstream stages.</li>
            <li><strong>Linguistic analysis:</strong> extract structural, lexical, syntactic, and discourse-related signals.</li>
            <li><strong>Statistical analysis:</strong> measure predictability, variation, repetition, n-gram uniqueness, and related distributional signals.</li>
            <li><strong>Ensemble scoring:</strong> combine feature groups and, where available and supported, an additional classifier signal.</li>
            <li><strong>Calibration:</strong> adjust the combined probability and confidence to account for language reliability and content type.</li>
          </ol>
          <p>The two layers are complementary, not two independent authorities issuing separate final verdicts. Their evidence is combined so that a single feature—such as sentence length or predictability—does not determine the result by itself.</p>

          <h2 id="linguistic">2. Linguistic analysis layer</h2>
          <p>The linguistic layer studies characteristics of the writing itself. It evaluates patterns across sentences and paragraphs rather than relying on a single keyword list or a simple count of grammatical features.</p>
          <h3>Signals considered</h3>
          <ul>
            <li><strong>Lexical diversity and repetition:</strong> how vocabulary is distributed and whether words or phrases recur unusually often.</li>
            <li><strong>Sentence structure:</strong> variation in sentence length and syntactic regularity.</li>
            <li><strong>Transitions and discourse flow:</strong> how predictably sentences and paragraphs connect.</li>
            <li><strong>Formulaic phrasing:</strong> recurring openings, endings, boilerplate expressions, and balanced constructions.</li>
            <li><strong>Paragraph structure:</strong> symmetry and repeated structural patterns across paragraphs.</li>
            <li><strong>Stylistic variation and editing signals:</strong> changes in expression and signs of coherent human revision.</li>
          </ul>
          <p>These signals are interpreted together. Formal, academic, legal, or technical writing can naturally be regular and structured, so regularity alone is not treated as proof of AI authorship.</p>

          <h2 id="statistical">3. Statistical analysis layer</h2>
          <p>The statistical layer measures patterns that can be quantified across the text. It complements the linguistic analysis by examining distributions and repetition at token, sentence, and phrase levels.</p>
          <ul>
            <li><strong>Token predictability:</strong> a text-level proxy for how predictable word sequences appear.</li>
            <li><strong>Burstiness and sentence variation:</strong> the degree to which sentence lengths vary rather than remaining uniform.</li>
            <li><strong>N-gram uniqueness:</strong> how often short sequences of words are repeated or reused.</li>
            <li><strong>Repetition density:</strong> the concentration of repeated words and phrases.</li>
            <li><strong>Vocabulary compression:</strong> how broadly or narrowly vocabulary is used relative to text length.</li>
            <li><strong>Coherence and editing signals:</strong> additional measures of continuity and variation across sentences.</li>
          </ul>
          <p>No single statistical measure can reliably identify authorship. Human writers can produce highly predictable text, and generated text can be edited to introduce substantial variation. Statistical features therefore contribute evidence to the ensemble rather than acting as a standalone test.</p>

          <h2 id="ensemble">4. Ensemble scoring and language-aware calibration</h2>
          <p>The ensemble stage combines grouped linguistic and statistical signals into an overall assessment. Sentence- and paragraph-level signals can also contribute to the combined score. When a supported classifier result is available, the implementation can blend that signal with the feature-based estimate using language-dependent weighting.</p>
          <h3>Content-aware weighting</h3>
          <p>Different writing contexts have different baseline characteristics. Academic, research, blog, email, creative, legal, technical, and other content types may therefore use different sensitivity and human-signal weighting. This helps avoid treating every writing genre as if it had the same natural structure.</p>
          <h3>Language-aware calibration</h3>
          <p>Calibration accounts for the detected language, language-identification confidence, and whether the language is supported by the relevant calibration path. The implementation includes dedicated calibration handling for Spanish and Arabic, alongside general language calibration and reliability factors. Calibration is important because the same raw feature values do not necessarily carry the same meaning across languages.</p>
          <h3>Confidence and disagreement</h3>
          <p>The system also considers disagreement among feature groups and variation in classifier signals when estimating confidence. A result near the decision boundary or with conflicting evidence should be interpreted more cautiously than a result where several independent signal groups point in the same direction.</p>

          <h2 id="interpretation">5. Interpreting a detection result</h2>
          <p>A detection score is an estimate based on observable text patterns. It is not a forensic identification of an author, a record of which application was used, or proof that a person violated a policy.</p>
          <ul>
            <li>Read the score alongside the confidence and any mixed or uncertain indicators shown in the report.</li>
            <li>Consider the document's language, length, genre, editing history, and context.</li>
            <li>For consequential decisions, review drafts, version history, notes, sources, and other relevant evidence.</li>
            <li>Do not use a detector score as the sole basis for academic, employment, or disciplinary action.</li>
          </ul>

          <h2 id="limitations">6. Limitations, safeguards, and ongoing evaluation</h2>
          <p>AI detection is an evolving classification problem. Models change, writing styles vary, and human editing can alter the signals a detector observes. Short passages provide less evidence than longer documents, and performance may differ across languages and subject areas.</p>
          <div className="not-prose rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 p-6 my-8">
            <h3 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2 mb-2"><ShieldCheck className="w-5 h-5" /> Responsible-use principle</h3>
            <p className="text-sm text-amber-900 dark:text-amber-100 m-0">A detector result should support informed review, not replace human judgment. False positives and false negatives remain possible, and no score should be presented as conclusive proof of authorship.</p>
          </div>
          <p>Methodology claims should be evaluated against reproducible tests on clearly labelled human-written and AI-generated samples. Useful reporting includes dataset composition, language and genre coverage, sample length, decision thresholds, precision, recall, false-positive rate, false-negative rate, and the date on which testing was performed. We do not publish a performance figure on this page because an architectural description alone is not an accuracy benchmark.</p>
          <p>For benchmark design and evaluation metrics, see <Link to="/research/ai-detection-accuracy-tests">AI Detection Accuracy Tests</Link>. For practical guidance on protecting legitimate human writing, see <Link to="/research/avoid-false-positives-institutional-ai-detectors">Avoiding False Positives in Institutional AI Detectors</Link>.</p>
        </div>

        <section className="mt-16 border-t border-border pt-12" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-3xl font-bold mb-8">Frequently asked questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div><h3 className="font-semibold mb-2 flex items-center gap-2"><CircleHelp className="w-4 h-4 text-primary" /> What does dual-engine mean?</h3><p className="text-sm text-muted-foreground">It refers to complementary linguistic and statistical analysis layers whose signals are combined into one assessment.</p></div>
            <div><h3 className="font-semibold mb-2 flex items-center gap-2"><CircleHelp className="w-4 h-4 text-primary" /> Is this just a perplexity test?</h3><p className="text-sm text-muted-foreground">No. Predictability is only one signal among many linguistic and statistical features.</p></div>
            <div><h3 className="font-semibold mb-2 flex items-center gap-2"><CircleHelp className="w-4 h-4 text-primary" /> Can human writing be flagged?</h3><p className="text-sm text-muted-foreground">Yes. Highly structured writing, language differences, and short samples can increase uncertainty or false-positive risk.</p></div>
            <div><h3 className="font-semibold mb-2 flex items-center gap-2"><CircleHelp className="w-4 h-4 text-primary" /> Does the system prove who wrote a text?</h3><p className="text-sm text-muted-foreground">No. It estimates patterns in text and cannot establish a writer's identity or intent.</p></div>
          </div>
        </section>

        <div className="mt-12 rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Research transparency note</p>
          <p className="m-0">This page describes the detection architecture represented in the AIDetector.cx source implementation. It is an explanatory methodology document, not a claim of independent certification or a substitute for a dated benchmark report. Implementation details may evolve; benchmark results should always be read with their dataset and test date.</p>
        </div>
      </article>
    </MainLayout>
  );
}
