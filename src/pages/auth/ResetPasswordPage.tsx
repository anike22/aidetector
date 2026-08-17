import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  const triggerReset = async (isResend = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auth-proxy', {
        body: { action: 'reset_password', email }
      });
      if (error) throw error;
      if (data && data.error) throw new Error(data.error);

      setSent(true);
      if (isResend) {
        toast.success("Reset email resent!");
        setResendCooldown(60);
        const int = setInterval(() => {
          setResendCooldown(c => {
             if (c <= 1) clearInterval(int);
             return c - 1;
          })
        }, 1000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    await triggerReset();
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
              Reset Password
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Enter your email and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-6">
                 <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8" />
                 </div>
                 <p className="text-muted-foreground">
                    If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                 </p>
                 <Button 
                   variant="outline" 
                   className="w-full"
                   disabled={resendCooldown > 0 || loading}
                   onClick={() => triggerReset(true)}
                 >
                   {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                   {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend Reset Email'}
                 </Button>
                 <div className="mt-4">
                   <Link to="/login" className="text-sm text-primary hover:underline">
                      Return to Login
                   </Link>
                 </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      className="pl-9 h-11 bg-muted/50 border-transparent focus-visible:bg-transparent"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold shadow-hover mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                
                <div className="mt-6 text-center">
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back to login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
