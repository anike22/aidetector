import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [meta, setMeta] = useState<any>(null);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (!sessionId && !reference) {
      setVerifying(false);
      setErrorMsg('No session ID or reference found.');
      return;
    }

    const verify = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        let res;
        
        if (reference) {
          // Paystack verification
          res = await supabase.functions.invoke('verify-paystack-payment', {
            body: { reference },
            headers: session?.access_token ? {
              Authorization: `Bearer ${session.access_token}`
            } : undefined
          });
        } else {
          // Stripe verification
          res = await supabase.functions.invoke('verify_stripe_payment', {
            body: { sessionId },
            headers: session?.access_token ? {
              Authorization: `Bearer ${session.access_token}`
            } : undefined
          });
        }

        if (res.error) throw res.error;
        if (res.data?.data?.verified || res.data?.verified) {
          setSuccess(true);
          const metadata = res.data?.data?.metadata || res.data?.metadata;
          setMeta(metadata);
          if (metadata?.type === 'upgrade') {
            await refreshProfile();
          }
        } else {
          setErrorMsg('Payment could not be verified or is not yet complete.');
        }
      } catch (err: any) {
        console.error('Verify error', err);
        setErrorMsg(err.message || 'Payment verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [sessionId, reference]);

  return (
    <MainLayout>
      <div className="flex-1 flex items-center justify-center p-4 py-16">
        <Card className="max-w-md w-full mx-auto text-center border-border shadow-card">
          <CardContent className="pt-10 pb-10 px-8 flex flex-col items-center">
            {verifying ? (
              <>
                <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-navy mb-2">Verifying Payment...</h1>
                <p className="text-muted-foreground">Please wait while we confirm your transaction securely.</p>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-navy mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground mb-8">
                  Thank you for your purchase. Your transaction has been completed securely.
                  {meta?.type === 'upgrade' ? ' Your account has been upgraded to Pro.' : ''}
                </p>
                <div className="flex flex-col gap-3 w-full">
                  <Link to="/dashboard" className="w-full">
                    <Button className="w-full h-11 bg-primary text-primary-foreground gap-2" onClick={() => {}}>
                      Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-navy mb-2">Verification Failed</h1>
                <p className="text-muted-foreground mb-8">{errorMsg}</p>
                <div className="flex flex-col gap-3 w-full">
                  <Button variant="outline" className="w-full h-11 border-border" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                  <Link to="/pricing" className="w-full">
                    <Button variant="ghost" className="w-full h-11 text-muted-foreground" onClick={() => {}}>
                      Return to Pricing
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
