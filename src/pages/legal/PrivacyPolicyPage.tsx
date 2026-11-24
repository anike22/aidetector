import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';

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
        text: 'We collect information about how you use our services — such as pages visited, features used, analysis activity, and time spent on the platform. Analysis inputs and outputs may be retained when an account feature such as saved history or reports requires it.',
      },
      {
        subtitle: 'Payment Information',
        text: 'Billing is processed by Paystack. We store only your plan tier and billing period. We never see or store full card numbers, CVVs, or bank details.',
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
        text: 'We use account, technical, and product-usage data to operate AIDetector.cx, personalize your experience, secure the service, and improve product reliability. Submitted analysis text is not used to train or fine-tune our detection models.',
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
        text: 'We share data with trusted vendors who help operate our platform: Supabase (database), Paystack (payments), Resend (email), Sentry (error monitoring), and Cloudflare (infrastructure). Each is bound by data processing agreements.',
      },
      {
        subtitle: 'Legal Requirements',
        text: 'We may disclose information if required by law, court order, or to protect the rights and safety of our users or the public.',
      },
    ],
  },
  {
    id: 'chrome-extension',
    title: '4. Chrome Extension Privacy & Permissions',
    content: [
      {
        subtitle: 'Information the extension can access',
        text: 'When you use the AIDetector.cx Chrome extension, its webpage content feature can read text you select on a webpage and, when you choose the current-page text option, readable text from the webpage you are viewing. The extension may also read the title and web address of that page to identify the source of the submitted text. The extension displays a small Detect AI control after you select text. Webpage text is not submitted for analysis merely because the extension is installed or because you visit a page; you must use an extension feature or choose a detection or humanization action.',
      },
      {
        subtitle: 'How submitted text is processed',
        text: 'When you choose Detect AI or Humanize, the text you submit is sent to AIDetector.cx over an encrypted connection for the requested service. Requests from the extension popup are sent to our Supabase-hosted service API. The extension also provides right-click actions that open the corresponding AIDetector.cx website tool and include the selected text in the destination web address. Web addresses can be retained in browser history and may be visible to systems that process website requests. Do not submit confidential or sensitive text unless you are comfortable sending it to the service.',
      },
      {
        subtitle: 'Account authentication and local storage',
        text: 'To connect your account, the extension reads the AIDetector.cx sign-in access token from the website local storage on AIDetector.cx pages and copies that token into Chrome extension local storage. The token is used to authenticate requests to our service. The extension also temporarily stores selected text and its source page details when needed to open the extension interface. These values are stored locally by Chrome; they are not sold or used for advertising.',
      },
      {
        subtitle: 'Why website access is requested',
        text: 'The extension uses webpage access to support selected-text detection, current-page text extraction and the floating Detect AI control on webpages. It uses Chrome storage to retain the account connection and hand off text to the extension interface, and context-menu access to provide right-click Detect AI and Humanize actions. Access to AIDetector.cx pages is used to connect your signed-in website account to the extension. The extension does not use webpage access to collect browsing history for advertising.',
      },
      {
        subtitle: 'Data sharing and retention',
        text: 'Text submitted for analysis is processed by AIDetector.cx and its infrastructure provider, Supabase, to return the requested result and support account usage. Analysis history may be retained according to the Analysis History section of this policy when an account feature stores results. Authentication tokens and temporary handoff data are stored in Chrome extension local storage and remain there until replaced, cleared by the extension or removed when you uninstall the extension; you can also clear the extension data through Chrome. Website browser history for right-click actions is managed by Chrome and your browser settings.',
      },
      {
        subtitle: 'Your choices',
        text: 'You can avoid submitting webpage text by not using the extension actions, disconnect your account by signing out of AIDetector.cx and clear the extension data or uninstall the extension through Chrome. Uninstalling the extension does not itself delete account data or analysis history stored by AIDetector.cx; use your account settings or contact privacy@aidetector.cx for account-data requests.',
      },
    ],
  },
  {
    id: 'data-retention',
    title: '5. Data Retention',
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
    title: '6. Your Rights',
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
        subtitle: 'Model Training',
        text: 'Submitted analysis text is not used to train or fine-tune our detection models on any plan, so a plan-specific training opt-out is not required. Product telemetry and feedback may be used to improve service reliability without using submitted text as training data.',
      },
    ],
  },
  {
    id: 'cookies',
    title: '7. Cookies',
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
    id: 'advertising',
    title: 'Advertising & Google AdSense',
    content: [
      {
        subtitle: 'Advertising technologies',
        text: 'If Google AdSense ads are enabled on this website, Google and other third-party advertising vendors may use cookies, web beacons, IP addresses and other identifiers to collect and use information for ad serving, measurement and fraud prevention. Third parties may place and read cookies in your browser as a result of ad serving.',
      },
      {
        subtitle: 'Personalized advertising and your choices',
        text: 'Google advertising cookies enable Google and its partners to serve ads based on visits to this website and other websites. You can manage personalized advertising at https://www.google.com/settings/ads and learn about third-party opt-outs at https://www.aboutads.info/choices/. Learn how Google uses information at https://policies.google.com/technologies/partner-sites. Where required, advertising technologies must only be enabled after the applicable consent requirements have been met.',
      },
    ],
  },
  {
    id: 'security',
    title: '8. Security',
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
    title: '9. Changes to This Policy',
    content: [
      {
        subtitle: '',
        text: 'We may update this Privacy Policy from time to time. When we make material changes, we will notify you via email and update the "Last Updated" date below. Continued use of the service after notice constitutes acceptance of the revised policy.',
      },
    ],
  },
  {
    id: 'contact',
    title: '10. Contact',
    content: [
      {
        subtitle: '',
        text: 'For privacy-related questions or requests, contact us at privacy@aidetector.cx.',
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
          <p className="text-white/60 text-sm">Last Updated: November 22, 2026 · Effective: November 22, 2026</p>
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
