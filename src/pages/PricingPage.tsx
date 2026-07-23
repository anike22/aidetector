import { useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';
import { CheckCircle2, X, HelpCircle, Zap, Users, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Perfect to get started and explore the platform',
    features: {
      'AI checks/month': '5',
      'Doc intelligence uploads': '5/month',
      'AI editing operations': '50/month',
      'Community access': true,
      'API access': false,
      'Export reports': false,
      'Team members': '1',
      'Priority support': false,
    },
    cta: 'Get Started Free',
    href: '/signup',
    primary: false,
    icon: Shield,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50/40',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For creators and professionals who need more power',
    features: {
      'AI checks/month': '100',
      'Doc intelligence uploads': '100/month',
      'AI editing operations': 'Unlimited',
      'Community access': true,
      'API access': true,
      'Export reports': 'PDF, CSV',
      'Team members': '1',
      'Priority support': 'Email',
    },
    cta: 'Start Pro Trial',
    href: '/signup',
    primary: true,
    badge: 'Most Popular',
    icon: Zap,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'business',
    name: 'Business',
    price: '$49',
    period: '/month',
    description: 'For agencies and teams needing full control',
    features: {
      'AI checks/month': 'Unlimited',
      'Doc intelligence uploads': 'Unlimited',
      'AI editing operations': 'Unlimited',
      'Community access': true,
      'API access': true,
      'Export reports': 'All formats',
      'Team members': '5',
      'Priority support': 'Priority',
    },
    cta: 'Contact Sales',
    href: '/signup',
    primary: false,
    icon: Users,
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

const comparisonFeatures = [
  'AI checks/month',
  'Doc intelligence uploads',
  'AI editing operations',
  'Community access',
  'API access',
  'Export reports',
  'Team members',
  'Priority support',
];

const faqs = [
  {
    q: 'How accurate is the AI detection?',
    a: 'Our detection engine achieves 98% accuracy across GPT-4, Claude, Gemini, and other major AI models. We continuously update our models to detect the latest AI writing patterns.',
  },
  {
    q: 'Can I try Pro before committing?',
    a: 'Yes! Pro comes with a 7-day free trial — no credit card required. You get full access to all Pro features during the trial period.',
  },
  {
    q: 'What counts as an AI check?',
    a: 'One AI check is one content submission for analysis, regardless of length. Scanning a 100-word blog post counts the same as scanning a 5,000-word article.',
  },
  {
    q: 'Can I upgrade or downgrade at any time?',
    a: 'Absolutely. You can upgrade immediately with prorated billing, or downgrade at the end of your current billing period.',
  },
  {
    q: 'Do you offer team or enterprise plans?',
    a: 'The Business plan supports 5 team members. For larger teams (10+), contact our sales team for a custom enterprise plan with volume discounts and dedicated support.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. We never store the content you submit for analysis. All submissions are processed in real-time and deleted immediately. We are SOC 2 Type II certified.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for annual plans.',
  },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle2 className="w-4 h-4 text-success mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-muted-foreground mx-auto opacity-40" />;
  return <span className="text-sm font-medium text-navy">{value}</span>;
}

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleAction = async (planId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    
    if (planId === 'free') {
      navigate('/dashboard');
      return;
    }

    if (planId === 'business') {
      navigate('/contact');
      return;
    }

    if (planId === 'pro') {
      setLoadingPlan('pro');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const price = billing === 'annual' ? Math.floor(19 * 0.8) * 12 : 19;
        
        const res = await supabase.functions.invoke('paystack-checkout', {
          body: {
            email: user.email,
            amount: price,
            metadata: {
              type: 'upgrade',
              plan: 'pro',
              billing
            }
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });

        if (res.error) throw res.error;
        if (res.data?.data?.url) {
          window.open(res.data.data.url, '_blank');
        } else if (res.data?.error?.message) {
          throw new Error(res.data.error.message);
        } else if (res.data?.message) {
          throw new Error(res.data.message);
        }
      } catch (err: any) {
        console.error('Upgrade error', err);
        const errorMsg = await err?.context?.text?.() || err.message;
        toast.error('Failed to initiate checkout: ' + errorMsg);
      } finally {
        setLoadingPlan(null);
      }
    }
  };

  // If already logged in, skip /signup and go straight to the upgrade destination.
  // Free plan → /dashboard, Pro → /dashboard?upgrade=pro, Business → /contact
  const getPlanHref = (planId: string) => {
    if (!user) return '/signup';
    if (planId === 'free') return '/dashboard';
    if (planId === 'pro') return '/dashboard?upgrade=pro';
    if (planId === 'business') return '/contact';
    return '/dashboard';
  };

  const getPrice = (price: string) => {
    if (price === '$0') return '$0';
    const num = parseInt(price.replace('$', ''));
    return billing === 'annual' ? `$${Math.floor(num * 0.8)}` : price;
  };

  return (
    <MainLayout>
      <PageMeta 
        title="Pricing | AIDetector.cx"
        description="Simple, transparent pricing for AI detection and humanization. Start free and scale as you grow."
        canonicalUrl="https://aidetector.cx/pricing"
      />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-3 text-primary border-primary ring-2 ring-primary/20/30 bg-primary/5">Pricing</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-navy text-balance mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Start free. Scale as you grow. No hidden fees, no surprise charges.
          </p>
          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-muted/50 rounded-full p-1 mt-8">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                billing === 'monthly' ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                billing === 'annual' ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              <Badge className="bg-success text-white text-xs border-0 py-0 h-4">Save 20%</Badge>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                style={{ borderRadius: "1.5rem" }}
                className={`h-full flex flex-col border shadow-premium rounded-2xl relative ${
                  plan.primary ? 'border-primary ring-2 ring-primary/20 shadow-hover ring-1 ring-primary/20' : 'border-border'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                    <Badge className="bg-primary text-primary-foreground shadow-sm">{plan.badge}</Badge>
                  </div>
                )}
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Plan header */}
                  <div className="mb-5">
                    <div className={`w-10 h-10 ${plan.bg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${plan.color}`} />
                    </div>
                    <h2 className="text-xl font-bold text-navy">{plan.name}</h2>
                    <div className="flex items-baseline gap-1 mt-1 mb-1">
                      <span className="text-4xl font-extrabold text-navy">{getPrice(plan.price)}</span>
                      {plan.period && (
                        <span className="text-muted-foreground text-sm">
                          {billing === 'annual' ? '/month (billed annually)' : plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-pretty">{plan.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-3 mb-6 flex-1">
                    {comparisonFeatures.map((feature) => {
                      const value = plan.features[feature as keyof typeof plan.features];
                      return (
                        <li key={feature} className="flex items-center gap-2.5 text-sm">
                          {value === true || (typeof value === 'string' && value !== '') ? (
                            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                          )}
                          <span className={value === false ? 'text-muted-foreground/50 line-through' : 'text-foreground/80'}>
                            {feature}
                            {typeof value === 'string' && value !== 'true' && value !== 'false' && (
                              <span className="font-semibold text-navy ml-1">({value})</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <Button
                    onClick={() => handleAction(plan.id)}
                    disabled={loadingPlan === plan.id || ((profile?.subscription_plan === plan.id || (!profile?.subscription_plan && plan.id === 'free')) && plan.id !== 'business')}
                    className={`w-full h-10 mt-auto ${plan.primary ? 'bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:text-foreground'}`}
                    variant={plan.primary ? 'default' : 'outline'}
                  >
                    {loadingPlan === plan.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {(profile?.subscription_plan === plan.id || (!profile?.subscription_plan && plan.id === 'free')) ? 'Current Plan' : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-navy text-center mb-8 text-balance">Full Feature Comparison</h2>
          <Card className="border-border shadow-premium rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50/30">
                    <th className="text-left px-5 py-4 text-sm font-semibold text-muted-foreground whitespace-nowrap">Feature</th>
                    {plans.map((p) => (
                      <th key={p.id} className="px-5 py-4 text-center whitespace-nowrap">
                        <span className={`text-sm font-bold ${p.primary ? 'text-primary' : 'text-navy'}`}>{p.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, i) => (
                    <tr key={feature} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/50/10'}`}>
                      <td className="px-5 py-3.5 text-sm text-foreground/80 font-medium whitespace-nowrap">{feature}</td>
                      {plans.map((p) => (
                        <td key={p.id} className="px-5 py-3.5 text-center whitespace-nowrap">
                          <FeatureValue value={p.features[feature as keyof typeof p.features]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQs */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-navy text-center mb-8 text-balance">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="flex flex-col gap-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-4 shadow-premium rounded-2xl">
                <AccordionTrigger className="text-sm font-medium text-navy hover:no-underline text-left text-balance py-4">
                  <span className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {faq.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 text-pretty pl-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center bg-navy rounded-2xl p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-balance">Still have questions?</h2>
          <p className="text-white/60 mb-6 text-pretty">Talk to our team — we're happy to help you find the right plan.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button className="bg-white text-navy hover:bg-white/90 h-10 px-6" type="button" onClick={() => {}}>Talk to Sales</Button>
            <Link to={user ? '/dashboard' : '/signup'}>
              <Button variant="ghost" className="border border-white/30 text-white hover:bg-white/10 h-10 px-6" onClick={() => {}}>
                {user ? 'Go to Dashboard' : 'Start for Free'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
