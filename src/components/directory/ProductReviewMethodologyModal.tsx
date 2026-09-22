import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Building2,
  FileCheck,
  Scale,
  Sparkles,
} from 'lucide-react';

interface ProductReviewMethodologyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductReviewMethodologyModal({
  open,
  onOpenChange,
}: ProductReviewMethodologyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto bg-card border-border">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                How AIDetector.cx Reviews Work
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Our evidence-first review methodology, anti-abuse safeguards, and transparency standards.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4 text-xs leading-relaxed text-muted-foreground">
          {/* Section 1: First-Party Review Integrity */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-primary" />
              1. Authentic First-Party Ratings Only
            </h4>
            <p>
              AIDetector.cx displays <strong>only direct, verified user reviews submitted to our platform</strong>. We never scrape, import, synthesize, or license aggregate star ratings from third-party review syndicators. If a product has no user submissions, we display &quot;No user reviews yet&quot; instead of placeholder ratings.
            </p>
          </div>

          {/* Section 2: Multi-Dimension Evaluation */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              2. Independent Overall & Dimension Ratings
            </h4>
            <p>
              Users submit an <strong>independent Overall Rating (1–5 stars)</strong> and optional granular dimensions (Ease of Use, Feature Quality, Value for Money, Reliability). We never secretly calculate or inflate the overall score from unweighted criteria; the user retains direct ownership of their verdict.
            </p>
          </div>

          {/* Section 3: Evidence Upload & Verification */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              3. Evidence-First Verification
            </h4>
            <p>
              Reviewers may attach non-sensitive proof of usage (such as billing receipts with financial details blacked out, benchmark outputs, or workspace interface screenshots).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="font-bold text-foreground block">Evidence Status Badges:</span>
                <ul className="space-y-1">
                  <li>• <Badge variant="outline" className="text-[10px] py-0">Evidence Submitted</Badge>: Proof attached and awaiting audit.</li>
                  <li>• <Badge variant="outline" className="text-[10px] py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">Evidence Reviewed</Badge>: Human moderator confirmed authentic product utilization.</li>
                </ul>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border space-y-1">
                <span className="font-bold text-foreground block">Privacy & Security:</span>
                <p>Evidence attachments are <strong>private to human moderators by default</strong> to protect user workflows and prevent accidental leakage of sensitive tokens.</p>
              </div>
            </div>
          </div>

          {/* Section 4: Conflict of Interest & Commercial Incentives */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              4. Mandatory Conflict of Interest Disclosures
            </h4>
            <p>
              Reviewers are required to disclose any professional or commercial affiliations, including current/former employment, affiliate arrangements, or subsidized enterprise access. Reviews with declared affiliations are prominently tagged with a conflict notice so readers can contextualize the perspective.
            </p>
          </div>

          {/* Section 5: Vendor Response Rights */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-primary" />
              5. Verified Vendor Responses
            </h4>
            <p>
              Verified representatives of audited software vendors may publish official responses directly below community reviews to clarify technical constraints, roadmap timelines, or bug resolution. Vendors can <strong>never alter, suppress, or delete user reviews</strong>.
            </p>
          </div>

          {/* Section 6: Moderation & Anti-Abuse Safeguards */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" />
              6. Anti-Abuse & Moderation Policy
            </h4>
            <p>
              We enforce a strict <strong>one active review per user per product</strong> rule. Submissions are screened against duplicate text, promotional spam, and automated bots. Community members can report suspicious reviews for expedited human audit.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border">
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs bg-primary text-primary-foreground font-semibold"
          >
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
