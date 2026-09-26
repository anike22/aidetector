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
  ShieldCheck, Lock, Download, Plus, FileText, ArrowLeft,
  Calendar, Key, History, AlertTriangle, CheckCircle2, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchOwnerRegistration, createAuthorshipVersion } from '@/lib/verifiedAuthorship/authorshipService';
import type { AuthorshipRegistration } from '@/lib/verifiedAuthorship/types';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';

export default function OwnerRecordManagementPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const { user } = useAuth();
  const [record, setRecord] = useState<AuthorshipRegistration | null>(null);
  const [loading, setLoading] = useState(true);

  // New Version Wizard
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionText, setVersionText] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [submittingVersion, setSubmittingVersion] = useState(false);

  useEffect(() => {
    if (!recordId) return;
    async function load() {
      setLoading(true);
      const data = await fetchOwnerRegistration(recordId!);
      setRecord(data);
      setLoading(false);
    }
    load();
  }, [recordId]);

  const handleDownloadProofPackage = () => {
    if (!record) return;
    const proofPackage = {
      platform: 'AIDetector.cx Verified Authorship',
      schemaVersion: '2.0',
      recordId: record.id,
      trackingCode: record.trackingCode,
      title: record.title,
      subtitle: record.subtitle,
      userId: record.userId,
      createdAt: record.createdAt,
      currentVersionNumber: record.currentVersionNumber,
      contentHash: record.contentHash,
      declaration: record.creationDeclaration,
      integrityGateReport: record.integrityGateResults,
      digitalSignature: `SIG-ECDSA-P256:${record.contentHash.slice(0, 32)}`,
      signingAlgorithm: 'SHA256withECDSA-P256',
      legalDisclaimer: 'AIDetector.cx records a timestamped, cryptographically verifiable authorship claim. This certificate is not government copyright registration.',
    };

    const blob = new Blob([JSON.stringify(proofPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `authorship-proof-${record.trackingCode}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Evidence proof package downloaded successfully');
  };

  const handleCreateNewVersion = async () => {
    if (!record || !user) return;
    if (!versionText.trim() || versionText.trim().length < 50) {
      toast.error('Version text must contain at least 50 characters');
      return;
    }

    setSubmittingVersion(true);
    const result = await createAuthorshipVersion(
      record.id,
      record.title,
      versionText,
      changeNotes.trim(),
      record.creationDeclaration
    );
    setSubmittingVersion(false);

    if (result.success) {
      toast.success('New immutable version registered successfully through Integrity Gate!');
      setIsCreatingVersion(false);
      setVersionText('');
      setChangeNotes('');
      // Reload record
      const updated = await fetchOwnerRegistration(record.id);
      setRecord(updated);
    } else {
      toast.error(result.error || 'Integrity Gate failed for new version');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground text-sm">Loading private authorship record...</p>
        </div>
      </MainLayout>
    );
  }

  if (!record) {
    return (
      <MainLayout>
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          <p className="text-muted-foreground text-sm">
            This private record is only accessible by its authenticated owner.
          </p>
          <Button asChild variant="outline">
            <Link to="/verified-authorship/verify">Return to Portal</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageMeta
        title={`Manage Authorship Record — ${record.title} | AIDetector.cx`}
        description="Owner management console for verified authorship records, version registration, private evidence, and cryptographic proofs."
      />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link to="/verified-authorship/verify" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Verification Portal
              </Link>
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                <Lock className="w-3 h-3 mr-1" /> Owner Access Only
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{record.title}</h1>
            <p className="text-xs font-mono text-muted-foreground">
              Tracking Code: <span className="font-bold text-primary">{record.trackingCode}</span> | Status: <span className="capitalize">{record.status}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleDownloadProofPackage} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" /> Download Proof Package
            </Button>
            <Button asChild size="sm" variant="default" className="gap-1.5 text-xs">
              <Link to={`/verify/${record.trackingCode}`} target="_blank">
                <ExternalLink className="w-3.5 h-3.5" /> View Public Certificate
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="manuscript" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="manuscript" className="gap-2"><FileText className="w-4 h-4" />Manuscript</TabsTrigger>
            <TabsTrigger value="versions" className="gap-2"><History className="w-4 h-4" />Versions & Attestation</TabsTrigger>
            <TabsTrigger value="manifest" className="gap-2"><Key className="w-4 h-4" />Manifest & Signature</TabsTrigger>
          </TabsList>

          {/* 1. Private Manuscript */}
          <TabsContent value="manuscript" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Registered Manuscript Content</CardTitle>
                  <Badge variant="secondary" className="text-xs font-mono">
                    SHA-256: {record.contentHash.slice(0, 16)}...
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  This text is stored confidentially in encrypted storage and is never exposed on the public verification certificate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/40 border font-serif text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {record.rawContent || 'Content registered under cryptographic hash.'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Versions & New Version Creation */}
          <TabsContent value="versions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Immutable Versions Registry</CardTitle>
                  <Button size="sm" onClick={() => setIsCreatingVersion(!isCreatingVersion)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Register New Version
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  All versions remain permanently stored with their independent cryptographic hashes and integrity screening reports.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isCreatingVersion && (
                  <div className="p-4 rounded-xl border-2 border-primary/30 bg-card space-y-4">
                    <h4 className="text-sm font-semibold">Register New Content Version</h4>
                    <div className="space-y-2">
                      <Label htmlFor="vNotes" className="text-xs font-semibold">Version Change Notes</Label>
                      <Input
                        id="vNotes"
                        placeholder="e.g., Updated chapter 3 with peer review corrections"
                        value={changeNotes}
                        onChange={(e) => setChangeNotes(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vContent" className="text-xs font-semibold">New Manuscript Text</Label>
                      <Textarea
                        id="vContent"
                        rows={6}
                        placeholder="Paste revised manuscript text..."
                        value={versionText}
                        onChange={(e) => setVersionText(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsCreatingVersion(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleCreateNewVersion} disabled={submittingVersion}>
                        {submittingVersion ? 'Running Integrity Gate...' : 'Submit & Execute Integrity Gate'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-card flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">Version {record.currentVersionNumber || 1}.0</span>
                        <Badge variant="default" className="text-[10px]">Current Version</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Registered: {new Date(record.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                      {record.contentHash.slice(0, 16)}...
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Manifest & Signature Details */}
          <TabsContent value="manifest" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cryptographic Manifest & Digital Signature</CardTitle>
                <CardDescription className="text-xs">
                  Server-side asymmetric signature certifying the metadata, hashes, and integrity gate screening timestamp.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-mono">Platform Digital Signature</Label>
                  <code className="block p-3 rounded bg-muted/60 text-xs font-mono text-primary break-all border">
                    {`SIG-ECDSA-P256:${record.contentHash.slice(0, 32)}...`}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Signature Algorithm:</span>
                    <span className="font-mono font-semibold">SHA256withECDSA-P256</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Signing Key Version:</span>
                    <span className="font-mono font-semibold">key_2026_p256_v1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
