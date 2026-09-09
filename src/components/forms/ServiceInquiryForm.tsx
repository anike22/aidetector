import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ServiceInquiryFormProps {
  serviceName: string;
}

export default function ServiceInquiryForm({ serviceName }: ServiceInquiryFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    website: '',
    budget: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('service_inquiries').insert([{
        name: formData.name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        website: formData.website,
        budget: formData.budget,
        message: `Service Interest: ${serviceName}\n\n${formData.message}`,
        status: 'New'
      }]);

      if (error) throw error;

      toast.success('Inquiry submitted successfully! Our team will contact you shortly.');
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        website: '',
        budget: '',
        message: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
      <h3 className="text-2xl font-bold mb-2 text-foreground">Request a Consultation</h3>
      <p className="text-muted-foreground mb-6">Fill out the form below and our {serviceName} experts will get back to you within 24 hours.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email *</Label>
            <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="john@company.com" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" name="company" value={formData.company} onChange={handleChange} placeholder="Acme Inc." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input id="website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://example.com" />
          </div>
          <div className="space-y-2">
            <Label>Monthly Budget</Label>
            <Select onValueChange={(val) => handleSelectChange('budget', val)} value={formData.budget}>
              <SelectTrigger>
                <SelectValue placeholder="Select budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="< $1k">Less than $1,000</SelectItem>
                <SelectItem value="$1k - $5k">$1,000 - $5,000</SelectItem>
                <SelectItem value="$5k - $10k">$5,000 - $10,000</SelectItem>
                <SelectItem value="$10k+">$10,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Project Details</Label>
          <Textarea 
            id="message" 
            name="message" 
            rows={4} 
            value={formData.message} 
            onChange={handleChange} 
            placeholder="Tell us about your goals, current challenges, and timeline..." 
          />
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold mt-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Request Free Consultation'
          )}
        </Button>
      </form>
    </div>
  );
}
