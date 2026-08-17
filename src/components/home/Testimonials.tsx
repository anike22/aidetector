import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: "As an SEO agency, we need to ensure every piece of content passes AI checks before publishing. AIDetector.cx is the only tool we trust. The Humanizer is simply magic.",
    author: "Sarah Jenkins",
    role: "Head of SEO, GrowthLabs",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d"
  },
  {
    quote: "We've integrated their API into our university's grading portal. It has reduced false positives by 90% compared to our previous vendor. Exceptional technology.",
    author: "Dr. Michael Chen",
    role: "Academic Integrity Director",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704c"
  },
  {
    quote: "The Chrome extension is a lifesaver. I can highlight any text online and instantly verify if it's AI or human. I use it every single day for my editing work.",
    author: "Elena Rodriguez",
    role: "Senior Editor",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704b"
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Loved by Industry Leaders
          </h2>
          <div className="flex items-center justify-center gap-2 text-warning mb-4">
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
            <Star className="w-5 h-5 fill-current" />
          </div>
          <p className="text-lg text-muted-foreground">Rated 4.9/5 by over 10,000 professionals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm flex flex-col justify-between">
              <p className="text-foreground/80 leading-relaxed italic mb-8">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.author} className="w-12 h-12 rounded-full border border-border" />
                <div>
                  <div className="font-bold text-foreground">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
