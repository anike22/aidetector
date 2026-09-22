import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  ShieldCheck, Award, FileSignature, CheckCircle2, Copy, ExternalLink,
  Lock, Loader2, Sparkles, UserCheck, AlertCircle, Info
} from 'lucide-react';
import { AnalysisModule } from '@/pages/seo-assistant/AnalysisShared';
import { registerAuthorshipClaim, type RegisterResult } from '@/lib/verifiedAuthorship/authorshipService';
import { computeContentSHA256, canonicalizeContent } from '@/lib/verifiedAuthorship/cryptoUtils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AuthorshipSignatureModuleProps {
  content: string;
  metaTitle: string;
  registrationResult: RegisterResult | null;
  setRegistrationResult: (res: RegisterResult | null) => void;
}

export function AuthorshipSignatureModule({
  content,
  metaTitle,
  registrationResult,
  setRegistrationResult,
}: AuthorshipSignatureModuleProps) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState(metaTitle || 'Untitled Document');
  const [authorName, setAuthorName] = useState(user?.email?.split('@')[0] || 'Author');
  const [organization, setOrganization] = useState('');
  const [orcid, setOrcid] = useState('');
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn'>('typed');
  const [typedSignature, setTypedSignature] = useState(authorName);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Declarations
  const [declarationType, setDeclarationType] = useState<'entirely_human' | 'human_with_ai_editing' | 'human_with_ai_research'>('entirely_human');
  const [attestOwnership, setAttestOwnership] = useState(false);
  const [attestAccuracy, setAttestAccuracy] = useState(false);
  const [attestDisclosures, setAttestDisclosures] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentHash, setContentHash] = useState<string>('');

  useEffect(() => {
    if (metaTitle && (!title || title === 'Untitled Document')) {
      setTitle(metaTitle);
    }
  }, [metaTitle]);

  useEffect(() => {
    if (content) {
      const canonical = canonicalizeContent(content);
      computeContentSHA256(canonical).then(setContentHash);
    }
  }, [content]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a365d';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please sign in or create an account to anchor authorship.');
      return;
    }
    if (!content.trim() || content.split(/\s+/).filter(Boolean).length < 20) {
      toast.error('Minimum 20 words required for verified authorship registration.');
      return;
    }
    if (!title.trim()) {
      toast.error('Please provide a document title.');
      return;
    }
    if (!attestOwnership || !attestAccuracy || !attestDisclosures) {
      toast.error('Please confirm all attestation statements before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const canonical = canonicalizeContent(content);
      const res = await registerAuthorshipClaim({
        title: title.trim(),
        rawContent: canonical,
        language: 'en',
        category: 'SEO Article / Editorial',
        creationDeclaration: {
          declarationType,
          declarationLabel:
            declarationType === 'entirely_human'
              ? 'Entirely Human-Written'
              : declarationType === 'human_with_ai_editing'
              ? 'Human-Written with AI Editing Assistance'
              : 'Human-Written with AI Research Assistance',
          declarationStatement: `Registered via SEO Assistant by ${authorName}. Visual signature applied.`,
          isOriginalCreator: true,
          hasIntellectualPropertyRights: true,
          notKnowinglyCopied: true,
          understandsNotCopyrightGrant: true,
          acceptsTermsAndDisputes: true,
          signerIdentifier: authorName,
          signedTimestamp: new Date().toISOString(),
          additionalDeclarations: signatureType === 'drawn' ? 'Visual drawn signature representation applied.' : 'Typed representation applied.',
        },
      });

      if (res.success) {
        setRegistrationResult(res);
        setModalOpen(false);
        toast.success(`Authorship registered! Code: ${res.registration?.trackingCode}`);
      } else {
        toast.error(res.errorMessage || 'Failed to complete authorship registration.');
      }
    } catch (err: any) {
      console.error('Authorship registration failed:', err);
      toast.error(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const trackingCode = registrationResult?.registration?.trackingCode;

  return (
    <AnalysisModule
      title="Authorship & Signature"
      defaultOpen={false}
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground text-pretty">
          Anchor an immutable SHA-256 fingerprint of your content to the public verified authorship registry with your signature representation.
        </p>

        {registrationResult && trackingCode ? (
          <div className="p-3 bg-success/10 border border-success/30 rounded-lg flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-success font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-success" />
              Verified Authorship Registered
            </div>
            <div className="p-2 bg-background/90 rounded border border-border/60 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium">Tracking Code:</span>
                <span className="font-mono font-bold text-primary">{trackingCode}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Version:</span>
                <span className="font-semibold text-foreground">v{registrationResult.registration?.currentVersionNumber || 1} (Immutable)</span>
              </div>
              {contentHash && (
                <div className="text-[9px] font-mono text-muted-foreground truncate" title={contentHash}>
                  SHA: {contentHash.slice(0, 16)}…{contentHash.slice(-8)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-border flex-1 gap-1"
                onClick={() => {
                  navigator.clipboard.writeText(`https://aidetector.cx/verify/${trackingCode}`);
                  toast.success('Verification link copied to clipboard.');
                }}
              >
                <Copy className="w-3 h-3" /> Copy Link
              </Button>
              <a
                href={`/verify/${trackingCode}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1"
              >
                <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground w-full gap-1">
                  <Award className="w-3 h-3" /> View Certificate
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            disabled={!content.trim()}
            className="h-8 text-xs bg-primary text-primary-foreground gap-1.5 w-full font-medium"
          >
            <FileSignature className="w-3.5 h-3.5" />
            Register Authorship & Signature
          </Button>
        )}
      </div>

      {/* Authorship Registration Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Register Content Authorship & Signature
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Anchor this exact text snapshot with an immutable cryptographic SHA-256 hash and formal declaration.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Snapshot Metadata Preview */}
            <div className="p-3 bg-muted/20 border border-border rounded-lg grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Word Count</span>
                <span className="font-semibold text-foreground">
                  {content.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Content Hash</span>
                <span className="font-mono text-[10px] text-foreground truncate block" title={contentHash}>
                  {contentHash ? `${contentHash.slice(0, 12)}…${contentHash.slice(-8)}` : 'Computing…'}
                </span>
              </div>
            </div>

            {/* Document Title & Author Profile */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold mb-1 block">Article / Document Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Comprehensive SEO Architecture 2026"
                  className="h-8 text-xs border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Author Display Name</Label>
                  <Input
                    value={authorName}
                    onChange={(e) => {
                      setAuthorName(e.target.value);
                      if (signatureType === 'typed') setTypedSignature(e.target.value);
                    }}
                    placeholder="Your Name"
                    className="h-8 text-xs border-border"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-1 block">Organization (Optional)</Label>
                  <Input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Editorial Dept"
                    className="h-8 text-xs border-border"
                  />
                </div>
              </div>
            </div>

            {/* Signature Representation */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Visual Signature Representation</Label>
                <span className="text-[10px] text-muted-foreground italic">(Non-cryptographic representation)</span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant={signatureType === 'typed' ? 'default' : 'outline'}
                  onClick={() => setSignatureType('typed')}
                  className="h-7 text-xs flex-1"
                >
                  Type Signature
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant={signatureType === 'drawn' ? 'default' : 'outline'}
                  onClick={() => setSignatureType('drawn')}
                  className="h-7 text-xs flex-1"
                >
                  Draw Signature
                </Button>
              </div>

              {signatureType === 'typed' ? (
                <div className="p-3 bg-muted/20 border border-border rounded-lg flex items-center justify-center min-h-16">
                  <span className="font-serif italic text-xl text-primary font-bold">
                    {typedSignature || 'Your Signature'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="border border-border rounded-lg bg-background p-1 flex justify-center">
                    <canvas
                      ref={canvasRef}
                      width={380}
                      height={90}
                      className="cursor-crosshair w-full max-w-[380px] h-[90px] touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={clearCanvas}
                      className="h-6 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Clear Signature
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Authorship Declaration */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-semibold">Creation Declaration</Label>
              <RadioGroup
                value={declarationType}
                onValueChange={(val: any) => setDeclarationType(val)}
                className="space-y-1.5 text-xs"
              >
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/30 border border-transparent hover:border-border">
                  <RadioGroupItem value="entirely_human" id="d1" />
                  <label htmlFor="d1" className="cursor-pointer">
                    <span className="font-semibold block">Entirely Human-Written</span>
                    <span className="text-[10px] text-muted-foreground">No generative AI text models involved.</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/30 border border-transparent hover:border-border">
                  <RadioGroupItem value="human_with_ai_editing" id="d2" />
                  <label htmlFor="d2" className="cursor-pointer">
                    <span className="font-semibold block">Human-Written with AI Editing Assistance</span>
                    <span className="text-[10px] text-muted-foreground">AI used for grammar and phrasing refinement.</span>
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/30 border border-transparent hover:border-border">
                  <RadioGroupItem value="human_with_ai_research" id="d3" />
                  <label htmlFor="d3" className="cursor-pointer">
                    <span className="font-semibold block">Human-Written with AI Research Assistance</span>
                    <span className="text-[10px] text-muted-foreground">AI used for research or outlining.</span>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Attestation Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <Label className="text-xs font-semibold text-navy">Legal Attestation & Consent</Label>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="att1"
                  checked={attestOwnership}
                  onCheckedChange={(c) => setAttestOwnership(!!c)}
                  className="mt-0.5"
                />
                <label htmlFor="att1" className="text-[11px] text-muted-foreground leading-snug cursor-pointer">
                  I certify that I am the author or authorized rights-holder of this submitted text.
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="att2"
                  checked={attestAccuracy}
                  onCheckedChange={(c) => setAttestAccuracy(!!c)}
                  className="mt-0.5"
                />
                <label htmlFor="att2" className="text-[11px] text-muted-foreground leading-snug cursor-pointer">
                  I confirm that all author details, citations, and creation disclosures are accurate.
                </label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="att3"
                  checked={attestDisclosures}
                  onCheckedChange={(c) => setAttestDisclosures(!!c)}
                  className="mt-0.5"
                />
                <label htmlFor="att3" className="text-[11px] text-muted-foreground leading-snug cursor-pointer">
                  I understand this registration records an immutable timestamped claim on the AIDetector.cx public registry.
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-border"
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-primary text-primary-foreground gap-1.5"
                onClick={handleRegister}
                disabled={isSubmitting || !attestOwnership || !attestAccuracy || !attestDisclosures}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Anchoring Claim…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Submit & Generate Verification Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AnalysisModule>
  );
}
