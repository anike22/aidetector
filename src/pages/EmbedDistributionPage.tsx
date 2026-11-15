import { useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';

const EMBED_CODE = `<!-- AIDetector.cx Widget Start -->
<div class="ai-detector-widget-container" style="width:100%; max-width:800px; margin:0 auto; font-family:sans-serif;">
  <iframe src="https://www.aidetector.cx/embed/widget" title="AIDetector.cx AI Text Detector" width="100%" height="450" frameborder="0" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="border:1px solid #e2e8f0; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);"></iframe>
  <p style="text-align:center; font-size:12px; color:#64748b; margin-top:8px;">
    AI scanning technology provided by <a href="https://www.aidetector.cx" target="_blank" rel="dofollow" style="color:#3b82f6; text-decoration:underline; font-weight:600;">AIDetector.cx</a>
  </p>
</div>
<!-- AIDetector.cx Widget End -->`;

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
        title="Embed the Free AI Detector on Your Website | AIDetector.cx"
        description="Add the AIDetector.cx AI text detector to your blog, university, or website with a simple responsive iframe embed."
        canonicalUrl="https://www.aidetector.cx/embed"
      />
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">AIDetector.cx for publishers</p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">Add an AI detector to your website</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Give readers, students, and visitors a quick way to check writing for AI-generated patterns. Embed the responsive detector in minutes—no plugin or API key required.</p>
            <a href="#get-code" className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm hover:opacity-90">Get the embed code</a>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-16">
          <div className="min-w-0">
            <div className="mb-5">
              <p className="text-sm font-semibold text-primary">LIVE PREVIEW</p>
              <h2 className="mt-2 text-2xl font-bold">See the widget on your page</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">This preview loads the same isolated widget endpoint visitors will use on your website.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-lg">
              <iframe
                src="https://www.aidetector.cx/embed/widget"
                title="Live AIDetector.cx AI detector widget preview"
                className="block h-[490px] w-full rounded-xl border-0"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">The preview is interactive. Try entering text and running a scan.</p>
          </div>

          <div id="get-code" className="min-w-0 scroll-mt-24">
            <p className="text-sm font-semibold text-primary">ONE-TIME SETUP</p>
            <h2 className="mt-2 text-2xl font-bold">Copy your embed code</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Paste this snippet where you want the detector to appear. The iframe scales to the width of its container.</p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="text-xs font-semibold text-slate-300">HTML EMBED</span>
                <button type="button" onClick={handleCopy} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-bold text-white hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300">
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <textarea
                aria-label="Read-only AIDetector.cx embed code"
                readOnly
                spellCheck={false}
                value={EMBED_CODE}
                onFocus={(event) => event.currentTarget.select()}
                className="min-h-[360px] w-full resize-y bg-transparent p-4 font-mono text-[11px] leading-5 text-slate-200 outline-none"
              />
            </div>
            <p aria-live="polite" className="mt-2 min-h-5 text-xs text-muted-foreground">{copyError || (copied ? 'Embed code copied to your clipboard.' : 'The code is read-only; use Copy Code or select it manually.')}</p>
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold">A note about the attribution link</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">The visible AIDetector.cx credit is part of the embed. Standard HTML links are followed by default; the non-standard rel="dofollow" value does not create a special ranking signal. Google may ignore links distributed primarily to manipulate rankings.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <h2 className="text-2xl font-bold">Install the widget in three steps</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <article className="rounded-2xl border border-border bg-card p-6">
                <span className="text-sm font-bold text-primary">01 · WORDPRESS</span>
                <h3 className="mt-3 text-lg font-bold">Use a Custom HTML block</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                  <li>Open the page or post in the WordPress editor.</li>
                  <li>Add a <strong>Custom HTML</strong> block where the detector should appear.</li>
                  <li>Paste the copied snippet and preview or publish the page.</li>
                </ol>
              </article>
              <article className="rounded-2xl border border-border bg-card p-6">
                <span className="text-sm font-bold text-primary">02 · WIX</span>
                <h3 className="mt-3 text-lg font-bold">Add an Embed HTML element</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                  <li>Open the Wix Editor and choose <strong>Embed Code</strong>.</li>
                  <li>Select <strong>Embed HTML</strong> and add the element to your page.</li>
                  <li>Paste the snippet, resize the element, and publish.</li>
                </ol>
              </article>
              <article className="rounded-2xl border border-border bg-card p-6">
                <span className="text-sm font-bold text-primary">03 · CUSTOM HTML</span>
                <h3 className="mt-3 text-lg font-bold">Paste into your markup</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                  <li>Open the HTML template or CMS source.</li>
                  <li>Paste the snippet inside the page body where it belongs.</li>
                  <li>Deploy and check the widget on desktop and mobile.</li>
                </ol>
              </article>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">Need help? <a className="font-semibold text-primary underline" href="https://www.aidetector.cx/contact">Contact AIDetector.cx</a>.</p>
          </div>
        </section>
      </main>
    </MainLayout>
  );
}
