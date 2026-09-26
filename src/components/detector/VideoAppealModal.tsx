// ─── Human Review & Forensic Appeals Modal ──────────────────────────────────────

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, FileText, UploadCloud, Shield, HelpCircle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { getVisitorId } from '@/lib/visitorId';
import { toast } from 'sonner';

interface VideoAppealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  sha256: string;
  fileName: string;
  currentVerdict: string;
}

export const VideoAppealModal: React.FC<VideoAppealModalProps> = ({
  open,
  onOpenChange,
  jobId,
  sha256,
  fileName,
  currentVerdict,
}) => {
  const [reason, setReason] = useState('authentic_creator_false_positive');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [originalFileUrl, setOriginalFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [appealId, setAppealId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceNotes.trim()) {
      toast.error('Please provide supporting details explaining why this media is authentic.');
      return;
    }

    setIsSubmitting(true);
    try {
      const guestId = getVisitorId();
      const { data, error } = await supabase.rpc('submit_video_appeal', {
        p_job_id: jobId,
        p_reason: reason,
        p_evidence_notes: evidenceNotes.trim(),
        p_original_file_url: originalFileUrl.trim() || null,
        p_guest_id: guestId,
      });

      if (error) throw error;

      if (data?.success) {
        setIsSubmitted(true);
        setAppealId(data.appealId || 'APP-' + Date.now().toString().slice(-6));
        toast.success('Appeal submitted successfully for human forensic review.');
      } else {
        throw new Error(data?.message || 'Failed to submit appeal');
      }
    } catch (err: any) {
      console.error('[VideoAppealModal] Submission error:', err);
      toast.error(err.message || 'Could not submit appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setAppealId(null);
    setEvidenceNotes('');
    setOriginalFileUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle className="text-lg font-bold">Request Human Review & Dispute Result</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            If you are the original creator or publisher and believe this video was misclassified due to studio editing, compression, or filters, submit an appeal for human forensic verification.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold">Appeal Case #{appealId} Registered</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Our digital forensic analysts will examine the frame sequence, original camera parameters, and acoustic continuity. You will receive an updated forensic certificate upon review.
              </p>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs text-left space-y-1 font-mono">
              <div><strong>Job ID:</strong> {jobId}</div>
              <div><strong>SHA-256:</strong> {sha256.slice(0, 16)}...</div>
              <div><strong>Status:</strong> Pending Manual Forensic Ingestion</div>
            </div>
            <DialogFooter>
              <Button onClick={handleReset} className="w-full">
                Close & Return
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Media File:</span>
                <span className="font-mono font-medium truncate max-w-[200px]">{fileName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Algorithm Verdict:</span>
                <Badge variant="outline" className="text-xs">{currentVerdict}</Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs font-semibold">
                Primary Reason for Dispute
              </Label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="authentic_creator_false_positive">I am the creator; genuine camera footage flagged due to studio lighting/filters</option>
                <option value="platform_compression_artifacts">Video degraded heavily by social media recompression (TikTok/WhatsApp)</option>
                <option value="legitimate_dubbing_translation">Audio track is authentic human dubbing / translation voiceover</option>
                <option value="c2pa_metadata_lost">C2PA Content Credentials were stripped during publication</option>
                <option value="other_editorial_reason">Other legitimate journalistic / post-production technique</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evidence" className="text-xs font-semibold">
                Production Evidence & Context <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="evidence"
                rows={4}
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                placeholder="Describe camera hardware, recording conditions, editing software (e.g. Premiere Pro, DaVinci), color grading LUTs applied, or microphone setup..."
                className="text-xs resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="originalUrl" className="text-xs font-semibold">
                Link to Master / Original Camera RAW File (Optional)
              </Label>
              <Input
                id="originalUrl"
                type="url"
                value={originalFileUrl}
                onChange={(e) => setOriginalFileUrl(e.target.value)}
                placeholder="https://drive.google.com/... or https://dropbox.com/..."
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Providing an uncompressed master file enables differential forensic analysis to conclusively disprove synthetic claims.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2 text-xs text-muted-foreground">
              <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                Under our Zero-Data Retention policy, files submitted for appeals are analyzed in private isolated sandboxes and automatically purged following case resolution.
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5"
              >
                {isSubmitting ? 'Submitting Appeal...' : 'Submit Appeal for Human Review'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
