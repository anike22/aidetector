import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';

const EMBED_CODE = `<!-- AIDetector.cx Widget Start -->
<div class="ai-detector-widget-container" style="width:100%; max-width:800px; margin:0 auto; font-family:sans-serif;">
  <iframe src="https://www.aidetector.cx/embed/widget?v=2" title="AIDetector.cx AI Text Detector" width="100%" height="450" frameborder="0" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);"></iframe>
  <p style="text-align:center; font-size:12px; color:#64748b; margin-top:8px;">
    AI scanning technology provided by <a href="https://www.aidetector.cx" target="_blank" rel="noopener noreferrer" style="color:#3b82f6; text-decoration:underline; font-weight:600;">AIDetector.cx</a>
  </p>
</div>
<!-- AIDetector.cx Widget End -->`;

const FAQS = [
  {
    question: 'Do I need an API key to embed the AIDetector.cx widget?',
    answer: 'No API key is required for this standard iframe embed. Copy the HTML snippet from this page and add it to a page or post on your website.',
  },
  {
    question: 'Can I use the AI detector widget on WordPress or Wix?',
    answer: 'Yes. On WordPress, add the snippet using a Custom HTML block. In Wix, add an Embed HTML element and paste the snippet. You can also add it to a custom HTML page or another CMS that supports iframes.',
  },
  {
    question: 'Can I change the widget width and height?',
    answer: 'Yes. The iframe uses a responsive width of 100% and a default height of 450 pixels. You can change the width and height attributes in the iframe element to fit your layout. Make sure the height is sufficient to display the complete detector interface.',
  },
  {
    question: 'Do visitors need to install anything?',
    answer: 'No browser extension or local software installation is needed to use the embedded detector. The widget loads from AIDetector.cx inside an iframe on your page.',
  },
  {
    question: 'Will the embedded widget affect my website loading speed?',
    answer: 'The detector interface and its application code run in an iframe hosted by AIDetector.cx, separate from your page scripts. However, an iframe still makes a network request and uses page space, so its impact depends on placement, loading behavior, and your page. The supplied snippet uses lazy loading to defer the iframe until it is near the viewport.',
  },
  {
    question: 'Is the AI detector widget free?',
    answer: 'The public embed snippet is provided at no charge. The embedded detector is subject to AIDetector.cx service availability, usage controls, and any limits displayed in the widget.',
  },
];

const SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AIDetector.cx Embeddable AI Detector Widget',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: 'https://www.aidetector.cx/embed',
    description: 'A responsive iframe widget that lets website owners embed the AIDetector.cx AI text detector in WordPress, Wix, or custom HTML websites.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: ['Responsive iframe embed', 'No API key required for the standard embed', 'WordPress Custom HTML support', 'Wix Embed HTML support', 'Custom HTML support'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  },
];

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Clipboard access was blocked by this browser.');
}

export default function EmbedDistributionPage() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const handleCopy = async () => {
    try {
      await copyText(EMBED_CODE);
      setCopied(true);
      setCopyError('');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
      setCopyError('Copy was blocked. Select the code and copy it manually.');
    }
  };

  return (
    <MainLayout>
      <PageMeta
        title="Free AI Detector Widget & Embed Code for Websites | AIDetector.cx"
        description="Add a free, responsive AI text detector widget to your website or blog in minutes. Embed it in WordPress, Wix, or custom HTML—no API key required."
        canonicalUrl="https://www.aidetector.cx/embed"
        ogTitle="Free AI Detector Widget & Embed Code for Websites | AIDetector.cx"
        ogDescription="Embed the AIDetector.cx AI text checker on WordPress, Wix, or a custom website with a responsive iframe. No API key required."
        schemas={SCHEMAS}
      />
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">AIDetector.cx for publishers</p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">Free AI detector widget for your website</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Add an AI text checker to your website, blog, or online publication. Copy one responsive iframe snippet and embed the detector in WordPress, Wix, or custom HTML—no API key or plugin installation required.</p>
            <a href="#get-code" className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm hover:opacity-90">Get the free embed code</a>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-16">
          <div className="min-w-0">
            <div className="mb-5">
              <p className="text-sm font-semibold text-primary">LIVE PREVIEW</p>
              <h2 className="mt-2 text-2xl font-bold">Preview the embedded AI checker</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Try the same isolated widget endpoint that your website visitors will use.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-lg">
              <iframe src="https://www.aidetector.cx/embed/widget?v=2" title="Live AIDetector.cx AI detector widget preview" className="block h-[490px] w-full rounded-xl border-0" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">The preview is interactive. Enter text and run a scan to try the widget.</p>
          </div>

          <div id="get-code" className="min-w-0 scroll-mt-24">
            <p className="text-sm font-semibold text-primary">ONE-TIME SETUP</p>
            <h2 className="mt-2 text-2xl font-bold">Copy your AI detector embed code</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Paste this HTML snippet where you want the AI checker to appear. The iframe fills its container width and starts at 450 pixels high.</p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="text-xs font-semibold text-slate-300">HTML EMBED</span>
                <button type="button" onClick={handleCopy} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300">{copied ? 'Copied!' : 'Copy Code'}</button>
              </div>
              <textarea aria-label="Read-only AIDetector.cx embed code" readOnly spellCheck={false} value={EMBED_CODE} onFocus={(event) => event.currentTarget.select()} className="min-h-[360px] w-full resize-y bg-transparent p-4 font-mono text-[11px] leading-5 text-slate-200 outline-none" />
            </div>
            <p aria-live="polite" className="mt-2 min-h-5 text-xs text-muted-foreground">{copyError || (copied ? 'Embed code copied to your clipboard.' : 'The code is read-only; use Copy Code or select it manually.')}</p>
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold">About the AIDetector.cx attribution</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">The visible credit link identifies the detector provider. Keep it intact when sharing the standard embed. Links should be useful to visitors; adding a link does not guarantee a search ranking benefit.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <h2 className="text-2xl font-bold">How to embed an AI checker on your website</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">The standard integration uses an iframe, so you do not need to install detector code on your own server or create an API key. Choose the instructions that match your site platform.</p>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <article className="rounded-2xl border border-border bg-card p-6">
                <span className="text-sm font-bold text-primary">01 · WORDPRESS</span>
                <h3 className="mt-3 text-lg font-bold">Use a Custom HTML block</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>Open the page or post in the WordPress editor.</li><li>Add a <strong>Custom HTML</strong> block where the detector should appear.</li><li>Paste the snippet, preview the page, and publish when ready.</li></ol>
                <Link to="/wordpress-plugin" className="mt-4 inline-flex text-sm font-semibold text-primary underline">See the WordPress plugin option</Link>
              </article>
              <article className="rounded-2xl border border-border bg-card p-6">
                <span className="text-sm font-bold text-primary">02 · WIX</span>
                <h3 className="mt-3 text-lg font-bold">Add an Embed HTML element</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>Open the Wix Editor and choose <strong>Embed Code</strong>.</li><li>Select <strong>Embed HTML</strong> and add the element to your page.</li><li>Paste the snippet, adjust the element size, and publish.</li></ol>
              </article>
              <article className="rounded-2xl border border-border bg-card p-6">
                <span className="text-sm font-bold text-primary">03 · CUSTOM HTML</span>
                <h3 className="mt-3 text-lg font-bold">Paste into your markup</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>Open your HTML template or CMS editor.</li><li>Paste the snippet inside the page body where it belongs.</li><li>Check the layout on desktop and mobile after publishing.</li></ol>
                <Link to="/developer" className="mt-4 inline-flex text-sm font-semibold text-primary underline">Explore developer resources</Link>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">For website owners and publishers</p>
            <h2 className="mt-2 text-2xl font-bold">Who is the AIDetector.cx widget for?</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">The embeddable AI detector is designed for site owners who want to make an AI text-checking tool available within their own website experience.</p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-card p-6"><h3 className="text-lg font-bold">Educational blogs and websites</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">Give readers and learners a convenient way to review writing for AI-generated patterns. Explain that detector results are indicators, not proof of authorship or academic misconduct.</p></article>
            <article className="rounded-2xl border border-border bg-card p-6"><h3 className="text-lg font-bold">Writing communities and marketplaces</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">Offer writers, editors, and clients an accessible text-checking step as part of a broader editorial or content-quality workflow.</p></article>
            <article className="rounded-2xl border border-border bg-card p-6"><h3 className="text-lg font-bold">SEO and content agencies</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">Give content teams and site visitors a convenient way to review text while applying your own editorial standards and human review process.</p></article>
          </div>
        </section>

        <section className="border-y border-border bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <h2 className="text-2xl font-bold">Why embed an AI text checker?</h2>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              <article className="rounded-2xl border border-border bg-card p-6"><h3 className="font-bold">No API key for the standard embed</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">Use the supplied iframe snippet without provisioning or exposing an API key on your website.</p></article>
              <article className="rounded-2xl border border-border bg-card p-6"><h3 className="font-bold">Responsive iframe layout</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">The widget uses a 100% width iframe so it can fit common content columns and responsive page layouts. Adjust its height to suit your design.</p></article>
              <article className="rounded-2xl border border-border bg-card p-6"><h3 className="font-bold">Isolated detector interface</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">The detector application runs in an iframe hosted by AIDetector.cx rather than being bundled with your site's JavaScript. The iframe still uses network and rendering resources, so test its placement and loading behavior as part of your page performance checks.</p></article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-14 md:px-6">
          <h2 className="text-2xl font-bold">Frequently asked questions about the AI detector embed</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card px-5">
            {FAQS.map((faq) => (
              <article key={faq.question} className="py-5">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="text-lg font-bold">Explore more AIDetector.cx integrations</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">Need a different way to add AI detection to your workflow? Explore the <Link to="/wordpress-plugin" className="font-semibold text-primary underline">WordPress plugin</Link>, the <Link to="/api" className="font-semibold text-primary underline">AI detection API</Link>, or the <Link to="/integrations" className="font-semibold text-primary underline">integrations hub</Link>. You can also <Link to="/detector" className="font-semibold text-primary underline">try the AI detector</Link> directly.</p>
            <p className="mt-3 text-sm text-muted-foreground">Need help with installation? <a className="font-semibold text-primary underline" href="https://www.aidetector.cx/contact">Contact AIDetector.cx</a>.</p>
          </div>
        </section>
      </main>
    </MainLayout>
  );
}
