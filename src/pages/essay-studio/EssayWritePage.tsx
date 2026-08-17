// EssayWritePage — 3-panel editor: outline nav | writing area | AI assistance
import { useState, useRef, useCallback } from 'react';
import { useEssayStudio } from '@/contexts/EssayStudioContext';
import { supabase } from '@/db/supabase';
import { essayService } from '@/lib/essay/essayService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  ChevronRight, Loader2, ChevronLeft, ChevronDown,
  Lightbulb, Sparkles, Check, Save, History,
} from 'lucide-react';

type AssistAction =
  | 'brainstorm'
  | 'explain_concept'
  | 'suggest_argument'
  | 'strengthen_thesis'
  | 'suggest_counterargument'
  | 'improve_clarity'
  | 'improve_grammar'
  | 'make_concise'
  | 'improve_academic_tone';

const ASSIST_ACTIONS: { key: AssistAction; label: string; desc: string }[] = [
  { key: 'brainstorm', label: 'Brainstorm Ideas', desc: 'Suggest relevant ideas for the selected text' },
  { key: 'explain_concept', label: 'Explain Concept', desc: 'Get a clear explanation of selected text' },
  { key: 'suggest_argument', label: 'Suggest Arguments', desc: 'Strengthen your claim with more arguments' },
  { key: 'strengthen_thesis', label: 'Strengthen Thesis', desc: 'Improve a thesis statement' },
  { key: 'suggest_counterargument', label: 'Counterarguments', desc: 'Find opposing views to address' },
  { key: 'improve_clarity', label: 'Improve Clarity', desc: 'Rewrite for clearer academic prose' },
  { key: 'improve_grammar', label: 'Fix Grammar', desc: 'Correct grammatical errors' },
  { key: 'make_concise', label: 'Make Concise', desc: 'Remove unnecessary words' },
  { key: 'improve_academic_tone', label: 'Academic Tone', desc: 'Elevate to scholarly register' },
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function EssayWritePage() {
  const { essay, content, setContent, saveStatus, saveNow, outlineSections, goToPhase } = useEssayStudio();
  const [assistResult, setAssistResult] = useState('');
  const [runningAction, setRunningAction] = useState<AssistAction | null>(null);
  const [showOutline, setShowOutline] = useState(true);
  const [showAssist, setShowAssist] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<{ id: string; label: string; word_count: number; created_at: string }[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = countWords(content);
  const targetWords = essay?.target_word_count || 1000;
  const progress = Math.min(100, Math.round((wordCount / targetWords) * 100));

  const getSelectedText = (): string => {
    const ta = textareaRef.current;
    if (!ta) return '';
    return ta.value.substring(ta.selectionStart, ta.selectionEnd);
  };

  const runAssist = useCallback(async (action: AssistAction) => {
    if (!essay) return;
    const selected = getSelectedText();
    const textToAnalyze = selected || content.slice(0, 2000);
    if (textToAnalyze.trim().length < 10) {
      toast.error('Please select some text or write at least a few words first.');
      return;
    }
    setRunningAction(action);
    setAssistResult('');
    try {
      const { data, error } = await supabase.functions.invoke('essay-assist', {
        body: {
          action,
          text: textToAnalyze,
          context: {
            essay_type: essay.essay_type,
            academic_level: essay.academic_level,
            topic: essay.topic,
            citation_style: essay.citation_style,
          },
        },
      });
      if (error) {
        const msg = await error?.context?.text?.();
        throw new Error(msg || error.message);
      }
      setAssistResult(data?.result || 'No response received.');
      await essayService.logEvent(essay.id, 'ai_assist', `AI assist: ${action}`, { action, text_length: textToAnalyze.length }, wordCount);
    } catch (err) {
      console.error(err);
      toast.error('Writing assistance failed. Please try again.');
    } finally {
      setRunningAction(null);
    }
  }, [essay, content, wordCount]);

  const loadVersions = async () => {
    if (!essay) return;
    setLoadingVersions(true);
    try {
      const v = await essayService.listVersions(essay.id);
      setVersions(v);
    } catch {
      toast.error('Failed to load versions');
    } finally {
      setLoadingVersions(false);
    }
  };

  const restoreVersion = async (versionId: string) => {
    if (!essay) return;
    setRestoringVersion(true);
    try {
      const v = await essayService.getVersion(versionId);
      if (v) {
        setContent(v.content);
        await essayService.updateContent(essay.id, v.content);
        toast.success(`Restored ${v.label}`);
        setShowVersions(false);
      }
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoringVersion(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Left: Outline Panel */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-card transition-all ${showOutline ? 'w-56' : 'w-10'} shrink-0`}>
        <button
          className="flex items-center justify-between p-3 text-xs font-semibold text-muted-foreground hover:text-foreground border-b border-border"
          onClick={() => setShowOutline(o => !o)}
        >
          {showOutline ? (
            <>Outline <ChevronLeft className="h-3.5 w-3.5" /></>
          ) : (
            <ChevronRight className="h-3.5 w-3.5 mx-auto" />
          )}
        </button>
        {showOutline && (
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {outlineSections.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">
                  No outline yet. Go to the Outline phase to build one.
                </p>
              ) : (
                outlineSections.map((s, i) => (
                  <button
                    key={s.id}
                    className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors group"
                    onClick={() => {
                      // Scroll to or focus relevant text
                      textareaRef.current?.focus();
                    }}
                  >
                    <span className="text-muted-foreground mr-1">{i + 1}.</span>
                    <span className="group-hover:text-foreground text-muted-foreground">{s.title}</span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </aside>

      {/* Center: Writing Editor */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background shrink-0 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs text-muted-foreground shrink-0">{wordCount} / {targetWords} words</span>
            <div className="hidden md:flex flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-0 max-w-32">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: progress >= 100 ? 'hsl(var(--success))' : 'hsl(var(--primary))',
                }}
              />
            </div>
            {progress >= 100 && <Badge variant="secondary" className="text-xs text-success shrink-0"><Check className="h-3 w-3 mr-1" />Target met</Badge>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={saveNow}>
              <Save className="h-3.5 w-3.5" />
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => {
                setShowVersions(v => !v);
                if (!showVersions) loadVersions();
              }}
            >
              <History className="h-3.5 w-3.5" />
              <span className="hidden md:inline">History</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => goToPhase('verify')}
            >
              Verify <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Version history dropdown */}
        {showVersions && (
          <div className="border-b border-border bg-card px-4 py-2 shrink-0">
            <p className="text-xs font-medium mb-2">Version History</p>
            {loadingVersions ? (
              <Skeleton className="h-8 w-full" />
            ) : versions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No saved versions yet. Versions are saved automatically.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {versions.slice(0, 8).map(v => (
                  <button
                    key={v.id}
                    onClick={() => restoreVersion(v.id)}
                    disabled={restoringVersion}
                    className="text-xs border border-border rounded px-2 py-1 hover:border-primary hover:text-primary transition-colors"
                  >
                    {v.label} · {v.word_count}w · {formatDate(v.created_at)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Textarea */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Start writing your ${essay?.title || 'essay'} here…\n\nYou can write freely. Select text to use writing assistance on the right.`}
            className="w-full h-full min-h-[400px] resize-none border-0 shadow-none focus-visible:ring-0 text-base leading-relaxed bg-transparent p-0"
            style={{ fontFamily: 'Georgia, serif' }}
          />
        </div>
      </div>

      {/* Right: Writing Intelligence */}
      <aside className={`hidden md:flex flex-col border-l border-border bg-card transition-all ${showAssist ? 'w-72' : 'w-10'} shrink-0`}>
        <button
          className="flex items-center justify-between p-3 text-xs font-semibold text-muted-foreground hover:text-foreground border-b border-border"
          onClick={() => setShowAssist(a => !a)}
        >
          {showAssist ? (
            <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Writing Intelligence <ChevronRight className="h-3.5 w-3.5" /></>
          ) : (
            <Sparkles className="h-3.5 w-3.5 mx-auto" />
          )}
        </button>

        {showAssist && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                <p className="text-xs text-muted-foreground mb-3">
                  Select text, then choose an action. Or use on the full essay.
                </p>
                {ASSIST_ACTIONS.map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => runAssist(key)}
                    disabled={!!runningAction}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs border border-border bg-background hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      {runningAction === key
                        ? <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                        : <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
                      }
                      <span className="font-medium">{label}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 pl-5">{desc}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Result panel */}
            {assistResult && (
              <>
                <Separator />
                <div className="p-3 flex-1 min-h-0 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">AI Suggestion</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => setAssistResult('')}
                    >
                      Clear
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground">{assistResult}</p>
                  </ScrollArea>
                </div>
              </>
            )}
          </div>
        )}
      </aside>

      {/* Mobile: AI assist bottom sheet toggle */}
      <div className="fixed bottom-4 right-4 md:hidden z-30">
        <Button
          size="sm"
          onClick={() => setShowAssist(a => !a)}
          className="shadow-lg"
        >
          <Sparkles className="h-4 w-4 mr-1.5" />
          {showAssist ? 'Hide' : 'Assist'}
          <ChevronDown className={`h-3.5 w-3.5 ml-1 transition-transform ${showAssist ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Mobile assist panel */}
      {showAssist && (
        <div className="fixed bottom-14 left-0 right-0 md:hidden bg-card border-t border-border z-20 max-h-[40vh] overflow-y-auto">
          <div className="p-3 grid grid-cols-2 gap-2">
            {ASSIST_ACTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => runAssist(key)}
                disabled={!!runningAction}
                className="text-xs border border-border rounded-lg p-2 text-left hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {runningAction === key
                  ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  : <Sparkles className="h-3 w-3 text-primary shrink-0" />
                }
                {label}
              </button>
            ))}
          </div>
          {assistResult && (
            <div className="px-3 pb-3">
              <Card>
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-xs">AI Suggestion</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <p className="text-xs whitespace-pre-wrap">{assistResult}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
