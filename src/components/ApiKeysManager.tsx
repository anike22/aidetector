import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Copy, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function ApiKeysManager() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchKeys(data.session.user.id);
      else setLoading(false);
    });
  }, []);

  const fetchKeys = async (userId: string) => {
    const { data, error } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
    if (!error) setKeys(data || []);
    setLoading(false);
  };

  const generateKey = async () => {
    if (!session) {
      toast.error('You must be logged in to generate an API key.');
      return;
    }
    
    // Generate a secure random API key string
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    const keyString = 'aid_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    const { data, error } = await supabase.from('api_keys').insert({
      user_id: session.user.id,
      name: newKeyName || 'Default Key',
      key_value: keyString
    }).select().single();
    
    if (error) {
      toast.error('Failed to generate key: ' + error.message);
    } else if (data) {
      setKeys([data, ...keys]);
      setNewKeyName('');
      toast.success('API Key generated successfully');
    }
  };

  const deleteKey = async (id: string) => {
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete key: ' + error.message);
    } else {
      setKeys(keys.filter(k => k.id !== id));
      toast.success('API Key deleted');
    }
  };

  const copyKey = (val: string) => {
    navigator.clipboard.writeText(val);
    toast.success('API Key copied to clipboard');
  };

  if (!session) {
    return (
      <Card className="mb-12 border-primary/20 bg-primary/5">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <Key className="w-12 h-12 text-primary/50 mb-4" />
          <h3 className="text-xl font-bold mb-2">Manage Your API Keys</h3>
          <p className="text-muted-foreground mb-4">You need an account to generate and manage your API keys.</p>
          <Button asChild><a href="/login">Sign in to Generate Keys</a></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-primary" /> API Keys</CardTitle>
        <CardDescription>Generate API keys to authenticate your requests and integrations.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input 
            placeholder="Key Name (e.g., WordPress Plugin)" 
            value={newKeyName} 
            onChange={(e) => setNewKeyName(e.target.value)} 
            className="max-w-xs"
          />
          <Button onClick={generateKey}>Generate New Key</Button>
        </div>
        
        {loading ? <p>Loading keys...</p> : keys.length === 0 ? (
          <p className="text-muted-foreground text-sm">No API keys generated yet.</p>
        ) : (
          <div className="space-y-3">
            {keys.map(key => (
              <div key={key.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-card">
                <div>
                  <p className="font-medium text-sm">{key.name}</p>
                  <p className="font-mono text-xs text-muted-foreground mt-1">{key.key_value}</p>
                </div>
                <div className="flex gap-2 mt-3 sm:mt-0">
                  <Button variant="outline" size="sm" onClick={() => copyKey(key.key_value)}>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => deleteKey(key.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
