import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, Mail } from 'lucide-react';

const coverage = [
  {
    outlet: 'TechCrunch',
    logo: '📰',
    headline: 'AIDetector.cx raises $12M Series A to combat AI-generated misinformation',
    date: 'March 2026',
    href: '#',
  },
  {
    outlet: 'The Verge',
    logo: '📰',
    headline: 'The new tool helping publishers verify whether articles were written by AI',
    date: 'January 2026',
    href: '#',
  },
  {
    outlet: 'Forbes',
    logo: '📰',
    headline: 'How AIDetector.cx became the gold standard for enterprise AI content compliance',
    date: 'November 2025',
    href: '#',
  },
  {
    outlet: 'Wired',
    logo: '📰',
    headline: "Detecting AI text is hard. This startup claims 98% accuracy — here's how",
    date: 'September 2025',
    href: '#',
  },
  {
    outlet: 'VentureBeat',
    logo: '📰',
    headline: 'AIDetector.cx launches Content Studio: A full AI SEO writing assistant for marketers',
    date: 'July 2025',
    href: '#',
  },
  {
    outlet: 'Fast Company',
    logo: '📰',
    headline: 'The AI authenticity company quietly powering content teams at 500 Fortune 1000s',
    date: 'April 2025',
    href: '#',
  },
];

const pressKit = [
  { label: 'Company Logo (SVG + PNG)', size: '2.1 MB' },
  { label: 'Brand Guidelines PDF', size: '4.8 MB' },
  { label: 'Executive Headshots', size: '12 MB' },
  { label: 'Product Screenshots', size: '9.3 MB' },
  { label: 'Company Fact Sheet', size: '340 KB' },
];

const milestones = [
  { year: '2022', event: 'Founded in San Francisco by Aria Chen and Marcus Webb' },
  { year: '2022', event: 'Seed round of $2.5M, first detection model ships with 91% accuracy' },
  { year: '2023', event: 'Launched public API; 10,000 developers integrate in first quarter' },
  { year: '2023', event: 'Series A — $12M raised to scale infrastructure and research team' },
  { year: '2024', event: 'Accuracy reaches 98% — benchmark-best across GPT-4, Claude, and Gemini outputs' },
  { year: '2025', event: 'Content Studio launches — full AI + SEO article generation workflow' },
  { year: '2026', event: 'SEO Writing Assistant ships; 2M+ analyses completed to date' },
];

export default function PressPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-navy text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-5">Press Room</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
            News &amp; Media Resources
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto text-pretty leading-relaxed">
            For press inquiries, interview requests, or to access our press kit, reach out to our media team below.
          </p>
          <a href="mailto:press@aidetector.cx" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors mt-6">
            <Mail className="w-4 h-4" /> press@aidetector.cx
          </a>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-navy text-balance">In the Press</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {coverage.map((item) => (
              <Card key={item.headline} className="border-border shadow-card h-full group hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">{item.outlet}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{item.date}</span>
                  </div>
                  <p className="text-sm font-medium text-navy leading-relaxed text-pretty mb-3">{item.headline}</p>
                  <a href={item.href} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                    Read article <ExternalLink className="w-3 h-3" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl font-bold text-navy mb-10 text-center text-balance">Company Milestones</h2>
          <div className="flex flex-col gap-0">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                    {m.year.slice(2)}
                  </div>
                  {i < milestones.length - 1 && <div className="w-px flex-1 bg-border my-1 min-h-[24px]" />}
                </div>
                <div className="pb-6 pt-1">
                  <span className="text-xs font-semibold text-primary block mb-0.5">{m.year}</span>
                  <p className="text-sm text-navy">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Kit */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-navy mb-2 text-balance">Press Kit</h2>
            <p className="text-muted-foreground text-pretty">Download official assets, logos, and brand materials.</p>
          </div>
          <div className="flex flex-col gap-3">
            {pressKit.map((item) => (
              <Card key={item.label} className="border-border shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-navy">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.size}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1 shrink-0" onClick={() => {}}>
                      <Download className="w-3 h-3" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
