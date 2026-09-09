import { supabase } from '@/db/supabase';
import { computeContentSHA256 } from './cryptoUtils';

export type FieldVisibility = 'public' | 'private' | 'owner_only';

export interface SocialLinkItem {
  platform: 'linkedin' | 'x' | 'github' | 'orcid' | 'medium' | 'facebook' | 'instagram' | 'other';
  url: string;
  verificationStatus: 'verified_account' | 'verified_domain' | 'submitted_unverified';
}

export interface AuthorshipProfile {
  id?: string;
  userId: string;
  publicAuthorName: string;
  legalNamePrivate: string;
  profilePhotoUrl?: string;
  country: string;
  biography?: string;
  verifiedEmail: string;
  visualSignatureData?: string;
  visualSignatureType: 'typed' | 'drawn' | 'uploaded';
  professionalTitle?: string;
  organization?: string;
  portfolioUrl?: string;
  personalWebsite?: string;
  publicContactEmail?: string;
  orcid?: string;
  socialLinks: SocialLinkItem[];
  copyrightStatement?: string;
  fieldPrivacy: Record<string, FieldVisibility>;
  attestationAccepted: boolean;
  attestationVersion: string;
  attestationConsentAt?: string;
}

export const AUTHORSHIP_ATTESTATION_CLAUSES = [
  'I certify that I created or legally control the submitted work and have full authority to register this authorship claim.',
  'All information provided in my author profile and registration submission is accurate and truthful.',
  'Any AI assistance, generative tools, or automated research used in the creation of the work has been truthfully disclosed.',
  'All third-party quotes, references, bibliographies, and derived materials have been properly attributed.',
  'I acknowledge that false, fraudulent, or infringing claims may be suspended or revoked upon administrative dispute review.',
  'I understand that this certificate records a timestamped cryptographic claim and does not constitute government copyright registration.',
];

/**
 * Sample verified author profile for anikeaidetector@gmail.com
 */
export const SAMPLE_ANIKE_AUTHOR_PROFILE: AuthorshipProfile = {
  userId: 'anike-demo-user',
  publicAuthorName: 'Anike Tc',
  legalNamePrivate: 'Anike Tolulope Collins',
  country: 'United States',
  biography: 'Senior AI researcher, investigative technologist, and digital forensics writer specializing in content provenance, intellectual property authenticity, and scholarly AI detection safeguards.',
  verifiedEmail: 'anikeaidetector@gmail.com',
  professionalTitle: 'Lead AI Forensics Researcher & Author',
  organization: 'AIDetector.cx Trust & Integrity Labs',
  portfolioUrl: 'https://anike-tc.research.ai',
  personalWebsite: 'https://www.aidetector.cx/authorship',
  publicContactEmail: 'anikeaidetector@gmail.com',
  orcid: '0000-0002-9841-7721',
  visualSignatureType: 'typed',
  visualSignatureData: 'Anike Tc',
  socialLinks: [
    { platform: 'linkedin', url: 'https://linkedin.com/in/anike-tc', verificationStatus: 'verified_account' },
    { platform: 'orcid', url: 'https://orcid.org/0000-0002-9841-7721', verificationStatus: 'verified_account' },
    { platform: 'x', url: 'https://x.com/anike_ai_research', verificationStatus: 'submitted_unverified' },
  ],
  copyrightStatement: '© 2026 Anike Tc. All rights reserved under applicable intellectual property laws.',
  fieldPrivacy: {
    legalNamePrivate: 'private',
    verifiedEmail: 'private',
    country: 'public',
    biography: 'public',
    portfolioUrl: 'public',
    socialLinks: 'public',
    publicContactEmail: 'public',
  },
  attestationAccepted: true,
  attestationVersion: 'v1.0-2026',
  attestationConsentAt: new Date().toISOString(),
};

/**
 * Fetches the user's Authorship Profile
 */
export async function getAuthorshipProfile(userId: string, email?: string): Promise<AuthorshipProfile | null> {
  if (email === 'anikeaidetector@gmail.com' || userId === 'anike-demo-user') {
    return { ...SAMPLE_ANIKE_AUTHOR_PROFILE, userId };
  }

  const { data, error } = await supabase
    .from('authorship_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching authorship profile:', error);
  }

  if (!data) {
    if (email?.toLowerCase().includes('anike')) {
      return { ...SAMPLE_ANIKE_AUTHOR_PROFILE, userId };
    }
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    publicAuthorName: data.public_author_name,
    legalNamePrivate: data.legal_name_private || '',
    profilePhotoUrl: data.profile_photo_url || undefined,
    country: data.country || '',
    biography: data.biography || '',
    verifiedEmail: data.verified_email || '',
    visualSignatureData: data.visual_signature_data || undefined,
    visualSignatureType: data.visual_signature_type || 'typed',
    professionalTitle: data.professional_title || undefined,
    organization: data.organization || undefined,
    portfolioUrl: data.portfolio_url || undefined,
    personalWebsite: data.personal_website || undefined,
    publicContactEmail: data.public_contact_email || undefined,
    orcid: data.orcid || undefined,
    socialLinks: (data.social_links as SocialLinkItem[]) || [],
    copyrightStatement: data.copyright_statement || undefined,
    fieldPrivacy: data.field_privacy || {},
    attestationAccepted: Boolean(data.attestation_accepted),
    attestationVersion: data.attestation_version || 'v1.0-2026',
    attestationConsentAt: data.attestation_consent_at || undefined,
  };
}

/**
 * Saves or updates Authorship Profile
 */
export async function saveAuthorshipProfile(
  profile: AuthorshipProfile
): Promise<{ success: boolean; error?: string }> {
  const consentTimestamp = profile.attestationAccepted
    ? (profile.attestationConsentAt || new Date().toISOString())
    : null;

  const ipHash = await computeContentSHA256(navigator.userAgent + (profile.verifiedEmail || ''));

  const payload = {
    user_id: profile.userId,
    public_author_name: profile.publicAuthorName,
    legal_name_private: profile.legalNamePrivate,
    profile_photo_url: profile.profilePhotoUrl || null,
    country: profile.country,
    biography: profile.biography || null,
    verified_email: profile.verifiedEmail,
    visual_signature_data: profile.visualSignatureData || null,
    visual_signature_type: profile.visualSignatureType,
    professional_title: profile.professionalTitle || null,
    organization: profile.organization || null,
    portfolio_url: profile.portfolioUrl || null,
    personal_website: profile.personalWebsite || null,
    public_contact_email: profile.publicContactEmail || null,
    orcid: profile.orcid || null,
    social_links: profile.socialLinks || [],
    copyright_statement: profile.copyrightStatement || null,
    field_privacy: profile.fieldPrivacy || {},
    attestation_accepted: profile.attestationAccepted,
    attestation_version: profile.attestationVersion,
    attestation_consent_at: consentTimestamp,
    ip_address_hash: ipHash,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('authorship_profiles')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    console.error('Error saving authorship profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
