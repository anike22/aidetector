import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShieldCheck,
  Send,
  Sparkles,
  Layers,
  Code2,
  Server,
  DollarSign,
  Info,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Globe,
  FileCheck,
} from 'lucide-react';
import type {
  PricingModel,
  PlatformType,
  SupportedModality,
  DeploymentMode,
  ToolSubmissionPayload,
} from '@/types/directory';
import { toast } from 'sonner';

const MODALITIES: SupportedModality[] = [
  'Text',
  'Code',
  'Image',
  'Audio',
  'Video',
  'Document',
  'Multimodal',
];

const PLATFORMS: PlatformType[] = [
  'Web',
  'Windows',
  'macOS',
  'Linux',
  'iOS',
  'Android',
  'Browser Extension',
  'CLI / API',
];

const DEPLOYMENT_MODES: DeploymentMode[] = [
  'Cloud SaaS',
  'Local / Self-Hosted',
  'Air-Gapped / On-Premise',
  'Hybrid',
];

const PRICING_MODELS: PricingModel[] = [
  'Free',
  'Freemium',
  'Paid',
  'Free Trial',
  'Enterprise / Contact Sales',
];

const CATEGORIES = [
  'AI Assistants',
  'AI Coding',
  'AI Search',
  'AI Writing',
  'AI Detection',
  'AI Audio & Voice',
  'AI Image & Vision',
  'AI Video',
  'AI Productivity',
  'AI Research',
  'Local & Open Weights',
];

export default function ToolSubmitPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<ToolSubmissionPayload>({
    name: '',
    company: '',
    websiteUrl: '',
    repositoryUrl: '',
    docsUrl: '',
    summary: '',
    description: '',
    primaryCategory: 'AI Assistants',
    categories: ['AI Assistants'],
    tags: [],
    supportedModalities: ['Text'],
    pricingModel: 'Freemium',
    pricingSummary: '',
    hasFreePlan: true,
    hasFreeTrial: false,
    platforms: ['Web'],
    apiAvailable: false,
    openSource: false,
    isOpenWeight: false,
    licenseType: 'Proprietary',
    supportsOfflineHosting: false,
    deploymentOptions: ['Cloud SaaS'],
    minimumHardwareRequirements: '',
    contactEmail: '',
    verificationEvidenceUrl: '',
    notesForEditorial: '',
  });

  const [tagInput, setTagInput] = useState('');

  const handleModalityToggle = (mod: SupportedModality) => {
    setFormData(prev => {
      const exists = prev.supportedModalities.includes(mod);
      const next = exists
        ? prev.supportedModalities.filter(m => m !== mod)
        : [...prev.supportedModalities, mod];
      return { ...prev, supportedModalities: next.length > 0 ? next : ['Text'] };
    });
  };

  const handlePlatformToggle = (plat: PlatformType) => {
    setFormData(prev => {
      const exists = prev.platforms.includes(plat);
      const next = exists
        ? prev.platforms.filter(p => p !== plat)
        : [...prev.platforms, plat];
      return { ...prev, platforms: next.length > 0 ? next : ['Web'] };
    });
  };

  const handleDeploymentToggle = (mode: DeploymentMode) => {
    setFormData(prev => {
      const exists = prev.deploymentOptions.includes(mode);
      const next = exists
        ? prev.deploymentOptions.filter(m => m !== mode)
        : [...prev.deploymentOptions, mode];
      return { ...prev, deploymentOptions: next.length > 0 ? next : ['Cloud SaaS'] };
    });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,|,$/g, '');
      if (val && !formData.tags.includes(val)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please provide a tool name');
      return;
    }
    if (!formData.websiteUrl.trim()) {
      toast.error('Please provide the official website URL');
      return;
    }
    if (!formData.summary.trim()) {
      toast.error('Please provide a short summary');
      return;
    }
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) {
      toast.error('Please enter a valid developer / submitter email');
      return;
    }

    // Store in localStorage for prototype queue persistence
    try {
      const existing = JSON.parse(localStorage.getItem('ai_tools_submissions') || '[]');
      existing.push({
        ...formData,
        submittedAt: new Date().toISOString(),
        id: `sub_${Date.now()}`,
        status: 'pending_editorial_review',
      });
      localStorage.setItem('ai_tools_submissions', JSON.stringify(existing));
    } catch {
      // ignore storage failure
    }

    setSubmitted(true);
    toast.success('Tool submitted successfully for editorial review!');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            Submission Received for Editorial Review
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Thank you for submitting <strong className="text-foreground">{formData.name}</strong>. Our editorial team fact-checks all listings, verifies license & offline hosting claims, and adds structured comparison data before publishing.
          </p>

          <div className="p-4 rounded-lg bg-card border border-border text-left max-w-md mx-auto space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Product Name:</span>
              <span className="font-semibold text-foreground">{formData.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">Primary Category:</span>
              <span className="text-foreground">{formData.primaryCategory}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-muted-foreground">License Architecture:</span>
              <span className="text-foreground">
                {formData.isOpenWeight ? `Open Weights (${formData.licenseType})` : 'Proprietary'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Submitter Contact:</span>
              <span className="text-foreground">{formData.contactEmail}</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/tools">
              <Button className="w-full sm:w-auto gap-2">
                <ArrowLeft className="w-4 h-4" /> Return to Directory
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  name: '',
                  company: '',
                  websiteUrl: '',
                  repositoryUrl: '',
                  docsUrl: '',
                  summary: '',
                  description: '',
                  primaryCategory: 'AI Assistants',
                  categories: ['AI Assistants'],
                  tags: [],
                  supportedModalities: ['Text'],
                  pricingModel: 'Freemium',
                  pricingSummary: '',
                  hasFreePlan: true,
                  hasFreeTrial: false,
                  platforms: ['Web'],
                  apiAvailable: false,
                  openSource: false,
                  isOpenWeight: false,
                  licenseType: 'Proprietary',
                  supportsOfflineHosting: false,
                  deploymentOptions: ['Cloud SaaS'],
                  minimumHardwareRequirements: '',
                  contactEmail: '',
                  verificationEvidenceUrl: '',
                  notesForEditorial: '',
                });
              }}
            >
              Submit Another Tool
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4 md:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to AI Tools Directory
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" /> Developer & Creator Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            Submit an AI Tool for Editorial Indexing
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Submit your software, model, or developer tool for inclusion in the AIDetector.cx Directory. We maintain strict factual standards: no paid ranking bias, clear open-weight licensing badges, and verified offline hosting capabilities.
          </p>
        </div>

        {/* Editorial Policy Note */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-foreground">Editorial Integrity Guarantee</span>
              <p className="text-muted-foreground leading-relaxed">
                All submissions undergo manual verification. We do not accept payment to rank tools higher or fabricate positive ratings. We objectively evaluate modalities, pricing tiers, self-hosting requirements, and technical documentation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Identity */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Product Identity & Links
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Basic names, urls, and developer identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tool / Model Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Ollama, LM Studio, DeepSeek V3"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Company / Creator / Org *</Label>
                  <Input
                    required
                    placeholder="e.g. Ollama Inc, DeepSeek AI, Open-Source"
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className="text-xs bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Official Website URL *</Label>
                  <Input
                    required
                    type="url"
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                    onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Repository / Source URL</Label>
                  <Input
                    type="url"
                    placeholder="https://github.com/org/repo"
                    value={formData.repositoryUrl}
                    onChange={e => setFormData({ ...formData, repositoryUrl: e.target.value })}
                    className="text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Documentation URL</Label>
                  <Input
                    type="url"
                    placeholder="https://docs.example.com"
                    value={formData.docsUrl}
                    onChange={e => setFormData({ ...formData, docsUrl: e.target.value })}
                    className="text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">One-Sentence Summary *</Label>
                <Input
                  required
                  maxLength={160}
                  placeholder="Concise, factual description of what the tool accomplishes (max 160 chars)"
                  value={formData.summary}
                  onChange={e => setFormData({ ...formData, summary: e.target.value })}
                  className="text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Detailed Overview & Capabilities</Label>
                <Textarea
                  rows={3}
                  placeholder="Provide technical architecture details, main use cases, and feature differentiators."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="text-xs bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Categories, Modalities & Platform */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Categorization & Capabilities
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Specify primary software domain and input/output modalities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Primary Category *</Label>
                  <Select
                    value={formData.primaryCategory}
                    onValueChange={val =>
                      setFormData(prev => ({
                        ...prev,
                        primaryCategory: val,
                        categories: Array.from(new Set([val, ...prev.categories])),
                      }))
                    }
                  >
                    <SelectTrigger className="text-xs bg-background">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Keywords / Tags (Press Enter)</Label>
                  <Input
                    placeholder="e.g. LLM, Local, Privacy, vLLM, GGUF"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="text-xs bg-background"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5 min-h-6">
                    {formData.tags.map(t => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="text-[10px] cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemoveTag(t)}
                      >
                        {t} ✕
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Supported Modalities */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Supported Modalities *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MODALITIES.map(mod => (
                    <label
                      key={mod}
                      className="flex items-center gap-2 p-2 rounded-md border border-border bg-background cursor-pointer hover:border-primary/50 text-xs"
                    >
                      <Checkbox
                        checked={formData.supportedModalities.includes(mod)}
                        onCheckedChange={() => handleModalityToggle(mod)}
                      />
                      <span>{mod}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Supported Platforms */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Supported Platforms *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PLATFORMS.map(plat => (
                    <label
                      key={plat}
                      className="flex items-center gap-2 p-2 rounded-md border border-border bg-background cursor-pointer hover:border-primary/50 text-xs"
                    >
                      <Checkbox
                        checked={formData.platforms.includes(plat)}
                        onCheckedChange={() => handlePlatformToggle(plat)}
                      />
                      <span>{plat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Open Weights, Licensing & Offline Hosting (NEW REQUIREMENT) */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" /> Open-Weight & Offline Hosting Architecture
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Deep architectural transparency: verify open weight licenses, local hosting capabilities, and air-gapped readiness.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-background/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Open-Weight Model / Tool</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Weights or executable binaries are downloadable and inspectable
                    </p>
                  </div>
                  <Switch
                    checked={formData.isOpenWeight}
                    onCheckedChange={c => setFormData({ ...formData, isOpenWeight: c })}
                  />
                </div>

                <div className="p-3 rounded-lg border border-border bg-background/50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Supports Offline Hosting</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Runs locally without sending telemetry or data to cloud servers
                    </p>
                  </div>
                  <Switch
                    checked={formData.supportsOfflineHosting}
                    onCheckedChange={c => setFormData({ ...formData, supportsOfflineHosting: c })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">License Type *</Label>
                  <Select
                    value={formData.licenseType}
                    onValueChange={val => setFormData({ ...formData, licenseType: val })}
                  >
                    <SelectTrigger className="text-xs bg-background">
                      <SelectValue placeholder="Select License" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Proprietary" className="text-xs">
                        Proprietary (Closed Source / API only)
                      </SelectItem>
                      <SelectItem value="Apache 2.0" className="text-xs">
                        Apache 2.0 (Permissive Open Source)
                      </SelectItem>
                      <SelectItem value="MIT" className="text-xs">
                        MIT License (Permissive Open Source)
                      </SelectItem>
                      <SelectItem value="GPL v3" className="text-xs">
                        GPL v3 (Copyleft Open Source)
                      </SelectItem>
                      <SelectItem value="Llama 3 Community" className="text-xs">
                        Llama 3 Community License (Open Weights)
                      </SelectItem>
                      <SelectItem value="DeepSeek Open License" className="text-xs">
                        DeepSeek Open License (Open Weights)
                      </SelectItem>
                      <SelectItem value="Custom Open Weights" className="text-xs">
                        Custom Open Weights / Research License
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Minimum Hardware Requirements (If Local)</Label>
                  <Input
                    placeholder="e.g. 8GB RAM, Apple M-Series or 6GB VRAM GPU"
                    value={formData.minimumHardwareRequirements || ''}
                    onChange={e =>
                      setFormData({ ...formData, minimumHardwareRequirements: e.target.value })
                    }
                    className="text-xs bg-background"
                  />
                </div>
              </div>

              {/* Deployment Modes */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Supported Deployment Modes *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEPLOYMENT_MODES.map(mode => (
                    <label
                      key={mode}
                      className="flex items-center gap-2 p-2 rounded-md border border-border bg-background cursor-pointer hover:border-primary/50 text-xs"
                    >
                      <Checkbox
                        checked={formData.deploymentOptions.includes(mode)}
                        onCheckedChange={() => handleDeploymentToggle(mode)}
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Pricing & Developer API */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Pricing Model & Commercial Terms
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Transparently declare costs, free tiers, and API availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Pricing Model *</Label>
                  <Select
                    value={formData.pricingModel}
                    onValueChange={(val: PricingModel) =>
                      setFormData({ ...formData, pricingModel: val })
                    }
                  >
                    <SelectTrigger className="text-xs bg-background">
                      <SelectValue placeholder="Select Pricing Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_MODELS.map(pm => (
                        <SelectItem key={pm} value={pm} className="text-xs">
                          {pm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Pricing Summary *</Label>
                  <Input
                    required
                    placeholder="e.g. Free open-source; Pro cloud hosting at $10/month"
                    value={formData.pricingSummary}
                    onChange={e => setFormData({ ...formData, pricingSummary: e.target.value })}
                    className="text-xs bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-border bg-background/50 flex items-center justify-between">
                  <Label className="text-xs">Has Free Tier / Version</Label>
                  <Switch
                    checked={formData.hasFreePlan}
                    onCheckedChange={c => setFormData({ ...formData, hasFreePlan: c })}
                  />
                </div>
                <div className="p-3 rounded-lg border border-border bg-background/50 flex items-center justify-between">
                  <Label className="text-xs">Offers Free Trial</Label>
                  <Switch
                    checked={formData.hasFreeTrial}
                    onCheckedChange={c => setFormData({ ...formData, hasFreeTrial: c })}
                  />
                </div>
                <div className="p-3 rounded-lg border border-border bg-background/50 flex items-center justify-between">
                  <Label className="text-xs">Developer REST / SDK API</Label>
                  <Switch
                    checked={formData.apiAvailable}
                    onCheckedChange={c => setFormData({ ...formData, apiAvailable: c })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Submitter Contact & Editorial Verification */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" /> Contact & Verification Evidence
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                We will email you once your listing is verified and published.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Submitter / Developer Email *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="developer@example.com"
                    value={formData.contactEmail}
                    onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Pricing / Benchmark Evidence Link</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com/pricing or benchmark URL"
                    value={formData.verificationEvidenceUrl || ''}
                    onChange={e =>
                      setFormData({ ...formData, verificationEvidenceUrl: e.target.value })
                    }
                    className="text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Notes for Editorial Staff</Label>
                <Textarea
                  rows={2}
                  placeholder="Any specific architectural details, verified benchmark scores, or release schedules you'd like our editors to note."
                  value={formData.notesForEditorial || ''}
                  onChange={e =>
                    setFormData({ ...formData, notesForEditorial: e.target.value })
                  }
                  className="text-xs bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>No spam, guaranteed factual review, zero paid placement bias</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link to="/tools" className="w-full sm:w-auto">
                <Button variant="outline" type="button" className="w-full sm:w-auto text-xs">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="w-full sm:w-auto gap-2 text-xs">
                <Send className="w-3.5 h-3.5" /> Submit for Editorial Review
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
