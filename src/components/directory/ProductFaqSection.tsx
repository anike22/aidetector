import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import type { ProductFaqItem } from '@/types/directory';

interface ProductFaqSectionProps {
  productName: string;
  faqs?: ProductFaqItem[];
}

export function ProductFaqSection({ productName, faqs }: ProductFaqSectionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0, 1]);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const toggleIndex = (index: number) => {
    setOpenIndexes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div id="faq" className="space-y-6 scroll-mt-24">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Frequently Asked Questions about {productName}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Factual answers to commonly asked questions regarding pricing, privacy, model availability, and alternatives.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndexes.includes(index);
          return (
            <div
              key={index}
              className="rounded-2xl border border-border bg-card overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleIndex(index)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-bold text-xs sm:text-sm text-foreground hover:bg-muted/20 transition-colors"
              >
                <span>{faq.question}</span>
                <span className="shrink-0 text-muted-foreground">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
