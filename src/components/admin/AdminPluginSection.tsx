import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function AdminPluginSection() {
  const [loading, setLoading] = useState(false);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [publicEnabled, setPublicEnabled] = useState(true);

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      const { data } = await supabase.from('plugin_downloads').select('*, profiles(email)').order('created_at', { ascending: false }).limit(20);
      if (data) setDownloads(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async () => {
    const input = document.getElementById('plugin-file') as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      toast.error('Please select a ZIP file');
      return;
    }
    
    setLoading(true);
    try {
      const file = input.files[0];
      const { error } = await supabase.storage.from('plugins').upload('aidetector-wp.zip', file, {
        upsert: true,
        contentType: 'application/zip'
      });
      if (error) throw error;
      toast.success('Plugin uploaded and deployed successfully!');
      input.value = '';
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to upload plugin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base">WordPress Plugin Management</CardTitle>
          <CardDescription>Upload plugin ZIP and manage download visibility</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
               <Label>Upload Plugin ZIP</Label>
               <Input id="plugin-file" type="file" accept=".zip" />
               <Button type="button" className="w-fit" onClick={handleUpload} disabled={loading}>
                 {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                 Upload & Deploy
               </Button>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <h3 className="font-medium text-navy">Enable Public Downloads</h3>
                <p className="text-sm text-muted-foreground">Allow users to download the plugin</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={publicEnabled} onCheckedChange={setPublicEnabled} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border shadow-sm mt-6">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base">Recent Downloads</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {downloads.length > 0 ? (
            <div className="space-y-4">
               {downloads.map((d, i) => (
                 <div key={i} className="flex justify-between items-center text-sm border-b pb-2">
                   <div>
                     <span className="font-medium">{d.profiles?.email || 'Anonymous'}</span>
                     <span className="ml-2 text-muted-foreground">{new Date(d.created_at).toLocaleString()}</span>
                   </div>
                   <div>
                     <span className={`px-2 py-1 rounded-full text-xs ${d.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                       {d.status}
                     </span>
                     {d.error_message && <span className="ml-2 text-red-500 text-xs">{d.error_message}</span>}
                   </div>
                 </div>
               ))}
            </div>
          ) : (
             <p className="text-sm text-muted-foreground">No recent downloads found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}