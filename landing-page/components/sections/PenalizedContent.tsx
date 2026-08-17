import { AlertOctagon } from 'lucide-react'
import { SectionWrapper } from '@/components/SectionWrapper'

const warnings = [
  {
    title: 'Keyword stuffing',
    description:
      'Repeating the same terms unnaturally makes content unreadable and signals low quality.',
  },
  {
    title: 'Mass-produced pages',
    description:
      'Publishing hundreds of near-identical pages with only minor variations dilutes authority.',
  },
  {
    title: 'Duplicate content',
    description:
      'Copying existing pages without adding original value creates cannibalization and trust issues.',
  },
  {
    title: 'Fake expertise',
    description:
      'Inventing credentials or publishing on topics you cannot verify damages E-E-A-T signals.',
  },
  {
    title: 'No human review',
    description:
      'Publishing raw AI output without fact-checking leads to errors, hallucinations, and penalties.',
  },
  {
    title: 'Low-value affiliate pages',
    description:
      'Pages that summarize products without original testing provide little reader value.',
  },
  {
    title: 'Auto-generated spam',
    description:
      'Unreviewed, formulaic content created at scale is a primary target of spam policies.',
  },
  {
    title: 'Misleading information',
    description:
      'False claims, fake statistics, and deceptive titles are penalized regardless of authorship.',
  },
]

export function PenalizedContent() {
  return (
    <SectionWrapper id="penalized-content" className="bg-muted">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          What to Avoid
        </p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          AI Content That Gets Penalized
        </h2>
        <p className="prose-custom mt-4">
          These are the patterns that trigger helpful-content and spam demotions, whether the text
          is written by a human or by an AI.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {warnings.map((warning) => (
          <article
            key={warning.title}
            className="rounded-xl border border-red-200 bg-card p-6 dark:border-red-900/50"
          >
            <div className="mb-4 inline-flex rounded-full bg-red-100 p-2 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <AlertOctagon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold">{warning.title}</h3>
            <p className="mt-2 text-sm text-foreground/70">{warning.description}</p>
          </article>
        ))}
      </div>
    </SectionWrapper>
  )
}
