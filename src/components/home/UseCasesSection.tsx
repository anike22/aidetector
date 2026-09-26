import { GraduationCap, Users, PenTool, BarChart3, Building2, Microscope, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const USE_CASES = [
  {
    icon: GraduationCap,
    title: 'Students',
    description: 'Check essays, assignments and research drafts before submission. Understand how your writing reads and identify sections that may benefit from more personal development.',
    href: '/detector',
    cta: 'Check Your Essay',
  },
  {
    icon: Users,
    title: 'Teachers & Educators',
    description: 'Review writing patterns as one input alongside assignment context and institution policies. Detection results indicate probability — not proof of misconduct.',
    href: '/detector',
    cta: 'Educator Workflow',
  },
  {
    icon: PenTool,
    title: 'Writers & Publishers',
    description: 'Verify AI-assisted and mixed-authorship content before publication. Make informed editorial decisions based on sentence-level signals.',
    href: '/detector',
    cta: 'Verify Writing',
  },
  {
    icon: BarChart3,
    title: 'SEO & Marketing Teams',
    description: 'Audit content pipelines for AI signals. Pair detection with the SEO Assistant to review AI probability and search optimisation together.',
    href: '/seo-assistant',
    cta: 'Audit Content',
  },
  {
    icon: Microscope,
    title: 'Researchers',
    description: 'Investigate AI-assisted writing patterns across sample sets using dual-mode results and sentence-level analysis as research data points.',
    href: '/detector',
    cta: 'Start Analysis',
  },
  {
    icon: Building2,
    title: 'Businesses & Enterprises',
    description: 'Scale AI content analysis via the API. Content governance, compliance screening and integration into editorial or knowledge-management workflows.',
    href: '/api-platform',
    cta: 'Explore the API',
  },
];

export default function UseCasesSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            Who Uses AIDetector.cx?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            AI detection built for different workflows — from the classroom to the enterprise.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {USE_CASES.map((u) => (
            <Card key={u.title} className="p-6 border-border/50 bg-card h-full flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary shrink-0">
                <u.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{u.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{u.description}</p>
              <Button asChild variant="outline" size="sm" className="mt-auto w-full">
                <Link to={u.href}>
                  {u.cta} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
