// Template Library — browse all essay templates, use one to start
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { essayService } from '@/lib/essay/essayService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Search, BookMarked, ChevronRight } from 'lucide-react';
import type { EssayTemplate, EssayType, AcademicLevel } from '@/types/essay';
import { ESSAY_TYPE_LABELS, ACADEMIC_LEVEL_LABELS, CITATION_STYLE_LABELS } from '@/types/essay';
import MainLayout from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function TemplateLibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EssayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);

  useEffect(() => {
    essayService.listTemplates()
      .then(setTemplates)
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []);

  const handleUseTemplate = async (template: EssayTemplate) => {
    if (!user) { navigate('/login'); return; }
    setUsingTemplate(template.id);
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
            essay_id: essay.id,
            parent_id: null,
            title: s.title,
            description: s.description,
            notes: '',
            position: i,
            depth: 0,
          }))
        );
      }
      await essayService.logEvent(essay.id, 'essay_created', `Essay created from template: ${template.name}`);
      navigate(`/essay-studio/${essay.id}/plan`);
    } catch {
      toast.error('Failed to start essay from template');
    } finally {
      setUsingTemplate(null);
    }
  };

  const types = ['all', ...Array.from(new Set(templates.map(t => t.essay_type)))];

  const filtered = templates.filter(t => {
    const matchesSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || t.essay_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/essay-studio')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookMarked className="h-6 w-6 text-primary" /> Template Library
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {templates.length} essay templates — structured outlines to start writing immediately.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search templates…"
              className="pl-8 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {type === 'all' ? 'All' : ESSAY_TYPE_LABELS[type as EssayType]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookMarked className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No templates match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filtered.map(template => (
              <Card key={template.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-2">{template.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.description}</p>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="secondary" className="text-xs">{ESSAY_TYPE_LABELS[template.essay_type]}</Badge>
                      <Badge variant="secondary" className="text-xs">{ACADEMIC_LEVEL_LABELS[template.academic_level]}</Badge>
                      <Badge variant="secondary" className="text-xs uppercase">{CITATION_STYLE_LABELS[template.citation_style]}</Badge>
                    </div>

                    {/* Outline preview */}
                    {template.outline_structure && template.outline_structure.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-medium mb-1.5">Outline ({template.outline_structure.length} sections)</p>
                        <div className="space-y-0.5">
                          {template.outline_structure.slice(0, 4).map((s, i) => (
                            <p key={i} className="text-xs text-muted-foreground truncate">
                              <span className="text-muted-foreground/60 mr-1">{i + 1}.</span>
                              {s.title}
                            </p>
                          ))}
                          {template.outline_structure.length > 4 && (
                            <p className="text-xs text-muted-foreground">+{template.outline_structure.length - 4} more sections…</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mt-auto"
                    onClick={() => handleUseTemplate(template)}
                    disabled={usingTemplate === template.id}
                  >
                    {usingTemplate === template.id ? 'Creating…' : 'Use Template'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
