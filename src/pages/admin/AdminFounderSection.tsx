import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  User, 
  Upload, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Eye, 
  ExternalLink, 
  Globe, 
  Linkedin, 
  Github, 
  Twitter, 
  Save, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  getFounderProfile, 
  saveFounderProfile, 
  DEFAULT_FOUNDER_PROFILE, 
  FounderProfile, 
  SocialProfileLink,
  validateSocialUrl
} from '@/lib/founderSettings';

export default function AdminFounderSection() {
  const [profile, setProfile] = useState<FounderProfile>(DEFAULT_FOUNDER_PROFILE);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    const data = getFounderProfile();
    setProfile(data);
    setPhotoPreview(data.photoUrl || '');
    setUrlInput(data.photoUrl?.startsWith('http') ? data.photoUrl : '');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type)) {
      toast.error('Invalid image type. Please upload a JPEG, PNG, WebP, or GIF file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoPreview(result);
        setProfile(prev => ({ ...prev, photoUrl: result }));
        setUrlInput('');
        toast.success('Photo uploaded for preview. Click "Save Changes" to publish.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }
    const validation = validateSocialUrl(urlInput.trim());
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid URL format');
      return;
    }
    setPhotoPreview(urlInput.trim());
    setProfile(prev => ({ ...prev, photoUrl: urlInput.trim() }));
    toast.success('Image URL applied. Click "Save Changes" to publish.');
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setUrlInput('');
    setProfile(prev => ({ ...prev, photoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Photo removed from preview. Click "Save Changes" to publish.');
  };

  const handleSocialLinkChange = (id: string, field: keyof SocialProfileLink, value: any) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map(link => {
        if (link.id === id) {
          return { ...link, [field]: value };
        }
        return link;
      })
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Validate social links
    for (const link of profile.socialLinks) {
      if (link.enabled && link.url.trim()) {
        const val = validateSocialUrl(link.url);
        if (!val.valid) {
          toast.error(`Invalid URL for ${link.label}: ${val.error}`);
          setSaving(false);
          return;
        }
      }
    }

    try {
      saveFounderProfile(profile);
      toast.success('Founder profile & About page settings saved and published successfully!');
    } catch (err: any) {
      toast.error(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset founder details to platform default?')) {
      setProfile(DEFAULT_FOUNDER_PROFILE);
      setPhotoPreview(DEFAULT_FOUNDER_PROFILE.photoUrl);
      setUrlInput('');
      toast.info('Reset to defaults. Remember to click "Save Changes" to apply.');
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-[#0077b5]" />;
      case 'x':
        return <Twitter className="w-4 h-4 text-foreground" />;
      case 'github':
        return <Github className="w-4 h-4 text-foreground" />;
      case 'website':
      default:
        return <Globe className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-2xl font-bold text-navy flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Company & Founder Profile Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the founder bio, black-and-white portrait, and social profile links published on the public{' '}
            <a href="/about" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              /about page <ExternalLink className="w-3 h-3" />
            </a>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadProfile} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Revert Unsaved
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetDefaults} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Founder Portrait Section */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-navy">
              <Upload className="w-5 h-5 text-primary" />
              Founder Portrait & Photography
            </CardTitle>
            <CardDescription>
              Upload or provide a high-resolution portrait. The public <code>/about</code> page renders the portrait non-destructively in black and white using CSS grayscale.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Photo Previews */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">
                  Live Public Preview (Black & White)
                </Label>
                <div className="relative aspect-square w-full max-w-[200px] rounded-xl overflow-hidden border-2 border-border bg-muted/40 flex items-center justify-center group shadow-inner">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Founder preview in Black and White" 
                      className="w-full h-full object-cover grayscale contrast-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-2">
                        {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AT'}
                      </div>
                      <span className="text-xs text-muted-foreground">No Photo (Fallback Avatar)</span>
                    </div>
                  )}
                  {photoPreview && (
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/75 backdrop-blur-xs rounded text-[10px] text-white/90 text-center">
                      CSS Grayscale Applied
                    </div>
                  )}
                </div>
                {photoPreview && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    Original image remains intact in full color.
                  </p>
                )}
              </div>

              {/* Upload Controls */}
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="photo-file" className="text-sm font-medium">Upload Image File (JPEG, PNG, WebP ≤ 5MB)</Label>
                  <div className="flex items-center gap-3">
                    <input 
                      ref={fileInputRef}
                      id="photo-file"
                      type="file" 
                      accept="image/jpeg,image/png,image/webp,image/gif" 
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 border-border"
                    >
                      <Upload className="w-4 h-4 text-primary" /> Choose Image File
                    </Button>
                    {photoPreview && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={handleRemovePhoto}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Remove Photo
                      </Button>
                    )}
                  </div>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or provide image URL</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo-url" className="text-sm font-medium">Direct Image URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="photo-url"
                      type="url" 
                      placeholder="https://example.com/portrait.jpg" 
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 border-border"
                    />
                    <Button type="button" variant="secondary" onClick={handleApplyUrl}>
                      Apply URL
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Founder Bio & Details */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-navy">
              <User className="w-5 h-5 text-primary" />
              Founder Identity & Bio
            </CardTitle>
            <CardDescription>
              Factual information regarding the founder. We maintain transparent, non-fabricated editorial standards with zero exaggerated credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="founder-name" className="text-sm font-medium">Founder Full Name</Label>
                <Input 
                  id="founder-name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="e.g. Anike Tobechukwu"
                  required
                  className="border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="founder-title" className="text-sm font-medium">Title / Role</Label>
                <Input 
                  id="founder-title"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  placeholder="e.g. Founder, AIDetector.cx"
                  required
                  className="border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="founder-bio" className="text-sm font-medium">Project Biography</Label>
              <Textarea 
                id="founder-bio"
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Describe the founder's mission, leadership, and vision for AIDetector.cx..."
                required
                className="border-border leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                Keep the focus strictly on practical tools for AI-content analysis, content integrity, and transparent digital workflows.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Profile Links */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-navy">
              <Globe className="w-5 h-5 text-primary" />
              Social & Professional Profiles
            </CardTitle>
            <CardDescription>
              Configure verified external profiles. Only profiles with a valid URL and enabled status will be rendered on the public <code>/about</code> page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {profile.socialLinks.map((link) => (
                <div 
                  key={link.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    link.enabled ? 'border-border bg-card' : 'border-border/60 bg-muted/20 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {getSocialIcon(link.platform)}
                      </div>
                      <span className="font-semibold text-sm text-navy">{link.label}</span>
                      {link.enabled && link.url.trim() && (
                        <Badge variant="outline" className="text-[10px] bg-success/5 text-success border-success/30">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`switch-${link.id}`} className="text-xs text-muted-foreground">
                          {link.enabled ? 'Visible' : 'Hidden'}
                        </Label>
                        <Switch 
                          id={`switch-${link.id}`}
                          checked={link.enabled}
                          onCheckedChange={(val) => handleSocialLinkChange(link.id, 'enabled', val)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <Input 
                        type="url"
                        placeholder={`https://${link.platform}.com/...`}
                        value={link.url}
                        onChange={(e) => handleSocialLinkChange(link.id, 'url', e.target.value)}
                        className="border-border text-sm"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Order:</span>
                        <Input 
                          type="number"
                          min={1}
                          max={20}
                          value={link.displayOrder}
                          onChange={(e) => handleSocialLinkChange(link.id, 'displayOrder', parseInt(e.target.value) || 1)}
                          className="border-border text-sm w-20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="sticky bottom-4 z-20 p-4 bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-lg flex items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            {profile.lastUpdated ? (
              <span>Last saved: {new Date(profile.lastUpdated).toLocaleString()}</span>
            ) : (
              <span>Unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              type="submit" 
              disabled={saving} 
              className="bg-primary text-primary-foreground font-semibold px-6 gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save & Publish Profile'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
