import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileSearch,
  Globe2,
  Mail,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const salesEmail = 'partnerships@aidetector.cx';
const salesSubject = encodeURIComponent('AIDetector.cx — One-Month Agency Unlimited Access');
const salesBody = encodeURIComponent(
  'Hello AIDetector.cx team,\n\nI would like to discuss a one-month unlimited access offer for my organisation.\n\nOrganisation:\nWebsite:\nTeam size:\nTools required:\nPreferred start date:\n\nPlease send me a negotiable quote.\n'
);
const salesHref = `mailto:${salesEmail}?subject=${salesSubject}&body=${salesBody}`;

const plans = [
  {
    name: 'Starter',
    price: '₦120,000',
    audience: 'For independent agencies and lean content teams',
    description: 'A practical starting point for teams reviewing client content and editorial drafts.',
    icon: Zap,
  },
  {
    name: 'Growth',
    price: '₦220,000',
    audience: 'For growing SEO and content agencies',
    description: 'A broader monthly arrangement for teams handling multiple client content workflows.',
    icon: Building2,
    featured: true,
  },
  {
    name: 'Enterprise',
    price: '₦350,000',
    audience: 'For publishers, newsrooms and larger organisations',
    description: 'A tailored arrangement with onboarding and scope agreed around your organisation.',
    icon: Newspaper,
  },
];

const includedTools = [
  {
    title: 'AI content detection',
    description: 'Review content with Balanced and Aggressive detection modes.',
    icon: ShieldCheck,
    href: '/detector',
  },
  {
    title: 'Plagiarism checking',
    description: 'Add originality checks to your editorial review process.',
    icon: FileSearch,
    href: '/plagiarism-checker',
  },
  {
    title: 'SEO content workflows',
    description: 'Review content quality and search-readiness before publication.',
    icon: Globe2,
    href: '/seo-assistant',
  },
  {
    title: 'AI humanization',
    description: 'Access writing refinement workflows where included in your agreed scope.',
    icon: Sparkles,
    href: '/humanizer',
  },
];

const faqs = [
  {
    question: 'How long does the agency offer last?',
    answer: 'The offer is for one month (30 days). The start date and access period are confirmed with you before payment.',
  },
  {
    question: 'Is the price fixed?',
    answer: 'No. The displayed amounts are starting points, not fixed prices. We consider your organisation, team requirements and the tools you need, then agree a quote with you.',
  },
  {
    question: 'Does unlimited mean unlimited access to every feature?',
    answer: 'The exact tools and access scope are confirmed in writing before payment. API access, automated bulk processing, resale and credential sharing are not included unless separately agreed.',
  },
  {
    question: 'How do we get started?',
    answer: 'Send us your organisation details and the tools you need. Our team will discuss the scope, confirm the price and explain the payment and onboarding steps.',
  },
];

export default function AgencyUnlimitedPage() {
  return (
    <MainLayout>
      <PageMeta
        title="Agency Unlimited Access for SEO Teams & Publishers | AIDetector.cx"
        description="One-month unlimited AIDetector.cx access arrangements for SEO agencies, content teams, publishers and newsrooms. Request a negotiable custom offer."
        canonicalUrl="https://www.aidetector.cx/agency-unlimited"
      />

      <div className="min-h-screen bg-background text-foreground">
        <section className="relative overflow-hidden bg-navy text-white">
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute -top-32 right-[-5rem] h-96 w-96 rounded-full bg-primary blur-3xl" />
            <div className="absolute -bottom-40 left-[-4rem] h-80 w-80 rounded-full bg-violet-500 blur-3xl" />
          </div>
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge className="mb-5 border border-white/20 bg-white/10 text-white hover:bg-white/10">
                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                Built for agencies, publishers & editorial teams
              </Badge>
              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                More content checks. Less friction for your team.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                Give your organisation a one-month unlimited access arrangement for agreed AIDetector.cx tools. Review AI-writing signals, originality and content quality across your editorial workflow.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 bg-primary px-6 text-primary-foreground hover:bg-primary/90">
                  <a href="/agency-dashboard">
                    Start a free 7-day trial <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
                  <a href={salesHref}>Request a custom agency offer</a>
                </Button>
                <Button asChild size="lg" variant="ghost" className="h-12 px-6 text-white hover:bg-white/10 hover:text-white">
                  <a href="#pricing">View starting prices</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> 30-day access period</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Negotiable pricing</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Scope agreed before payment</span>
              </div>
            </div>

            <Card className="border-white/15 bg-white/[0.08] text-white shadow-2xl backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/65">Agency access</p>
                    <p className="mt-1 text-2xl font-bold text-white">One month. One agreed scope.</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    'Choose the AIDetector.cx tools your team needs',
                    'Agree the access scope and commercial terms',
                    'Receive onboarding and a confirmed 30-day access period',
                    'Discuss renewal or a new arrangement before expiry',
                  ].map((item, index) => (
                    <div key={item} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">{index + 1}</span>
                      <p className="pt-1 text-sm leading-relaxed text-white/80">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-7 rounded-xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Who this is for</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    SEO agencies, digital marketing firms, content production teams, publishers, media houses and newsroom editors.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-b border-border bg-secondary/20 py-14">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto mb-9 max-w-2xl text-center">
              <Badge variant="outline" className="mb-3 border-primary/30 text-primary">One workspace, multiple checks</Badge>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Support your content review process</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Bring key content-integrity and publishing checks into one workflow. Your final offer will list the tools included in your access.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {includedTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card key={tool.title} className="h-full border-border bg-card transition-shadow hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-foreground">{tool.title}</h3>
                      <p className="mt-2 min-h-12 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
                      <Link to={tool.href} className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">
                        Explore tool <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Indicative monthly pricing</Badge>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">A starting point, not a price barrier</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                These are negotiable starting prices for a 30-day arrangement. Tell us what your team needs and we will work out a suitable offer.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <Card key={plan.name} className={`relative flex h-full flex-col border ${plan.featured ? 'border-primary shadow-xl ring-1 ring-primary/20' : 'border-border shadow-sm'}`}>
                    {plan.featured && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Popular starting point</Badge>}
                    <CardContent className="flex h-full flex-col p-6 sm:p-7">
                      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.audience}</p>
                      <div className="mt-6 border-y border-border py-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Starting from</p>
                        <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{plan.price}<span className="ml-1 text-sm font-medium text-muted-foreground">/ month</span></p>
                        <p className="mt-2 text-xs text-muted-foreground">One-month access arrangement · negotiable</p>
                      </div>
                      <p className="mt-5 flex-1 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                      <Button asChild className="mt-7 w-full" variant={plan.featured ? 'default' : 'outline'}>
                        <a href={salesHref}>Discuss this offer <ArrowRight className="ml-2 h-4 w-4" /></a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
              Final pricing and included tools are confirmed individually before payment. Unlimited access applies only to the tools and scope stated in your agreement. API access, automated bulk processing, resale and credential sharing require separate written approval.
            </p>
          </div>
        </section>

        <section className="bg-secondary/20 py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Badge variant="outline" className="mb-3 border-primary/30 text-primary">Simple onboarding</Badge>
              <h2 className="text-3xl font-bold text-foreground">Start with a conversation</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                We want to make it easy for Nigerian agencies and publishers to try AIDetector.cx. Share your requirements, discuss a suitable introductory price and agree the access period before you commit.
              </p>
              <Button asChild className="mt-6">
                <a href={salesHref}><Mail className="mr-2 h-4 w-4" /> Email the partnerships team</a>
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">Or write directly to <a className="font-medium text-primary underline" href={`mailto:${salesEmail}`}>{salesEmail}</a>.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Tell us about your organisation', 'Share your website, team type and the content workflows you manage.'],
                ['Choose your required tools', 'Tell us whether you need AI detection, plagiarism checks, SEO review or other available tools.'],
                ['Agree a negotiable price', 'We will confirm the included tools, access scope and final price in writing.'],
                ['Get started for 30 days', 'After payment is confirmed, we will coordinate onboarding and your agreed access period.'],
              ].map(([title, description], index) => (
                <div key={title} className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs font-bold text-primary">STEP 0{index + 1}</p>
                  <h3 className="mt-2 font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Frequently asked questions</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-xl border border-border bg-card p-5">
                  <summary className="cursor-pointer list-none pr-6 font-semibold text-foreground marker:hidden">
                    {faq.question}
                    <span className="float-right text-primary transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-navy px-4 py-14 text-center text-white md:px-6">
          <div className="mx-auto max-w-3xl">
            <Wallet className="mx-auto mb-4 h-8 w-8 text-white/70" />
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Let's find the right offer for your team.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              Tell us what you need. We are open to discussing introductory pricing for the right agency, publisher or media partner.
            </p>
            <Button asChild size="lg" className="mt-7 bg-primary px-7 text-primary-foreground hover:bg-primary/90">
              <a href={salesHref}>Request your custom offer <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
