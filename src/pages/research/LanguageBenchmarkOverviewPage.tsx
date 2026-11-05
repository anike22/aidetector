import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Activity, BookOpen, ChevronRight, CircleHelp, Languages, Scale, ShieldCheck } from 'lucide-react';

const canonicalUrl = 'https://www.aidetector.cx/research/language-benchmark-overview';

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  headline: "Multilingual AI Detection Benchmark: Language Coverage, Accuracy and Evaluation",
  description: "A research guide to multilingual AI text detection, language coverage, false positives, benchmark design and how to compare GPTZero, Copyleaks, Originality.ai, Turnitin and other AI detectors.",
  author: { "@type": "Organization", name: "AIDetector.cx Research Team" },
  publisher: { "@type": "Organization", name: "AIDetector.cx" },
  mainEntityOfPage: canonicalUrl,
  datePublished: "2026-11-05",
  dateModified: "2026-11-05",
  inLanguage: "en"
};

const faqItems = [
  { q: "What is a multilingual AI detector?", a: "A multilingual AI detector analyzes writing in more than one language to estimate whether text contains patterns associated with AI-generated writing. Language support does not guarantee equal accuracy in every language." },
  { q: "Which AI detector supports the most languages?", a: "Published language counts vary by vendor and by feature. Copyleaks documents 30 AI detection languages, Originality.ai documents 31, and other providers publish different lists. Counts should be checked against current official documentation and should not be treated as a performance ranking." },
  { q: "Is AI detection equally accurate in every language?", a: "No. Performance can vary with language, dialect, script, genre, text length, model family, and the amount and quality of evaluation data. A detector should be evaluated separately for each language it claims to support." },
  { q: "Does language support mean the detector has been benchmarked in that language?", a: "Not necessarily. A language may be accepted by a product without a public, language-specific benchmark. Look for documented sample sizes, verified labels, false-positive rates, recall, precision, and test dates." },
  { q: "Can AI detectors identify AI writing in Arabic, Spanish, Chinese or French?", a: "Several vendors publish support for some or all of these languages, but exact coverage differs. Confirm the current language list for the specific product and feature before relying on a result." },
  { q: "Why do AI detectors flag human writing in a second language?", a: "Formal grammar, translation, editing assistance, short samples, formulaic assignments, and language-specific writing conventions can overlap with patterns a detector associates with generated text. This is one reason false-positive rates must be measured by language." },
  { q: "What is the difference between language coverage and language accuracy?", a: "Coverage describes which languages a product accepts or claims to process. Accuracy describes how well it classifies correctly labelled examples under a defined test. Coverage is a capability statement; accuracy is an empirical result." },
  { q: "Can an AI detector prove who wrote a document?", a: "No. A detector estimates patterns in submitted text. It cannot establish a person's identity, intent, or authorship history, and its result should not be used as the sole basis for a high-stakes decision." }
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a }
  }))
};

export default function LanguageBenchmarkOverviewPage() {
  return (
    <MainLayout>
      <PageMeta
        title="Multilingual AI Detector Benchmark: Language Support & Accuracy | AIDetector.cx"
        description="Compare multilingual AI detector language support, benchmark quality and false-positive risks. Research GPTZero, Copyleaks, Originality.ai, Turnitin and more."
        canonicalUrl={canonicalUrl}
        schemas={[articleSchema, faqSchema]}
      />
      <article className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Home</Link><ChevronRight className="w-4 h-4 mx-2" />
          <Link to="/research" className="hover:text-primary">Research</Link><ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-foreground">Language Benchmark Overview</span>
        </nav>

        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold">Multilingual AI detection research</span>
            <span className="text-sm text-muted-foreground">AIDetector.cx Research Team · Updated November 5, 2026</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-navy mb-6">Multilingual AI Detector Benchmark: Language Support, Accuracy and Evaluation</h1>
          <p className="text-xl leading-relaxed text-muted-foreground">A practical research framework for understanding how AI writing detectors perform across languages, why a supported-language list is not an accuracy guarantee, and how to compare tools without confusing marketing claims with reproducible evidence.</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-8">
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"><Languages className="w-6 h-6 text-primary shrink-0" /><span className="text-sm font-medium">Language coverage</span></div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"><Activity className="w-6 h-6 text-primary shrink-0" /><span className="text-sm font-medium">Benchmark quality</span></div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"><Scale className="w-6 h-6 text-primary shrink-0" /><span className="text-sm font-medium">Fair comparison</span></div>
          </div>
        </header>

        <figure className="mb-12 overflow-hidden rounded-2xl border border-border bg-card">
          <img src="/images/language-benchmark-framework.svg" alt="Illustration of multilingual AI detection evaluation across language samples, benchmark metrics and review stages" className="w-full h-auto" loading="eager" />
          <figcaption className="px-5 py-3 text-sm text-muted-foreground">A responsible multilingual benchmark separates language coverage, dataset quality, classification metrics and human review.</figcaption>
        </figure>

        <nav className="rounded-2xl border border-border bg-card p-6 mb-12" aria-label="Table of contents">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-primary" /> In this research overview</h2>
          <ol className="grid sm:grid-cols-2 gap-3 text-sm list-decimal list-inside text-muted-foreground">
            <li><a className="hover:text-primary hover:underline" href="#what-is-multilingual">What multilingual detection means</a></li>
            <li><a className="hover:text-primary hover:underline" href="#why-language-matters">Why language changes results</a></li>
            <li><a className="hover:text-primary hover:underline" href="#benchmark-design">How to design a benchmark</a></li>
            <li><a className="hover:text-primary hover:underline" href="#metrics">Metrics that matter</a></li>
            <li><a className="hover:text-primary hover:underline" href="#competitors">AI detector language comparison</a></li>
            <li><a className="hover:text-primary hover:underline" href="#false-positives">False positives and fairness</a></li>
            <li><a className="hover:text-primary hover:underline" href="#checklist">Buyer and evaluator checklist</a></li>
            <li><a className="hover:text-primary hover:underline" href="#limitations">Limitations and conclusions</a></li>
          </ol>
        </nav>

        <div className="prose prose-lg max-w-none prose-headings:text-navy prose-a:text-primary">
          <h2 id="what-is-multilingual">1. What is multilingual AI text detection?</h2>
          <p>A multilingual AI detector is a text-classification system designed to assess writing in more than one language. It looks for statistical, linguistic or learned patterns that may be associated with text generated by large language models. Depending on the product, it may identify a likely language automatically, ask the user to select one, or apply a language-specific model or calibration path.</p>
          <p>The phrase <strong>multilingual AI detection</strong> is often used as if it describes one uniform capability. In practice, it can mean several different things: the interface accepts multiple languages; the detector has been trained or adapted for multiple languages; the service has been evaluated on labelled examples in those languages; or the vendor publishes language-by-language performance results. Those are not interchangeable claims.</p>
          <p>A product can accept a French or Arabic document and return a score without publishing evidence that the score is equally reliable in French or Arabic. A stronger technical claim requires a defined evaluation set, trustworthy labels, a stated threshold, and language-specific reporting. A useful AI detector language benchmark therefore asks not only, “Can I submit this language?” but also, “What evidence shows that the result is dependable for this language and this kind of writing?”</p>
          <p>This distinction matters to universities, publishers, agencies, researchers and multilingual teams. A false positive can unfairly cast doubt on human work. A false negative can allow generated text to pass unnoticed. Both errors can become more common when a detector is applied to languages, dialects or writing genres that were not adequately represented during evaluation.</p>

          <h2 id="why-language-matters">2. Why language matters when evaluating AI detectors</h2>
          <p>Languages differ in morphology, word order, tokenization, punctuation, script, idiom and the way ideas are conventionally organized. Even within one language, regional varieties and registers can produce very different writing patterns. A detector trained or calibrated mainly on English cannot automatically be assumed to interpret these patterns correctly in every other language.</p>
          <h3>Tokenization and morphology</h3>
          <p>Some languages express grammatical information through word endings or attached particles. Others use scripts without spaces between words, or combine characters in ways that affect token boundaries. A statistical feature that counts repeated word sequences or estimates predictability may behave differently when tokenization differs. If a model's preprocessing is not suited to a language, its measured signals may be noisy before classification even begins.</p>
          <h3>Dialect, register and code-switching</h3>
          <p>Formal Modern Standard Arabic, regional Arabic varieties, conversational Spanish, academic French and code-switched English–Hindi are not equivalent test conditions. A short mixed-language passage can confuse automatic language identification. A document that contains quotations, technical terms or bilingual references may also produce a different result from a document written consistently in one language. Benchmark reports should disclose whether such material was included, excluded or evaluated as a separate category.</p>
          <h3>Translation and second-language writing</h3>
          <p>Human writing produced by a second-language speaker may contain regular sentence patterns, repeated vocabulary or unusually formal phrasing. Translation software and grammar assistance can further change surface features without changing the underlying authorship. Those patterns may overlap with features used by AI writing detectors. This is why a multilingual benchmark should deliberately include legitimate human writing from different proficiency levels and not rely only on polished native-speaker prose.</p>
          <h3>Generative models are multilingual too</h3>
          <p>Modern language models can generate, translate and revise content in many languages. Their output patterns can differ by model, prompt, language and task. A benchmark based on one model family or one type of prompt may not represent the wider range of AI-generated writing that users encounter. Repeated evaluation is needed as both generative models and detector versions change.</p>

          <h2 id="benchmark-design">3. How to design a reliable multilingual AI detection benchmark</h2>
          <p>A credible benchmark begins with a clear question. Is it testing whether a detector can distinguish fully human-written from fully AI-generated text? Is it testing mixed documents where human and AI passages are combined? Is it testing paraphrased or translated material? These tasks should not be collapsed into one headline score because they measure different failure modes.</p>
          <h3>Build a balanced, language-stratified dataset</h3>
          <p>Each language should have enough human and AI examples to make the results interpretable. The benchmark should report the number of documents in each class and language, rather than giving only one overall sample count. A large English sample cannot compensate for a handful of examples in another language. If a language has too few verified samples, the correct conclusion is that evidence is limited—not that performance is equivalent to the best-tested language.</p>
          <p>Human-written examples should come from legitimate sources and cover multiple genres: essays, reports, articles, professional correspondence, technical explanations and other relevant forms. The collection process should preserve provenance and permissions. AI-written examples should record the model family, model version where known, prompt type, generation date and any editing applied. If a benchmark uses public datasets, it should describe their licences, collection criteria and known limitations.</p>
          <h3>Prevent contamination and duplicate leakage</h3>
          <p>Evaluation examples should be kept separate from any data used to develop or tune the detector. Near-duplicate passages, copied source material and repeated prompts can make a benchmark look stronger than it is. Researchers should check for duplicate or overlapping content and document how train, validation and test samples were separated. Where feasible, tests should include model versions or source domains that were not used during development.</p>
          <h3>Test the conditions users actually face</h3>
          <p>Text length, genre, topic, editing and language proficiency all influence the difficulty of classification. A benchmark should include short and long samples, formal and informal writing, human-edited AI content, AI-assisted translation, and mixed-authorship documents when those scenarios matter to the intended users. Results should be broken down by these conditions instead of hiding them inside one average.</p>
          <h3>Freeze versions and record dates</h3>
          <p>AI detectors can change without a visible interface change. A reproducible report records the product name, model or version identifier when available, scan date, settings, thresholds and test procedure. A comparison conducted months apart may not be a fair head-to-head comparison if one or more vendors have updated their systems. A benchmark should be treated as a dated snapshot, not a permanent ranking.</p>

          <h2 id="metrics">4. Metrics that matter: accuracy is not enough</h2>
          <p>Searches for <strong>AI detector accuracy</strong> often lead to a single percentage. That number is difficult to interpret without knowing the dataset balance, decision threshold and types of errors. For multilingual AI detection, report several metrics and show them separately for each language.</p>
          <ul>
            <li><strong>Accuracy:</strong> the share of all tested documents classified correctly. It can be misleading when one class is much more common than another.</li>
            <li><strong>Precision:</strong> among documents flagged as AI-generated, the share that truly belongs to the AI class. Low precision means more false accusations.</li>
            <li><strong>Recall or sensitivity:</strong> among genuinely AI-generated samples, the share the detector identifies. Low recall means more AI writing is missed.</li>
            <li><strong>Specificity:</strong> among human-written samples, the share correctly identified as human-written.</li>
            <li><strong>False-positive rate:</strong> the share of human-written samples incorrectly flagged as AI-generated. This deserves special attention in education and employment contexts.</li>
            <li><strong>False-negative rate:</strong> the share of AI-generated samples incorrectly classified as human-written.</li>
            <li><strong>F1 score:</strong> a combined measure of precision and recall. It is useful, but it does not replace the individual metrics.</li>
            <li><strong>Calibration:</strong> whether confidence scores correspond meaningfully to observed outcomes. A score of 80 should not be assumed to mean an 80% probability unless calibration evidence supports that interpretation.</li>
          </ul>
          <p>Thresholds also matter. A detector tuned to flag more AI content may increase recall while increasing false positives. A conservative threshold may reduce false accusations while missing more generated content. Neither setting is universally best. A fair comparison should disclose the operating threshold and show the trade-off rather than presenting only the metric that makes a product look strongest.</p>
          <p>For more detail on evaluation design, see the AIDetector.cx <Link to="/research/ai-detection-accuracy-tests">AI Detection Accuracy Tests</Link> overview. For the system architecture and how linguistic and statistical signals can be combined, read the <Link to="/research/dual-engine-detection-methodology">Dual-Engine Detection Methodology</Link>.</p>

          <h2 id="competitors">5. Multilingual AI detector comparison: what vendors publish</h2>
          <p>The table below is a documentation comparison, not a live head-to-head performance ranking. It summarizes public vendor statements located for this review. Language counts and product capabilities can change. A supported-language count does not tell you the false-positive rate, recall or calibration quality in each language.</p>
          <div className="not-prose overflow-x-auto my-8">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-muted/70 text-left"><th className="p-3 border border-border">AI detector</th><th className="p-3 border border-border">Public language information</th><th className="p-3 border border-border">What to verify before relying on it</th></tr></thead>
              <tbody>
                <tr><td className="p-3 border border-border font-semibold">GPTZero</td><td className="p-3 border border-border">Publishes multilingual research covering more than 20 languages and a 24-language benchmark in its published research.</td><td className="p-3 border border-border">Check the dataset, vendor-reported nature of the benchmark, current model version and language-specific false-positive results.</td></tr>
                <tr><td className="p-3 border border-border font-semibold">Copyleaks AI Detector</td><td className="p-3 border border-border">Its official API documentation lists 30 AI text detection languages. Its AI Logic explanations are documented for a smaller subset of six languages.</td><td className="p-3 border border-border">Separate detection availability from explanation availability; review metrics for the exact language and use case.</td></tr>
                <tr><td className="p-3 border border-border font-semibold">Originality.ai</td><td className="p-3 border border-border">Its help documentation describes AI detection in 31 languages and automatic language identification in its current models.</td><td className="p-3 border border-border">Ask for current language-level evaluation evidence, model version and performance on mixed or edited content.</td></tr>
                <tr><td className="p-3 border border-border font-semibold">Turnitin AI Writing Detection</td><td className="p-3 border border-border">Its current guidance lists English, Spanish, Japanese, Arabic, German, Dutch and Turkish for AI writing reports.</td><td className="p-3 border border-border">Confirm the institution's enabled product, supported language, minimum qualifying prose and report limitations.</td></tr>
                <tr><td className="p-3 border border-border font-semibold">Winston AI</td><td className="p-3 border border-border">Its help documentation publishes a language list for AI text detection, including English, Spanish, French, German, Arabic, Japanese, Korean and others.</td><td className="p-3 border border-border">Check the current supported list and request language-specific results rather than relying on an overall accuracy claim.</td></tr>
                <tr><td className="p-3 border border-border font-semibold">ZeroGPT and other online detectors</td><td className="p-3 border border-border">Public feature descriptions and language claims should be checked against the exact product version and official documentation.</td><td className="p-3 border border-border">Do not infer multilingual reliability from a free scan page or from a general statement that multiple languages are accepted.</td></tr>
              </tbody>
            </table>
          </div>
          <p>These products are useful search comparators because users commonly look for GPTZero alternatives, Copyleaks multilingual detection, Originality.ai language support, Turnitin AI detector languages and Winston AI language coverage. The correct buying question is not simply which vendor lists the largest number. It is whether the vendor can show relevant, current evidence for the language, genre and decision you care about.</p>
          <p>For example, Copyleaks distinguishes its 30-language AI detection capability from AI Logic explanations available in six languages. Turnitin's AI Writing Report has qualifying-text and language requirements. Originality.ai describes broad language support, while GPTZero publishes its own multilingual benchmark research. Each statement describes a different product detail; they should not be merged into one league table or interpreted as independently verified comparative accuracy.</p>

          <h2 id="false-positives">6. False positives, fairness and responsible use</h2>
          <p>A false positive occurs when human-written text is classified as AI-generated. In multilingual settings, the risk deserves deliberate attention because writing conventions, educational backgrounds and language proficiency can vary substantially. A detector that performs well on polished English articles may behave differently on a translated paragraph, a formal student essay or a regional language variety.</p>
          <p>Institutions should not use an AI detector score as the sole basis for a disciplinary decision. A result is one signal that may justify a conversation or closer review; it is not proof of misconduct. Reviewers should consider drafts, version history, source notes, assignment context, a student's explanation and the institution's published policy. The person whose work is being reviewed should have a fair opportunity to respond.</p>
          <p>Publishers and content teams should also avoid treating a detector as a substitute for editorial review. A high score does not establish that a text is inaccurate, plagiarized or low quality. A low score does not establish originality or factual correctness. AI detection, plagiarism checking, citation verification and editorial quality review answer different questions and should remain distinct.</p>
          <p>For a practical discussion of the causes of misclassification and fair review processes, see <Link to="/research/avoid-false-positives-institutional-ai-detectors">Avoid False Positives in Institutional AI Detectors</Link>. Teams should document how scores are used, who can see them, how long submitted text is retained and how a person can challenge an automated result.</p>

          <h2 id="checklist">7. Checklist for choosing a multilingual AI detector</h2>
          <p>Before choosing an AI writing detector for a multilingual workflow, ask vendors and internal evaluators the following questions. The answers should be specific to the product, language and task rather than general marketing statements.</p>
          <ol>
            <li><strong>Is my exact language supported?</strong> Confirm the language and script, including regional or mixed-language content where relevant.</li>
            <li><strong>Is there a language-specific benchmark?</strong> Request the sample count, class balance, source provenance and test date for each language.</li>
            <li><strong>Are false positives reported separately?</strong> A low overall error rate can conceal a problem in one language or user group.</li>
            <li><strong>Are precision and recall both available?</strong> A detector should not present high recall without showing the false-positive trade-off.</li>
            <li><strong>What text length is required?</strong> Short passages contain less evidence and may be outside the product's recommended range.</li>
            <li><strong>Does the benchmark include realistic writing?</strong> Include academic, professional, informal, translated, edited and mixed-authorship samples as appropriate.</li>
            <li><strong>Which models and versions were tested?</strong> Record detector version, AI model family, generation date and editing procedure.</li>
            <li><strong>Can results be reviewed and challenged?</strong> Users should understand what a score means and what it cannot prove.</li>
            <li><strong>How is submitted content handled?</strong> Check retention, access controls, training use, deletion options and contractual privacy terms.</li>
            <li><strong>How often is performance re-evaluated?</strong> A multilingual benchmark should be repeated when models, language support or intended uses change.</li>
          </ol>
          <p>A useful procurement exercise is to create a small, permissioned evaluation set drawn from your real workflow. Include verified human writing and generated text for every language that matters. Keep a holdout set that the vendor has not used for tuning, agree on a decision threshold before testing, and compare the results using the same metric definitions. If the vendor cannot support a controlled evaluation, record that as an evidence gap rather than assuming the tool is reliable.</p>

          <h2 id="limitations">8. What this overview can—and cannot—tell you</h2>
          <p>This page compares publicly documented language coverage and explains how to evaluate multilingual AI detectors. It does not claim that one vendor is the most accurate, and it does not publish a new independent head-to-head benchmark. No new detector scans or controlled test corpus were created for this overview. Vendor-published language counts are attributed to the vendors and should be checked again before procurement or policy decisions.</p>
          <p>There are additional limits to any benchmark. A dataset can become stale as language models and detector versions change. A benchmark may over-represent one genre, country, educational level or model family. Human labels can be wrong or ambiguous, especially when text has been edited collaboratively. Results from different studies cannot be directly compared if their samples, thresholds, metrics or test dates differ.</p>
          <p>The best multilingual AI detector is therefore not necessarily the tool with the longest language list or the largest advertised accuracy percentage. It is the tool with transparent evidence that matches your language, content type, risk tolerance and review process. If that evidence is unavailable, treat the result as uncertain and use human judgment.</p>
          <p>Our broader research collection covers <Link to="/research">AI detection research</Link>, benchmark interpretation and the methodology behind text analysis. The goal is to make detector claims easier to evaluate—not to replace careful review with a single score.</p>
        </div>

        <section className="mt-16 border-t border-border pt-12" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-3xl font-bold mb-8">Frequently asked questions about multilingual AI detection</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqItems.map(({ q, a }) => <div key={q}><h3 className="font-semibold mb-2 flex items-start gap-2"><CircleHelp className="w-4 h-4 text-primary mt-1 shrink-0" />{q}</h3><p className="text-sm text-muted-foreground">{a}</p></div>)}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-border bg-card p-6" aria-labelledby="sources-title">
          <h2 id="sources-title" className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Vendor documentation and further reading</h2>
          <ul className="text-sm space-y-2">
            <li><a href="https://gptzero.me/news/gptzero-ai-detection-benchmarking-the-industry-standard-in-accuracy-transparency-and-fairness" target="_blank" rel="noopener noreferrer">GPTZero: AI detection benchmarking and multilingual research</a></li>
            <li><a href="https://docs.copyleaks.com/reference/actions/miscellaneous/ai-detection-supported-languages/" target="_blank" rel="noopener noreferrer">Copyleaks: Official AI detection supported-language list</a></li>
            <li><a href="https://help.originality.ai/en/article/multiple-languages-how-to-use-multi-language-ai-detection-13e5plo/" target="_blank" rel="noopener noreferrer">Originality.ai: Multiple languages</a></li>
            <li><a href="https://guides.turnitin.com/hc/en-us/articles/28234943089933-File-requirements-for-an-AI-Writing-Report" target="_blank" rel="noopener noreferrer">Turnitin: AI Writing Report file and language requirements</a></li>
            <li><a href="https://help.gowinston.ai/getting-started/which-languages-does-winston-ai-work-with" target="_blank" rel="noopener noreferrer">Winston AI: Supported AI detection languages</a></li>
          </ul>
        </section>

        <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Research transparency note</p>
          <p className="m-0">This is a documentation review and evaluation framework, not an independent product certification or a new accuracy test. Competitor capabilities are summarized from linked official documentation reviewed on November 5, 2026. Vendors may update supported languages, models and features after this date. Always consult the linked source before making a purchasing or policy decision.</p>
        </div>
      </article>
    </MainLayout>
  );
}
