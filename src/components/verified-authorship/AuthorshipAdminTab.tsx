import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldCheck,
  ShieldAlert,
  Sliders,
  RotateCcw,
  KeyRound,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { fetchAuthorshipSettings } from '@/lib/verifiedAuthorship/integrityGateEngine';
import type { AuthorshipPlatformSettings, AuthorshipDispute } from '@/lib/verifiedAuthorship/types';

export default function AuthorshipAdminTab() {
  const [settings, setSettings] = useState<AuthorshipPlatformSettings | null>(null);
  const [disputes, setDisputes] = useState<AuthorshipDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);

  // Form states
  const [balancedMax, setBalancedMax] = useState(50);
  const [plagiarismMin, setPlagiarismMin] = useState(90);
  const [duplicateSimilarity, setDuplicateSimilarity] = useState(95);
  const [creditCost, setCreditCost] = useState(5);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await fetchAuthorshipSettings();
      setSettings(s);
      setBalancedMax(s.balancedAiThresholdMax);
      setPlagiarismMin(s.plagiarismOriginalityMin);
      setDuplicateSimilarity(s.duplicateSimilarityThreshold);
      setCreditCost(s.registrationCreditCost);

      const { data: dispData } = await supabase
        .from('authorship_disputes')
        .select('*')
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
            resolvedBy: d.resolved_by,
            resolvedAt: d.resolved_at,
            resolutionAction: d.resolution_action,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading authorship admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      const { error } = await supabase
        .from('authorship_platform_settings')
        .update({
          balanced_ai_threshold_max: balancedMax,
          plagiarism_originality_min: plagiarismMin,
          duplicate_similarity_threshold: duplicateSimilarity,
          registration_credit_cost: creditCost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');

      if (error) throw error;
      toast.success('Authorship platform thresholds updated successfully.');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update platform settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRotateSigningKey = async () => {
    try {
      setIsRotatingKey(true);
      const newKeyId = `key_v2026_${Math.random().toString(36).substring(2, 6)}`;
      const { error } = await supabase
        .from('authorship_platform_settings')
        .update({
          signing_key_id: newKeyId,
          last_rotated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'default');

      if (error) throw error;
      toast.success(`Attestation signing key rotated to ${newKeyId}.`);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to rotate key.');
    } finally {
      setIsRotatingKey(false);
    }
  };

  const handleResolveDispute = async (
    disputeId: string,
    action: 'uphold_and_suspend' | 'uphold_and_revoke' | 'dismiss'
  ) => {
    try {
      const disp = disputes.find((d) => d.id === disputeId);
      if (!disp) return;

      let disputeStatus = action === 'dismiss' ? 'dismissed' : 'upheld';

      // 1. Update dispute
      await supabase
        .from('authorship_disputes')
        .update({
          status: disputeStatus,
          resolution_action: action,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      // 2. If upheld, update parent registration status
      if (action === 'uphold_and_suspend') {
        await supabase
          .from('authorship_registrations')
          .update({
            status: 'suspended',
            suspension_reason: `Suspended by admin following dispute: ${disp.claimReason}`,
            suspended_at: new Date().toISOString(),
          })
          .eq('id', disp.registrationId);
      } else if (action === 'uphold_and_revoke') {
        await supabase
          .from('authorship_registrations')
          .update({
            status: 'revoked',
            revocation_reason: `Revoked by admin following upheld dispute: ${disp.claimReason}`,
            revoked_at: new Date().toISOString(),
          })
          .eq('id', disp.registrationId);
      }

      toast.success(`Dispute resolved: ${action.replace(/_/g, ' ')}.`);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resolve dispute.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
        Loading Verified Authorship configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thresholds & Settings */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            Verified Authorship Platform Thresholds & Policy Limits
          </CardTitle>
          <CardDescription className="text-xs text-pretty">
            Configure screening gates, maximum allowed AI score, minimum plagiarism originality,
            and credit costs enforced server-side.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bMax">Max Balanced AI Threshold (%)</Label>
                <Input
                  id="bMax"
                  type="number"
                  min={1}
                  max={100}
                  value={balancedMax}
                  onChange={(e) => setBalancedMax(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground">
                  Works with Balanced AI score higher than this are rejected.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pMin">Min Plagiarism Originality (%)</Label>
                <Input
                  id="pMin"
                  type="number"
                  min={50}
                  max={100}
                  value={plagiarismMin}
                  onChange={(e) => setPlagiarismMin(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground">
                  Minimum originality required (default 90%).
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dSim">Duplicate Similarity Cap (%)</Label>
                <Input
                  id="dSim"
                  type="number"
                  min={50}
                  max={100}
                  value={duplicateSimilarity}
                  onChange={(e) => setDuplicateSimilarity(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground">
                  Near-duplicate collision trigger threshold.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cCost">Credit Cost per Registration</Label>
                <Input
                  id="cCost"
                  type="number"
                  min={0}
                  max={50}
                  value={creditCost}
                  onChange={(e) => setCreditCost(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground">
                  Credits reserved atomically during attestation.
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Active Signing Key: <strong className="text-foreground">{settings?.signingKeyId}</strong></span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isRotatingKey}
                  onClick={handleRotateSigningKey}
                  className="h-6 text-[10px] ml-2"
                >
                  Rotate Key
                </Button>
              </div>

              <Button type="submit" size="sm" disabled={isSavingSettings} className="text-xs">
                {isSavingSettings ? 'Saving...' : 'Save Thresholds'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Disputes & Moderation Console */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-serif flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              Disputes & False Claim Moderation Console
            </span>
            <Badge variant="outline" className="text-xs">
              {disputes.filter((d) => d.status === 'pending' || d.status === 'under_review').length} Actionable Cases
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-pretty">
            Review reported claims, inspect owner rebuttals, and execute administrative suspension or
            revocation actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
              <p>No active disputes reported.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => (
                <div key={d.id} className="p-4 rounded-lg border bg-card space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={d.status === 'pending' ? 'destructive' : 'outline'}
                        className="text-[10px]"
                      >
                        {d.status.toUpperCase()}
                      </Badge>
                      <span className="font-bold text-foreground font-serif">
                        Reporter: {d.reporterEmail}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Filed: {new Date(d.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Ground: {d.claimReason}
                    </span>
                    <p className="text-foreground leading-relaxed">{d.claimDescription}</p>
                  </div>

                  {d.ownerResponse && (
                    <div className="p-3 bg-muted/40 rounded border space-y-1">
                      <span className="text-[10px] font-bold text-foreground uppercase">
                        Owner Rebuttal:
                      </span>
                      <p className="text-muted-foreground">{d.ownerResponse}</p>
                    </div>
                  )}

                  {d.status !== 'dismissed' && d.status !== 'upheld' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-amber-600 dark:text-amber-400"
                        onClick={() => handleResolveDispute(d.id, 'uphold_and_suspend')}
                      >
                        Uphold & Suspend Certificate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        onClick={() => handleResolveDispute(d.id, 'uphold_and_revoke')}
                      >
                        Uphold & Revoke Claim
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={() => handleResolveDispute(d.id, 'dismiss')}
                      >
                        Dismiss Dispute
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
