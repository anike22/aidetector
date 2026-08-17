import { GraduationCap, Users, PenTool, BarChart3, Microscope, Building2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: 'Students',
    heading: 'AI Detector for Students',
    description:
      'Check how your essays, assignments and research drafts read before submission. Understanding where your writing sits on the AI-to-human spectrum can help you identify sections that may benefit from a more personal voice or additional development.',
    cta: 'Check an Essay',
    href: '/detector',
  },
  {
    icon: Users,
    title: 'Teachers & Educators',
    heading: 'AI Detector for Teachers',
    description:
      'Review writing patterns as one input alongside assignment context, classroom observation, and your institution\'s academic integrity policies. Detector results indicate probability, not proof — they should not be used as standalone evidence of misconduct.',
    cta: 'Explore Educator Use',
    href: '/detector',
  },
  {
    icon: PenTool,
    title: 'Writers & Publishers',
    heading: 'AI Writing Detector for Editorial Teams',
    description:
      'Verify AI-assisted and mixed-authorship content before publication. Run drafts through the AI writing detector to understand where human and AI contributions intersect and make informed editorial decisions.',
    cta: 'Detect AI Writing',
    href: '/detector',
  },
  {
    icon: BarChart3,
    title: 'SEO & Marketing Teams',
    heading: 'AI Content Detector for Content Teams',
    description:
      'Audit content pipelines for AI-generated text to maintain editorial quality and consistency. Pair detection with the SEO Assistant to review content for both AI signals and search optimisation in a single workflow.',
    cta: 'Review Content',
    href: '/detector',
  },
  {
    icon: Microscope,
    title: 'Researchers',
    heading: 'AI Essay Detector for Academic Research',
    description:
      'Investigate AI-assisted writing patterns across sample sets. Use dual-mode results and sentence-level signals as one data point in broader studies on AI writing behaviour, disclosure, and detection methodology.',
    cta: 'Start Analyzing',
    href: '/detector',
  },
  {
    icon: Building2,
    title: 'Businesses & Enterprises',
    heading: 'Scalable AI Content Analysis',
    description:
      'Run AI content analysis at scale through the API or platform. Suitable for content governance, compliance screening, and integration into existing editorial, publishing, or knowledge-management workflows.',
    cta: 'Explore the API',
    href: '/api-platform',
  },
];

export default function AudienceIntentSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            AI Detection for Every Type of Writing
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            Different workflows need different perspectives. Here is how AIDetector.cx supports each one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AUDIENCES.map((a) => (
            <Card key={a.title} className="p-6 border-border/50 bg-card h-full flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary shrink-0">
                <a.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">{a.heading}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">{a.description}</p>
              <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                <Link to={a.href}>
                  {a.cta} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
