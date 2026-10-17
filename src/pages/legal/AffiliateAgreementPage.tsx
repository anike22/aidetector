import MainLayout from '@/components/layouts/MainLayout';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export const affiliateAgreementSections = [
  {
    "id": "parties",
    "title": "1. Parties, scope and acceptance",
    "content": "This Affiliate Program Agreement is between the operator of AIDetector.cx (\"AIDetector.cx\", \"we\", \"us\") and the individual or organisation applying to promote it (\"you\", \"affiliate\"). It governs referrals to eligible AIDetector.cx subscriptions. Contact: partnerships@aidetector.cx. Version 1.0, published 17 October 2026.\nReading this page, receiving an invitation, or receiving testing access does not enroll you or imply acceptance. Participation requires your express acceptance of this agreement and our approval of your application. If you represent an organisation, you confirm authority to bind it. Keep a copy of the version you accept. A separately agreed written partner addendum takes precedence for its stated subject; otherwise this agreement controls affiliate-specific matters, alongside our Terms of Service and Privacy Policy."
  },
  {
    "id": "eligibility",
    "title": "2. Eligibility and approval",
    "content": "Applications are welcome from all countries, including India, subject to applicable law, sanctions and availability of lawful payment arrangements. You must be at least 18 and legally able to enter a contract. Participation is free; buying a subscription is not required.\nProvide accurate identity, contact, website and promotional-channel information. We may request reasonable verification and approve or decline an application based on relevance, authenticity and compliance. An application is not approval. Keep your account secure and information current; do not share or transfer affiliate access without written permission."
  },
  {
    "id": "commission",
    "title": "3. Commission and eligible payments",
    "content": "The standard rate is 30% recurring commission on qualifying subscription payments recorded against your approved referral. Commission is calculated from the subscription payment amount recorded by our payment system, after discounts; no commission is earned on free access, testing credits, unpaid invoices, refunded or charged-back amounts, or fraudulent transactions. Consulting, custom services, taxes separately recorded, and other non-subscription charges are excluded unless expressly agreed in writing. We do not subtract an additional processing-fee deduction from the recorded eligible subscription amount.\nLifetime recurring means future qualifying payments from a validly attributed customer can earn commission while that customer pays for an eligible subscription and your affiliate participation remains active and compliant. It is not a guaranteed payment, minimum income, perpetual subscription or commission on amounts not collected. No payment is earned merely for recruiting other affiliates. Dashboard estimates remain pending until validated."
  },
  {
    "id": "attribution",
    "title": "4. Referral attribution and tracking",
    "content": "The initial attribution window is 30 days. A qualifying first paid conversion must be supported by a recorded referral journey within that window. Once a valid first paid conversion establishes customer attribution, subsequent eligible subscription payments remain attributed to that affiliate without requiring another click within 30 days.\nWhere more than one eligible recorded journey exists, the current system selects the earliest qualifying journey within the acquisition window; an existing persistent customer attribution takes priority. Self-referrals, purchases through accounts you control to generate commission, cookie stuffing, forced clicks and manipulated attribution are prohibited.\nUse the tracking link supplied in your dashboard. Consent choices, browser restrictions, deleted storage, cross-device use and broken links can prevent tracking; an untracked visit is not automatically commissionable. Contact us with the link, dates and non-sensitive supporting evidence if attribution appears incorrect. We will investigate in good faith and explain material adjustments. A longer attribution window or custom arrangement requires written approval and technical confirmation before use; it is not automatic."
  },
  {
    "id": "refunds",
    "title": "5. Holding period, refunds and corrections",
    "content": "Commissions have a 30-day holding period from the qualifying payment and become payable only after validation and approval. Refunds, chargebacks, payment reversals, duplicates and fraudulent transactions may reduce or reverse the related commission, including after the holding period.\nIf a reversed commission was already paid, we may offset that specific amount against future commissions, showing the adjustment in the account. We will explain material reversals on request. Commission status does not alter customers’ refund rights under the applicable purchase terms or law. You may challenge an adjustment by emailing supporting information; we will review it fairly."
  },
  {
    "id": "payouts",
    "title": "6. Payouts, currency and taxes",
    "content": "Commissions are denominated in USD. The minimum payout request is US$50 in approved, available commission after reversals and recovery balances. Balances below the threshold carry forward. Request a payout through the affiliate dashboard or contact partnerships@aidetector.cx for assistance. Approved requests are processed in a monthly payout cycle, subject to the holding period, verification and a working payment method. We will confirm the expected processing date and notify you of material delays; submission is not an instant transfer.\nStandard methods are PayPal or USD bank transfer where supported. If neither is available in your country, propose another method and we will work with you to find a feasible lawful arrangement. Availability and settlement currency must be confirmed before payment; no specific alternative is guaranteed. Stripe is not an affiliate payout option under this agreement.\nSupply accurate payment details through the approved secure channel only when needed. Receiving-bank, intermediary and currency-conversion charges may apply; any fee we propose to deduct will be disclosed before payment. You are responsible for your own taxes and invoices; we may collect legally required tax information or withhold amounts required by law and provide the relevant record. We do not require an upfront fee to release commission."
  },
  {
    "id": "testing",
    "title": "7. Complimentary testing access",
    "content": "Approved applicants may receive 300 complimentary testing credits after registration, verification and activation. Credits are for evaluating the platform, have no cash value, cannot be transferred or redeemed for commission, and are consumed at the tool rates shown in your account.\nThese testing credits do not automatically enroll you in a paid subscription, require a payment card, or trigger a charge when exhausted. Paid access requires your separate checkout and authorisation. No fixed expiry is imposed by this agreement; if an individual testing grant has an expiry or feature restriction, we will disclose it in writing before you accept that grant. Account misuse or a lawful account suspension can restrict access. Testing access is not payment for positive coverage and does not require publication."
  },
  {
    "id": "editorial",
    "title": "8. Editorial independence and disclosures",
    "content": "You decide whether to publish, recommend or decline the product based on your own testing. We do not require positive reviews, minimum ratings, paid placement, guaranteed praise, or suppression of honest criticism. Commission rates are not conditioned on a favourable opinion. Disclose both the affiliate relationship and complimentary access when relevant, clearly and conspicuously near the recommendation or link and in the language of the content. For example: “I may earn a commission if you subscribe through my link. AIDetector.cx provided testing credits; these are my own opinions.”\nFollow applicable advertising, endorsement, consumer-protection and platform rules, including FTC requirements when reaching US audiences. Do not fabricate testimonials, users, results or accuracy benchmarks, claim guaranteed rankings or earnings, or present detection scores as proof of misconduct. Describe actual experience and material limitations. You may submit factual questions for clarification without giving us control over your editorial conclusions. Where required by search-platform rules, qualify compensated links appropriately, such as rel=\"sponsored\"."
  },
  {
    "id": "promotion",
    "title": "9. Permitted promotion and prohibited conduct",
    "content": "Promote through your own lawful, accurately described websites, newsletters, social channels and videos. Obtain necessary consent for marketing, honour opt-outs, and comply with applicable privacy, anti-spam and advertising rules. Do not send unsolicited bulk messages, scrape private contact data, impersonate our staff, mislead customers, publish unlawful material, use malware, manipulate referrals or make unauthorised guarantees.\nDo not bid on AIDetector.cx trademarks, register confusing domains or social handles, claim to be the official website, or use brand terms in paid-search advertising without prior written approval. Coupon codes must be specifically issued or approved by us; do not invent discounts, promote expired codes, intercept checkout traffic, or imply that a referral link guarantees a discount. Sub-affiliate networks, cashback or incentive schemes require prior written approval. Independent, accurate comparisons and criticism are allowed."
  },
  {
    "id": "materials",
    "title": "10. Brand assets and intellectual property",
    "content": "While approved, you receive a limited, non-exclusive, revocable permission to use supplied or expressly approved logos, screenshots, tracking links and promotional materials solely to promote the program. Preserve brand integrity and do not imply endorsement beyond the affiliate relationship. Ask partnerships@aidetector.cx for available creatives or a media kit; bespoke assets are subject to availability.\nYou retain ownership of your original content. This agreement does not give us permission to republish your review, photograph or other content beyond a link or a separately agreed licence. Neither party acquires the other’s trademarks or intellectual property."
  },
  {
    "id": "privacy",
    "title": "11. Privacy and confidentiality",
    "content": "We process application, referral and payout information under our Privacy Policy and applicable law. Do not collect or disclose referred customers’ private account, payment or submitted-content information without a lawful basis. Use only the reporting data made available to you, protect it, and report suspected unauthorised access promptly.\nProtect non-public credentials, payment details and information clearly identified as confidential. This does not restrict disclosure required by law, information already lawfully public, independent product reviews or reporting wrongdoing. Do not upload sensitive payment details into public support threads."
  },
  {
    "id": "termination",
    "title": "12. Suspension, termination and final balances",
    "content": "Either party may end participation by written notice to partnerships@aidetector.cx or your registered email. We may suspend access promptly to investigate credible fraud, security issues or unlawful activity, and will give a reason where legally permitted. For remediable breaches, we will normally provide an opportunity to correct them. Stop using affiliate links and licensed promotional assets when participation ends; truthful independent editorial content may remain with its relationship disclosures updated.\nValid commissions earned before termination remain payable after the holding period and appropriate refund adjustments. Fraud-related amounts may be withheld only to the extent reasonably connected to the issue. On closure, contact us for a final payout of a valid approved balance even below US$50, subject to lawful payment availability and disclosed transfer charges. No new commissions accrue after termination; “lifetime” does not override the requirement for active participation. Good-faith criticism alone is not grounds to cancel earned commissions."
  },
  {
    "id": "changes",
    "title": "13. Changes and program closure",
    "content": "We will give at least 30 days’ notice by registered email or a prominent dashboard notice of material changes to commission, payout or participation terms, except changes immediately required by law or to address fraud or security. Changes apply prospectively and do not retrospectively remove valid earned commissions. We will state whether changes affect future payments from existing attributed customers; a written partner addendum remains controlling within its scope.\nYou may decline a change by ending participation before it takes effect. Where acceptance is legally required, we will request it rather than infer it from silence. If the program closes, we will provide reasonable notice and settle valid earned balances under section 12. This page displays the current version; request an earlier accepted version from partnerships@aidetector.cx."
  },
  {
    "id": "responsibility",
    "title": "14. Relationship, warranties and liability",
    "content": "You are an independent contractor. This agreement creates no employment, agency, joint venture, franchise or authority to bind either party. You are responsible for your own marketing expenses. Neither party guarantees sales, earnings, uninterrupted tracking or error-free detection. Product outputs require human judgment.\nTo the extent permitted by law, neither party is liable to the other for indirect or consequential loss or speculative lost profits. Each party remains responsible for its own fraud, wilful misconduct, unlawful conduct and obligations that cannot legally be excluded. Nothing limits payment of valid earned commissions or mandatory statutory rights. Each party will cooperate reasonably in addressing third-party claims caused by its own unlawful promotion, infringement or breach; no obligation to fund an unapproved settlement is created."
  },
  {
    "id": "disputes",
    "title": "15. Disputes, notices and general provisions",
    "content": "Raise program questions, attribution disputes and payment concerns at partnerships@aidetector.cx with relevant records. We will first seek a good-faith resolution and give the matter a reasonable review period. The governing-law and dispute provisions of the Terms of Service apply to the extent valid and enforceable, without overriding mandatory local rights. This agreement does not add a separate jurisdiction or arbitration requirement.\nNotices may be sent to the registered email address or our contact above. Neither party may transfer this agreement without consent, except in a business succession that honours existing obligations. If a provision is unenforceable, the remainder continues; a failure to enforce once is not a waiver. This agreement and expressly accepted written addenda are the entire affiliate-specific agreement. Invitations and website summaries do not override it. Contact us before enrolling if any term is unclear."
  }
];

export default function AffiliateAgreementPage() {
  return (
    <MainLayout>
      <Helmet><title>Affiliate Program Agreement | AIDetector.cx</title><meta name="description" content="Full AIDetector.cx affiliate agreement: 30% recurring commission, attribution, USD payouts, testing credits, editorial independence and partner responsibilities." /><link rel="canonical" href="https://www.aidetector.cx/affiliate-agreement" /></Helmet>
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <Link to="/affiliate-hub" className="text-primary underline">Back to Affiliate Hub</Link>
        <h1 className="text-3xl md:text-4xl font-bold mt-6 mb-3">Affiliate Program Agreement</h1>
        <p className="text-sm text-muted-foreground">Version 1.0 · Published 17 October 2026 · Effective for each affiliate upon express acceptance and approval</p>
        <p className="mt-6 rounded-lg border p-4 leading-relaxed">30% recurring commission · 30-day initial attribution · 30-day holding period · US$50 standard payout minimum. This summary is subject to the full agreement below. Reading this page does not enroll you.</p>
        <nav aria-label="Agreement contents" className="my-8 grid gap-2 sm:grid-cols-2">{affiliateAgreementSections.map(section => <a className="text-sm text-primary underline" key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav>
        <article>{affiliateAgreementSections.map(section => <section id={section.id} key={section.id} className="mb-9 scroll-mt-24"><h2 className="text-xl font-semibold mb-3">{section.title}</h2>{section.content.split('\n').map((paragraph, index) => <p key={index} className="text-muted-foreground leading-7 mb-3">{paragraph}</p>)}</section>)}</article>
        <p className="border-t pt-6 flex flex-wrap gap-4"><Link to="/terms" className="text-primary underline">Terms of Service</Link><Link to="/privacy" className="text-primary underline">Privacy Policy</Link><a href="mailto:partnerships@aidetector.cx" className="text-primary underline">Contact partnerships</a></p>
      </div>
    </MainLayout>
  );
}
