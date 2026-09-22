import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flag, AlertCircle, CheckCircle2, ShieldCheck, Link2 } from 'lucide-react';
import type { DirectoryProduct, ProductCorrectionField, ProductCorrectionReport } from '@/types/directory';
import { toast } from 'sonner';

interface ProductReportOutdatedModalProps {
  product: DirectoryProduct;
  trigger?: React.ReactNode;
}

const FIELD_OPTIONS: { value: ProductCorrectionField; label: string }[] = [
  { value: 'pricing_model', label: 'Pricing Model / Tiers' },
  { value: 'pricing_summary', label: 'Pricing Summary / Monthly Cost' },
  { value: 'free_plan_or_trial', label: 'Free Tier / Free Trial Policy' },
  { value: 'features_or_matrix', label: 'Feature Availability / Matrix' },
  { value: 'evolution_timeline', label: 'Evolution Timeline / Version History' },
  { value: 'platforms_or_deployment', label: 'Platform Support / Self-Hosting' },
  { value: 'use_cases', label: 'Target Audience & Use Cases' },
  { value: 'limitations', label: 'Limitations / Operational Caveats' },
  { value: 'sources_and_citations', label: 'Official Sources / Broken Link' },
  { value: 'company', label: 'Company / Creator Name' },
  { value: 'description_or_summary', label: 'Description / Overview' },
  { value: 'other', label: 'Other Factual Inaccuracy' },
];

export function ProductReportOutdatedModal({ product, trigger }: ProductReportOutdatedModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<ProductCorrectionField>('pricing_summary');
  const [proposedCorrection, setProposedCorrection] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to dynamically get current factual value
  const getCurrentFieldValue = (field: ProductCorrectionField): string => {
    switch (field) {
      case 'product_name':
        return product.name;
      case 'company':
        return product.company;
      case 'description_or_summary':
        return product.summary || product.description;
      case 'pricing_model':
        return product.pricingModel;
      case 'pricing_summary':
        return product.pricingSummary;
      case 'free_plan_or_trial':
        return `Free Plan: ${product.hasFreePlan ? 'Yes' : 'No'}, Free Trial: ${product.hasFreeTrial ? 'Yes' : 'No'}`;
      case 'platforms_or_deployment':
        return product.platforms.join(', ');
      case 'features_or_matrix':
        return product.features.slice(0, 3).join('; ');
      case 'evolution_timeline':
        return product.evolutionMilestones?.[0]?.title || 'Latest listed milestone';
      case 'sources_and_citations':
        return product.sourceReferences?.[0]?.url || product.websiteUrl;
      default:
        return 'Current catalog data';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedCorrection.trim()) {
      toast.error('Please provide your proposed correction or updated factual detail.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedOption = FIELD_OPTIONS.find(o => o.value === selectedField);
      const newReport: ProductCorrectionReport = {
        id: `cor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        productId: product.id,
        field: selectedField,
        fieldLabel: selectedOption?.label || selectedField,
        currentValue: getCurrentFieldValue(selectedField),
        proposedCorrection: proposedCorrection.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        submitterEmail: submitterEmail.trim() || undefined,
        status: 'pending',
        submittedAt: new Date().toISOString().split('T')[0],
      };

      const existingReports: ProductCorrectionReport[] = JSON.parse(
        localStorage.getItem('aidetector_directory_corrections') || '[]'
      );
      const updated = [newReport, ...existingReports];
      localStorage.setItem('aidetector_directory_corrections', JSON.stringify(updated));

      toast.success(
        'Thank you! Your correction report has been queued for editorial fact-checking and verification.',
        { duration: 4000 }
      );

      // Reset form & close
      setProposedCorrection('');
      setSourceUrl('');
      setNotes('');
      setSubmitterEmail('');
      setIsOpen(false);
    } catch {
      toast.error('Could not submit correction report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Flag className="w-3.5 h-3.5 text-amber-500" />
            <span>Report Outdated Information</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Report Outdated Information: {product.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Help maintain AIDetector.cx factual integrity. Our editors verify all submissions with official sources.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          {/* Field Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              Which information is outdated or inaccurate? <span className="text-destructive">*</span>
            </label>
            <Select
              value={selectedField}
              onValueChange={(val: ProductCorrectionField) => setSelectedField(val)}
            >
              <SelectTrigger className="h-9 text-xs bg-card">
                <SelectValue placeholder="Select field to correct" />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Stored Value Display */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Currently Listed On AIDetector.cx:
            </div>
            <p className="text-xs text-foreground font-medium break-words">
              {getCurrentFieldValue(selectedField)}
            </p>
          </div>

          {/* Proposed Correction */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground block">
              Proposed Correction / Updated Value <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={proposedCorrection}
              onChange={e => setProposedCorrection(e.target.value)}
              placeholder="e.g., The Plus subscription was updated to include 200k context tokens, and Team tier pricing changed to $25/user/mo..."
              rows={3}
              className="text-xs bg-card resize-none min-h-[75px]"
              required
            />
          </div>

          {/* Official Source Reference Link */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground flex items-center justify-between">
              <span>Official Verification URL (Recommended)</span>
              <span className="text-[10px] text-muted-foreground font-normal">Pricing doc, changelog, or release note</span>
            </label>
            <div className="relative">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="url"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://openai.com/pricing or docs URL..."
                className="pl-8 h-9 text-xs bg-card"
              />
            </div>
          </div>

          {/* Submitter Email (Optional) */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground flex items-center justify-between">
              <span>Your Email (Optional)</span>
              <span className="text-[10px] text-muted-foreground font-normal">For notification once verified</span>
            </label>
            <Input
              type="email"
              value={submitterEmail}
              onChange={e => setSubmitterEmail(e.target.value)}
              placeholder="editor@company.com"
              className="h-9 text-xs bg-card"
            />
          </div>

          {/* Editorial Guidelines Notice */}
          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              All submissions are checked against official documentation by our editorial staff before publishing.
            </span>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !proposedCorrection.trim()}
              className="text-xs h-8 bg-primary text-primary-foreground gap-1.5"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Correction for Verification'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
