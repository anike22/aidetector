import { Check } from 'lucide-react'
import { SectionWrapper } from '@/components/SectionWrapper'

const practices = [
  'Human editing',
  'Fact checking',
  'Unique examples',
  'Real expertise',
  'Clear sources',
  'Helpful formatting',
  'Fresh updates',
  'Original images',
  'Good UX',
  'Fast page speed',
]

export function BestPractices() {
  return (
    <SectionWrapper id="best-practices" className="bg-background">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Process
        </p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">Best Practices</h2>
        <p className="prose-custom mt-4">
          A practical checklist for turning AI drafts into content that satisfies readers and search
          engines.
        </p>
      </div>
      <ul
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {practices.map((practice) => (
          <li
            key={practice}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-medium">{practice}</span>
          </li>
        ))}
      </ul>
    </SectionWrapper>
  )
}
