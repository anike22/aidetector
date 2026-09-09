import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Search,
  Hash,
  FileCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchPublicCertificate,
  verifyHashOrContent,
} from '@/lib/verifiedAuthorship/authorshipService';
import type { AuthorshipPublicCertificate } from '@/lib/verifiedAuthorship/types';

export default function VerifyAuthorshipPortalPage() {
  const navigate = useNavigate();

  // Search by tracking code
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [isSearchingCode, setIsSearchingCode] = useState(false);

  // Search by content text or SHA-256 hash
  const [contentInput, setContentInput] = useState('');
  const [isSearchingContent, setIsSearchingContent] = useState(false);
  const [contentSearchResult, setContentSearchResult] = useState<{
    searched: boolean;
    isMatch: boolean;
    record?: AuthorshipPublicCertificate;
    computedHash?: string;
  }>({ searched: false, isMatch: false });

  const handleSearchTrackingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingCodeInput.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a tracking code.');
      return;
    }

    setIsSearchingCode(true);
    try {
      const cert = await fetchPublicCertificate(code);
      if (cert) {
        navigate(`/verified-authorship/${cert.id}/certificate`);
      } else {
        toast.error('No registration found for this tracking code.');
      }
    } catch (err) {
      toast.error('Failed to look up tracking code.');
    } finally {
      setIsSearchingCode(false);
    }
  };

  const handleSearchContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentInput.trim()) {
      toast.error('Please enter content or a SHA-256 hash to verify.');
      return;
    }

    setIsSearchingContent(true);
    try {
      const res = await verifyHashOrContent(contentInput);
      setContentSearchResult({
        searched: true,
        isMatch: res.isMatch,
        record: res.matchedRecord,
        computedHash: res.computedHash,
      });
      if (res.isMatch) {
        toast.success('Matching Authorship Certificate found!');
      } else {
        toast.info('No registered authorship claim matches this hash.');
      }
    } catch (err) {
      toast.error('Failed to verify content.');
    } finally {
      setIsSearchingContent(false);
    }
  };

  return (
    <MainLayout>
      <PageMeta
        title="Verify Authorship | Public Verification Portal | AIDetector.cx"
        description="Verify authorship claims and check tracking codes or cryptographic hashes against the AIDetector.cx Verified Authorship registry."
      />

      <div className="min-h-screen bg-background py-10 md:py-16">
        <div className="container max-w-4xl mx-auto px-4 space-y-10">
          {/* Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent font-serif text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OFFICIAL REGISTRY LOOKUP</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground tracking-tight">
              Verify Authorship
            </h1>
            <p className="text-sm md:text-base text-muted-foreground text-pretty leading-relaxed">
              Verify timestamped authorship claims, inspect eligibility badges, and validate cryptographic
              content hashes against the AIDetector.cx registry.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Method 1: Tracking Code Lookup */}
            <Card className="border shadow-sm flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Hash className="w-5 h-5 text-accent" />
                  Look Up Tracking Code
                </CardTitle>
                <CardDescription className="text-xs text-pretty">
                  Enter an official tracking code formatted as <code className="text-foreground font-mono">VA-YYYY-XXXX-XXXX</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                <form onSubmit={handleSearchTrackingCode} className="space-y-3">
                  <Input
                    placeholder="e.g. VA-2026-9K3E-8A7B"
                    value={trackingCodeInput}
                    onChange={(e) => setTrackingCodeInput(e.target.value)}
                    className="font-mono text-sm uppercase px-3"
                  />
                  <Button
                    type="submit"
                    disabled={!trackingCodeInput.trim() || isSearchingCode}
                    className="w-full gap-2 text-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {isSearchingCode ? 'Searching...' : 'Open Certificate'}
                  </Button>
                </form>
                <p className="text-[11px] text-muted-foreground">
                  Tracking codes are printed on certificates, PDF exports, and published articles.
                </p>
              </CardContent>
            </Card>

            {/* Method 2: Register New Claim CTA */}
            <Card className="border shadow-sm flex flex-col justify-between bg-muted/20">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-primary" />
                  Register Your Original Work
                </CardTitle>
                <CardDescription className="text-xs text-pretty">
                  Protect your authentic writing with cryptographic attestation and an indexable authorship
                  certificate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Dual Balanced & Aggressive AI screening</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Academic & web originality index verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Private zero-exposure SHA-256 content hash</span>
                  </li>
                </ul>
                <Button asChild className="w-full gap-2 text-xs">
                  <Link to="/verified-authorship/register">
                    Register Authorship Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Method 3: Hash or Content Verifier Box */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-serif flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-accent" />
                Verify Text or Content Hash
              </CardTitle>
              <CardDescription className="text-xs text-pretty">
                Paste the content text or a 64-character SHA-256 hash to search for existing registered
                authorship records in the registry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSearchContent} className="space-y-3">
                <Textarea
                  placeholder="Paste complete manuscript text or 64-character hex SHA-256 hash..."
                  rows={4}
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button
                  type="submit"
                  disabled={!contentInput.trim() || isSearchingContent}
                  size="sm"
                  className="gap-2 text-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  {isSearchingContent ? 'Searching Registry...' : 'Verify Hash in Registry'}
                </Button>
              </form>

              {contentSearchResult.searched && (
                <div className="pt-2">
                  {contentSearchResult.isMatch && contentSearchResult.record ? (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-serif font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Registered Authorship Match Found!</span>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-[10px]">
                          {contentSearchResult.record.trackingCode}
                        </Badge>
                      </div>
                      <div className="text-xs text-foreground space-y-1">
                        <p className="font-bold">{contentSearchResult.record.title}</p>
                        <p className="text-muted-foreground">
                          Registered on {new Date(contentSearchResult.record.createdAt).toLocaleDateString()} (
                          {contentSearchResult.record.wordCount.toLocaleString()} words)
                        </p>
                      </div>
                      <Button asChild size="sm" className="text-xs gap-1.5">
                        <Link to={`/verified-authorship/${contentSearchResult.record.id}/certificate`}>
                          View Full Authorship Certificate <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-muted/40 border text-xs space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        <span>No Matching Registration Found</span>
                      </div>
                      <p>
                        The computed hash (<code className="font-mono text-[10px] break-all">{contentSearchResult.computedHash}</code>)
                        does not match any active certificate currently registered on AIDetector.cx.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
