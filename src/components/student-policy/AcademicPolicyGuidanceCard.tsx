import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield, BookOpen, AlertTriangle, CheckCircle2, FileText,
  HelpCircle, Scale, Eye, Hash, Info, ExternalLink,
  Lock, ArrowRight, Sparkles, Check, AlertOctagon,
  Copy, Mail, Archive, Download, Edit3, CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PolicyGuidanceSynthesis } from '@/lib/studentPolicy/policyAdapter';
import type {
  StructuredPolicyInterpretation,
  StudentAIUsageDeclaration,
  SynthesizedAcademicGuidance,
} from '@/types/studentPolicy';
import {
  DraftDeclarationDialog,
  DraftInstructorQuestionDialog,
  RetentionRecordsChecklistDialog,
  PolicyExcerptsDialog,
} from './HelpfulActionsModals';
import {
  generatePolicySummaryText,
  buildAcademicPolicyExportAttachment,
} from '@/lib/studentPolicy/draftGenerator';

interface AcademicPolicyGuidanceCardProps {
  guidance: PolicyGuidanceSynthesis;
  interpretation: StructuredPolicyInterpretation | null;
  declaration?: StudentAIUsageDeclaration | null;
  onEditRules?: () => void;
}

export const AcademicPolicyGuidanceCard: React.FC<AcademicPolicyGuidanceCardProps> = ({
  guidance,
  interpretation,
  declaration,
  onEditRules,
}) => {
  const [declarationModalOpen, setDeclarationModalOpen] = useState(false);
  const [instructorModalOpen, setInstructorModalOpen] = useState(false);
  const [retentionModalOpen, setRetentionModalOpen] = useState(false);
  const [excerptsModalOpen, setExcerptsModalOpen] = useState(false);

  if (!interpretation || interpretation.status === 'not-specified') {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 p-6 text-center space-y-3 bg-muted/20">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">
            Add your assignment’s AI rules for personalized guidance.
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto text-pretty">
            AI detection is an estimate. Assignment compliance depends on the applicable rules and how you used AI. Enter your syllabus instructions or course policy URL above to evaluate permissions.
          </p>
        </div>
        {onEditRules && (
          <Button variant="outline" size="sm" onClick={onEditRules} className="text-xs gap-1.5 h-8">
            <Edit3 className="w-3.5 h-3.5" /> Supply Assignment Rules
          </Button>
        )}
      </div>
    );
  }

  const handleCopySummary = () => {
    const summary = generatePolicySummaryText({
      detectorAvailable: true,
      balancedAiScore: guidance.balancedAiScore,
      balancedVerdict: guidance.balancedVerdict,
      aggressiveAiScore: guidance.aggressiveAiScore,
      aggressiveVerdict: guidance.aggressiveVerdict,
      interpretation,
      policyStatus: guidance.policyStatus as any,
      policyStatusSummary: guidance.policyStatusSummary,
      thresholdComparison: {
        isComparable: guidance.thresholdComparison.isComparable,
        thresholdDescription: guidance.thresholdComparison.thresholdDescription,
        comparisonStatusText:
          guidance.thresholdComparison.comparisonStatusText ||
          guidance.thresholdComparison.thresholdGuidance ||
          '',
        balancedComparisonNote: guidance.thresholdComparison.balancedComparisonNote,
        aggressiveComparisonNote: guidance.thresholdComparison.aggressiveComparisonNote,
        disclaimer: guidance.thresholdComparison.disclaimer,
      },
    });
    navigator.clipboard.writeText(summary);
    toast.success('Academic Policy Summary copied to clipboard');
  };

  const handleDownloadAttachment = () => {
    const attachment = buildAcademicPolicyExportAttachment({
      detectorAvailable: true,
      balancedAiScore: guidance.balancedAiScore,
      balancedVerdict: guidance.balancedVerdict,
      aggressiveAiScore: guidance.aggressiveAiScore,
      aggressiveVerdict: guidance.aggressiveVerdict,
      interpretation,
      policyStatus: guidance.policyStatus as any,
      policyStatusSummary: guidance.policyStatusSummary,
      thresholdComparison: {
        isComparable: guidance.thresholdComparison.isComparable,
        thresholdDescription: guidance.thresholdComparison.thresholdDescription,
        comparisonStatusText:
          guidance.thresholdComparison.comparisonStatusText ||
          guidance.thresholdComparison.thresholdGuidance ||
          '',
        balancedComparisonNote: guidance.thresholdComparison.balancedComparisonNote,
        aggressiveComparisonNote: guidance.thresholdComparison.aggressiveComparisonNote,
        disclaimer: guidance.thresholdComparison.disclaimer,
      },
    });
    const blob = new Blob([JSON.stringify(attachment, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic-policy-guidance-${interpretation.contentHash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Academic Policy Guidance attachment downloaded');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'prohibited':
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 font-semibold px-2.5 py-1 text-xs">
            <AlertOctagon className="w-3.5 h-3.5 mr-1" />
            AI Assistance Prohibited
          </Badge>
        );
      case 'restricted':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold px-2.5 py-1 text-xs">
            <Scale className="w-3.5 h-3.5 mr-1" />
            Conditional / Restricted Use
          </Badge>
        );
      case 'permitted':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold px-2.5 py-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Permitted with Integrity Rules
          </Badge>
        );
      case 'required':
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-semibold px-2.5 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            AI Usage Assigned / Required
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-semibold px-2.5 py-1 text-xs">
            <HelpCircle className="w-3.5 h-3.5 mr-1" />
            Unclear / Discretionary
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Conflict Alert Banner if Contradictory Instructions Exist */}
      {guidance.hasConflict && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-wide">Potential Instruction Conflict</h4>
            <p className="leading-relaxed font-medium">
              {guidance.conflictNotice ||
                'These instructions appear to conflict or may apply to different assessments. Ask your instructor which rule applies.'}
            </p>
          </div>
        </div>
      )}

      {/* 2. Primary Policy Guidance Card */}
      <Card className="border border-border/80 shadow-premium bg-card rounded-2xl overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/20 border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-bold text-foreground truncate">
                  Academic Policy Guidance
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground truncate">
                  Source: {guidance.policySourceIdentifier} • Hash: <code className="font-mono text-[10px]">{guidance.contentHash}</code>
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(guidance.policyStatus)}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Policy Overview Summary */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 text-foreground/90 leading-relaxed font-medium">
            <span className="font-semibold text-foreground">Rule Summary: </span>
            {guidance.policyStatusSummary}
          </div>

          {/* Scope badges if present */}
          {(interpretation.institutionScope || interpretation.courseScope || interpretation.assignmentScope) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              {interpretation.institutionScope && (
                <div className="p-2 rounded-lg border border-border/60 bg-muted/20">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Institution</span>
                  <span className="font-semibold text-foreground truncate block">{interpretation.institutionScope}</span>
                </div>
              )}
              {interpretation.courseScope && (
                <div className="p-2 rounded-lg border border-border/60 bg-muted/20">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Course / Module</span>
                  <span className="font-semibold text-foreground truncate block">{interpretation.courseScope}</span>
                </div>
              )}
              {interpretation.assignmentScope && (
                <div className="p-2 rounded-lg border border-border/60 bg-muted/20">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Assignment</span>
                  <span className="font-semibold text-foreground truncate block">{interpretation.assignmentScope}</span>
                </div>
              )}
            </div>
          )}

          {/* Permitted vs Restricted Assistance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Permitted Assistance */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <Check className="w-4 h-4 shrink-0" />
                Permitted Assistance
              </div>
              {interpretation.allowedActivities.length > 0 ? (
                <ul className="space-y-1.5 text-[11px] text-foreground/90">
                  {interpretation.allowedActivities.map((item) => (
                    <li key={item.id} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                      <div>
                        <strong className="font-semibold text-foreground">{item.activity}:</strong>{' '}
                        {item.details}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  No specific activities were explicitly listed as permitted.
                </p>
              )}
            </div>

            {/* Restricted Assistance */}
            <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2">
              <div className="flex items-center gap-1.5 text-destructive font-bold text-xs">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                Restricted / Prohibited Assistance
              </div>
              {interpretation.prohibitedActivities.length > 0 ? (
                <ul className="space-y-1.5 text-[11px] text-foreground/90">
                  {interpretation.prohibitedActivities.map((item) => (
                    <li key={item.id} className="flex items-start gap-1.5">
                      <span className="text-destructive font-bold">•</span>
                      <div>
                        <strong className="font-semibold text-foreground">{item.activity}:</strong>{' '}
                        {item.details}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">
                  No specific activities were explicitly marked as prohibited in this excerpt.
                </p>
              )}
            </div>
          </div>

          {/* Numerical Threshold Assessment */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-primary" />
                Accepted Detection Percentage / Threshold
              </span>
              <Badge variant="outline" className="text-[10px] border-border font-medium">
                Strict Semantics
              </Badge>
            </div>

            <p className="text-xs font-semibold text-foreground">
              {guidance.thresholdComparison.thresholdDescription}
            </p>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {guidance.thresholdComparison.comparisonStatusText}
            </p>

            {/* Show factual notes if strictly comparable */}
            {guidance.thresholdComparison.isComparable && (
              <div className="space-y-1 pt-1 border-t border-border/40 text-[11px]">
                {guidance.thresholdComparison.balancedComparisonNote && (
                  <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    {guidance.thresholdComparison.balancedComparisonNote}
                  </div>
                )}
                {guidance.thresholdComparison.aggressiveComparisonNote && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-muted-foreground shrink-0" />
                    {guidance.thresholdComparison.aggressiveComparisonNote}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground/90 italic flex items-start gap-1">
              <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
              <span>{guidance.thresholdComparison.disclaimer}</span>
            </div>
          </div>

          {/* Disclosure & Retention */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Disclosure
                </span>
                <Badge variant={interpretation.disclosureRequirement.required ? 'default' : 'secondary'} className="text-[10px] h-4">
                  {interpretation.disclosureRequirement.required ? 'Required for Permitted Use' : 'Not Specified'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {interpretation.disclosureRequirement.details}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/70 bg-card space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  Writing Records Retention
                </span>
                <Badge variant={interpretation.recordRetentionRequirement.required ? 'default' : 'secondary'} className="text-[10px] h-4">
                  {interpretation.recordRetentionRequirement.required ? 'Mandated' : 'Recommended'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {interpretation.recordRetentionRequirement.details}
              </p>
            </div>
          </div>

          {/* Next Steps & Practical Guidance */}
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
            <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Recommended Next Step
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Confirm that your actual use matches these instructions and complete the required declaration. Keep your prompt logs and revision history intact.
            </p>
          </div>

          {/* Concise Disclaimer & Zero False Approvals Rule */}
          <div className="text-[11px] text-muted-foreground italic border-t border-border/50 pt-3">
            “AI detection is an estimate. Assignment compliance depends on the applicable rules and how you used AI.”
          </div>

          {/* Section 11: Helpful Actions Toolbar */}
          <div className="pt-3 border-t border-border/60">
            <span className="text-[11px] font-bold text-foreground uppercase tracking-wide block mb-2">
              Helpful Actions & Student Tools
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {onEditRules && (
                <Button variant="outline" size="sm" onClick={onEditRules} className="text-xs h-8 justify-start gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground" /> Edit Rules
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExcerptsModalOpen(true)}
                className="text-xs h-8 justify-start gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" /> View Excerpts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
                className="text-xs h-8 justify-start gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" /> Copy Summary
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInstructorModalOpen(true)}
                className="text-xs h-8 justify-start gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-primary" /> Question for Instructor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeclarationModalOpen(true)}
                className="text-xs h-8 justify-start gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-primary" /> Draft Declaration
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRetentionModalOpen(true)}
                className="text-xs h-8 justify-start gap-1.5"
              >
                <Archive className="w-3.5 h-3.5 text-muted-foreground" /> Records Checklist
              </Button>
            </div>

            <div className="mt-2.5 flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadAttachment}
                className="text-[11px] h-7 text-primary hover:text-primary/90 gap-1"
              >
                <Download className="w-3 h-3" /> Export Policy Guidance Attachment (.json)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Helpful Actions Dialogs */}
      <DraftDeclarationDialog
        open={declarationModalOpen}
        onOpenChange={setDeclarationModalOpen}
        options={{
          institutionName: interpretation.institutionScope,
          courseName: interpretation.courseScope,
          assignmentTitle: interpretation.assignmentScope,
          declaration: declaration || { declaredActivities: [] },
          interpretation,
        }}
      />

      <DraftInstructorQuestionDialog
        open={instructorModalOpen}
        onOpenChange={setInstructorModalOpen}
        options={{
          institutionName: interpretation.institutionScope,
          courseName: interpretation.courseScope,
          assignmentTitle: interpretation.assignmentScope,
          declaredActivities: declaration?.declaredActivities || [],
          interpretation,
        }}
      />

      <RetentionRecordsChecklistDialog
        open={retentionModalOpen}
        onOpenChange={setRetentionModalOpen}
        interpretation={interpretation}
      />

      <PolicyExcerptsDialog
        open={excerptsModalOpen}
        onOpenChange={setExcerptsModalOpen}
        interpretation={interpretation}
      />
    </div>
  );
};
