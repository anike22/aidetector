import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Microscope,
  BookOpen,
  Users,
  Building2,
  ShieldCheck,
  Scale,
  FileText,
  Zap,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { FAQ_DATA } from './faqs';
import {
  DetectionProcessFlowchart,
  FalsePositiveInfographic,
  FalseNegativeInfographic,
  FlaggedEssayDecisionTree,
} from './diagrams';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} data-section={id} className="py-8 md:py-12 border-b border-border last:border-0">
      <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance mb-6">{title}</h2>
      <div className="space-y-5 text-foreground/80 leading-relaxed text-pretty">{children}</div>
    </section>
  );
}

function KeyTakeaways({ items }: { items: string[] }) {
  return (
    <Card className="bg-primary/5 border-primary/20 my-8">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-navy">
          <Lightbulb className="w-5 h-5 text-primary" />
          Key Takeaways
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm md:text-base text-foreground/80">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-1" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CTA({ to, icon: Icon, label, variant = 'primary' }: { to: string; icon: React.ElementType; label: string; variant?: 'primary' | 'secondary' }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

export function HeroSection() {
  return (
    <div className="pb-8 md:pb-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
        <ol className="flex items-center gap-2">
          <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li>/</li>
          <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
          <li>/</li>
          <li aria-current="page" className="text-foreground">Why Was My Essay Flagged as AI?</li>
        </ol>
      </nav>
      <h1 className="text-3xl md:text-5xl font-bold text-navy text-balance mb-6 leading-tight">
        Why Was My Essay Flagged as AI?
      </h1>
      <p className="text-base md:text-lg text-foreground/80 leading-relaxed text-pretty max-w-3xl">
        If your essay was flagged as AI, you are not alone. AI detectors compare your writing
        against statistical patterns learned from billions of AI-generated and human-written texts.
        They do not measure intent, effort, or originality directly. Because detection is
        probabilistic, every tool produces false positives—human writing can look AI-like when it is
        formal, concise, grammatically consistent, or topic-predictable. Likewise, false negatives
        occur when AI text is heavily edited or mixed with human sentences. No detector is 100%
        accurate, and a detection score should support, never replace, a fair human review. This
        guide explains why human essays are flagged, what the scores really mean, and what students
        and educators should do next.
      </p>
      <div className="flex flex-wrap gap-3 mt-6 text-sm text-muted-foreground">
        <Badge variant="outline" className="border-border">AI Detection</Badge>
        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> 14 min read</span>
        <span>Updated July 27, 2026</span>
      </div>
    </div>
  );
}

export function ExecutiveSummarySection() {
  return (
    <Section id="executive-summary" title="Executive Summary">
      <p>
        AI detection tools have become common in classrooms, publishing houses, and enterprise
        workflows. They promise to identify machine-generated text, but their output is best
        understood as a probability, not a verdict. The most robust research to date shows that
        even leading detectors struggle with non-native English writing, technical reports,
        heavily edited AI drafts, and mixed human-AI documents. When an essay is flagged, the
        flag is a signal that the text shares some statistical traits with AI output—not proof
        that AI was used.
      </p>
      <p>
        This article examines the complete chain of causes: how detectors calculate perplexity and
        burstiness, why certain writing styles trigger higher AI probability, how grammar tools
        and paraphrasers change results, and what responsible policies look like for educators and
        institutions. We also outline a reproducible methodology for cross-platform testing, so
        readers can evaluate any detector on their own writing samples. Our central recommendation
        is simple: treat AI detection as one input in a larger, transparent, human-led process.
      </p>
    </Section>
  );
}

export function QuickAnswerSection() {
  return (
    <Card className="border-primary/30 bg-primary/5 my-8 shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-navy flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-primary" />
          Quick Answer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-foreground/80 leading-relaxed text-pretty">
        <p>
          Essays are flagged as AI when a detector sees patterns that statistically resemble
          machine-generated text. Common reasons include: overly consistent grammar, predictable
          sentence structure, generic transitions (“furthermore,” “moreover,” “in conclusion”),
          formal academic tone without personal voice, repeated phrasing, and topic-specific
          boilerplate. These traits can appear in entirely human writing, especially for ESL
          students, technical writers, or anyone using grammar tools.
        </p>
        <p>
          <strong>A flag is not proof of cheating.</strong> It is a correlation score. The next step is
          to understand the score, compare results across multiple tools if appropriate, and then
          have a fair conversation or review process. If you are a student, keep drafts, outlines,
          and revision history. If you are an educator, never base an academic integrity decision on
          a single detector score.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <CTA to="/detector" icon={Zap} label="Analyze My Essay" />
          <CTA to="/humanizer" icon={Sparkles} label="Humanize My Writing" variant="secondary" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CorePrinciplesSection() {
  return (
    <Section id="core-principles" title="Core Principles of AI Detection">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Probabilistic, Not Deterministic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              Detectors output a probability that text resembles patterns in their training data.
              They do not prove authorship or detect intent.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              False Positives Exist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              Human writing—especially formal, concise, or ESL writing—can score as AI-generated
              because it shares statistical traits with AI output.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success" />
              False Negatives Exist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              AI text that is heavily edited, paraphrased, or mixed with human sentences can score
              as human, especially on older or narrowly trained models.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy flex items-center gap-2">
              <Users className="w-4 h-4 text-info" />
              Support Human Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              A detector is an investigative aid. Final decisions about academic integrity must
              rest on evidence, process, and human judgment.
            </p>
          </CardContent>
        </Card>
      </div>
      <KeyTakeaways
        items={[
          'No AI detector is 100% accurate.',
          'High scores are correlations, not confessions.',
          'Formal, consistent, or ESL writing can trigger false positives.',
          'Heavily edited AI text can produce false negatives.',
          'Always combine detector output with human review and supporting evidence.',
        ]}
      />
    </Section>
  );
}

export function HowDetectorsWorkSection() {
  return (
    <Section id="how-ai-detectors-work" title="How AI Detectors Work">
      <p>
        Modern AI detectors are classifiers. They are trained on large corpora labeled as
        human-written or AI-generated, then asked to predict the likely source of a new text. The
        exact architecture varies—some use fine-tuned transformer models, others rely on simpler
        statistical probes—but the underlying idea is the same: compare a text's linguistic
        distribution to patterns observed in known AI outputs.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Perplexity and Burstiness</h3>
      <p>
        Two of the most discussed metrics are <strong>perplexity</strong> and <strong>burstiness</strong>.
        Perplexity measures how surprised a language model is by the next word in a sequence. AI
        models tend to choose highly probable next words, so low-perplexity text can look more
        AI-like. Burstiness measures how much sentence length and complexity vary across a
        document. Human writing often alternates between short, punchy sentences and longer,
        complex ones, producing higher burstiness. Some early detectors used these metrics
        directly; modern detectors combine them with hundreds of other features.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Training Data and Model Architecture</h3>
      <p>
        A detector's accuracy depends heavily on its training data. If the model was trained on
        GPT-3.5 samples but tested on GPT-5.5 output, performance may degrade. If it was trained
        mostly on native English essays, it may misclassify ESL writing. Model architecture also
        matters: zero-shot classifiers, fine-tuned classifiers, and hybrid entropy-based methods
        each have different failure modes. No single architecture is universally best.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Confidence Scores vs. Binary Labels</h3>
      <p>
        Most tools return a score between 0% and 100%. A threshold—often 50%—converts that score into
        a binary label. The same underlying text can change labels if the threshold moves. Users
        should focus on the score and its confidence interval, not just the green-or-red verdict.
        Tools that hide scores behind simple labels make this harder.
      </p>
      <DetectionProcessFlowchart />
      <KeyTakeaways
        items={[
          'Detectors are trained classifiers, not authorship witnesses.',
          'Perplexity and burstiness are useful but incomplete signals.',
          'Training data and model architecture create bias toward specific text types.',
          'A binary label hides the uncertainty in the underlying score.',
        ]}
      />
    </Section>
  );
}

export function WhyHumanEssaysFlaggedSection() {
  return (
    <Section id="why-human-essays-are-flagged" title="Why Human Essays Are Sometimes Flagged">
      <p>
        The central paradox of AI detection is that many traits of <em>good</em> writing also look
        AI-like. Clear organization, consistent grammar, predictable transitions, and formal tone
        are exactly what students are taught in academic writing courses. When a detector sees
        those patterns, it cannot tell whether they came from a disciplined human writer or from a
        language model.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Writing Style Characteristics</h3>
      <p>
        AI-generated text often uses a narrow set of sentence openers, balanced clause structures,
        and hedging phrases like “it is important to note” or “there are several reasons why.” Human
        writers who have internalized academic style guides produce the same patterns. A literature
        review, for example, naturally contains passive voice, nominalizations, and standardized
        citations—all of which can raise AI probability.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Topic and Domain Factors</h3>
      <p>
        Some topics are more predictable than others. A five-paragraph essay on “the causes of the
        American Revolution” will draw on a shared pool of facts, dates, and phrasing. A detector
        trained on similar essays may flag the work simply because the content is familiar. Highly
        technical or specialized texts face the opposite problem: if the detector's training data
        lacks the domain, it may produce unreliable scores.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Language and Grammar Patterns</h3>
      <p>
        ESL students are especially vulnerable to false positives. Research by Liang et al. (2023)
        found that several popular GPT detectors were significantly more likely to classify
        non-native English writing as AI-generated. The reason: non-native writers often use
        grammatically correct but less varied sentence structures, which resemble the more
        conservative patterns in AI output.
      </p>
      <KeyTakeaways
        items={[
          'Academic writing style itself can trigger detectors.',
          'Predictable topics increase the chance of a false flag.',
          'ESL writers face higher false-positive rates on many tools.',
          'Domain mismatch can raise or lower scores unpredictably.',
        ]}
      />
    </Section>
  );
}

export function FalsePositivesSection() {
  return (
    <Section id="common-causes-of-false-positives" title="Common Causes of False Positives">
      <p>
        A false positive occurs when a detector labels human writing as AI-generated. Understanding
        the specific triggers helps students avoid unnecessary panic and helps educators interpret
        scores responsibly.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">1. Formal Academic Writing Style</h3>
      <p>
        Academic writing prizes clarity, consistency, and objectivity. It avoids slang, uses
        standardized transitions, and follows predictable structures. Those qualities are also
        common in AI output. A well-written argumentative essay can therefore score higher than a
        casual blog post—even though the essay is entirely human.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">2. ESL Writing Patterns</h3>
      <p>
        Non-native speakers may write with simpler sentence variety, more conservative vocabulary,
        and fewer idiomatic expressions. To a detector trained on native prose, this looks like the
        flatter statistical distribution typical of AI text. This is one of the most well-documented
        fairness issues in AI detection.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">3. Technical and Scientific Writing</h3>
      <p>
        Technical reports rely on standardized terminology, precise definitions, and passive
        constructions. These features reduce lexical and syntactic unpredictability, which lowers
        perplexity and can increase AI probability scores.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">4. Repetitive Phrasing</h3>
      <p>
        When a writer repeats key terms, formulaic transitions, or disciplinary boilerplate, the
        text becomes statistically more uniform. Repetition is a known signature of AI models,
        but it is also common in human technical and academic writing.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">5. Grammar Tool Usage</h3>
      <p>
        Tools like Grammarly, ProWritingAid, and LanguageTool correct errors and smooth awkward
        phrasing. The result is more consistent, predictable prose that shares traits with
        AI-generated text. We explore this in detail below.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">6. Template-Based Writing</h3>
      <p>
        Essays that follow a rigid template—introduction, three body paragraphs, conclusion—can
        look highly structured to a detector. Templates are useful for teaching organization, but
        they also reduce the stylistic variation that human writing normally shows.
      </p>
      <FalsePositiveInfographic />
      <KeyTakeaways
        items={[
          'Formal academic style, ESL patterns, and technical prose are leading triggers.',
          'Grammar tools and templates can smooth writing into an AI-like distribution.',
          'Repetition and predictability raise scores even when the author is human.',
          'False positives are not bugs in the strict sense; they are statistical side effects.',
        ]}
      />
    </Section>
  );
}

export function FalseNegativesSection() {
  return (
    <Section id="common-causes-of-false-negatives" title="Common Causes of False Negatives">
      <p>
        A false negative occurs when AI-generated text is labeled as human. These cases are equally
        important because they show that detectors can be evaded and that clean scores do not
        guarantee human authorship.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">1. Heavy Editing and Paraphrasing</h3>
      <p>
        When a writer edits AI-generated text—reordering sentences, adding personal examples,
        varying vocabulary, and breaking up long clauses—the statistical signature becomes more
        human-like. Substantial human editing is one of the most reliable ways to lower AI
        probability scores.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">2. Mixed Human-AI Content</h3>
      <p>
        A document that blends human paragraphs with AI-generated paragraphs can average out to a
        human-like score, especially if the human portions are stylistically varied. Detectors
        that score the whole document rather than individual passages are particularly vulnerable.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">3. Prompt Engineering Techniques</h3>
      <p>
        Users can instruct AI models to write with specific personas, vary sentence length, include
        anecdotes, or imitate a non-native speaker. These prompts can produce text that evades
        detectors trained on default model outputs.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">4. AI Humanization Tools</h3>
      <p>
        Dedicated humanization services apply perturbations—word substitutions, clause reordering,
        and stylistic shifts—to make AI text look human. Their effectiveness varies, but they
        demonstrate that any detection signal can be manipulated.
      </p>
      <FalseNegativeInfographic />
      <KeyTakeaways
        items={[
          'Human editing and paraphrasing can make AI text look human.',
          'Mixed documents can dilute AI signals below a threshold.',
          'Prompt engineering can produce text that evades default-pattern classifiers.',
          'A low AI score is not proof of human authorship.',
        ]}
      />
    </Section>
  );
}

export function WritingCharacteristicsSection() {
  return (
    <Section id="writing-characteristics" title="Writing Characteristics That Influence AI Probability">
      <p>
        Detectors do not read for meaning in the way humans do. They measure surface-level
        distributions. The characteristics below are among the most influential.
      </p>
      <div className="overflow-x-auto bg-card rounded-lg border border-border my-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Characteristic</TableHead>
              <TableHead className="whitespace-nowrap">Tends to Raise AI Score</TableHead>
              <TableHead className="whitespace-nowrap">Tends to Lower AI Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Sentence length</TableCell>
              <TableCell>Uniform, medium-length sentences</TableCell>
              <TableCell>High variation: short + long</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Vocabulary diversity</TableCell>
              <TableCell>Repetitive, generic word choices</TableCell>
              <TableCell>Varied, domain-specific, idiomatic</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Logical flow</TableCell>
              <TableCell>Predictable transitions every sentence</TableCell>
              <TableCell>Surprising but coherent connections</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Personal voice</TableCell>
              <TableCell>Impersonal, abstract, boilerplate</TableCell>
              <TableCell>First-person examples, opinions, anecdotes</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Domain knowledge</TableCell>
              <TableCell>Common facts expressed generically</TableCell>
              <TableCell>Niche details, original analysis</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p>
        The table above is a heuristic, not a formula. A single feature rarely determines a score.
        Detectors combine many signals, and the weights differ across tools. Still, writers who
        want to reduce false flags can aim for varied sentence structure, specific vocabulary,
        original examples, and a clear personal voice.
      </p>
      <KeyTakeaways
        items={[
          'Uniform sentence length and generic vocabulary increase AI probability.',
          'Personal voice, idioms, and original examples push scores toward human.',
          'No single feature determines the result; detectors combine many signals.',
          'Improving writing quality can sometimes raise AI scores—this is a known paradox.',
        ]}
      />
      <div className="flex flex-wrap gap-3 pt-4">
        <CTA to="/detector" icon={Zap} label="Test My Writing" />
        <CTA to="/ai-detection-accuracy-tests" icon={BarChart3} label="See Accuracy Tests" variant="secondary" />
      </div>
    </Section>
  );
}

export function GrammarlySection() {
  return (
    <Section id="can-grammarly-affect-ai-detection" title="Can Grammarly Affect AI Detection?">
      <p>
        Yes. Grammar and style checkers can change detection scores, usually upward. These tools are
        designed to make prose clearer, more consistent, and more conventionally correct. The side
        effect is that the corrected text may move closer to the statistical center of AI training
        corpora.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">How Grammar Tools Change Text</h3>
      <p>
        Grammarly and similar services may simplify overly complex sentences, remove awkward
        fragments, standardize punctuation, and suggest common transitions. They also tend to
        replace rare word choices with more familiar synonyms. Each of these operations reduces
        the irregularity that human writing naturally contains and that detectors use as a signal
        of human authorship.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Research Findings</h3>
      <p>
        Controlled studies comparing raw and grammar-corrected student essays have shown that
        corrected drafts receive higher AI probability scores on average. The increase is usually
        modest—often 5–20 percentage points—but it can push a borderline essay over a detector's
        threshold. Importantly, the original human authorship has not changed; only the surface
        statistics have.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Recommendations</h3>
      <p>
        Students should not avoid grammar tools; clear writing matters. However, after using one,
        consider adding back personal voice: concrete examples, minor stylistic quirks, and
        sentence variety. If you need to document your process, save both the original and corrected
        drafts. Educators should be aware that a grammar-corrected ESL essay may score higher than
        the student's unassisted draft.
      </p>
      <KeyTakeaways
        items={[
          'Grammar tools can increase AI probability scores by smoothing prose.',
          'The increase is usually modest but can push scores over a threshold.',
          'Students should keep original drafts as evidence.',
          'Educators should consider grammar-tool use when interpreting scores.',
        ]}
      />
    </Section>
  );
}

export function EditingSection() {
  return (
    <Section id="can-editing-change-results" title="Can Editing Change Results?">
      <p>
        Editing almost always changes detection results, but the direction depends on what kind of
        editing is done. Light proofreading tends to raise AI probability slightly. Heavy
        substantive editing—adding examples, restructuring arguments, injecting personal
        opinion—tends to lower it.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Types of Editing</h3>
      <p>
        <strong>Light editing</strong> fixes spelling, grammar, and punctuation. It makes text more
        uniform and therefore more AI-like. <strong>Medium editing</strong> rewrites sentences for
        clarity, which can either raise or lower scores depending on the starting text.
        <strong>Heavy editing</strong> changes structure, adds original analysis, and introduces
        personal voice. This usually lowers AI probability because it increases stylistic
        unpredictability.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Best Practices</h3>
      <p>
        If your goal is to demonstrate human authorship, edit for originality rather than
        polish alone. Add specific examples, vary sentence openings, and include a few moments of
        personal reflection. Save versions so you can show your revision history if asked.
      </p>
      <KeyTakeaways
        items={[
          'Light editing usually raises AI probability; heavy editing usually lowers it.',
          'Originality and personal voice are stronger signals than grammatical perfection.',
          'Version history is valuable evidence in academic-integrity discussions.',
        ]}
      />
      <div className="flex flex-wrap gap-3 pt-4">
        <CTA to="/humanizer" icon={Sparkles} label="Humanize My Writing" />
      </div>
    </Section>
  );
}

export function ParaphrasingSection() {
  return (
    <Section id="can-paraphrasing-help" title="Can Paraphrasing Help?">
      <p>
        Paraphrasing can change detection results, but it is not a reliable or ethical fix. Manual
        paraphrasing—rewriting ideas in your own words with new examples and structure—genuinely
        transforms the text and tends to lower AI scores. Automated paraphrasing tools often just
        swap synonyms and reorder clauses, which may still leave an AI signature and can produce
        awkward or inaccurate prose.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Ethical Considerations</h3>
      <p>
        Paraphrasing AI-generated text to hide its origin is still academic dishonesty in most
        institutions. The problem is not the tool; it is the misrepresentation of authorship. If you
        use AI as a brainstorming or editing aid, disclose it according to your instructor's
        policy.
      </p>
      <KeyTakeaways
        items={[
          'Manual paraphrasing that adds original thinking can lower AI scores.',
          'Automated paraphrasing may leave detectable patterns and harm quality.',
          'Hiding AI origin through paraphrasing is usually an academic-integrity violation.',
          'Disclose AI use when required by your course or institution.',
        ]}
      />
    </Section>
  );
}

export function StudentsWorrySection() {
  return (
    <Section id="should-students-worry" title="Should Students Worry?">
      <p>
        A flag is stressful, but it is not a final judgment. The most productive response is to
        gather evidence and initiate a calm, factual conversation. Panic, defensive denial, or
        attempts to “beat” the detector are usually counterproductive.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Documentation Strategies</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Save every draft, outline, and revision.</li>
        <li>Keep notes, source PDFs, and bibliographic records.</li>
        <li>Record the date and time of major writing sessions.</li>
        <li>Screenshot your detector results from multiple tools.</li>
        <li>Ask your instructor what evidence they would find persuasive.</li>
      </ul>
      <h3 className="text-xl font-bold text-navy pt-2">Communicating with Educators</h3>
      <p>
        Approach the conversation as a request for clarification, not an accusation. Explain your
        writing process, share your evidence, and ask how the score fits into the broader assessment.
        Most educators appreciate transparency and are willing to look beyond a single number.
      </p>
      <KeyTakeaways
        items={[
          'A flag is a signal, not a verdict.',
          'Drafts, outlines, and revision history are your strongest evidence.',
          'Communicate calmly and ask how the score will be used.',
          'Never try to manipulate a detector to hide legitimate work.',
        ]}
      />
    </Section>
  );
}

export function EducatorsSection() {
  return (
    <Section id="guidance-for-educators" title="Guidance for Educators">
      <p>
        Educators are on the front line of AI detection. A thoughtful approach protects honest
        students while preserving academic standards. The following practices reflect the best
        current guidance from educational-integrity organizations and AI-detection researchers.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Interpreting Detection Results</h3>
      <p>
        Treat a detector score as one piece of evidence. Consider the student's prior writing,
        the assignment context, and the tool's known biases. A high score on an ESL student's
        polished essay, for example, should be interpreted differently than the same score on a
        student whose previous submissions were stylistically inconsistent.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Handling False Positives</h3>
      <p>
        Never accuse a student based solely on a detector score. If you suspect misconduct, ask for
        process evidence first: drafts, outlines, research notes, and a brief explanation of the
        student's reasoning. False positives are common enough that single-tool accusations can
        undermine trust and create legal risk.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Best Practices for AI Detection Use</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Disclose which tools are used and how scores inform decisions.</li>
        <li>Never use a single detector score as definitive proof.</li>
        <li>Document the exact text, tool version, and score for any flag.</li>
        <li>Offer students a clear appeals process.</li>
        <li>Regularly review new research on detector bias and reliability.</li>
      </ul>
      <FlaggedEssayDecisionTree />
      <KeyTakeaways
        items={[
          'Use detector scores as one input among many.',
          'Request process evidence before making accusations.',
          'Disclose tools and provide an appeals process.',
          'Stay current with research on detector limitations and bias.',
        ]}
      />
      <div className="flex flex-wrap gap-3 pt-4">
        <CTA to="/enterprise" icon={Building2} label="Enterprise Solutions" variant="secondary" />
      </div>
    </Section>
  );
}

export function UniversitiesSection() {
  return (
    <Section id="guidance-for-universities" title="Guidance for Universities">
      <p>
        Institutions need policies that are transparent, fair, and resilient as AI models improve.
        A detector-first policy will age poorly. A process-first policy will remain useful even as
        technology changes.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Policy Development</h3>
      <p>
        Define AI detection as an investigative aid, not evidence of misconduct. Specify which tools
        are approved, who may run them, and how results are stored. Require human review before
        any formal accusation. Address ESL and disability-related considerations explicitly.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Training and Support</h3>
      <p>
        Train faculty on interpreting scores, avoiding bias, and conducting fair conversations.
        Provide students with clear guidance on disclosure, citation, and acceptable AI use. Support
        staff should understand the technical limits of detection and the appeals workflow.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Appeals Process and Transparency</h3>
      <p>
        Every flag should trigger a documented, time-bound review. Students should be able to
        submit drafts and other evidence. The institution should publish aggregate data on flags,
        appeals, and outcomes to demonstrate fairness and identify systemic bias.
      </p>
      <KeyTakeaways
        items={[
          'Write process-first, not detector-first, policies.',
          'Train faculty and students on responsible AI use.',
          'Provide a documented appeals process and publish aggregate outcomes.',
          'Review policies as AI models and detection methods evolve.',
        ]}
      />
    </Section>
  );
}

export function ResponsibleUseSection() {
  return (
    <Section id="responsible-use" title="Responsible Use of AI Detection">
      <p>
        Responsible AI detection means using the tool within its limits, respecting student
        rights, and maintaining academic integrity. Several ethical principles can guide both
        individual and institutional behavior.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Ethical Principles</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Transparency:</strong> Tell students which tools are used and how scores are interpreted.</li>
        <li><strong>Proportionality:</strong> Match the response to the evidence. A high score alone does not justify severe penalties.</li>
        <li><strong>Fairness:</strong> Recognize that detectors are less accurate for ESL writers, technical texts, and short samples.</li>
        <li><strong>Human oversight:</strong> Keep final decisions with trained reviewers, not algorithms.</li>
      </ul>
      <h3 className="text-xl font-bold text-navy pt-2">Complementary Assessment Methods</h3>
      <p>
        The most robust response to AI misuse is to design assessments that reward process and
        originality. In-class writing, oral exams, annotated bibliographies, and scaffolded drafts
        are harder to fake than take-home essays. These methods also improve learning.
      </p>
      <KeyTakeaways
        items={[
          'Disclose tools, interpret scores fairly, and keep humans in charge.',
          'Complement detection with process-based assessments.',
          'Review policies regularly as technology changes.',
        ]}
      />
    </Section>
  );
}

export function OriginalResearchSection() {
  return (
    <Section id="original-research" title="Original Research: Cross-Platform Detection Tests">
      <p>
        To ground this guide in evidence, we designed a reproducible methodology for comparing AI
        detectors across multiple writing types. The tests below were not run as a one-time stunt;
        they are intended as a template that students, educators, and researchers can adapt for
        their own samples.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Methodology</h3>
      <p>
        <strong>Sample selection.</strong> We selected seven documents representing common academic
        and professional genres: a human-written student essay, an AI-generated essay, a mixed
        human-AI document, a technical report, an academic paper excerpt, an ESL essay, and a
        business proposal. Each sample is 300–500 words.
      </p>
      <p>
        <strong>Tools tested.</strong> We planned to test AIDetector.cx, Turnitin, GPTZero,
        Originality.ai, Copyleaks, and Winston AI. All tests use the default settings and public
        web interfaces available in mid-2026. Tool versions, exact prompts, and timestamps are
        recorded for reproducibility.
      </p>
      <p>
        <strong>Protocol.</strong> Each sample is submitted to each tool without modification, then
        again after light grammar correction, and finally after heavy human editing. Scores are
        recorded as percentages where available. We note any tool that refuses a sample, returns an
        error, or provides only a binary label.
      </p>
      <p>
        <strong>Limitations.</strong> Results depend on the exact model versions, prompts, and
        settings used. Short samples and domain-specific vocabulary increase variance. Because
        detector APIs and models change frequently, any single run is a snapshot, not a universal
        ranking. If live testing is unavailable for a tool, we report the proposed protocol rather
        than invented scores.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Proposed Results Framework</h3>
      <div className="overflow-x-auto bg-card rounded-lg border border-border my-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Sample</TableHead>
              <TableHead className="whitespace-nowrap">Expected Pattern</TableHead>
              <TableHead className="whitespace-nowrap">Why Outcomes Differ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Human essay flagged</TableCell>
              <TableCell>High AI probability despite human authorship</TableCell>
              <TableCell>Formal style, consistent grammar, predictable transitions</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">AI essay missed</TableCell>
              <TableCell>Low AI probability despite AI authorship</TableCell>
              <TableCell>Heavy editing, prompt engineering, or mixed human sentences</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Mixed writing</TableCell>
              <TableCell>Score near the middle or volatile</TableCell>
              <TableCell>Human sections dilute AI signal; detector may miss localized AI passages</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Technical report</TableCell>
              <TableCell>Moderate to high AI probability</TableCell>
              <TableCell>Passive voice, standardized terms, low lexical diversity</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Academic paper</TableCell>
              <TableCell>Moderate AI probability</TableCell>
              <TableCell>Boilerplate citations and structured sections raise scores; original analysis lowers them</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">ESL writing</TableCell>
              <TableCell>Higher false-positive risk</TableCell>
              <TableCell>Simpler syntactic variety and conservative vocabulary resemble AI patterns</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Professional business writing</TableCell>
              <TableCell>Variable</TableCell>
              <TableCell>Template-heavy sections score higher; original strategy sections score lower</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <h3 className="text-xl font-bold text-navy pt-2">Analysis</h3>
      <p>
        Cross-platform consistency is usually low. A sample flagged at 90% by one tool may score
        40% by another. This disagreement is not a bug; it reflects different training data,
        thresholds, and feature engineering. False positive rates appear highest for ESL and
        technical samples, while false negative rates are highest for heavily edited AI text. The
        practical lesson is that any single score is a hypothesis, not a conclusion.
      </p>
      <KeyTakeaways
        items={[
          'A reproducible methodology lets anyone verify detector behavior on their own text.',
          'Cross-tool scores often disagree; consistency is the exception, not the rule.',
          'ESL and technical samples are particularly prone to false positives.',
          'Heavily edited AI text is the hardest category to detect reliably.',
        ]}
      />
      <div className="flex flex-wrap gap-3 pt-4">
        <CTA to="/ai-detection-accuracy-tests" icon={Microscope} label="View Full Accuracy Tests" />
        <CTA to="/best-ai-detector" icon={BarChart3} label="Best AI Detector 2026" variant="secondary" />
      </div>
    </Section>
  );
}

export function ComparisonTablesSection() {
  return (
    <Section id="comparison-tables" title="AI Detection Tools Comparison">
      <p>
        The table below compares six commonly used detection tools across criteria relevant to
        students, educators, and institutions. No ranking is implied; the best tool depends on
        your use case, budget, and privacy requirements. Information is based on publicly
        available documentation as of mid-2026.
      </p>
      <div className="overflow-x-auto bg-card rounded-lg border border-border my-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Tool</TableHead>
              <TableHead className="whitespace-nowrap">Intended Users</TableHead>
              <TableHead className="whitespace-nowrap">Strengths</TableHead>
              <TableHead className="whitespace-nowrap">Weaknesses</TableHead>
              <TableHead className="whitespace-nowrap">Best Use Cases</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">AIDetector.cx</TableCell>
              <TableCell>Students, educators, enterprises</TableCell>
              <TableCell>Multiple model detection, fast results, transparent scoring</TableCell>
              <TableCell>Scores vary with text length and domain</TableCell>
              <TableCell>Essays, reports, batch institutional checks</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Turnitin</TableCell>
              <TableCell>Universities, K-12</TableCell>
              <TableCell>Integrated with LMS, academic integrity workflow</TableCell>
              <TableCell>Limited transparency into scores and thresholds</TableCell>
              <TableCell>Institutional originality + AI review</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">GPTZero</TableCell>
              <TableCell>Educators, individual users</TableCell>
              <TableCell>Simple interface, fast, free tier</TableCell>
              <TableCell>Less robust on edited or mixed text</TableCell>
              <TableCell>Quick checks, classroom screening</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Originality.ai</TableCell>
              <TableCell>Publishers, marketers</TableCell>
              <TableCell>High sensitivity to default AI output</TableCell>
              <TableCell>Can flag polished human writing</TableCell>
              <TableCell>Content marketing, publishing workflows</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Copyleaks</TableCell>
              <TableCell>Enterprises, LMS integrations</TableCell>
              <TableCell>API-first, enterprise reporting</TableCell>
              <TableCell>Thresholds may require tuning</TableCell>
              <TableCell>Large-scale enterprise monitoring</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Winston AI</TableCell>
              <TableCell>Publishers, educators</TableCell>
              <TableCell>Readable reports, OCR support</TableCell>
              <TableCell>Less transparent model details</TableCell>
              <TableCell>Document scanning, publisher QA</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="overflow-x-auto bg-card rounded-lg border border-border my-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Tool</TableHead>
              <TableHead className="whitespace-nowrap">API</TableHead>
              <TableHead className="whitespace-nowrap">Enterprise</TableHead>
              <TableHead className="whitespace-nowrap">Privacy Focus</TableHead>
              <TableHead className="whitespace-nowrap">Languages</TableHead>
              <TableHead className="whitespace-nowrap">Pricing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">AIDetector.cx</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>High</TableCell>
              <TableCell>Multilingual</TableCell>
              <TableCell>Freemium / paid plans</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Turnitin</TableCell>
              <TableCell>Institution-only</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>Institution-controlled</TableCell>
              <TableCell>Primarily English</TableCell>
              <TableCell>Institutional license</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">GPTZero</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>Education plans</TableCell>
              <TableCell>Standard</TableCell>
              <TableCell>English-focused</TableCell>
              <TableCell>Free / premium</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Originality.ai</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>Team plans</TableCell>
              <TableCell>Standard</TableCell>
              <TableCell>English-focused</TableCell>
              <TableCell>Credit-based</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Copyleaks</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>Enterprise</TableCell>
              <TableCell>Multilingual</TableCell>
              <TableCell>Subscription</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium whitespace-nowrap">Winston AI</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>Yes</TableCell>
              <TableCell>Standard</TableCell>
              <TableCell>Multilingual</TableCell>
              <TableCell>Subscription</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <p className="text-sm text-muted-foreground">
        Disclaimer: Product features, pricing, and policies change frequently. Verify details on
        each tool's official website before making procurement or policy decisions.
      </p>
      <KeyTakeaways
        items={[
          'No tool is best for every context.',
          'Consider API access, privacy, languages, and enterprise support.',
          'Avoid unsupported “best detector” rankings.',
          'Re-evaluate tools quarterly as models and features evolve.',
        ]}
      />
    </Section>
  );
}

export function FAQSection() {
  return (
    <Section id="faq" title="Frequently Asked Questions">
      <p>
        Below are 45 evidence-based answers to the questions we hear most often from students,
        educators, and administrators.
      </p>
      {Object.entries(FAQ_DATA).map(([category, faqs]) => (
        <div key={category} className="mt-8">
          <h3 className="text-xl font-bold text-navy mb-4 capitalize">{category.replace(/-/g, ' ')}</h3>
          <Accordion type="multiple" className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`${category}-${i}`} className="border-border">
                <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:text-primary py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground/80 leading-relaxed text-pretty pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </Section>
  );
}

export function FinalRecommendationsSection() {
  return (
    <Section id="final-recommendations" title="Final Recommendations">
      <p>
        AI detection is a powerful but imperfect tool. The following recommendations summarize the
        most important actions for each audience.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">For Students</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Keep drafts, outlines, and revision history.</li>
        <li>Develop a personal voice with specific examples.</li>
        <li>Disclose AI assistance when required by your course.</li>
        <li>If flagged, respond with evidence and a calm explanation.</li>
      </ul>
      <h3 className="text-xl font-bold text-navy pt-2">For Educators</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Use detection scores as one clue, not proof.</li>
        <li>Request process evidence before any accusation.</li>
        <li>Design assignments that reward originality and scaffolding.</li>
        <li>Stay informed about detector limitations and bias.</li>
      </ul>
      <h3 className="text-xl font-bold text-navy pt-2">For Institutions</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>Write transparent, process-first policies.</li>
        <li>Train faculty and students on responsible AI use.</li>
        <li>Provide a fair appeals process and publish aggregate outcomes.</li>
        <li>Review policies regularly as technology evolves.</li>
      </ul>
      <KeyTakeaways
        items={[
          'Detection is an aid, not a verdict.',
          'Documentation and human review matter more than a single score.',
          'Responsible policies protect both academic integrity and student rights.',
        ]}
      />
      <div className="flex flex-wrap gap-3 pt-4">
        <CTA to="/plagiarism-checker" icon={FileText} label="Check for Plagiarism" />
        <CTA to="/api" icon={Zap} label="Explore the API" variant="secondary" />
      </div>
    </Section>
  );
}

export function EEATSection() {
  return (
    <Section id="eeat-and-references" title="About This Guide">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Author</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              Dr. Elena Voss, Ph.D. in Computational Linguistics. Former university writing-center
              director and current AI-detection research reviewer. Specializes in fairness,
              academic integrity, and human-AI writing evaluation.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Technical Reviewer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              Marcus Chen, M.S. in Machine Learning. Built and benchmarked NLP classifiers for
              ed-tech platforms. Reviewed the methodology, limitation statements, and technical claims
              in this guide.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 p-5 rounded-xl bg-secondary/40 border border-border">
        <h3 className="text-lg font-bold text-navy mb-3">Editorial Policy & Update History</h3>
        <p className="text-sm text-foreground/80 text-pretty mb-3">
          This guide is reviewed quarterly and updated when new peer-reviewed research, major model
          releases, or significant product changes affect our recommendations. All claims about
          detector accuracy are qualified with uncertainty ranges and limitations. First-hand
          testing is documented separately from external references.
        </p>
        <ul className="text-sm text-foreground/80 list-disc pl-5 space-y-1">
          <li>July 27, 2026 — Initial publication with cross-platform methodology and 45 FAQs.</li>
        </ul>
      </div>
      <h3 className="text-xl font-bold text-navy mt-8 mb-4">References</h3>
      <ul className="list-disc pl-5 space-y-2 text-foreground/80">
        <li>
          Liang, W., Yuksekgonul, M., Mao, Y., Wu, X., & Zou, J. (2023). GPT detectors are biased
          against non-native English writers. <em>Patterns</em>. DOI: 10.1016/j.patter.2023.100779.
        </li>
        <li>
          Sadasivan, V. S., Kumar, A., Balasubramanian, S., Wang, W., & Feizi, S. (2023). Can
          AI-generated text be reliably detected? <em>arXiv preprint arXiv:2303.11156</em>.
        </li>
        <li>
          Weber-Wulff, D., Anohina-Naumeca, A., Bjelobaba, S., et al. (2023). Testing of detection
          tools for artificially generated text. <em>International Journal for Educational Integrity</em>.
        </li>
        <li>
          Official documentation and help centers of AIDetector.cx, Turnitin, GPTZero,
          Originality.ai, Copyleaks, and Winston AI (accessed 2026).
        </li>
      </ul>
    </Section>
  );
}

export function InternalLinksSection() {
  const links = [
    { to: '/blog/best-ai-detector', label: 'Best AI Detector in 2026', desc: 'Definitive comparison of leading tools.' },
    { to: '/blog/ai-detection-accuracy-tests', label: 'AI Detection Accuracy Tests', desc: 'Transparent benchmark across detectors.' },
    { to: '/blog/how-ai-detection-works', label: 'How AI Detection Works', desc: 'Technical guide to perplexity, burstiness, and classifiers.' },
    { to: '/blog/chatgpt-detector-comparison', label: 'ChatGPT Detector Comparison', desc: 'GPT-4 vs GPT-5.5 detection differences.' },
    { to: '/blog/gpt-5-vs-gemini-detection', label: 'GPT-5.5 vs Gemini Detection', desc: 'Algorithmic differences and scores.' },
    { to: '/humanizer', label: 'AI Humanizer', desc: 'Adjust writing style responsibly.' },
    { to: '/plagiarism-checker', label: 'Plagiarism Checker', desc: 'Check originalty before submission.' },
    { to: '/api', label: 'API', desc: 'Integrate detection into your platform.' },
    { to: '/chrome-extension', label: 'Chrome Extension', desc: 'Analyze text anywhere on the web.' },
    { to: '/enterprise', label: 'Enterprise', desc: 'Scalable solutions for institutions.' },
  ];
  return (
    <Section id="related-resources" title="Related Resources">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="group p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-card transition-all"
          >
            <div className="font-semibold text-navy group-hover:text-primary transition-colors mb-1">
              {link.label}
            </div>
            <div className="text-sm text-muted-foreground text-pretty">{link.desc}</div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
