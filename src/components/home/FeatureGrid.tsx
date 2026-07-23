import { Shield, Zap, Search, PenSquare, FileText, Globe, Code, FileSearch, User, LayoutDashboard, Link as LinkIcon, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    title: 'Enterprise AI Detector',
    description: 'Pinpoint AI-generated content from GPT-4, Claude 3, and Gemini with unmatched accuracy.',
    icon: Shield,
    href: '/detector',
    accuracy: '99.8% Accuracy',
    speed: '< 2s Speed',
    types: 'TXT, PDF, DOCX',
    benefits: ['Sentence-level analysis', 'Model fingerprinting', 'False-positive protection']
  },
  {
    title: 'Stealth Humanizer',
    description: 'Transform AI writing into undetectable, natural human text while preserving the original meaning.',
    icon: User,
    href: '/humanizer',
    accuracy: '100% Bypass',
    speed: '< 3s Speed',
    types: 'TXT, API',
    benefits: ['SEO preservation', 'Tone matching', 'Grammar enhancement']
  },
  {
    title: 'Plagiarism Checker',
    description: 'Scan billions of web pages and academic papers to ensure complete content originality.',
    icon: FileSearch,
    href: '/plagiarism-checker',
    accuracy: 'Deep Crawl',
    speed: '< 5s Speed',
    types: 'URL, PDF, TXT',
    benefits: ['Exact match detection', 'Source linking', 'Citation verification']
  },
  {
    title: 'SEO Assistant',
    description: 'Optimize your content for search engines with data-driven keyword and structure recommendations.',
    icon: Search,
    href: '/seo-assistant',
    accuracy: 'Data-Driven',
    speed: 'Real-time',
    types: 'URL, HTML',
    benefits: ['Keyword density', 'Readability score', 'Heading analysis']
  },
  {
    title: 'Chrome Extension',
    description: 'Detect AI and humanize text directly in your browser without switching tabs.',
    icon: Globe,
    href: '/chrome-extension',
    accuracy: 'One-Click',
    speed: 'Instant',
    types: 'Webpages',
    benefits: ['Highlight to detect', 'Auto-extraction', 'Lightweight']
  },
  {
    title: 'Developer API',
    description: 'Integrate our detection and humanization engines directly into your own applications.',
    icon: Code,
    href: '/api-platform',
    accuracy: 'REST API',
    speed: '< 1s Latency',
    types: 'JSON',
    benefits: ['99.99% Uptime', 'Scalable limits', 'Webhook support']
  }
];

export default function FeatureGrid() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-full h-[500px] bg-primary/5 -skew-y-6 transform origin-top-left -z-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            A Complete Suite for <br className="hidden md:block" /> Content Professionals
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to verify originality, bypass detectors, and rank higher on Google. Built on proprietary models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <Card key={i} className="group relative bg-card hover:bg-muted/10 border-border/50 shadow-sm hover:shadow-premium transition-all duration-300 overflow-hidden rounded-2xl flex flex-col h-full">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <feature.icon className="w-24 h-24 text-primary" />
              </div>
              <div className="p-8 flex-1 flex flex-col relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                  {feature.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="secondary" className="bg-success/10 text-success text-xs font-semibold">{feature.accuracy}</Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs font-semibold">{feature.speed}</Badge>
                  <Badge variant="outline" className="text-xs text-muted-foreground">{feature.types}</Badge>
                </div>

                <ul className="space-y-2 mb-8">
                  {feature.benefits.map((benefit, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Button asChild variant="outline" className="w-full mt-auto border-border/50 hover:bg-primary hover:text-white group-hover:border-primary transition-all">
                  <Link to={feature.href}>
                    Explore Tool <ArrowRight className="w-4 h-4 ml-2" />
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

// Trigger HMR update
