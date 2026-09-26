import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Zap, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomerDataPlatform } from '@/contexts/CustomerDataPlatformContext';
import { useEffect, useState } from 'react';
import { TopUpModal } from '@/components/pricing/TopUpModal';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  trigger: 'limit_reached' | 'pro_feature';
  remaining?: number | null;
  limit?: number | null;
}

const PRO_BENEFITS = [
  'Unlimited AI Detector scans',
  'Unlimited SEO Assistant uses',
  'Unlimited SEO Content Studio uses',
  'Access to AI Humanizer',
  'Access to AI Image Detector',
  'Access to Plagiarism Checker',
  'Access to Hallucination Detector',
  'Access to Citation Verifier',
  'Priority support',
];

export default function UpgradeModal({
  open,
  onOpenChange,
  featureName,
  trigger,
  remaining,
  limit,
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const { trackEvent } = useCustomerDataPlatform();
  const [topUpOpen, setTopUpOpen] = useState(false);

  useEffect(() => {
    if (open) {
      trackEvent({
        event_type: 'custom',
        metadata: {
          event_name: 'upgrade_modal_viewed',
          product: featureName,
          trigger,
        },
      });
    }
  }, [open, featureName, trigger, trackEvent]);

  const handleUpgrade = () => {
    trackEvent({
      event_type: 'custom',
      metadata: {
        event_name: 'upgrade_clicked',
        product: featureName,
        source: 'modal',
      },
    });
    onOpenChange(false);
    navigate('/pricing');
  };

  const headline =
    trigger === 'limit_reached'
      ? 'You\'ve used your included credits'
      : 'This feature is for Pro users';

  const description =
    trigger === 'limit_reached'
      ? `You used your available allowance for ${featureName.toLowerCase()}. Purchase extra top-up credits or upgrade your plan to continue.`
      : `${featureName} is included with Pro and Enterprise plans. Upgrade now to unlock it instantly.`;

  return (
    <>
      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader className="text-left">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <DialogTitle className="text-xl font-bold">{headline}</DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <DialogDescription className="text-base text-muted-foreground text-pretty pt-2">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-semibold mb-3">Pro plan includes:</p>
              <ul className="grid grid-cols-1 gap-2">
                {PRO_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">$12</span>
              <span className="text-muted-foreground">/month (300 credits)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Button className="w-full h-11 bg-primary text-primary-foreground font-semibold" onClick={handleUpgrade}>
              Upgrade to Pro
            </Button>
            {trigger === 'limit_reached' && (
              <Button
                variant="outline"
                className="w-full h-11 border-primary/30 text-primary hover:bg-primary/5 font-semibold gap-2"
                onClick={() => {
                  onOpenChange(false);
                  setTopUpOpen(true);
                }}
              >
                <Coins className="h-4 w-4" />
                Buy More Credits (Top Up)
              </Button>
            )}
            <Button variant="ghost" className="w-full h-9 text-xs text-muted-foreground" onClick={() => onOpenChange(false)}>
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
