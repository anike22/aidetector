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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { submitAuthorshipDispute } from '@/lib/verifiedAuthorship/authorshipService';

interface AuthorshipDisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrationId: string;
  trackingCode: string;
  workTitle: string;
}

export default function AuthorshipDisputeModal({
  open,
  onOpenChange,
  registrationId,
  trackingCode,
  workTitle,
}: AuthorshipDisputeModalProps) {
  const [reporterEmail, setReporterEmail] = useState('');
  const [claimReason, setClaimReason] = useState('prior_original_author');
  const [claimDescription, setClaimDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterEmail.trim() || !claimDescription.trim()) {
      toast.error('Please provide a contact email and detailed dispute description.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitAuthorshipDispute({
        registrationId,
        reporterEmail: reporterEmail.trim(),
        claimReason,
        claimDescription: claimDescription.trim(),
        evidenceUrls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
      });

      if (res.success) {
        setIsSuccess(true);
        toast.success('Authorship dispute report submitted for administrative review.');
      } else {
        toast.error(res.error || 'Failed to submit dispute.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error submitting dispute.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setIsSuccess(false);
      setClaimDescription('');
      setEvidenceUrl('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
            Report Authorship Claim
          </DialogTitle>
          <DialogDescription className="text-xs text-pretty">
            Submit a formal dispute regarding registration <strong className="text-foreground">{trackingCode}</strong> (
            <em>{workTitle}</em>). All disputes undergo platform administrative review.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
            <h3 className="font-serif font-bold text-base">Dispute Case Logged</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Your dispute has been recorded. Our integrity and governance team will examine the
              submitted evidence, notify the registrant, and determine whether suspension or revocation
              is warranted.
            </p>
            <Button onClick={handleClose} className="mt-2 text-xs">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="repEmail" className="font-medium">
                Your Contact Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="repEmail"
                type="email"
                required
                placeholder="you@domain.com"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                className="text-xs px-3"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason" className="font-medium">
                Dispute Ground <span className="text-destructive">*</span>
              </Label>
              <Select value={claimReason} onValueChange={setClaimReason}>
                <SelectTrigger id="reason" className="text-xs">
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prior_original_author">I am the prior original author / rights owner</SelectItem>
                  <SelectItem value="unattributed_plagiarism">Substantial unattributed plagiarism from third-party source</SelectItem>
                  <SelectItem value="misrepresented_declaration">Misrepresented creation declaration / unauthorized derivative</SelectItem>
                  <SelectItem value="unlawful_content">Unlawful, defamatory, or infringing content</SelectItem>
                  <SelectItem value="other_integrity_breach">Other integrity policy breach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="font-medium">
                Detailed Evidence & Explanation <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="desc"
                required
                rows={4}
                placeholder="Describe why this claim is invalid and include reference dates, prior publication details, or exact matched passages..."
                value={claimDescription}
                onChange={(e) => setClaimDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evUrl" className="font-medium">
                Prior Publication / Evidence URL (Optional)
              </Label>
              <Input
                id="evUrl"
                type="url"
                placeholder="https://example.com/original-source"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="text-xs px-3"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
