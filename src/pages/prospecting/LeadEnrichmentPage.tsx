import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, FileUp, Loader2, ArrowLeft, Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function LeadEnrichmentPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enrichedData, setEnrichedData] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return toast.error('Please select a file to upload');
    
    setEnriching(true);
    setProgress(0);
    
    // Simulate enrichment progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 95) {
          clearInterval(interval);
          return p;
        }
        return p + 5;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setEnrichedData([
        { id: 1, original_name: 'Apple', industry: 'Consumer Electronics', size: '100,000+', revenue: '$300B+', score: 98 },
        { id: 2, original_name: 'Tesla', industry: 'Automotive', size: '100,000+', revenue: '$80B+', score: 95 },
        { id: 3, original_name: 'Stripe', industry: 'Financial Services', size: '5,000+', revenue: '$1B+', score: 88 }
      ]);
      setEnriching(false);
      toast.success('Leads enriched successfully!');
    }, 4000);
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2">Lead Enrichment</h1>
        <p className="text-muted-foreground">Upload a list of company names or websites to instantly uncover deep firmographic data and decision makers.</p>
      </div>

      {!enrichedData.length && !enriching && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Import Leads</CardTitle>
            <CardDescription>Upload a CSV or Excel file containing company names or domain names.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
              <FileUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="mb-4">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileChange}
                />
                <Label htmlFor="file-upload" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md inline-flex items-center">
                  <Upload className="mr-2 h-4 w-4" /> Browse Files
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {file ? file.name : "or drag and drop here (CSV, XLSX max 10MB)"}
              </p>
            </div>
          </CardContent>
          <div className="p-6 pt-0 flex justify-end">
            <Button onClick={handleImport} disabled={!file} className="w-full sm:w-auto">Start Enrichment</Button>
          </div>
        </Card>
      )}

      {enriching && (
        <div className="bg-card border border-border rounded-lg p-8 text-center max-w-2xl mx-auto shadow-sm">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI is enriching your leads...</h3>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">{progress}% Complete (Analyzing company footprints, extracting tech stack, finding decision makers)</p>
        </div>
      )}

      {enrichedData.length > 0 && !enriching && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Enrichment Results</CardTitle>
              <CardDescription>Successfully enriched {enrichedData.length} records.</CardDescription>
            </div>
            <Button onClick={() => toast.success('Added to CRM')} type="button"><Plus className="mr-2 h-4 w-4" /> Add All to CRM</Button>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="[&>div]:max-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Original Name</TableHead>
                    <TableHead className="whitespace-nowrap">Industry</TableHead>
                    <TableHead className="whitespace-nowrap">Company Size</TableHead>
                    <TableHead className="whitespace-nowrap">Est. Revenue</TableHead>
                    <TableHead className="whitespace-nowrap">Lead Score</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedData.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium whitespace-nowrap">{d.original_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{d.industry}</TableCell>
                      <TableCell className="whitespace-nowrap">{d.size}</TableCell>
                      <TableCell className="whitespace-nowrap">{d.revenue}</TableCell>
                      <TableCell className="whitespace-nowrap"><Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{d.score}</Badge></TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => toast.success('Added to CRM')} type="button">Add to CRM</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Ensure Label is defined or imported, I'll define a quick Label component for the file upload
function Label({ children, htmlFor, className }: { children: React.ReactNode, htmlFor: string, className?: string }) {
  return <label htmlFor={htmlFor} className={className}>{children}</label>;
}