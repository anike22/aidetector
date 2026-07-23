import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function WebsiteDevRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    website_url: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    project_type: '',
    preferred_platform: '',
    num_pages: '',
    key_features: [] as string[],
    design_preferences: '',
    primary_goal: '',
    target_audience: '',
    competitors: '',
    success_metrics: '',
    budget_range: '',
    launch_date: '',
    timeline_flexibility: '',
    notes: ''
  });

  const updateForm = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const nextStep = () => {
    if (step === 1 && (!formData.business_name || !formData.contact_name || !formData.contact_email)) {
      return toast.error('Please fill all required fields');
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('website_development_requests').insert({
        user_id: user?.id,
        ...formData
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Request submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[60vh]">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <Send className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-navy mb-4">Request Received!</h1>
          <p className="text-muted-foreground text-lg text-center max-w-md mb-8">
            Thank you for your interest. Our team will review your requirements and get back to you within 24 hours.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/services/website-development')}>Return to Services</Button>
            <Button variant="outline" onClick={() => navigate('/services/website-development/book-meeting')}>Book a Meeting Now</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Helmet>
        <title>Request Website Development | AIDetector.cx</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="max-w-3xl mx-auto py-12 px-4 md:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">Request Website Development</h1>
          <p className="text-muted-foreground">Tell us about your project and we'll craft a custom solution.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= i ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                {i}
              </div>
              {i < 5 && <div className={`h-1 w-8 sm:w-16 mx-2 ${step > i ? 'bg-blue-600' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <Card className="border-border shadow-md">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">1. Business Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Business Name *</Label>
                      <Input value={formData.business_name} onChange={e => updateForm('business_name', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Select value={formData.industry} onValueChange={v => updateForm('industry', v)}>
                        <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="saas">SaaS / Technology</SelectItem>
                          <SelectItem value="agency">Agency / B2B Services</SelectItem>
                          <SelectItem value="local">Local Business</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Existing Website URL (if any)</Label>
                    <Input type="url" placeholder="https://" value={formData.website_url} onChange={e => updateForm('website_url', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Contact Name *</Label>
                      <Input value={formData.contact_name} onChange={e => updateForm('contact_name', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address *</Label>
                      <Input type="email" value={formData.contact_email} onChange={e => updateForm('contact_email', e.target.value)} required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Phone Number</Label>
                      <Input type="tel" value={formData.contact_phone} onChange={e => updateForm('contact_phone', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">2. Project Information</h2>
                  <div className="space-y-2">
                    <Label>Project Type</Label>
                    <Select value={formData.project_type} onValueChange={v => updateForm('project_type', v)}>
                      <SelectTrigger><SelectValue placeholder="Select project type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New Website</SelectItem>
                        <SelectItem value="redesign">Website Redesign</SelectItem>
                        <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                        <SelectItem value="landing">Landing Page</SelectItem>
                        <SelectItem value="webapp">Custom Web Application</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preferred Platform</Label>
                      <Select value={formData.preferred_platform} onValueChange={v => updateForm('preferred_platform', v)}>
                        <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wordpress">WordPress</SelectItem>
                          <SelectItem value="react_next">React / Next.js</SelectItem>
                          <SelectItem value="shopify">Shopify</SelectItem>
                          <SelectItem value="custom">Custom HTML/CSS/JS</SelectItem>
                          <SelectItem value="not_sure">Not Sure (Recommend one)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Pages</Label>
                      <Input type="number" placeholder="e.g. 5" value={formData.num_pages} onChange={e => updateForm('num_pages', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-3 pt-4">
                    <Label>Key Features Needed</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Blog', 'E-commerce', 'User Login', 'API Integration', 'Multilingual', 'Booking System'].map(feat => (
                        <div key={feat} className="flex items-center space-x-2">
                          <Checkbox 
                            id={feat} 
                            checked={formData.key_features.includes(feat)}
                            onCheckedChange={(checked) => {
                              if (checked) updateForm('key_features', [...formData.key_features, feat]);
                              else updateForm('key_features', formData.key_features.filter(f => f !== feat));
                            }}
                          />
                          <label htmlFor={feat} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{feat}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Label>Design Preferences / Inspiration</Label>
                    <Textarea placeholder="Share links to websites you like..." value={formData.design_preferences} onChange={e => updateForm('design_preferences', e.target.value)} />
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">3. Business Goals</h2>
                  <div className="space-y-2">
                    <Label>Primary Goal</Label>
                    <Select value={formData.primary_goal} onValueChange={v => updateForm('primary_goal', v)}>
                      <SelectTrigger><SelectValue placeholder="Select primary goal" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leads">Generate Leads</SelectItem>
                        <SelectItem value="sales">Increase Sales</SelectItem>
                        <SelectItem value="awareness">Build Brand Awareness</SelectItem>
                        <SelectItem value="information">Provide Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label>Target Audience</Label>
                    <Textarea placeholder="Who are your customers?" value={formData.target_audience} onChange={e => updateForm('target_audience', e.target.value)} />
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label>Main Competitors</Label>
                    <Textarea placeholder="List 2-3 competitor websites" value={formData.competitors} onChange={e => updateForm('competitors', e.target.value)} />
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">4. Budget & Timeline</h2>
                  <div className="space-y-2">
                    <Label>Budget Range</Label>
                    <Select value={formData.budget_range} onValueChange={v => updateForm('budget_range', v)}>
                      <SelectTrigger><SelectValue placeholder="Select budget range" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_1k">Under $1,000</SelectItem>
                        <SelectItem value="1k_3k">$1,000 - $3,000</SelectItem>
                        <SelectItem value="3k_5k">$3,000 - $5,000</SelectItem>
                        <SelectItem value="5k_10k">$5,000 - $10,000</SelectItem>
                        <SelectItem value="over_10k">$10,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                      <Label>Desired Launch Date</Label>
                      <Input type="date" value={formData.launch_date} onChange={e => updateForm('launch_date', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Timeline Flexibility</Label>
                      <Select value={formData.timeline_flexibility} onValueChange={v => updateForm('timeline_flexibility', v)}>
                        <SelectTrigger><SelectValue placeholder="Select flexibility" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flexible">Flexible</SelectItem>
                          <SelectItem value="somewhat">Somewhat Flexible</SelectItem>
                          <SelectItem value="fixed">Fixed Deadline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5 */}
              {step === 5 && (
                <div className="space-y-4 animate-in fade-in">
                  <h2 className="text-xl font-bold text-navy mb-4 border-b pb-2">5. Additional Notes</h2>
                  <div className="space-y-2">
                    <Label>Anything else we should know?</Label>
                    <Textarea rows={6} placeholder="Any specific functional requirements, special integrations, or constraints..." value={formData.notes} onChange={e => updateForm('notes', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Form Navigation */}
              <div className="flex items-center justify-between pt-8 border-t">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                ) : <div />}
                
                {step < 5 ? (
                  <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">Next Step <ArrowRight className="w-4 h-4 ml-2" /></Button>
                ) : (
                  <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit Request
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
