import React, { useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Chrome, Shield, CheckCircle2, Zap, Download } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';

export default function ChromeExtensionPage() {
  const [downloading, setDownloading] = useState(false);

  const handleInstall = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      // Trigger download of the zip file
      const link = document.createElement('a');
      link.href = 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/plugins/aidetector-chrome.zip?v=1.0.7';
      link.download = 'aidetector-chrome.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1000);
  };

  return (
    <MainLayout>
      <PageMeta 
        title="Chrome Extension | AI Detector & Humanizer" 
        description="Detect AI content and humanize text directly in your browser with our Chrome Extension."
      />
      <div className="pt-24 pb-16 min-h-screen bg-slate-50/50 dark:bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <div className="mx-auto w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Chrome className="w-10 h-10 text-blue-500" />
            </div>
            <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-200">Browser Extension</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4 text-balance">
              AI Detection & Humanization <span className="text-blue-500">Everywhere</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Get instant AI detection and text humanization directly in your browser. Works on Google Docs, Gmail, WordPress, and more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-primary/20 shadow-sm relative overflow-hidden bg-gradient-to-br from-card to-blue-50/50 dark:to-blue-900/10">
              <div className="absolute top-0 right-0 p-4">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Coming Soon</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Instant Detection
                </CardTitle>
                <CardDescription>
                  Highlight any text on any website to instantly check if it was written by AI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Works on any webpage</li>
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> 1-click analysis</li>
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Detailed scoring</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-sm relative overflow-hidden bg-gradient-to-br from-card to-indigo-50/50 dark:to-indigo-900/10">
              <div className="absolute top-0 right-0 p-4">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Coming Soon</Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-500" />
                  1-Click Humanizer
                </CardTitle>
                <CardDescription>
                  Bypass AI detectors with a single click. Rewrite text to sound naturally human.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Bypass Turnitin & Originality.ai</li>
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Retain original meaning</li>
                  <li className="flex items-center text-sm"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> SEO friendly</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center bg-card p-8 rounded-2xl border shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Install Chrome Extension</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Download the fully functional Chrome extension. Unzip the file, go to <code className="bg-muted px-1 py-0.5 rounded">chrome://extensions/</code>, enable "Developer mode", and click "Load unpacked" to install.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={handleInstall} disabled={downloading} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                {downloading ? <span className="animate-spin text-lg">↻</span> : <Download className="w-4 h-4" />}
                {downloading ? 'Preparing...' : 'Download Extension'}
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}