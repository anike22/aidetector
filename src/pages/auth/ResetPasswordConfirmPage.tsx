import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as any;

    if (tokenHash && type) {
      setLoading(true);
      supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
         setLoading(false);
         if (error) toast.error("Invalid or expired link: " + error.message);
      });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event == "PASSWORD_RECOVERY") {
         // session is available if they clicked the link and are now verified to change password
      }
    })
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    
    setLoading(false);
    
    if (error) {
       toast.error(error.message);
    } else {
       toast.success("Password updated successfully.");
       navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <img 
            src="https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain rounded-xl"
          />
          <span className="text-2xl font-bold tracking-tight text-navy">
            AIDetector.cx
          </span>
        </Link>

        <Card className="border-border/50 shadow-premium">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight text-navy">
              Set New Password
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10 h-11 border-border text-base"
                      required
                      minLength={6}
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

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold shadow-hover mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating</>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
