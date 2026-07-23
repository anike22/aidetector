import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Key, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI API Key' },
  { id: 'gemini', name: 'Google Gemini API Key' },
  { id: 'dataforseo_login', name: 'DataForSEO Login' },
  { id: 'dataforseo_password', name: 'DataForSEO Password' },
  { id: 'google_client_id', name: 'Google OAuth Client ID' },
  { id: 'google_client_secret', name: 'Google OAuth Client Secret' },
  { id: 'google_search_console_json', name: 'Google Search Console (Service Account JSON)' },
  { id: 'resend', name: 'Resend API Key' },
];

export function ApiManagementSection() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [humanizerConfig, setHumanizerConfig] = useState<any>({
    active_provider: 'gemini',
    fallback_provider: 'openai',
    model_name: 'gemini-2.5-flash',
    max_tokens: 2048,
    timeout: 30000,
    retry_count: 3
  });
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingProviders, setTestingProviders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data: keysData, error: keysError } = await supabase.from('system_api_keys').select('*');
      if (keysError) throw keysError;
      setApiKeys(keysData || []);

      const { data: configData, error: configError } = await supabase.from('system_settings').select('*').eq('setting_key', 'humanizer_config').single();
      if (!configError && configData) {
        setHumanizerConfig(configData.setting_value);
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      toast.error('Failed to load API settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const { error } = await supabase.from('system_settings').upsert({
        setting_key: 'humanizer_config',
        setting_value: humanizerConfig,
        description: 'Configuration for the Humanizer tool'
      }, { onConflict: 'setting_key' });
      if (error) throw error;
      toast.success('Humanizer settings saved successfully');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdateKey = async (provider: string, keyValue: string) => {
    if (!keyValue.trim()) return;
    try {
      const { error } = await supabase.from('system_api_keys').upsert({
        provider,
        key_value: keyValue,
        status: 'active'
      }, { onConflict: 'provider' });
      if (error) throw error;
      toast.success(`${provider} API key updated securely.`);
      fetchSettings();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update API key');
    }
  };

  const handleDeleteKey = async (provider: string) => {
    try {
      const { error } = await supabase.from('system_api_keys').delete().eq('provider', provider);
      if (error) throw error;
      toast.success(`${provider} API key removed.`);
      fetchSettings();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to remove API key');
    }
  };

  const handleTestConnection = async (provider: string) => {
    const keyData = apiKeys.find(k => k.provider === provider);
    if (!keyData) {
      toast.error('No key to test');
      return;
    }
    
    setTestingProviders(prev => ({ ...prev, [provider]: true }));
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`
        },
        body: JSON.stringify({ action: 'test-connection', provider, key_value: keyData.key_value })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Connection to ${provider} successful`);
      } else {
        toast.error(`Connection failed: ${data.message || 'Unknown error'}`);
      }
      fetchSettings(); // Refresh status
    } catch (err: any) {
      console.error(err);
      toast.error('Connection test failed');
    } finally {
      setTestingProviders(prev => ({ ...prev, [provider]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Connected & Valid</Badge>;
      case 'invalid': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Invalid</Badge>;
      case 'quota_exceeded': return <Badge className="bg-amber-500 hover:bg-amber-600"><AlertCircle className="w-3 h-3 mr-1" /> Quota Exceeded</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base">System API Keys</CardTitle>
          <CardDescription>Manage keys for external providers. Keys are stored securely and never fully exposed.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {PROVIDERS.map(p => {
            const keyRecord = apiKeys.find(k => k.provider === p.id);
            const isSet = !!keyRecord;
            return (
              <div key={p.id} className="p-4 border border-border rounded-lg bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">{p.name}</h3>
                    {isSet ? getStatusBadge(keyRecord.status) : <Badge variant="outline">Not Set</Badge>}
                  </div>
                  {isSet && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleTestConnection(p.id)} disabled={testingProviders[p.id]}>
                        {testingProviders[p.id] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Test Connection
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteKey(p.id)}>Remove</Button>
                    </div>
                  )}
                </div>
                
                {isSet && keyRecord.last_tested_at && (
                  <div className="text-xs text-muted-foreground flex items-center justify-between bg-muted/30 p-2 rounded">
                    <span>Last tested: {new Date(keyRecord.last_tested_at).toLocaleString()}</span>
                    {keyRecord.last_error && <span className="text-destructive font-medium truncate max-w-sm" title={keyRecord.last_error}>{keyRecord.last_error}</span>}
                  </div>
                )}
                
                <div className="flex items-end gap-2">
                  <div className="space-y-1 flex-1">
                    <Label>{isSet ? 'Update API Key' : 'Enter API Key'}</Label>
                    <Input 
                      id={`key-${p.id}`}
                      type="password"
                      placeholder={isSet ? 'sk-••••••••••••••••' : `Enter ${p.name} API Key`}
                      autoComplete="off"
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button onClick={() => {
                    const input = document.getElementById(`key-${p.id}`) as HTMLInputElement;
                    handleUpdateKey(p.id, input.value);
                    input.value = '';
                  }}>Save</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base">Humanizer Settings</CardTitle>
          <CardDescription>Configure provider fallback and API limits</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Active Provider</Label>
              <Select value={humanizerConfig.active_provider} onValueChange={(v) => setHumanizerConfig({...humanizerConfig, active_provider: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fallback Provider</Label>
              <Select value={humanizerConfig.fallback_provider} onValueChange={(v) => setHumanizerConfig({...humanizerConfig, fallback_provider: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model Name</Label>
              <Input value={humanizerConfig.model_name || ''} onChange={(e) => setHumanizerConfig({...humanizerConfig, model_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input type="number" value={humanizerConfig.max_tokens || 2048} onChange={(e) => setHumanizerConfig({...humanizerConfig, max_tokens: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Retry Count</Label>
              <Input type="number" value={humanizerConfig.retry_count || 3} onChange={(e) => setHumanizerConfig({...humanizerConfig, retry_count: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Timeout (ms)</Label>
              <Input type="number" value={humanizerConfig.timeout || 30000} onChange={(e) => setHumanizerConfig({...humanizerConfig, timeout: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-border mt-4">
            <Button onClick={handleSaveConfig} disabled={savingConfig}>
              {savingConfig ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}