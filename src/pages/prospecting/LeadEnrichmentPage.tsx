import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function LeadEnrichmentPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2">Lead Enrichment</h1>
        <p className="text-muted-foreground">Enrichment must be based on an actual provider response, with source and retrieval details attached to every field.</p>
      </div>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-muted-foreground" /> Enrichment provider not configured</CardTitle>
          <CardDescription>Bulk enrichment is temporarily unavailable because no verified enrichment provider is connected.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>The previous screen displayed fixed Apple, Tesla and Stripe sample records after a timed delay. Those records were not derived from the uploaded file or a live enrichment service. That simulation has been removed.</p>
          <p>No uploaded file is sent anywhere, and no CRM records are created from this screen.</p>
          <p>Bulk enrichment will be enabled after a provider is selected, credentials are configured securely, and the import flow can verify each returned field and source.</p>
          <Button variant="outline" onClick={() => navigate('/prospecting/premium-finders')}>Find real businesses instead</Button>
        </CardContent>
      </Card>
    </div>
  );
}
