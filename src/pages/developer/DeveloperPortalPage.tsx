import { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Code, BookOpen, Zap, Globe, Terminal, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { getSdkDownloads, INTEGRATION_TYPE_LABELS, APP_TYPE_LABELS } from '@/lib/marketplaceApi';
import type { SdkDownload } from '@/types/marketplace';

const endpoints = [
  { method: 'POST', path: '/v1/detect', desc: 'Detect AI-generated text in a document.' },
  { method: 'POST', path: '/v1/humanize', desc: 'Humanize content to bypass detection.' },
  { method: 'GET', path: '/v1/scans/:id', desc: 'Retrieve scan results by ID.' },
  { method: 'POST', path: '/v1/webhooks', desc: 'Register and manage webhook endpoints.' },
  { method: 'GET', path: '/v1/usage', desc: 'Fetch current quota and usage metrics.' },
];

const sdkLanguages = [
  { lang: 'JavaScript', icon: 'JS' },
  { lang: 'TypeScript', icon: 'TS' },
  { lang: 'Python', icon: 'PY' },
  { lang: 'PHP', icon: 'PHP' },
  { lang: 'Java', icon: 'JV' },
  { lang: 'C#', icon: 'C#' },
  { lang: 'Go', icon: 'GO' },
  { lang: 'Ruby', icon: 'RB' },
];

export default function DeveloperPortalPage() {
  const [activeTab, setActiveTab] = useState('docs');
  const [sdks, setSdks] = useState<SdkDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSdks();
  }, []);

  async function loadSdks() {
    try {
      const data = await getSdkDownloads();
      setSdks(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load SDKs.');
    } finally {
      setLoading(false);
    }
  }

  function copyKeyExample() {
    navigator.clipboard.writeText('AI_API_KEY=your_api_key_here');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard.');
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Code className="h-8 w-8" />
              Developer Center
            </h1>
            <p className="text-muted-foreground">Build, integrate, and extend AIDetector.cx.</p>
          </div>
          <Button asChild><a href="/api/docs">Open API Docs</a></Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="docs"><BookOpen className="h-4 w-4 mr-2" />Docs</TabsTrigger>
            <TabsTrigger value="sdks"><Terminal className="h-4 w-4 mr-2" />SDKs</TabsTrigger>
            <TabsTrigger value="endpoints"><Globe className="h-4 w-4 mr-2" />Endpoints</TabsTrigger>
            <TabsTrigger value="webhooks"><Zap className="h-4 w-4 mr-2" />Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Getting Started</CardTitle><CardDescription>Authentication and first API call</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">All API requests require an API key passed in the Authorization header.</p>
                  <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                    <code className="text-xs">Authorization: Bearer YOUR_API_KEY</code>
                    <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText('Authorization: Bearer YOUR_API_KEY'); toast.success('Copied'); }}><Copy className="h-4 w-4" /></Button>
                  </div>
                  <p className="text-sm text-muted-foreground">Generate keys from the API Dashboard and keep them secure.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Rate Limits</CardTitle><CardDescription>Understand quota and throttling</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Free</span><span>100 requests/min</span></div>
                  <div className="flex justify-between text-sm"><span>Pro</span><span>1,000 requests/min</span></div>
                  <div className="flex justify-between text-sm"><span>Enterprise</span><span>Custom</span></div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Sample Request</CardTitle></CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`curl -X POST https://api.aidetector.cx/v1/detect \\
  -H "Authorization: Bearer \$API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Your content here"}'`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sdks" className="space-y-4">
            {loading && <Loader2 className="h-6 w-6 animate-spin" />}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sdkLanguages.map((sdk) => {
                const dbSdk = sdks.find((s) => s.language.toLowerCase() === sdk.lang.toLowerCase());
                return (
                  <Card key={sdk.lang}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">{sdk.icon}</div>
                        <CardTitle className="text-lg">{sdk.lang}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{dbSdk?.version ? `Latest: v${dbSdk.version}` : 'Official SDK'}</p>
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <a href={dbSdk?.download_url || '#'}>{dbSdk?.download_url ? 'Download' : 'Coming Soon'}</a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>API Surface</CardTitle><CardDescription>Core endpoints available to developers</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {endpoints.map((ep) => (
                  <div key={ep.path} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md gap-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{ep.method}</Badge>
                      <code className="text-sm">{ep.path}</code>
                    </div>
                    <p className="text-sm text-muted-foreground">{ep.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Webhook Events</CardTitle><CardDescription>Subscribe to real-time platform events</CardDescription></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(INTEGRATION_TYPE_LABELS).slice(0, 5).map(([key, label]) => (
                  <div key={key} className="p-2 border rounded-md text-sm">{label}</div>
                ))}
                <p className="text-sm text-muted-foreground pt-2">Manage endpoints from the <a href="/webhooks" className="text-primary underline">Webhook Manager</a>.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
