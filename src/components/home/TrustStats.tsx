import { useEffect, useState } from 'react';

const stats = [
  { value: 15.2, suffix: 'M+', label: 'Words Analyzed' },
  { value: 99.8, suffix: '%', label: 'Detection Accuracy' },
  { value: 120, suffix: 'K+', label: 'Happy Users' },
  { value: 150, suffix: '+', label: 'Countries' },
];

export default function TrustStats() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="py-12 border-b border-border/40 bg-background/50 backdrop-blur-sm relative z-20 -mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center group">
              <div className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tighter mb-2 flex items-center justify-center">
                <span className={`transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${i * 100}ms` }}>
                  {stat.value}
                </span>
                <span className="text-primary">{stat.suffix}</span>
              </div>
              <div className="text-sm md:text-base font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
