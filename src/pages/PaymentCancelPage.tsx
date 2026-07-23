import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <MainLayout>
      <div className="flex-1 flex items-center justify-center p-4 py-16">
        <Card className="max-w-md w-full mx-auto text-center border-border shadow-card">
          <CardContent className="pt-10 pb-10 px-8 flex flex-col items-center">
            <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
            <h1 className="text-2xl font-bold text-navy mb-2">Payment Cancelled</h1>
            <p className="text-muted-foreground mb-8 text-pretty">
              Your checkout session was cancelled. No charges have been made.
              You can safely return and try again when you're ready.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link to="/pricing" className="w-full">
                <Button className="w-full h-11 bg-primary text-primary-foreground gap-2" onClick={() => {}}>
                  <ArrowLeft className="w-4 h-4" /> Return to Pricing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
