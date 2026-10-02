import PageMeta from '@/components/common/PageMeta';
import MainLayout from '@/components/layouts/MainLayout';
import { SEOAssistantWorkspace } from '@/components/seo-assistant/SEOAssistantWorkspace';

export default function SEOAssistantPage() {
  return (
    <MainLayout showFooter={false}>
      <PageMeta
        title="SEO Writing Assistant – Review and Improve Content | AIDetector.cx"
        description="Review keyword usage, readability, headings and content integrity with the AIDetector.cx SEO writing assistant. Understand findings and their limitations."
        canonicalUrl="https://www.aidetector.cx/seo-assistant"
      />
      <SEOAssistantWorkspace
        enableBloggerOptimization={true}
        showHeaderControls={true}
      />
      <section className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <h1 className="text-2xl font-bold">SEO Writing Assistant</h1>
        <p>Use the SEO Assistant to review a draft before publication. Enter your content and target keyword, then run an analysis to identify opportunities in keyword usage, readability, heading structure and content integrity. The workspace helps you review suggestions alongside your writing so you can decide which changes serve your readers.</p>
        <h2 className="text-xl font-semibold">Turn findings into useful edits</h2>
        <p>Start with the purpose of your page and the question your reader needs answered. Review keyword suggestions in context: a relevant phrase belongs where it makes the explanation clearer. Repeating a keyword simply to increase a score can make an article harder to read. Use heading and paragraph feedback to make information easier to navigate, and check grammar suggestions against the intended meaning.</p>
        <p>For credibility, add evidence you can verify, identify the author where appropriate, and explain the basis for important claims. First-hand examples, accurately cited sources and clear descriptions of limitations can help readers evaluate your work. Review generated titles and descriptions before using them; they should describe the final page faithfully.</p>
        <h2 className="text-xl font-semibold">Understand the limits of automated analysis</h2>
        <p>Scores and suggestions are editing aids. They do not guarantee search rankings, traffic or conversions. Search performance also depends on the usefulness of the page, competition, links, technical accessibility and other factors outside this analysis. Automated grammar and relevance checks can miss context or suggest changes that alter your meaning.</p>
        <p>AI detection is probabilistic and may flag human writing or miss generated text. An AI risk score should not be treated as proof of authorship. Plagiarism findings depend on the sources available to the checking system and do not establish ownership or permission. Review the original sources and use editorial judgment before publishing or making decisions about another person's work.</p>
        <h2 className="text-xl font-semibold">Continue your content review</h2>
        <p>Learn <a className="text-primary underline" href="/guides/how-ai-detection-works">how AI detection works</a>, review text with the <a className="text-primary underline" href="/plagiarism-checker">plagiarism checker</a>, or explore the <a className="text-primary underline" href="/ai-checker-for-bloggers">AI Checker for Bloggers</a> workflow. Keep the final review focused on accuracy, clarity and the needs of your audience.</p>
      </section>
    </MainLayout>
  );
}
