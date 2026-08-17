import { Check } from 'lucide-react'
import { SectionWrapper } from '@/components/SectionWrapper'

const items = [
  {
    title: 'Research-backed articles',
    description:
      'Cite credible studies, link to original sources, and explain the data in your own words.',
  },
  {
    title: 'Expert-reviewed content',
    description:
      'Have a subject-matter expert review claims, add nuance, and correct technical errors.',
  },
  {
    title: 'Original case studies',
    description:
      'Share first-party data, real experiments, and measurable outcomes from your own work.',
  },
  {
    title: 'Unique insights',
    description:
      'Go beyond summarizing existing pages. Offer frameworks, comparisons, and lessons learned.',
  },
  {
    title: 'Real experiences',
    description:
      'Include personal observations, interviews, and practical knowledge that AI cannot fabricate.',
  },
  {
    title: 'Updated information',
    description:
      'Refresh statistics, screenshots, and examples so the page remains accurate over time.',
  },
  {
    title: 'Internal linking',
    description:
      'Connect related pages to help readers and search engines understand topical authority.',
  },
  {
    title: 'Clear structure',
    description:
      'Use descriptive headings, short paragraphs, lists, and tables to make scanning easy.',
  },
]

export function PerformingContent() {
  return (
    <SectionWrapper id="performing-content" className="bg-background">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          What Works
        </p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          AI Content That Performs Well
        </h2>
        <p className="prose-custom mt-4">
          These patterns are common to pages that maintain strong rankings and earn trust after
          being drafted with AI assistance.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-border/60 bg-card p-6"
          >
            <div className="mb-4 inline-flex rounded-full bg-green-100 p-2 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <Check className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-foreground/70">{item.description}</p>
          </article>
        ))}
      </div>
    </SectionWrapper>
  )
}
