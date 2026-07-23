import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const sections = [
  {
    id: 'information-we-collect',
    title: '1. Information We Collect',
    content: [
      {
        subtitle: 'Account Information',
        text: 'When you create an account, we collect your name, email address, and password (stored as a bcrypt hash). If you sign up via OAuth (Google, GitHub), we receive your profile name and email from that provider.',
      },
      {
        subtitle: 'Usage Data',
        text: 'We collect information about how you use our services — pages visited, features used, analysis inputs and outputs, and time spent on the platform. This data is used to improve our models and user experience.',
      },
      {
        subtitle: 'Payment Information',
        text: 'Billing is processed by Stripe. We store only your plan tier and billing period. We never see or store full card numbers, CVVs, or bank details.',
      },
      {
        subtitle: 'Device & Technical Data',
        text: 'We automatically collect your IP address, browser type, operating system, referring URL, and device identifiers to ensure service security and diagnose issues.',
      },
    ],
  },
  {
    id: 'how-we-use',
    title: '2. How We Use Your Information',
    content: [
      {
        subtitle: 'Providing and Improving Services',
        text: 'We use your data to operate AIDetector.cx, personalize your experience, and improve our AI models. Analysis text may be used in anonymized, aggregated form to train detection models unless you opt out in your account settings.',
      },
      {
        subtitle: 'Communications',
        text: 'We may send transactional emails (receipts, password resets, security alerts) and, with your consent, product updates and marketing communications. You may unsubscribe at any time.',
      },
      {
        subtitle: 'Security & Fraud Prevention',
        text: 'We use technical and usage data to detect abuse, prevent unauthorized access, and enforce our Terms of Service.',
      },
    ],
  },
  {
    id: 'data-sharing',
    title: '3. Data Sharing & Disclosure',
    content: [
      {
        subtitle: 'We Do Not Sell Your Data',
        text: 'AIDetector.cx does not sell, rent, or trade your personal information to third parties for their marketing purposes.',
      },
      {
        subtitle: 'Service Providers',
        text: 'We share data with trusted vendors who help operate our platform: Supabase (database), Stripe (payments), Resend (email), Sentry (error monitoring), and Cloudflare (infrastructure). Each is bound by data processing agreements.',
      },
      {
        subtitle: 'Legal Requirements',
        text: 'We may disclose information if required by law, court order, or to protect the rights and safety of our users or the public.',
      },
    ],
  },
  {
    id: 'data-retention',
    title: '4. Data Retention',
    content: [
      {
        subtitle: 'Account Data',
        text: 'We retain your account data for as long as your account is active. If you delete your account, your personal information is deleted within 30 days, except where required for legal or tax compliance.',
      },
      {
        subtitle: 'Analysis History',
        text: 'Analysis results are retained for 12 months by default. You may delete individual analyses or your full history at any time from your dashboard.',
      },
    ],
  },
  {
    id: 'your-rights',
    title: '5. Your Rights',
    content: [
      {
        subtitle: 'Access, Correction & Deletion',
        text: 'Depending on your jurisdiction, you have the right to access, correct, or delete your personal data. Submit requests via your account settings or by emailing privacy@aidetector.cx.',
      },
      {
        subtitle: 'Data Portability',
        text: 'You may request a machine-readable export of your personal data at any time.',
      },
      {
        subtitle: 'Opt-Out of Model Training',
        text: 'Enterprise and Professional plan users can opt out of having their analysis data used for model improvement in account settings.',
      },
    ],
  },
  {
    id: 'cookies',
    title: '6. Cookies',
    content: [
      {
        subtitle: 'Essential Cookies',
        text: 'We use strictly necessary cookies to authenticate sessions and remember your preferences. These cannot be disabled.',
      },
      {
        subtitle: 'Analytics Cookies',
        text: 'With your consent, we use analytics cookies (via a privacy-respecting first-party system) to understand how users interact with our platform.',
      },
      {
        subtitle: 'Managing Cookies',
        text: 'You can manage cookie preferences via the consent banner on your first visit or in your browser settings. See our Cookie Policy for full details.',
      },
    ],
  },
  {
    id: 'security',
    title: '7. Security',
    content: [
      {
        subtitle: 'Technical Safeguards',
        text: 'We use TLS 1.3 encryption for all data in transit, AES-256 encryption for data at rest, row-level security in our database, and regular third-party security audits.',
      },
      {
        subtitle: 'Breach Notification',
        text: 'In the event of a data breach affecting your personal information, we will notify you within 72 hours as required by applicable law.',
      },
    ],
  },
  {
    id: 'changes',
    title: '8. Changes to This Policy',
    content: [
      {
        subtitle: '',
        text: 'We may update this Privacy Policy from time to time. When we make material changes, we will notify you via email and update the "Last Updated" date below. Continued use of the service after notice constitutes acceptance of the revised policy.',
      },
    ],
  },
  {
    id: 'contact',
    title: '9. Contact',
    content: [
      {
        subtitle: '',
        text: 'For privacy-related questions or requests, contact our Data Protection Officer at privacy@aidetector.cx, or write to: AIDetector.cx Inc., 2150 Shattuck Ave, Suite 510, Berkeley, CA 94704, USA.',
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-navy text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-5">Legal</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">Privacy Policy</h1>
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
            </nav>
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Related</p>
              <Link to="/terms" className="text-xs text-primary hover:text-primary/80 block mb-1.5">Terms of Service</Link>
              <Link to="/cookies" className="text-xs text-primary hover:text-primary/80 block">Cookie Policy</Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <article className="flex-1 min-w-0">
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty mb-8 p-4 bg-muted/40 rounded-lg border border-border">
            This Privacy Policy explains how AIDetector.cx Inc. ("we", "us", "our") collects, uses, and protects personal information when you use our website and services. Please read it carefully.
          </p>
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-10">
              <h2 className="text-lg font-bold text-navy mb-4 text-balance">{section.title}</h2>
              {section.content.map((block, i) => (
                <div key={i} className="mb-4">
                  {block.subtitle && <h3 className="text-sm font-semibold text-navy mb-1.5">{block.subtitle}</h3>}
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{block.text}</p>
                </div>
              ))}
            </section>
          ))}
        </article>
      </div>
    </MainLayout>
  );
}
