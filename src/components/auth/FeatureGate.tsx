import React, { useEffect, useState, ReactNode } from 'react';
import { Navigate, useParams, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, AlertCircle, Clock, Loader2, Send, ArrowRight, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { getFeatureFlagSync, DEFAULT_UNAVAILABLE_MESSAGE, FeatureFlag, normalizeFeatureSlug } from '@/lib/featureFlags';

interface Props {
  featureSlug: string;
  children: ReactNode;
}

export default function FeatureGate({ featureSlug, children }: Props) {
  const normalizedSlug = normalizeFeatureSlug(featureSlug);
  const initialFlag = getFeatureFlagSync(normalizedSlug);
  const [feature, setFeature] = useState<FeatureFlag>(initialFlag);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const location = useLocation();

  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchFeatureStatus();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, FeatureFlag>>;
      if (customEvent.detail && customEvent.detail[normalizedSlug]) {
        setFeature(customEvent.detail[normalizedSlug]);
      }
    };

    window.addEventListener('feature_flags_updated', handleUpdate);
    return () => {
      window.removeEventListener('feature_flags_updated', handleUpdate);
    };
  }, [normalizedSlug]);

  const fetchFeatureStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('feature_slug', normalizedSlug)
        .maybeSingle();
        
      if (!error && data) {
        setFeature(data);
      }
    } catch (e) {
      console.error(e);
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
        feature_slug: normalizedSlug,
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

  // Handle HIDDEN / DISABLED services with the exact required public message
  if (feature.status === 'hidden' || !feature.is_enabled || feature.allow_direct_access === false) {
    const unavailableMessage = feature.public_message?.trim() || DEFAULT_UNAVAILABLE_MESSAGE;
    
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
        <Helmet>
          <title>{feature.feature_name || 'Service'} Unavailable | AIDetector.cx</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        
        <Card className="max-w-xl w-full border-border/70 shadow-lg text-center p-6 md:p-8 rounded-2xl bg-card">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <CardTitle className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Service Unavailable
          </CardTitle>
          
          <CardDescription className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
            {unavailableMessage}
          </CardDescription>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/tools" className="flex items-center gap-2">
                <span>Explore AI Tools</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link to="/" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span>Return to Homepage</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
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