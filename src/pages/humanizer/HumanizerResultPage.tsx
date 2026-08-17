import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { humanizerApi } from '@/lib/humanizerApi';
import { HumanizationJob, HumanizationVersion } from '@/types/humanizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Copy, Download, RefreshCw, ChevronLeft, BarChart3, Columns, List, Shield, FileText, Activity, Layers, MessageSquare, Star, Edit3, RotateCcw, ThumbsUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HumanizerResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<HumanizationJob | null>(null);
  const [versions, setVersions] = useState<HumanizationVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'clean'>('side-by-side');
  const [editableText, setEditableText] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  // Feedback state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    overall_quality: 5,
    meaning_preservation: 5,
    naturalness: 5,
    usefulness: 5,
    issue_type: '',
    issue_description: ''
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!jobId) {
      navigate('/humanizer');
      return;
    }

    const fetchResult = async () => {
      try {
        const fetchedJob = await humanizerApi.getJob(jobId);
        // A result page needs at least a humanized_text. If job is still processing, send to processing.
        if (fetchedJob.status !== 'completed' && fetchedJob.status !== 'partial') {
          navigate(`/humanizer/processing/${jobId}`);
          return;
        }
        if (!fetchedJob.humanized_text && fetchedJob.status === 'partial') {
          navigate(`/humanizer/alternatives/${jobId}`);
          return;
        }
        setJob(fetchedJob);
        setEditableText(fetchedJob.humanized_text || '');

        const fetchedVersions = await humanizerApi.getJobVersions(jobId);
        setVersions(fetchedVersions);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load humanization result.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [jobId, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-[50vh]"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!job) {
    return <div className="text-center py-12">Result not found.</div>;
  }

  const scores = (job.scores as any) || {};
  const verification = (job.verification_results as any) || {};

  const handleCopy = () => {
    if (editableText) {
      navigator.clipboard.writeText(editableText);
      toast.success('Copied to clipboard');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const handleAccept = async (force = false) => {
    if (!job || (!hasUnsavedChanges && !force)) return;
    try {
      setIsSaving(true);
      await humanizerApi.updateJobText(job.job_id, editableText);
      setJob({ ...job, humanized_text: editableText });
      setHasUnsavedChanges(false);
      toast.success('Changes accepted and saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = () => {
    setEditableText(job.humanized_text || '');
    setHasUnsavedChanges(false);
    toast.info('Restored to original humanized version');
  };

  const replaceSentence = (oldSentence: string, newSentence: string) => {
    if (!oldSentence) return editableText;
    // Escape regex special chars
    const escaped = oldSentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    return editableText.replace(regex, newSentence);
  };

  const handleRejectSentence = (index: number) => {
    const changes = (job.sentence_changes as any[]) || [];
    const change = changes[index];
    if (!change || !change.humanized_sentence) return;

    const newText = replaceSentence(change.humanized_sentence, change.original_sentence);
    setEditableText(newText);
    setHasUnsavedChanges(true);

    // Update the change locally
    const updatedChanges = [...changes];
    updatedChanges[index] = {
      ...change,
      humanized_sentence: change.original_sentence,
      change_type: 'Unchanged',
      reason: 'Restored to original by user',
      similarity: 100
    };
    setJob({ ...job, sentence_changes: updatedChanges });
    toast.success('Sentence restored to original');
  };

  const handleRegenerateSentence = async (index: number) => {
    const changes = (job.sentence_changes as any[]) || [];
    const change = changes[index];
    if (!change || !change.original_sentence) return;

    try {
      setRegeneratingIndex(index);
      const context = `Original surrounding context:\n${job.original_text}\n\nRewrite this specific sentence only, preserving meaning: ${change.original_sentence}`;
      const newSentence = await humanizerApi.regenerate(job.job_id, 'sentence', context);

      const newText = replaceSentence(change.humanized_sentence, newSentence);
      setEditableText(newText);
      setHasUnsavedChanges(true);

      const updatedChanges = [...changes];
      updatedChanges[index] = {
        ...change,
        humanized_sentence: newSentence,
        change_type: newSentence === change.original_sentence ? 'Unchanged' : 'Vocabulary Update',
        reason: 'Regenerated by user request'
      };
      setJob({ ...job, sentence_changes: updatedChanges });
      toast.success('Sentence regenerated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate sentence');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleRegenerateFull = async () => {
    try {
      setIsSaving(true);
      const newText = await humanizerApi.regenerate(job.job_id, 'full');
      setEditableText(newText);
      setHasUnsavedChanges(true);
      toast.success('Full text regenerated. Click Accept to save.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate full text');
    } finally {
      setIsSaving(false);
    }
  };

  const submitFeedback = async () => {
    if (!job) return;
    try {
      setSubmittingFeedback(true);
      await humanizerApi.submitFeedback(job.job_id, feedback);
      toast.success('Thank you! Your feedback helps us improve.');
      setFeedbackOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`p-1 ${star <= value ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-400'}`}
            onClick={() => onChange(star)}
          >
            <Star className={`h-6 w-6 ${star <= value ? 'fill-yellow-500' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  const protectedItems = verification.protected_items || [];
  const integrityIssues = verification.issues || [];

  return (
    <div className="container mx-auto py-4 md:py-6 px-4 md:px-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <div className="min-w-0 flex-1">
          <Button variant="ghost" className="pl-0 text-muted-foreground h-auto py-1" onClick={() => navigate('/humanizer')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Input
          </Button>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight mt-1">Humanization Result</h1>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <MessageSquare className="h-4 w-4 mr-2" /> Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader>
                <DialogTitle>How did we do?</DialogTitle>
                <DialogDescription>Help us improve by rating this humanization result.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Overall Quality</Label>
                    <StarRating value={feedback.overall_quality} onChange={(v) => setFeedback({ ...feedback, overall_quality: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Naturalness</Label>
                    <StarRating value={feedback.naturalness} onChange={(v) => setFeedback({ ...feedback, naturalness: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Meaning Preservation</Label>
                    <StarRating value={feedback.meaning_preservation} onChange={(v) => setFeedback({ ...feedback, meaning_preservation: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Usefulness</Label>
                    <StarRating value={feedback.usefulness} onChange={(v) => setFeedback({ ...feedback, usefulness: v })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Did you encounter any issues?</Label>
                  <Select value={feedback.issue_type} onValueChange={(v) => setFeedback({ ...feedback, issue_type: v === 'none' ? '' : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an issue (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No issues</SelectItem>
                      <SelectItem value="Meaning Changed">Meaning Changed</SelectItem>
                      <SelectItem value="Information Removed">Important Information Removed</SelectItem>
                      <SelectItem value="Still Robotic">Output Still Sounds Robotic</SelectItem>
                      <SelectItem value="Grammar Worse">Grammar Became Worse</SelectItem>
                      <SelectItem value="Tone Incorrect">Tone is Incorrect</SelectItem>
                      <SelectItem value="Formatting Lost">Formatting Was Lost</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Additional Comments</Label>
                  <Textarea
                    placeholder="Tell us more about your experience..."
                    value={feedback.issue_description}
                    onChange={(e) => setFeedback({ ...feedback, issue_description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
                <Button onClick={submitFeedback} disabled={submittingFeedback}>
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="h-10" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" /> Copy
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => toast.info('Export feature coming soon')}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={handleRegenerateFull} disabled={isSaving}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} /> Regenerate
          </Button>
          <Button variant="default" size="sm" className="h-10" onClick={() => handleAccept(true)} disabled={isSaving}>
            <ThumbsUp className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button size="sm" className="h-10" onClick={() => navigate('/humanizer')}>
            New Humanization
          </Button>
        </div>
      </div>

      {job.status === 'partial' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Partial result</p>
              <p>
                Only some alternatives were generated for this job.
                You can return to the alternatives page to retry missing versions without using additional credits.
              </p>
              {job.request_id && (
                <p className="mt-1 text-xs text-yellow-700">Request ID: {job.request_id}</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/humanizer/alternatives/${jobId}`)}>
              <RotateCcw className="h-3 w-3 mr-2" /> Retry Missing Versions
            </Button>
          </div>
        </div>
      )}

      {hasUnsavedChanges && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span>You have unsaved changes to the humanized text.</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRestore}>
              <RotateCcw className="h-4 w-4 mr-1" /> Restore
            </Button>
            <Button size="sm" onClick={() => handleAccept()} disabled={isSaving}>
              <ThumbsUp className="h-4 w-4 mr-1" /> {isSaving ? 'Saving...' : 'Accept Changes'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Left Sidebar - Summary */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center mb-4 md:mb-6">
                <div className="relative h-28 w-28 md:h-32 md:w-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                    <circle
                      cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10"
                      className={getScoreColor(scores.humanization_score || 0)}
                      strokeDasharray={`${(scores.humanization_score || 0) * 2.83} 283`}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl md:text-3xl font-bold">{scores.humanization_score || 0}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <Badge variant="outline" className="mt-3 md:mt-4 bg-green-50 text-green-700 border-green-200">
                  {scores.confidence_level || 'High'} Confidence
                </Badge>
              </div>

              <div className="space-y-3 md:space-y-4">
                {[
                  { label: 'Meaning Preservation', value: scores.meaning_preservation_score || 0 },
                  { label: 'Naturalness', value: scores.naturalness_score || 0 },
                  { label: 'Readability', value: scores.readability_score || 0 },
                  { label: 'Grammar', value: scores.grammar_score || 0 },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-medium">{metric.value}%</span>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">AI Signal Estimate</CardTitle>
              <CardDescription className="text-xs">Based on writing patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xs">AI</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Before</div>
                      <div className="text-xs text-muted-foreground">Original text</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-red-500">{scores.ai_signal_before || 0}%</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-bold text-xs">HU</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">After</div>
                      <div className="text-xs text-muted-foreground">Humanized</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-500">{scores.ai_signal_after || 0}%</div>
                </div>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded text-center">
                  Estimates only. Not guaranteed detector bypass.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Area - Tabs */}
        <div className="lg:col-span-3 min-w-0">
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="comparison" className="py-2.5 flex flex-col gap-1 sm:flex-row text-xs sm:text-sm"><Columns className="h-4 w-4" /> <span className="hidden sm:inline">Compare</span></TabsTrigger>
              <TabsTrigger value="sentences" className="py-2.5 flex flex-col gap-1 sm:flex-row text-xs sm:text-sm"><List className="h-4 w-4" /> <span className="hidden sm:inline">Sentences</span></TabsTrigger>
              <TabsTrigger value="integrity" className="py-2.5 flex flex-col gap-1 sm:flex-row text-xs sm:text-sm"><Shield className="h-4 w-4" /> <span className="hidden sm:inline">Integrity</span></TabsTrigger>
              <TabsTrigger value="quality" className="py-2.5 flex flex-col gap-1 sm:flex-row text-xs sm:text-sm"><FileText className="h-4 w-4" /> <span className="hidden sm:inline">Quality</span></TabsTrigger>
              <TabsTrigger value="signals" className="py-2.5 flex flex-col gap-1 sm:flex-row text-xs sm:text-sm"><Activity className="h-4 w-4" /> <span className="hidden sm:inline">AI Signals</span></TabsTrigger>
            </TabsList>

            <div className="mt-4 md:mt-6 border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden h-[500px] md:h-[600px] flex flex-col">

              {/* Comparison Tab */}
              <TabsContent value="comparison" className="m-0 h-full flex flex-col data-[state=active]:flex">
                <div className="p-2 border-b bg-muted/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
                  <div className="flex bg-muted rounded-md p-1">
                    <button
                      onClick={() => setViewMode('side-by-side')}
                      className={`px-3 py-1 text-xs sm:text-sm rounded-sm ${viewMode === 'side-by-side' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                    >
                      Side by Side
                    </button>
                    <button
                      onClick={() => setViewMode('clean')}
                      className={`px-3 py-1 text-xs sm:text-sm rounded-sm ${viewMode === 'clean' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                    >
                      Clean Result
                    </button>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-200"></div> Removed</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-200"></div> Added</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-200"></div> Rewritten</span>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden min-h-0">
                  {viewMode === 'side-by-side' ? (
                    <div className="flex flex-col md:flex-row h-full divide-y md:divide-y-0 md:divide-x">
                      <div className="flex-1 flex flex-col min-w-0 h-1/2 md:h-full">
                        <div className="p-2 bg-muted/20 border-b font-medium text-sm shrink-0">Original Text</div>
                        <div className="flex-1 overflow-y-auto p-4 min-h-0">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{job.original_text}</div>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col min-w-0 h-1/2 md:h-full">
                        <div className="p-2 bg-muted/20 border-b font-medium text-sm shrink-0">Humanized Text</div>
                        <div className="flex-1 overflow-y-auto p-4 min-h-0">
                          <Textarea
                            value={editableText}
                            onChange={(e) => { setEditableText(e.target.value); setHasUnsavedChanges(true); }}
                            className="w-full min-h-[200px] md:min-h-full border-0 focus-visible:ring-0 resize-none text-sm leading-relaxed bg-transparent p-0"
                            rows={Math.max(8, Math.ceil(editableText.length / 80))}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="p-2 bg-muted/20 border-b font-medium text-sm shrink-0">Humanized Result</div>
                      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
                        <Textarea
                          value={editableText}
                          onChange={(e) => { setEditableText(e.target.value); setHasUnsavedChanges(true); }}
                          className="w-full min-h-[300px] md:min-h-full border-0 focus-visible:ring-0 resize-none text-sm md:text-base leading-relaxed bg-transparent p-0"
                          rows={Math.max(12, Math.ceil(editableText.length / 80))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Sentences Tab */}
              <TabsContent value="sentences" className="m-0 h-full flex flex-col data-[state=active]:flex">
                 <div className="p-3 md:p-4 border-b bg-muted/30 shrink-0">
                   <h3 className="font-medium text-sm md:text-base">Sentence-Level Analysis</h3>
                   <p className="text-xs md:text-sm text-muted-foreground">Review individual changes, accept or reject modifications.</p>
                 </div>
                 <ScrollArea className="flex-1 p-0 min-h-0">
                   <div className="divide-y">
                     {(job.sentence_changes as any[] || []).map((change, i) => (
                       <div key={i} className="p-3 md:p-4 hover:bg-muted/10 transition-colors">
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                           <Badge
                             variant={change.change_type === 'Unchanged' || change.change_type === 'No Change Required' ? 'outline' : 'default'}
                             className="text-xs"
                           >
                             {change.change_type}
                           </Badge>
                           <div className="flex gap-2 w-full sm:w-auto">
                             <Button
                               size="sm"
                               variant="outline"
                               className="h-8 text-xs flex-1 sm:flex-none"
                               onClick={() => handleRejectSentence(i)}
                               disabled={change.change_type === 'Unchanged' || change.change_type === 'No Change Required'}
                             >
                               Reject
                             </Button>
                             <Button
                               size="sm"
                               variant="secondary"
                               className="h-8 text-xs flex-1 sm:flex-none"
                               onClick={() => handleRegenerateSentence(i)}
                               disabled={regeneratingIndex === i}
                             >
                               {regeneratingIndex === i ? '...' : 'Regenerate'}
                             </Button>
                           </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                           <div className="min-w-0">
                             <div className="text-xs text-muted-foreground mb-1">Original</div>
                             <p className="text-xs md:text-sm p-2 bg-red-50 text-red-900 rounded-md border border-red-100 break-words">{change.original_sentence}</p>
                           </div>
                           <div className="min-w-0">
                             <div className="text-xs text-muted-foreground mb-1">Humanized</div>
                             <p className="text-xs md:text-sm p-2 bg-green-50 text-green-900 rounded-md border border-green-100 break-words">{change.humanized_sentence}</p>
                           </div>
                         </div>
                         <div className="mt-3 flex flex-wrap items-center gap-2 md:gap-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                           <span className="break-words"><span className="font-medium">Reason:</span> {change.reason}</span>
                           <span><span className="font-medium">Confidence:</span> {change.confidence}</span>
                           {typeof change.similarity === 'number' && (
                             <span><span className="font-medium">Similarity:</span> {change.similarity}%</span>
                           )}
                         </div>
                       </div>
                     ))}
                     {(!job.sentence_changes || job.sentence_changes.length === 0) && (
                       <div className="p-8 text-center text-muted-foreground">No sentence level analysis available.</div>
                     )}
                   </div>
                 </ScrollArea>
              </TabsContent>

              {/* Integrity Tab */}
              <TabsContent value="integrity" className="m-0 h-full flex flex-col p-4 md:p-6 data-[state=active]:flex overflow-y-auto">
                 <h3 className="font-medium text-base md:text-lg mb-4">Meaning & Factual Integrity Report</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <Card>
                      <CardHeader className="py-3 md:py-4">
                        <CardTitle className="text-sm md:text-base flex items-center gap-2 text-green-600"><CheckCircle2 className="h-5 w-5" /> Preserved Elements</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {protectedItems.length > 0 ? (
                          protectedItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-sm capitalize">{item.type} Preserved</span>
                              <Badge variant={item.status === 'preserved' ? 'secondary' : 'outline'}>{item.status === 'preserved' ? 'Yes' : 'Check'}</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No protected elements (numbers, URLs, dates) detected in the original text.</div>
                        )}
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-sm">Meaning Preservation Score</span>
                          <Badge variant="secondary">{verification.meaning_preservation_score || scores.meaning_preservation_score || 0}%</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="py-3 md:py-4">
                        <CardTitle className="text-sm md:text-base flex items-center gap-2 text-yellow-600"><AlertCircle className="h-5 w-5" /> Potential Issues</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {integrityIssues.length > 0 ? (
                          integrityIssues.map((issue: string, idx: number) => (
                            <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                              <span>{issue}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No meaning loss, factual changes, or missing information detected in the humanized version. The core intent remains intact.</div>
                        )}
                      </CardContent>
                    </Card>
                 </div>
              </TabsContent>

              {/* Quality Tab */}
              <TabsContent value="quality" className="m-0 h-full flex flex-col p-4 md:p-6 data-[state=active]:flex overflow-y-auto">
                <h3 className="font-medium text-base md:text-lg mb-4">Writing Quality Report</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                   {scores.lexical_diversity_after !== undefined && (
                     <div className="p-3 md:p-4 border rounded-lg">
                       <div className="text-xs md:text-sm text-muted-foreground mb-1">Lexical Diversity</div>
                       <div className="text-lg md:text-xl font-medium">{scores.lexical_diversity_after}%</div>
                     </div>
                   )}
                   <div className="p-3 md:p-4 border rounded-lg">
                     <div className="text-xs md:text-sm text-muted-foreground mb-1">Coherence Score</div>
                     <div className="text-lg md:text-xl font-medium">{scores.coherence_score || 'N/A'}</div>
                   </div>
                   <div className="p-3 md:p-4 border rounded-lg">
                     <div className="text-xs md:text-sm text-muted-foreground mb-1">Sentence Variety</div>
                     <div className="text-lg md:text-xl font-medium">{scores.sentence_variety_score || 'N/A'}</div>
                   </div>
                   <div className="p-3 md:p-4 border rounded-lg">
                     <div className="text-xs md:text-sm text-muted-foreground mb-1">Vocabulary Diversity</div>
                     <div className="text-lg md:text-xl font-medium">{scores.vocabulary_diversity_score || 'N/A'}</div>
                   </div>
                   <div className="p-3 md:p-4 border rounded-lg">
                     <div className="text-xs md:text-sm text-muted-foreground mb-1">Tone Consistency</div>
                     <div className="text-lg md:text-xl font-medium">{scores.tone_consistency_score || 'N/A'}</div>
                   </div>
                   <div className="p-3 md:p-4 border rounded-lg">
                     <div className="text-xs md:text-sm text-muted-foreground mb-1">Originality Score</div>
                     <div className="text-lg md:text-xl font-medium">{scores.originality_score || 'N/A'}</div>
                   </div>
                </div>
              </TabsContent>

              {/* Signals Tab */}
              <TabsContent value="signals" className="m-0 h-full flex flex-col p-4 md:p-6 data-[state=active]:flex overflow-y-auto">
                 <h3 className="font-medium text-base md:text-lg mb-2 md:mb-4">AI-Writing Signal Report</h3>
                 <p className="text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">This analyzes patterns commonly found in AI-generated text and shows how they were addressed.</p>
                 <div className="space-y-3 md:space-y-4">
                    <div className="p-3 border rounded-lg flex items-start gap-3">
                       <div className="mt-0.5"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
                       <div>
                         <div className="font-medium text-sm">Predictable Patterns</div>
                         <div className="text-xs text-muted-foreground">
                           Before: {scores.predictable_patterns_before ?? 'N/A'} patterns detected. After: {scores.predictable_patterns_after ?? 'N/A'} patterns detected.
                         </div>
                       </div>
                    </div>
                    <div className="p-3 border rounded-lg flex items-start gap-3">
                       <div className="mt-0.5"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
                       <div>
                         <div className="font-medium text-sm">Lexical Diversity</div>
                         <div className="text-xs text-muted-foreground">
                           Before: {scores.lexical_diversity_before ?? 'N/A'}%. After: {scores.lexical_diversity_after ?? 'N/A'}%.
                         </div>
                       </div>
                    </div>
                    <div className="p-3 border rounded-lg flex items-start gap-3">
                       <div className="mt-0.5"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
                       <div>
                         <div className="font-medium text-sm">Structural Variety</div>
                         <div className="text-xs text-muted-foreground">
                           Text was restructured to reduce uniform sentence openings and repetitive syntax.
                         </div>
                       </div>
                    </div>
                 </div>
                 <div className="mt-4 md:mt-6 text-xs text-muted-foreground bg-muted p-3 rounded">
                   Estimated writing-pattern score. It does not guarantee third-party AI detector outcomes.
                 </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
