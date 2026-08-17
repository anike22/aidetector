import { Search } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Search className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="font-heading text-xl font-bold">AIDetector.cx</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">
            Algorithmic Updates
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
