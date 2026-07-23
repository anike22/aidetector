import React, { useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutTemplate, Shield, CheckCircle2, Zap, Download, Key, Activity } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function WordPressPluginPage() {
  const [downloading, setDownloading] = useState(false);
  const { user } = useAuth();

  const handleDownload = async () => {
    setDownloading(true);
    setTimeout(() => {
      window.open('https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/plugins/aidetector-wp.zip?v=2.4.5', '_blank');
      setDownloading(false);
      toast.success('Plugin downloaded successfully!');
    }, 800);
  };

  return (
    <MainLayout>
      <PageMeta 
        title="WordPress Plugin | Complete SEO & AI Suite" 
        description="Integrate AI detection, humanization, and a full SEO assistant directly into your WordPress dashboard."
      />
      <div className="pt-24 pb-16 min-h-screen bg-slate-50/50 dark:bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <div className="mx-auto w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
              <LayoutTemplate className="w-10 h-10 text-blue-500" />
            </div>
            <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-200">WordPress Integration</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4 text-balance">
              The Ultimate AI & SEO Suite for <span className="text-blue-500">WordPress</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Optimize your content, bypass AI detectors, and manage your SEO strategy without ever leaving your WordPress dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-primary/20 shadow-sm relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Instant Humanizer
                </CardTitle>
                <CardDescription>
                  Humanize your blog posts right from the block editor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Bypass AI detectors easily</li>
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Fix "undefined" errors automatically</li>
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Preserves formatting</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-sm relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Full SEO Assistant
                </CardTitle>
                <CardDescription>
                  Complete on-page SEO optimization toolkit inside WP.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Keyword & Meta suggestions</li>
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Internal linking opportunities</li>
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Real-time SEO scoring</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="bg-card p-8 rounded-2xl border shadow-sm mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Download className="w-6 h-6 text-primary" />
              Installation Guide
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-semibold text-lg">Download the Plugin</h3>
                  <p className="text-muted-foreground mb-3">Get the latest v2.4.1 version with updated API support.</p>
                  <Button onClick={() => window.open('https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/plugins/aidetector-wp.zip?v=2.4.5', '_blank')} className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Plugin .zip
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-semibold text-lg">Upload to WordPress</h3>
                  <p className="text-muted-foreground">Go to your WordPress Admin Dashboard ➔ Plugins ➔ Add New ➔ Upload Plugin. Select the downloaded .zip file and click "Install Now", then "Activate".</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h3 className="font-semibold text-lg">Connect your API Key</h3>
                  <p className="text-muted-foreground mb-3">Go to Settings ➔ AI Detector & Humanizer in your WordPress menu, and paste your API key.</p>
                  <Button variant="outline" className="gap-2" onClick={() => window.location.href = '/dashboard'}>
                    <Key className="w-4 h-4" />
                    Get Your API Key
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}