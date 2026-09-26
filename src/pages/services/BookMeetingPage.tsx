import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BookMeetingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    meeting_date: '',
    meeting_time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    meeting_type: 'consultation',
    meeting_method: 'video',
    client_name: '',
    client_email: user?.email || '',
    client_phone: '',
    company_name: '',
    notes: ''
  });

  const updateForm = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.meeting_date || !formData.meeting_time || !formData.client_name || !formData.client_email) {
       return toast.error('Please fill all required fields');
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from('meetings').insert({
        user_id: user?.id,
        ...formData
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Meeting scheduled successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh]">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-navy mb-4">Meeting Scheduled!</h1>
          <p className="text-muted-foreground text-lg text-center max-w-md mb-8">
            Your meeting has been successfully booked for {new Date(formData.meeting_date).toLocaleDateString()} at {formData.meeting_time}.
            You will receive a calendar invitation shortly.
          </p>
          <Button onClick={() => navigate('/services/website-development')}>Return to Services</Button>
        </div>
      </MainLayout>
    );
  }

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  return (
    <MainLayout>
      <Helmet>
        <title>Book a Consultation | AIDetector.cx</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="max-w-4xl mx-auto py-12 px-4 md:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">Book a Consultation</h1>
          <p className="text-muted-foreground">Schedule a free 30-minute discovery call with our development experts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
             <Card className="border-border shadow-sm">
                <CardHeader>
                   <CardTitle className="text-lg">What to expect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                   <div className="flex gap-3">
                      <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>30-minute strategy session tailored to your goals.</div>
                   </div>
                   <div className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>Discussion of your project requirements and timeline.</div>
                   </div>
                   <div className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>Answers to technical and pricing questions.</div>
                   </div>
                </CardContent>
             </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="border-border shadow-md">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date *</Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="date" value={formData.meeting_date} onChange={e => updateForm('meeting_date', e.target.value)} required min={new Date().toISOString().split('T')[0]} className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Time *</Label>
                      <Select value={formData.meeting_time} onValueChange={v => updateForm('meeting_time', v)} required>
                        <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                        <SelectContent>
                           {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <Label>Meeting Type</Label>
                      <Select value={formData.meeting_type} onValueChange={v => updateForm('meeting_type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="discovery">Discovery Call</SelectItem>
                           <SelectItem value="consultation">Website Consultation</SelectItem>
                           <SelectItem value="seo">SEO Consultation</SelectItem>
                           <SelectItem value="strategy">Strategy Session</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select value={formData.meeting_method} onValueChange={v => updateForm('meeting_method', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="video">Google Meet / Video</SelectItem>
                           <SelectItem value="phone">Phone Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <Label>Your Name *</Label>
                      <Input value={formData.client_name} onChange={e => updateForm('client_name', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address *</Label>
                      <Input type="email" value={formData.client_email} onChange={e => updateForm('client_email', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input type="tel" value={formData.client_phone} onChange={e => updateForm('client_phone', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input value={formData.company_name} onChange={e => updateForm('company_name', e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label>What would you like to discuss?</Label>
                    <Textarea rows={4} value={formData.notes} onChange={e => updateForm('notes', e.target.value)} placeholder="Briefly describe your project or questions..." />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Confirm Booking
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
