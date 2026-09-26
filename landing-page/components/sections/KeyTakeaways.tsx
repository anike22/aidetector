import { Check } from 'lucide-react'
import { SectionWrapper } from '@/components/SectionWrapper'

const takeaways = [
  {
    title: 'AI is allowed',
    description: 'Search engines do not ban AI-generated content.',
  },
  {
    title: 'Quality wins',
    description: 'Original, accurate, and helpful content outperforms thin pages.',
  },
  {
    title: 'Human expertise matters',
    description: 'Expert review and real-world experience strengthen E-E-A-T.',
  },
  {
    title: 'User satisfaction is essential',
    description: 'Pages that satisfy intent and are easy to read earn trust.',
  },
  {
    title: 'Helpful content ranks',
    description: 'Helpfulness, not production method, is the ranking signal.',
  },
]

export function KeyTakeaways() {
  return (
    <SectionWrapper id="key-takeaways" className="bg-background">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Summary
        </p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">Key Takeaways</h2>
        <p className="prose-custom mt-4">
          The most important principles to remember when creating AI-assisted content.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {takeaways.map((takeaway) => (
          <article
            key={takeaway.title}
            className="rounded-xl bg-muted p-6 text-center"
          >
            <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-3 text-primary">
              <Check className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold">{takeaway.title}</h3>
            <p className="mt-2 text-sm text-foreground/70">{takeaway.description}</p>
          </article>
        ))}
      </div>
    </SectionWrapper>
  )
}
