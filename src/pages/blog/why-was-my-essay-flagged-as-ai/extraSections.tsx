import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

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

export function PracticalExamplesSection() {
  return (
    <Section id="practical-examples" title="Practical Examples">
      <p>
        To make the causes of false positives and false negatives concrete, this section walks
        through seven representative writing samples. Each example explains why a detector might
        produce a particular score and what a fair reviewer should consider before drawing a
        conclusion.
      </p>

      <h3 className="text-xl font-bold text-navy pt-2">Example 1: Human Essay Flagged</h3>
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/70 my-4 text-sm md:text-base">
        “Artificial intelligence has become an integral part of modern education. Its ability to
        personalize learning, automate grading, and provide instant feedback has transformed
        classrooms around the world. Furthermore, AI tools can help students with disabilities
        access content more easily. However, the integration of AI also raises important questions
        about equity, privacy, and the role of human teachers. In conclusion, educators must
        balance technological benefits with ethical considerations.”
      </blockquote>
      <p>
        This paragraph is human-written, but it is likely to score as AI. It uses generic
        transitions (“furthermore,” “in conclusion”), a balanced sentence structure, and a topic
        sentence followed by supporting points in predictable order. A detector that has seen
        thousands of similar five-paragraph essays will flag the pattern rather than the authorship.
      </p>

      <h3 className="text-xl font-bold text-navy pt-2">Example 2: AI Essay Missed</h3>
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/70 my-4 text-sm md:text-base">
        “Last semester my laptop died two hours before a philosophy deadline. I scribbled my
        argument on a napkin, rewrote it at the library, and lost half the citations. The final
        essay was messy, personal, and probably weaker than it should have been—but it was mine. AI
        would never have chosen the napkin.”
      </blockquote>
      <p>
        If an AI model were prompted to imitate an anxious, personal student anecdote, the result
        could look like the paragraph above. Detectors trained on polished academic prose might
        classify it as human because the style is irregular and emotionally specific. The
        anecdote shows why low perplexity and high personal voice do not guarantee human authorship.
      </p>

      <h3 className="text-xl font-bold text-navy pt-2">Example 3: Mixed Writing</h3>
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/70 my-4 text-sm md:text-base">
        “Climate change is one of the most pressing issues of the twenty-first century. It affects
        ecosystems, economies, and human health across the globe. [AI-generated boilerplate
        continues for three sentences.] I first noticed this during a summer internship at a coastal
        lab, where we measured erosion rates after storms. The data contradicted what I had read in
        textbooks, and I spent weeks trying to understand why.”
      </blockquote>
      <p>
        Mixed writing is particularly deceptive because the human sections add authenticity while
        the AI sections provide structure. A whole-document detector may return a middling score,
        while a passage-level detector might highlight the generic middle. The example illustrates
        why reviewers should examine suspicious passages rather than relying on a single overall
        number.
      </p>

      <h3 className="text-xl font-bold text-navy pt-2">Example 4: Technical Report</h3>
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/70 my-4 text-sm md:text-base">
        “The sample was prepared by dissolving 0.5 g of sodium chloride in 50 mL of deionized water.
        The solution was stirred at 300 rpm for ten minutes and then filtered through a 0.45 µm
        membrane. The filtrate was analyzed by UV-Vis spectroscopy at 260 nm. The absorbance value
        was recorded in triplicate and averaged to minimize measurement error.”
      </blockquote>
      <p>
        Technical reports use standardized procedures, passive voice, and precise units. This
        uniformity reduces lexical diversity and can trigger false positives on detectors that
        associate such prose with AI-generated lab summaries. A domain-aware reviewer would
        recognize the paragraph as standard scientific method writing.
      </p>

      <h3 className="text-xl font-bold text-navy pt-2">Example 5: Academic Paper Excerpt</h3>
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/70 my-4 text-sm md:text-base">
        “Previous research has established a correlation between sleep deprivation and impaired
        cognitive performance (Smith &amp; Doe, 2024). The present study extends this literature by
        examining the moderating role of caffeine consumption. Results indicate a significant
        interaction effect, suggesting that caffeine attenuates—but does not eliminate—the negative
        impact of sleep loss on working memory.”
      </blockquote>
      <p>
        Academic citations, hedging language, and formal structure can raise AI scores even when
        the analysis is original. The excerpt contains no personal voice and follows a predictable
        literature-review pattern. It demonstrates why citation-rich, well-structured human
        writing is frequently flagged.
      </p>

      <h3 className="text-xl font-bold text-navy pt-2">Example 6: ESL Writing</h3>
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/70 my-4 text-sm md:text-base">
        “In my country, education is very important. My parents always tell me to study hard. I think
        university is a good opportunity to learn new things and meet different people. Also, I
        want to get a good job in the future. Therefore, I will do my best in every class.”
      </blockquote>
      <p>
        This ESL sample uses simple sentence structures and common vocabulary. Research has shown
        that detectors trained primarily on native-English prose often misclassify such writing as
        AI because it lacks the stylistic complexity of a more advanced writer. The sample is
        clearly human but statistically resembles default AI output.
      </p>

      <h3 className="text-xl font-bold text-navy pt-2">Example 7: Professional Business Writing</h3>
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/70 my-4 text-sm md:text-base">
        “We propose a phased rollout beginning in Q3. Phase one will focus on user onboarding and
        feedback collection. Phase two will introduce premium features based on early-adopter input.
        We anticipate a 15% increase in retention within six months, subject to market conditions and
        competitive response.”
      </blockquote>
      <p>
        Business documents often rely on templates, numbered phases, and measured projections.
        These conventions make the text predictable and therefore more AI-like to a classifier.
        Yet the content may be the product of careful human strategic planning.
      </p>

      <KeyTakeaways
        items={[
          'Formal structure and generic transitions frequently trigger false positives.',
          'Personal, irregular writing can fool detectors, including AI imitations of it.',
          'Mixed documents can produce misleadingly moderate overall scores.',
          'ESL, technical, and business writing each have distinct detector failure modes.',
          'Contextual review is essential for every flagged sample.',
        ]}
      />
    </Section>
  );
}

export function MythsVsFactsSection() {
  return (
    <Section id="myths-vs-facts" title="Myths vs. Facts About AI Detection">
      <p>
        Misinformation about AI detection spreads quickly. Below we separate common myths from what
        research actually supports.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Myth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              “A 99% AI score means the essay was definitely written by AI.”
            </p>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Fact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              A 99% score means the text strongly resembles patterns in the detector's AI training
              data. Human writing can also produce very high scores under certain conditions.
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Myth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              “If the detector says human, the essay is clean.”
            </p>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Fact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              False negatives are common with edited, paraphrased, or mixed AI text. A low score is
              not proof of human authorship.
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Myth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              “AI detectors can identify specific models like GPT-5.5 or Gemini.”
            </p>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Fact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              Most detectors do not reliably identify the model that produced a text. They only
              estimate whether the text resembles their training distribution.
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Myth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              “Grammarly and similar tools are the same as using AI to write an essay.”
            </p>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-navy">Fact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 text-pretty">
              Grammar tools correct surface errors. They do not generate content, but they can
              smooth prose enough to raise AI probability scores.
            </p>
          </CardContent>
        </Card>
      </div>

      <KeyTakeaways
        items={[
          'High scores are not proof; low scores are not absolution.',
          'Detectors do not identify specific AI models reliably.',
          'Grammar tools are not authorship tools, but they can affect detection.',
          'Every score should be interpreted in context.',
        ]}
      />
    </Section>
  );
}

export function ActionPlanSection() {
  return (
    <Section id="action-plan" title="Step-by-Step Action Plan for Flagged Essays">
      <p>
        Whether you are a student facing a flag or an educator responding to one, a clear plan
        reduces stress and improves fairness. The following steps are designed to be followed in
        order.
      </p>

      <h3 className="text-xl font-bold text-navy pt-2">If Your Essay Was Flagged</h3>
      <ol className="list-decimal pl-5 space-y-3">
        <li>
          <strong>Do not panic.</strong> A flag is not a verdict. It is a signal that your text
          shares statistical patterns with AI output. Many human essays trigger false positives.
        </li>
        <li>
          <strong>Record the details.</strong> Screenshot the detector score, the tool name, the
          version if available, the date, and the exact text that was analyzed.
        </li>
        <li>
          <strong>Gather your evidence.</strong> Collect drafts, outlines, notes, source PDFs,
          revision history, and any peer-review comments. Process evidence is usually more
          persuasive than detector results.
        </li>
        <li>
          <strong>Run additional checks.</strong> Use other detectors, including the one on this
          site, to see whether scores are consistent. Large disagreements between tools weaken
          the case for a single conclusion.
        </li>
        <li>
          <strong>Request a conversation.</strong> Email your instructor calmly, explain your
          writing process, attach evidence, and ask how the score will factor into the grade.
        </li>
        <li>
          <strong>Know your rights.</strong> Review your institution's academic-integrity policy.
          Most require more than a detector score before a finding of misconduct.
        </li>
      </ol>

      <h3 className="text-xl font-bold text-navy pt-2">If You Are Reviewing a Flagged Essay</h3>
      <ol className="list-decimal pl-5 space-y-3">
        <li>
          <strong>Start with the score, not the student.</strong> Avoid pre-judgment. The score is
          one input among many.
        </li>
        <li>
          <strong>Request process evidence.</strong> Ask for drafts, outlines, and research notes
          before discussing possible sanctions.
        </li>
        <li>
          <strong>Consider context.</strong> ESL status, assignment type, and the student's prior
          writing all affect how a score should be interpreted.
        </li>
        <li>
          <strong>Document everything.</strong> Keep a record of the text analyzed, the tool used,
          and the score. Reproducibility matters if the case is appealed.
        </li>
        <li>
          <strong>Make a proportionate decision.</strong> Match any response to the strength of the
          evidence. A high score without corroborating evidence should not trigger severe penalties.
        </li>
      </ol>

      <KeyTakeaways
        items={[
          'Students should gather process evidence and request a conversation.',
          'Educators should request drafts and consider context before any finding.',
          'Documentation and proportionality protect both students and institutions.',
          'Multiple detector scores provide more useful information than a single flag.',
        ]}
      />
    </Section>
  );
}

export function DetectorLimitationsSection() {
  return (
    <Section id="detector-limitations" title="Fundamental Limitations of AI Detection">
      <p>
        It is worth understanding why AI detection is intrinsically hard. These limitations are
        not temporary engineering problems; they reflect the nature of language, authorship, and
        machine learning.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">The Adversarial Arms Race</h3>
      <p>
        Every time detectors improve, AI generators can be trained or prompted to evade them. This
        creates an arms race similar to spam filters and malware scanners. Unlike spam, however,
        “human-sounding” is a moving target because human language itself evolves.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">The Definition Problem</h3>
      <p>
        There is no clean boundary between AI-assisted and human writing. If a student outlines an
        essay, asks AI for feedback, rewrites every sentence, and runs the result through Grammarly,
        is the final product human or AI-assisted? Detectors cannot answer ethical or procedural
        questions like this.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Training Data Bias</h3>
      <p>
        Detectors are only as fair as their training data. Corpora dominated by native English,
        journalistic prose, or undergraduate essays will systematically misclassify texts outside
        those distributions. Fairness audits are essential but still uncommon.
      </p>
      <h3 className="text-xl font-bold text-navy pt-2">Threshold Arbitrariness</h3>
      <p>
        The cutoff between “AI” and “human” is chosen by the vendor. A 49% score and a 51% score may
        receive opposite labels despite being statistically indistinguishable. Users who focus on
        the binary label miss the uncertainty.
      </p>
      <KeyTakeaways
        items={[
          'Detection is an arms race, not a solved problem.',
          'Authorship is a spectrum; detectors cannot adjudicate it.',
          'Training data bias affects fairness across languages and writing styles.',
          'Thresholds are arbitrary; look at scores, not just labels.',
        ]}
      />
    </Section>
  );
}
