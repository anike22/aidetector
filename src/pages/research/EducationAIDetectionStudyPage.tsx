import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { BookOpen, ClipboardCheck, GraduationCap, Scale, ShieldCheck } from 'lucide-react';

const studySchema = {
  "@context": "https://schema.org",
  "@type": "ResearchProject",
  "name": "Evaluating AI Detection in Student Writing",
  "description": "A transparent evaluation protocol for assessing AIDetector on human-written, AI-generated and AI-assisted student writing.",
  "url": "https://www.aidetector.cx/research/education-ai-detection-study",
  "funder": { "@type": "Organization", "name": "AIDetector.cx" },
  "keywords": ["AI detection", "student writing", "false positives", "academic integrity", "research methodology"]
};

export default function EducationAIDetectionStudyPage() {
  return (
    <MainLayout>
      <PageMeta
        title="AI Detection in Student Writing: Research Study | AIDetector.cx"
        description="Read AIDetector.cx's transparent education research protocol for evaluating human-written, AI-generated and AI-assisted student writing, including false-positive safeguards and reporting methods."
        canonicalUrl="https://www.aidetector.cx/research/education-ai-detection-study"
        ogType="article"
        schemas={[studySchema]}
      />
      <article className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/research" className="hover:text-primary">Research</Link> / <span className="text-foreground">Education AI Detection Study</span>
        </nav>
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-sm font-semibold">Protocol published · Results not yet available</span>
            <span className="text-sm text-muted-foreground">AIDetector.cx Research Team · 2026</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-navy mb-6">Evaluating AI Detection in Student Writing</h1>
          <p className="text-xl leading-relaxed text-muted-foreground">A transparent evaluation plan to measure how AIDetector handles human-written, AI-generated and AI-assisted student work—and how often it gets those judgments wrong.</p>
          <p className="mt-5 text-sm text-muted-foreground">This page publishes the study protocol, not a claim of completed testing. No accuracy, precision, recall or false-positive results are reported until the dataset has been assembled, evaluated and independently checked.</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-8">
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"><GraduationCap className="w-6 h-6 text-primary shrink-0" /><span className="text-sm font-medium">Student-writing focus</span></div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"><Scale className="w-6 h-6 text-primary shrink-0" /><span className="text-sm font-medium">False-positive analysis</span></div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"><ShieldCheck className="w-6 h-6 text-primary shrink-0" /><span className="text-sm font-medium">Transparent limitations</span></div>
          </div>
        </header>
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 mb-10">
          <h2 className="font-bold text-amber-950 mb-2">Current study status</h2>
          <p className="text-amber-950">Protocol defined. Dataset selection, permissions review and detector evaluation are pending. This page deliberately contains no fabricated participants, customer names, sample counts or performance figures.</p>
        </div>
        <nav className="rounded-2xl border border-border bg-card p-6 mb-12" aria-label="Table of contents">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5 text-primary" /> Study sections</h2>
          <ol className="grid sm:grid-cols-2 gap-3 text-sm list-decimal list-inside text-muted-foreground">
            <li><a href="#questions" className="hover:text-primary">Research questions</a></li>
            <li><a href="#sample" className="hover:text-primary">Dataset and sample selection</a></li>
            <li><a href="#procedure" className="hover:text-primary">Testing procedure</a></li>
            <li><a href="#metrics" className="hover:text-primary">Evaluation measures</a></li>
            <li><a href="#error-review" className="hover:text-primary">False-positive review</a></li>
            <li><a href="#ethics" className="hover:text-primary">Privacy and academic safeguards</a></li>
            <li><a href="#reporting" className="hover:text-primary">Results and reproducibility</a></li>
            <li><a href="#limitations" className="hover:text-primary">Limitations</a></li>
          </ol>
        </nav>
        <div className="prose prose-lg max-w-none prose-headings:text-navy prose-a:text-primary">
          <h2 id="questions">1. Research questions</h2>
          <ul>
            <li>How often does AIDetector classify human-authored student writing as AI-generated?</li>
            <li>How often does it identify AI-generated writing under the tested conditions?</li>
            <li>How do outcomes differ between Balanced and Aggressive detection modes?</li>
            <li>How does performance change for AI-assisted or substantially edited writing?</li>
            <li>Do results vary by language, genre, essay length or other documented sample characteristics?</li>
          </ul>
          <h2 id="sample">2. Dataset and sample selection</h2>
          <p>The evaluation will use public research datasets only where the licence and documentation permit the intended analysis. Dataset names, source links, licence terms, collection dates, language, writing task, sample counts and known limitations will be published before results are interpreted.</p>
          <p>Human-authored samples must have documented provenance. AI-generated samples must record the generating model, prompt or task, generation date and any editing applied. AI-assisted samples will be kept as a separate group rather than silently mixed with fully human or fully generated text.</p>
          <p>Samples will be screened for duplicates and near-duplicates. Where a dataset contains multiple essays from one author or prompt, grouping will be preserved when creating evaluation splits to reduce leakage. The final report will disclose exclusions and the number of usable samples in each class; no sample size is claimed at this protocol stage.</p>
          <h2 id="procedure">3. Testing procedure</h2>
          <ol>
            <li>Freeze and document the detector version, configuration and test date before running the evaluation.</li>
            <li>Prepare a held-out evaluation set that was not used to tune thresholds or calibrate the detector.</li>
            <li>Submit each eligible sample using the same documented input rules and record the raw output, mode, score, verdict and any confidence or warning fields the product exposes.</li>
            <li>Run Balanced and Aggressive modes separately. Do not combine their results or select the better result after seeing the labels.</li>
            <li>Keep text preprocessing consistent with normal product use and record any truncation, language detection or minimum-length exclusions.</li>
            <li>Repeat only where the product is stochastic or operationally variable; report repeat policy and variability rather than discarding inconvenient runs.</li>
          </ol>
          <h2 id="metrics">4. Evaluation measures</h2>
          <p>For each mode and dataset group, the report will publish the confusion matrix and define the positive class explicitly. Assuming “AI-generated” is the positive class:</p>
          <ul>
            <li><strong>False-positive rate:</strong> human-written samples incorrectly flagged as AI-generated, divided by all human-written samples.</li>
            <li><strong>False-negative rate:</strong> AI-generated samples incorrectly treated as human-written, divided by all AI-generated samples.</li>
            <li><strong>Precision:</strong> the proportion of samples flagged as AI-generated that are actually AI-generated in this evaluation set.</li>
            <li><strong>Recall (sensitivity):</strong> the proportion of AI-generated samples correctly identified.</li>
            <li><strong>Specificity:</strong> the proportion of human-written samples correctly treated as not AI-generated.</li>
            <li><strong>Accuracy and balanced accuracy:</strong> reported together, because class imbalance can make raw accuracy misleading.</li>
          </ul>
          <p>Where score outputs support it, calibration and threshold behaviour will also be examined. Results will include denominators and confidence intervals; a single headline percentage will not be presented without the underlying sample counts.</p>
          <h2 id="error-review">5. False-positive and false-negative review</h2>
          <p>Every observed false positive in the evaluation set will be retained in the error analysis. Reviewers will examine whether errors cluster around short essays, formulaic academic language, quotations, non-native writing, heavily edited text, particular genres or language groups. These are hypotheses to investigate, not assumed causes.</p>
          <p>False negatives will be reviewed as well, including paraphrased, lightly edited and mixed-origin writing where the dataset supports reliable labels. No example will be described as misconduct. A detector result alone cannot establish authorship, intent or a breach of academic policy.</p>
          <h2 id="ethics">6. Privacy and academic safeguards</h2>
          <ul>
            <li>Do not collect names, student IDs, school identifiers, grades or other unnecessary personal information.</li>
            <li>Use only datasets whose terms permit the planned processing and publication of aggregate findings.</li>
            <li>Do not upload confidential student work or personally identifiable material to a public detector.</li>
            <li>Do not use evaluation outputs to accuse, discipline or make high-stakes decisions about individual students.</li>
            <li>Publish limitations prominently and explain that AI detection is probabilistic, can be wrong and is not proof of authorship.</li>
          </ul>
          <h2 id="reporting">7. Results and reproducibility</h2>
          <p>When testing is complete, this page will be updated with dataset citations, version and date of the detector, inclusion and exclusion counts, sample characteristics, confusion matrices, metrics by mode and subgroup, error examples with identifying details removed, and a downloadable machine-readable results table where licensing permits.</p>
          <p>Any change to the dataset, threshold, detector version or analysis plan after results are seen will be disclosed. Results from a development set will be clearly separated from results on the held-out evaluation set.</p>
          <h2 id="limitations">8. Limitations</h2>
          <p>Public datasets may not represent current student writing, every educational level, language, subject or AI tool. Dataset labels can be imperfect, and performance measured on one collection may not transfer to another institution or assignment. AI writing tools and student editing practices change over time. Even a well-designed benchmark cannot establish whether a particular student used AI.</p>
          <p>For academic decisions, educators should consider drafts, notes, assignment context, student discussion and institutional policy. AIDetector should be treated as one fallible signal for further review—not as an authorship verifier or disciplinary decision-maker.</p>
        </div>
        <section className="mt-12 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-start gap-4">
            <ClipboardCheck className="w-7 h-7 text-primary shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-navy mb-2">Next research milestone</h2>
              <p className="text-muted-foreground">Select and document eligible public datasets, complete a permissions review, freeze the detector version and publish the evaluation set description before running any tests.</p>
              <p className="text-sm text-muted-foreground mt-3">Related reading: <Link to="/research/dual-engine-detection-methodology">Dual-Engine Detection Methodology</Link>.</p>
            </div>
          </div>
        </section>
      </article>
    </MainLayout>
  );
}
