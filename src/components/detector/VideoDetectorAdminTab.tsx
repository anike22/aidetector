// ─── Video Detector Admin & Model Governance Tab (Requirement #29 & #31) ────────

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ShieldAlert,
  Cpu,
  Activity,
  History,
  FileCheck2,
  Database,
  RefreshCw,
  AlertTriangle,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

interface GeneratorEntry {
  id: string;
  generator_name: string;
  generator_family: string;
  version: string;
  status: string;
  first_evaluated_at: string;
  last_evaluated_at: string;
  known_weaknesses: string[];
  watermark_support: boolean;
  attribution_reliability: number;
  shadow_mode: boolean;
}

interface VideoAppealItem {
  id: string;
  job_id: string;
  reason: string;
  evidence_notes: string;
  original_file_url?: string;
  status: string;
  created_at: string;
}

export const VideoDetectorAdminTab: React.FC = () => {
  const [generators, setGenerators] = useState<GeneratorEntry[]>([]);
  const [appeals, setAppeals] = useState<VideoAppealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCallFlag, setLiveCallFlag] = useState(true);
  const [forensicModeFlag, setForensicModeFlag] = useState(true);
  const [zeroRetentionPolicy, setZeroRetentionPolicy] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [genRes, appealRes] = await Promise.all([
        supabase.from('video_generator_registry').select('*').order('created_at', { ascending: true }),
        supabase.from('video_appeals').select('*').order('created_at', { ascending: false }).limit(20),
      ]);

      if (genRes.data) setGenerators(genRes.data);
      if (appealRes.data) setAppeals(appealRes.data);
    } catch (err: any) {
      console.error('Error loading video admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolveAppeal = async (appealId: string, action: 'resolve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('video_appeals')
        .update({
          status: action === 'resolve' ? 'resolved' : 'rejected',
          reviewer_notes: `Manually updated by admin via forensic governance portal.`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appealId);

      if (error) throw error;
      toast.success(`Appeal ${action === 'resolve' ? 'marked resolved' : 'rejected'}.`);
      fetchAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update appeal status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Video Model Governance & Forensics Queue
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage known generator fingerprints, monitor shadow mode evaluation, review creator dispute appeals, and calibrate threshold tolerances.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAdminData} className="gap-1.5 shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Monitored Generators</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">{generators.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Sora, Kling, Runway, Luma, Pika, Hedra, DFL</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Pending Creator Appeals</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {appeals.filter((a) => a.status === 'pending').length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Human review requested by publishers</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Active Pipeline Version</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-primary">v2026.4-multimodal</div>
            <p className="text-[11px] text-muted-foreground mt-1">7-stage forensic inference pipeline</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium">Privacy Compliance</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold text-emerald-500">Zero Retention</div>
            <p className="text-[11px] text-muted-foreground mt-1">Ephemeral memory processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Sub Tabs */}
      <Tabs defaultValue="generators" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="generators" className="text-xs">Generator Registry</TabsTrigger>
          <TabsTrigger value="appeals" className="text-xs">
            Appeals Queue ({appeals.filter((a) => a.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Governance Flags</TabsTrigger>
        </TabsList>

        {/* Tab 1: Generator Registry & Shadow Mode */}
        <TabsContent value="generators" className="space-y-4 pt-4">
          <div className="border border-border rounded-lg overflow-x-auto bg-card">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3 font-semibold whitespace-nowrap">Generator Name</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Family</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Version</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Status</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Attribution Reliability</th>
                  <th className="p-3 font-semibold whitespace-nowrap">C2PA / Watermark</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Known Weaknesses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {generators.map((gen) => (
                  <tr key={gen.id} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold whitespace-nowrap">{gen.generator_name}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{gen.generator_family}</td>
                    <td className="p-3 font-mono whitespace-nowrap">{gen.version}</td>
                    <td className="p-3 whitespace-nowrap">
                      <Badge variant={gen.shadow_mode ? 'secondary' : 'default'} className="text-[10px]">
                        {gen.shadow_mode ? 'Shadow Mode' : 'Production Active'}
                      </Badge>
                    </td>
                    <td className="p-3 whitespace-nowrap font-medium text-primary">
                      {gen.attribution_reliability}%
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {gen.watermark_support ? (
                        <span className="text-emerald-500 font-medium">Supported</span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs truncate text-muted-foreground">
                      {gen.known_weaknesses?.join(', ') || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Tab 2: Appeals Queue */}
        <TabsContent value="appeals" className="space-y-4 pt-4">
          {appeals.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
              No appeals submitted currently.
            </div>
          ) : (
            <div className="space-y-3">
              {appeals.map((appeal) => (
                <Card key={appeal.id} className="border-border bg-card p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Badge variant={appeal.status === 'pending' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {appeal.status.toUpperCase()}
                      </Badge>
                      <span className="font-mono text-xs font-semibold">Job ID: {appeal.job_id}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Submitted {new Date(appeal.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="py-2 text-xs space-y-1">
                    <div><strong>Reason:</strong> {appeal.reason.replace(/_/g, ' ')}</div>
                    <div className="text-muted-foreground bg-muted/30 p-2 rounded border border-border">
                      {appeal.evidence_notes}
                    </div>
                    {appeal.original_file_url && (
                      <div className="text-primary font-mono truncate">
                        <strong>Original File:</strong>{' '}
                        <a href={appeal.original_file_url} target="_blank" rel="noreferrer" className="underline">
                          {appeal.original_file_url}
                        </a>
                      </div>
                    )}
                  </div>
                  {appeal.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs h-7"
                        onClick={() => handleResolveAppeal(appeal.id, 'resolve')}
                      >
                        Accept & Revise to Authentic
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => handleResolveAppeal(appeal.id, 'reject')}
                      >
                        Reject Appeal
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Governance Settings */}
        <TabsContent value="settings" className="space-y-4 pt-4">
          <Card className="border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold">Live-Call Deepfake Challenge Feature Flag</Label>
                <p className="text-[11px] text-muted-foreground">Enable active/passive live stream challenge verification for enterprise customers.</p>
              </div>
              <Switch checked={liveCallFlag} onCheckedChange={setLiveCallFlag} />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <div>
                <Label className="text-xs font-semibold">Forensic Mode High-Resolution Gating</Label>
                <p className="text-[11px] text-muted-foreground">Require Pro / Enterprise subscription tier to unlock frame-by-frame 60fps decomposition.</p>
              </div>
              <Switch checked={forensicModeFlag} onCheckedChange={setForensicModeFlag} />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <div>
                <Label className="text-xs font-semibold">Zero-Data Retention Sandbox Enforcement</Label>
                <p className="text-[11px] text-muted-foreground">Automatically delete processed video blobs from server memory after cryptographic digest creation.</p>
              </div>
              <Switch checked={zeroRetentionPolicy} onCheckedChange={setZeroRetentionPolicy} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
