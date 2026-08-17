import { ArrowDown, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroIllustration } from '@/components/HeroIllustration'

export function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-background pb-16 pt-24 md:pb-24 md:pt-32"
      aria-labelledby="hero-title"
    >
      <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col items-start text-left animate-fade-in-up">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
              SEO & AI Research
            </p>
            <h1
              id="hero-title"
              className="text-balance text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
            >
              Algorithmic Updates: How Search Engine Algorithms Treat AI Content
            </h1>
            <p className="prose-custom mt-6 max-w-2xl">
              Learn how Google, Bing, and other search engines evaluate AI-generated content,
              what algorithm updates mean for publishers, and how to create AI-assisted content
              that ranks.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="focus-ring">
                <a href="#introduction">
                  <ArrowDown className="mr-2 h-4 w-4" aria-hidden="true" />
                  Read the Guide
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="focus-ring">
                <a href="#timeline">
                  <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
                  View Algorithm Timeline
                </a>
              </Button>
            </div>
          </div>
          <div className="relative flex items-center justify-center animate-fade-in-up [animation-delay:200ms] [animation-fill-mode:backwards]">
            <div className="relative w-full max-w-md">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
