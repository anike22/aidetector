import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { humanizerApi } from '@/lib/humanizerApi';
import { HumanizationJob, RewriteAlternative, AlternativeStatus } from '@/types/humanizer';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle2, ChevronRight, Scale, BookOpen, Zap, AlertCircle, Loader2, ArrowLeft, RotateCcw, Play } from 'lucide-react';
import { toast } from 'sonner';

const ORDERED_TYPES = ['Most Faithful', 'Most Natural', 'Most Concise'] as const;

type FixedSlot = {
  type: typeof ORDERED_TYPES[number];
  description: string;
  icon: React.ReactNode;
};

const SLOTS: FixedSlot[] = [
  {
    type: 'Most Faithful',
    description: 'Minimal changes, preserving exact structure while fixing robotic tones.',
    icon: <Scale className="h-5 w-5 text-primary" />
  },
  {
    type: 'Most Natural',
    description: 'Balanced restructure for the most human-like conversational flow.',
    icon: <BookOpen className="h-5 w-5 text-primary" />
  },
  {
    type: 'Most Concise',
    description: 'Removes filler and redundancy for a sharper, clearer message.',
    icon: <Zap className="h-5 w-5 text-primary" />
  }
];

export default function HumanizerAlternativesPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<HumanizationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<'missing' | 'all' | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const fetchedJob = await humanizerApi.getJob(jobId);
      setJob(fetchedJob);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load alternatives.');
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      navigate('/humanizer');
      return;
    }

    let interval: NodeJS.Timeout;

    const load = async () => {
      setLoading(true);
      await fetchJob();
      setLoading(false);

      // Poll while job is still processing
      interval = setInterval(async () => {
        const current = await humanizerApi.getJob(jobId);
        setJob(current);
        if (current.status === 'completed' || current.status === 'partial' || current.status === 'failed') {
          clearInterval(interval);
        }
      }, 2500);
    };

    load();

    return () => clearInterval(interval);
  }, [jobId, navigate, fetchJob]);

  const handleSelect = async (alternativeType: string, text?: string) => {
    if (!text) {
      toast.error('This version is not ready yet.');
      return;
    }
    setSelecting(alternativeType);
    try {
      await humanizerApi.selectAlternative(jobId!, alternativeType);
      toast.success(`${alternativeType} selected`);
      navigate(`/humanizer/result/${jobId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to select alternative');
      setSelecting(null);
    }
  };

  const handleRetryMissing = async () => {
    if (!jobId) return;
    setRetrying('missing');
    try {
      toast.info('Retrying missing versions. This may take a moment.');
      const updated = await humanizerApi.retryMissingVersions(jobId);
      setJob(updated);
      toast.success('Retry complete');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to retry missing versions');
    } finally {
      setRetrying(null);
    }
  };

  const handleRetryAll = async () => {
    if (!jobId) return;
    setRetrying('all');
    try {
      toast.info('Retrying all versions. This may take a moment.');
      const updated = await humanizerApi.retryAll(jobId);
      setJob(updated);
      toast.success('Retry complete');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to retry all versions');
    } finally {
      setRetrying(null);
    }
  };

  const handleContinue = async (altType: string) => {
    if (!jobId || !job) return;
    const alternative = job.alternatives?.find(a => a.alternative_type === altType);
    if (alternative?.text) {
      await handleSelect(altType, alternative.text);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: AlternativeStatus) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/10">Completed</Badge>;
      case 'Generating':
      case 'Retrying':
      case 'Pending':
        return <Badge variant="outline" className="text-primary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> {status}</Badge>;
      case 'Validation Failed':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">Validation Failed</Badge>;
      case 'Provider Failed':
        return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Provider Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAlternativeMap = (jobArg?: HumanizationJob | null): Map<string, RewriteAlternative> => {
    const map = new Map<string, RewriteAlternative>();
    for (const alt of jobArg?.alternatives || []) {
      map.set(alt.alternative_type, alt);
    }
    // Fill missing slots with Pending placeholders
    for (const type of ORDERED_TYPES) {
      if (!map.has(type)) {
        map.set(type, { alternative_type: type, status: 'Pending' });
      }
    }
    return map;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return <div className="text-center py-12">No job found.</div>;
  }

  const altMap = getAlternativeMap(job);
  const completedCount = ORDERED_TYPES.filter(t => altMap.get(t)?.status === 'Completed').length;
  const failedCount = ORDERED_TYPES.filter(t => {
    const s = altMap.get(t)?.status;
    return s === 'Provider Failed' || s === 'Validation Failed';
  }).length;
  const isPartial = job.status === 'partial' || (completedCount > 0 && completedCount < 3);
  const isFailed = job.status === 'failed' || completedCount === 0;

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 md:px-6 max-w-7xl">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Select Best Version</h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
          We generate three distinct alternatives for your text. Review the previews and scores below, and select the one that best fits your needs.
        </p>
      </div>

      {isPartial && (
        <Alert className="mb-6 border-yellow-300 bg-yellow-50/50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">
            {completedCount} of 3 versions are ready
          </AlertTitle>
          <AlertDescription className="text-yellow-700">
            {failedCount > 0
              ? `${failedCount} version(s) could not be generated. You can retry the missing versions without using additional credits, continue with the available versions, or retry all.`
              : 'Some versions are still being generated. You can continue with any completed version or wait.'}
          </AlertDescription>
        </Alert>
      )}

      {isFailed && (
        <Alert className="mb-6 border-red-300 bg-red-50/50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">No versions could be generated</AlertTitle>
          <AlertDescription className="text-red-700">
            {job.error_message || 'The AI provider was temporarily busy. Your usage was not charged. Please try again shortly.'}
            {job.request_id && (
              <span className="block mt-1 text-xs font-medium">Request ID: {job.request_id}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {SLOTS.map(slot => {
          const alt = altMap.get(slot.type)!;
          const isCompleted = alt.status === 'Completed';
          const isFailed = alt.status === 'Provider Failed' || alt.status === 'Validation Failed';
          const isPending = !isCompleted && !isFailed;
          const scores = alt.scores || {};

          return (
            <Card key={slot.type} className={`flex flex-col h-full ${selecting === slot.type ? 'border-primary ring-2 ring-primary/20' : ''} ${isFailed ? 'border-destructive/30 bg-destructive/5' : ''}`}>
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center gap-3 mb-2">
                  {slot.icon}
                  <CardTitle className="text-lg md:text-xl">{slot.type}</CardTitle>
                </div>
                <CardDescription className="text-xs md:text-sm">{slot.description}</CardDescription>
                <div className="mt-2">{getStatusBadge(alt.status)}</div>
              </CardHeader>

              <CardContent className="p-0 flex-1 flex flex-col">
                {isCompleted && alt.text && (
                  <>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 border-b bg-muted/5">
                      <div>
                        <div className="text-xs text-muted-foreground">Overall Score</div>
                        <div className={`text-xl md:text-2xl font-bold ${getScoreColor(scores.humanization_score || 0)}`}>{scores.humanization_score ?? '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">AI Signal After</div>
                        <div className={`text-xl md:text-2xl font-bold ${getScoreColor(100 - (scores.ai_signal_after || 0))}`}>{scores.ai_signal_after ?? '-'}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Meaning Preservation</div>
                        <div className={`font-medium ${getScoreColor(scores.meaning_preservation_score || 0)}`}>{scores.meaning_preservation_score ?? '-'}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Naturalness</div>
                        <div className={`font-medium ${getScoreColor(scores.naturalness_score || 0)}`}>{scores.naturalness_score ?? '-'}%</div>
                      </div>
                    </div>
                    <div className="p-3 md:p-4 flex-1">
                      <div className="text-xs font-medium text-muted-foreground mb-2">PREVIEW</div>
                      <ScrollArea className="h-40 md:h-48">
                        <div className="text-xs md:text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {alt.text.length > 500 ? alt.text.substring(0, 500) + '...' : alt.text}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )}

                {isFailed && (
                  <div className="p-4 md:p-6 flex-1 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">This version could not be generated</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {alt.error_message || 'The provider was temporarily busy or the output did not pass validation.'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryMissing}
                      disabled={retrying !== null}
                    >
                      {retrying === 'missing' ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-2" />}
                      Retry Version
                    </Button>
                  </div>
                )}

                {isPending && (
                  <div className="p-4 md:p-6 flex-1 flex flex-col items-center justify-center text-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                    <p className="text-sm font-medium text-foreground">Generating this version...</p>
                    <p className="text-xs text-muted-foreground">Please wait while the AI rewrites your text.</p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-3 md:p-4 border-t bg-muted/10">
                {isCompleted && alt.text ? (
                  <Button
                    className="w-full"
                    size="default"
                    disabled={selecting !== null}
                    onClick={() => handleSelect(slot.type, alt.text)}
                  >
                    {selecting === slot.type ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Selecting...</>
                    ) : (
                      <>Select as Final <ChevronRight className="h-4 w-4 ml-2" /></>
                    )}
                  </Button>
                ) : isFailed ? (
                  <Button variant="secondary" className="w-full" size="default" disabled onClick={() => {}}>
                    Not Available
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" size="default" disabled onClick={() => {}}>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-3 md:items-center md:justify-center">
        <Button variant="outline" onClick={() => navigate('/humanizer')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Return to Input
        </Button>

        {isPartial && (
          <>
            <Button
              variant="default"
              onClick={handleRetryMissing}
              disabled={retrying !== null}
            >
              {retrying === 'missing' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Retry Missing Versions
            </Button>
            <Button
              variant="outline"
              onClick={handleRetryAll}
              disabled={retrying !== null}
            >
              {retrying === 'all' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Retry All
            </Button>
          </>
        )}

        {isFailed && (
          <Button
            variant="default"
            onClick={handleRetryAll}
            disabled={retrying !== null}
          >
            {retrying === 'all' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Retry All
          </Button>
        )}

        {completedCount > 0 && isPartial && (
          <Button
            variant="outline"
            onClick={() => {
              const readyType = ORDERED_TYPES.find(t => altMap.get(t)?.status === 'Completed');
              if (readyType) handleContinue(readyType);
            }}
            disabled={selecting !== null}
          >
            <Play className="h-4 w-4 mr-2" /> Continue With Available Version
          </Button>
        )}
      </div>

      {job.request_id && (
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">Request ID: {job.request_id}</p>
        </div>
      )}
    </div>
  );
}
