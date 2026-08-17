import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter, Playfair_Display } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ReadingProgress } from '@/components/ReadingProgress'
import { Header } from '@/components/Header'
import { cn } from '@/lib/utils'
import { StructuredData } from '@/lib/structured-data'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  preload: true,
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL('https://aidetector.cx'),
  title: 'Algorithmic Updates: How Search Engines Treat AI Content',
  description:
    'Learn how Google and Bing evaluate AI content, what algorithm updates mean for publishers, and how to create AI-assisted content that ranks.',
  keywords: [
    'AI content',
    'search engine algorithms',
    'Google helpful content',
    'E-E-A-T',
    'AI SEO',
    'Bing AI content',
    'algorithm updates',
  ],
  alternates: {
    canonical: '/algorithmic-updates',
  },
  openGraph: {
    type: 'article',
    locale: 'en_US',
    url: 'https://aidetector.cx/algorithmic-updates',
    siteName: 'AIDetector.cx',
    title: 'Algorithmic Updates: How Search Engines Treat AI Content',
    description:
      'Learn how Google and Bing evaluate AI content, what algorithm updates mean for publishers, and how to create AI-assisted content that ranks.',
    images: [
      {
        url: 'https://aidetector.cx/algorithmic-updates/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Search engine algorithm and AI neural network visualization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Algorithmic Updates: How Search Engines Treat AI Content',
    description:
      'Learn how Google and Bing evaluate AI content, what algorithm updates mean for publishers, and how to create AI-assisted content that ranks.',
    images: ['https://aidetector.cx/algorithmic-updates/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  authors: [{ name: 'AIDetector.cx Editorial Team' }],
  creator: 'AIDetector.cx',
  publisher: 'AIDetector.cx',
  category: 'SEO',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, playfair.variable)}
      suppressHydrationWarning
    >
      <head>
        <StructuredData />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to main content
          </a>
          <ReadingProgress />
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
