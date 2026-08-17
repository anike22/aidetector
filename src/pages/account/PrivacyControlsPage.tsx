import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useCustomerDataPlatform } from '@/contexts/CustomerDataPlatformContext';
import MainLayout from '@/components/layouts/MainLayout';
import { getPrivacyConsents } from '@/lib/cdpApi';
import { Download, Trash2, Shield, History, FileText, Eye, Mail, ScanLine, Database, GraduationCap } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/db/supabase';
import {
  fetchDetectorPrivacySettings,
  updateDetectorPrivacySettings,
  deleteDetectorHistory,
  type DetectorPrivacySettings,
} from '@/lib/detection/storage';

export default function PrivacyControlsPage() {
  const {
    customerProfile,
    loading,
    isTrackingEnabled,
    isMarketingEnabled,
    setTrackingConsent,
    setMarketingConsent,
    requestDeletion,
    exportData,
    refreshProfile,
  } = useCustomerDataPlatform();

  const [isExporting, setIsExporting] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
  const [consentHistory, setConsentHistory] = useState<{ consent_type: string; granted: boolean; updated_at: string }[]>([]);

  const [detectorPrivacy, setDetectorPrivacy] = useState<DetectorPrivacySettings>({
    zeroRetention: false,
    retentionDays: 90,
    allowFeedbackTraining: false,
  });
  const [detectorPrivacyLoading, setDetectorPrivacyLoading] = useState(true);
  const [deletingHistory, setDeletingHistory] = useState(false);

  useEffect(() => {
    void refreshProfile();
    fetchDetectorPrivacySettings().then((settings) => {
      setDetectorPrivacy(settings);
      setDetectorPrivacyLoading(false);
    });
  }, [refreshProfile]);

  useEffect(() => {
    if (!customerProfile) return;
    getPrivacyConsents(customerProfile.id).then((consents) => {
      setConsentHistory(
        consents.map((c) => ({
          consent_type: c.consent_type,
          granted: c.granted,
          updated_at: c.updated_at,
        }))
      );
    });
  }, [customerProfile]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aidetector-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data export downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!confirm('Request deletion of your personal data? This cannot be undone.')) return;
    setIsRequestingDeletion(true);
    try {
      await requestDeletion();
      toast.success('Deletion request submitted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsRequestingDeletion(false);
    }
  };

  const handleDetectorPrivacyChange = async (changes: Partial<DetectorPrivacySettings>) => {
    const next = { ...detectorPrivacy, ...changes };
    setDetectorPrivacy(next);
    try {
      await updateDetectorPrivacySettings(changes);
      toast.success('Detector privacy settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
      setDetectorPrivacy(detectorPrivacy);
    }
  };

  const handleDeleteDetectorHistory = async () => {
    if (!confirm('Delete all saved detector result records? This cannot be undone.')) return;
    setDeletingHistory(true);
    try {
      await deleteDetectorHistory();
      toast.success('Detector history deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Deletion failed');
    } finally {
      setDeletingHistory(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Controls</h1>
          <p className="text-muted-foreground mt-2">
            Manage your data, tracking preferences, and deletion requests.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border border-border shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Consent Preferences</CardTitle>
                  <CardDescription>Control how we collect and use your data.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="tracking" className="font-medium">Behavioral Tracking</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Allow us to collect usage data to improve your experience.</p>
                </div>
                <Switch
                  id="tracking"
                  checked={isTrackingEnabled}
                  onCheckedChange={setTrackingConsent}
                  disabled={loading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="marketing" className="font-medium">Marketing Communications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Receive product updates, offers, and educational content.</p>
                </div>
                <Switch
                  id="marketing"
                  checked={isMarketingEnabled}
                  onCheckedChange={setMarketingConsent}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Data Export</CardTitle>
                  <CardDescription>Download a copy of your personal data in JSON format.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExport} disabled={isExporting || loading} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Preparing...' : 'Download My Data'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ScanLine className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Detector Privacy</CardTitle>
                  <CardDescription>Control whether scan records are stored, how long they are kept, and whether feedback can be used for evaluation.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="zero-retention" className="font-medium">Zero-retention mode</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Analyze in memory only. No result records, feedback, or history are stored.</p>
                </div>
                <Switch
                  id="zero-retention"
                  checked={detectorPrivacy.zeroRetention}
                  onCheckedChange={(v) => handleDetectorPrivacyChange({ zeroRetention: v })}
                  disabled={detectorPrivacyLoading || loading}
                />
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Data retention ({detectorPrivacy.retentionDays} days)</Label>
                  </div>
                </div>
                <Slider
                  value={[detectorPrivacy.retentionDays]}
                  min={1}
                  max={365}
                  step={1}
                  disabled={detectorPrivacyLoading || loading || detectorPrivacy.zeroRetention}
                  onValueChange={([v]) => handleDetectorPrivacyChange({ retentionDays: v })}
                />
                <p className="text-sm text-muted-foreground">Choose how long detector result metadata is kept before automatic purging.</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="feedback-training" className="font-medium">Allow feedback for evaluation</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Let reviewed feedback improve detector quality. We never retrain production models from unverified feedback.</p>
                </div>
                <Switch
                  id="feedback-training"
                  checked={detectorPrivacy.allowFeedbackTraining}
                  onCheckedChange={(v) => handleDetectorPrivacyChange({ allowFeedbackTraining: v })}
                  disabled={detectorPrivacyLoading || loading}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">Delete all previously saved detector result records.</p>
                <Button onClick={handleDeleteDetectorHistory} disabled={deletingHistory || loading} variant="outline" className="shrink-0">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deletingHistory ? 'Deleting...' : 'Clear Detector History'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <div>
                  <CardTitle className="text-destructive">Delete My Data</CardTitle>
                  <CardDescription>Request deletion of your profile and associated activity data.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRequestDeletion} disabled={isRequestingDeletion || loading} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {isRequestingDeletion ? 'Submitting...' : 'Request Deletion'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Consent History</CardTitle>
                  <CardDescription>Record of your privacy choices over time.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {consentHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No consent history recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {consentHistory.map((entry, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                      <span className="capitalize">{entry.consent_type}</span>
                      <span className={entry.granted ? 'text-green-600' : 'text-muted-foreground'}>
                        {entry.granted ? 'Granted' : 'Withdrawn'}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(entry.updated_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
