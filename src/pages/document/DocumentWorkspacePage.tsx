import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Save, Share2, Download, History, 
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, 
  List, ListOrdered, Link2, Image as ImageIcon, MessageSquare, ChevronDown,
  Sparkles, FileText, CheckCircle2, ShieldAlert, BarChart2, Search, ArrowRight, MessageCircle, AlertTriangle, X, Bot
} from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentWorkspacePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Q3_Marketing_Strategy_Final');
  const [isSaving, setIsSaving] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<'overview' | 'editor' | 'ai-edit' | 'humanizer' | 'seo' | 'plagiarism' | 'summary' | 'citations' | 'fact-check' | 'converter' | 'history' | 'chat' | 'export'>('overview');
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [targetFormat, setTargetFormat] = useState('pdf');
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!editorRef.current) return;
    setIsConverting(true);
    
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText;
    
    try {
      let blob: Blob;
      let filename = title;
      
      switch(targetFormat) {
        case 'html':
          blob = new Blob([`<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${title}</title>\n</head>\n<body style="font-family: Arial, sans-serif; padding: 40px;">\n${html}\n</body>\n</html>`], { type: 'text/html' });
          filename += '.html';
          break;
        case 'txt':
          blob = new Blob([text], { type: 'text/plain' });
          filename += '.txt';
          break;
        case 'md':
          let md = html
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<a[^>]*href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/<[^>]+>/g, '');
          blob = new Blob([md], { type: 'text/markdown' });
          filename += '.md';
          break;
        case 'docx':
          const wordHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>${title}</title></head>
            <body>${html}</body>
            </html>
          `;
          blob = new Blob([wordHtml], { type: 'application/msword' });
          filename += '.doc'; 
          break;
        case 'csv':
          const tables = editorRef.current.querySelectorAll('table');
          let csvContent = '';
          if (tables.length > 0) {
             tables.forEach(table => {
               const rows = table.querySelectorAll('tr');
               rows.forEach(row => {
                 const cols = row.querySelectorAll('td, th');
                 const rowData = Array.from(cols).map(c => `"${c.textContent?.replace(/"/g, '""')}"`).join(',');
                 csvContent += rowData + '\\n';
               });
               csvContent += '\\n';
             });
          } else {
             csvContent = text.split('\\n').map(line => `"${line.replace(/"/g, '""')}"`).join('\\n');
          }
          blob = new Blob([csvContent], { type: 'text/csv' });
          filename += '.csv';
          break;
        case 'pdf':
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>${title}</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    h1, h2, h3 { color: #111; }
                    img { max-width: 100%; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                  </style>
                </head>
                <body>
                  ${html}
                  <script>
                    window.onload = () => { window.print(); window.close(); }
                  </script>
                </body>
              </html>
            `);
            printWindow.document.close();
            toast.success('Document opened in Print dialog for PDF conversion');
          } else {
             toast.error('Pop-up blocked. Please allow pop-ups to print to PDF.');
          }
          setIsConverting(false);
          return;
        default:
          blob = new Blob([text], { type: 'text/plain' });
          filename += '.txt';
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Document converted and downloaded');
    } catch (error) {
      toast.error('Failed to convert document');
    } finally {
      setIsConverting(false);
    }
  };

  // Autosave simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 800);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatText = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  const handleSimulateAIEdit = (action: string) => {
    toast.success(`Applying ${action} to selected text...`);
  };

  return (
    <MainLayout showFooter={false}>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background overflow-hidden">
        
        {/* Top Toolbar */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate('/document-intelligence')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex flex-col">
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-navy text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/50 rounded px-1 -ml-1 truncate max-w-[200px] md:max-w-xs"
              />
              <div className="flex items-center text-[10px] text-muted-foreground">
                {isSaving ? (
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"/> Saving...</span>
                ) : (
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 text-success" /> Saved to cloud</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8 border-border gap-1.5 hidden sm:flex" onClick={() => toast.success('Share link copied to clipboard')}>
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button variant="outline" size="sm" className="h-8 border-border gap-1.5 hidden sm:flex" onClick={() => setActiveRightPanel('export')}>
              <Download className="w-4 h-4" /> Export
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ml-2">
              JD
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          
          {/* Left Sidebar - Features */}
          <aside className="w-64 hidden lg:flex flex-col border-r border-border bg-card shrink-0 overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Workspace</h3>
              <nav className="flex flex-col gap-1">
                {[
                  { id: 'overview', label: 'Intelligence Dashboard', icon: BarChart2 },
                  { id: 'editor', label: 'Document Editor', icon: FileText }
                ].map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveRightPanel(item.id as any)}
                    className={`flex items-center gap-2 text-left px-3 py-2 text-sm rounded-md transition-colors ${activeRightPanel === item.id ? 'bg-primary text-primary-foreground font-medium shadow-sm' : 'text-foreground/80 hover:bg-muted'}`}
                  >
                    <item.icon className="w-4 h-4" /> {item.label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-b border-border flex-1 overflow-y-auto">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Tools</h3>
              <nav className="flex flex-col gap-1">
                {[
                  { id: 'ai-edit', label: 'AI Detector', icon: Search },
                  { id: 'humanizer', label: 'Humanizer', icon: Sparkles },
                  { id: 'seo', label: 'SEO Optimizer', icon: BarChart2 },
                  { id: 'plagiarism', label: 'Plagiarism Checker', icon: ShieldAlert },
                  { id: 'summary', label: 'Summarizer', icon: FileText },
                  { id: 'citations', label: 'Citation Generator', icon: Link2 },
                  { id: 'fact-check', label: 'Fact Checker', icon: CheckCircle2 },
                  { id: 'converter', label: 'Document Converter', icon: FileText },
                  { id: 'history', label: 'Version History', icon: History },
                  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
                  { id: 'export', label: 'Export Document', icon: Download }
                ].map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveRightPanel(item.id as any)}
                    className={`flex items-center gap-2 text-left px-3 py-2 text-sm rounded-md transition-colors ${activeRightPanel === item.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-muted'}`}
                  >
                    <item.icon className="w-4 h-4" /> {item.label}
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Smart Document Map in Sidebar */}
            {activeRightPanel !== 'overview' && (
              <div className="p-4 border-t border-border flex-1 overflow-y-auto bg-muted/10 hidden md:block">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Document Map</h3>
                <nav className="flex flex-col gap-1 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {[
                    { label: 'Q3 Marketing Strategy', level: 1, active: true },
                    { label: 'Market Analysis', level: 2, active: false },
                    { label: 'Target Audience', level: 2, active: false },
                    { label: 'Campaign Strategy', level: 2, active: false },
                    { label: 'Budget & ROI', level: 2, active: false },
                  ].map((item, i) => (
                    <button 
                      key={i} 
                      className={`text-left py-1 text-xs truncate transition-colors relative flex items-center group
                        ${item.level === 1 ? 'ml-0 font-semibold' : 'ml-4'}
                        ${item.active ? 'text-primary' : 'text-foreground/70 hover:text-foreground'}
                      `}
                    >
                      <div className={`absolute -left-[${item.level === 1 ? '7' : '23'}px] w-2 h-2 rounded-full border-2 
                        ${item.active ? 'bg-primary border-primary' : 'bg-background border-muted-foreground group-hover:border-foreground'}
                      `} />
                      <span className="ml-4">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col bg-muted/30 overflow-hidden min-w-0">
            {activeRightPanel === 'overview' ? (
              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {/* Dashboard View */}
                <div className="max-w-5xl mx-auto space-y-6">
                  
                  {/* Top Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: 'Pages', value: '4' },
                      { label: 'Words', value: '1,250' },
                      { label: 'Reading Time', value: '5 min' },
                      { label: 'Language', value: 'English' },
                      { label: 'File Type', value: 'DOCX' }
                    ].map(metric => (
                      <div key={metric.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <div className="text-xs text-muted-foreground mb-1 font-medium">{metric.label}</div>
                        <div className="text-xl font-bold text-navy">{metric.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* AI Detection Card */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Search className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-navy">AI Detection</h3>
                      </div>
                      <div className="flex items-end gap-3 mb-2">
                        <span className="text-3xl font-bold text-navy">24%</span>
                        <span className="text-sm text-muted-foreground mb-1">AI Content Found</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-1 overflow-hidden flex">
                        <div className="bg-destructive h-full" style={{width: '24%'}} />
                        <div className="bg-success h-full" style={{width: '76%'}} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-4">
                        <span>AI (24%)</span>
                        <span>Human (76%)</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">Detection Confidence: <strong>High</strong></p>
                      <div className="mt-auto">
                        <Button className="w-full h-9 bg-primary text-primary-foreground text-xs" onClick={() => setActiveRightPanel('ai-edit')}>View Details</Button>
                      </div>
                    </div>

                    {/* Humanizer Card */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-navy">Humanizer</h3>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">AI Content Detected</span>
                        </div>
                        <p className="text-xs text-muted-foreground">You can reduce AI detection from 24% to ~2%.</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 mb-4 flex items-center justify-between">
                        <div className="text-center">
                          <div className="text-lg font-bold text-destructive">24%</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Current AI</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <div className="text-center">
                          <div className="text-lg font-bold text-success">2%</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Est. New Score</div>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <Button className="w-full h-9 bg-primary text-primary-foreground text-xs" onClick={() => setActiveRightPanel('humanizer')}>Humanize Now</Button>
                      </div>
                    </div>

                    {/* SEO Card */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <BarChart2 className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-navy">SEO Analysis</h3>
                      </div>
                      <div className="flex items-end gap-3 mb-4">
                        <span className="text-3xl font-bold text-success">85</span>
                        <span className="text-sm text-muted-foreground mb-1">/100 Score</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Missing Keywords</span>
                          <span className="font-medium text-navy">3</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Missing Entities</span>
                          <span className="font-medium text-navy">2</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Readability</span>
                          <span className="font-medium text-success">Good</span>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <Button className="w-full h-9 bg-primary text-primary-foreground text-xs" onClick={() => setActiveRightPanel('seo')}>Optimize SEO</Button>
                      </div>
                    </div>

                    {/* Plagiarism Card */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <ShieldAlert className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-navy">Plagiarism Check</h3>
                      </div>
                      <div className="flex items-end gap-3 mb-2">
                        <span className="text-3xl font-bold text-success">98%</span>
                        <span className="text-sm text-muted-foreground mb-1">Original Content</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-4 overflow-hidden">
                        <div className="bg-success h-full" style={{width: '98%'}} />
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Matched Sources</span>
                          <span className="font-medium text-warning">1</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Plagiarized Text</span>
                          <span className="font-medium text-warning">2%</span>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <Button className="w-full h-9 bg-primary text-primary-foreground text-xs" onClick={() => setActiveRightPanel('plagiarism')}>View Report</Button>
                      </div>
                    </div>

                    {/* Citation Card */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Link2 className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-navy">Citations</h3>
                      </div>
                      <div className="flex items-end gap-3 mb-4">
                        <span className="text-xl font-bold text-warning">Fair</span>
                        <span className="text-sm text-muted-foreground mb-1">Quality</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Total Citations</span>
                          <span className="font-medium text-navy">4</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Missing Sources</span>
                          <span className="font-medium text-destructive">2</span>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <Button className="w-full h-9 bg-primary text-primary-foreground text-xs" onClick={() => setActiveRightPanel('citations')}>Generate Citations</Button>
                      </div>
                    </div>

                    {/* Fact Check Card */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-navy">Fact Check</h3>
                      </div>
                      <div className="flex items-end gap-3 mb-4">
                        <span className="text-xl font-bold text-warning">Medium</span>
                        <span className="text-sm text-muted-foreground mb-1">Confidence</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Verified Claims</span>
                          <span className="font-medium text-success">8</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Unverified Claims</span>
                          <span className="font-medium text-warning">3</span>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <Button className="w-full h-9 bg-primary text-primary-foreground text-xs" onClick={() => setActiveRightPanel('fact-check')}>Verify Content</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex overflow-hidden">
                {/* Inner Editor Area */}
                <div className="flex-1 flex flex-col bg-muted/30 border-r border-border min-w-0">
                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap items-center justify-center gap-1 p-2 bg-card border-b border-border shrink-0 shadow-sm z-10">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('bold')}><Bold className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('italic')}><Italic className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('underline')}><Underline className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('strikethrough')}><Strikethrough className="w-4 h-4" /></Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('justifyLeft')}><AlignLeft className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('justifyCenter')}><AlignCenter className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('justifyRight')}><AlignRight className="w-4 h-4" /></Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('insertUnorderedList')}><List className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => formatText('insertOrderedList')}><ListOrdered className="w-4 h-4" /></Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info('Insert link')}><Link2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info('Insert image')}><ImageIcon className="w-4 h-4" /></Button>
                  </div>

                  {/* Editor Container */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
                    <div 
                      ref={editorRef}
                      contentEditable 
                      className="w-full max-w-[800px] bg-card border border-border shadow-sm rounded-lg p-10 md:p-16 min-h-full outline-none prose prose-navy max-w-none text-foreground text-pretty"
                      suppressContentEditableWarning
                    >
                      <h1 className="text-3xl font-bold mb-6">Q3 Marketing Strategy</h1>
                      <p className="mb-4">
                        Welcome to the comprehensive marketing strategy for Q3. Our primary objective is to increase brand awareness and drive user acquisition through targeted campaigns.
                      </p>
                      <h2 className="text-xl font-bold mt-8 mb-4">Market Analysis</h2>
                      <p className="mb-4">
                        <span className={`transition-colors ${activeRightPanel === 'ai-edit' ? 'bg-red-500/20' : ''}`}>
                          The current market landscape is highly competitive, with numerous emerging players attempting to capture market share. To maintain our position as an industry leader, we must continuously innovate and adapt to shifting consumer preferences.
                        </span>
                      </p>
                      <p className="mb-4">
                        <span className="underline decoration-wavy decoration-red-500 cursor-help" title="Grammar: 'are' should be 'is'">The data are clear</span> on this matter. Customer retention <span className="bg-orange-500/20" title="Long sentence (28 words)">should be our main focus rather than just acquiring new users who might not stick around for the long term because of the high churn rate we saw last quarter.</span>
                      </p>
                      <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Increase Social Media Engagement</li>
                        <li>Launch New Affiliate Program</li>
                        <li>Optimize Email Funnels</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Right Intelligence Panel */}
                {activeRightPanel !== 'editor' && (
                  <aside className="w-80 bg-card flex flex-col shrink-0 overflow-hidden shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-20">
                    <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
                      <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                        {activeRightPanel === 'ai-edit' && <><Search className="w-4 h-4 text-primary" /> AI Detection</>}
                        {activeRightPanel === 'humanizer' && <><Sparkles className="w-4 h-4 text-primary" /> Humanizer</>}
                        {activeRightPanel === 'seo' && <><BarChart2 className="w-4 h-4 text-primary" /> SEO Intelligence</>}
                        {activeRightPanel === 'plagiarism' && <><ShieldAlert className="w-4 h-4 text-primary" /> Plagiarism Checker</>}
                        {activeRightPanel === 'summary' && <><FileText className="w-4 h-4 text-primary" /> Summarizer</>}
                        {activeRightPanel === 'citations' && <><Link2 className="w-4 h-4 text-primary" /> Citation Generator</>}
                        {activeRightPanel === 'fact-check' && <><CheckCircle2 className="w-4 h-4 text-primary" /> Fact Checker</>}
                        {activeRightPanel === 'converter' && <><FileText className="w-4 h-4 text-primary" /> Conversion Center</>}
                        {activeRightPanel === 'history' && <><History className="w-4 h-4 text-primary" /> Version History</>}
                        {activeRightPanel === 'chat' && <><MessageSquare className="w-4 h-4 text-primary" /> AI Chat</>}
                        {activeRightPanel === 'export' && <><Download className="w-4 h-4 text-primary" /> Export Document</>}
                      </h3>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveRightPanel('editor')}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
                      
                      {activeRightPanel === 'ai-edit' && (
                        <>
                          <div className="text-center p-4 bg-muted/50 rounded-xl border border-border">
                            <div className="text-4xl font-bold text-destructive mb-1">24%</div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Content</div>
                            <p className="text-xs text-muted-foreground">High confidence of AI generation</p>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Heatmap Legend</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500/30 border border-red-500"/> Likely AI</div>
                                <span className="text-muted-foreground">1 Section</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500"/> Uncertain</div>
                                <span className="text-muted-foreground">0 Sections</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500/30 border border-green-500"/> Human Written</div>
                                <span className="text-muted-foreground">Remaining</span>
                              </div>
                            </div>
                          </div>

                          <Button className="w-full bg-primary text-primary-foreground h-9" onClick={() => setActiveRightPanel('humanizer')}>
                            Humanize AI Content
                          </Button>
                        </>
                      )}

                      {activeRightPanel === 'humanizer' && (
                        <>
                          <div className="bg-muted rounded-lg p-3 flex items-center justify-between border border-border">
                            <div className="text-center">
                              <div className="text-lg font-bold text-destructive">24%</div>
                              <div className="text-[10px] text-muted-foreground uppercase">Current AI</div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <div className="text-center">
                              <div className="text-lg font-bold text-success">2%</div>
                              <div className="text-[10px] text-muted-foreground uppercase">Est. New Score</div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Select Tone</h4>
                            <select className="w-full text-sm border border-border rounded-md p-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                              <option>Professional</option>
                              <option>Casual</option>
                              <option>Academic</option>
                              <option>Marketing</option>
                            </select>
                          </div>

                          <div className="border border-border rounded-lg overflow-hidden flex flex-col">
                            <div className="bg-muted/50 p-2 border-b border-border text-xs font-semibold text-navy">
                              Comparison (1/1)
                            </div>
                            <div className="p-3 bg-red-500/5 text-sm text-foreground/90 border-b border-border relative">
                              <div className="absolute top-1 right-2 text-[10px] font-bold text-destructive uppercase">Original</div>
                              The current market landscape is highly competitive, with numerous emerging players attempting to capture market share.
                            </div>
                            <div className="p-3 bg-green-500/5 text-sm text-foreground/90">
                              <div className="absolute top-1 right-2 text-[10px] font-bold text-success uppercase">Humanized</div>
                              Right now, the market is incredibly tough, as many new companies are trying to get a piece of the pie.
                            </div>
                            <div className="p-2 bg-muted/30 border-t border-border flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1 h-7 text-xs border-success/30 text-success hover:bg-success/10 bg-success/5" onClick={() => toast.success('Changes accepted')}>Accept</Button>
                              <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => toast.success('Changes rejected')}>Reject</Button>
                            </div>
                          </div>
                          
                          <Button className="w-full bg-primary text-primary-foreground h-9 mt-auto" onClick={() => toast.success('All changes accepted')}>
                            Accept All Changes
                          </Button>
                        </>
                      )}

                      {activeRightPanel === 'seo' && (
                        <>
                          <div className="text-center p-4 bg-muted/50 rounded-xl border border-border">
                            <div className="text-4xl font-bold text-success mb-1">85</div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">SEO Score</div>
                            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                              <div className="bg-success h-full" style={{width: '85%'}} />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">Missing Keywords</h4>
                              <div className="flex flex-wrap gap-1.5">
                                <span className="bg-muted border border-border px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer hover:border-primary">
                                  B2B marketing <span className="text-primary font-bold">+</span>
                                </span>
                                <span className="bg-muted border border-border px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer hover:border-primary">
                                  lead generation <span className="text-primary font-bold">+</span>
                                </span>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">Readability</h4>
                              <div className="p-3 bg-muted/30 border border-border rounded-lg text-sm">
                                <div className="flex justify-between mb-1">
                                  <span>Flesch-Kincaid</span>
                                  <span className="font-bold text-navy">Grade 10</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tone</span>
                                  <span className="font-bold text-navy">Professional</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button className="w-full bg-primary text-primary-foreground h-9 mt-auto" onClick={() => toast.success('Auto-optimization complete')}>
                            Auto-Optimize Document
                          </Button>
                        </>
                      )}

                      {activeRightPanel === 'plagiarism' && (
                        <>
                          <div className="text-center p-4 bg-muted/50 rounded-xl border border-border">
                            <div className="text-4xl font-bold text-success mb-1">98%</div>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Originality Score</div>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-3">Matched Sources (1)</h4>
                            <div className="p-3 border border-warning/30 bg-warning/5 rounded-lg text-sm">
                              <div className="flex justify-between mb-2">
                                <span className="font-medium text-navy truncate">marketing-trends.com</span>
                                <span className="font-bold text-warning">2%</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">"The current market landscape is highly competitive, with numerous emerging players..."</p>
                              <Button variant="outline" size="sm" className="w-full h-7 text-xs border-border" onClick={() => toast.success('Match rewritten successfully')}>Rewrite Match</Button>
                            </div>
                          </div>
                        </>
                      )}

                      {activeRightPanel === 'chat' && (
                        <div className="flex flex-col h-full">
                          <div className="flex-1 bg-muted/30 rounded-lg border border-border p-3 overflow-y-auto mb-3 flex flex-col gap-3">
                            <div className="bg-card border border-border p-2.5 rounded-lg rounded-tl-none text-sm text-foreground/90 self-start max-w-[85%] shadow-sm">
                              Hello! I'm your AI Document Assistant. I've analyzed "Q3 Marketing Strategy". How can I help you?
                            </div>
                            <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-lg rounded-tr-none text-sm text-navy self-end max-w-[85%] shadow-sm">
                              What are the main goals?
                            </div>
                            <div className="bg-card border border-border p-2.5 rounded-lg rounded-tl-none text-sm text-foreground/90 self-start max-w-[85%] shadow-sm">
                              Based on the document, the primary objectives are to <strong>increase brand awareness</strong> and <strong>drive user acquisition</strong> through targeted campaigns. It also emphasizes focusing on <strong>customer retention</strong> due to a high churn rate last quarter.
                            </div>
                          </div>
                          
                          <div className="flex gap-2 shrink-0">
                            <input type="text" placeholder="Ask about this document..." className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm" />
                            <Button size="icon" className="h-[34px] w-[34px] shrink-0 bg-primary text-primary-foreground" onClick={() => toast.success('Message sent')}><ArrowRight className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      )}

                      {activeRightPanel === 'history' && (
                        <div className="flex flex-col h-full">
                          <Button variant="outline" className="w-full h-9 mb-4" onClick={() => toast.success('Snapshot created')}>
                            Create Snapshot
                          </Button>
                          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                            {[
                              { time: 'Just now', author: 'JD', text: 'Auto-saved' },
                              { time: '2 hours ago', author: 'JD', text: 'Humanized marketing section' },
                              { time: 'Yesterday', author: 'AI', text: 'Initial import & extraction' }
                            ].map((v, i) => (
                              <div key={i} className="p-3 border border-border rounded-lg bg-card text-sm">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-semibold text-navy">{v.time}</span>
                                  <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase">{v.author}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">{v.text}</p>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => toast.success('Version restored')}>Restore</Button>
                                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => toast.success('Comparing versions')}>Compare</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeRightPanel === 'converter' && (
                        <div className="flex flex-col h-full">
                          <div className="p-4 bg-muted/50 rounded-xl border border-border text-center mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div className="font-bold text-navy">DOCX</div>
                            <div className="text-xs text-muted-foreground uppercase">Current Format</div>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            <div>
                              <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">Target Format</h4>
                              <select 
                                value={targetFormat}
                                onChange={(e) => setTargetFormat(e.target.value)}
                                className="w-full text-sm border border-border rounded-md p-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >
                                <option value="pdf">PDF Document (.pdf)</option>
                                <option value="docx">Word Document (.docx)</option>
                                <option value="md">Markdown (.md)</option>
                                <option value="html">HTML Document (.html)</option>
                                <option value="txt">Plain Text (.txt)</option>
                                <option value="csv">CSV Spreadsheet (.csv)</option>
                              </select>
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary/50" />
                              Preserve Formatting
                            </label>
                          </div>
                          
                          <Button 
                            className="w-full bg-primary text-primary-foreground h-9 mt-auto" 
                            onClick={handleConvert}
                            disabled={isConverting}
                          >
                            {isConverting ? 'Converting...' : 'Convert & Download'}
                          </Button>
                        </div>
                      )}

                      {activeRightPanel === 'export' && (
                        <div className="flex flex-col h-full">
                          <div className="p-4 bg-muted/50 rounded-xl border border-border text-center mb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Download className="w-6 h-6 text-primary" />
                            </div>
                            <div className="font-bold text-navy">Export Options</div>
                            <div className="text-xs text-muted-foreground mt-1">Download your document</div>
                          </div>
                          
                          <div className="space-y-4 mb-6 flex-1">
                            <div>
                              <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">Export Format</h4>
                              <select 
                                value={targetFormat}
                                onChange={(e) => setTargetFormat(e.target.value)}
                                className="w-full text-sm border border-border rounded-md p-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              >
                                <option value="pdf">PDF Document (.pdf)</option>
                                <option value="docx">Word Document (.docx)</option>
                                <option value="md">Markdown (.md)</option>
                                <option value="html">HTML Document (.html)</option>
                                <option value="txt">Plain Text (.txt)</option>
                                <option value="csv">CSV Spreadsheet (.csv)</option>
                              </select>
                            </div>
                            <label className="flex items-start gap-2 text-sm">
                              <input type="checkbox" defaultChecked className="rounded border-border text-primary mt-1 focus:ring-primary/50" />
                              <div>
                                <div className="font-medium text-navy">Preserve Formatting</div>
                                <div className="text-xs text-muted-foreground">Keep original styling and layout</div>
                              </div>
                            </label>
                            <label className="flex items-start gap-2 text-sm">
                              <input type="checkbox" defaultChecked className="rounded border-border text-primary mt-1 focus:ring-primary/50" />
                              <div>
                                <div className="font-medium text-navy">Include Analysis Report</div>
                                <div className="text-xs text-muted-foreground">Append AI metrics & SEO score at the end</div>
                              </div>
                            </label>
                          </div>
                          
                          <Button 
                            className="w-full bg-primary text-primary-foreground h-9" 
                            onClick={handleConvert}
                            disabled={isConverting}
                          >
                            {isConverting ? 'Exporting...' : 'Download Document'}
                          </Button>
                        </div>
                      )}

                      {/* Fallback for other panels */}
                      {['citations', 'fact-check'].includes(activeRightPanel) && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Bot className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="font-bold text-navy mb-2 capitalize">{activeRightPanel.replace('-', ' ')} Tool</h3>
                          <p className="text-sm text-muted-foreground mb-6">Select text in the editor to use this feature or process the entire document.</p>
                          <Button className="w-full bg-primary text-primary-foreground h-9" onClick={() => toast.success('Processing complete')}>
                            Process Entire Document
                          </Button>
                        </div>
                      )}
                    </div>
                  </aside>
                )}
                
                {/* Floating AI Chat for when right panel isn't chat */}
                {activeRightPanel !== 'chat' && (
                  <div className="fixed bottom-6 right-6 z-50">
                    <Button 
                      className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground p-0 flex items-center justify-center transition-transform hover:scale-105"
                      onClick={() => setActiveRightPanel('chat')}
                    >
                      <Bot className="w-6 h-6" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </MainLayout>
  );
}