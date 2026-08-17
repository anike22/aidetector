import { Shield, Users, Search, FileCheck, Award, HeartHandshake } from 'lucide-react'
import { SectionWrapper } from '@/components/SectionWrapper'

const cards = [
  {
    icon: Search,
    title: 'AI Content Is Allowed',
    description:
      'Google has stated clearly that it does not ban AI-generated content. Its ranking systems aim to reward original, high-quality content no matter how it is produced.',
  },
  {
    icon: HeartHandshake,
    title: 'Helpful Content System',
    description:
      'Google’s Helpful Content System evaluates content created for people first. It demotes pages written primarily to rank in search engines rather than to help readers.',
  },
  {
    icon: Users,
    title: 'E-E-A-T',
    description:
      'Experience, Expertise, Authoritativeness, and Trustworthiness guide quality raters and algorithms. Demonstrating real experience is the strongest signal.',
  },
  {
    icon: Shield,
    title: 'Spam Policies',
    description:
      'Spam policies target mass-produced, low-value, or manipulative content. Automation used to game rankings is penalized; automation used to assist expert creators is not.',
  },
  {
    icon: FileCheck,
    title: 'Originality Over Production',
    description:
      'A page can be produced with AI assistance if it adds original analysis, unique examples, or fresh insights. Copying, spinning, or regurgitating sources is the risk.',
  },
  {
    icon: Award,
    title: 'User-First Quality',
    description:
      'The production method is less important than the result. Content should answer the user’s next question, cite reliable sources, and be accurate from start to finish.',
  },
]

export function GooglePosition() {
  return (
    <SectionWrapper id="google-position" className="bg-muted">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Search Policy
        </p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">Google&apos;s Position</h2>
        <p className="prose-custom mt-4">
          Google&apos;s stance on AI content is clear: the production method is not the problem.
          Quality, originality, and user value are what matter.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-xl bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
              <card.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold">{card.title}</h3>
            <p className="mt-2 text-foreground/70">{card.description}</p>
          </article>
        ))}
      </div>
    </SectionWrapper>
  )
}
