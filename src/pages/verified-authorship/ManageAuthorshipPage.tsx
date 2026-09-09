import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ShieldCheck,
  FileText,
  Download,
  AlertTriangle,
  History,
  ShieldAlert,
  Copy,
  ExternalLink,
  PlusCircle,
  Trash2,
  Lock,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchOwnerRegistration,
  createAuthorshipVersion,
  revokeAuthorshipRegistration,
} from '@/lib/verifiedAuthorship/authorshipService';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthorshipRegistration, AuthorshipDispute } from '@/lib/verifiedAuthorship/types';

export default function ManageAuthorshipPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [registration, setRegistration] = useState<AuthorshipRegistration | null>(null);
  const [disputes, setDisputes] = useState<AuthorshipDispute[]>([]);
  const [loading, setLoading] = useState(true);

  // Version modal state
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [newVersionContent, setNewVersionContent] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [isSubmittingVersion, setIsSubmittingVersion] = useState(false);

  // Revoke modal state
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revocationReason, setRevocationReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  // Dispute response state
  const [activeDisputeId, setActiveDisputeId] = useState<string | null>(null);
  const [ownerResponseText, setOwnerResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const reg = await fetchOwnerRegistration(id);
      setRegistration(reg);
      if (reg) {
        setNewVersionTitle(reg.title);
        // Fetch disputes
        const { data: dispData } = await supabase
          .from('authorship_disputes')
          .select('*')
          .eq('registration_id', id)
          .order('created_at', { ascending: false });

        if (dispData) {
          setDisputes(
            dispData.map((d: any) => ({
              id: d.id,
              registrationId: d.registration_id,
              reporterEmail: d.reporter_email,
              reporterUserId: d.reporter_user_id,
              claimReason: d.claim_reason,
              claimDescription: d.claim_description,
              evidenceUrls: d.evidence_urls || [],
              status: d.status,
              ownerResponse: d.owner_response,
              ownerRespondedAt: d.owner_responded_at,
              adminNotes: d.admin_notes,
              createdAt: d.created_at,
              updatedAt: d.updated_at,
            }))
          );
        }
      }
    } catch (err) {
      console.error('Error loading registration:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDownloadEvidencePackage = () => {
    if (!registration) return;
    const pkg = {
      product: 'AIDetector.cx Verified Authorship Evidence Package',
      exportTimestamp: new Date().toISOString(),
      registrationId: registration.id,
      trackingCode: registration.trackingCode,
      contentHash: registration.contentHash,
      title: registration.title,
      subtitle: registration.subtitle,
      wordCount: registration.wordCount,
      claimedCreationDate: registration.claimedCreationDate,
      creationDeclaration: registration.creationDeclaration,
      integrityGateResults: registration.integrityGateResults,
      rawContent: registration.rawContent,
      privateEvidenceNotes: registration.privateEvidenceNotes,
      collaborators: registration.collaborators,
      citations: registration.citations,
    };

    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence_package_${registration.trackingCode}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Evidence Package downloaded.');
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration || !newVersionTitle.trim() || !newVersionContent.trim() || !changeSummary.trim()) {
      toast.error('Please fill in all fields for the new version.');
      return;
    }

    try {
      setIsSubmittingVersion(true);
      const res = await createAuthorshipVersion(
        registration.id,
        newVersionTitle,
        newVersionContent,
        changeSummary,
        registration.creationDeclaration
      );

      if (res.success) {
        toast.success('New content version created and attested!');
        setVersionModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || 'Failed to create new version.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error creating version.');
    } finally {
      setIsSubmittingVersion(false);
    }
  };

  const handleRevokeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration || !revocationReason.trim()) {
      toast.error('Please specify a revocation reason.');
      return;
    }

    try {
      setIsRevoking(true);
      const res = await revokeAuthorshipRegistration(registration.id, revocationReason);
      if (res.success) {
        toast.success('Authorship registration revoked.');
        setRevokeModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || 'Failed to revoke registration.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error revoking registration.');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleSubmitDisputeResponse = async (disputeId: string) => {
    if (!ownerResponseText.trim()) {
      toast.error('Please enter your response before submitting.');
      return;
    }

    try {
      setIsSubmittingResponse(true);
      const { error } = await supabase
        .from('authorship_disputes')
        .update({
          owner_response: ownerResponseText.trim(),
          owner_responded_at: new Date().toISOString(),
          status: 'under_review',
        })
        .eq('id', disputeId);

      if (error) throw error;
      toast.success('Dispute rebuttal submitted.');
      setActiveDisputeId(null);
      setOwnerResponseText('');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit response.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-accent animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!registration) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full border text-center p-6 space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-serif font-bold">Registration Not Found</h2>
            <p className="text-xs text-muted-foreground">
              You do not have access to manage this registration record.
            </p>
            <Button asChild variant="outline" className="text-xs">
              <Link to="/verified-authorship/register">Register a Work</Link>
            </Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageMeta
        title={`Manage Authorship: ${registration.title} | AIDetector.cx`}
        description="Owner management console for Verified Authorship registration."
      />

      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container max-w-5xl mx-auto px-4 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 text-accent font-serif tracking-tight text-xs font-semibold mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>OWNER MANAGEMENT PORTAL</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                {registration.title}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-mono">
                <span>{registration.trackingCode}</span>
                <span>•</span>
                <Badge
                  variant={
                    registration.status === 'active'
                      ? 'default'
                      : registration.status === 'revoked'
                      ? 'destructive'
                      : 'outline'
                  }
                  className="text-[10px]"
                >
                  {registration.status.toUpperCase()}
                </Badge>
                <span>•</span>
                <span>Version {registration.currentVersionNumber}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <Link to={`/verified-authorship/${registration.id}/certificate`} target="_blank">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Public Certificate
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadEvidencePackage}
                className="gap-1.5 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download Evidence Package
              </Button>
              {registration.status === 'active' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => setVersionModalOpen(true)}
                    className="gap-1.5 text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    New Version
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRevokeModalOpen(true)}
                    className="gap-1.5 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revoke
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="grid grid-cols-4 max-w-lg">
              <TabsTrigger value="content" className="text-xs">
                Private Content
              </TabsTrigger>
              <TabsTrigger value="integrity" className="text-xs">
                Integrity Gate
              </TabsTrigger>
              <TabsTrigger value="evidence" className="text-xs">
                Evidence & Notes
              </TabsTrigger>
              <TabsTrigger value="disputes" className="text-xs">
                Disputes ({disputes.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Private Content */}
            <TabsContent value="content" className="space-y-4">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif flex items-center justify-between">
                    <span>Registered Full Text (Confidential)</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {registration.wordCount} words / {registration.charCount} chars
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-pretty">
                    This full manuscript text is private to your authenticated account and is never
                    exposed on the public certificate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/40 border font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {registration.rawContent}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Integrity Gate */}
            <TabsContent value="integrity" className="space-y-4">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif">
                    Integrity Gate Screening Scores
                  </CardTitle>
                  <CardDescription className="text-xs text-pretty">
                    Detailed detector scores generated at the time of attestation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                          Balanced AI Detector (Eligibility)
                        </span>
                        <Badge variant="default" className="text-[10px]">Passed</Badge>
                      </div>
                      <div className="text-xl font-serif font-bold text-foreground">
                        {registration.balancedAiScore}% AI Signal
                      </div>
                      <p className="text-muted-foreground">
                        {registration.integrityGateResults?.balancedAiCheck?.details}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                          Aggressive Engine (Advisory)
                        </span>
                        <Badge variant="outline" className="text-[10px]">Advisory</Badge>
                      </div>
                      <div className="text-xl font-serif font-bold text-foreground">
                        {registration.aggressiveAiScore}% AI Signal
                      </div>
                      <p className="text-muted-foreground">
                        {registration.integrityGateResults?.aggressiveAiCheck?.details}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                          Plagiarism Originality
                        </span>
                        <Badge variant="default" className="text-[10px]">Verified</Badge>
                      </div>
                      <div className="text-xl font-serif font-bold text-foreground">
                        {registration.plagiarismOriginalityScore}% Original
                      </div>
                      <p className="text-muted-foreground">
                        {registration.integrityGateResults?.plagiarismCheck?.details}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                          Duplicate Registry
                        </span>
                        <Badge variant="default" className="text-[10px]">Clean Match</Badge>
                      </div>
                      <div className="text-xl font-serif font-bold text-foreground">
                        {registration.duplicateCheckResult}
                      </div>
                      <p className="text-muted-foreground">
                        {registration.integrityGateResults?.duplicateRegistryCheck?.details}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Evidence & Notes */}
            <TabsContent value="evidence" className="space-y-4">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif">
                    Private Creation Evidence & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {registration.privateEvidenceNotes ? (
                    <div className="p-4 rounded-lg bg-muted/40 border whitespace-pre-wrap font-mono">
                      {registration.privateEvidenceNotes}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No private evidence notes attached.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: Disputes */}
            <TabsContent value="disputes" className="space-y-4">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-serif">
                    Authorship Disputes & False Claim Reports
                  </CardTitle>
                  <CardDescription className="text-xs text-pretty">
                    Review and submit rebuttals for any disputed claims filed against this certificate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {disputes.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p>No disputes have been filed against this certificate.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {disputes.map((d) => (
                        <div key={d.id} className="p-4 rounded-lg border bg-card space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold font-serif text-destructive">
                              Ground: {d.claimReason}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              Status: {d.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{d.claimDescription}</p>

                          {d.ownerResponse ? (
                            <div className="p-3 bg-muted/50 rounded border space-y-1">
                              <span className="font-semibold text-foreground text-[10px] uppercase">
                                Your Rebuttal / Evidence Response:
                              </span>
                              <p className="text-muted-foreground">{d.ownerResponse}</p>
                            </div>
                          ) : (
                            <div>
                              {activeDisputeId === d.id ? (
                                <div className="space-y-2 pt-2 border-t">
                                  <Label className="font-medium">Submit Owner Rebuttal</Label>
                                  <Textarea
                                    rows={3}
                                    placeholder="Explain your authorship origin or reference evidence..."
                                    value={ownerResponseText}
                                    onChange={(e) => setOwnerResponseText(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSubmitDisputeResponse(d.id)}
                                      disabled={isSubmittingResponse}
                                    >
                                      Submit Rebuttal
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setActiveDisputeId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveDisputeId(d.id)}
                                >
                                  Respond to Dispute
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* New Version Modal */}
          <Dialog open={versionModalOpen} onOpenChange={setVersionModalOpen}>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-serif">Create New Version</DialogTitle>
                <DialogDescription className="text-xs text-pretty">
                  Publish an updated version under this registration. The new text will be analyzed
                  through the Integrity Gate before certification.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateVersion} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="vTitle">Version Title</Label>
                  <Input
                    id="vTitle"
                    value={newVersionTitle}
                    onChange={(e) => setNewVersionTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vSummary">Change Summary (Publicly Recorded)</Label>
                  <Input
                    id="vSummary"
                    placeholder="e.g. Added section 4 on methodology; corrected references"
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="vContent">New Content Text</Label>
                  <Textarea
                    id="vContent"
                    rows={8}
                    placeholder="Paste the updated manuscript content..."
                    value={newVersionContent}
                    onChange={(e) => setNewVersionContent(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVersionModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmittingVersion}>
                    {isSubmittingVersion ? 'Evaluating & Publishing...' : 'Publish Version'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Revoke Modal */}
          <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-serif text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Revoke Authorship Certificate
                </DialogTitle>
                <DialogDescription className="text-xs text-pretty">
                  Revoking this certificate is a permanent action. The tracking code will be marked
                  as Revoked on the public certificate.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRevokeRegistration} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="revReason">Reason for Revocation *</Label>
                  <Textarea
                    id="revReason"
                    rows={3}
                    placeholder="Explain why you are revoking this authorship claim..."
                    value={revocationReason}
                    onChange={(e) => setRevocationReason(e.target.value)}
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRevokeModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    size="sm"
                    disabled={isRevoking}
                  >
                    {isRevoking ? 'Revoking...' : 'Confirm Revocation'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  );
}
