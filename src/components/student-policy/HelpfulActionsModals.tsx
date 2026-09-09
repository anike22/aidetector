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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Mail,
  Copy,
  CheckCircle2,
  AlertCircle,
  Archive,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  generateStudentDeclarationDraft,
  generateInstructorQuestionDraft,
  getWritingRecordsChecklist,
  type DraftDeclarationOptions,
  type DraftInstructorQuestionOptions,
} from '@/lib/studentPolicy/draftGenerator';
import { type StructuredPolicyInterpretation } from '@/types/studentPolicy';

// ── 1. Draft Declaration Dialog ──────────────────────────────────────────────

interface DraftDeclarationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: DraftDeclarationOptions;
}

export function DraftDeclarationDialog({
  open,
  onOpenChange,
  options,
}: DraftDeclarationDialogProps) {
  const [editedDraft, setEditedDraft] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  // Initialize draft text when modal opens
  React.useEffect(() => {
    if (open && (!initialized || !editedDraft)) {
      setEditedDraft(generateStudentDeclarationDraft(options));
      setInitialized(true);
    }
    if (!open) {
      setInitialized(false);
    }
  }, [open, options]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedDraft);
    toast.success('Draft declaration copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg font-bold">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            Draft AI-Use Declaration
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            This declaration is generated solely from your stated activities and retained records. It is a draft requiring your review and verification before submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Review before submitting:</p>
              <p className="text-[11px] mt-0.5">
                Verify that this draft accurately reflects your actual workflow. AIDetector.cx never automatically sends declarations to your instructor.
              </p>
            </div>
          </div>

          <Textarea
            value={editedDraft}
            onChange={(e) => setEditedDraft(e.target.value)}
            className="font-mono text-xs leading-relaxed min-h-[260px] bg-muted/20 resize-y"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button size="sm" onClick={handleCopy} className="gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Copy Declaration Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 2. Draft Instructor Question Dialog ──────────────────────────────────────

interface DraftInstructorQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: DraftInstructorQuestionOptions;
}

export function DraftInstructorQuestionDialog({
  open,
  onOpenChange,
  options,
}: DraftInstructorQuestionDialogProps) {
  const [editedEmail, setEditedEmail] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  React.useEffect(() => {
    if (open && (!initialized || !editedEmail)) {
      setEditedEmail(generateInstructorQuestionDraft(options));
      setInitialized(true);
    }
    if (!open) {
      setInitialized(false);
    }
  }, [open, options]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedEmail);
    toast.success('Inquiry draft copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg font-bold">
            <Mail className="w-5 h-5 text-primary shrink-0" />
            Draft Question for Instructor
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            A polite, constructive inquiry asking your instructor or teaching assistant for clarification on syllabus AI guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-foreground flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px]">
              Asking for clarification in advance demonstrates academic integrity. You can customize the drafted email below before sending it from your school email.
            </p>
          </div>

          <Textarea
            value={editedEmail}
            onChange={(e) => setEditedEmail(e.target.value)}
            className="font-sans text-xs leading-relaxed min-h-[240px] bg-muted/20 resize-y"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button size="sm" onClick={handleCopy} className="gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Copy Inquiry Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 3. Writing Records Checklist Dialog ──────────────────────────────────────

interface RetentionRecordsChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interpretation?: StructuredPolicyInterpretation | null;
}

export function RetentionRecordsChecklistDialog({
  open,
  onOpenChange,
  interpretation,
}: RetentionRecordsChecklistDialogProps) {
  const items = getWritingRecordsChecklist(interpretation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg font-bold">
            <Archive className="w-5 h-5 text-primary shrink-0" />
            Writing Records to Retain
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Protecting your authentic authorship through timestamped drafting evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border border-border/70 bg-card/60 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  {item.title}
                </span>
                <Badge variant="outline" className="text-[10px] font-semibold shrink-0">
                  {item.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 4. Supporting Policy Excerpts Dialog ──────────────────────────────────────

interface PolicyExcerptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interpretation?: StructuredPolicyInterpretation | null;
}

export function PolicyExcerptsDialog({
  open,
  onOpenChange,
  interpretation,
}: PolicyExcerptsDialogProps) {
  const excerpts =
    interpretation?.supportingExcerpts && interpretation.supportingExcerpts.length > 0
      ? interpretation.supportingExcerpts
      : interpretation?.excerpts?.map((e) => e.text) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg font-bold">
            <BookOpen className="w-5 h-5 text-primary shrink-0" />
            Supporting Policy Excerpts
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Exact text quotes parsed from the supplied syllabus or retrieved policy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {excerpts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              No specific policy quotes were extracted.
            </p>
          ) : (
            excerpts.map((text: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                  <span>Quote #{idx + 1}</span>
                </div>
                <blockquote className="text-xs text-foreground italic border-l-2 border-primary/50 pl-2.5 my-1">
                  "{text}"
                </blockquote>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
