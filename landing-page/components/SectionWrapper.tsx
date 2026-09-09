import { cn } from '@/lib/utils'

interface SectionWrapperProps {
  id: string
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}

export function SectionWrapper({
  id,
  children,
  className,
  ariaLabel,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn('py-16 md:py-24', className)}
    >
      <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}
