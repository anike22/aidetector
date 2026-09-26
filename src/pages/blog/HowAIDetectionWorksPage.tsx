import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import {
  ShieldCheck,
  ChevronRight,
  Users,
  BookOpen,
  Brain,
  Activity,
  Gauge,
  Search,
  AlertTriangle,
  Layers,
  Cpu,
  Binary,
  Compass,
  CheckCircle2,
  FileText,
  Sliders,
  Scale,
  Sparkles,
  BookMarked,
  KeyRound,
  Database,
  Globe2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HowAIDetectionWorksPage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "How AI Detection Works: Methods, Metrics & Limits",
    "description": "Learn how AI text detectors use classifiers and statistical signals, how detection scores are evaluated, and why false positives and false negatives occur.",
    "author": {
      "@type": "Organization",
      "name": "AIDetector.cx Editorial & Research Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AIDetector.cx",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.aidetector.cx/brand/aidetector-icon.png"
      }
    },
    "datePublished": "2026-06-01",
    "dateModified": "2026-06-01",
    "mainEntityOfPage": "https://www.aidetector.cx/guides/how-ai-detection-works"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What does an AI detection score actually measure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An AI detection score measures the statistical similarity between a sample text and the expected probability distribution of machine-generated text. It estimates likelihood based on learned or heuristic patterns, but does not provide mathematical proof of authorship or intent."
        }
      },
      {
        "@type": "Question",
        "name": "Are AI detector scores calibrated Bayesian probabilities?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Detector outputs are frequently uncalibrated heuristic scores or raw model logits. Unless explicitly calibrated using techniques like temperature scaling or Platt scaling against target distributions, a score of 80% cannot be interpreted as an 80% true probability of machine generation."
        }
      },
      {
        "@type": "Question",
        "name": "What is perplexity in AI text detection?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Perplexity quantifies how surprised a reference language model is by a sequence of words. Machine-generated text often exhibits lower perplexity because models sample probable tokens, whereas human writing typically shows greater variability."
        }
      },
      {
        "@type": "Question",
        "name": "Why do detectors produce false positives on non-native English writing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Non-native English writers frequently employ standardized syntax, constrained vocabulary, and predictable grammatical structures. Because these stylistic choices reduce text perplexity, heuristic detectors can mistakenly classify human essays as machine-generated."
        }
      },
      {
        "@type": "Question",
        "name": "How do watermarking techniques differ from post-hoc AI detection?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Watermarking modifies the generation process by biasing token selections with pseudo-random green lists during synthesis. Post-hoc detection analyzes arbitrary unwatermarked text after generation using statistical metrics and neural classifiers."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.aidetector.cx/" },
      { "@type": "ListItem", "position": 2, "name": "Guides", "item": "https://www.aidetector.cx/guides" },
      { "@type": "ListItem", "position": 3, "name": "How AI Detection Works", "item": "https://www.aidetector.cx/guides/how-ai-detection-works" }
    ]
  };

  return (
    <MainLayout>
      <PageMeta
        title="How AI Detection Works: Methods, Metrics & Limits"
        description="Learn how AI text detectors use classifiers and statistical signals, how detection scores are evaluated, and why false positives and false negatives occur."
        canonicalUrl="https://www.aidetector.cx/guides/how-ai-detection-works"
        ogTitle="How AI Detection Works: Methods, Metrics & Limits"
        ogDescription="Learn how AI text detectors use classifiers and statistical signals, how detection scores are evaluated, and why false positives and false negatives occur."
        ogType="article"
        schemas={[articleSchema, faqSchema, breadcrumbSchema]}
      />

      <article className="max-w-4xl mx-auto px-4 py-10 md:py-16">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/guides" className="hover:text-primary transition-colors">Guides</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium truncate">How AI Detection Works</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Technical Guide
            </span>
            <span className="text-xs text-muted-foreground">Published June 1, 2026</span>
            <span className="text-xs text-muted-foreground">• Revised June 1, 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-navy leading-tight mb-6">
            How AI Detection Works: A Technical Guide
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
            AI text detection evaluates statistical distributions, token predictability, and neural representations to estimate whether a document originated from an autoregressive model or a human writer.
          </p>

          <div className="flex flex-wrap items-center gap-6 p-5 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Authorship</p>
                <p className="text-sm font-semibold text-foreground">AIDetector.cx Editorial & Research Team</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block"></div>
            <div>
              <p className="text-xs text-muted-foreground">Article Scope</p>
              <p className="text-sm font-semibold text-foreground">Methods, Metrics & Limits</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block"></div>
            <div>
              <p className="text-xs text-muted-foreground">Calculated Reading Time</p>
              <p className="text-sm font-semibold text-foreground">14 min read (~2,800 words)</p>
            </div>
          </div>
        </header>

        {/* Scope & Mathematical Reality Callout */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-3">
            <Compass className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-foreground mb-2">Scope & Mathematical Reality</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">
                AI text detection does not measure human consciousness, cognitive effort, or intent. It estimates the likelihood that a text matches generative token distributions. These scores are statistical classifications, not definitive proof of authorship.
              </p>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-card border border-border rounded-xl p-6 mb-12">
          <h2 className="text-base font-bold text-navy mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> Table of Contents
          </h2>
          <ol className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li><a href="#detection-vs-authorship" className="hover:text-primary transition-colors hover:underline">1. Detection vs. Authorship & Plagiarism</a></li>
            <li><a href="#illustrative-pipeline" className="hover:text-primary transition-colors hover:underline">2. An Illustrative Detection Pipeline</a></li>
            <li><a href="#statistical-signals" className="hover:text-primary transition-colors hover:underline">3. Statistical Signals & Mathematical Foundations</a></li>
            <li><a href="#neural-classifiers" className="hover:text-primary transition-colors hover:underline">4. Classifiers & Representation Learning</a></li>
            <li><a href="#evaluation-metrics" className="hover:text-primary transition-colors hover:underline">5. Metrics, Calibration & Pedagogical Example</a></li>
            <li><a href="#watermarking-provenance" className="hover:text-primary transition-colors hover:underline">6. Watermarking vs. Cryptographic Provenance</a></li>
            <li><a href="#limitations-and-bias" className="hover:text-primary transition-colors hover:underline">7. Failure Modes, Evasion & Bias</a></li>
            <li><a href="#testing-data-leakage" className="hover:text-primary transition-colors hover:underline">8. Held-Out Testing & Data Leakage</a></li>
            <li><a href="#responsible-standards" className="hover:text-primary transition-colors hover:underline">9. Responsible Interpretation Standards</a></li>
            <li><a href="#technical-glossary" className="hover:text-primary transition-colors hover:underline">10. Technical Glossary</a></li>
            <li><a href="#references" className="hover:text-primary transition-colors hover:underline">11. Verified Primary References</a></li>
            <li><a href="#faq" className="hover:text-primary transition-colors hover:underline">12. Frequently Asked Questions</a></li>
          </ol>
        </div>

        {/* Body Content */}
        <div className="space-y-12 text-foreground/90 text-base leading-relaxed">

          {/* Section 1 */}
          <section id="detection-vs-authorship" className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              1. Detection Versus Authorship and Plagiarism
            </h2>
            <p className="mb-4">
              AI text detection is often conflated with plagiarism checking, factual verification, and forensic authorship attribution. These tasks solve different computational problems using distinct mathematical foundations.
            </p>
            <div className="grid md:grid-cols-3 gap-4 my-6">
              <Card className="border border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-navy">
                    <FileText className="w-4 h-4 text-primary" /> Plagiarism Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Deterministic string matching and n-gram hash indexing. Compares submitted text against an indexed corpus of known published works to identify verbatim or paraphrased matches.
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-navy">
                    <Binary className="w-4 h-4 text-primary" /> AI Text Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Statistical pattern classification. Evaluates whether the statistical properties of a text align with generative token probability distributions rather than human writing corpora.
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-navy">
                    <Scale className="w-4 h-4 text-primary" /> Authorship Attribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Forensic stylometry. Compares syntactic habits, punctuation cadences, and vocabulary choices against verified reference corpora from specific named individuals.
                </CardContent>
              </Card>
            </div>
            <p className="mb-4">
              Plagiarism detection locates source documents. AI text detection examines statistical regularities in prose that may have been generated without direct copying. However, language models can occasionally reproduce memorized training sequences verbatim.
            </p>
            <p className="mb-4">
              Crucially, an AI detector output is not automatically a calibrated Bayesian probability. Raw classifier scores represent model confidence under specific training conditions. They do not establish a legal chain of custody regarding who typed the text.
            </p>
          </section>

          {/* Section 2 */}
          <section id="illustrative-pipeline" className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              2. An Illustrative Detection Pipeline
            </h2>
            <p className="mb-4">
              AI text detection systems typically process input text through modular analytical stages. The sequence below illustrates common engineering approaches across the literature. It does not represent a universal or mandatory architecture.
            </p>

            <div className="bg-card border border-border rounded-xl p-6 my-6">
              <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Common Modular Processing Stages
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Document Ingestion & Text Normalization</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Extracts plain text from formats like PDF, DOCX, or HTML. Normalizes Unicode codepoints while preserving original character offsets for UI highlighting.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Language Identification & Script Routing</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Identifies natural language and writing script. Language-specific tokenizers and statistical priors are selected to prevent cross-lingual classification errors.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Tokenization & Segmentation</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Converts text into subword tokens (Byte-Pair Encoding, WordPiece, or SentencePiece) matching the underlying reference model vocabulary.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Sliding Window & Context Chunking</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Divides the document into overlapping token windows and sentence blocks to support both document-level scoring and localized passage evaluation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">5</span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Feature Extraction & Representation Learning</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Extracts statistical signals (perplexity, entropy, burstiness) and contextual transformer embeddings across sequence tokens.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">6</span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Classification & Model Inference</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applies neural discriminators, zero-shot curvature tests, or tree ensembles to generate raw class logits.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">7</span>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Calibration, Thresholding & Reporting</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applies empirical calibration (e.g., temperature scaling or Platt scaling) to adjust raw logits into calibrated probability estimates for reporting.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 my-6 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Preprocessing Trade-offs:</strong> Aggressive normalization can discard informative signals. Stripping punctuation or converting text to lowercase removes syntactic cadence and casing patterns that help distinguish human from machine text.
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="statistical-signals" className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              3. Statistical Signals and Mathematical Foundations
            </h2>
            <p className="mb-4">
              Autoregressive language models predict upcoming tokens sequentially. At token position <code className="bg-muted px-1.5 py-0.5 rounded text-xs">i</code>, given preceding context <code className="bg-muted px-1.5 py-0.5 rounded text-xs">x_&lt;i</code>, the model computes a conditional probability distribution over its vocabulary.
            </p>

            <h3 className="text-xl font-bold text-navy mt-6 mb-3">Perplexity (PPL)</h3>
            <p className="mb-4">
              Perplexity measures the exponential cross-entropy of a token sequence under a reference language model:
            </p>

            {/* Typeset Equation */}
            <div className="bg-muted/50 border border-border rounded-xl p-6 my-6 text-center">
              <div className="text-base sm:text-lg font-mono font-semibold text-foreground tracking-wide">
                PPL = exp(−(1/N) × Σ log p(x_i | x_&lt;i))
              </div>
              <p className="text-xs text-muted-foreground mt-3 max-w-lg mx-auto">
                Where <em>N</em> is the sequence length, <em>x_i</em> is the <em>i</em>-th token, and <em>p(x_i | x_&lt;i)</em> is the conditional probability assigned by the model given preceding tokens.
              </p>
            </div>

            <p className="mb-4">
              Because language models favor probable tokens, machine-generated text often exhibits lower average perplexity. However, low perplexity does not prove machine authorship. Standard human writing in technical, legal, or journalistic domains can also exhibit low perplexity.
            </p>

            <h3 className="text-xl font-bold text-navy mt-6 mb-3">Information Entropy</h3>
            <p className="mb-4">
              Entropy measures uncertainty in the probability distribution at each token step:
            </p>

            <div className="bg-muted/50 border border-border rounded-xl p-4 my-4 text-center">
              <div className="text-sm sm:text-base font-mono font-semibold text-foreground">
                H(X) = − Σ p(w) log₂ p(w)
              </div>
            </div>

            <p className="mb-4">
              Positions constrained by grammar yield low entropy. Positions with broad lexical choice yield higher entropy. Nucleus sampling (<code className="bg-muted px-1.5 py-0.5 rounded text-xs">top-p</code>) and temperature truncation alter this entropy distribution in characteristic ways.
            </p>

            <h3 className="text-xl font-bold text-navy mt-6 mb-3">Burstiness and Writing Variation</h3>
            <p className="mb-4">
              Burstiness evaluates variance in sentence length, structure, and perplexity across a document. Human writers naturally alternate between short clauses and complex compound sentences.
            </p>
            <p className="mb-4">
              AI text often displays more uniform sentence lengths and consistent clause structures. However, this is an empirical tendency rather than an absolute rule. Authors can write uniformly, and prompt engineering can induce varied sentence structures in AI outputs.
            </p>

            <h3 className="text-xl font-bold text-navy mt-6 mb-3">Token Rank Distributions</h3>
            <p className="mb-4">
              When vocabulary tokens are ordered by probability, AI generation tends to concentrate selections in top-rank buckets (e.g., top-10 or top-100). Human writing samples more frequently from the long tail of the vocabulary distribution.
            </p>
          </section>

          {/* Section 4 */}
          <section id="neural-classifiers" className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              4. Classifiers and Representation Learning
            </h2>
            <p className="mb-4">
              Modern detection systems combine statistical metrics with learned representations from deep neural networks.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 my-6">
              <Card className="border border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-navy">
                    <Brain className="w-4 h-4 text-primary" /> Supervised Discriminators
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Pretrained encoders (such as RoBERTa or DeBERTa-v3) fine-tuned on labeled human and synthetic text. They capture subtle stylistic nuances across document representations.
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-navy">
                    <Activity className="w-4 h-4 text-primary" /> Zero-Shot Curvature (DetectGPT)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Assumes machine text lies in regions of negative log-probability curvature under a scoring model. Evaluates likelihood drops under small mask perturbations. Requires log-probability access and incurs high computational latency.
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-navy">
                    <Cpu className="w-4 h-4 text-primary" /> Embedding Distance Models
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Maps candidate documents into dense embedding spaces and evaluates cosine proximity to clusters of known synthetic and human corpora.
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-navy">
                    <Sliders className="w-4 h-4 text-primary" /> Multi-Signal Ensembles
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Combines statistical indicators, stylometric metrics, and neural logits using gradient-boosted trees. Ensembles often reduce individual model variance, though domain generalization depends on training diversity.
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 5 */}
          <section id="evaluation-metrics" className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              5. Metrics, Calibration and a Pedagogical Evaluation Example
            </h2>
            <p className="mb-4">
              Evaluating text classifiers requires standard diagnostic metrics. Below, we examine the mathematical formulas, calibration methods, and a pedagogical evaluation scenario.
            </p>

            <h3 className="text-xl font-bold text-navy mt-6 mb-3">Classification Metrics & Formulas</h3>
            <ul className="list-disc pl-6 space-y-2 mb-4 text-muted-foreground">
              <li><strong className="text-foreground">Precision:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-xs">TP / (TP + FP)</code>. Proportion of flagged documents that are genuinely AI-generated.</li>
              <li><strong className="text-foreground">Recall (Sensitivity):</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-xs">TP / (TP + FN)</code>. Proportion of all AI documents successfully detected.</li>
              <li><strong className="text-foreground">False Positive Rate (FPR):</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-xs">FP / (FP + TN)</code>. Proportion of human documents mistakenly flagged.</li>
              <li><strong className="text-foreground">Accuracy:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-xs">(TP + TN) / Total</code>. Overall proportion of correct classifications.</li>
              <li><strong className="text-foreground">F1 Score:</strong> <code className="bg-muted px-1.5 py-0.5 rounded text-xs">2 × (Precision × Recall) / (Precision + Recall)</code>. Harmonic mean of precision and recall.</li>
            </ul>

            <h3 className="text-xl font-bold text-navy mt-6 mb-3">Distinguishing Probability Calibration Techniques</h3>
            <p className="mb-4">
              Modern neural networks frequently produce overconfident logits (Guo et al., 2017). Post-processing calibration aligns raw scores with empirical accuracy:
            </p>
            <div className="grid md:grid-cols-3 gap-3 my-4">
              <div className="bg-card border border-border p-3.5 rounded-lg">
                <h4 className="text-xs font-bold text-navy mb-1">Temperature Scaling</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Divides model logits by a learned scalar parameter <code className="bg-muted px-1 rounded">T &gt; 0</code> before applying softmax. Preserves the argmax class ranking while smoothing overconfident probability distributions.
                </p>
              </div>
              <div className="bg-card border border-border p-3.5 rounded-lg">
                <h4 className="text-xs font-bold text-navy mb-1">Platt Scaling</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fits a two-parameter logistic regression model to the raw scalar outputs on a held-out validation set, transforming arbitrary margins into calibrated probabilities.
                </p>
              </div>
              <div className="bg-card border border-border p-3.5 rounded-lg">
                <h4 className="text-xs font-bold text-navy mb-1">Isotonic Regression</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A non-parametric calibration method that fits a piecewise constant, monotonic step-function. Highly flexible for non-sigmoid distortion curves, but requires larger validation datasets to avoid overfitting.
                </p>
              </div>
            </div>

            {/* Pedagogical Example */}
            <div className="bg-muted/40 border border-border rounded-xl p-6 my-6">
              <h3 className="text-base font-bold text-navy mb-2 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" /> Hypothetical Evaluation Example (1,000 Documents)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                <em>Note: This is a pedagogical mathematical example demonstrating base-rate effects. It does not represent AIDetector.cx benchmark results.</em>
              </p>

              <div className="overflow-x-auto my-4">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/60">
                      <th className="p-2.5 font-bold">Class</th>
                      <th className="p-2.5 font-bold">Predicted AI</th>
                      <th className="p-2.5 font-bold">Predicted Human</th>
                      <th className="p-2.5 font-bold">Total Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-2.5 font-semibold text-foreground">Actual AI (10% Prevalence)</td>
                      <td className="p-2.5 text-emerald-600 font-bold">TP = 80</td>
                      <td className="p-2.5 text-amber-600 font-bold">FN = 20</td>
                      <td className="p-2.5 text-muted-foreground">100</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-foreground">Actual Human (90% Prevalence)</td>
                      <td className="p-2.5 text-destructive font-bold">FP = 45</td>
                      <td className="p-2.5 text-emerald-600 font-bold">TN = 855</td>
                      <td className="p-2.5 text-muted-foreground">900</td>
                    </tr>
                    <tr className="bg-muted/30 font-bold">
                      <td className="p-2.5">Total Predicted</td>
                      <td className="p-2.5">125</td>
                      <td className="p-2.5">875</td>
                      <td className="p-2.5">1,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 my-4 text-xs">
                <div className="bg-card border border-border p-3 rounded-lg">
                  <span className="text-muted-foreground">Precision:</span>
                  <div className="font-bold text-sm text-foreground">64.0% (80 / 125)</div>
                </div>
                <div className="bg-card border border-border p-3 rounded-lg">
                  <span className="text-muted-foreground">Recall (Sensitivity):</span>
                  <div className="font-bold text-sm text-foreground">80.0% (80 / 100)</div>
                </div>
                <div className="bg-card border border-border p-3 rounded-lg">
                  <span className="text-muted-foreground">False Positive Rate (FPR):</span>
                  <div className="font-bold text-sm text-foreground">5.0% (45 / 900)</div>
                </div>
                <div className="bg-card border border-border p-3 rounded-lg">
                  <span className="text-muted-foreground">Overall Accuracy:</span>
                  <div className="font-bold text-sm text-foreground">93.5% (935 / 1000)</div>
                </div>
                <div className="bg-card border border-border p-3 rounded-lg">
                  <span className="text-muted-foreground">F1 Score:</span>
                  <div className="font-bold text-sm text-foreground">~71.1% (2·P·R/(P+R))</div>
                </div>
                <div className="bg-card border border-border p-3 rounded-lg">
                  <span className="text-muted-foreground">False Discovery Rate:</span>
                  <div className="font-bold text-sm text-destructive">36.0% (45 / 125)</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Why Accuracy Alone Can Mislead:</strong> In this population with 10% AI prevalence, overall accuracy appears high at 93.5%. However, because human text is the vast majority (900 documents), a modest 5% FPR produces 45 false positives. Out of 125 total flagged documents, 45 are human—meaning 36% of all positive flags are incorrect.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="watermarking-provenance" className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              6. Watermarking Versus Cryptographic Provenance
            </h2>
            <p className="mb-4">
              Statistical detection is only one approach to identifying synthetic media. Generation-time watermarking and cryptographic provenance standards provide alternative mechanisms.
            </p>

            <div className="grid md:grid-cols-2 gap-4 my-6">
              <Card className="border border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-navy">
                    <KeyRound className="w-4 h-4 text-primary" /> Statistical Token Watermarking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Embedded during model generation (Kirchenbauer et al., 2023). Uses a pseudo-random seed keyed to the preceding token to split the vocabulary into &ldquo;green&rdquo; and &ldquo;red&rdquo; lists, softly biasing logits toward green tokens. Detectors evaluate whether green-list frequency exceeds standard binomial expectations.
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-navy">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Cryptographic Provenance (C2PA)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Cryptographically signed metadata attached at generation time (e.g., C2PA standards). Records asset lineage and generator identity. Unlike watermarks, provenance manifests as explicit metadata that can be stripped when text is copied across plain-text clipboards.
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 7 */}
          <section id="limitations-and-bias" className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              7. Failure Modes, Evasion Techniques and Systematic Bias
            </h2>
            <p className="mb-4">
              AI text detection faces well-documented systemic failure modes and adversarial vulnerabilities.
            </p>

            <div className="space-y-4 my-6">
              <div className="bg-card border border-border p-4 rounded-xl">
                <h3 className="text-base font-bold text-navy mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Non-Native English (L2) Stylistic Bias
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Empirical studies (e.g., Liang et al., 2023) show that non-native English writers often use more constrained vocabularies and standardized grammatical forms. This reduces perplexity, leading to elevated false-positive rates on L2 human essays if detectors are evaluated without multicultural calibration.
                </p>
              </div>

              <div className="bg-card border border-border p-4 rounded-xl">
                <h3 className="text-base font-bold text-navy mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Formulaic and Technical Writing Domains
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Legal clauses, technical documentation, medical notes, and standard cover letters naturally follow constrained structural conventions. Because predictability is high, human technical writing often exhibits low perplexity similar to synthetic text.
                </p>
              </div>

              <div className="bg-card border border-border p-4 rounded-xl">
                <h3 className="text-base font-bold text-navy mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Paraphrasing and Hybrid Co-Writing
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When human writers iteratively edit machine drafts or use AI tools for outlining and grammar revision, boundaries between human and synthetic tokens blur. Quantifying exact percentage attribution in hybrid text remains challenging.
                </p>
              </div>

              <div className="bg-card border border-border p-4 rounded-xl">
                <h3 className="text-base font-bold text-navy mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Adversarial Perturbations & Short Text Constraints
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Adversarial attacks like homoglyph substitution or intentional synonym insertion can disrupt statistical patterns (Sadasivan et al., 2023). In addition, short texts provide fewer tokens, causing statistical variance to widen significantly.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section id="testing-data-leakage" className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              8. Credible Held-Out Testing and Data Leakage
            </h2>
            <p className="mb-4">
              Evaluating AI detectors reliably requires avoiding common evaluation pitfalls:
            </p>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-card border border-border p-4 rounded-xl">
                <h3 className="text-sm font-bold text-navy mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" /> Training-Testing Contamination
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If benchmark evaluation texts overlap with training corpora or model pretraining datasets, reported classification performance will be artificially inflated. Strict held-out temporal splits are required.
                </p>
              </div>

              <div className="bg-card border border-border p-4 rounded-xl">
                <h3 className="text-sm font-bold text-navy mb-1 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-primary" /> Cross-Domain & Language Shifts
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Classifiers trained on academic essays frequently degrade when tested on creative fiction, dialogue, or non-English languages. Rigorous benchmarks must report domain-specific metrics across distinct genres.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section id="responsible-standards" className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              9. Responsible Interpretation Standards
            </h2>
            <p className="mb-4">
              Because AI detection scores are probabilistic classifications subject to error, they should not serve as solitary evidence for punitive actions.
            </p>

            <div className="bg-muted/40 border border-border rounded-xl p-6 my-6">
              <h3 className="text-base font-bold text-navy mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Recommended Institutional Protocols
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">1. Multi-Factor Evidence:</span> Combine detection scores with document revision histories, edit timestamps, and research notes.
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">2. Human-in-the-Loop Review:</span> Ensure qualified instructors or editors read the text to assess domain constraints and individual style.
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">3. Student Dialogue:</span> Provide writers an opportunity to discuss their drafting process and sources before conclusions are reached.
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-foreground">4. Avoid Automated Penalties:</span> Do not configure automated disciplinary actions based solely on numerical score thresholds.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 10: Technical Glossary */}
          <section id="technical-glossary" className="scroll-mt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              10. Technical Glossary
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 my-6">
              <div className="bg-card border border-border p-3 rounded-lg text-xs">
                <span className="font-bold text-foreground">Perplexity (PPL):</span>
                <p className="text-muted-foreground mt-0.5">Exponentiated cross-entropy measuring sequence surprise under a reference model.</p>
              </div>
              <div className="bg-card border border-border p-3 rounded-lg text-xs">
                <span className="font-bold text-foreground">Burstiness:</span>
                <p className="text-muted-foreground mt-0.5">Statistical variance in sentence length, structure, and perplexity across a text.</p>
              </div>
              <div className="bg-card border border-border p-3 rounded-lg text-xs">
                <span className="font-bold text-foreground">Shannon Entropy:</span>
                <p className="text-muted-foreground mt-0.5">Quantitative measure of uncertainty in the token probability distribution.</p>
              </div>
              <div className="bg-card border border-border p-3 rounded-lg text-xs">
                <span className="font-bold text-foreground">Logits:</span>
                <p className="text-muted-foreground mt-0.5">Unnormalized scalar outputs from a neural network before softmax activation.</p>
              </div>
              <div className="bg-card border border-border p-3 rounded-lg text-xs">
                <span className="font-bold text-foreground">Temperature Scaling:</span>
                <p className="text-muted-foreground mt-0.5">Logit smoothing via a single learned scalar divisor to calibrate probabilities.</p>
              </div>
              <div className="bg-card border border-border p-3 rounded-lg text-xs">
                <span className="font-bold text-foreground">Platt Scaling:</span>
                <p className="text-muted-foreground mt-0.5">Fitting a logistic regression model over validation logits to produce calibrated probabilities.</p>
              </div>
              <div className="bg-card border border-border p-3 rounded-lg text-xs">
                <span className="font-bold text-foreground">Isotonic Regression:</span>
                <p className="text-muted-foreground mt-0.5">Non-parametric monotonic step-function calibration on validation probabilities.</p>
              </div>
              <div className="bg-card border border-border p-3 rounded-lg text-xs">
                <span className="font-bold text-foreground">False Discovery Rate:</span>
                <p className="text-muted-foreground mt-0.5">Proportion of positive flags that are false positives: FP / (TP + FP).</p>
              </div>
            </div>
          </section>

          {/* Section 11: References */}
          <section id="references" className="scroll-mt-20 pt-6 border-t border-border">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-primary" /> 11. Verified Primary References
            </h2>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li>
                <strong className="text-foreground">Guo, C., Pleiss, G., Sun, Y., &amp; Weinberger, K. Q. (2017).</strong> On Calibration of Modern Neural Networks. <em>Proceedings of the 34th International Conference on Machine Learning (ICML)</em>, PMLR 70:1321-1330.
              </li>
              <li>
                <strong className="text-foreground">Kirchenbauer, J., Geiping, J., Wen, Y., Katz, J., Miers, I., &amp; Goldstein, T. (2023).</strong> A Watermark for Large Language Models. <em>Proceedings of the 40th International Conference on Machine Learning (ICML)</em>, PMLR 202:17061-17084.
              </li>
              <li>
                <strong className="text-foreground">Liang, W., Yuksekgonul, M., Mao, Y., Wu, E., &amp; Zou, J. (2023).</strong> GPT detectors are biased against non-native English writers. <em>Patterns</em> (Cell Press), 4(7), 100779.
              </li>
              <li>
                <strong className="text-foreground">Mitchell, E., Lee, Y., Khazatsky, A., Manning, C. D., &amp; Finn, C. (2023).</strong> DetectGPT: Zero-Shot Machine-Generated Text Detection using Probability Curvature. <em>Proceedings of the 40th International Conference on Machine Learning (ICML)</em>, PMLR 202:24950-24962.
              </li>
              <li>
                <strong className="text-foreground">Sadasivan, V. S., Kumar, A., Balasubramanian, S., Wang, W., &amp; Feizi, S. (2023).</strong> Can AI-Generated Text be Reliably Detected? <em>arXiv preprint arXiv:2303.11156</em>.
              </li>
            </ul>
          </section>

          {/* Section 12: FAQ */}
          <section id="faq" className="scroll-mt-20 pt-6 border-t border-border">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-6">
              12. Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  What does an AI detection score actually measure?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  An AI detection score measures the statistical similarity between a sample text and the expected probability distribution of machine-generated text. It estimates likelihood based on learned or heuristic patterns, but does not provide mathematical proof of authorship or intent.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Are AI detector scores calibrated Bayesian probabilities?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No. Detector outputs are frequently uncalibrated heuristic scores or raw model logits. Unless explicitly calibrated using techniques like temperature scaling or Platt scaling against target distributions, a score of 80% cannot be interpreted as an 80% true probability of machine generation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  What is perplexity in AI text detection?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Perplexity quantifies how surprised a reference language model is by a sequence of words. Machine-generated text often exhibits lower perplexity because models sample probable tokens, whereas human writing typically shows greater variability.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Why do detectors produce false positives on non-native English writing?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Non-native English writers frequently employ standardized syntax, constrained vocabulary, and predictable grammatical structures. Because these stylistic choices reduce text perplexity, heuristic detectors can mistakenly classify human essays as machine-generated.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  How do watermarking techniques differ from post-hoc AI detection?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Watermarking modifies the generation process by biasing token selections with pseudo-random green lists during synthesis. Post-hoc detection analyzes arbitrary unwatermarked text after generation using statistical metrics and neural classifiers.
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Navigation */}
        <footer className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/guides" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to Guides Hub
          </Link>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>AIDetector.cx Technical Documentation</span>
            <span>•</span>
            <Link to="/research" className="hover:text-primary transition-colors">Research Benchmarks</Link>
          </div>
        </footer>
      </article>
    </MainLayout>
  );
}
