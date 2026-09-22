import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomeSEOAssistantCTA() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Card className="border border-border/80 bg-gradient-to-br from-card via-muted/20 to-card shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
        <CardContent className="p-5 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 mr-1 inline-block" />
                SEO & Content Quality
              </Badge>
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
                For Bloggers, Editors & Writers
              </span>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Creating content for search?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty max-w-3xl">
              Go beyond AI detection with SEO scoring, plagiarism checks, content uniqueness, readability and publishing-readiness analysis.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="font-semibold text-sm h-11 px-6 rounded-xl border-primary/40 hover:bg-primary/5 hover:text-primary hover:border-primary transition-all shadow-sm group"
            >
              <Link to="/ai-checker-for-bloggers" className="inline-flex items-center justify-center gap-2">
                <span>Optimize Your Article</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
