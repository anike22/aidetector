import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GraduationCap, BookOpen, Upload, Globe, FileText, CheckCircle2,
  AlertTriangle, RefreshCw, Sparkles, X, ChevronDown, ChevronUp,
  ExternalLink, Info, Lock, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { validatePolicyUrl, extractPolicyFromDocument, sanitizeHtmlToText } from '@/lib/studentPolicy/policyExtractor';
import { interpretAcademicPolicy } from '@/lib/studentPolicy/policyInterpreter';
import { synthesizeAcademicPolicyGuidance } from '@/lib/studentPolicy/policyAdapter';
import { DeclarationChecklist } from './DeclarationChecklist';
import { AcademicPolicyGuidanceCard } from './AcademicPolicyGuidanceCard';
import type {
  StudentPolicyState,
  DeclaredAIActivity,
  StructuredPolicyInterpretation,
  PolicySourceType,
} from '@/types/studentPolicy';
import type { BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import type { AggressiveDetectorResult } from '@/lib/detection/aggressiveDetectorService';

interface StudentModePanelProps {
  balancedResult?: BalancedDetectorResult | null;
  aggressiveResult?: AggressiveDetectorResult | null;
  onClose?: () => void;
}

const PRESET_TEMPLATES = [
  {
    name: 'Brainstorming & Grammar Only',
    text: `Generative AI tools (e.g., ChatGPT, Claude) may be used for preliminary brainstorming, outlining, and mechanical grammar checking. Direct text generation of sentences, paragraphs, or arguments is strictly prohibited. Students must cite all AI tools used and maintain version history logs.`,
  },
  {
    name: 'Strict Prohibition (Zero AI)',
    text: `The use of generative artificial intelligence tools or automated paraphrasers is strictly prohibited on this assignment. All submitted prose, analysis, and code must be the original, independent work of the student. Violations will be referred to academic integrity review.`,
  },
  {
    name: 'Permitted with Full Disclosure',
    text: `AI tools are permitted for research, drafting assistance, and translation. Students must include an appendix detailing the prompts used, tools selected, and raw outputs generated. AIDetector.cx score must be under 30%.`,
  },
  {
    name: 'Turnitin 20% External Policy',
    text: `Assignments will be reviewed through Turnitin AI writing detection. Turnitin AI score must be below 20%. Any higher score will trigger manual faculty interview.`,
  },
];

export const StudentModePanel: React.FC<StudentModePanelProps> = ({
  balancedResult,
  aggressiveResult,
  onClose,
}) => {
  const [policyState, setPolicyState] = useState<StudentPolicyState>({
    isEnabled: true,
    institutionName: '',
    courseOrModule: '',
    assignmentTitle: '',
    academicTermOrDate: '',
    rawPolicyText: '',
    policyUrl: '',
    uploadedDocumentName: undefined,
    extractedDocumentText: undefined,
    documentExtractionError: undefined,
    isExtractingDocument: false,
    isRetrievingUrl: false,
    retrievalError: undefined,
    interpretation: null,
    declaration: {
      declaredActivities: [],
      promptsRetained: false,
    },
  });

  const [activeInputTab, setActiveInputTab] = useState<'paste' | 'url' | 'upload'>('paste');
  const [showExtractedReview, setShowExtractedReview] = useState(false);
  const [showMetadataInputs, setShowMetadataInputs] = useState(false);

  // Auto-interpret when policy text changes (debounced or triggered)
  const handleInterpret = async (
    textToInterpret: string,
    sourceType: PolicySourceType,
    sourceIdentifier: string
  ) => {
    const interpretation = await interpretAcademicPolicy({
      rawPolicyText: textToInterpret,
      sourceType,
      sourceIdentifier,
      institutionName: policyState.institutionName,
      courseOrModule: policyState.courseOrModule,
      assignmentTitle: policyState.assignmentTitle,
    });

    setPolicyState((prev) => ({
      ...prev,
      interpretation,
    }));
  };

  // Handle URL retrieval
  const handleFetchUrl = async () => {
    const { valid, cleanUrl, error } = validatePolicyUrl(policyState.policyUrl);
    if (!valid || !cleanUrl) {
      toast.error(error || 'Invalid policy URL.');
      setPolicyState((prev) => ({ ...prev, retrievalError: error }));
      return;
    }

    setPolicyState((prev) => ({ ...prev, isRetrievingUrl: true, retrievalError: undefined }));

    try {
      // Fetch URL with standard web protections
      const resp = await fetch(cleanUrl, { headers: { Accept: 'text/html, text/plain' } });
      if (!resp.ok) {
        throw new Error(`HTTP error ${resp.status}: Could not fetch page.`);
      }
      const rawHtml = await resp.text();
      const cleanText = sanitizeHtmlToText(rawHtml);

      if (!cleanText || cleanText.length < 20) {
        throw new Error('Retrieved webpage contained no readable policy text.');
      }

      setPolicyState((prev) => ({
        ...prev,
        rawPolicyText: cleanText,
        isRetrievingUrl: false,
        retrievalError: undefined,
      }));

      await handleInterpret(cleanText, 'retrieved-url', cleanUrl);
      toast.success('Official policy retrieved and analyzed.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve policy from URL.';
      setPolicyState((prev) => ({
        ...prev,
        isRetrievingUrl: false,
        retrievalError: `${msg} Please copy and paste the policy text manually.`,
      }));
      toast.error('Could not fetch URL. You can paste the policy text directly.');
    }
  };

  // Handle Document Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPolicyState((prev) => ({
      ...prev,
      isExtractingDocument: true,
      documentExtractionError: undefined,
      uploadedDocumentName: file.name,
    }));

    const outcome = await extractPolicyFromDocument(file);

    if (outcome.success && outcome.extractedText) {
      setPolicyState((prev) => ({
        ...prev,
        isExtractingDocument: false,
        rawPolicyText: outcome.extractedText!,
        extractedDocumentText: outcome.extractedText!,
        documentExtractionError: undefined,
      }));
      setShowExtractedReview(true);
      await handleInterpret(outcome.extractedText, 'user-provided', file.name);
      toast.success(`Extracted policy text from "${file.name}".`);
    } else {
      setPolicyState((prev) => ({
        ...prev,
        isExtractingDocument: false,
        documentExtractionError: outcome.error,
      }));
      toast.error(outcome.error || 'Failed to extract document.');
    }
  };

  const guidance = synthesizeAcademicPolicyGuidance({
    balancedResult,
    aggressiveResult,
    interpretation: policyState.interpretation,
    declaration: policyState.declaration,
  });

  return (
    <div
      id="student-mode-guidance-panel"
      className="rounded-2xl border border-primary/20 bg-card/95 shadow-md backdrop-blur-xs p-4 md:p-6 space-y-6 animate-in fade-in-50 duration-300"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-foreground">
              Student Mode: Academic Policy Guidance
            </h3>
            <p className="text-xs text-muted-foreground">
              Factual AI policy interpretation alongside your detection scan. No false approvals or score adjustments.
            </p>
          </div>
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Close Student Mode"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Metadata Accordion (Optional Institution, Course, Term) */}
      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs space-y-2">
        <button
          type="button"
          onClick={() => setShowMetadataInputs(!showMetadataInputs)}
          className="flex items-center justify-between w-full font-semibold text-foreground hover:text-primary transition-colors text-left"
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            Optional Assignment Details (Institution, Course, Term)
          </span>
          {showMetadataInputs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMetadataInputs && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-border/50">
            <div>
              <Label className="text-[11px] text-muted-foreground">Institution Name</Label>
              <Input
                placeholder="e.g. Stanford University"
                value={policyState.institutionName}
                onChange={(e) => setPolicyState((prev) => ({ ...prev, institutionName: e.target.value }))}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Course / Module</Label>
              <Input
                placeholder="e.g. HIST 201"
                value={policyState.courseOrModule}
                onChange={(e) => setPolicyState((prev) => ({ ...prev, courseOrModule: e.target.value }))}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Assignment Title</Label>
              <Input
                placeholder="e.g. Research Essay 1"
                value={policyState.assignmentTitle}
                onChange={(e) => setPolicyState((prev) => ({ ...prev, assignmentTitle: e.target.value }))}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Term / Date</Label>
              <Input
                placeholder="e.g. Fall 2026"
                value={policyState.academicTermOrDate}
                onChange={(e) => setPolicyState((prev) => ({ ...prev, academicTermOrDate: e.target.value }))}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Policy Input Tabs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-xs font-bold text-foreground">
            Assignment AI Instructions / Syllabus Excerpt <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="w-3 h-3 text-primary" />
            <span>Omit confidential student IDs or personal names</span>
          </div>
        </div>

        <Tabs value={activeInputTab} onValueChange={(v) => setActiveInputTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 h-8 p-0.5 bg-muted/60">
            <TabsTrigger value="paste" className="text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Policy URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="text-xs flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Upload Document
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Paste Text */}
          <TabsContent value="paste" className="space-y-3 mt-3">
            <Textarea
              placeholder="Paste your assignment prompt, syllabus AI guidelines, or course rules here..."
              value={policyState.rawPolicyText}
              onChange={(e) => {
                const text = e.target.value;
                setPolicyState((prev) => ({ ...prev, rawPolicyText: text }));
                handleInterpret(text, 'user-provided', 'Pasted Instructions');
              }}
              rows={4}
              className="text-xs font-sans leading-relaxed resize-y"
            />

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-semibold">Common Policy Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TEMPLATES.map((tmpl) => (
                  <Button
                    key={tmpl.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPolicyState((prev) => ({ ...prev, rawPolicyText: tmpl.text }));
                      handleInterpret(tmpl.text, 'user-provided', tmpl.name);
                      toast.info(`Loaded preset: ${tmpl.name}`);
                    }}
                    className="text-[11px] h-7 px-2.5 bg-card hover:bg-accent/10 border-border/80"
                  >
                    {tmpl.name}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Official URL */}
          <TabsContent value="url" className="space-y-3 mt-3">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://university.edu/course-guidelines/ai-policy"
                value={policyState.policyUrl}
                onChange={(e) => setPolicyState((prev) => ({ ...prev, policyUrl: e.target.value }))}
                className="text-xs h-9 flex-1"
              />
              <Button
                type="button"
                onClick={handleFetchUrl}
                disabled={policyState.isRetrievingUrl || !policyState.policyUrl}
                className="text-xs h-9 px-4 shrink-0"
              >
                {policyState.isRetrievingUrl ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Fetching...
                  </>
                ) : (
                  'Retrieve Policy'
                )}
              </Button>
            </div>

            {policyState.retrievalError && (
              <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                {policyState.retrievalError}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: Document Upload */}
          <TabsContent value="upload" className="space-y-3 mt-3">
            <div className="border border-dashed border-border rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
              <input
                type="file"
                id="policy-doc-upload"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="policy-doc-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-foreground">
                  Click to upload syllabus or assignment prompt
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Supported formats: PDF, DOCX, TXT (Max 10MB)
                </p>
              </label>
            </div>

            {policyState.isExtractingDocument && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                Extracting policy text...
              </div>
            )}

            {policyState.documentExtractionError && (
              <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                {policyState.documentExtractionError}
              </div>
            )}

            {policyState.extractedDocumentText && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Extracted from "{policyState.uploadedDocumentName}":</span>
                  <Badge variant="outline" className="text-[10px]">Ready</Badge>
                </div>
                <Textarea
                  value={policyState.rawPolicyText}
                  onChange={(e) => {
                    const text = e.target.value;
                    setPolicyState((prev) => ({ ...prev, rawPolicyText: text }));
                    handleInterpret(text, 'user-provided', policyState.uploadedDocumentName || 'Uploaded File');
                  }}
                  rows={3}
                  className="text-xs font-sans"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Structured Guidance Card */}
      <AcademicPolicyGuidanceCard
        guidance={guidance}
        interpretation={policyState.interpretation}
        declaration={policyState.declaration}
        onEditRules={() => {
          setActiveInputTab('paste');
          const inputElem = document.getElementById('student-mode-guidance-panel');
          if (inputElem) {
            inputElem.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Student AI Assistance Declaration Section */}
      <div className="pt-4 border-t border-border/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h4 className="text-xs md:text-sm font-bold text-foreground">
              Optional: Declare AI Assistance Used
            </h4>
          </div>
          <Badge variant="outline" className="text-[10px] font-medium border-border">
            Student Declaration Only
          </Badge>
        </div>

        <DeclarationChecklist
          selectedActivities={policyState.declaration.declaredActivities}
          onChange={(declaredActivities) =>
            setPolicyState((prev) => ({
              ...prev,
              declaration: { ...prev.declaration, declaredActivities },
            }))
          }
          evaluationResults={guidance.declarationEvaluations}
          interpretation={policyState.interpretation}
        />
      </div>
    </div>
  );
};
