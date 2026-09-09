import { Lightbulb } from 'lucide-react'
import { SectionWrapper } from '@/components/SectionWrapper'

export function Introduction() {
  return (
    <SectionWrapper id="introduction" className="bg-background">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold md:text-4xl">Introduction</h2>
        <div className="prose-custom mt-6 space-y-4">
          <p>
            The explosion of generative AI tools has reshaped content creation. Millions of
            publishers now use large language models to draft articles, product descriptions, code
            explanations, and marketing copy. For search engines, this shift is not a reason to
            demonize automation but a reason to refine how they measure quality.
          </p>
          <p>
            Google, Bing, and other search engines have updated their algorithms to focus on the
            value content provides, not the tool used to create it. The difference between
            AI-generated and AI-assisted content is critical: AI-generated content is published
            with little or no human input, while AI-assisted content is shaped by human expertise,
            edited for accuracy, and designed for the reader.
          </p>
          <p>
            The central lesson from every recent algorithm update is that quality matters more than
            authorship. A page written entirely by a person can still rank poorly if it is thin,
            misleading, or unhelpful. Conversely, a page drafted with AI support can rank well if it
            demonstrates experience, expertise, authoritativeness, and trustworthiness.
          </p>
        </div>
        <aside
          className="mt-10 rounded-xl border-l-4 border-primary bg-muted p-6 md:p-8"
          aria-label="Key takeaway"
        >
          <div className="flex items-start gap-4">
            <Lightbulb
              className="mt-1 h-6 w-6 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-xl font-bold">Key Takeaway</h3>
              <p className="mt-2 text-foreground/80">
                Search engines reward content that is helpful, original, and trustworthy. Whether the
                text came from a human, an AI, or both, the ranking decision depends on quality and
                user satisfaction.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </SectionWrapper>
  )
}
