import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown, HelpCircle, Languages, Bot, UserCheck, AlertTriangle } from 'lucide-react';
import { submitFeedback, type FeedbackType, type UserLabel } from '@/lib/detection/storage';

interface Props {
  resultId: string;
}

const FEEDBACK_OPTIONS: { type: FeedbackType; label: string; icon: React.ElementType }[] = [
  { type: 'correct', label: 'Correct', icon: ThumbsUp },
  { type: 'incorrect', label: 'Incorrect', icon: ThumbsDown },
  { type: 'unsure', label: 'Unsure', icon: HelpCircle },
  { type: 'wrong_language', label: 'Wrong language', icon: Languages },
];

const LABEL_OPTIONS: { value: UserLabel; label: string; icon: React.ElementType }[] = [
  { value: 'human', label: 'This is human-written', icon: UserCheck },
  { value: 'ai', label: 'This is AI-generated', icon: Bot },
  { value: 'mixed', label: 'This is mixed', icon: AlertTriangle },
  { value: 'unsure', label: 'Unsure', icon: HelpCircle },
];

export default function DetectorFeedback({ resultId }: Props) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [userLabel, setUserLabel] = useState<UserLabel | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackType) {
      toast.error('Please select a feedback type');
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({
        resultId,
        feedbackType,
        userLabel: userLabel || undefined,
        comment,
      });
      setSubmitted(true);
      toast.success('Feedback submitted. Thank you for helping improve detection.');
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success flex items-center gap-2">
        <ThumbsUp className="w-4 h-4" /> Feedback received. We use reviewed datasets for continuous evaluation.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-premium">
      <h3 className="text-sm font-bold text-foreground mb-3">Was this result helpful?</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {FEEDBACK_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <Button
              key={opt.type}
              type="button"
              variant={feedbackType === opt.type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackType(opt.type)}
              className="rounded-full text-xs font-semibold"
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" /> {opt.label}
            </Button>
          );
        })}
      </div>

      {feedbackType && (
        <div className="space-y-4 animate-slide-in">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">What do you think the correct label is?</label>
            <div className="flex flex-wrap gap-2">
              {LABEL_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={userLabel === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUserLabel(opt.value)}
                    className="rounded-full text-xs font-semibold"
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5" /> {opt.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Textarea
            placeholder="Optional comment (what looked wrong, model clues, etc.)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
          />

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">Your feedback is stored securely and reviewed before being used for training.</p>
            <Button onClick={handleSubmit} disabled={submitting} size="sm" className="font-bold rounded-lg">
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
