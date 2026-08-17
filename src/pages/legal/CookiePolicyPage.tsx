import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

type CookieRow = { name: string; provider: string; purpose: string; duration: string };

const cookieCategories: { id: string; title: string; required: boolean; description: string; cookies: CookieRow[] }[] = [
  {
    id: 'essential',
    title: 'Strictly Necessary Cookies',
    required: true,
    description: 'These cookies are essential for the website to function. They enable core features like user authentication, security, and session management. The site cannot function properly without these cookies.',
    cookies: [
      { name: 'sb-auth-token', provider: 'AIDetector.cx (Supabase)', purpose: 'Authenticates your user session', duration: 'Session / 7 days' },
      { name: 'sb-refresh-token', provider: 'AIDetector.cx (Supabase)', purpose: 'Refreshes your authentication token', duration: '30 days' },
      { name: '__cf_bm', provider: 'Cloudflare', purpose: 'Bot management and DDoS protection', duration: '30 minutes' },
      { name: 'theme', provider: 'AIDetector.cx', purpose: 'Remembers your light/dark mode preference', duration: '1 year' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics Cookies',
    required: false,
    description: 'With your consent, these cookies help us understand how visitors interact with the website — which pages are visited most, where users come from, and how they navigate. All data is aggregated and anonymous.',
    cookies: [
      { name: '_aid_analytics', provider: 'AIDetector.cx (first-party)', purpose: 'Aggregated page view and session analytics', duration: '12 months' },
      { name: '_aid_session', provider: 'AIDetector.cx (first-party)', purpose: 'Tracks session sequence for funnel analysis', duration: 'Session' },
    ],
  },
  {
    id: 'functional',
    title: 'Functional Cookies',
    required: false,
    description: 'These cookies enable enhanced functionality and personalization, such as remembering your editor settings, analysis history filters, and feature tour progress.',
    cookies: [
      { name: 'aid_prefs', provider: 'AIDetector.cx', purpose: 'Stores UI preferences (sidebar state, selected modules)', duration: '6 months' },
      { name: 'aid_tour', provider: 'AIDetector.cx', purpose: 'Tracks onboarding tour completion status', duration: '3 months' },
    ],
  },
  {
    id: 'payment',
    title: 'Payment Processing Cookies',
    required: false,
    description: 'These cookies are set by our payment provider Stripe when you access the billing or upgrade pages. They are required to process payments securely.',
    cookies: [
      { name: '__stripe_mid', provider: 'Stripe', purpose: 'Fraud prevention and secure payment processing', duration: '1 year' },
      { name: '__stripe_sid', provider: 'Stripe', purpose: 'Session identifier for Stripe checkout', duration: '30 minutes' },
    ],
  },
];

const sections = [
  {
    id: 'what-are-cookies',
    title: '1. What Are Cookies?',
    content: 'Cookies are small text files stored on your device (computer, phone, or tablet) when you visit a website. They allow the website to remember information about your visit — such as your login state, preferences, or browsing session — making your next visit easier and more useful.',
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Cookies',
    content: 'AIDetector.cx uses cookies for three main purposes: (1) to operate the platform securely with authenticated sessions, (2) to remember your preferences and settings, and (3) with your consent, to analyze how users interact with our platform so we can improve it.',
  },
  {
    id: 'third-party',
    title: '3. Third-Party Cookies',
    content: 'Some cookies are set by third-party services we use — specifically Cloudflare (security), Stripe (payments), and Supabase (backend). These providers have their own privacy policies and we do not control the cookies they set beyond what is described in this policy.',
  },
  {
    id: 'managing',
    title: '4. Managing Your Cookie Preferences',
    content: `You can control cookies in several ways:

Browser Settings: Most browsers allow you to view, block, or delete cookies through their settings. Note that blocking essential cookies will prevent you from logging in or using core features.

Consent Banner: When you first visit AIDetector.cx, a cookie consent banner allows you to accept or reject non-essential cookies. You can change your preferences at any time via the "Cookie Settings" link in the footer.

Opt-Out Links: For Stripe, visit stripe.com/privacy. For Cloudflare, visit cloudflare.com/privacypolicy.`,
  },
  {
    id: 'updates',
    title: '5. Updates to This Policy',
    content: 'We may update this Cookie Policy when we add new features, change third-party providers, or when regulations require. The "Last Updated" date below reflects when the policy was last revised. We recommend reviewing this page periodically.',
  },
  {
    id: 'contact',
    title: '6. Contact',
    content: 'For questions about our use of cookies, email privacy@aidetector.cx or visit our Contact page.',
  },
];

export default function CookiePolicyPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-navy text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-5">Legal</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">Cookie Policy</h1>
          <p className="text-white/60 text-sm">Last Updated: June 1, 2026 · Effective: June 1, 2026</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16 flex flex-col md:flex-row gap-10">
        {/* TOC */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-8">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contents</p>
            <nav className="flex flex-col gap-1.5">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="text-xs text-muted-foreground hover:text-navy transition-colors leading-relaxed">
                  {s.title}
                </a>
              ))}
              <a href="#cookie-table" className="text-xs text-muted-foreground hover:text-navy transition-colors leading-relaxed">Cookie Reference Table</a>
            </nav>
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Related</p>
              <Link to="/privacy" className="text-xs text-primary hover:text-primary/80 block mb-1.5">Privacy Policy</Link>
              <Link to="/terms" className="text-xs text-primary hover:text-primary/80 block">Terms of Service</Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <article className="flex-1 min-w-0">
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty mb-8 p-4 bg-muted/40 rounded-lg border border-border">
            This Cookie Policy explains what cookies are, how AIDetector.cx uses them, and how you can manage your preferences.
          </p>

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-10">
              <h2 className="text-lg font-bold text-navy mb-3 text-balance">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
            </section>
          ))}

          {/* Cookie reference table */}
          <section id="cookie-table" className="mb-10">
            <h2 className="text-lg font-bold text-navy mb-6 text-balance">Cookie Reference Table</h2>
            <div className="flex flex-col gap-8">
              {cookieCategories.map((cat) => (
                <Card key={cat.id} className="border-border shadow-card">
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-navy text-sm">{cat.title}</h3>
                        <Badge className={cat.required ? 'bg-success/10 text-success border-success/20 text-xs' : 'bg-muted text-muted-foreground border-border text-xs'}>
                          {cat.required ? 'Required' : 'Optional'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{cat.description}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-4 py-2.5 font-semibold text-navy whitespace-nowrap">Cookie Name</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-navy whitespace-nowrap">Provider</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-navy whitespace-nowrap">Purpose</th>
                            <th className="text-left px-4 py-2.5 font-semibold text-navy whitespace-nowrap">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.cookies.map((c, i) => (
                            <tr key={c.name} className={i < cat.cookies.length - 1 ? 'border-b border-border' : ''}>
                              <td className="px-4 py-2.5 text-navy font-mono whitespace-nowrap">{c.name}</td>
                              <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{c.provider}</td>
                              <td className="px-4 py-2.5 text-muted-foreground">{c.purpose}</td>
                              <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{c.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </article>
      </div>
    </MainLayout>
  );
}
