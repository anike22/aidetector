import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Check, Sparkles, Loader2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface TopUpPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  popular?: boolean;
  bestValue?: boolean;
  savings?: string;
}

export const TOP_UP_PACKS: TopUpPack[] = [
  {
    id: 'pack_500',
    name: 'Starter Boost',
    credits: 500,
    priceUsd: 15,
  },
  {
    id: 'pack_1000',
    name: 'Pro Pack',
    credits: 1000,
    priceUsd: 25,
    popular: true,
    savings: 'Save 17%',
  },
  {
    id: 'pack_2500',
    name: 'Growth Pack',
    credits: 2500,
    priceUsd: 50,
    savings: 'Save 33%',
  },
  {
    id: 'pack_5000',
    name: 'Scale Pack',
    credits: 5000,
    priceUsd: 90,
    bestValue: true,
    savings: 'Save 40%',
  },
];

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TopUpModal({ open, onOpenChange, onSuccess }: TopUpModalProps) {
  const { user } = useAuth();
  const [selectedPackId, setSelectedPackId] = useState<string>('pack_1000');
  const [loading, setLoading] = useState<boolean>(false);

  const selectedPack = TOP_UP_PACKS.find((p) => p.id === selectedPackId) || TOP_UP_PACKS[1];

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please log in to purchase top-up credits.');
      return;
    }

    setLoading(true);
    try {
      // Call edge function to create checkout session for top-up
      const { data, error } = await supabase.functions.invoke('create_stripe_checkout', {
        body: {
          plan: `topup_${selectedPack.id}`,
          billing_interval: 'month',
          is_topup: true,
          pack_id: selectedPack.id,
          credits: selectedPack.credits,
          amount_cents: selectedPack.priceUsd * 100,
          currency: 'usd',
          success_url: `${window.location.origin}/dashboard?topup=success&pack=${selectedPack.id}`,
          cancel_url: `${window.location.origin}${window.location.pathname}?topup=cancelled`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to initialize checkout');
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.success(`Top-up pack selected (${selectedPack.credits} credits). Redirecting to secure checkout...`);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('[TopUpModal] checkout error:', err);
      toast.error(err?.message || 'Could not start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg md:text-xl font-bold text-foreground">
                Buy More Credits (Top-Up)
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Add credits to your account anytime without changing your monthly subscription plan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 text-xs">
          <div className="p-2.5 rounded-lg bg-muted/50 border border-border flex items-start gap-2">
            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span><strong>Never Expire:</strong> Top-up credits persist across monthly plan refills.</span>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50 border border-border flex items-start gap-2">
            <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span><strong>Smart Order:</strong> Monthly included credits are consumed first.</span>
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50 border border-border flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span><strong>All Tools:</strong> Usable on SEO analysis, Humanizer, detectors & AI tools.</span>
          </div>
        </div>

        {/* Pack Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
          {TOP_UP_PACKS.map((pack) => {
            const isSelected = pack.id === selectedPackId;
            return (
              <div
                key={pack.id}
                onClick={() => setSelectedPackId(pack.id)}
                className={`relative p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-border/80 bg-card'
                }`}
              >
                {pack.popular && (
                  <Badge className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] px-2 py-0">
                    Most Popular
                  </Badge>
                )}
                {pack.bestValue && (
                  <Badge className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[10px] px-2 py-0">
                    Best Value
                  </Badge>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{pack.name}</span>
                    {pack.savings && (
                      <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                        {pack.savings}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-foreground">
                      {pack.credits.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">credits</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-bold text-foreground text-sm">${pack.priceUsd} USD</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Summary & Action */}
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            Total: <span className="font-bold text-foreground text-sm">${selectedPack.priceUsd}</span> for{' '}
            <span className="font-semibold text-primary">{selectedPack.credits.toLocaleString()} credits</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePurchase}
              disabled={loading}
              className="flex-1 sm:flex-none text-xs bg-primary text-primary-foreground font-semibold gap-1.5 min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="h-3.5 w-3.5" />
                  Buy {selectedPack.credits.toLocaleString()} Credits
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
