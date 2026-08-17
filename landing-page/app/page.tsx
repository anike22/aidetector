import { Hero } from '@/components/sections/Hero'
import { Introduction } from '@/components/sections/Introduction'
import { GooglePosition } from '@/components/sections/GooglePosition'
import { AlgorithmTimeline } from '@/components/sections/AlgorithmTimeline'
import { RankingSignals } from '@/components/sections/RankingSignals'
import { PerformingContent } from '@/components/sections/PerformingContent'
import { PenalizedContent } from '@/components/sections/PenalizedContent'
import { BestPractices } from '@/components/sections/BestPractices'
import { FAQ } from '@/components/sections/FAQ'
import { KeyTakeaways } from '@/components/sections/KeyTakeaways'
import { FooterCTA } from '@/components/sections/FooterCTA'
import { TableOfContents } from '@/components/TableOfContents'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
          <main
            id="main-content"
            className="min-w-0"
            tabIndex={-1}
          >
            <Introduction />
            <GooglePosition />
            <AlgorithmTimeline />
            <RankingSignals />
            <PerformingContent />
            <PenalizedContent />
            <BestPractices />
            <FAQ />
            <KeyTakeaways />
          </main>
          <aside className="hidden lg:block">
            <TableOfContents />
          </aside>
        </div>
      </div>
      <FooterCTA />
    </div>
  )
}
