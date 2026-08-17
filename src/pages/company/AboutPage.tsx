import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Target, Users, Zap, Globe, ShieldCheck, TrendingUp } from 'lucide-react';

const stats = [
  { value: '2M+', label: 'Analyses run' },
  { value: '150K+', label: 'Active users' },
  { value: '98%', label: 'Accuracy rate' },
  { value: '40+', label: 'Countries' },
];

const values = [
  {
    icon: ShieldCheck,
    title: 'Trust & Transparency',
    desc: 'We believe the internet deserves honest content. Our tools help creators, educators, and businesses maintain integrity in an AI-saturated world.',
  },
  {
    icon: Zap,
    title: 'Speed & Precision',
    desc: 'Every analysis completes in under 3 seconds with research-backed detection models that improve continuously from real-world data.',
  },
  {
    icon: Globe,
    title: 'Accessible to All',
    desc: 'From solo bloggers to Fortune 500 compliance teams, our pricing and tooling are built to scale to any size organization.',
  },
  {
    icon: TrendingUp,
    title: 'Continuous Innovation',
    desc: 'AI evolves fast. So do we. Our research team ships model updates monthly to stay ahead of the latest generative AI advances.',
  },
];

const team = [
  { name: 'Aria Chen', role: 'CEO & Co-founder', bio: 'Former ML researcher at Google Brain. PhD in Computational Linguistics, Stanford.' },
  { name: 'Marcus Webb', role: 'CTO & Co-founder', bio: 'Ex-principal engineer at Cloudflare. Built distributed systems serving 10B+ requests/day.' },
  { name: 'Sofia Navarro', role: 'Head of Product', bio: 'Previously led product at Grammarly and HubSpot. Passionate about human-centered AI UX.' },
  { name: 'James Osei', role: 'Head of Research', bio: 'Published 30+ NLP papers. Former research scientist at OpenAI and DeepMind.' },
  { name: 'Yuki Tanaka', role: 'VP Engineering', bio: 'Full-stack architect with 12 years building AI-powered SaaS platforms from 0 to scale.' },
  { name: 'Priya Kapoor', role: 'Head of Growth', bio: 'Growth lead who scaled two B2B SaaS companies from seed to Series B in under 18 months.' },
];

export default function AboutPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-navy text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-5">Our Story</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-balance leading-tight">
            Building Trust in the Age of AI
          </h1>
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto text-pretty leading-relaxed">
            AIDetector.cx was founded in 2022 when AI-generated text began flooding the internet undetected. 
            We set out to build the most accurate, fastest, and most accessible AI detection platform on the planet.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-navy mb-1">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Mission</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4 text-balance">
                Empowering humans to stay in control of content authenticity
              </h2>
              <p className="text-muted-foreground leading-relaxed text-pretty mb-4">
                Generative AI is a remarkable tool — but unchecked, it erodes trust in journalism, academia, marketing, and everyday communication. AIDetector.cx gives every person and organization the power to verify what they're reading.
              </p>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                We combine state-of-the-art detection models with a growing suite of AI writing tools — so you're not just catching AI content, you're also creating better, more authentic content of your own.
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-64">
              <div className="w-32 h-32 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
                <Target className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Our Values</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance">What we stand for</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} className="border-border shadow-card h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy mb-1">{v.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{v.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Leadership</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3 text-balance">Meet the team</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              World-class researchers, engineers, and product thinkers united by a single mission.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <Card key={member.name} className="border-border shadow-card h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-navy">{member.name}</h3>
                  <p className="text-xs text-primary font-medium mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-balance">Join us on our mission</h2>
          <p className="text-white/65 mb-6 text-pretty">
            We're hiring brilliant people who care about the future of authentic communication.
          </p>
          <a href="/careers" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
            View Open Roles
          </a>
        </div>
      </section>
    </MainLayout>
  );
}
