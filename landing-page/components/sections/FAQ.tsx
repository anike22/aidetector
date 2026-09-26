import { SectionWrapper } from '@/components/SectionWrapper'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Does Google penalize AI content?',
    answer:
      'No. Google does not penalize content simply because AI was involved. It penalizes low-quality, misleading, or spammy content regardless of how it was produced. The key is satisfying user intent and demonstrating E-E-A-T.',
  },
  {
    question: 'Can AI articles rank first?',
    answer:
      'Yes, AI-assisted articles can rank first when they are original, well-researched, fact-checked, and provide genuine value. The production method matters far less than the usefulness of the final page.',
  },
  {
    question: 'How can I make AI content SEO friendly?',
    answer:
      'Focus on original research, expert review, accurate citations, clear structure, helpful formatting, fast page speed, and satisfying search intent. Treat AI as a drafting assistant, not the final publisher.',
  },
  {
    question: 'Should every AI article be edited?',
    answer:
      'Yes. Human editing is essential to catch factual errors, add expertise, improve tone, verify citations, and ensure the content reflects real-world experience.',
  },
  {
    question: 'Does E-E-A-T apply to AI?',
    answer:
      'Yes. Experience, Expertise, Authoritativeness, and Trustworthiness apply to all content, including AI-assisted content. The presence of a human author, editor, or expert reviewer strengthens E-E-A-T signals.',
  },
  {
    question: 'How does Bing treat AI content?',
    answer:
      'Bing evaluates content based on quality, relevance, and trust. It does not ban AI-generated content but rewards authoritative, accurate, and helpful pages that demonstrate genuine expertise.',
  },
]

export function FAQ() {
  return (
    <SectionWrapper id="faq" className="bg-muted">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="prose-custom mt-4">
            Clear answers to the most common questions about AI content and search engine
            algorithms.
          </p>
        </div>
        <Accordion type="single" collapsible className="mt-12" defaultValue="item-0">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SectionWrapper>
  )
}
