import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Target, User, Zap, Globe, ShieldCheck, TrendingUp } from 'lucide-react';

const values = [
  {
    icon: ShieldCheck,
    title: 'Trust & Transparency',
    desc: 'We build tools that help people examine content with more context while being clear about what automated analysis can and cannot establish.',
  },
  {
    icon: Zap,
    title: 'Practical Analysis',
    desc: 'AIDetector.cx brings content analysis and writing tools together in workflows designed to help users review and improve their work.',
  },
  {
    icon: Globe,
    title: 'Accessible Tools',
    desc: 'Our tools are designed for individual creators, students, publishers, content teams, and organizations working with digital content.',
  },
  {
    icon: TrendingUp,
    title: 'Continuous Improvement',
    desc: 'Generative AI changes quickly, so we continue to develop and refine the platform as content workflows and AI systems evolve.',
  },
];

export default function AboutPage() {
  return (
    <MainLayout>
      <section className="bg-navy text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-5">About AIDetector.cx</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-balance leading-tight">
            Building Practical Tools for Content Integrity
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto text-pretty leading-relaxed">
            AIDetector.cx develops tools for AI-content analysis, plagiarism checking, content optimization, and related content-integrity workflows.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Mission</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4 text-balance">
                Helping people make better-informed decisions about digital content
              </h2>
              <p className="text-muted-foreground leading-relaxed text-pretty mb-4">
                Generative AI has changed how content is created, reviewed, and published. AIDetector.cx is built to give users useful signals and tools for examining content and improving their workflows.
              </p>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                AI-detection results are probabilistic signals rather than proof of authorship. We aim to present those signals alongside practical content tools so users can apply their own judgment and context.
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-64">
              <div className="w-32 h-32 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
                <Target className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Our Approach</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance">What guides the platform</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} className="border-border shadow-card h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy mb-1">{v.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{v.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Founder</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3 text-balance">Leadership</h2>
          </div>
          <Card className="border-border shadow-card">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-navy">Anike Tobechukwu</h3>
                  <p className="text-sm text-primary font-medium mb-3">Founder, AIDetector.cx</p>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                    Founder of AIDetector.cx, focused on developing practical tools for AI-content analysis, content integrity, plagiarism checking, and content optimization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-navy text-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-balance">Explore AIDetector.cx</h2>
          <p className="text-white/65 mb-6 text-pretty">
            Use the platform to analyze content and explore the tools available for content review and optimization.
          </p>
          <a href="/detector" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
            Try AI Detection
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
