import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: 'By accessing or using AIDetector.cx (the "Service"), you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, please do not use the Service. These Terms apply to all users, including visitors, registered users, and subscribers.',
  },
  {
    id: 'description',
    title: '2. Description of Service',
    content: 'AIDetector.cx provides AI content detection, analysis tools, content writing assistance, and related features (collectively, the "Service"). We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with reasonable notice.',
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    content: 'To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately at security@aidetector.cx of any unauthorized use of your account. You must be at least 16 years old (or the age of digital consent in your jurisdiction) to create an account.',
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable Use',
    content: `You agree NOT to use the Service to:
    
• Submit content that infringes any third party's intellectual property rights
• Attempt to circumvent, reverse-engineer, or undermine our AI detection models
• Scrape, crawl, or systematically extract data from the platform without our written consent
• Use the Service for any illegal purpose or in violation of any applicable law
• Submit malware, spam, or malicious content
• Impersonate any person or entity
• Use automated means (bots, scripts) to access the Service beyond the limits of our public API

Violation of this section may result in immediate account suspension without refund.`,
  },
  {
    id: 'intellectual-property',
    title: '5. Intellectual Property',
    content: `Content you submit: You retain all ownership rights to content you submit for analysis. By submitting content, you grant AIDetector.cx a limited, non-exclusive license to process your content to provide the Service.

Our property: The Service, including all software, models, designs, text, and trademarks, is owned by AIDetector.cx Inc. and protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works of our platform without express written permission.

Output: Analysis results and AI-generated content produced through the Service are provided to you under a limited license for your personal or commercial use, subject to these Terms.`,
  },
  {
    id: 'subscriptions',
    title: '6. Subscriptions & Payments',
    content: `Billing: Subscriptions are billed in advance on a monthly or annual basis. All prices are in USD unless otherwise stated.

Cancellation: You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period. No refunds are issued for partial billing periods.

Refunds: We offer a 14-day money-back guarantee for new subscribers. Contact billing@aidetector.cx within 14 days of your initial purchase.

Price Changes: We will provide at least 30 days' notice before increasing subscription prices. Continued use after the effective date constitutes acceptance of new pricing.`,
  },
  {
    id: 'disclaimers',
    title: '7. Disclaimers & Limitations',
    content: `Accuracy: Our AI detection models are highly accurate but not infallible. Detection results should be used as one input in a broader review process, not as definitive proof of authorship. We make no warranties regarding the accuracy of detection results.

No Warranty: THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

Limitation of Liability: TO THE MAXIMUM EXTENT PERMITTED BY LAW, AIDETECTOR.CX SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE 12 MONTHS PRECEDING THE CLAIM.`,
  },
  {
    id: 'indemnification',
    title: '8. Indemnification',
    content: 'You agree to indemnify, defend, and hold harmless AIDetector.cx, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including reasonable legal fees) arising from your use of the Service, your violation of these Terms, or your infringement of any third-party rights.',
  },
  {
    id: 'termination',
    title: '9. Termination',
    content: 'We may suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or other conduct we determine to be harmful to the Service or other users. You may delete your account at any time via your account settings. Upon termination, your right to use the Service ceases immediately.',
  },
  {
    id: 'governing-law',
    title: '10. Governing Law & Disputes',
    content: 'These Terms are governed by the laws of the State of California, USA, without regard to conflict of law principles. Any dispute arising under these Terms shall first be addressed through good-faith negotiation. If unresolved, disputes shall be settled by binding arbitration under AAA rules in San Francisco, California, except that either party may seek injunctive relief in a court of competent jurisdiction.',
  },
  {
    id: 'changes',
    title: '11. Changes to Terms',
    content: 'We may update these Terms from time to time. We will provide at least 14 days notice of material changes via email or a prominent notice on the platform. Your continued use of the Service after the effective date of changes constitutes acceptance of the revised Terms.',
  },
  {
    id: 'contact',
    title: '12. Contact',
    content: 'For questions about these Terms, contact us at legal@aidetector.cx or: AIDetector.cx Inc., 2150 Shattuck Ave, Suite 510, Berkeley, CA 94704, USA.',
  },
];

export default function TermsOfServicePage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-navy text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-5">Legal</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">Terms of Service</h1>
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
              <Link to="/privacy" className="text-xs text-primary hover:text-primary/80 block mb-1.5">Privacy Policy</Link>
              <Link to="/cookies" className="text-xs text-primary hover:text-primary/80 block">Cookie Policy</Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <article className="flex-1 min-w-0">
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty mb-8 p-4 bg-muted/40 rounded-lg border border-border">
            Please read these Terms of Service carefully before using AIDetector.cx. By using the Service, you agree to be bound by these Terms.
          </p>
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-10">
              <h2 className="text-lg font-bold text-navy mb-3 text-balance">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
            </section>
          ))}
        </article>
      </div>
    </MainLayout>
  );
}
