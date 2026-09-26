import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Loader2, ArrowRight, Trash2, File, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentIntelligencePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const navigate = useNavigate();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const simulateUpload = () => {
    setIsUploading(true);
    setProgress(0);
    setStatusText('Uploading...');

    const stages = [
      { p: 15, text: 'Extracting text...' },
      { p: 35, text: 'Preserving formatting...' },
      { p: 50, text: 'Processing media...' },
      { p: 65, text: 'Analyzing structure...' },
      { p: 85, text: 'Running AI analysis...' },
      { p: 100, text: 'Ready' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setProgress(stages[currentStage].p);
        setStatusText(stages[currentStage].text);
        currentStage++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          navigate('/document-workspace');
        }, 500);
      }
    }, 800);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateUpload();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload();
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-10 text-balance">
          <h1 className="text-3xl md:text-5xl font-bold text-navy tracking-tight mb-4">
            AI Document Intelligence & Smart Editor
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto text-pretty">
            Upload any document, convert formats, edit with AI-powered tools, detect AI content, humanize text, check plagiarism, improve SEO, and export to multiple formats.
          </p>
        </div>

        <Card className="border-border shadow-card mb-12 overflow-hidden">
          <CardContent className="p-0">
            {isUploading ? (
              <div className="flex flex-col items-center justify-center p-16 min-h-[300px]">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
                <h3 className="text-xl font-bold text-navy mb-2">{statusText}</h3>
                <div className="w-full max-w-md bg-muted rounded-full h-2 overflow-hidden mb-2">
                  <div 
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{progress}% Complete</p>
              </div>
            ) : (
              <div 
                className={`flex flex-col items-center justify-center p-12 md:p-20 border-2 border-dashed transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <UploadCloud className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-navy mb-2">Drag and drop your document here</h2>
                <p className="text-muted-foreground mb-6 text-center text-sm">
                  Supported formats: PDF, DOCX, DOC, TXT, RTF, ODT, PPTX, XLSX, CSV, Markdown<br/>
                  Maximum file size: 50MB
                </p>
                <input 
                  type="file" 
                  id="doc-upload" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.pptx,.xlsx,.csv,.md"
                />
                <Button onClick={() => document.getElementById('doc-upload')?.click()} className="bg-primary text-primary-foreground h-11 px-8">
                  Click to Upload
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-navy">Recent Documents</h2>
          <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 gap-1 text-sm h-8" onClick={() => navigate('/dashboard?tab=documents')}>
            View All Documents <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 1, name: 'Q3_Marketing_Strategy_Final.docx', date: '2 hours ago', type: 'Word Document', size: '2.4 MB' },
            { id: 2, name: 'Product_Requirements_v2.pdf', date: 'Yesterday', type: 'PDF Document', size: '1.1 MB' },
          ].map((doc) => (
            <Card key={doc.id} className="border-border shadow-sm hover:border-primary/50 transition-colors group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy text-sm truncate">{doc.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {doc.date}</span>
                    <span className="flex items-center gap-1"><File className="w-3 h-3" /> {doc.size}</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => toast.success('Document deleted')}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" className="h-8 bg-primary text-primary-foreground" onClick={() => navigate('/document-workspace')}>
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}