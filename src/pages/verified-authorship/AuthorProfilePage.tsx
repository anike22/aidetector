import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ShieldCheck, User, Lock, Globe, FileSignature, CheckCircle2,
  AlertCircle, Plus, Trash2, ArrowRight, Upload, Sparkles, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAuthorshipProfile,
  saveAuthorshipProfile,
  AUTHORSHIP_ATTESTATION_CLAUSES,
  type AuthorshipProfile,
  type SocialLinkItem,
  type FieldVisibility
} from '@/lib/verifiedAuthorship/authorshipProfileService';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';

export default function AuthorProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile Form States
  const [publicAuthorName, setPublicAuthorName] = useState('');
  const [legalNamePrivate, setLegalNamePrivate] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [country, setCountry] = useState('United States');
  const [biography, setBiography] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [personalWebsite, setPersonalWebsite] = useState('');
  const [publicContactEmail, setPublicContactEmail] = useState('');
  const [orcid, setOrcid] = useState('');
  const [copyrightStatement, setCopyrightStatement] = useState('© All rights reserved under applicable law.');
  
  // Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLinkItem[]>([
    { platform: 'linkedin', url: '', verificationStatus: 'submitted_unverified' },
    { platform: 'orcid', url: '', verificationStatus: 'submitted_unverified' },
  ]);

  // Field Privacy
  const [fieldPrivacy, setFieldPrivacy] = useState<Record<string, FieldVisibility>>({
    legalNamePrivate: 'private',
    verifiedEmail: 'private',
    country: 'public',
    biography: 'public',
    portfolioUrl: 'public',
    socialLinks: 'public',
    publicContactEmail: 'public',
  });

  // Visual Signature
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn' | 'uploaded'>('typed');
  const [typedSignature, setTypedSignature] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnSignatureData, setDrawnSignatureData] = useState('');

  // Attestation
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [consentDate, setConsentDate] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setVerifiedEmail(user.email || '');
    async function load() {
      if (!user) return;
      setLoading(true);
      const existing = await getAuthorshipProfile(user.id, user.email || '');
      if (existing) {
        setPublicAuthorName(existing.publicAuthorName);
        setLegalNamePrivate(existing.legalNamePrivate);
        setProfilePhotoUrl(existing.profilePhotoUrl || '');
        setCountry(existing.country || 'United States');
        setBiography(existing.biography || '');
        setVerifiedEmail(existing.verifiedEmail || user.email || '');
        setProfessionalTitle(existing.professionalTitle || '');
        setOrganization(existing.organization || '');
        setPortfolioUrl(existing.portfolioUrl || '');
        setPersonalWebsite(existing.personalWebsite || '');
        setPublicContactEmail(existing.publicContactEmail || '');
        setOrcid(existing.orcid || '');
        setCopyrightStatement(existing.copyrightStatement || '© All rights reserved.');
        if (existing.socialLinks?.length) setSocialLinks(existing.socialLinks);
        if (existing.fieldPrivacy) setFieldPrivacy(existing.fieldPrivacy);
        setSignatureType(existing.visualSignatureType || 'typed');
        if (existing.visualSignatureType === 'typed') setTypedSignature(existing.visualSignatureData || '');
        if (existing.visualSignatureType === 'drawn') setDrawnSignatureData(existing.visualSignatureData || '');
        setAttestationChecked(existing.attestationAccepted);
        setConsentDate(existing.attestationConsentAt || null);
      } else {
        setPublicAuthorName(user.user_metadata?.full_name || '');
        setTypedSignature(user.user_metadata?.full_name || '');
      }
      setLoading(false);
    }
    load();
  }, [user]);

  // Canvas Drawing Handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setDrawnSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setDrawnSignatureData('');
    }
  };

  const handleAddSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: 'x', url: '', verificationStatus: 'submitted_unverified' }]);
  };

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSocialLinkChange = (index: number, field: keyof SocialLinkItem, value: any) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error('Please log in to save your author profile');
      return;
    }

    if (!publicAuthorName.trim()) {
      toast.error('Public author name is required');
      return;
    }

    if (!attestationChecked) {
      toast.error('Please accept the Authorship Attestation and terms');
      return;
    }

    let visualSig = '';
    if (signatureType === 'typed') visualSig = typedSignature;
    else if (signatureType === 'drawn') visualSig = drawnSignatureData;

    setSaving(true);
    const profileData: AuthorshipProfile = {
      userId: user.id,
      publicAuthorName: publicAuthorName.trim(),
      legalNamePrivate: legalNamePrivate.trim(),
      profilePhotoUrl: profilePhotoUrl.trim() || undefined,
      country,
      biography: biography.trim() || undefined,
      verifiedEmail,
      visualSignatureData: visualSig || undefined,
      visualSignatureType: signatureType,
      professionalTitle: professionalTitle.trim() || undefined,
      organization: organization.trim() || undefined,
      portfolioUrl: portfolioUrl.trim() || undefined,
      personalWebsite: personalWebsite.trim() || undefined,
      publicContactEmail: publicContactEmail.trim() || undefined,
      orcid: orcid.trim() || undefined,
      socialLinks: socialLinks.filter((s) => s.url.trim().length > 0),
      copyrightStatement: copyrightStatement.trim() || undefined,
      fieldPrivacy,
      attestationAccepted: attestationChecked,
      attestationVersion: 'v1.0-2026',
      attestationConsentAt: consentDate || new Date().toISOString(),
    };

    const result = await saveAuthorshipProfile(profileData);
    setSaving(false);

    if (result.success) {
      toast.success('Author profile and attestation saved successfully!');
    } else {
      toast.error(result.error || 'Failed to save author profile');
    }
  };

  return (
    <MainLayout>
      <PageMeta
        title="Author Profile & Attestation — Verified Authorship | AIDetector.cx"
        description="Manage your reusable verified authorship profile, visual signature, social link verifications, and signed legal attestation."
      />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="border-b pb-6 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Reusable Profile
            </Badge>
            <span className="text-xs text-muted-foreground">Attached to all Verified Authorship Certificates</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Verified Author Profile & Attestation</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Configure your public creator credentials, private legal identity, visual signatures, and verifiable attestation declarations.
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="identity" className="gap-2"><User className="w-4 h-4" />Identity</TabsTrigger>
            <TabsTrigger value="socials" className="gap-2"><Globe className="w-4 h-4" />Affiliations & Links</TabsTrigger>
            <TabsTrigger value="signature" className="gap-2"><FileSignature className="w-4 h-4" />Signature</TabsTrigger>
            <TabsTrigger value="attestation" className="gap-2"><ShieldCheck className="w-4 h-4" />Attestation</TabsTrigger>
          </TabsList>

          {/* 1. Identity Tab */}
          <TabsContent value="identity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Author Identity & Privacy</CardTitle>
                <CardDescription>
                  Public details appear on published certificates. Legal name and private details remain strictly confidential by default.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="publicName" className="font-semibold">Public Author / Pen Name *</Label>
                      <Badge variant="secondary" className="text-xs">Public</Badge>
                    </div>
                    <Input
                      id="publicName"
                      placeholder="e.g., Dr. Jane Doe"
                      value={publicAuthorName}
                      onChange={(e) => setPublicAuthorName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="legalName" className="font-semibold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Full Legal Name *
                      </Label>
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:border-amber-700">
                        Private by Default
                      </Badge>
                    </div>
                    <Input
                      id="legalName"
                      placeholder="e.g., Jane Elizabeth Doe"
                      value={legalNamePrivate}
                      onChange={(e) => setLegalNamePrivate(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Stored privately for dispute defense and audit proof. Never published on public certificates.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country of Residence / Jurisdiction</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo">Profile Photograph URL</Label>
                    <Input
                      id="photo"
                      placeholder="https://example.com/avatar.jpg"
                      value={profilePhotoUrl}
                      onChange={(e) => setProfilePhotoUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Author Biography</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    placeholder="Brief background on your research, writing field, or creative expertise..."
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Verified Account Email
                  </Label>
                  <Input id="email" value={verifiedEmail} disabled className="bg-muted" />
                  <p className="text-[11px] text-muted-foreground">
                    Tied to your authenticated AIDetector.cx account. Remains private to prevent spam.
                  </p>
                </div>

                {/* Authorship Attestation Terms (Acceptable at beginning) */}
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Authorship Attestation & Terms *
                    </Label>
                    <Badge variant={attestationChecked ? "default" : "outline"} className={attestationChecked ? "bg-emerald-600 text-white" : "text-amber-600 border-amber-300"}>
                      {attestationChecked ? "Accepted" : "Acceptance Required"}
                    </Badge>
                  </div>

                  <div className="p-3.5 rounded-lg bg-muted/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <p className="text-muted-foreground leading-relaxed">
                      By registering and certifying works on AIDetector.cx, you legally attest that you are the creator or authorized representative, that submitted works are original, and that cryptographic hashes will be anchored for timestamp verification.
                    </p>
                    <div className="flex items-start gap-2.5 pt-1">
                      <Checkbox
                        id="consentCheckIdentity"
                        checked={attestationChecked}
                        onCheckedChange={(checked) => {
                          setAttestationChecked(Boolean(checked));
                          if (checked && !consentDate) setConsentDate(new Date().toISOString());
                        }}
                        className="mt-0.5"
                      />
                      <Label htmlFor="consentCheckIdentity" className="text-xs font-medium cursor-pointer text-slate-800 dark:text-slate-200">
                        I have read, understood, and accept the Verified Authorship Attestation Terms
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Affiliations & Links Tab */}
          <TabsContent value="socials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Professional Affiliations & External Links</CardTitle>
                <CardDescription>
                  Attach academic identifiers, organizations, and verified profile links.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior Research Fellow"
                      value={professionalTitle}
                      onChange={(e) => setProfessionalTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org">Organization / Institution</Label>
                    <Input
                      id="org"
                      placeholder="e.g., Cambridge Institute of Technology"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orcid">ORCID Identifier</Label>
                    <Input
                      id="orcid"
                      placeholder="0000-0002-1825-0097"
                      value={orcid}
                      onChange={(e) => setOrcid(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio / Personal Website</Label>
                    <Input
                      id="portfolio"
                      placeholder="https://janedoe.com"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Connected Profiles & Social Channels</Label>
                    <Button variant="outline" size="sm" onClick={handleAddSocialLink} className="gap-1 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Add Link
                    </Button>
                  </div>

                  {socialLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
                      <select
                        aria-label="Social platform"
                        className="text-xs bg-background border rounded px-2 py-1.5"
                        value={link.platform}
                        onChange={(e) => handleSocialLinkChange(idx, 'platform', e.target.value)}
                      >
                        <option value="linkedin">LinkedIn</option>
                        <option value="x">X (Twitter)</option>
                        <option value="github">GitHub</option>
                        <option value="orcid">ORCID</option>
                        <option value="medium">Medium</option>
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="other">Other Profile</option>
                      </select>
                      <Input
                        className="text-xs flex-1 h-8"
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => handleSocialLinkChange(idx, 'url', e.target.value)}
                      />
                      <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground">
                        {link.verificationStatus === 'verified_account' ? 'Verified Account' :
                         link.verificationStatus === 'verified_domain' ? 'Verified Domain' : 'Submitted (Unverified)'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleRemoveSocialLink(idx)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Visual Signature Tab */}
          <TabsContent value="signature" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visual Attestation Signature</CardTitle>
                <CardDescription>
                  Rendered on your PDF authorship certificates and verification badges alongside the cryptographic platform signature.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={signatureType === 'typed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSignatureType('typed')}
                  >
                    Typed Font Signature
                  </Button>
                  <Button
                    variant={signatureType === 'drawn' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSignatureType('drawn')}
                  >
                    Draw Signature
                  </Button>
                </div>

                {signatureType === 'typed' && (
                  <div className="space-y-3">
                    <Label htmlFor="typedSig">Type your signature representation</Label>
                    <Input
                      id="typedSig"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="e.g., Dr. Jane Doe"
                      className="font-serif italic text-lg"
                    />
                    <div className="p-6 bg-muted/40 rounded-lg border text-center font-serif italic text-2xl text-slate-800 dark:text-slate-100">
                      {typedSignature || 'Signature Preview'}
                    </div>
                  </div>
                )}

                {signatureType === 'drawn' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Draw in the signature box below</Label>
                      <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-xs">
                        Clear Canvas
                      </Button>
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={200}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-40 bg-white dark:bg-slate-900 border rounded-lg cursor-crosshair touch-none shadow-inner"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Use your mouse, trackpad, or touch stylus to draw your unique author mark.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Attestation Tab */}
          <TabsContent value="attestation" className="space-y-6">
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Authorship Attestation & Legal Declaration</CardTitle>
                </div>
                <CardDescription>
                  You must review and consent to these statements before creating certified authorship registrations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border text-xs leading-relaxed space-y-2.5">
                  {AUTHORSHIP_ATTESTATION_CLAUSES.map((clause, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-primary shrink-0">{idx + 1}.</span>
                      <p className="text-slate-700 dark:text-slate-300">{clause}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                  <Checkbox
                    id="consentCheck"
                    checked={attestationChecked}
                    onCheckedChange={(checked) => {
                      setAttestationChecked(Boolean(checked));
                      if (checked && !consentDate) setConsentDate(new Date().toISOString());
                    }}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="consentCheck" className="text-xs font-semibold cursor-pointer">
                      I have read, understood, and accept the Verified Authorship Attestation Terms
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Consent records your user ID, attestation version (v1.0-2026), and UTC timestamp.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t bg-card/60 p-4 rounded-xl border">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Checkbox
              id="globalConsentCheck"
              checked={attestationChecked}
              onCheckedChange={(checked) => {
                setAttestationChecked(Boolean(checked));
                if (checked && !consentDate) setConsentDate(new Date().toISOString());
              }}
            />
            <Label htmlFor="globalConsentCheck" className="text-xs text-muted-foreground cursor-pointer select-none">
              I agree to the <span className="font-semibold text-foreground">Verified Authorship Attestation</span> clauses
            </Label>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 w-full sm:w-auto">
              {saving ? 'Saving Profile...' : 'Save Author Profile'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
