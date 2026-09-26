import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Download,
  Share2,
  ExternalLink,
  Lock,
  Search,
  Scale,
  Calendar,
  User,
  Hash,
  Globe,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchPublicCertificate, verifyHashOrContent } from '@/lib/verifiedAuthorship/authorshipService';
import { computeContentSHA256 } from '@/lib/verifiedAuthorship/cryptoUtils';
import AuthorshipDisputeModal from '@/components/verified-authorship/AuthorshipDisputeModal';
import type { AuthorshipPublicCertificate } from '@/lib/verifiedAuthorship/types';

export default function AuthorshipCertificatePage() {
  const { id } = useParams<{ id: string }>();

  const [certificate, setCertificate] = useState<AuthorshipPublicCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  // Hash verification interactive box
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<{
    tested: boolean;
    isMatch: boolean;
    computedHash?: string;
  }>({ tested: false, isMatch: false });
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPublicCertificate(id)
      .then((data) => {
        setCertificate(data);
      })
      .catch((err) => {
        console.error('Failed to load certificate:', err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleVerifyContentOrHash = async () => {
    if (!verifyInput.trim()) return;
    setIsVerifying(true);
    try {
      const isHashFormat = /^[0-9a-f]{64}$/i.test(verifyInput.trim());
      const computed = isHashFormat
        ? verifyInput.trim().toLowerCase()
        : await computeContentSHA256(verifyInput);

      const isMatch = certificate ? computed === certificate.contentHash.toLowerCase() : false;
      setVerifyResult({
        tested: true,
        isMatch,
        computedHash: computed,
      });
    } catch (err) {
      toast.error('Failed to compute hash verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const printCertificate = () => {
    window.print();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3">
            <ShieldCheck className="w-10 h-10 text-accent animate-pulse mx-auto" />
            <p className="text-sm font-serif text-muted-foreground">Retrieving Authorship Certificate...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!certificate) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full border text-center p-6 space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-serif font-bold">Certificate Not Found</h2>
            <p className="text-xs text-muted-foreground">
              No active or published authorship claim was found matching this tracking code or record
              identifier.
            </p>
            <Button asChild variant="outline" className="text-xs">
              <Link to="/verified-authorship/verify">Verify Another Tracking Code</Link>
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const isSuspended = certificate.status === 'suspended';
  const isRevoked = certificate.status === 'revoked';

  return (
    <MainLayout>
      <PageMeta
        title={`Authorship Certificate: ${certificate.title} | AIDetector.cx`}
        description={`Cryptographically verified Authorship Certificate for "${certificate.title}" (${certificate.trackingCode}). Registered with AIDetector.cx.`}
      />

      <div className="min-h-screen bg-background py-8 md:py-12 print:py-0 print:bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Top action toolbar (hidden on print) */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/verified-authorship/verify">← Authorship Portal</Link>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={printCertificate}
                className="gap-1.5 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(window.location.href, 'Certificate URL')}
                className="gap-1.5 text-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDisputeModalOpen(true)}
                className="gap-1.5 text-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Report Claim
              </Button>
            </div>
          </div>

          {/* Revoked / Suspended Alert */}
          {isRevoked && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/40 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif font-bold text-sm text-destructive">Certificate Revoked</h3>
                <p className="text-xs text-destructive/90 mt-0.5">
                  This authorship registration was revoked on {new Date(certificate.revokedAt!).toLocaleDateString()}.
                  {certificate.revocationReason && ` Reason: ${certificate.revocationReason}`}
                </p>
              </div>
            </div>
          )}

          {isSuspended && (
            <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif font-bold text-sm text-amber-700 dark:text-amber-300">
                  Registration Under Administrative Review
                </h3>
                <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-0.5">
                  This certificate has been temporarily suspended pending dispute investigation.
                </p>
              </div>
            </div>
          )}

          {/* Certificate Main Card */}
          <div className="border-2 border-primary/20 rounded-xl bg-card shadow-lg p-6 md:p-10 relative overflow-hidden print:border print:shadow-none">
            {/* Watermark / Header seal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 text-accent font-serif tracking-widest text-xs font-bold uppercase mb-1">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span>AIDetector.cx Verified Authorship</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                  Authorship Certificate
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Cryptographic Registration & Integrity Attestation Record
                </p>
              </div>

              <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 shrink-0">
                <Badge className="bg-primary text-primary-foreground text-xs py-1 px-3">
                  Registered with AIDetector.cx
                </Badge>
                <Badge variant="outline" className="border-accent text-accent text-[11px] py-0.5">
                  Passed AIDetector.cx Authorship Eligibility Checks
                </Badge>
              </div>
            </div>

            {/* Work Information */}
            <div className="py-6 space-y-4 border-b">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Registered Work Title
                </span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mt-0.5">
                  {certificate.title}
                </h2>
                {certificate.subtitle && (
                  <p className="text-sm font-serif text-muted-foreground mt-0.5 italic">
                    {certificate.subtitle}
                  </p>
                )}
              </div>

              {certificate.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {certificate.description}
                </p>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Tracking Code
                  </span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-foreground mt-0.5">
                    <span>{certificate.trackingCode}</span>
                    <button
                      onClick={() => copyToClipboard(certificate.trackingCode, 'Tracking Code')}
                      className="text-muted-foreground hover:text-foreground print:hidden"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Registration Date
                  </span>
                  <div className="font-medium text-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span>{new Date(certificate.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Category & Language
                  </span>
                  <div className="font-medium text-foreground mt-0.5">
                    {certificate.category || 'General'} ({certificate.language.toUpperCase()})
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Word Count / Version
                  </span>
                  <div className="font-medium text-foreground mt-0.5">
                    {certificate.wordCount.toLocaleString()} words (v{certificate.currentVersionNumber})
                  </div>
                </div>
              </div>

              {/* Collaborators if present */}
              {certificate.collaborators && certificate.collaborators.length > 0 && (
                <div className="pt-2 text-xs">
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold block mb-1">
                    Declared Co-Authors & Contributors
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {certificate.collaborators.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        <User className="w-3 h-3 mr-1 text-muted-foreground" />
                        {c.name} {c.role && `(${c.role})`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Creation Declaration Section */}
            <div className="py-6 border-b space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Signed Creation Declaration
              </span>
              <div className="p-4 rounded-lg bg-muted/40 border text-xs space-y-1.5">
                <div className="flex items-center justify-between font-serif font-bold text-sm text-foreground">
                  <span>{certificate.declarationLabel}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Signed: {new Date(certificate.declarationSignedAt).toLocaleString()}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-pretty leading-relaxed">
                  The registrant affirmed under penalty of dispute that this work is original, authorized,
                  and composed according to the declared creation profile without unauthorized third-party copying.
                </p>
              </div>
            </div>

            {/* Cryptographic Content Hash */}
            <div className="py-6 border-b space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Cryptographic Canonical Content Hash (SHA-256)
              </span>
              <div className="p-3 bg-muted/50 rounded-lg border font-mono text-xs break-all flex items-center justify-between gap-2">
                <span className="text-foreground">{certificate.contentHash}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 shrink-0 print:hidden"
                  onClick={() => copyToClipboard(certificate.contentHash, 'Content Hash')}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                To protect author privacy, the full text is not exposed publicly. Anyone possessing the genuine
                manuscript can compute its SHA-256 hash to confirm an exact mathematical match.
              </p>
            </div>

            {/* Integrity Gate Screening Results */}
            <div className="py-6 border-b space-y-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Integrity Gate Eligibility Summary
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                    Balanced AI Engine
                  </span>
                  <div className="font-serif font-bold text-base text-foreground">
                    {certificate.integrityGateSummary.balancedAiScore}% AI Signal
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {certificate.integrityGateSummary.balancedVerdict}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                    Originality Screening
                  </span>
                  <div className="font-serif font-bold text-base text-foreground">
                    {certificate.integrityGateSummary.plagiarismOriginalityScore}% Original
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Scholarly Index Verified
                  </Badge>
                </div>

                <div className="p-3 rounded-lg border bg-card space-y-1">
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                    Registry Collision Check
                  </span>
                  <div className="font-serif font-bold text-base text-foreground">
                    {certificate.integrityGateSummary.duplicateCheckVerdict}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    No Cross-Account Collision
                  </Badge>
                </div>
              </div>
            </div>

            {/* Legal Disclaimer Box */}
            <div className="pt-6 space-y-2 text-[11px] text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Scale className="w-3.5 h-3.5 text-accent" />
                <span>Notice & Limitations</span>
              </div>
              <p>{certificate.legalDisclaimer}</p>
            </div>
          </div>

          {/* Interactive Hash & Content Verifier Box (Visitor Utility) */}
          <Card className="mt-8 border shadow-sm print:hidden">
            <CardHeader>
              <CardTitle className="text-base font-serif flex items-center gap-2">
                <Search className="w-4 h-4 text-accent" />
                Verify Content Possession Against This Certificate
              </CardTitle>
              <CardDescription className="text-xs text-pretty">
                Paste the manuscript text or a SHA-256 hash you hold to mathematically verify that it
                matches this registered certificate. Your input is checked locally in your browser and is
                never stored.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste the text you wish to verify, or enter a 64-character SHA-256 hash..."
                rows={3}
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                className="text-xs font-mono"
              />

              <div className="flex items-center justify-between">
                <Button
                  onClick={handleVerifyContentOrHash}
                  disabled={!verifyInput.trim() || isVerifying}
                  size="sm"
                  className="gap-2 text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isVerifying ? 'Verifying...' : 'Verify Content Match'}
                </Button>

                {verifyResult.tested && (
                  <div className="flex items-center gap-2">
                    {verifyResult.isMatch ? (
                      <Badge className="bg-emerald-600 text-white text-xs py-1 px-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Exact Mathematical Match Verified
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs py-1 px-3 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Hash Does Not Match Registered Work
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dispute Modal */}
          <AuthorshipDisputeModal
            open={disputeModalOpen}
            onOpenChange={setDisputeModalOpen}
            registrationId={certificate.id}
            trackingCode={certificate.trackingCode}
            workTitle={certificate.title}
          />
        </div>
      </div>
    </MainLayout>
  );
}
