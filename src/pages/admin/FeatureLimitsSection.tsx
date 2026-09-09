import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { broadcastUsageUpdate } from '@/lib/entitlementsApi';

export default function FeatureLimitsSection() {
  const [limits, setLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const features = [
    { slug: 'ai_detector', name: 'AI Text Detector' },
    { slug: 'humanizer', name: 'AI Humanizer & Bypass' },
    { slug: 'plagiarism_checker', name: 'Plagiarism Checker' },
    { slug: 'seo_audit', name: 'SEO Content Audit' },
  ];
  
  const plans = [
    { key: 'guest', name: 'Guest (Visitor)', defaultVal: 3 },
    { key: 'free', name: 'Free Account', defaultVal: 5 },
    { key: 'pro', name: 'Pro Plan', defaultVal: 500 },
    { key: 'enterprise', name: 'Enterprise', defaultVal: 2500 },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('feature_limits').select('*');
    if (!error && data) setLimits(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getLimit = (featureSlug: string, planKey: string) => {
    const found = limits.find(l => (l.feature_slug === featureSlug || l.feature_slug === featureSlug.replace(/_/g, '-')) && l.plan === planKey);
    return found ? (found.daily_limit ?? '') : '';
  };

  const handleUpdate = (featureSlug: string, planKey: string, value: string) => {
    const updated = [...limits];
    const parsed = value === '' ? null : parseInt(value, 10);
    const idx = updated.findIndex(l => (l.feature_slug === featureSlug || l.feature_slug === featureSlug.replace(/_/g, '-')) && l.plan === planKey);
    if (idx >= 0) {
      updated[idx].daily_limit = parsed;
    } else {
      updated.push({ feature_slug: featureSlug, plan: planKey, daily_limit: parsed });
    }
    setLimits(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const f of features) {
        for (const p of plans) {
          const limitVal = getLimit(f.slug, p.key);
          const parsed = limitVal === '' ? null : parseInt(String(limitVal), 10);
          await supabase.from('feature_limits').upsert({
            feature_slug: f.slug,
            plan: p.key,
            daily_limit: parsed,
            updated_at: new Date().toISOString()
          }, { onConflict: 'feature_slug, plan' });
        }
      }
      toast.success('Feature limits updated successfully!');
      broadcastUsageUpdate();
      await load();
    } catch (err: any) {
      toast.error('Failed to save limits: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border shadow-card mt-6">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-border gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Plan Usage & Daily Scan Limits
          </CardTitle>
          <CardDescription className="mt-1">
            Configure daily allowances per tier (e.g. Guest = 3 scans/day, Free = 10 scans/day, Pro = 500/mo).
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-9 gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2 h-9 bg-primary text-primary-foreground font-semibold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All Limits
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 overflow-x-auto w-full max-w-full">
        <table className="w-full text-sm text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-4 py-3 font-bold text-foreground">Feature Module</th>
              {plans.map(p => (
                <th key={p.key} className="px-4 py-3 font-semibold text-foreground text-center">
                  <div>{p.name}</div>
                  <div className="text-[11px] font-normal text-muted-foreground">(daily limit)</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {features.map(f => (
              <tr key={f.slug} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-foreground whitespace-nowrap">
                  {f.name}
                  <div className="text-xs text-muted-foreground font-mono font-normal">{f.slug}</div>
                </td>
                {plans.map(p => {
                  const val = getLimit(f.slug, p.key);
                  return (
                    <td key={p.key} className="px-4 py-3.5 whitespace-nowrap text-center">
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Unlimited" 
                        value={val !== '' && val !== null && val !== undefined ? val : ''}
                        onChange={(e) => handleUpdate(f.slug, p.key, e.target.value)}
                        className="w-28 text-center mx-auto h-9 font-semibold"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
