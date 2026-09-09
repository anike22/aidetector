import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/layouts/Navbar';
import Footer from '@/components/layouts/Footer';
import PageMeta from '@/components/common/PageMeta';

export default function EmailPreferencesPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    marketing_enabled: true,
    product_updates_enabled: true,
    newsletters_enabled: true,
    promotions_enabled: true,
    usage_alerts_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_email_preferences').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setPreferences({
          marketing_enabled: data.marketing_enabled,
          product_updates_enabled: data.product_updates_enabled,
          newsletters_enabled: data.newsletters_enabled,
          promotions_enabled: data.promotions_enabled,
          usage_alerts_enabled: data.usage_alerts_enabled,
        });
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    const { error } = await supabase.from('user_email_preferences').upsert({
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString()
    });

    if (error) toast.error('Failed to save preferences');
    else toast.success('Email preferences updated');
    
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageMeta title="Email Preferences | AIDetector.cx" description="Manage your email notifications." />
      <Navbar />
      <main className="flex-1 py-12 px-4 md:px-6 lg:px-8">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-navy">Email Preferences</h1>
              <p className="text-muted-foreground">Manage the emails you receive from AIDetector.cx</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Required Emails</CardTitle>
                <CardDescription>These emails are essential for your account security and billing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Account & Security</Label>
                    <p className="text-sm text-muted-foreground">Password resets, login alerts, and account verifications.</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Billing & Transactions</Label>
                    <p className="text-sm text-muted-foreground">Invoices, payment failures, and subscription updates.</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Marketing & Updates</CardTitle>
                <CardDescription>Choose which updates you want to receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Product Updates</Label>
                    <p className="text-sm text-muted-foreground">New features, tools, and improvements to the platform.</p>
                  </div>
                  <Switch 
                    checked={preferences.product_updates_enabled} 
                    onCheckedChange={c => setPreferences({...preferences, product_updates_enabled: c})} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Newsletters & Guides</Label>
                    <p className="text-sm text-muted-foreground">Weekly tips on AI detection, SEO, and content creation.</p>
                  </div>
                  <Switch 
                    checked={preferences.newsletters_enabled} 
                    onCheckedChange={c => setPreferences({...preferences, newsletters_enabled: c})} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Promotions</Label>
                    <p className="text-sm text-muted-foreground">Special offers, discounts, and upgrades.</p>
                  </div>
                  <Switch 
                    checked={preferences.promotions_enabled} 
                    onCheckedChange={c => setPreferences({...preferences, promotions_enabled: c})} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Usage Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notifications when you are approaching API limits or credits.</p>
                  </div>
                  <Switch 
                    checked={preferences.usage_alerts_enabled} 
                    onCheckedChange={c => setPreferences({...preferences, usage_alerts_enabled: c})} 
                  />
                </div>

                <div className="pt-4 border-t border-border mt-4">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
