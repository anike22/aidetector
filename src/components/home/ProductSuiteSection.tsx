import { Shield, GraduationCap, Search, FileSearch, TextCursor, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const PRODUCTS = [
  {
    title: 'AI Detector',
    href: '/detector',
    icon: Shield,
    description: 'Dual-mode analysis with Balanced and Aggressive engines for comprehensive AI probability assessment.',
    cta: 'Try AI Detector',
  },
  {
    title: 'Essay Studio',
    href: '/essay-studio',
    icon: GraduationCap,
    description: 'Guided academic writing workspace: Plan → Outline → Write → Verify → Improve → Cite → Submit.',
    cta: 'Start Writing',
    featured: true,
  },
  {
    title: 'Humanizer',
    href: '/humanizer',
    icon: TextCursor,
    description: 'Refine AI-assisted drafts into natural, human-like text while preserving meaning and tone.',
    cta: 'Humanize Text',
  },
  {
    title: 'Plagiarism Checker',
    href: '/plagiarism-checker',
    icon: FileSearch,
    description: 'Scan text for duplication and source similarity to ensure originality.',
    cta: 'Check Plagiarism',
  },
  {
    title: 'SEO Assistant',
    href: '/seo-assistant',
    icon: Search,
    description: 'Content optimization and readability analysis for search engine visibility.',
    cta: 'Optimize Content',
  },
  {
    title: 'API & Integrations',
    href: '/api-platform',
    icon: LinkIcon,
    description: 'Integrate detection and analysis into your own workflows, products, and content pipelines.',
    cta: 'View API Docs',
  },
];

export default function ProductSuiteSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            AI Content Intelligence, Beyond Detection
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            A connected set of tools for students, educators, writers, SEO teams, and enterprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((p) => (
            <Card
              key={p.title}
              className={`group relative border-border/50 bg-card flex flex-col h-full ${p.featured ? 'md:col-span-2 lg:col-span-1 ring-1 ring-primary/20' : ''}`}
            >
              {p.featured && (
                <Badge className="absolute top-4 right-4 bg-primary/10 text-primary text-xs font-semibold border-primary/20">
                  Featured
                </Badge>
              )}
              <div className="p-6 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 text-primary group-hover:scale-110 transition-transform">
                  <p.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{p.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                  {p.description}
                </p>
                <Button asChild variant="outline" className="w-full mt-auto">
                  <Link to={p.href}>
                    {p.cta} <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
