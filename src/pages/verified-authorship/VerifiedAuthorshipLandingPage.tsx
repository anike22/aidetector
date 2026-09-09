import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck, ArrowRight, Lock, CheckCircle2, Search, Sparkles,
  FileText, QrCode, Share2, Globe, Scale, Users, Layers, Zap,
  HelpCircle, ChevronDown, Award
} from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';

export default function VerifiedAuthorshipLandingPage() {
  const [trackingQuery, setTrackingQuery] = useState('');
  const navigate = useNavigate();

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackingQuery.trim().toUpperCase();
    if (!clean) return;
    navigate(`/verify/${clean}`);
  };

  return (
    <MainLayout>
      <PageMeta
        title="Verified Authorship — Cryptographic Proof of Creation & Integrity | AIDetector.cx"
        description="Establish timestamped, verifiable proof of human authorship and original creation with AIDetector.cx cryptographic manifests and integrity gating."
      />
      <div className="space-y-20 pb-20">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
            <Badge variant="outline" className="px-3 py-1 text-xs text-primary border-primary/30 gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> The Standard in Verifiable Content Authorship
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl mx-auto text-balance">
              Cryptographic Proof of <span className="text-primary">Human Creation</span> & Originality
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Protect your intellectual work before publication. Screen against AI writing models and originality databases, anchor deterministic SHA-256 fingerprints, and share verifiable public certificates with zero text leakage.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button asChild size="lg" className="gap-2 px-6">
                <Link to="/verified-authorship/register">
                  Register Your Work <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-6">
                <Link to="/authorship/dashboard">Owner Dashboard</Link>
              </Button>
            </div>

            {/* Tracking Code Quick Search */}
            <div className="max-w-md mx-auto pt-8">
              <form onSubmit={handleLookup} className="flex items-center gap-2 p-1.5 bg-card rounded-xl border shadow-sm">
                <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
                <Input
                  placeholder="Enter tracking code (e.g., ADC-AUTH-...)"
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 shadow-none text-xs font-mono"
                />
                <Button type="submit" size="sm" variant="secondary" className="shrink-0 text-xs">
                  Verify Certificate
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* 2. How It Works (3-Step Workflow) */}
        <section className="max-w-6xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">The Verification Workflow</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              A comprehensive three-stage gating mechanism designed for maximum rigor and cryptographic integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold mb-2">
                  1
                </div>
                <CardTitle className="text-lg">Manuscript Ingestion</CardTitle>
                <CardDescription className="text-xs">
                  Upload DOCX, PDF, RTF, Markdown, or paste raw text. The engine runs strict V1.0 canonicalization.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Normalizes Unicode NFC, removes invisible zero-width characters, and standardizes punctuation into a deterministic base.
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold mb-2">
                  2
                </div>
                <CardTitle className="text-lg">Integrity Gate Screening</CardTitle>
                <CardDescription className="text-xs">
                  Multi-model AI detection, originality database checks, and collision detection must pass before registration.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Verifies human authorship patterns, scores plagiarism resistance, and prevents duplicate claim collisions.
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 font-bold mb-2">
                  3
                </div>
                <CardTitle className="text-lg">Cryptographic Attestation</CardTitle>
                <CardDescription className="text-xs">
                  Generates an ECDSA P-256 digital signature, RFC-3161 timestamp, and high-entropy tracking code.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Receive interactive public certificates, dynamic SVG badges, CMS embed codes, and full evidence proof packages.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. Zero-Retention & Privacy Guarantee */}
        <section className="max-w-5xl mx-auto px-4">
          <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-2.5 text-primary">
              <Lock className="w-6 h-6" />
              <h3 className="text-xl font-bold">Zero-Leakage Privacy Architecture</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your registered manuscript is stored confidentially in encrypted storage and is <strong>never displayed on public certificates, transmitted to third-party search engines, or exposed via public APIs</strong>. Public certificates only present title, author metadata, cryptographic hash fingerprints, and integrity gate verification badges.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> AES-256 Storage Encryption
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Private Content Comparison
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Search-Engine Safe Metadata
              </div>
            </div>
          </div>
        </section>

        {/* 4. Plan Comparison */}
        <section className="max-w-6xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Simple, Transparent Plans</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Select the right tier for freelance writers, publishers, or enterprise organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Free</CardTitle>
                <CardDescription className="text-xs">Individual exploration</CardDescription>
                <div className="text-2xl font-bold pt-2">$0</div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs flex-1">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 1 Active Certificate</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Public Verification Page</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Basic Markdown Badge</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Basic QR Code</div>
              </CardContent>
            </Card>

            <Card className="flex flex-col border-primary/40 relative shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground text-[10px]">MOST POPULAR</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Pro</CardTitle>
                <CardDescription className="text-xs">Freelancers & Authors</CardDescription>
                <div className="text-2xl font-bold pt-2">$19<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs flex-1">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Unlimited Certificates</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PDF Official Certificates</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> WordPress & Ghost Embeds</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Full Version Tree History</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verification Analytics</div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Business</CardTitle>
                <CardDescription className="text-xs">Publishers & Agencies</CardDescription>
                <div className="text-2xl font-bold pt-2">$79<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs flex-1">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Batch Registration</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enterprise REST API Access</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Organization Profiles</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Priority Dispute Arbitration</div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Enterprise</CardTitle>
                <CardDescription className="text-xs">Institutions & Universities</CardDescription>
                <div className="text-2xl font-bold pt-2">Custom</div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs flex-1">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> High-Volume Pipeline</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Custom Certificate Branding</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dedicated Key Management</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Full Audit Exports & SLAs</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 5. Frequently Asked Questions */}
        <section className="max-w-4xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground">Clear answers regarding legal status, privacy, and verification.</p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm">Does this certificate replace government copyright registration?</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground pt-0 leading-relaxed">
                No. AIDetector.cx records a timestamped, cryptographically verifiable authorship claim. It serves as strong corroborating evidence of prior possession and originality screening, but does not constitute government copyright registration.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm">How does the zero-leakage Content Comparison work?</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground pt-0 leading-relaxed">
                When a visitor pastes text into the verification portal, the text is canonicalized and hashed in volatile memory on the server. The resulting SHA-256 hash is compared against the registered version. The comparison text is never saved to a database, file, or log.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm">What happens if someone submits a false claim to my work?</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground pt-0 leading-relaxed">
                Every public certificate features a &ldquo;Report This Authorship Claim&rdquo; mechanism. Disputed certificates enter administrative review where evidence is evaluated, and certificates found in violation are revoked with full audit preservation.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 6. Bottom CTA */}
        <section className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="p-10 rounded-3xl bg-primary text-primary-foreground space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Ready to verify your authorship?</h2>
            <p className="text-sm text-primary-foreground/80 max-w-xl mx-auto">
              Join thousands of journalists, researchers, and creators anchoring their works with AIDetector.cx.
            </p>
            <div className="pt-2">
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link to="/verified-authorship/register">
                  Start Registration <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
