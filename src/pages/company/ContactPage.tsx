import { useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MessageSquare, Headphones, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const channels = [
  { icon: Headphones, title: 'Support', desc: 'Technical issues, account problems, or billing questions.', href: '#form', cta: 'Submit a ticket' },
  { icon: FileText, title: 'Press & Media', desc: 'Interview requests, press kit access, and media inquiries.', href: 'mailto:press@aidetector.cx', cta: 'press@aidetector.cx' },
  { icon: MessageSquare, title: 'Partnerships', desc: 'Integrations, affiliate programs, and B2B partnerships.', href: 'mailto:partners@aidetector.cx', cta: 'partners@aidetector.cx' },
  { icon: Mail, title: 'General', desc: 'Everything else — we read every email.', href: 'mailto:hello@aidetector.cx', cta: 'hello@aidetector.cx' },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', category: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.category || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
  };

  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-navy text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-5">Contact Us</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-balance">We'd love to hear from you</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto text-pretty leading-relaxed">
            Whether you have a question, a feature request, or just want to say hello — we respond to every message within 24 hours.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="py-14 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {channels.map((c) => {
              const Icon = c.icon;
              return (
                <Card key={c.title} className="border-border shadow-card h-full">
                  <CardContent className="p-5">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-navy text-sm mb-1">{c.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed text-pretty mb-3">{c.desc}</p>
                    <a href={c.href} className="text-xs text-primary font-medium hover:text-primary/80 transition-colors">
                      {c.cta}
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section id="form" className="py-16 md:py-20">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <Card className="border-border shadow-card">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-lg font-bold text-navy">Send us a message</CardTitle>
              <p className="text-sm text-muted-foreground">We typically respond within 24 hours on business days.</p>
            </CardHeader>
            <CardContent className="pt-6">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-success" />
                  </div>
                  <h3 className="font-bold text-navy text-lg mb-2">Message received!</h3>
                  <p className="text-muted-foreground text-sm text-pretty max-w-xs mx-auto">
                    Thanks for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6 h-9 text-sm border-border"
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', category: '', subject: '', message: '' }); }}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-normal">Name <span className="text-destructive">*</span></Label>
                      <Input placeholder="Your name" className="h-9 border-border" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-normal">Email <span className="text-destructive">*</span></Label>
                      <Input type="email" placeholder="you@example.com" className="h-9 border-border" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-normal">Category <span className="text-destructive">*</span></Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger className="h-9 border-border">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing &amp; Subscription</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="press">Press &amp; Media</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-normal">Subject</Label>
                    <Input placeholder="Brief subject line" className="h-9 border-border" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-normal">Message <span className="text-destructive">*</span></Label>
                    <Textarea
                      placeholder="Describe your question or feedback in detail..."
                      className="border-border min-h-[120px] resize-y text-sm"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground h-10 w-full font-medium">
                    {loading ? 'Sending…' : 'Send Message'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
