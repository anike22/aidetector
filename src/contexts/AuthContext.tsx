import * as React from 'react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';
import { trackLifecycleEvent } from '@/lib/trackLifecycleEvent';

export const KNOWN_ADMIN_EMAILS = [
  'anikeaidetector@gmail.com',
];

export function isUserAdmin(profile?: Profile | null, user?: User | null): boolean {
  if (profile?.role === 'admin') return true;
  const email = user?.email?.toLowerCase().trim() || '';
  if (!email) return false;
  if (KNOWN_ADMIN_EMAILS.includes(email)) return true;
  if (email.startsWith('admin@')) return true;
  return false;
}

async function getProfile(userId: string, userEmail?: string | null): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) console.error('Failed to fetch profile:', error);

  const isExplicitAdmin = isUserAdmin(data as Profile | null, { email: userEmail } as User);
  if (data) {
    const profile = data as Profile;
    if (isExplicitAdmin && profile.role !== 'admin') {
      profile.role = 'admin';
      supabase.from('profiles').update({ role: 'admin' }).eq('id', userId).then();
    }
    return profile;
  }

  if (isExplicitAdmin && userEmail) {
    return {
      id: userId, email: userEmail, phone: null, full_name: 'Admin', avatar_url: null,
      role: 'admin', subscription_plan: 'enterprise', subscription_status: 'active',
      plan_start_date: new Date().toISOString(), plan_end_date: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
  }
  return null;
}

interface AuthContextType {
  user: User | null; profile: Profile | null; loading: boolean; isAdmin: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) { setProfile(null); return; }
    const profileData = await getProfile(user.id, user.email);
    setProfile(profileData);
    if (user.email_confirmed_at) trackLifecycleEvent('email_verified');
  };

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          getProfile(session.user.id, session.user.email).then(setProfile);
          if (session.user.email_confirmed_at) trackLifecycleEvent('email_verified');
        }
      })
      .catch((err) => console.error('Session fetch error:', err))
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id, session.user.email).then(setProfile);
        if (session.user.email_confirmed_at) trackLifecycleEvent('email_verified');
        const guestId = (() => {
          try {
            return localStorage.getItem('aicx_vid') || localStorage.getItem('aidetector_visitor_id') || localStorage.getItem('visitor_id') || '';
          } catch { return ''; }
        })();
        if (guestId) {
          supabase.rpc('link_guest_to_registered_user', { p_guest_id: guestId, p_user_id: session.user.id }).then();
        }
        window.dispatchEvent(new CustomEvent('usage-updated'));
        window.dispatchEvent(new CustomEvent('subscription-updated'));
        if (event === 'SIGNED_IN') {
          const provider = String(session.user.app_metadata?.provider || '');
          const createdAt = Date.parse(session.user.created_at || '');
          if (provider === 'google' && Number.isFinite(createdAt) && Date.now() - createdAt <= 15 * 60 * 1000) {
            supabase.functions.invoke('register', { body: { action: 'google_welcome' } })
              .then(({ error }) => { if (error) console.warn('Google welcome email trigger failed:', error); });
          }
          const affiliateLinkId = sessionStorage.getItem('affiliate_link_id');
          const affiliateVisitorId = sessionStorage.getItem('affiliate_visitor_id');
          if (affiliateLinkId && affiliateVisitorId) {
            supabase.rpc('link_affiliate_signup', {
              p_affiliate_link_id: affiliateLinkId,
              p_visitor_id: affiliateVisitorId,
              p_user_id: session.user.id,
            }).then(({ error }) => {
              if (!error) {
                sessionStorage.removeItem('affiliate_link_id');
                sessionStorage.removeItem('affiliate_visitor_id');
              }
            });
          }
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } else {
        setProfile(null);
        window.dispatchEvent(new CustomEvent('usage-updated'));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    trackLifecycleEvent('login', { method: 'email' });
    return { error: null };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signInWithGoogle = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const affiliateLinkId = params.get('aff') || sessionStorage.getItem('affiliate_link_id');
      if (affiliateLinkId) {
        sessionStorage.setItem('affiliate_link_id', affiliateLinkId);
        const visitorId = (() => {
          try {
            return localStorage.getItem('aicx_vid') || localStorage.getItem('aidetector_visitor_id') || localStorage.getItem('visitor_id') || '';
          } catch { return ''; }
        })();
        if (visitorId) sessionStorage.setItem('affiliate_visitor_id', visitorId);
      }
      const redirectUrl = new URL(window.location.href);
      redirectUrl.searchParams.delete('code');
      redirectUrl.searchParams.delete('error');
      redirectUrl.searchParams.delete('error_code');
      redirectUrl.searchParams.delete('error_description');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl.toString() },
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Google sign-in failed.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
  };

  const userIsAdmin = isUserAdmin(profile, user);
  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin: userIsAdmin, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
