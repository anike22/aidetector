import { GraduationCap, Briefcase, PenTool, Code, Building, Newspaper } from 'lucide-react';

const users = [
  { role: 'Universities & Students', icon: GraduationCap, desc: 'Verify academic integrity and ensure original submissions without false positives.' },
  { role: 'SEO Agencies', icon: Briefcase, desc: 'Guarantee client content ranks well by bypassing search engine AI penalties.' },
  { role: 'Freelance Writers', icon: PenTool, desc: 'Prove the authenticity of your work to clients with verifiable human reports.' },
  { role: 'Developers', icon: Code, desc: 'Integrate the industry\'s most accurate detection engine directly via API.' },
  { role: 'Enterprises', icon: Building, desc: 'Protect brand reputation by ensuring all marketing material is genuinely crafted.' },
  { role: 'Publishers & Media', icon: Newspaper, desc: 'Maintain journalistic standards by screening submissions for AI hallucinations.' }
];

export default function WhoUsesThis() {
  return (
    <section className="py-24 bg-muted/30 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Built for Professionals
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're protecting academic integrity or scaling enterprise SEO, we have you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {users.map((user, i) => (
            <div key={i} className="flex gap-4 items-start p-6 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <user.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground mb-2">{user.role}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{user.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
