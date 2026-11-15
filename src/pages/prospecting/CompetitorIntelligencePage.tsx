import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function CompetitorIntelligencePage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2">Competitor Intelligence</h1>
        <p className="text-muted-foreground">Competitive research should be traceable to real pages and current evidence.</p>
      </div>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-muted-foreground" /> Research provider not configured</CardTitle>
          <CardDescription>The previous screen generated fixed audience, pricing, social and technology-stack claims from the entered domain. Those claims were not researched and have been removed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Competitor analysis will be enabled when the platform has a verified website-crawling and data-source workflow. Each finding will include its source URL, retrieval time and evidence, and estimates will be clearly distinguished from published facts.</p>
          <p>No competitor report is being generated or saved by this screen.</p>
        </CardContent>
      </Card>
    </div>
  );
}
