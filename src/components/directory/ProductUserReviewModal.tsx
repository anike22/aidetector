import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FileCheck,
  Sparkles,
  Upload,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  Scale,
  Info,
  HelpCircle,
} from 'lucide-react';
import type {
  ProductUserReview,
  EvidenceAttachment,
  ConflictDisclosure,
  ConflictRelationshipType,
} from '@/types/directory';
import { toast } from 'sonner';

interface ProductUserReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSaveReview: (review: ProductUserReview) => void;
  editingReview?: ProductUserReview | null;
}

const STEPS = [
  { id: 1, title: 'Rating', subtitle: 'Score & Dimensions' },
  { id: 2, title: 'Experience', subtitle: 'Title & Detailed Review' },
  { id: 3, title: 'Pros & Cons', subtitle: 'Specific Strengths & Caveats' },
  { id: 4, title: 'Usage Context', subtitle: 'Role, Plan & Disclosures' },
  { id: 5, title: 'Evidence', subtitle: 'Optional Verification' },
  { id: 6, title: 'Review & Submit', subtitle: 'Guidelines & Confirmation' },
];

export function ProductUserReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  onSaveReview,
  editingReview,
}: ProductUserReviewModalProps) {
  const draftKey = `aidetector_review_draft_${productId}`;

  const [currentStep, setCurrentStep] = useState(1);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  // Step 1: Ratings
  const [rating, setRating] = useState<number>(5);
  const [outputQualityRating, setOutputQualityRating] = useState<number>(5);
  const [speedRating, setSpeedRating] = useState<number>(5);
  const [valueRating, setValueRating] = useState<number>(5);
  const [easeRating, setEaseRating] = useState<number>(5);

  // Step 2: Experience
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');

  // Step 3: Pros & Cons
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);

  // Step 4: Context & Disclosures
  const [authorName, setAuthorName] = useState('');
  const [roleOrProfession, setRoleOrProfession] = useState('');
  const [companyOrSchool, setCompanyOrSchool] = useState('');
  const [primaryUseCase, setPrimaryUseCase] = useState('Software Engineering & Coding');
  const [planUsed, setPlanUsed] = useState('Free Tier');
  const [usageDuration, setUsageDuration] = useState('3-6 months');
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictType, setConflictType] = useState<ConflictRelationshipType>('none');
  const [conflictDetails, setConflictDetails] = useState('');

  // Step 5: Optional Evidence
  const [evidenceFile, setEvidenceFile] = useState<{
    fileName: string;
    fileType: string;
    fileSize: number;
    dataUrl: string;
  } | null>(null);
  const [evidenceType, setEvidenceType] = useState<'screenshot' | 'billing' | 'interface' | 'error' | 'benchmark'>('screenshot');
  const [evidencePrivacy, setEvidencePrivacy] = useState<'moderators_only' | 'public_redacted'>('moderators_only');
  const [evidenceWarningAcknowledged, setEvidenceWarningAcknowledged] = useState(false);

  // Step 6: Guidelines
  const [guidelinesAgreed, setGuidelinesAgreed] = useState(false);

  // Initialize or restore draft / editing review
  useEffect(() => {
    if (!isOpen) return;

    if (editingReview) {
      setCurrentStep(1);
      setRating(editingReview.rating);
      if (editingReview.dimensionalRatings) {
        setOutputQualityRating(editingReview.dimensionalRatings.featureQuality || 5);
        setSpeedRating(editingReview.dimensionalRatings.reliability || 5);
        setValueRating(editingReview.dimensionalRatings.valueForMoney || 5);
        setEaseRating(editingReview.dimensionalRatings.easeOfUse || 5);
      }
      setTitle(editingReview.title);
      setReviewText(editingReview.reviewText);
      setPros(editingReview.pros && editingReview.pros.length > 0 ? editingReview.pros : ['']);
      setCons(editingReview.cons && editingReview.cons.length > 0 ? editingReview.cons : ['']);
      setAuthorName(editingReview.authorName);
      setRoleOrProfession(editingReview.roleOrProfession);
      setCompanyOrSchool(editingReview.companyOrSchool || '');
      setPrimaryUseCase(editingReview.primaryUseCase || 'Software Engineering & Coding');
      setPlanUsed(editingReview.planUsed || 'Free Tier');
      setUsageDuration(editingReview.usageDuration || '3-6 months');
      if (editingReview.conflictDisclosure) {
        setHasConflict(editingReview.conflictDisclosure.hasConflict);
        setConflictType(editingReview.conflictDisclosure.relationshipType);
        setConflictDetails(editingReview.conflictDisclosure.details || '');
      }
      if (editingReview.evidenceAttachment) {
        setEvidenceFile({
          fileName: editingReview.evidenceAttachment.fileName,
          fileType: editingReview.evidenceAttachment.fileType,
          fileSize: editingReview.evidenceAttachment.fileSize,
          dataUrl: editingReview.evidenceAttachment.dataUrl || '',
        });
        setEvidenceType(editingReview.evidenceAttachment.evidenceType);
        setEvidencePrivacy(editingReview.evidenceAttachment.privacy);
        setEvidenceWarningAcknowledged(true);
      }
      setGuidelinesAgreed(true);
      setHasDraftNotice(false);
    } else {
      // Check for saved draft
      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.title || parsed.reviewText || parsed.authorName) {
            setHasDraftNotice(true);
          }
        }
      } catch {
        // Ignore
      }
    }
  }, [isOpen, editingReview, draftKey]);

  // Autosave draft on field changes (when not editing an existing review)
  useEffect(() => {
    if (!isOpen || editingReview) return;
    const draftPayload = {
      rating,
      outputQualityRating,
      speedRating,
      valueRating,
      easeRating,
      title,
      reviewText,
      pros,
      cons,
      authorName,
      roleOrProfession,
      companyOrSchool,
      primaryUseCase,
      planUsed,
      usageDuration,
      hasConflict,
      conflictType,
      conflictDetails,
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    } catch {
      // Ignore quota errors
    }
  }, [
    isOpen,
    editingReview,
    draftKey,
    rating,
    outputQualityRating,
    speedRating,
    valueRating,
    easeRating,
    title,
    reviewText,
    pros,
    cons,
    authorName,
    roleOrProfession,
    companyOrSchool,
    primaryUseCase,
    planUsed,
    usageDuration,
    hasConflict,
    conflictType,
    conflictDetails,
  ]);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.rating) setRating(p.rating);
        if (p.outputQualityRating) setOutputQualityRating(p.outputQualityRating);
        if (p.speedRating) setSpeedRating(p.speedRating);
        if (p.valueRating) setValueRating(p.valueRating);
        if (p.easeRating) setEaseRating(p.easeRating);
        if (p.title) setTitle(p.title);
        if (p.reviewText) setReviewText(p.reviewText);
        if (p.pros) setPros(p.pros);
        if (p.cons) setCons(p.cons);
        if (p.authorName) setAuthorName(p.authorName);
        if (p.roleOrProfession) setRoleOrProfession(p.roleOrProfession);
        if (p.companyOrSchool) setCompanyOrSchool(p.companyOrSchool);
        if (p.primaryUseCase) setPrimaryUseCase(p.primaryUseCase);
        if (p.planUsed) setPlanUsed(p.planUsed);
        if (p.usageDuration) setUsageDuration(p.usageDuration);
        if (p.hasConflict !== undefined) setHasConflict(p.hasConflict);
        if (p.conflictType) setConflictType(p.conflictType);
        if (p.conflictDetails) setConflictDetails(p.conflictDetails);
        toast.success('Restored saved draft!');
      }
    } catch {
      toast.error('Failed to restore draft.');
    }
    setHasDraftNotice(false);
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // Ignore
    }
    setHasDraftNotice(false);
    toast.info('Draft discarded.');
  };

  // Step Validation before progressing
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (rating < 1 || rating > 5) {
        toast.error('Please select an overall rating from 1 to 5 stars.');
        return;
      }
    } else if (currentStep === 2) {
      if (!title.trim() || title.length < 5) {
        toast.error('Please enter a descriptive review title (at least 5 characters).');
        return;
      }
      if (!reviewText.trim() || reviewText.length < 30) {
        toast.error('Please write a detailed review (at least 30 characters).');
        return;
      }
    } else if (currentStep === 4) {
      if (!authorName.trim()) {
        toast.error('Please provide your name or professional pseudonym.');
        return;
      }
      if (!roleOrProfession.trim()) {
        toast.error('Please state your role or field of work.');
        return;
      }
    } else if (currentStep === 5) {
      if (evidenceFile && !evidenceWarningAcknowledged) {
        toast.error('Please confirm that your evidence contains no confidential or PII data.');
        return;
      }
    }

    setCurrentStep(prev => Math.min(STEPS.length, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File exceeds maximum 5MB size limit.');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PNG, JPG, WEBP images and PDF documents are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEvidenceFile({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        dataUrl: reader.result as string,
      });
      toast.success(`Attached evidence: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleFinalSubmit = () => {
    if (!guidelinesAgreed) {
      toast.error('You must accept the review guidelines before submitting.');
      return;
    }

    const cleanPros = pros.map(p => p.trim()).filter(Boolean);
    const cleanCons = cons.map(c => c.trim()).filter(Boolean);

    let evidenceAttachment: EvidenceAttachment | undefined = undefined;
    if (evidenceFile) {
      evidenceAttachment = {
        id: `ev_${Date.now()}`,
        fileName: evidenceFile.fileName,
        fileType: evidenceFile.fileType,
        fileSize: evidenceFile.fileSize,
        dataUrl: evidenceFile.dataUrl,
        uploadedAt: new Date().toISOString().split('T')[0],
        evidenceType,
        privacy: evidencePrivacy,
        verificationStatus: 'submitted',
      };
    }

    const conflictDisclosure: ConflictDisclosure = {
      hasConflict,
      relationshipType: hasConflict ? conflictType : 'none',
      details: hasConflict ? conflictDetails : undefined,
    };

    const today = new Date().toISOString().split('T')[0];

    const finalReview: ProductUserReview = {
      id: editingReview?.id || `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productId,
      authorName: authorName.trim(),
      roleOrProfession: roleOrProfession.trim(),
      companyOrSchool: companyOrSchool.trim() || undefined,
      rating,
      dimensionalRatings: {
        easeOfUse: easeRating,
        featureQuality: outputQualityRating,
        valueForMoney: valueRating,
        reliability: speedRating,
      },
      title: title.trim(),
      reviewText: reviewText.trim(),
      pros: cleanPros.length > 0 ? cleanPros : undefined,
      cons: cleanCons.length > 0 ? cleanCons : undefined,
      primaryUseCase,
      planUsed,
      usageDuration,
      verifiedUser: !!evidenceFile,
      evidenceAttachment,
      conflictDisclosure: hasConflict ? conflictDisclosure : undefined,
      helpfulVotes: editingReview?.helpfulVotes || 0,
      date: editingReview ? editingReview.date : today,
      lastEditedDate: editingReview ? today : undefined,
      moderationStatus: 'approved',
    };

    onSaveReview(finalReview);

    // Clean draft
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // Ignore
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {editingReview ? `Update Review for ${productName}` : `Write a Review for ${productName}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Share your genuine, unbiased experience to help the community.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Step {currentStep} of {STEPS.length}
            </Badge>
          </div>
        </DialogHeader>

        {/* Saved Draft Notice */}
        {hasDraftNotice && !editingReview && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>You have a saved draft from a previous session.</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button size="sm" onClick={restoreDraft} className="h-7 text-xs bg-primary text-primary-foreground">
                Resume Draft
              </Button>
              <Button size="sm" variant="ghost" onClick={discardDraft} className="h-7 text-xs text-muted-foreground">
                Discard
              </Button>
            </div>
          </div>
        )}

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-6 gap-1.5 py-2 border-b border-border">
          {STEPS.map(step => (
            <button
              key={step.id}
              type="button"
              onClick={() => setCurrentStep(step.id)}
              className={`text-left p-1.5 rounded-lg transition-all ${
                currentStep === step.id
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : currentStep > step.id
                  ? 'bg-muted text-foreground hover:bg-muted/80'
                  : 'text-muted-foreground hover:bg-muted/30'
              }`}
            >
              <div className="text-[10px] font-mono leading-none">0{step.id}</div>
              <div className="text-[11px] truncate mt-0.5 hidden sm:block">{step.title}</div>
            </button>
          ))}
        </div>

        {/* STEP 1: Rating */}
        {currentStep === 1 && (
          <div className="space-y-5 pt-2">
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <label className="font-bold text-xs text-foreground block">
                Overall Rating (1 - 5 Stars) *
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-muted-foreground/30 hover:text-amber-500/50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">
                  {rating === 5 ? '5.0 - Excellent' : rating === 4 ? '4.0 - Very Good' : rating === 3 ? '3.0 - Average' : rating === 2 ? '2.0 - Below Expectations' : '1.0 - Unusable'}
                </span>
              </div>
            </div>

            {/* Sub-Dimension Ratings */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4 text-xs">
              <span className="font-bold text-foreground block">
                Sub-Dimension Ratings (Multi-Factor Assessment)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Output Quality & Accuracy</span>
                    <span className="font-bold text-foreground">{outputQualityRating}.0/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setOutputQualityRating(star)}>
                        <Star className={`w-4 h-4 ${star <= outputQualityRating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Speed & Latency Performance</span>
                    <span className="font-bold text-foreground">{speedRating}.0/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setSpeedRating(star)}>
                        <Star className={`w-4 h-4 ${star <= speedRating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Value for Money & Pricing</span>
                    <span className="font-bold text-foreground">{valueRating}.0/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setValueRating(star)}>
                        <Star className={`w-4 h-4 ${star <= valueRating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ease of Use & Integration</span>
                    <span className="font-bold text-foreground">{easeRating}.0/5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setEaseRating(star)}>
                        <Star className={`w-4 h-4 ${star <= easeRating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Experience & Prompts */}
        {currentStep === 2 && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Review Title *</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Unmatched reasoning depth for complex Python refactoring"
                className="h-8 text-xs bg-card"
              />
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                Prompt Suggestions for High-Quality Feedback:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setReviewText(prev => prev ? `${prev}\n\nWhat worked well: ` : 'What worked well: ')}
                  className="text-left p-1.5 rounded-lg bg-background border border-border/70 hover:border-primary text-foreground/90 transition-colors"
                >
                  💡 <strong>What worked particularly well?</strong>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewText(prev => prev ? `${prev}\n\nLimitations encountered: ` : 'Limitations encountered: ')}
                  className="text-left p-1.5 rounded-lg bg-background border border-border/70 hover:border-primary text-foreground/90 transition-colors"
                >
                  ⚠️ <strong>What limitations did you hit?</strong>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewText(prev => prev ? `${prev}\n\nPrimary use case: ` : 'Primary use case: ')}
                  className="text-left p-1.5 rounded-lg bg-background border border-border/70 hover:border-primary text-foreground/90 transition-colors"
                >
                  🎯 <strong>What did you use it for?</strong>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewText(prev => prev ? `${prev}\n\nValue assessment: ` : 'Value assessment: ')}
                  className="text-left p-1.5 rounded-lg bg-background border border-border/70 hover:border-primary text-foreground/90 transition-colors"
                >
                  💰 <strong>Is the paid plan worth it?</strong>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-foreground">Detailed Review *</label>
                <span className="text-[11px] text-muted-foreground">{reviewText.length} characters (min 30)</span>
              </div>
              <Textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your genuine hands-on experience, workflows, performance quirks, and operational takeaways..."
                rows={5}
                className="text-xs bg-card"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Pros & Cons */}
        {currentStep === 3 && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Key Strengths & Pros (Optional)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPros([...pros, ''])}
                  className="h-6 text-[11px] gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Pro
                </Button>
              </div>

              <div className="space-y-2">
                {pros.map((pro, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={pro}
                      onChange={e => {
                        const next = [...pros];
                        next[index] = e.target.value;
                        setPros(next);
                      }}
                      placeholder={`e.g., Exceptional context retention for large repositories`}
                      className="h-8 text-xs bg-background"
                    />
                    {pros.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPros(pros.filter((_, i) => i !== index))}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Known Caveats & Cons (Optional)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCons([...cons, ''])}
                  className="h-6 text-[11px] gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Con
                </Button>
              </div>

              <div className="space-y-2">
                {cons.map((con, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={con}
                      onChange={e => {
                        const next = [...cons];
                        next[index] = e.target.value;
                        setCons(next);
                      }}
                      placeholder={`e.g., Rate limits trigger quickly on heavy data analysis tasks`}
                      className="h-8 text-xs bg-background"
                    />
                    {cons.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCons(cons.filter((_, i) => i !== index))}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Usage Context & Disclosures */}
        {currentStep === 4 && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Your Name / Pseudonym *</label>
                <Input
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="e.g., Marcus Vance"
                  className="h-8 text-xs bg-card"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Role / Profession *</label>
                <Input
                  value={roleOrProfession}
                  onChange={e => setRoleOrProfession(e.target.value)}
                  placeholder="e.g., Lead AI Architect"
                  className="h-8 text-xs bg-card"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Primary Use Case</label>
                <Select value={primaryUseCase} onValueChange={setPrimaryUseCase}>
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Software Engineering & Coding">Software Engineering</SelectItem>
                    <SelectItem value="Academic & Scientific Research">Academic Research</SelectItem>
                    <SelectItem value="Enterprise Content Creation">Content Creation</SelectItem>
                    <SelectItem value="Business Intelligence & Data">Data Analysis</SelectItem>
                    <SelectItem value="Personal Productivity">Personal Productivity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Plan / Tier Used</label>
                <Select value={planUsed} onValueChange={setPlanUsed}>
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free Tier">Free Tier</SelectItem>
                    <SelectItem value="Plus / Pro Tier ($20/mo)">Plus / Pro Tier</SelectItem>
                    <SelectItem value="Team / Workspaces">Team / Workspaces</SelectItem>
                    <SelectItem value="Enterprise Custom">Enterprise Custom</SelectItem>
                    <SelectItem value="API Direct Consumption">API Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Usage Duration</label>
                <Select value={usageDuration} onValueChange={setUsageDuration}>
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Less than 1 month">Less than 1 month</SelectItem>
                    <SelectItem value="1-3 months">1 - 3 months</SelectItem>
                    <SelectItem value="3-6 months">3 - 6 months</SelectItem>
                    <SelectItem value="6-12 months">6 - 12 months</SelectItem>
                    <SelectItem value="1+ years">1+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conflict of Interest Disclosure */}
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-primary" />
                  Conflict of Interest Disclosure
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={hasConflict}
                    onChange={e => setHasConflict(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>I have a relationship to disclose</span>
                </label>
              </div>

              {hasConflict && (
                <div className="space-y-2 pt-1 border-t border-border">
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Relationship Type</label>
                    <Select value={conflictType} onValueChange={v => setConflictType(v as any)}>
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee_or_founder">Employee, Contractor or Founder</SelectItem>
                        <SelectItem value="investor_or_advisor">Investor or Advisor</SelectItem>
                        <SelectItem value="received_free_access">Received Free Access / Promotional Credits</SelectItem>
                        <SelectItem value="competitor">Direct Competitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    value={conflictDetails}
                    onChange={e => setConflictDetails(e.target.value)}
                    placeholder="Briefly describe the arrangement or affiliation..."
                    className="h-8 text-xs bg-card"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: Evidence */}
        {currentStep === 5 && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  Upload Verification Evidence (Optional)
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Boosts Trust Score
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Attach an interface screenshot, subscription receipt, or benchmark log to earn a Verified Reviewer badge.
              </p>

              {evidenceFile ? (
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-foreground">{evidenceFile.fileName}</span>
                    <span className="text-muted-foreground text-[11px]">
                      ({(evidenceFile.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEvidenceFile(null)}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-muted/10">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="font-medium text-foreground">Click or Drag Screenshot / PDF Receipt</span>
                  <span className="text-[11px] text-muted-foreground">PNG, JPG, WEBP or PDF up to 5MB</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {evidenceFile && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Evidence Category</label>
                    <Select value={evidenceType} onValueChange={v => setEvidenceType(v as any)}>
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="screenshot">Interface Screenshot</SelectItem>
                        <SelectItem value="billing">Subscription / Billing Invoice</SelectItem>
                        <SelectItem value="benchmark">Benchmark Output Log</SelectItem>
                        <SelectItem value="error">Error / Limitation Evidence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-foreground">Privacy Protection</label>
                    <Select value={evidencePrivacy} onValueChange={v => setEvidencePrivacy(v as any)}>
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moderators_only">Private (Moderators Only)</SelectItem>
                        <SelectItem value="public_redacted">Public (Auto-Redacted)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {evidenceFile && (
                <label className="flex items-start gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evidenceWarningAcknowledged}
                    onChange={e => setEvidenceWarningAcknowledged(e.target.checked)}
                    className="rounded border-border mt-0.5"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    I confirm that this file does not contain sensitive personal identifiable information (PII), proprietary API keys, or enterprise secrets.
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: Guidelines & Preview */}
        {currentStep === 6 && (
          <div className="space-y-4 pt-2 text-xs">
            {/* Review Summary Preview */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">{title}</span>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{rating}.0 / 5.0</span>
                </div>
              </div>

              <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {reviewText}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border text-[11px] text-muted-foreground">
                <span>By: <strong>{authorName}</strong> ({roleOrProfession})</span>
                <span>•</span>
                <span>Plan: <strong>{planUsed}</strong></span>
                <span>•</span>
                <span>Usage: <strong>{usageDuration}</strong></span>
                {evidenceFile && (
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                    Evidence Attached
                  </Badge>
                )}
              </div>
            </div>

            {/* Mandatory Review Guidelines Checklist */}
            <div className="p-4 rounded-xl bg-card border border-primary/20 space-y-3">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                AIDetector.cx Community Review Guidelines
              </div>

              <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>Genuine Experience:</strong> Review is based on authentic firsthand usage.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>Factual Specificity:</strong> Provide specific examples rather than vague praise or hate.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>No Impersonation:</strong> You are submitting on behalf of yourself.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>Conflict Transparency:</strong> All affiliations and sponsored access are declared.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>Privacy Safety:</strong> No confidential corporate data or PII is included.</span>
                </li>
              </ul>

              <label className="flex items-center gap-2 pt-2 border-t border-border cursor-pointer font-semibold text-foreground text-xs">
                <input
                  type="checkbox"
                  checked={guidelinesAgreed}
                  onChange={e => setGuidelinesAgreed(e.target.checked)}
                  className="rounded border-border"
                />
                <span>I agree to the Community Guidelines and certify this review is authentic.</span>
              </label>
            </div>
          </div>
        )}

        {/* Modal Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevStep}
              className="text-xs h-8 gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 text-muted-foreground"
            >
              Cancel
            </Button>
          )}

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              size="sm"
              onClick={handleNextStep}
              className="text-xs h-8 bg-primary text-primary-foreground gap-1"
            >
              <span>Next: {STEPS[currentStep].title}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleFinalSubmit}
              disabled={!guidelinesAgreed}
              className="text-xs h-8 bg-primary text-primary-foreground gap-1.5 font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingReview ? 'Save Updated Review' : 'Publish Verified Review'}</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
