import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function FeatureLimitsSection() {
  const [limits, setLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const features = ['humanizer', 'ai-detector', 'plagiarism-checker', 'seo-audit'];
  const plans = ['free', 'pro', 'business'];

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('feature_limits').select('*');
    if (!error && data) setLimits(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getLimit = (feature: string, plan: string) => {
    return limits.find(l => l.feature_slug === feature && l.plan === plan) || { feature_slug: feature, plan, daily_limit: '' };
  };

  const handleUpdate = (feature: string, plan: string, value: string) => {
    const updated = [...limits];
    const idx = updated.findIndex(l => l.feature_slug === feature && l.plan === plan);
    if (idx >= 0) updated[idx].daily_limit = value === '' ? null : parseInt(value);
    else updated.push({ feature_slug: feature, plan, daily_limit: value === '' ? null : parseInt(value) });
    setLimits(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const limit of limits) {
        if (limit.daily_limit !== '' && limit.daily_limit !== null) {
          await supabase.from('feature_limits').upsert({
            feature_slug: limit.feature_slug,
            plan: limit.plan,
            daily_limit: limit.daily_limit
          }, { onConflict: 'feature_slug, plan' });
        }
      }
      toast.success('Feature limits saved successfully');
    } catch (err: any) {
      toast.error('Failed to save limits: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border shadow-card mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
        <div>
          <CardTitle>Plan Usage Limits</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Set daily usage limits per feature for each plan.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 h-9">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All
        </Button>
      </CardHeader>
      <CardContent className="pt-6 overflow-x-auto w-full max-w-full">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-muted/40">
              <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Feature</th>
              {plans.map(p => <th key={p} className="px-4 py-3 font-semibold text-muted-foreground capitalize whitespace-nowrap">{p}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {features.map(f => (
              <tr key={f}>
                <td className="px-4 py-3 font-medium text-navy whitespace-nowrap capitalize">{f.replace('-', ' ')}</td>
                {plans.map(p => {
                  const val = getLimit(f, p).daily_limit;
                  return (
                    <td key={p} className="px-4 py-3 whitespace-nowrap">
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Unlimited" 
                        value={val !== null ? val : ''} 
                        onChange={e => handleUpdate(f, p, e.target.value)}
                        className="w-24 h-8"
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
