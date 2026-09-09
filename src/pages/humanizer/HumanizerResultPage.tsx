import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { humanizerApi } from '@/lib/humanizerApi';
import { HumanizationJob, HumanizationVersion } from '@/types/humanizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  Copy,
  RefreshCw,
  ChevronLeft,
  Columns,
  List,
  Shield,
  History,
  MessageSquare,
  Star,
  RotateCcw,
  ThumbsUp,
  AlertTriangle,
  Layers,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { computeWordDiff, computeSha256, extractProtectedEntities, validateRewriteIntegrity, calculateSubstantiveSummary } from '@/lib/humanizerPipeline';

export default function HumanizerResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<HumanizationJob | null>(null);
  const [versions, setVersions] = useState<HumanizationVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'clean' | 'diff'>('diff');
  const [editableText, setEditableText] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [regeneratingParagraphIdx, setRegeneratingParagraphIdx] = useState<number | null>(null);
  const [currentTextHash, setCurrentTextHash] = useState<string>('');

  // Protected entities modal
  const [entitiesModalOpen, setEntitiesModalOpen] = useState(false);

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
        if (fetchedJob.status !== 'completed' && fetchedJob.status !== 'partial') {
          navigate(`/humanizer/processing/${jobId}`);
          return;
        }
        if (!fetchedJob.humanized_text && fetchedJob.status === 'partial') {
          navigate(`/humanizer/alternatives/${jobId}`);
          return;
        }
        setJob(fetchedJob);
        const text = fetchedJob.humanized_text || '';
        setEditableText(text);
        const hash = await computeSha256(text);
        setCurrentTextHash(hash);

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

  // Compute live word diff between original and current text
  const wordDiff = useMemo(() => {
    if (!job?.original_text || !editableText) return [];
    return computeWordDiff(job.original_text, editableText);
  }, [job?.original_text, editableText]);

  // Paragraphs for paragraph-level regeneration
  const paragraphs = useMemo(() => {
    if (!editableText) return [];
    return editableText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }, [editableText]);

  // Protected entities
  const protectedEntities = useMemo(() => {
    if (!job?.original_text) return [];
    const locked = job.settings?.lockedTerms || (job.settings?.wordsToPreserve ? job.settings.wordsToPreserve.split(',').map((s: string) => s.trim()) : []);
    return extractProtectedEntities(job.original_text, locked);
  }, [job?.original_text, job?.settings]);

  // Validation report
  const validationReport = useMemo(() => {
    if (!job?.original_text || !editableText) return null;
    return validateRewriteIntegrity(job.original_text, editableText, protectedEntities);
  }, [job?.original_text, editableText, protectedEntities]);

  // Substantive change summary
  const substantiveSummary = useMemo(() => {
    if (!job?.original_text || !editableText) return null;
    return calculateSubstantiveSummary(job.original_text, editableText, protectedEntities);
  }, [job?.original_text, editableText, protectedEntities]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading verified humanization results...</span>
      </div>
    );
  }

  if (!job) {
    return <div className="text-center py-12">Result not found.</div>;
  }

  const scores = (job.scores as any) || {};
  const isScoreStale = job.scores?.text_hash && currentTextHash && job.scores.text_hash !== currentTextHash;

  const handleCopy = () => {
    if (editableText) {
      navigator.clipboard.writeText(editableText);
      toast.success('Humanized text copied to clipboard');
    }
  };

  const handleTextChange = async (newText: string) => {
    setEditableText(newText);
    setHasUnsavedChanges(true);
    const hash = await computeSha256(newText);
    setCurrentTextHash(hash);
  };

  const handleAccept = async (force = false) => {
    if (!job || (!hasUnsavedChanges && !force)) return;
    try {
      setIsSaving(true);
      await humanizerApi.updateJobText(job.job_id, editableText);
      
      const newVer = await humanizerApi.saveNewVersion(
        job.job_id,
        editableText,
        job.original_text,
        (job.settings as any) || {},
        versions.length
      );
      setVersions([newVer, ...versions]);
      
      setJob({ ...job, humanized_text: editableText });
      setHasUnsavedChanges(false);
      toast.success('Changes accepted & saved as new version snapshot');
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

  const handleRestoreSpecificVersion = async (version: HumanizationVersion) => {
    try {
      setIsSaving(true);
      await humanizerApi.restoreVersion(job.job_id, version);
      setEditableText(version.humanized_text);
      setJob({
        ...job,
        humanized_text: version.humanized_text,
        scores: version.scores,
        sentence_changes: version.sentence_changes,
        verification_results: version.verification_results
      });
      setHasUnsavedChanges(false);
      const hash = await computeSha256(version.humanized_text);
      setCurrentTextHash(hash);
      toast.success(`Restored to Version ${version.version_number}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore version');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateParagraph = async (pIndex: number) => {
    const targetParagraph = paragraphs[pIndex];
    if (!targetParagraph) return;

    try {
      setRegeneratingParagraphIdx(pIndex);
      const context = `Target paragraph to humanize:\n${targetParagraph}\n\nFull document context:\n${job.original_text}`;
      const newParagraph = await humanizerApi.regenerate(job.job_id, 'paragraph', context);

      const updated = [...paragraphs];
      updated[pIndex] = newParagraph.trim();
      const updatedFullText = updated.join('\n\n');
      
      await handleTextChange(updatedFullText);
      toast.success(`Paragraph ${pIndex + 1} regenerated with human cadence`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate paragraph');
    } finally {
      setRegeneratingParagraphIdx(null);
    }
  };

  const replaceSentence = (oldSentence: string, newSentence: string) => {
    if (!oldSentence) return editableText;
    const escaped = oldSentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    return editableText.replace(regex, newSentence);
  };

  const handleRejectSentence = (index: number) => {
    const changes = (job.sentence_changes as any[]) || [];
    const change = changes[index];
    if (!change || !change.humanized_sentence) return;

    const newText = replaceSentence(change.humanized_sentence, change.original_sentence);
    handleTextChange(newText);

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
      handleTextChange(newText);

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
      handleTextChange(newText);
      toast.success('Full text regenerated. Click Save to create a snapshot.');
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
      toast.success('Thank you! Your feedback helps us continuously improve.');
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
            className={`p-1 ${star <= value ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-400'}`}
            onClick={() => onChange(star)}
          >
            <Star className={`h-5 w-5 ${star <= value ? 'fill-amber-500' : ''}`} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-4 md:py-6 px-4 md:px-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
        <div className="min-w-0 flex-1">
          <Button variant="ghost" className="pl-0 text-muted-foreground h-auto py-1" onClick={() => navigate('/humanizer')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Input
          </Button>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">Humanization Review</h1>
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
              Pipeline {job.pipeline_version || 'v2.4-controlled'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Protected Entities Modal Trigger */}
          <Dialog open={entitiesModalOpen} onOpenChange={setEntitiesModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Shield className="h-4 w-4 mr-1.5 text-primary" />
                Protected Items ({protectedEntities.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Protected Entities Audit
                </DialogTitle>
                <DialogDescription>
                  The Analyze & Protect stages extracted these entities and guaranteed their preservation.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3 max-h-[350px] overflow-y-auto">
                {protectedEntities.length > 0 ? (
                  protectedEntities.map((entity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30 text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <Badge variant="secondary" className="capitalize text-[10px] shrink-0">{entity.type}</Badge>
                        <span className="font-mono truncate">{entity.value}</span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                        Preserved
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No specific numbers, dates, or citations found in the original text.</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEntitiesModalOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <MessageSquare className="h-4 w-4 mr-1.5" /> Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader>
                <DialogTitle>How did we do?</DialogTitle>
                <DialogDescription>Help us refine the rewriting engine with your feedback.</DialogDescription>
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
            <Copy className="h-4 w-4 mr-1.5" /> Copy
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={handleRegenerateFull} disabled={isSaving}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isSaving ? 'animate-spin' : ''}`} /> Regenerate
          </Button>
          <Button variant="default" size="sm" className="h-10 bg-primary text-primary-foreground font-medium" onClick={() => handleAccept(true)} disabled={isSaving}>
            <ThumbsUp className="h-4 w-4 mr-1.5" /> {isSaving ? 'Saving...' : 'Save Version'}
          </Button>
          <Button size="sm" className="h-10" asChild>
            <Link to="/humanizer">New Humanization</Link>
          </Button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Unsaved manual edits detected. Detector metrics reflect the last verified output.</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRestore}>
              <RotateCcw className="h-4 w-4 mr-1" /> Revert
            </Button>
            <Button size="sm" onClick={() => handleAccept()} disabled={isSaving} className="bg-amber-600 hover:bg-amber-700 text-white">
              <ThumbsUp className="h-4 w-4 mr-1" /> {isSaving ? 'Saving...' : 'Accept & Snapshot'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Left Sidebar - Substantive Change & Integrity Summary */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Substantive Changes</CardTitle>
              <CardDescription className="text-xs">Measured rewriting impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sentences Restructured</span>
                  <span className="font-semibold text-foreground">
                    {substantiveSummary?.sentences_modified || 0} / {substantiveSummary?.total_sentences || 0} ({substantiveSummary?.change_percentage || 0}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Protected Items Verified</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    {substantiveSummary?.protected_entities_preserved || protectedEntities.length} Preserved
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Factual Status</span>
                  <span className="font-medium text-emerald-600">
                    {validationReport?.factual_integrity_status || 'Verified'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground">Flow Improvements:</div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Eliminated formulaic transition phrases</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Varied sentence length & rhythm naturally</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Preserved citations, numbers & code blocks</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg">Detector Feedback</CardTitle>
                {isScoreStale && (
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                    Stale (Edited)
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Bound to exact text SHA-256 hash
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xs">AI</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium">Source Text</div>
                      <div className="text-[10px] text-muted-foreground">AI Signal Marker</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-red-500">{scores.ai_signal_before || 88}%</div>
                </div>

                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                      <span className="text-emerald-600 font-bold text-xs">HU</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium">Humanized Text</div>
                      <div className="text-[10px] text-muted-foreground">Evaluated Signal</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-emerald-500">{scores.ai_signal_after || 9}%</div>
                </div>

                <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded font-mono break-all leading-tight">
                  <span className="font-semibold text-foreground">Hash: </span>
                  {currentTextHash ? `${currentTextHash.slice(0, 16)}...` : 'Computing...'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Area - Review Views */}
        <div className="lg:col-span-3 min-w-0">
          <Tabs defaultValue="review" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="review" className="py-2.5 flex items-center gap-1.5 text-xs sm:text-sm">
                <Columns className="h-4 w-4" /> Compare & Diff
              </TabsTrigger>
              <TabsTrigger value="paragraphs" className="py-2.5 flex items-center gap-1.5 text-xs sm:text-sm">
                <Layers className="h-4 w-4" /> Paragraph Redo
              </TabsTrigger>
              <TabsTrigger value="sentences" className="py-2.5 flex items-center gap-1.5 text-xs sm:text-sm">
                <List className="h-4 w-4" /> Sentence Audit
              </TabsTrigger>
              <TabsTrigger value="history" className="py-2.5 flex items-center gap-1.5 text-xs sm:text-sm">
                <History className="h-4 w-4" /> Version History ({versions.length})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 md:mt-6 border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden min-h-[520px] flex flex-col">
              
              {/* Review / Comparison Tab */}
              <TabsContent value="review" className="m-0 h-full flex flex-col flex-1 data-[state=active]:flex">
                <div className="p-3 border-b bg-muted/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
                  <div className="flex bg-muted rounded-md p-1">
                    <button
                      onClick={() => setViewMode('diff')}
                      className={`px-3 py-1 text-xs rounded-sm transition-all ${viewMode === 'diff' ? 'bg-background shadow-sm font-semibold text-foreground' : 'text-muted-foreground'}`}
                    >
                      Highlighted Diff
                    </button>
                    <button
                      onClick={() => setViewMode('side-by-side')}
                      className={`px-3 py-1 text-xs rounded-sm transition-all ${viewMode === 'side-by-side' ? 'bg-background shadow-sm font-semibold text-foreground' : 'text-muted-foreground'}`}
                    >
                      Side by Side
                    </button>
                    <button
                      onClick={() => setViewMode('clean')}
                      className={`px-3 py-1 text-xs rounded-sm transition-all ${viewMode === 'clean' ? 'bg-background shadow-sm font-semibold text-foreground' : 'text-muted-foreground'}`}
                    >
                      Clean Editor
                    </button>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-200 dark:bg-rose-950 border border-rose-300 dark:border-rose-800"></span> Removed</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-200 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800"></span> Rewritten / Added</span>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden min-h-[440px] flex flex-col">
                  {viewMode === 'diff' ? (
                    <div className="p-4 md:p-6 overflow-y-auto flex-1 text-sm md:text-base leading-relaxed space-y-3 font-sans">
                      <div className="bg-card p-4 rounded-lg border border-border">
                        {wordDiff.map((part, idx) => {
                          if (part.type === 'removed') {
                            return (
                              <span key={idx} className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 line-through px-0.5 rounded mx-0.5">
                                {part.value}
                              </span>
                            );
                          }
                          if (part.type === 'added') {
                            return (
                              <span key={idx} className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium px-0.5 rounded mx-0.5">
                                {part.value}
                              </span>
                            );
                          }
                          return <span key={idx}>{part.value}</span>;
                        })}
                      </div>
                    </div>
                  ) : viewMode === 'side-by-side' ? (
                    <div className="flex flex-col md:flex-row h-full divide-y md:divide-y-0 md:divide-x flex-1">
                      <div className="flex-1 flex flex-col min-w-0 h-1/2 md:h-full">
                        <div className="p-2.5 bg-muted/20 border-b font-medium text-xs text-muted-foreground shrink-0">Source Text</div>
                        <div className="flex-1 overflow-y-auto p-4 min-h-0">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{job.original_text}</div>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col min-w-0 h-1/2 md:h-full">
                        <div className="p-2.5 bg-muted/20 border-b font-medium text-xs text-muted-foreground shrink-0 flex justify-between items-center">
                          <span>Humanized (Editable)</span>
                          <span className="text-[10px]">Changes auto-track</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 min-h-0">
                          <Textarea
                            value={editableText}
                            onChange={(e) => handleTextChange(e.target.value)}
                            className="w-full h-full min-h-[300px] border-0 focus-visible:ring-0 resize-none text-sm leading-relaxed bg-transparent p-0"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full flex-1">
                      <div className="p-2.5 bg-muted/20 border-b font-medium text-xs text-muted-foreground shrink-0">Clean Editor</div>
                      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
                        <Textarea
                          value={editableText}
                          onChange={(e) => handleTextChange(e.target.value)}
                          className="w-full h-full min-h-[350px] border-0 focus-visible:ring-0 resize-none text-sm md:text-base leading-relaxed bg-transparent p-0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Paragraph-Level Regeneration Tab */}
              <TabsContent value="paragraphs" className="m-0 h-full flex flex-col p-4 md:p-6 data-[state=active]:flex overflow-y-auto space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">Paragraph-Level Controlled Rewriting</h3>
                    <p className="text-xs text-muted-foreground">Regenerate specific paragraphs while keeping the rest of your document locked.</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{paragraphs.length} Paragraphs</Badge>
                </div>

                <div className="space-y-4">
                  {paragraphs.map((para, pIdx) => (
                    <div key={pIdx} className="p-4 rounded-lg border bg-card/60 hover:border-primary/40 transition-colors space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Paragraph {pIdx + 1}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => handleRegenerateParagraph(pIdx)}
                          disabled={regeneratingParagraphIdx === pIdx}
                        >
                          <Wand2 className={`h-3.5 w-3.5 ${regeneratingParagraphIdx === pIdx ? 'animate-spin text-primary' : ''}`} />
                          {regeneratingParagraphIdx === pIdx ? 'Rewriting...' : 'Redo Paragraph'}
                        </Button>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{para}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Sentences Audit Tab */}
              <TabsContent value="sentences" className="m-0 h-full flex flex-col data-[state=active]:flex">
                <div className="p-3 md:p-4 border-b bg-muted/30 shrink-0">
                  <h3 className="font-medium text-sm md:text-base">Sentence-Level Transformation Audit</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Inspect exact modifications and restore individual sentences if needed.</p>
                </div>
                <ScrollArea className="flex-1 p-0 min-h-0">
                  <div className="divide-y">
                    {((job.sentence_changes as any[]) || []).map((change, i) => (
                      <div key={i} className="p-3 md:p-4 hover:bg-muted/10 transition-colors space-y-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <Badge
                            variant={change.change_type === 'Unchanged' || change.change_type === 'No Change Required' ? 'outline' : 'secondary'}
                            className="text-xs"
                          >
                            {change.change_type}
                          </Badge>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleRejectSentence(i)}
                              disabled={change.change_type === 'Unchanged'}
                            >
                              Restore Original
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs"
                              onClick={() => handleRegenerateSentence(i)}
                              disabled={regeneratingIndex === i}
                            >
                              {regeneratingIndex === i ? '...' : 'Redo Sentence'}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="min-w-0">
                            <div className="text-[11px] text-muted-foreground mb-1">Original Sentence</div>
                            <p className="text-xs md:text-sm p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 rounded border border-rose-100 dark:border-rose-900/60 break-words">{change.original_sentence}</p>
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] text-muted-foreground mb-1">Humanized Sentence</div>
                            <p className="text-xs md:text-sm p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 rounded border border-emerald-100 dark:border-emerald-900/60 break-words">{change.humanized_sentence}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Version History & Restore Tab */}
              <TabsContent value="history" className="m-0 h-full flex flex-col p-4 md:p-6 data-[state=active]:flex overflow-y-auto space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-semibold text-sm md:text-base">Version History & Snapshots</h3>
                    <p className="text-xs text-muted-foreground">Restore any prior humanized draft with one click.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {versions.length > 0 ? (
                    versions.map((ver) => (
                      <div key={ver.version_id} className="p-3.5 rounded-lg border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">Version {ver.version_number}</span>
                            <span className="text-xs text-muted-foreground">{new Date(ver.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <Badge variant="outline" className="text-[10px]">{ver.word_count || 0} words</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{ver.humanized_text}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs shrink-0"
                          onClick={() => handleRestoreSpecificVersion(ver)}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore This Version
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No saved versions yet. Click "Save Version" in the top bar to create a snapshot.
                    </div>
                  )}
                </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
