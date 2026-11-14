import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';



function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-sm"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-foreground text-sm md:text-base leading-snug">{question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <p className="pb-5 text-sm md:text-base text-muted-foreground leading-relaxed text-pretty pr-9">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="py-16 md:py-24 bg-muted/20" aria-labelledby="faq-heading">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2
            id="faq-heading"
            className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance"
          >
            Frequently Asked Questions
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            Honest answers about how AI detection works, what the results mean, and where the limits are.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 px-6 divide-y-0">
          {FAQ_DATA.map((item, i) => (
            <FAQItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          More questions?{' '}
          <Link to="/guides" className="text-primary underline underline-offset-4 hover:no-underline">
            Browse our AI detection guides
          </Link>{' '}
          or{' '}
          <Link to="/contact" className="text-primary underline underline-offset-4 hover:no-underline">
            contact us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
