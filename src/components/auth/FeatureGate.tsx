import React, { useEffect, useState, ReactNode } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, AlertCircle, Clock, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

interface FeatureFlag {
  id: string;
  feature_name: string;
  feature_slug: string;
  status: string;
  public_message: string | null;
  requires_login: boolean;
  is_enabled: boolean;
  show_in_navigation: boolean;
  show_on_homepage: boolean;
  show_in_footer: boolean;
  allow_direct_access: boolean;
  is_indexable: boolean;
  required_plan: string;
}

interface Props {
  featureSlug: string;
  children: ReactNode;
}

export default function FeatureGate({ featureSlug, children }: Props) {
  const [feature, setFeature] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const location = useLocation();

  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchFeatureStatus();
  }, [featureSlug]);

  const fetchFeatureStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('feature_slug', featureSlug)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error(error);
      }
      
      // If not found, default to active to not break existing pages
      if (!data) {
        setFeature({
          id: 'temp',
          feature_name: featureSlug,
          feature_slug: featureSlug,
          status: 'active',
          public_message: null,
          requires_login: false,
          is_enabled: true,
          show_in_navigation: true,
          show_on_homepage: true,
          show_in_footer: true,
          allow_direct_access: true,
          is_indexable: true,
          required_plan: 'free'
        });
      } else {
        setFeature(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName || !requestEmail) {
      toast.error('Please fill out all fields');
      return;
    }
    
    setSubmitting(true);
    try {
      await supabase.from('feature_requests').insert({
        feature_slug: featureSlug,
        user_name: requestName,
        user_email: requestEmail
      });
      setSubmitted(true);
      toast.success('Request submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!feature) return <>{children}</>;

  if (feature.status === 'hidden' || !feature.is_enabled || !feature.allow_direct_access) {
    return <Navigate to="/404" replace />;
  }

  if (feature.requires_login && !user) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  // Plan check
  const userPlan = profile?.subscription_plan || 'free';
  const isAdmin = profile?.role === 'admin';
  const planLevels = { 'free': 0, 'pro': 1, 'business': 2, 'enterprise': 3 };
  
  if (!isAdmin && feature.required_plan && feature.required_plan !== 'free') {
    const requiredLevel = planLevels[feature.required_plan as keyof typeof planLevels] || 0;
    const userLevel = planLevels[userPlan as keyof typeof planLevels] || 0;
    
    if (userLevel < requiredLevel) {
      // User doesn't have the required plan
      return (
        <div className="flex flex-col min-h-[60vh] pt-20 px-4 items-center justify-center">
          <Helmet>
            <meta name="robots" content="noindex, nofollow" />
          </Helmet>
          <Card className="max-w-md w-full border-primary shadow-sm bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-navy">{feature.feature_name} is a Premium Feature</CardTitle>
              <CardDescription>
                This feature requires the <span className="capitalize font-semibold text-primary">{feature.required_plan}</span> plan or higher.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-3">
              <Button className="w-full bg-primary" onClick={() => window.location.href = '/pricing'}>
                Upgrade Plan
              </Button>
              <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  if (feature.status === 'active') {
    if (!feature.is_indexable) {
      return (
        <>
          <Helmet>
            <meta name="robots" content="noindex, nofollow" />
          </Helmet>
          {children}
        </>
      );
    }
    return <>{children}</>;
  }

  // Handle coming_soon or maintenance
  const isMaintenance = feature.status === 'maintenance';
  const defaultMsg = isMaintenance 
    ? 'This feature is temporarily unavailable while we improve it.' 
    : 'This feature is coming soon. Request early access.';
    
  return (
    <div className="flex flex-col min-h-screen pt-20">
      {/* SEO Rules */}
      <Helmet>
        <meta name="robots" content={(!feature.is_indexable || isMaintenance) ? "noindex, nofollow" : "noindex, follow"} />
      </Helmet>
      
      <div className="max-w-2xl w-full mx-auto px-4 md:px-6 py-12 flex-1 flex flex-col items-center justify-center">
        <Card className="w-full text-center border-border shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${isMaintenance ? 'bg-amber-500' : 'bg-blue-500'}`} />
          <CardHeader className="pt-8">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-muted">
              {isMaintenance ? (
                <AlertCircle className="w-8 h-8 text-amber-500" />
              ) : (
                <Clock className="w-8 h-8 text-blue-500" />
              )}
            </div>
            <CardTitle className="text-2xl">{feature.feature_name}</CardTitle>
            <CardDescription className="text-base mt-2">
              {feature.public_message || defaultMsg}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            {submitted ? (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-center justify-center gap-2 border border-emerald-100">
                <Send className="w-4 h-4" />
                <span className="font-medium">You're on the list! We'll email you soon.</span>
              </div>
            ) : (
              <form onSubmit={handleRequest} className="max-w-md mx-auto space-y-4 mt-4 text-left">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Your name" 
                    value={requestName} 
                    onChange={e => setRequestName(e.target.value)} 
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={requestEmail} 
                    onChange={e => setRequestEmail(e.target.value)} 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Request {isMaintenance ? 'Notification' : 'Early Access'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}