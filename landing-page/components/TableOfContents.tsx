'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'google-position', label: "Google's Position" },
  { id: 'timeline', label: 'Algorithm Timeline' },
  { id: 'ranking-signals', label: 'Ranking Signals' },
  { id: 'performing-content', label: 'Content That Performs' },
  { id: 'penalized-content', label: 'Content That Gets Penalized' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'faq', label: 'FAQs' },
  { id: 'key-takeaways', label: 'Key Takeaways' },
]

export function TableOfContents() {
  const [activeId, setActiveId] = useState<string>('introduction')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }

  return (
    <nav
      className="sticky top-24 hidden max-h-[calc(100vh-8rem)] w-64 overflow-y-auto lg:block"
      aria-label="Table of contents"
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </h2>
      <ul className="space-y-1 border-l border-border">
        {sections.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={(e) => handleClick(e, id)}
              className={cn(
                'block border-l-2 py-2 pl-4 text-sm transition-colors',
                activeId === id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              aria-current={activeId === id ? 'true' : undefined}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
