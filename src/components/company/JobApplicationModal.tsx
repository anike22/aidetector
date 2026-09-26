import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2, Upload, FileText } from 'lucide-react';

interface JobApplicationModalProps {
  job: { title: string; id: number } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobApplicationModal({ job, isOpen, onClose }: JobApplicationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!job) return;

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const linkedinUrl = formData.get('linkedin_url') as string;
    const portfolioUrl = formData.get('portfolio_url') as string;
    const location = formData.get('location') as string;
    const experienceYears = formData.get('experience_years') as string;
    const coverLetter = formData.get('cover_letter') as string;

    if (!resumeFile) {
      toast.error('Please upload your resume.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Resume
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `applications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile);

      if (uploadError) throw uploadError;

      // Get resume public URL (actually it's private, but we save the path or signed url. Admin can view it)
      const resumeUrl = filePath; 

      // 2. Insert Application
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert({
          full_name: fullName,
          email: email,
          phone: phone,
          position: job.title,
          experience_years: experienceYears,
          location: location,
          linkedin_url: linkedinUrl,
          portfolio_url: portfolioUrl,
          cover_letter: coverLetter,
          resume_url: resumeUrl
        });

      if (insertError) throw insertError;

      toast.success('Your application has been submitted successfully!');
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document (.doc, .docx).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.');
      return;
    }

    setResumeFile(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job?.title}</DialogTitle>
          <DialogDescription>
            Submit your qualifications below and we'll get back to you soon.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" name="full_name" required placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" name="email" type="email" required placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" name="location" required placeholder="City, Country" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience *</Label>
              <Input id="experience_years" name="experience_years" required placeholder="e.g. 5" type="number" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
              <Input id="linkedin_url" name="linkedin_url" type="url" placeholder="https://linkedin.com/in/..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio_url">Portfolio / GitHub URL</Label>
            <Input id="portfolio_url" name="portfolio_url" type="url" placeholder="https://github.com/..." />
          </div>

          <div className="space-y-2">
            <Label>Resume / CV *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => document.getElementById('resume_upload')?.click()}>
              {resumeFile ? (
                <>
                  <FileText className="w-8 h-8 text-primary mb-2" />
                  <p className="text-sm font-medium text-navy">{resumeFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-navy">Click to upload your resume</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, or DOCX (Max 5MB)</p>
                </>
              )}
              <input
                id="resume_upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover_letter">Cover Letter / Message</Label>
            <Textarea 
              id="cover_letter" 
              name="cover_letter" 
              placeholder="Tell us why you're a great fit for this role..." 
              className="min-h-[120px]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !resumeFile} className="bg-primary text-primary-foreground min-w-[120px]">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}