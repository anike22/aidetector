import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { humanizerApi } from '@/lib/humanizerApi';
import { HumanizationJob, HumanizationStatus } from '@/types/humanizer';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Loader2, Brain, FileSearch, PenTool, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function HumanizerProcessingPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<HumanizationJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const pollIntervalRef = useRef<any>(null);
  const isNavigatingRef = useRef<boolean>(false);

  const navigateToResult = (jobData: HumanizationJob) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    setTimeout(() => {
      if (jobData.alternatives && jobData.alternatives.some(a => a.status === 'Completed')) {
        navigate(`/humanizer/alternatives/${jobData.job_id}`);
      } else {
        navigate(`/humanizer/result/${jobData.job_id}`);
      }
    }, 600);
  };

  const startProcessing = async () => {
    if (!jobId) return;
    setError(null);
    setIsRetrying(true);

    try {
      // 1. Verify job existence and current state
      const initialJob = await humanizerApi.getJob(jobId);
      setJob(initialJob);

      if (initialJob.status === 'completed' || (initialJob.alternatives && initialJob.alternatives.some(a => a.status === 'Completed'))) {
        navigateToResult(initialJob);
        return;
      }

      // 2. Start background polling to display live progress and detect early completion
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const polled = await humanizerApi.getJob(jobId);
          if (polled) {
            setJob(polled);
            if (polled.status === 'completed' || polled.status === 'partial' || (polled.alternatives && polled.alternatives.some(a => a.status === 'Completed'))) {
              navigateToResult(polled);
            }
          }
        } catch {
          // ignore transient poll errors
        }
      }, 2500);

      // 3. Trigger processing pipeline
      const processedJob = await humanizerApi.processJob(jobId);
      setJob(processedJob);

      if (processedJob.status === 'completed' || processedJob.status === 'partial' || processedJob.status === 'verifying') {
        navigateToResult(processedJob);
        return;
      }

      if (processedJob.status === 'failed') {
        setError(
          processedJob.error_message ||
          `No versions could be generated. ${processedJob.request_id ? `Request ID: ${processedJob.request_id}` : 'Please try again shortly.'}`
        );
        toast.error('Processing failed');
      }
    } catch (err: any) {
      console.error("Processing error:", err);

      // Before showing error, perform an immediate safety check in case backend finished
      try {
        const finalCheck = await humanizerApi.getJob(jobId);
        if (finalCheck && (finalCheck.status === 'completed' || finalCheck.status === 'partial' || (finalCheck.alternatives && finalCheck.alternatives.some(a => a.status === 'Completed')))) {
          navigateToResult(finalCheck);
          return;
        }
      } catch {}

      setError(err.message || 'The request timed out while processing. Please retry.');
      toast.error('Processing timed out or failed');
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (!jobId) {
      navigate('/humanizer');
      return;
    }

    startProcessing();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [jobId, navigate]);

  const stages: { id: HumanizationStatus; label: string; icon: any; description: string }[] = [
    { id: 'analyzing', label: 'Input Analysis', icon: FileSearch, description: 'Analyzing topic, tone, entities, and AI signals.' },
    { id: 'planning', label: 'Humanization Planning', icon: Brain, description: 'Creating transformation plan and protecting facts.' },
    { id: 'rewriting', label: 'Controlled Rewrite', icon: PenTool, description: 'Improving rhythm, variation, and naturalness.' },
    { id: 'verifying', label: 'Verification', icon: ShieldCheck, description: 'Checking meaning preservation and factual integrity.' },
  ];

  const getStageIndex = (status: HumanizationStatus) => {
    switch (status) {
      case 'analyzing': return 0;
      case 'planning': return 1;
      case 'rewriting': return 2;
      case 'verifying': return 3;
      case 'completed':
      case 'partial':
        return 4;
      case 'failed': return -1;
      default: return 0;
    }
  };

  const currentIndex = job ? getStageIndex(job.status) : 0;
  const progress = Math.max(5, (currentIndex / stages.length) * 100);

  if (error) {
    return (
      <div className="container mx-auto py-12 max-w-2xl text-center px-4">
        <Card className="border-destructive/60 shadow-lg">
          <CardContent className="pt-8 pb-8 px-6">
            <div className="text-destructive mb-4">
              <ShieldCheck className="h-14 w-14 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Processing Failed</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm md:text-base leading-relaxed">
              {error}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="default"
                className="w-full sm:w-auto flex items-center gap-2"
                disabled={isRetrying}
                onClick={() => startProcessing()}
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Retry Processing
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto flex items-center gap-2"
                onClick={() => navigate('/humanizer')}
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Input
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 md:py-12 px-4 md:px-6 max-w-3xl">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Humanizing Your Text</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Please wait while our advanced pipeline processes your content...
        </p>
      </div>

      <Card>
        <CardContent className="p-4 md:p-8">
          <div className="mb-6 md:mb-8">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
              <span>0%</span>
              <span>{Math.round(progress)}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isPast = currentIndex > index;
              const isCurrent = currentIndex === index;
              const isFuture = currentIndex < index;

              return (
                <div key={stage.id} className={`flex items-start gap-3 md:gap-4 ${isFuture ? 'opacity-40' : ''}`}>
                  <div className="mt-1 shrink-0">
                    {isPast ? (
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 md:h-6 md:w-6 text-primary animate-spin" />
                    ) : (
                      <Circle className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-base md:text-lg font-semibold ${isCurrent ? 'text-primary' : ''}`}>
                      {stage.label}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
