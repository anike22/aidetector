import { ArrowRight, BookOpen, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FooterCTA() {
  return (
    <section
      className="bg-primary py-16 text-primary-foreground md:py-24"
      aria-label="Call to action"
    >
      <div className="container mx-auto max-w-[1200px] px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
          Build AI Content That Search Engines Trust
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground">
          Apply these principles to your next article and turn AI assistance into a sustainable
          SEO advantage.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            variant="secondary"
            className="focus-ring bg-white text-primary hover:bg-white/90"
          >
            <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
            Read More SEO Guides
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="focus-ring border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
            Explore AI Writing Tips
          </Button>
        </div>
      </div>
    </section>
  )
}
