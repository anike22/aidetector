// SEO-friendly template detail page
// Route: /essay-template/:slug
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { essayService } from '@/lib/essay/essayService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BookMarked, ChevronRight, ArrowLeft } from 'lucide-react';
import type { EssayTemplate } from '@/types/essay';
import { ESSAY_TYPE_LABELS, ACADEMIC_LEVEL_LABELS, CITATION_STYLE_LABELS } from '@/types/essay';
import MainLayout from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function EssayTemplatePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [template, setTemplate] = useState<EssayTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [using, setUsing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    essayService.getTemplate(slug)
      .then(t => {
        if (!t) navigate('/essay-studio/templates');
        else setTemplate(t);
      })
      .catch(() => navigate('/essay-studio/templates'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleUse = async () => {
    if (!template) return;
    if (!user) { navigate('/login'); return; }
    setUsing(true);
    try {
      const essay = await essayService.createEssay({
        title: template.name,
        essay_type: template.essay_type,
        academic_level: template.academic_level,
        citation_style: template.citation_style,
        status: 'draft',
        current_phase: 'plan',
      });
      if (template.outline_structure?.length > 0) {
        await essayService.upsertOutlineSections(essay.id,
          template.outline_structure.map((s, i) => ({
            essay_id: essay.id, parent_id: null, title: s.title,
            description: s.description, notes: '', position: i, depth: 0,
          }))
        );
      }
      await essayService.logEvent(essay.id, 'essay_created', `Essay from template: ${template.name}`);
      navigate(`/essay-studio/${essay.id}/plan`);
    } catch {
      toast.error('Failed to start from template');
      setUsing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!template) return null;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* SEO meta */}
        {template.seo_title && (
          <title>{template.seo_title}</title>
        )}

        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/essay-studio/templates')}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> All Templates
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <BookMarked className="h-7 w-7 text-primary shrink-0" />
              {template.name}
            </h1>
            <p className="text-muted-foreground mt-2">{template.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary">{ESSAY_TYPE_LABELS[template.essay_type]}</Badge>
              <Badge variant="secondary">{ACADEMIC_LEVEL_LABELS[template.academic_level]}</Badge>
              <Badge variant="secondary">{CITATION_STYLE_LABELS[template.citation_style]}</Badge>
            </div>
          </div>
          <Button onClick={handleUse} disabled={using} className="shrink-0">
            {using ? 'Creating…' : 'Use This Template'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Outline structure */}
        {template.outline_structure && template.outline_structure.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Essay Outline Structure</h2>
            <div className="space-y-3">
              {template.outline_structure.map((section, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{section.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* SEO educational content */}
        <section className="prose prose-sm max-w-none">
          <h2 className="text-lg font-semibold mb-3">About {template.name}s</h2>
          <div className="bg-muted/50 rounded-xl p-4 space-y-3 text-sm text-muted-foreground">
            <p>
              The <strong>{template.name}</strong> is one of the most commonly assigned essay types in academic settings.
              This template provides a structured outline appropriate for {ACADEMIC_LEVEL_LABELS[template.academic_level]} level work,
              formatted in {CITATION_STYLE_LABELS[template.citation_style]} citation style.
            </p>
            <p>
              Use this template as a starting point in Essay Studio — you can customize every section,
              regenerate individual parts with AI assistance, and work through the full
              Plan → Write → Verify → Improve → Cite → Submit workflow.
            </p>
            <p>
              <strong>Remember:</strong> Templates provide structure, not content. All arguments,
              evidence, analysis, and citations must come from your own research and thinking.
            </p>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Button size="lg" onClick={handleUse} disabled={using}>
            {using ? 'Creating Essay…' : `Start Writing Your ${template.name}`}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
