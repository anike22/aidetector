import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, ArrowRight, Monitor, Smartphone, Zap, Shield, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WebsiteDevelopmentPage({ title = "Professional Website Development Services", seoKeyword = "Website Development" }) {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <Helmet>
        <title>{title} | AIDetector.cx</title>
        <meta name="description" content={`Get custom high-converting, SEO-optimized websites for your business with our ${seoKeyword} services.`} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-navy pt-20 pb-28 md:pt-32 md:pb-40 px-4 md:px-6">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-balance leading-tight">
            {title}
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto text-pretty">
            Custom High-Converting, SEO-Optimized Websites for Your Business. Drive more leads and sales with a professional online presence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-700 text-white border-0" onClick={() => navigate('/services/website-development/request')}>
              Request Website Development <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="ghost" className="h-14 px-8 text-base border border-slate-600 text-white hover:bg-white/10" onClick={() => navigate('/services/website-development/book-meeting')}>
              Book a Meeting
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 md:px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Why Choose Our {seoKeyword} Services?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">We don't just build websites. We build scalable digital assets designed to grow your business.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: 'SEO-Optimized', desc: 'Built from the ground up for maximum search engine visibility and AEO (Answer Engine Optimization).' },
              { icon: Smartphone, title: 'Mobile-Responsive', desc: 'Flawless experience across all devices, ensuring you capture mobile traffic effectively.' },
              { icon: Zap, title: 'Fast Loading', desc: 'Optimized for Core Web Vitals to deliver lightning-fast load times and better user engagement.' },
              { icon: Shield, title: 'Secure & Scalable', desc: 'Enterprise-grade security and architecture that grows seamlessly with your business.' },
              { icon: Monitor, title: 'Conversion-Focused', desc: 'Strategic UI/UX design proven to turn your website visitors into paying customers.' },
              { icon: CheckCircle2, title: 'Ongoing Support', desc: 'Dedicated maintenance, hosting options, and technical support after launch.' },
            ].map((feature, i) => (
              <Card key={i} className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-pretty">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 px-4 md:px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Our Development Process</h2>
            <p className="text-muted-foreground text-lg">A proven methodology to deliver your project on time and on budget.</p>
          </div>

          <div className="space-y-8">
            {[
              { step: '01', title: 'Consultation & Strategy', desc: 'We start by understanding your business goals, target audience, and specific requirements to create a comprehensive project roadmap.' },
              { step: '02', title: 'UX/UI Design', desc: 'Our designers craft intuitive, conversion-focused wireframes and beautiful visual mockups tailored to your brand identity.' },
              { step: '03', title: 'Development', desc: 'Our engineering team brings the designs to life using modern tech stacks, ensuring clean code, speed, and responsiveness.' },
              { step: '04', title: 'Testing & QA', desc: 'Rigorous testing across browsers, devices, and platforms to ensure zero bugs and perfect performance.' },
              { step: '05', title: 'Launch & Training', desc: 'We deploy your website to production and provide you with the necessary training to manage your content.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-navy mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-lg text-pretty">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Options */}
      <section className="py-20 px-4 md:px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Pricing Packages</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Transparent pricing tailored to your business needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: 'Starter', price: 'From $1,500', target: 'For small businesses', features: ['Up to 5 Pages', 'Mobile Responsive', 'Contact Form', 'Basic SEO Setup', '2 Weeks Delivery'] },
              { name: 'Professional', price: 'From $3,500', target: 'For growing brands', featured: true, features: ['Up to 15 Pages', 'Custom UI/UX Design', 'CMS Integration', 'Advanced SEO & Speed Optimization', '4-6 Weeks Delivery'] },
              { name: 'Enterprise', price: 'Custom Quote', target: 'For complex requirements', features: ['Unlimited Pages', 'E-commerce & Web Apps', 'Custom API Integrations', 'Dedicated Account Manager', 'Custom Timeline'] },
            ].map((plan, i) => (
              <Card key={i} className={`border-border flex flex-col h-full ${plan.featured ? 'shadow-lg border-blue-500 scale-105 z-10 relative' : 'shadow-sm'}`}>
                {plan.featured && <div className="bg-blue-600 text-white text-center py-2 text-sm font-semibold uppercase tracking-wider">Most Popular</div>}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="text-muted-foreground mb-4">{plan.target}</div>
                  <div className="text-4xl font-bold text-navy">{plan.price}</div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-8">
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant={plan.featured ? 'default' : 'outline'} className={`w-full h-12 text-base ${plan.featured ? 'bg-blue-600 hover:bg-blue-700' : ''}`} onClick={() => navigate('/services/website-development/request')}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 md:px-6 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Frequently Asked Questions</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full bg-card rounded-xl border border-border">
            {[
              { q: 'How long does it take to build a website?', a: 'A standard 5-page business website typically takes 2-4 weeks. Larger e-commerce or custom web applications can take 2-4 months depending on complexity.' },
              { q: 'Will my website be mobile-friendly?', a: 'Absolutely. We design mobile-first, ensuring your website looks and functions perfectly on smartphones, tablets, and desktop computers.' },
              { q: 'Do you provide hosting and maintenance?', a: 'Yes! We offer fully managed hosting, security updates, and regular maintenance packages to keep your website running smoothly after launch.' },
              { q: 'Can you redesign my existing website?', a: 'Yes, we specialize in modernizing legacy websites, improving their design, user experience, and technical SEO performance.' },
            ].map((faq, i) => (
              <AccordionItem value={`item-${i}`} key={i} className="border-border px-6">
                <AccordionTrigger className="text-lg font-medium text-navy hover:no-underline hover:text-blue-600 py-6">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 md:px-6 bg-blue-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">Ready to Transform Your Online Presence?</h2>
          <p className="text-xl text-blue-100 mb-10 text-pretty">Let's discuss your project and build a website that drives real business results.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-base bg-white text-blue-600 hover:bg-slate-100" onClick={() => navigate('/services/website-development/request')}>
              Request a Free Quote
            </Button>
            <Button size="lg" variant="ghost" className="h-14 px-8 text-base border border-white text-white hover:bg-white/10" onClick={() => navigate('/services/website-development/book-meeting')}>
              Schedule a Consultation
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
