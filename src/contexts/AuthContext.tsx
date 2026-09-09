import * as React from 'react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';
import { trackLifecycleEvent } from '@/lib/trackLifecycleEvent';

async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
  return data as Profile | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
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
    // Refresh session to pull updated app_metadata/subscription entitlements
    await supabase.auth.refreshSession().catch(() => {});
    const profileData = await getProfile(user.id);
    setProfile(profileData);
    if (user.email_confirmed_at) {
      trackLifecycleEvent('email_verified');
    }
  };

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          getProfile(session.user.id).then(setProfile);
          if (session.user.email_confirmed_at) {
            trackLifecycleEvent('email_verified');
          }
        }
      })
      .catch((err) => console.error('Session fetch error:', err))
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
        if (session.user.email_confirmed_at) {
          trackLifecycleEvent('email_verified');
        }

        // Link guest history and refresh usage allowances.
        // Reads the canonical 'aicx_vid' key (was mismatched before, which
        // silently skipped linking → duplicate trial grants at registration).
        const guestId = (() => {
          try {
            return localStorage.getItem('aicx_vid') || localStorage.getItem('aidetector_visitor_id') || localStorage.getItem('visitor_id') || '';
          } catch {
            return '';
          }
        })();

        if (guestId) {
          supabase.rpc('link_guest_to_registered_user', {
            p_guest_id: guestId,
            p_user_id: session.user.id
          }).then();
        }

        window.dispatchEvent(new CustomEvent('usage-updated'));
        window.dispatchEvent(new CustomEvent('subscription-updated'));

        // Clear hash if returning from OAuth
        if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithSSO({
        domain: 'miaoda-gg.com',
        options: { redirectTo: window.location.origin },
      });
      if (error) return { error: error.message };
      if (data?.url) window.open(data.url, '_self');
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Google sign-in failed.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
