import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
          Ready to verify your content?
        </h2>
        <p className="text-xl text-muted-foreground mb-10 text-balance">
          Join 120,000+ professionals using AIDetector.cx to guarantee authenticity, bypass AI penalties, and scale their content.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full font-bold shadow-hover">
            <Link to="/signup">Start for Free <ArrowRight className="w-5 h-5 ml-2" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full font-bold bg-background">
            <Link to="/pricing">View Pricing</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          No credit card required. Free plan available forever.
        </p>
      </div>
    </section>
  );
}
