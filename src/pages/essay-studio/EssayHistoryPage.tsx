// EssayHistoryPage — writing development timeline
import { useState, useEffect, useCallback } from 'react';
import { useEssayStudio } from '@/contexts/EssayStudioContext';
import { essayService } from '@/lib/essay/essayService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  History, PenLine, Plus, BookMarked, Quote, Shield,
  CheckCircle2, FileText, Archive, Zap, Lightbulb,
  ChevronRight, Clock, TrendingUp,
} from 'lucide-react';
import type { EssayEvent, EventType } from '@/types/essay';

const EVENT_CONFIG: Record<EventType, { label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = {
  essay_created:        { label: 'Essay created', Icon: Plus, color: 'text-primary' },
  outline_created:      { label: 'Outline saved', Icon: FileText, color: 'text-primary' },
  writing_session_start:{ label: 'Writing session started', Icon: PenLine, color: 'text-success' },
  writing_session_end:  { label: 'Writing session ended', Icon: Clock, color: 'text-muted-foreground' },
  edit:                 { label: 'Significant edit', Icon: PenLine, color: 'text-foreground' },
  source_added:         { label: 'Source added', Icon: BookMarked, color: 'text-primary' },
  citation_added:       { label: 'Citation added', Icon: Quote, color: 'text-primary' },
  ai_assist:            { label: 'AI assist used', Icon: Lightbulb, color: 'text-warning' },
  detector_analysis:    { label: 'AI detection run', Icon: Shield, color: 'text-primary' },
  final_verification:   { label: 'Final verification', Icon: CheckCircle2, color: 'text-success' },
  phase_change:         { label: 'Phase changed', Icon: TrendingUp, color: 'text-primary' },
  version_saved:        { label: 'Version saved', Icon: Archive, color: 'text-muted-foreground' },
  export:               { label: 'Essay exported', Icon: FileText, color: 'text-primary' },
};

function groupByDate(events: EssayEvent[]): { date: string; events: EssayEvent[] }[] {
  const groups: Record<string, EssayEvent[]> = {};
  for (const e of events) {
    const d = new Date(e.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[d]) groups[d] = [];
    groups[d].push(e);
  }
  return Object.entries(groups).map(([date, events]) => ({ date, events }));
}

export default function EssayHistoryPage() {
  const { essay, goToPhase } = useEssayStudio();
  const [events, setEvents] = useState<EssayEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!essay) return;
    setLoading(true);
    try {
      const e = await essayService.listEvents(essay.id);
      setEvents(e);
    } catch {
      toast.error('Failed to load writing history');
    } finally {
      setLoading(false);
    }
  }, [essay]);

  useEffect(() => { load(); }, [load]);

  // Aggregate stats
  const sessions = events.filter(e => e.event_type === 'writing_session_start').length;
  const sourcesAdded = events.filter(e => e.event_type === 'source_added').length;
  const citationsAdded = events.filter(e => e.event_type === 'citation_added').length;
  const aiAssistUsed = events.filter(e => e.event_type === 'ai_assist').length;
  const detections = events.filter(e => e.event_type === 'detector_analysis').length;
  const maxWords = events.reduce((max, e) => Math.max(max, e.words_at_event || 0), 0);

  const grouped = groupByDate(events);
  const visibleGroups = grouped.slice().reverse(); // newest first

  const formatTime = (d: string) => new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Writing Development
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          A transparent record of your writing process — sessions, edits, sources, AI actions, and verifications.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {[
          { icon: PenLine, label: 'Writing Sessions', value: sessions },
          { icon: TrendingUp, label: 'Words Written', value: maxWords },
          { icon: BookMarked, label: 'Sources Added', value: sourcesAdded },
          { icon: Quote, label: 'Citations Added', value: citationsAdded },
          { icon: Lightbulb, label: 'AI Assists Used', value: aiAssistUsed },
          { icon: Shield, label: 'AI Scans Run', value: detections },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-3 flex items-center gap-3">
              <Icon className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground truncate">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI assist disclaimer */}
      {aiAssistUsed > 0 && (
        <Card className="mb-6 border-warning/20 bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">AI Assistance Recorded</p>
              <p className="text-xs text-muted-foreground mt-1">
                This essay used AI writing assistance {aiAssistUsed} time{aiAssistUsed > 1 ? 's' : ''} inside Essay Studio.
                The history records what actions were used, not what text was changed. This timeline represents
                your writing process, not a claim that text is human-written.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <History className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No history yet. Start writing to see your development timeline.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map(({ date, events: dayEvents }) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{date}</h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-1 pl-2">
                {dayEvents.slice().reverse().map(event => {
                  const cfg = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.edit;
                  const { Icon, label, color } = cfg;
                  // Hide version_saved and writing_session_end to keep timeline clean
                  if (event.event_type === 'version_saved' || event.event_type === 'writing_session_end') return null;
                  return (
                    <div key={event.id} className="flex items-start gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="shrink-0 mt-0.5">
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm">{event.description || label}</span>
                          {event.event_type === 'ai_assist' && event.metadata?.action ? (
                            <Badge variant="secondary" className="text-xs">{String(event.metadata.action).replace(/_/g, ' ')}</Badge>
                          ) : null}
                          {event.event_type === 'detector_analysis' && event.metadata?.engine ? (
                            <Badge variant="secondary" className="text-xs">{String(event.metadata.engine)}</Badge>
                          ) : null}
                        </div>
                        {event.words_at_event > 0 && (
                          <p className="text-xs text-muted-foreground">{event.words_at_event} words at this point</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatTime(event.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator className="my-6" />
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToPhase('sources')}>Back to Sources</Button>
        <Button onClick={() => goToPhase('submit')}>
          Submission Check <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
