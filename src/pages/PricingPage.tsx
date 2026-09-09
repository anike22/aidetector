import { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { PageLeadCapture } from '@/components/lead-capture/PageLeadCapture';
import { Button } from '@/components/ui/button';
import { trackLifecycleEvent } from '@/lib/trackLifecycleEvent';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';
import {
  CheckCircle2, X, HelpCircle, Zap, Users, Shield, Sparkles,
  Building2, Layers, Coins, ArrowRight, ShieldCheck, Check,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { RATE_TABLE, type PlanTier } from '@/lib/entitlements';

interface DisplayPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualTotal: number;
  annualMonthly: number;
  monthlyCredits: number;
  trialChecks: string;
  description: string;
  badge?: string;
  primary?: boolean;
  features: string[];
  cta: string;
  icon: any;
  color: string;
  bg: string;
}

const DISPLAY_PLANS: DisplayPlan[] = [
  {
    id: 'free',
    name: 'Free Trial',
    monthlyPrice: 0,
    annualTotal: 0,
    annualMonthly: 0,
    monthlyCredits: 0,
    trialChecks: '5 Total (1 Guest + 4 Account)',
    description: 'One-time introductory trial checks to evaluate accuracy and capabilities',
    features: [
      '1 guest check + 4 signed-in trial checks (5 total introductory)',
      'Standard Balanced AI Text Detection',
      'Humanizer (Standard mode up to 1,000 words)',
      'Plagiarism Checker (Standard scope up to 1,000 words)',
      'SEO Assistant (Standard report up to 1,000 words)',
      'Standard Image Detection (Balanced)',
      'Standard Video Detection (Balanced, up to 30s)',
      'Voice & Speech Analysis (up to 1 min)',
      'No recurring daily or monthly reset',
    ],
    cta: 'Start Free Trial',
    icon: ShieldCheck,
    color: 'text-muted-foreground',
    bg: 'bg-muted/50',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 12,
    annualTotal: 120,
    annualMonthly: 10,
    monthlyCredits: 300,
    trialChecks: 'Paid Credits',
    description: 'For professional writers, educators, and solo researchers',
    badge: 'Popular',
    features: [
      '300 monthly credits (refilled monthly on both monthly & annual billing)',
      'Aggressive & High-Sensitivity dual detection',
      'Full Humanizer & Rewrite engine modes',
      'Full Plagiarism deep database search',
      'Advanced Image & Deepfake analysis (4 cr/image)',
      'Citation verification (1 cr / 5 refs)',
      'Hallucination checking (2 cr / 1,000 words)',
      'Writing Monitor & Verified Authorship support',
      'PDF, DOCX & CSV full export reports',
    ],
    cta: 'Upgrade to Pro',
    primary: false,
    icon: Zap,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'pro_plus',
    name: 'Pro Plus',
    monthlyPrice: 29,
    annualTotal: 290,
    annualMonthly: 24.17,
    monthlyCredits: 1000,
    trialChecks: 'Paid Credits',
    description: 'For high-volume creators, publishers, and power agencies',
    badge: 'Best Value',
    primary: true,
    features: [
      '1,000 monthly credits (refilled monthly)',
      'Forensic Video & Deepfake analysis (6 cr/30s)',
      'Bulk batch document & file processing',
      'Priority multi-engine processing queue',
      'Up to 25,000 words per scan',
      'Full SEO Content Studio automation',
      'Verified Authorship Certificate registration',
      'Priority customer support',
    ],
    cta: 'Upgrade to Pro Plus',
    icon: Sparkles,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 79,
    annualTotal: 790,
    annualMonthly: 65.83,
    monthlyCredits: 3000,
    trialChecks: 'Paid Credits',
    description: 'For organizations, teams, and high-throughput content workflows',
    features: [
      '3,000 monthly credits with shared team workspace pool',
      'Up to 5 team member seats included',
      'REST API access & Webhook integration',
      'WordPress & Chrome extension team licensing',
      'Centralized team audit ledger & member tracking',
      'Custom webhook notifications & integrations',
      'Dedicated account manager & SLA guarantee',
    ],
    cta: 'Upgrade to Business',
    primary: false,
    icon: Users,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
];

const RATE_ITEMS = [
  { feature: 'AI Text Detection (Balanced)', rate: '1 credit per 1,000 words per engine', unit: 'Per 1k words', trial: true },
  { feature: 'AI Text Detection (Aggressive)', rate: '1 credit per 1,000 words per engine', unit: 'Per 1k words', trial: false },
  { feature: 'Humanizer Rewrite Engine', rate: '3 credits per 1,000 input words', unit: 'Per 1k words', trial: true },
  { feature: 'Plagiarism Checker Deep Search', rate: '2 credits per 1,000 words', unit: 'Per 1k words', trial: true },
  { feature: 'SEO Assistant Full Report', rate: '3 credits per 1,000 words', unit: 'Per 1k words', trial: true },
  { feature: 'Standard Image Detection', rate: '2 credits per image', unit: 'Per image', trial: true },
  { feature: 'Advanced Image / Deepfake Analysis', rate: '4 credits per image', unit: 'Per image', trial: false },
  { feature: 'Video Detection (Balanced)', rate: '2 credits per started 30 seconds', unit: 'Per 30s', trial: true },
  { feature: 'Video Detection (High-Sensitivity)', rate: '3 credits per started 30 seconds', unit: 'Per 30s', trial: false },
  { feature: 'Video Detection (Forensic Deepfake)', rate: '6 credits per started 30 seconds', unit: 'Per 30s', trial: false },
  { feature: 'Voice & Speech Audio Analysis', rate: '2 credits per audio minute', unit: 'Per min', trial: true },
  { feature: 'Citation Verification', rate: '1 credit per 5 references', unit: 'Per 5 refs', trial: false },
  { feature: 'Hallucination Checker', rate: '2 credits per 1,000 words', unit: 'Per 1k words', trial: false },
  { feature: 'Verified Authorship Registry', rate: '5 credits per certificate', unit: 'Per cert', trial: false },
  { feature: 'Bulk Batch Processing', rate: '1 credit per document batch item', unit: 'Per doc', trial: false },
  { feature: 'REST API Request', rate: '1 credit per request', unit: 'Per call', trial: false },
];

const FAQS = [
  {
    q: 'How do the 5 free introductory trial checks work?',
    a: 'Every new user receives 5 one-time trial checks across eligible standard tools (Balanced text detection, Humanizer, Plagiarism, SEO Assistant, standard Image/Video/Voice detection). Guests can run 1 check; creating a free account unlocks the remaining 4 checks (5 total introductory allowance). Prior guest usage carries over into your account so you always receive your 5 total trial checks without duplicate grants or daily resets.',
  },
  {
    q: 'Do trial checks reset every day or every month?',
    a: 'No. Trial checks are one-time introductory checks designed to let you evaluate our multi-engine accuracy before upgrading. They do not expire daily. Once you have used your 5 trial checks, upgrading to a paid plan grants you a monthly credit allowance.',
  },
  {
    q: 'How does credit allocation work on Annual plans?',
    a: 'Annual plans are billed upfront at a discounted rate ($120/yr for Pro, $290/yr for Pro Plus, $790/yr for Business). Your credits are allocated monthly on your billing anniversary (e.g. 300 credits each month for Pro, 1,000/mo for Pro Plus, 3,000/mo for Business) rather than all at once, ensuring consistent monthly usage.',
  },
  {
    q: 'How are credits calculated for different tools?',
    a: 'We use a central, transparent rate table: standard text detection costs 1 credit per started 1,000 words per engine; Humanizer costs 3 credits/1,000 words; Plagiarism costs 2 credits/1,000 words; standard images cost 2 credits; video costs 2–6 credits per 30s depending on mode. The exact cost is always displayed beside the Run button before you execute.',
  },
  {
    q: 'What happens if a job fails or is cancelled?',
    a: 'When you start an operation, the quoted credit amount is atomically reserved. If an analysis fails or is cancelled due to a system error, the full reservation is automatically refunded to your credit balance, and trial checks are restored.',
  },
  {
    q: 'Can I share credits with my team?',
    a: 'Yes! The Business plan includes up to 5 team member seats with a shared 3,000 monthly credit pool, centralized audit ledger, and REST API access.',
  },
  {
    q: 'Can I upgrade, downgrade, or cancel at any time?',
    a: 'Yes. You can upgrade immediately with prorated adjustments, or cancel anytime from your dashboard. If you cancel, your paid access and credits remain active until the end of your paid billing cycle.',
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    trackLifecycleEvent('pricing_page_visit');
  }, []);

  const handleAction = async (planId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    if (planId === 'free') {
      navigate('/dashboard');
      return;
    }

    if (planId === 'enterprise') {
      navigate('/contact');
      return;
    }

    setLoadingPlan(planId);
    try {
      const plan = DISPLAY_PLANS.find(p => p.id === planId);
      const amount = billing === 'annual' ? (plan?.annualTotal || 120) : (plan?.monthlyPrice || 12);

      const { data: { session } } = await supabase.auth.getSession();
      trackLifecycleEvent('upgrade_to_pro', { plan: planId, billing, amount });

      const res = await supabase.functions.invoke('paystack-checkout', {
        body: {
          email: user.email,
          amount,
          metadata: {
            type: 'upgrade',
            plan: planId,
            billing,
          },
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (res.error) throw res.error;
      if (res.data?.data?.url) {
        window.open(res.data.data.url, '_blank');
      } else if (res.data?.error?.message) {
        throw new Error(res.data.error.message);
      } else if (res.data?.message) {
        throw new Error(res.data.message);
      } else {
        // Fallback simulate checkout redirect in development
        toast.success(`Redirecting to ${plan?.name} checkout ($${amount} ${billing})...`);
        navigate('/dashboard?upgrade=' + planId);
      }
    } catch (err: any) {
      console.error('Upgrade error', err);
      const errorMsg = err.message || 'Payment initiation failed';
      toast.error('Checkout error: ' + errorMsg);
      // Fallback navigate to dashboard subscription tab
      navigate('/dashboard');
    } finally {
      setLoadingPlan(null);
    }
  };

  const currentPlan = profile?.subscription_plan || (user ? 'free' : 'guest');

  return (
    <MainLayout>
      <PageLeadCapture
        context="pricing"
        scrollPercent={50}
        timeSeconds={30}
        showSticky={true}
        stickyLabel="5 Free Trial Checks"
        stickySubLabel="No credit card required"
      />
      <PageMeta
        title="Transparent Pricing & Credits | AIDetector.cx"
        description="Clear, predictable pricing for multi-engine AI detection, humanizer, plagiarism checking, and enterprise verification. 5 free trial checks."
        canonicalUrl="https://aidetector.cx/pricing"
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="outline" className="mb-3 text-primary border-primary/30 bg-primary/5 text-xs font-semibold px-3 py-1">
            Predictable & Auditable Pricing
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-navy text-balance mb-4">
            Simple, transparent credit plans
          </h1>
          <p className="text-muted-foreground text-base md:text-lg text-pretty max-w-2xl mx-auto">
            Evaluate all standard tools with 5 free introductory trial checks. Upgrade for monthly credit allocations, high-speed queues, and forensic deepfake detection.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-muted/60 p-1.5 rounded-full mt-8 border border-border">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                billing === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === 'annual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual Billing
              <Badge className="bg-emerald-600 text-white text-[11px] font-bold border-0 px-2 py-0.5">
                Up to 20% Off
              </Badge>
            </button>
          </div>
          {billing === 'annual' && (
            <p className="text-xs text-muted-foreground mt-2">
              Annual plans are billed upfront with credits granted monthly on your renewal cycle.
            </p>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {DISPLAY_PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan.toLowerCase() === plan.id.toLowerCase();
            const displayPrice = plan.monthlyPrice === 0
              ? '$0'
              : billing === 'annual'
              ? `$${plan.annualMonthly.toFixed(plan.annualMonthly % 1 === 0 ? 0 : 2)}`
              : `$${plan.monthlyPrice}`;

            return (
              <Card
                key={plan.id}
                className={`h-full flex flex-col border shadow-premium rounded-2xl relative transition-all duration-200 ${
                  plan.primary
                    ? 'border-primary ring-2 ring-primary/30 shadow-lg'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge className="bg-primary text-primary-foreground shadow-sm text-xs font-bold px-3 py-0.5">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6 flex flex-col h-full">
                  {/* Card Header */}
                  <div className="mb-5">
                    <div className={`w-10 h-10 ${plan.bg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${plan.color}`} />
                    </div>
                    <h2 className="text-xl font-bold text-navy">{plan.name}</h2>
                    <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{plan.description}</p>

                    <div className="mt-4 pt-4 border-t border-border/60">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl md:text-4xl font-extrabold text-navy">{displayPrice}</span>
                        <span className="text-muted-foreground text-xs font-medium">
                          {plan.monthlyPrice === 0 ? 'forever' : billing === 'annual' ? '/mo' : '/month'}
                        </span>
                      </div>
                      {billing === 'annual' && plan.annualTotal > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                          Billed annually (${plan.annualTotal}/yr)
                        </p>
                      )}
                      <div className="mt-2 text-xs font-semibold text-primary flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" />
                        {plan.monthlyCredits > 0
                          ? `${plan.monthlyCredits.toLocaleString()} credits / month`
                          : plan.trialChecks}
                      </div>
                    </div>
                  </div>

                  {/* Feature list */}
                  <ul className="flex flex-col gap-2.5 mb-6 flex-1 text-xs">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground/90">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleAction(plan.id)}
                    disabled={loadingPlan === plan.id || isCurrent}
                    className={`w-full h-10 mt-auto font-semibold ${
                      plan.primary
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : isCurrent
                        ? 'bg-muted text-muted-foreground'
                        : 'border-border text-foreground hover:bg-muted'
                    }`}
                    variant={plan.primary ? 'default' : 'outline'}
                  >
                    {loadingPlan === plan.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isCurrent ? 'Current Plan' : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enterprise Banner */}
        <Card className="border-border bg-gradient-to-r from-navy/5 via-card to-primary/5 p-6 rounded-2xl mb-16 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">Need Custom Volume, Dedicated SLA, or Private Cloud?</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enterprise plans include custom monthly credit pools, unlimited seats, dedicated throughput, SOC2 compliance, and SAML SSO.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/contact')}
              className="shrink-0 h-10 px-6 font-semibold"
            >
              Contact Enterprise Sales
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </Card>

        {/* Central Rate Table Section */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Badge variant="outline" className="mb-2 text-primary border-primary/30 text-xs">
              Server-Side Rate Table
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy">
              Transparent Credit & Trial Consumption
            </h2>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Every operation is priced predictably. Trial-eligible checks consume 1 trial check for standard inputs. Paid runs consume exact credits from your balance.
            </p>
          </div>

          <Card className="border-border shadow-premium rounded-2xl overflow-hidden">
            <div className="w-full max-w-full overflow-x-auto bg-card">
              <table className="w-full text-left text-sm [&>div]:max-w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Feature / Tool</th>
                    <th className="px-6 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Billing Rule</th>
                    <th className="px-6 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Unit</th>
                    <th className="px-6 py-3.5 font-semibold text-muted-foreground whitespace-nowrap">Trial Check Eligible?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {RATE_ITEMS.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                      <td className="px-6 py-3.5 font-medium text-foreground whitespace-nowrap">
                        {item.feature}
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground whitespace-nowrap">
                        {item.rate}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {item.unit}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {item.trial ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-semibold gap-1">
                            <Check className="w-3 h-3" />
                            Yes (Standard Mode)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-xs font-normal">
                            Paid Plan Required
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-navy">Frequently Asked Questions</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Everything you need to know about our trial checks, credits, and billing lifecycle.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="border border-border bg-card rounded-xl px-4 shadow-sm"
              >
                <AccordionTrigger className="text-left font-semibold text-sm text-foreground py-4 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs md:text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </MainLayout>
  );
}
