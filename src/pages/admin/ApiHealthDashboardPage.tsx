import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, XCircle, AlertCircle, RefreshCw, Key, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { ApiManagementSection } from '@/components/admin/ApiManagementSection';

export default function ApiHealthDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
      checkApiHealth(data.user?.id);
    });
  }, []);

  const checkApiHealth = async (uid?: string) => {
    setLoading(true);
    try {
      const u = uid || userId;
      let hasGmail = false;
      let gmailEmail = '';
      if (u) {
        const { data } = await supabase.from('gmail_tokens').select('email_address').eq('user_id', u).maybeSingle();
        if (data) {
          hasGmail = true;
          gmailEmail = data.email_address;
        }
      }

      const { data: keys } = await supabase.from('system_api_keys').select('provider, status');
      const keysMap = (keys || []).reduce((acc: any, k: any) => {
        acc[k.provider] = k.status;
        return acc;
      }, {});

      setApiStatus([
        { 
          name: 'DataForSEO', 
          status: (keysMap['dataforseo_login'] === 'active' && keysMap['dataforseo_password'] === 'active') ? 'connected' : 'disconnected', 
          last_checked: new Date().toISOString(),
          error: (keysMap['dataforseo_login'] === 'active' && keysMap['dataforseo_password'] === 'active') ? '' : 'Keys not set. Required for keyword volume & backlinks.',
          type: 'seo',
          action: 'configure'
        },
        { 
          name: 'Google Search Console', 
          status: keysMap['google_search_console_json'] === 'active' ? 'connected' : 'disconnected', 
          last_checked: new Date().toISOString(),
          error: keysMap['google_search_console_json'] === 'active' ? '' : 'Service Account JSON not set. Required for precise organic tracking.',
          type: 'seo',
          action: 'configure'
        },
        { 
          name: 'OpenAI', 
          status: keysMap['openai'] === 'active' ? 'connected' : 'disconnected', 
          last_checked: new Date().toISOString(),
          error: keysMap['openai'] === 'active' ? '' : 'Keys not set. Required for AI content & strategy.',
          type: 'ai',
          action: 'configure'
        },
        { 
          name: 'Google Gemini', 
          status: keysMap['gemini'] === 'active' ? 'connected' : 'disconnected', 
          last_checked: new Date().toISOString(),
          error: keysMap['gemini'] === 'active' ? '' : 'Keys not set. Required for AI content.',
          type: 'ai',
          action: 'configure'
        },
        { 
          name: 'Gmail API', 
          status: hasGmail ? 'connected' : 'disconnected', 
          last_checked: new Date().toISOString(),
          error: hasGmail ? `Connected as ${gmailEmail}` : 'No active OAuth tokens found. Required for outreach.',
          type: 'email',
          action: hasGmail ? 'reconnect' : 'connect_gmail'
        }
      ]);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to run API health checks');
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (action === 'connect_gmail' || action === 'reconnect') {
      if (!userId) return toast.error('You must be logged in to connect Gmail');
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const returnUrl = window.location.href;
        const res = await fetch(`${supabaseUrl}/functions/v1/gmail-auth-url?userId=${userId}&returnUrl=${encodeURIComponent(returnUrl)}`);
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error(data.error || 'Failed to get auth URL');
        }
      } catch (err) {
        toast.error('Failed to connect Gmail');
      }
    } else {
      toast.info('Please scroll down to configure APIs.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'disconnected': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            API Health & Connections
          </h1>
          <p className="text-muted-foreground">Monitor and manage all third-party API connections for the SEO Intelligence Suite.</p>
        </div>
        <Button onClick={() => checkApiHealth()} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Core API Services</CardTitle>
            <CardDescription>Status of backend API keys and OAuth connections</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {apiStatus.map((api, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl gap-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getStatusIcon(api.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{api.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">Last checked: {new Date(api.last_checked).toLocaleString()}</p>
                        
                        {api.error && (
                          <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md font-mono">
                            {api.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">{api.status}</Badge>
                      <Button variant="secondary" size="sm" onClick={() => handleAction(api.action)}>
                        <Key className="w-4 h-4 mr-2" /> {api.action === 'connect_gmail' ? 'Connect' : 'Configure'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <ApiManagementSection />
      </div>
    </div>
  );
}