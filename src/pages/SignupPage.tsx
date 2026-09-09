import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bot, Mail, Lock, Eye, EyeOff, User, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerDataPlatform } from '@/contexts/CustomerDataPlatformContext';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { trackLifecycleEvent } from '@/lib/trackLifecycleEvent';
import { recordReferralClick, recordReferralStage } from '@/lib/referralApi';
import { getInvitationByToken } from '@/lib/enterpriseApi';
import { getVisitorId } from '@/lib/visitorId';

const perks = [
  '4 additional free introductory checks (5 total trial checks)',
  'Access to AI tools directory & Humanizer preview',
  'Real-time sentence-level analysis & exports',
  'Full draft preservation across sessions',
];

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { trackEvent } = useCustomerDataPlatform();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');
  const invitationToken = searchParams.get('invitation_token');
  const returnTo = searchParams.get('returnTo') || searchParams.get('return_to') || searchParams.get('redirect') || '';
  const [visitorId] = useState(() => crypto.randomUUID());
  const [referralTracked, setReferralTracked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailLocked, setEmailLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [sent, setSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [existingUser, setExistingUser] = useState<{ verified: boolean } | null>(null);

  useEffect(() => {
    if (refCode && !referralTracked) {
      recordReferralClick(refCode, visitorId)
        .then(() => setReferralTracked(true))
        .catch((err) => console.warn('Referral click tracking failed:', err));
    }
  }, [refCode, visitorId, referralTracked]);

  useEffect(() => {
    if (!invitationToken) return;
    getInvitationByToken(invitationToken)
      .then((inv) => {
        if (inv?.email) {
          setEmail(inv.email);
          setEmailLocked(true);
        }
      })
      .catch((err) => console.warn('Could not load invitation email:', err));
  }, [invitationToken]);

  const trackSignupReferral = async () => {
    if (refCode && referralTracked) {
      try {
        await recordReferralStage(refCode, 'signup', visitorId);
      } catch (err) {
        console.warn('Referral signup tracking failed:', err);
      }
    }
  };

  async function parseFunctionError(error: any): Promise<{ message: string; body?: Record<string, unknown> }> {
    const raw = error?.message || '';
    let body: Record<string, unknown> | undefined;
    try {
      if (error?.context?.json) {
        body = await error.context.json();
      } else if (error?.context) {
        body = typeof error.context === 'string' ? JSON.parse(error.context) : error.context;
      }
    } catch {
      body = undefined;
    }
    const serverMessage = (body?.error as string) || (body?.message as string) || '';
    if (serverMessage.includes('already exists')) {
      return { message: 'An account already exists with this email.', body };
    }
    if (serverMessage.includes('rate limit') || raw.includes('rate limit')) {
      return { message: 'Too many attempts. Please wait a moment and try again.', body };
    }
    if (serverMessage.includes('temporary service error') || raw.includes('temporary service error')) {
      return { message: 'Our service is temporarily unavailable. Please try again in a few minutes.', body };
    }
    if (serverMessage.includes('request body') || raw.includes('request body')) {
      return { message: 'Please check your input and try again.', body };
    }
    return { message: serverMessage || raw || 'Failed to create account. Please try again.', body };
  }

  async function getServerErrorMessage(error: any): Promise<string> {
    return (await parseFunctionError(error)).message;
  }

  const triggerSignup = async (isResend = false) => {
    setLoading(true);
    setError('');
    try {
      if (isResend) {
        const { data, error } = await supabase.functions.invoke('register', {
          body: { action: 'resend', email }
        });
        if (error) {
          const message = await getServerErrorMessage(error);
          setError(message);
          trackEvent({ event_type: 'registration_failed', metadata: { source: 'resend', reason: message } });
          return;
        }
        if (!data?.success) {
          throw new Error(data?.error || 'Could not resend email.');
        }
        setSent(true);
        toast.success('Verification email resent!');
        setResendCooldown(60);
        const int = setInterval(() => {
          setResendCooldown(c => {
             if (c <= 1) clearInterval(int);
             return c - 1;
          })
        }, 1000);
        trackLifecycleEvent('verification_email_resent', { source: 'signup_page' });
        trackEvent({ event_type: 'verification_email_resent', metadata: { source: 'signup_page' } });
        return;
      }

      trackEvent({ event_type: 'registration_started', metadata: { source: 'email_signup' } });

      const guestId = getVisitorId();
      const { data, error } = await supabase.functions.invoke('register', {
        body: { action: 'register', email, password, fullName: name.trim(), referralCode: refCode || undefined, return_to: returnTo || undefined, guestId }
      });
      if (error) {
        const { message, body } = await parseFunctionError(error);
        setError(message);
        const isExisting = (body?.error as string)?.includes('already exists') ?? false;
        setExistingUser(isExisting ? { verified: !!body?.verified } : null);
        trackEvent({ event_type: 'registration_failed', metadata: { source: 'email_signup', reason: message, verified: !!body?.verified } });
        return;
      }
      setExistingUser(null);
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create account.');
      }

      setSent(true);
      if (returnTo) {
        sessionStorage.setItem('post_auth_redirect', returnTo);
      }
      toast.success(data.message || 'Account created! Please check your email.');
      trackLifecycleEvent('user_registered', { source: 'email_signup', email_sent: data.email_sent });
      trackEvent({
        event_type: 'registration_completed',
        metadata: { source: 'email_signup', email_sent: data.email_sent, user_id: data.user_id },
      });
      await trackSignupReferral();
    } catch (err: any) {
      const message = err?.message || 'Failed to create account. Please try again.';
      setError(message);
      trackEvent({
        event_type: 'registration_failed',
        metadata: { source: 'email_signup', reason: message },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (name.trim().length < 2) { setError('Full name must be at least 2 characters.'); return; }
    if (!email) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Please create a password.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!agreed) { setError('Please accept the Terms of Service and Privacy Policy.'); return; }
    setError('');

    await triggerSignup();
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error: authError } = await signInWithGoogle();
    setGoogleLoading(false);
    if (authError) toast.error(authError);
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left side — perks */}
        <div className="hidden md:flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-3 mb-2">
            <img 
              src="/brand/aidetector-icon.png" 
              alt="Logo" 
              className="w-10 h-10 object-contain rounded-xl shadow-sm"
            />
            <span className="font-bold text-xl text-navy">
              AIDetector<span className="text-primary">.cx</span>
            </span>
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-navy text-balance mb-2">Join 85,000+ builders</h2>
            <p className="text-muted-foreground text-pretty">Everything you need to build and grow an AI-powered business.</p>
          </div>
          <div className="flex flex-col gap-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                <span className="text-sm text-foreground/80">{perk}</span>
              </div>
            ))}
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="font-semibold text-navy text-sm">Trusted by professionals</div>
                <div className="text-xs text-muted-foreground">85K+ active users, 4.9/5 average rating</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic text-pretty">
              "Went from 0 to $8k/month implementing strategies from the community and guides." — Priya S.
            </p>
          </div>
        </div>

        {/* Right side — form */}
        <div>
          <Link to="/" className="flex items-center gap-3 mb-6 md:hidden">
            <img 
              src="/brand/aidetector-icon.png" 
              alt="Logo" 
              className="w-10 h-10 object-contain rounded-xl shadow-sm"
            />
            <span className="font-bold text-xl text-navy">
              AIDetector<span className="text-primary">.cx</span>
            </span>
          </Link>

          <Card className="border-border shadow-hover">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-navy text-center">Create your free account</CardTitle>
              <p className="text-sm text-muted-foreground text-center">No credit card required</p>
            </CardHeader>
            <CardContent className="p-6">
              {sent ? (
                <div className="text-center space-y-6">
                   <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                      <Mail className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-bold text-navy">Check your inbox</h3>
                   <p className="text-muted-foreground">
                      We've sent a verification email to <strong>{email}</strong>.<br/>
                      Please click the link in the email to activate your account.
                   </p>
                   <Button 
                     variant="outline" 
                     className="w-full" 
                     disabled={resendCooldown > 0 || loading}
                     onClick={() => triggerSignup(true)}
                   >
                     {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                     {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend Verification Email'}
                   </Button>
                   <div className="mt-4">
                     <Link to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'} className="text-sm text-primary hover:underline">
                        Return to Login
                     </Link>
                   </div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4 space-y-2">
                      <p>{error}</p>
                      {existingUser && (
                        <div className="flex flex-col gap-2 pt-1">
                          {!existingUser.verified ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              disabled={resendCooldown > 0 || loading}
                              onClick={() => triggerSignup(true)}
                            >
                              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              {resendCooldown > 0 ? `Resend verification in ${resendCooldown}s` : 'Resend verification email'}
                            </Button>
                          ) : (
                            <>
                              <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                                <Link to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'}>Log in to your account</Link>
                              </Button>
                              <p className="text-xs text-center">
                                Forgot your password?{' '}
                                <Link to="/forgot-password" className="underline font-medium">Reset it</Link>
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-normal mb-1.5 block">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Alex Johnson"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-11 border-border text-base"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-normal mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-11 border-border text-base"
                      required
                      autoComplete="email"
                      disabled={emailLocked}
                      aria-describedby={emailLocked ? 'email-locked-note' : undefined}
                    />
                  </div>
                  {emailLocked && (
                    <p id="email-locked-note" className="text-xs text-muted-foreground mt-1">
                      This email is locked because it matches your invitation.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-normal mb-1.5 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10 h-11 border-border text-base"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer min-h-12">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 shrink-0 w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-xs text-muted-foreground text-pretty leading-relaxed">
                    I agree to the{' '}
                    <span className="text-primary underline cursor-pointer hover:text-primary/80">Terms of Service</span>{' '}
                    and{' '}
                    <span className="text-primary underline cursor-pointer hover:text-primary/80">Privacy Policy</span>
                  </span>
                </label>

                <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground font-semibold gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create Free Account</span> <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground text-center mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
                  Sign in
                </Link>
              </p>
            </>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
