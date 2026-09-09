import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ShieldCheck, CheckCircle2, QrCode, Lock, Globe, ExternalLink,
  AlertTriangle, FileText, ArrowRight, Printer, Copy, Search, ShieldAlert,
  Sparkles, Award, Share2
} from 'lucide-react';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import { fetchPublicCertificate } from '@/lib/verifiedAuthorship/authorshipService';
import type { AuthorshipPublicCertificate } from '@/lib/verifiedAuthorship/types';
import { compareVisitorContent, type ContentComparisonResult } from '@/lib/verifiedAuthorship/contentComparisonService';
import { buildAuthorshipSeo } from '@/lib/verifiedAuthorship/seoUtils';
import AuthorshipDisputeModal from '@/components/verified-authorship/AuthorshipDisputeModal';
import AuthorshipExportModal from '@/components/verified-authorship/AuthorshipExportModal';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';

export default function VerifyPublicTrackingCodePage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [cert, setCert] = useState<AuthorshipPublicCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Content Comparison State
  const [candidateText, setCandidateText] = useState('');
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ContentComparisonResult | null>(null);

  useEffect(() => {
    if (!trackingCode) return;
    async function load() {
      setLoading(true);
      const result = await fetchPublicCertificate(trackingCode!);
      setCert(result);
      setLoading(false);
    }
    load();
  }, [trackingCode]);

  const handleCopyCode = () => {
    if (!trackingCode) return;
    navigator.clipboard.writeText(trackingCode);
    toast.success('Tracking code copied to clipboard');
  };

  const handleCompare = async () => {
    if (!trackingCode || !candidateText.trim()) {
      toast.error('Please paste the manuscript or excerpt text to compare');
      return;
    }

    setComparing(true);
    setComparisonResult(null);

    const result = await compareVisitorContent(trackingCode, candidateText, 'v1.0');
    setComparisonResult(result);
    setComparing(false);

    if (result.matchStatus === 'exact_match_current') {
      toast.success('Exact cryptographic match confirmed with current version!');
    } else if (result.matchStatus === 'exact_match_earlier') {
      toast.info(`Exact cryptographic match confirmed with version ${result.versionNumber}!`);
    } else if (result.matchStatus === 'no_match') {
      toast.error('No exact cryptographic match found.');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground text-sm">Querying verified authorship cryptographic registry...</p>
        </div>
      </MainLayout>
    );
  }

  if (!cert) {
    return (
      <MainLayout>
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Certificate Not Found or Suspended</h1>
          <p className="text-muted-foreground text-sm">
            Tracking code <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{trackingCode}</code> could not be found or has been revoked.
          </p>
          <Button asChild variant="outline">
            <Link to="/verified-authorship/verify">Search Registry Portal</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const publicUrl = window.location.href;

  return (
    <MainLayout>
      <PageMeta
        title={`Verified Authorship Certificate — ${cert.title} | AIDetector.cx`}
        description={`Verifiable public authorship certificate for "${cert.title}". Tracking code: ${cert.trackingCode}.`}
      />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Certificate Banner Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-md print:shadow-none">
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" /> Registered with AIDetector.cx
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize font-mono">
                    Status: {cert.status}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    v{cert.currentVersionNumber || 1}.0
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {cert.title}
                </h1>
                {cert.subtitle && (
                  <p className="text-muted-foreground font-serif text-sm italic">{cert.subtitle}</p>
                )}
              </div>

              <div className="flex items-center gap-2 print:hidden shrink-0">
                <Button variant="default" size="sm" onClick={() => setExportOpen(true)} className="gap-1 text-xs">
                  <Share2 className="w-3.5 h-3.5" /> Export & Embed
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1 text-xs">
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDisputeOpen(true)} className="text-xs text-muted-foreground hover:text-destructive">
                  Report Claim
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Tracking Code and QR Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-muted/40 border">
              <div className="md:col-span-2 space-y-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    Cryptographic Tracking Code
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="text-base md:text-lg font-mono font-bold text-primary bg-background px-2.5 py-1 rounded border">
                      {cert.trackingCode}
                    </code>
                    <Button variant="ghost" size="icon" onClick={handleCopyCode} className="h-8 w-8 print:hidden">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block">Author:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {cert.collaborators?.[0]?.name || 'Attested Creator'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Registered Date:</span>
                    <span className="font-semibold">{new Date(cert.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Content Format:</span>
                    <span className="font-semibold capitalize">{cert.category || 'Article'} ({cert.language?.toUpperCase() || 'EN'})</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Canonical Hash:</span>
                    <span className="font-mono text-[11px] text-muted-foreground truncate block" title={cert.contentHash}>
                      {cert.contentHash.slice(0, 16)}...{cert.contentHash.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-lg border text-center space-y-2">
                <QRCodeDataUrl text={publicUrl} width={110} />
                <span className="text-[10px] text-muted-foreground font-mono">Scan to Verify</span>
              </div>
            </div>

            {/* Eligibility Badges */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Passed AIDetector.cx Authorship Eligibility Checks
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">AI Screening Passed</p>
                    <p className="text-[11px] text-muted-foreground">Balanced Engine Verified</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Originality Passed</p>
                    <p className="text-[11px] text-muted-foreground">&gt;= 90% Originality Score</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Identity Attested</p>
                    <p className="text-[11px] text-muted-foreground">Signed Declaration</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-card flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Active Claim</p>
                    <p className="text-[11px] text-muted-foreground">No Upheld Infringement</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Tabs: Overview vs Compare Content */}
            <Tabs defaultValue="overview" className="space-y-4 print:hidden">
              <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="overview" className="gap-2">
                  <FileText className="w-4 h-4" /> Certificate Summary
                </TabsTrigger>
                <TabsTrigger value="compare" className="gap-2">
                  <Search className="w-4 h-4" /> Compare Content
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="p-4 rounded-lg border bg-card space-y-3">
                  <h3 className="text-sm font-semibold">Creation Declaration</h3>
                  <div className="inline-block px-3 py-1.5 rounded bg-muted text-xs font-mono">
                    Declaration Category: <span className="font-semibold text-primary">{cert.declarationLabel || cert.declarationType || 'Human-written work with verified screening'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The author has executed a cryptographically bound declaration confirming authorship and lawful entitlement.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="compare" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Instant Cryptographic Content Comparison</CardTitle>
                    <CardDescription className="text-xs">
                      Paste manuscript text you possess to verify if it exactly matches the registered version.
                      <strong className="block text-foreground mt-1">
                        Zero Retention Guarantee: Comparison text is evaluated entirely in volatile memory and is never stored, logged, or retained.
                      </strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="candidateText" className="text-xs font-semibold">Manuscript Text to Compare</Label>
                      <Textarea
                        id="candidateText"
                        rows={5}
                        placeholder="Paste the full text or section you want to verify against this certificate..."
                        value={candidateText}
                        onChange={(e) => setCandidateText(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>

                    <Button onClick={handleCompare} disabled={comparing} className="gap-2">
                      {comparing ? 'Calculating Hash & Comparing...' : 'Compare Against Registered Hash'}
                      <Search className="w-4 h-4" />
                    </Button>

                    {comparisonResult && (
                      <div className={`p-4 rounded-lg border ${
                        comparisonResult.matchStatus.startsWith('exact_match')
                          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          {comparisonResult.matchStatus.startsWith('exact_match') ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1 text-xs">
                            <p className="font-bold uppercase tracking-wider">
                              {comparisonResult.matchStatus.replace(/_/g, ' ')}
                            </p>
                            <p>{comparisonResult.details}</p>
                            <p className="text-[10px] opacity-75 font-mono pt-1">
                              Canonicalization: {comparisonResult.canonicalizationVersion || 'v1.0'} | Checked at {new Date(comparisonResult.comparedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Legal Disclaimer */}
            <div className="p-4 rounded-lg bg-muted/60 border border-muted text-[11px] text-muted-foreground leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Lock className="w-3.5 h-3.5" /> Notice & Legal Disclaimer
              </div>
              <p>
                AIDetector.cx records a timestamped, cryptographically verifiable authorship claim. This certificate is not government copyright registration and does not independently establish legal ownership. AI detection results are probabilistic screening signals. Detection percentages represent writing-pattern signals and do not measure the literal percentage written by a human or AI.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AuthorshipDisputeModal
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        registrationId={cert.id || cert.trackingCode}
        trackingCode={cert.trackingCode}
        workTitle={cert.title}
      />

      <AuthorshipExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        certificate={cert}
      />
    </MainLayout>
  );
}
