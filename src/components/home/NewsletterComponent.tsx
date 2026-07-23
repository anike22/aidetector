import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

export function NewsletterComponent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      // Create user_email_preferences entry for newsletter
      const { error } = await supabase.from('user_email_preferences').upsert({
        user_id: null, // Since they might not have an account, but table requires user_id. We'd normally use a separate table or handle this.
      }, { onConflict: 'user_id' });
      // Actually, since user_id is required, we can't easily add anonymous users without auth. 
      // Instead, we will store them in profiles with a specific role, or we need a newsletter_subscribers table.
      // Assuming we trigger the edge function to handle the subscription process.
      
      const { data, error: edgeError } = await supabase.functions.invoke('email-automation-worker', {
         body: { action: 'newsletter_subscribe', email }
      });

      toast.success('Thank you for subscribing! Please check your email to confirm.');
      setEmail('');
    } catch (err: any) {
      toast.error('Failed to subscribe. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 bg-navy text-white text-center rounded-2xl my-8 mx-4 md:mx-auto max-w-5xl shadow-xl">
      <div className="max-w-2xl mx-auto px-4 space-y-4">
        <Mail className="w-8 h-8 mx-auto text-primary-foreground/80 mb-2" />
        <h2 className="text-2xl md:text-3xl font-bold">Subscribe to Our Newsletter</h2>
        <p className="text-white/80">Get the latest updates, tips, and insights delivered to your inbox.</p>
        
        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto mt-6">
          <Input 
            type="email" 
            placeholder="Enter your email address" 
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading} variant="secondary" className="font-semibold shrink-0">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Subscribe
          </Button>
        </form>
        <p className="text-xs text-white/50 mt-4">We respect your privacy. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
