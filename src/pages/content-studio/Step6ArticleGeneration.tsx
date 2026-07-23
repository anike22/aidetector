import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, ChevronRight, RefreshCw, Check, Edit3, ChevronDown, ChevronUp, SkipForward,
} from 'lucide-react';
import { streamLLM } from '@/lib/sse';
import { localArticleSectionsFallback } from './localFallbacks';
import type { WizardState, ArticleSection, OutlineSection } from './types';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function flattenSectionsToGenerate(outline: OutlineSection[]): { id: string; heading: string; type: string }[] {
  const result: { id: string; heading: string; type: string }[] = [];
  for (const s of outline) {
    if (['intro', 'h2', 'faq', 'conclusion'].includes(s.type)) {
      result.push({ id: s.id, heading: s.text, type: s.type });
    }
    if (s.children?.length) {
      for (const child of s.children) {
        if (child.type === 'h3') {
          result.push({ id: child.id, heading: child.text, type: child.type });
        }
      }
    }
  }
  return result;
}

export default function Step6ArticleGeneration({ state, onChange, onNext, onBack }: Props) {
  const sectionsToGenerate = flattenSectionsToGenerate(state.outline);
  const sections = state.sections;
  const abortRef = useRef<AbortController | null>(null);
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const acceptedCount = sections.filter((s) => s.accepted).length;
  const progressPct = sectionsToGenerate.length > 0
    ? Math.round((acceptedCount / sectionsToGenerate.length) * 100)
    : 0;

  // Auto-start first section if none generated
  const currentIdx = sections.length;

  const buildPromptForSection = (idx: number): string => {
    const sec = sectionsToGenerate[idx];
    const eeat = state.eeatConfig;
    const keywordList = [state.keyword, ...state.selectedKeywords].join(', ');
    const minFreq = state.targetWordCount >= 1200 ? 6 : state.targetWordCount >= 900 ? 4 : 3;

    const prevContext = sections
      .slice(Math.max(0, idx - 2), idx)
      .map((s) => `## ${s.heading}\n${s.content.slice(0, 400)}...`)
      .join('\n\n');

    return `You are an expert SEO content writer. Write the "${sec.heading}" section for an article titled "${state.brief?.title}" about "${state.keyword}".

Section type: ${sec.type}
Keywords to include (at least ${minFreq} times total across section): ${keywordList}
${eeat.includeStats ? 'Include relevant statistics or data points.' : ''}
${eeat.includeExamples ? 'Include practical real-world examples.' : ''}
${eeat.includeCaseStudy && sec.type === 'intro' ? 'Mention a brief case study reference.' : ''}
${eeat.authorName ? `Written from perspective of ${eeat.authorName}, ${eeat.authorTitle}.` : ''}

Previous context:
${prevContext || 'This is the opening section.'}

Requirements:
- Write ${sec.type === 'intro' ? '150-200' : sec.type === 'conclusion' ? '100-150' : sec.type === 'faq' ? '200-300' : '200-350'} words
- Use natural, engaging prose at Grade 7-9 reading level
- Start directly with content (no meta-commentary like "In this section...")
- Include the primary keyword "${state.keyword}" naturally
- NO headers/headings in the output — just the content paragraphs

Write the section now:`;
  };

  const generateSection = async (idx: number) => {
    if (idx >= sectionsToGenerate.length) return;
    setStreamingIdx(idx);

    const newSection: ArticleSection = {
      id: sectionsToGenerate[idx].id,
      heading: sectionsToGenerate[idx].heading,
      content: '',
      accepted: false,
    };

    onChange({ sections: [...sections.slice(0, idx), newSection] });
    abortRef.current = new AbortController();

    await streamLLM({
      contents: [{ role: 'user', parts: [{ text: buildPromptForSection(idx) }] }],
      supabaseUrl,
      supabaseAnonKey,
      onChunk: (t) => {
        onChange({
          sections: state.sections.map((s, i) =>
            i === idx ? { ...s, content: s.content + t } : s
          ),
        });
      },
      onComplete: () => {
        setStreamingIdx(null);
        setExpanded((prev) => ({ ...prev, [idx]: true }));
      },
      onError: () => {
        setStreamingIdx(null);
        // Use local fallback for this section so the user can keep going
        const fallbackContent = localArticleSectionsFallback(
          [sectionsToGenerate[idx]], state.keyword
        )[0];
        onChange({
          sections: [
            ...state.sections.slice(0, idx),
            { ...fallbackContent, content: fallbackContent.content },
          ],
        });
        toast.info(`AI unavailable — local content used for "${sectionsToGenerate[idx].heading}".`);
      },
      signal: abortRef.current.signal,
    });
  };

  const handleAccept = (idx: number) => {
    const updated = sections.map((s, i) => i === idx ? { ...s, accepted: true } : s);
    onChange({ sections: updated });
    setExpanded((prev) => ({ ...prev, [idx]: false }));
    // Auto-generate next
    if (idx + 1 < sectionsToGenerate.length) {
      setTimeout(() => generateSection(idx + 1), 300);
    }
  };

  const handleRegenerate = (idx: number) => {
    abortRef.current?.abort();
    generateSection(idx);
  };

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditVal(sections[idx]?.content || '');
  };

  const handleSaveEdit = (idx: number) => {
    const updated = sections.map((s, i) => i === idx ? { ...s, content: editVal } : s);
    onChange({ sections: updated });
    setEditingIdx(null);
  };

  const applyAllFallback = () => {
    const fallbackSections = localArticleSectionsFallback(sectionsToGenerate, state.keyword);
    // Mark all as accepted
    onChange({ sections: fallbackSections.map((s) => ({ ...s, accepted: true })) });
    toast.info('All sections filled with local content — edit any section before continuing.');
  };

  const allAccepted = sections.length === sectionsToGenerate.length &&
    sections.every((s) => s.accepted);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">Article Generation</h2>
        <p className="text-sm text-muted-foreground">
          AI writes each section. Accept sections to proceed, or use local generation if AI is unavailable.
        </p>
      </div>

      {/* Progress */}
      <Card className="border-border shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-navy">{acceptedCount} / {sectionsToGenerate.length} sections accepted</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Start button if nothing generated yet */}
      {sections.length === 0 && streamingIdx === null && (
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-primary text-primary-foreground gap-2 h-10"
            onClick={() => generateSection(0)}
          >
            <ChevronRight className="w-4 h-4" /> Start Generating Article
          </Button>
          <Button
            variant="outline"
            className="gap-2 h-10 border-border text-muted-foreground"
            onClick={applyAllFallback}
          >
            <SkipForward className="w-4 h-4" /> Use Local Content
          </Button>
        </div>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-4">
        {sectionsToGenerate.map((sec, idx) => {
          const generated = sections[idx];
          const isStreaming = streamingIdx === idx;
          const isExpanded = expanded[idx] ?? (!generated?.accepted);
          const isEditing = editingIdx === idx;
          const isPending = idx >= sections.length && !isStreaming;

          return (
            <Card
              key={sec.id}
              className={`border shadow-card transition-all ${
                generated?.accepted
                  ? 'border-success/30 bg-success/5'
                  : isStreaming
                  ? 'border-primary/30 bg-primary/5'
                  : isPending
                  ? 'border-border opacity-50'
                  : 'border-border'
              }`}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 uppercase font-mono ${
                        generated?.accepted ? 'border-success/40 text-success bg-success/10' :
                        isStreaming ? 'border-primary/40 text-primary bg-primary/10' :
                        'border-border text-muted-foreground'
                      }`}
                    >
                      {sec.type}
                    </Badge>
                    <CardTitle className="text-sm font-medium text-navy truncate">{sec.heading}</CardTitle>
                    {generated?.accepted && <Check className="w-4 h-4 text-success shrink-0" />}
                    {isStreaming && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
                  </div>
                  {generated && !isPending && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground shrink-0"
                      onClick={() => setExpanded((prev) => ({ ...prev, [idx]: !isExpanded }))}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </CardHeader>

              {isExpanded && generated && (
                <CardContent className="px-4 pb-4">
                  {isEditing ? (
                    <div className="flex flex-col gap-3">
                      <Textarea
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        className="border-border resize-none min-h-48 text-sm"
                        rows={10}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground gap-1" onClick={() => handleSaveEdit(idx)}>
                          <Check className="w-3.5 h-3.5" /> Save
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs border-border" onClick={() => setEditingIdx(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap mb-4 text-pretty">
                        {generated.content}
                        {isStreaming && (
                          <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
                        )}
                      </div>
                      {!generated.accepted && !isStreaming && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-primary text-primary-foreground gap-1"
                            onClick={() => handleAccept(idx)}
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-border gap-1"
                            onClick={() => handleRegenerate(idx)}
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs gap-1 text-muted-foreground hover:text-navy"
                            onClick={() => handleEdit(idx)}
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" className="h-10 border-border" onClick={onBack}>Back</Button>
        <Button
          className="bg-primary text-primary-foreground gap-2 h-10 px-6"
          onClick={() => {
            // If not all accepted, apply local fallback for ungenerated sections first
            if (!allAccepted) {
              const missing = sectionsToGenerate.slice(sections.length);
              if (missing.length > 0) {
                const fallbacks = localArticleSectionsFallback(missing, state.keyword);
                const merged = [
                  ...sections.map((s) => ({ ...s, accepted: true })),
                  ...fallbacks.map((s) => ({ ...s, accepted: true })),
                ];
                onChange({ sections: merged });
              } else {
                onChange({ sections: sections.map((s) => ({ ...s, accepted: true })) });
              }
            }
            const allSections = allAccepted ? sections : [
              ...sections.map((s) => ({ ...s, accepted: true })),
              ...localArticleSectionsFallback(sectionsToGenerate.slice(sections.length), state.keyword).map((s) => ({ ...s, accepted: true })),
            ];
            const fullContent = allSections
              .map((s) => `## ${s.heading}\n\n${s.content}`)
              .join('\n\n---\n\n');
            onChange({ fullContent });
            onNext();
          }}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
