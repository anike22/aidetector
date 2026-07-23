import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bot, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { useEffect } from 'react';

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('verified') === 'true') {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') as any;
      
      if (tokenHash && type) {
        // Need to verify OTP to complete signup
        supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
          if (!error) {
             toast.success('Email verified successfully! You can now log in.');
          } else {
             toast.error('Verification failed: ' + error.message);
          }
        });
      } else {
        toast.success('Email verified successfully! You can now log in.');
      }
      
      // Clean up URL
      searchParams.delete('verified');
      searchParams.delete('token_hash');
      searchParams.delete('type');
      const newUrl = searchParams.toString() ? `${window.location.pathname}?${searchParams.toString()}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    const { error: authError } = await signInWithEmail(email, password);
    setLoading(false);
    if (authError) {
      setError(authError === 'Invalid login credentials' ? 'Incorrect email or password.' : authError);
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error: authError } = await signInWithGoogle();
    setGoogleLoading(false);
    if (authError) toast.error(authError);
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <img 
            src="https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain rounded-xl shadow-sm"
          />
          <span className="font-bold text-xl text-navy">
            AIDetector<span className="text-primary">.cx</span>
          </span>
        </Link>

        <Card className="border-border shadow-hover">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-navy text-center">Welcome back</CardTitle>
            <p className="text-sm text-muted-foreground text-center">Sign in to your account</p>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" className="text-sm font-normal">Password</Label>
                  <Link to="/reset-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 h-11 border-border text-base"
                    required
                    autoComplete="current-password"
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

              <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground font-semibold gap-2 mt-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span> <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Sign up free
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
