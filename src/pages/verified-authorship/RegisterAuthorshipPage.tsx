import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShieldCheck,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  Lock,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Info,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { extractTextFromDocumentFile } from '@/lib/verifiedAuthorship/documentExtractor';
import { executeIntegrityGate, fetchAuthorshipSettings } from '@/lib/verifiedAuthorship/integrityGateEngine';
import { registerAuthorshipClaim } from '@/lib/verifiedAuthorship/authorshipService';
import { VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER } from '@/lib/verifiedAuthorship/cryptoUtils';
import type {
  CreationDeclarationType,
  CreationDeclaration,
  CitationReference,
  CollaboratorDeclaration,
  IntegrityGateSummary,
} from '@/lib/verifiedAuthorship/types';
import { useAuth } from '@/contexts/AuthContext';

const DECLARATION_OPTIONS: Array<{
  type: CreationDeclarationType;
  label: string;
  desc: string;
}> = [
  {
    type: 'entirely_human',
    label: 'Entirely Human-Written',
    desc: 'Authored exclusively by human writers with no generative AI text models involved in composing the text.',
  },
  {
    type: 'human_with_ai_editing',
    label: 'Human-Written with AI Editing Assistance',
    desc: 'Written by human author(s) with AI used only for grammar, spelling, and phrasing refinement.',
  },
  {
    type: 'human_with_ai_research',
    label: 'Human-Written with AI Research Assistance',
    desc: 'Substantive writing composed by human author(s) with AI utilized for ideation, outline, or background research.',
  },
  {
    type: 'partially_ai_substantially_rewritten',
    label: 'Partially AI-Generated & Substantially Rewritten',
    desc: 'Contains initial AI-generated passages that have been heavily modified, restructured, and validated by human authors.',
  },
  {
    type: 'translation',
    label: 'Translation / Localized Work',
    desc: 'Human or human-verified translation of an original authorized foreign language work.',
  },
  {
    type: 'collaborative_work',
    label: 'Collaborative Multi-Author Work',
    desc: 'Jointly composed by multiple declared co-authors or editorial contributors.',
  },
  {
    type: 'previously_published_derivative',
    label: 'Based on Previously Published Material',
    desc: 'Includes or builds upon prior publications or research owned by or licensed to the registrant.',
  },
  {
    type: 'authorized_derivative',
    label: 'Authorized Derivative Work',
    desc: 'An adaptation created under explicit license or permission from the original rights holder.',
  },
];

export default function RegisterAuthorshipPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow State: Step 1 = Submit Content, Step 2 = Declaration, Step 3 = Integrity Gate & Confirm
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Content fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Essay / Academic');
  const [language, setLanguage] = useState('en');
  const [claimedCreationDate, setClaimedCreationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [publishedUrl, setPublishedUrl] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [documentMime, setDocumentMime] = useState<string | null>(null);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);

  // Citations & Collaborators
  const [citations, setCitations] = useState<CitationReference[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorDeclaration[]>([]);
  const [newCollabName, setNewCollabName] = useState('');
  const [newCollabRole, setNewCollabRole] = useState('');

  // Private Creation Evidence
  const [privateEvidenceNotes, setPrivateEvidenceNotes] = useState('');

  // Step 2: Declaration
  const [declarationType, setDeclarationType] = useState<CreationDeclarationType>('entirely_human');
  const [declarationConfirmed1, setDeclarationConfirmed1] = useState(false);
  const [declarationConfirmed2, setDeclarationConfirmed2] = useState(false);
  const [declarationConfirmed3, setDeclarationConfirmed3] = useState(false);
  const [declarationConfirmed4, setDeclarationConfirmed4] = useState(false);
  const [declarationConfirmed5, setDeclarationConfirmed5] = useState(false);

  // Step 3: Integrity Gate
  const [isRunningGate, setIsRunningGate] = useState(false);
  const [gateSummary, setGateSummary] = useState<IntegrityGateSummary | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExtractingDoc(true);
      const res = await extractTextFromDocumentFile(file);
      setRawContent(res.text);
      setDocumentName(res.fileName);
      setDocumentMime(res.detectedFormat);
      if (!title) {
        setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
      }
      toast.success(`Extracted ${res.wordCount} words from ${res.fileName}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to extract document text.');
    } finally {
      setIsExtractingDoc(false);
    }
  };

  const addCollaborator = () => {
    if (!newCollabName.trim()) return;
    setCollaborators((prev) => [
      ...prev,
      { name: newCollabName.trim(), role: newCollabRole.trim() || 'Co-author' },
    ]);
    setNewCollabName('');
    setNewCollabRole('');
  };

  const removeCollaborator = (index: number) => {
    setCollaborators((prev) => prev.filter((_, i) => i !== index));
  };

  // Step 1 Validation
  const canProceedToStep2 = () => {
    if (!title.trim()) return false;
    if (!rawContent.trim() || rawContent.trim().length < 50) return false;
    return true;
  };

  // Step 2 Validation
  const canProceedToStep3 = () => {
    return (
      declarationConfirmed1 &&
      declarationConfirmed2 &&
      declarationConfirmed3 &&
      declarationConfirmed4 &&
      declarationConfirmed5
    );
  };

  // Step 3: Run Integrity Gate
  const runGateChecks = async () => {
    if (!rawContent.trim()) return;
    try {
      setIsRunningGate(true);
      setGateError(null);
      const settings = await fetchAuthorshipSettings();
      const summary = await executeIntegrityGate(rawContent, user?.id || 'guest', settings);
      setGateSummary(summary);
      if (summary.allPassed) {
        toast.success('Passed AIDetector.cx Authorship Eligibility Checks');
      } else {
        toast.error('Integrity Gate did not meet all eligibility thresholds.');
      }
    } catch (err: any) {
      setGateError(err?.message || 'Failed to execute Integrity Gate.');
      toast.error(err?.message || 'Integrity Gate execution failed.');
    } finally {
      setIsRunningGate(false);
    }
  };

  // Final Submission
  const handleFinalSubmit = async () => {
    if (!user) {
      toast.error('Please log in to finalize authorship registration.');
      navigate('/login?redirect=/verified-authorship/register');
      return;
    }

    if (!gateSummary || !gateSummary.allPassed) {
      toast.error('Registration is locked until all mandatory Integrity Gate checks pass.');
      return;
    }

    try {
      setIsRegistering(true);
      const selectedOption = DECLARATION_OPTIONS.find((o) => o.type === declarationType);
      const declarationPayload: CreationDeclaration = {
        declarationType,
        declarationLabel: selectedOption?.label || 'Entirely Human-Written',
        declarationStatement: selectedOption?.desc || '',
        isOriginalCreator: true,
        hasIntellectualPropertyRights: true,
        notKnowinglyCopied: true,
        understandsNotCopyrightGrant: true,
        acceptsTermsAndDisputes: true,
        signerIdentifier: user.email || user.id,
        signedTimestamp: new Date().toISOString(),
      };

      const result = await registerAuthorshipClaim(
        {
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          description: description.trim() || undefined,
          category,
          language,
          claimedCreationDate,
          publishedUrl: publishedUrl.trim() || undefined,
          rawContent,
          citations,
          collaborators,
          documentName: documentName || undefined,
          documentMimeType: documentMime || undefined,
          privateEvidenceNotes: privateEvidenceNotes.trim() || undefined,
          creationDeclaration: declarationPayload,
        },
        gateSummary
      );

      if (result.success && result.registration) {
        toast.success('Authorship Claim successfully registered!');
        navigate(`/verified-authorship/${result.registration.id}/certificate`);
      } else {
        toast.error(result.errorMessage || 'Registration failed.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit authorship claim.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <MainLayout>
      <PageMeta
        title="Register Authorship | Verified Authorship | AIDetector.cx"
        description="Register your original content with AIDetector.cx Verified Authorship. Receive a cryptographically verifiable tracking code and publish an indexable authorship certificate."
      />

      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 border-b pb-6">
            <div className="flex items-center gap-2 text-accent font-serif tracking-tight text-sm font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>AIDETECTOR.CX SECURE ATTESTATION</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-foreground">
              Register Authorship
            </h1>
            <p className="mt-2 text-muted-foreground text-pretty text-sm md:text-base leading-relaxed">
              Attach your identity and creation declaration to an original work, run the multi-factor
              Integrity Gate, and receive a permanent cryptographically verifiable tracking code.
            </p>

            {/* Stepper indicator */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mt-6">
              <div
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  currentStep === 1
                    ? 'border-primary bg-primary/5 text-primary'
                    : currentStep > 1
                    ? 'border-border bg-muted/30 text-foreground'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-xs shrink-0">
                  1
                </div>
                <span className="truncate">Content & Evidence</span>
              </div>

              <div
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  currentStep === 2
                    ? 'border-primary bg-primary/5 text-primary'
                    : currentStep > 2
                    ? 'border-border bg-muted/30 text-foreground'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-xs shrink-0">
                  2
                </div>
                <span className="truncate">Creation Declaration</span>
              </div>

              <div
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  currentStep === 3
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-xs shrink-0">
                  3
                </div>
                <span className="truncate">Integrity Gate & Attest</span>
              </div>
            </div>
          </div>

          {/* STEP 1: CONTENT SUBMISSION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-serif flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    Step 1: Submit Work & Content Metadata
                  </CardTitle>
                  <CardDescription className="text-pretty">
                    Enter the details of the work you are claiming authorship for. Supported documents
                    include TXT, Markdown, HTML, DOCX, PDF, and RTF.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Title & Subtitle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="font-medium">
                        Work Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="e.g. Deep Learning in Epistemology"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="px-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subtitle" className="font-medium">
                        Subtitle or Edition (Optional)
                      </Label>
                      <Input
                        id="subtitle"
                        placeholder="e.g. A Comparative Philosophical Analysis"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        className="px-3"
                      />
                    </div>
                  </div>

                  {/* Category, Language & Claimed Creation Date */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="font-medium">
                        Category
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Essay / Academic">Essay / Academic</SelectItem>
                          <SelectItem value="Article / Journalism">Article / Journalism</SelectItem>
                          <SelectItem value="Research Paper">Research Paper</SelectItem>
                          <SelectItem value="Creative Writing / Fiction">Creative Writing / Fiction</SelectItem>
                          <SelectItem value="Technical Documentation">Technical Documentation</SelectItem>
                          <SelectItem value="Legal / Business Brief">Legal / Business Brief</SelectItem>
                          <SelectItem value="Opinion / Commentary">Opinion / Commentary</SelectItem>
                          <SelectItem value="General Prose">General Prose</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language" className="font-medium">
                        Language
                      </Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish (Español)</SelectItem>
                          <SelectItem value="fr">French (Français)</SelectItem>
                          <SelectItem value="de">German (Deutsch)</SelectItem>
                          <SelectItem value="zh">Chinese (中文)</SelectItem>
                          <SelectItem value="ar">Arabic (العربية)</SelectItem>
                          <SelectItem value="pt">Portuguese (Português)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="creationDate" className="font-medium">
                        Claimed Creation Date
                      </Label>
                      <Input
                        id="creationDate"
                        type="date"
                        value={claimedCreationDate}
                        onChange={(e) => setClaimedCreationDate(e.target.value)}
                        className="px-3"
                      />
                    </div>
                  </div>

                  {/* Previous Publication URL */}
                  <div className="space-y-2">
                    <Label htmlFor="pubUrl" className="font-medium">
                      Prior Publication or DOI Link (Optional)
                    </Label>
                    <Input
                      id="pubUrl"
                      type="url"
                      placeholder="https://example.com/my-original-publication"
                      value={publishedUrl}
                      onChange={(e) => setPublishedUrl(e.target.value)}
                      className="px-3"
                    />
                  </div>

                  {/* Document Upload or Paste Text */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rawContent" className="font-medium flex items-center gap-2">
                        <span>Content Body</span>
                        <span className="text-destructive">*</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          ({rawContent.split(/\s+/).filter(Boolean).length} words, {rawContent.length} chars)
                        </span>
                      </Label>
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept=".txt,.md,.markdown,.html,.htm,.docx,.pdf,.rtf"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isExtractingDoc}
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2 text-xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {isExtractingDoc ? 'Extracting...' : 'Upload Document File'}
                        </Button>
                      </div>
                    </div>

                    {documentName && (
                      <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-md text-xs border">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-accent shrink-0" />
                          <span className="font-medium truncate">{documentName}</span>
                          <Badge variant="outline" className="text-[10px] py-0">
                            {documentMime}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setDocumentName(null);
                            setDocumentMime(null);
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}

                    <Textarea
                      id="rawContent"
                      placeholder="Paste your complete original content here (minimum 50 characters required for Integrity Gate analysis)..."
                      rows={10}
                      value={rawContent}
                      onChange={(e) => setRawContent(e.target.value)}
                      className="font-mono text-sm leading-relaxed"
                    />
                  </div>

                  {/* Collaborators */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="font-medium flex items-center gap-2">
                      <span>Co-Authors / Collaborators (Optional)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Collaborator full name"
                        value={newCollabName}
                        onChange={(e) => setNewCollabName(e.target.value)}
                        className="px-3"
                      />
                      <Input
                        placeholder="Role (e.g. Co-Author, Editor)"
                        value={newCollabRole}
                        onChange={(e) => setNewCollabRole(e.target.value)}
                        className="px-3 max-w-[200px]"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addCollaborator}
                        disabled={!newCollabName.trim()}
                        className="shrink-0"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>

                    {collaborators.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {collaborators.map((c, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="flex items-center gap-1.5 py-1 px-2.5"
                          >
                            <span>{c.name}</span>
                            {c.role && <span className="text-muted-foreground text-[10px]">({c.role})</span>}
                            <button
                              type="button"
                              onClick={() => removeCollaborator(i)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Private Creation Evidence */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="privateEvidence" className="font-medium">
                        Private Creation Evidence Notes (Confidential)
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This field is stored securely and is only accessible to you and platform administrators
                      in the event of a dispute. It is never displayed on the public certificate.
                    </p>
                    <Textarea
                      id="privateEvidence"
                      placeholder="e.g. Repository commit links, draft notebook references, interview audio log timestamps, or private creation timeline..."
                      rows={3}
                      value={privateEvidenceNotes}
                      onChange={(e) => setPrivateEvidenceNotes(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (canProceedToStep2()) {
                      setCurrentStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      toast.error('Please provide a title and at least 50 characters of content.');
                    }
                  }}
                  disabled={!canProceedToStep2()}
                  className="gap-2 px-6"
                >
                  Continue to Creation Declaration
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: CREATION DECLARATION */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-serif flex items-center gap-2">
                    <Scale className="w-5 h-5 text-accent" />
                    Step 2: Creation Declaration & Attestation
                  </CardTitle>
                  <CardDescription className="text-pretty">
                    Select the creation category that accurately describes your original work. This
                    declaration is cryptographically bound into your signed authorship record.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category Selection */}
                  <RadioGroup
                    value={declarationType}
                    onValueChange={(val) => setDeclarationType(val as CreationDeclarationType)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {DECLARATION_OPTIONS.map((opt) => (
                      <div
                        key={opt.type}
                        className={`p-4 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                          declarationType === opt.type
                            ? 'border-accent bg-accent/5 ring-1 ring-accent'
                            : 'border-border hover:bg-muted/30'
                        }`}
                        onClick={() => setDeclarationType(opt.type)}
                      >
                        <RadioGroupItem value={opt.type} id={opt.type} className="mt-1" />
                        <div>
                          <Label htmlFor={opt.type} className="font-serif font-bold text-sm cursor-pointer">
                            {opt.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* Mandatory Declarations Checkboxes */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-serif font-bold text-sm text-foreground">
                      Mandatory Authorship Affirmations:
                    </h3>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="dec1"
                        checked={declarationConfirmed1}
                        onCheckedChange={(c) => setDeclarationConfirmed1(!!c)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="dec1" className="text-xs leading-relaxed text-foreground cursor-pointer">
                        I declare that I am the genuine author (or authorized co-author) of this content,
                        and the work was created as described in the selected category.
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="dec2"
                        checked={declarationConfirmed2}
                        onCheckedChange={(c) => setDeclarationConfirmed2(!!c)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="dec2" className="text-xs leading-relaxed text-foreground cursor-pointer">
                        I affirm that this work is not knowingly copied, plagiarized, or misappropriated
                        from another source without lawful citation or explicit license.
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="dec3"
                        checked={declarationConfirmed3}
                        onCheckedChange={(c) => setDeclarationConfirmed3(!!c)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="dec3" className="text-xs leading-relaxed text-foreground cursor-pointer">
                        I acknowledge that AIDetector.cx provides probabilistic screening and cryptographic
                        timestamps, not government copyright registration or legal ownership determination.
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="dec4"
                        checked={declarationConfirmed4}
                        onCheckedChange={(c) => setDeclarationConfirmed4(!!c)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="dec4" className="text-xs leading-relaxed text-foreground cursor-pointer">
                        I agree to submit to the platform dispute resolution process and understand that
                        false, fraudulent, or infringing claims may be suspended or revoked.
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="dec5"
                        checked={declarationConfirmed5}
                        onCheckedChange={(c) => setDeclarationConfirmed5(!!c)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="dec5" className="text-xs leading-relaxed text-foreground cursor-pointer">
                        I consent to the publication of the public certificate metadata, content hash,
                        and Integrity Gate verification results.
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Content
                </Button>

                <Button
                  onClick={() => {
                    if (canProceedToStep3()) {
                      setCurrentStep(3);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      runGateChecks();
                    } else {
                      toast.error('Please confirm all mandatory affirmations to continue.');
                    }
                  }}
                  disabled={!canProceedToStep3()}
                  className="gap-2 px-6"
                >
                  Proceed to Integrity Gate
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: INTEGRITY GATE & ATTESTATION */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-serif flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-accent" />
                      Step 3: Integrity Gate Screening
                    </span>
                    {gateSummary && (
                      <Badge
                        variant={gateSummary.allPassed ? 'default' : 'destructive'}
                        className="text-xs px-2.5 py-1"
                      >
                        {gateSummary.allPassed ? 'Eligible for Registration' : 'Eligibility Incomplete'}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-pretty">
                    Before authorship is certified, the work is screened through the Balanced AI Detector,
                    Aggressive advisory engine, originality verification, and duplicate-registry database.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status Banner */}
                  {isRunningGate && (
                    <div className="p-4 rounded-lg bg-muted/40 border border-border flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-accent animate-spin shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Executing Integrity Gate Checks...</p>
                        <p className="text-xs text-muted-foreground">
                          Screening writing patterns, scholarly originality, and duplicate registry hashes.
                        </p>
                      </div>
                    </div>
                  )}

                  {gateError && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Integrity Gate Error</p>
                        <p className="text-xs text-destructive/90">{gateError}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={runGateChecks}
                          className="mt-2 text-xs"
                        >
                          Retry Screening
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Gate Results Cards */}
                  {gateSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Balanced AI Detector Card (Required Gate) */}
                      <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Balanced AI Engine (Required)
                          </span>
                          <Badge
                            variant={gateSummary.balancedAiCheck.passed ? 'default' : 'destructive'}
                            className="text-[10px]"
                          >
                            {gateSummary.balancedAiCheck.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-2xl font-serif font-bold text-foreground">
                            {gateSummary.balancedAiCheck.aiSignal}% AI Signal
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Threshold: ≤ {gateSummary.balancedAiCheck.configuredThreshold}%
                          </span>
                        </div>
                        <Progress value={gateSummary.balancedAiCheck.aiSignal} className="h-2" />
                        <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                          {gateSummary.balancedAiCheck.details}
                        </p>
                      </div>

                      {/* Aggressive AI Detector Card (Advisory) */}
                      <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Aggressive Engine (Advisory)
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {gateSummary.aggressiveAiCheck.risk} Risk Tier
                          </Badge>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-2xl font-serif font-bold text-foreground">
                            {gateSummary.aggressiveAiCheck.aiSignal}% AI Signal
                          </span>
                          <span className="text-xs text-muted-foreground">Independent Advisory</span>
                        </div>
                        <Progress value={gateSummary.aggressiveAiCheck.aiSignal} className="h-2" />
                        <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                          {gateSummary.aggressiveAiCheck.details}
                        </p>
                      </div>

                      {/* Plagiarism Originality Card (Required Gate) */}
                      <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Originality Gate (Required)
                          </span>
                          <Badge
                            variant={gateSummary.plagiarismCheck.passed ? 'default' : 'destructive'}
                            className="text-[10px]"
                          >
                            {gateSummary.plagiarismCheck.passed ? 'Passed' : 'Below 90%'}
                          </Badge>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-2xl font-serif font-bold text-foreground">
                            {gateSummary.plagiarismCheck.originalityPercent}% Original
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Required: ≥ {gateSummary.plagiarismCheck.configuredThreshold}%
                          </span>
                        </div>
                        <Progress value={gateSummary.plagiarismCheck.originalityPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                          {gateSummary.plagiarismCheck.details}
                        </p>
                      </div>

                      {/* Duplicate Registry Card (Required Gate) */}
                      <div className="p-4 rounded-lg border bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Registry Collision Check
                          </span>
                          <Badge
                            variant={gateSummary.duplicateRegistryCheck.passed ? 'default' : 'destructive'}
                            className="text-[10px]"
                          >
                            {gateSummary.duplicateRegistryCheck.statusLabel}
                          </Badge>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-base font-serif font-bold text-foreground truncate">
                            {gateSummary.duplicateRegistryCheck.statusLabel}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
                          {gateSummary.duplicateRegistryCheck.details}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Legal Disclaimer Box */}
                  <div className="p-4 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Info className="w-3.5 h-3.5 text-accent" />
                      <span>Legal Disclaimer & Attestation Notice</span>
                    </div>
                    <p className="leading-relaxed">{VERIFIED_AUTHORSHIP_LEGAL_DISCLAIMER}</p>
                    <p className="leading-relaxed">
                      Detection percentages represent writing-pattern signals. They do not measure the literal
                      percentage written by a human or AI.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Declaration
                </Button>

                <Button
                  onClick={handleFinalSubmit}
                  disabled={!gateSummary?.allPassed || isRegistering || isRunningGate}
                  className="gap-2 px-8 bg-primary text-primary-foreground font-semibold"
                >
                  {isRegistering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Publishing Certificate...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Register Authorship & Issue Certificate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
