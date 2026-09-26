import { SectionWrapper } from '@/components/SectionWrapper'

const updates = [
  {
    year: '2022',
    title: 'Helpful Content Update',
    summary:
      'Google rolled out a site-level signal to identify content created primarily for search engines rather than people.',
    impact:
      'Pages that aggregated shallow answers, reused press releases, or lacked first-hand expertise began to lose visibility across the site.',
    takeaway:
      'Write for readers first. Satisfy search intent with depth, not volume.',
  },
  {
    year: '2023',
    title: 'AI Guidance Clarification',
    summary:
      'Google clarified that AI-generated content is not inherently against guidelines and that quality, not production method, determines ranking.',
    impact:
      'Publishers shifted from hiding AI use to improving AI-assisted workflows with human review, fact-checking, and expert editing.',
    takeaway:
      'Disclose AI assistance if relevant, but focus on accuracy and originality.',
  },
  {
    year: '2024',
    title: 'Core Update',
    summary:
      'A major core update refined how helpfulness signals, user intent, and spam detection interact.',
    impact:
      'Sites with thin, unoriginal, or low-trust content saw increased volatility. Authoritative, well-maintained pages gained stability.',
    takeaway:
      'Maintain content freshness, update statistics, and remove outdated pages.',
  },
  {
    year: '2025+',
    title: 'Ongoing Spam Detection',
    summary:
      'Google and Bing continue to improve detection of scaled content abuse, expired-domain abuse, and reputation manipulation.',
    impact:
      'Mass-produced AI pages, parasite SEO, and fake-author content are now caught faster and at larger scale.',
    takeaway:
      'Build genuine topical authority and avoid shortcuts that scale low value.',
  },
]

export function AlgorithmTimeline() {
  return (
    <SectionWrapper id="timeline" className="bg-background">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          History
        </p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">
          Major Algorithm Updates Timeline
        </h2>
        <p className="prose-custom mt-4">
          How search engines evolved from punishing shallow pages to evaluating content quality
          regardless of the authoring tool.
        </p>
      </div>

      <div className="relative mt-14">
        <div
          className="absolute left-4 top-0 h-full w-0.5 bg-border md:left-1/2"
          aria-hidden="true"
        />
        <ul className="space-y-10 md:space-y-0">
          {updates.map((update, index) => (
            <li
              key={update.year}
              className="relative grid gap-6 md:grid-cols-2 md:gap-8"
            >
              {/* Timeline dot */}
              <div
                className="absolute left-4 top-0 z-10 h-4 w-4 -translate-x-1.5 rounded-full border-2 border-background bg-primary md:left-1/2 md:-translate-x-1/2"
                aria-hidden="true"
              />

              {/* Year label */}
              <div
                className={`pl-12 md:pl-0 ${
                  index % 2 === 0 ? 'md:text-right' : 'md:order-2 md:text-left'
                }`}
              >
                <span className="inline-block rounded-full bg-primary px-4 py-1 text-sm font-bold text-primary-foreground">
                  {update.year}
                </span>
              </div>

              {/* Card */}
              <div
                className={`pl-12 md:pl-0 ${
                  index % 2 === 0 ? 'md:order-2' : 'md:order-1'
                }`}
              >
                <article className="rounded-xl bg-muted p-6">
                  <h3 className="text-xl font-bold">{update.title}</h3>
                  <p className="mt-2 text-foreground/80">{update.summary}</p>
                  <div className="mt-4 space-y-2">
                    <div>
                      <span className="text-sm font-semibold text-primary">Impact:</span>
                      <p className="text-sm text-foreground/70">{update.impact}</p>
                    </div>
                    <div className="rounded-lg bg-background p-3">
                      <span className="text-sm font-semibold text-foreground">
                        Publisher takeaway:
                      </span>
                      <p className="text-sm text-foreground/70">{update.takeaway}</p>
                    </div>
                  </div>
                </article>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SectionWrapper>
  )
}
