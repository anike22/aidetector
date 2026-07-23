import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import {
  type WizardState,
  defaultEEATConfig, defaultSEOAssets, defaultAuditScores,
  computeOverallScore,
} from './types';

import Step1KeywordAnalysis from './Step1KeywordAnalysis';
import Step2SERPAnalysis from './Step2SERPAnalysis';
import Step3ContentBrief from './Step3ContentBrief';
import Step4ArticleOutline from './Step4ArticleOutline';
import Step5EEATConfig from './Step5EEATConfig';
import Step6ArticleGeneration from './Step6ArticleGeneration';
import Step7Humanization from './Step7Humanization';
import Step8SEOOptimization from './Step8SEOOptimization';
import Step9InternalLinking from './Step9InternalLinking';
import Step10FAQGeneration from './Step10FAQGeneration';
import Step11SEOAssets from './Step11SEOAssets';
import Step12SEOAudit from './Step12SEOAudit';

const STEP_LABELS = [
  'Keywords', 'SERP', 'Brief', 'Outline', 'EEAT',
  'Write', 'Humanize', 'SEO Opt', 'Links', 'FAQ', 'Assets', 'Audit',
];

const INITIAL_STATE: Omit<WizardState, 'articleId' | 'currentStep'> = {
  keyword: '',
  country: 'USA',
  searchIntent: 'Informational',
  competitorUrls: ['', '', ''],
  secondaryKeywords: [],
  selectedKeywords: [],
  lsiKeywords: [],
  peopleAlsoAsk: [],
  keywordDifficulty: 0,
  searchVolume: '',
  targetWordCount: 1200,
  serpHeadings: [],
  competitorTopics: [],
  brief: { title: '', metaTitle: '', metaDescription: '', slug: '' },
  outline: [],
  eeatConfig: defaultEEATConfig,
  sections: [],
  humanizedContent: '',
  readabilityBefore: 0,
  readabilityAfter: 0,
  keywordDensityReport: [],
  internalLinks: [],
  faqItems: [],
  seoAssets: defaultSEOAssets,
  auditScores: defaultAuditScores,
  fullContent: '',
};

export default function ArticleWizardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<WizardState>({
    ...INITIAL_STATE,
    articleId: id || null,
    currentStep: 1,
  });

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (id) loadArticle();
    else setLoading(false);
  }, [id, user]);

  const loadArticle = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      toast.error('Article not found.');
      navigate('/content-studio');
      return;
    }

    setState({
      articleId: data.id,
      currentStep: data.current_step || 1,
      keyword: data.keyword || '',
      country: data.country || 'USA',
      searchIntent: data.search_intent || 'Informational',
      competitorUrls: ['', '', ''],
      secondaryKeywords: data.secondary_keywords || [],
      selectedKeywords: data.secondary_keywords || [],
      lsiKeywords: [],
      peopleAlsoAsk: [],
      keywordDifficulty: 0,
      searchVolume: '',
      targetWordCount: data.target_word_count || 1200,
      serpHeadings: [],
      competitorTopics: [],
      brief: {
        title: data.title || '',
        metaTitle: data.meta_title || '',
        metaDescription: data.meta_description || '',
        slug: data.slug || '',
      },
      outline: Array.isArray(data.outline) ? data.outline : [],
      eeatConfig: data.eeat_config && typeof data.eeat_config === 'object'
        ? data.eeat_config as WizardState['eeatConfig']
        : defaultEEATConfig,
      sections: Array.isArray(data.sections) ? data.sections : [],
      humanizedContent: data.full_content || '',
      readabilityBefore: 0,
      readabilityAfter: 0,
      keywordDensityReport: [],
      internalLinks: [],
      faqItems: Array.isArray(data.faq) ? data.faq : [],
      seoAssets: data.seo_assets && typeof data.seo_assets === 'object'
        ? data.seo_assets as WizardState['seoAssets']
        : defaultSEOAssets,
      auditScores: data.seo_score ? {
        keywordUsage: data.seo_score,
        readability: data.seo_score,
        internalLinks: data.seo_score,
        eeat: data.seo_score,
        headingStructure: data.seo_score,
        faq: data.seo_score,
        schema: data.seo_score,
      } : defaultAuditScores,
      fullContent: data.full_content || '',
    });
    setLoading(false);
  };

  const saveToDatabase = useCallback(async (newState: WizardState, markReady = false) => {
    if (!newState.articleId) return;
    setSaving(true);

    const overallScore = computeOverallScore(newState.auditScores);

    const payload = {
      title: newState.brief?.title || 'Untitled',
      keyword: newState.keyword,
      country: newState.country,
      search_intent: newState.searchIntent,
      secondary_keywords: newState.selectedKeywords,
      target_word_count: newState.targetWordCount,
      meta_title: newState.seoAssets?.metaTitle || newState.brief?.metaTitle || '',
      meta_description: newState.seoAssets?.metaDescription || newState.brief?.metaDescription || '',
      slug: newState.brief?.slug || '',
      outline: newState.outline,
      eeat_config: newState.eeatConfig,
      sections: newState.sections,
      full_content: newState.fullContent || newState.humanizedContent,
      faq: newState.faqItems,
      seo_assets: newState.seoAssets,
      seo_score: overallScore > 0 ? overallScore : null,
      word_count: (newState.fullContent || '').split(/\s+/).filter(Boolean).length,
      current_step: newState.currentStep,
      status: markReady ? 'ready' : 'draft',
    };

    const { error } = await supabase
      .from('articles')
      .update(payload)
      .eq('id', newState.articleId);

    setSaving(false);
    if (error) console.error('Save error:', error);
  }, []);

  const handleChange = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      // Debounce save
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => saveToDatabase(next), 2000);
      return next;
    });
  }, [saveToDatabase]);

  const goNext = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, currentStep: Math.min(12, prev.currentStep + 1) };
      saveToDatabase(next, next.currentStep === 12);
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [saveToDatabase]);

  const goBack = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  const step = state.currentStep;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1 text-muted-foreground hover:text-navy border-border border"
            onClick={() => navigate('/content-studio')}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Studio
          </Button>
          {saving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          )}
        </div>

        {/* Step progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-navy">Step {step} of 12</span>
            <span className="text-xs text-muted-foreground">{STEP_LABELS[step - 1]}</span>
          </div>
          <div className="flex gap-1">
            {STEP_LABELS.map((label, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  idx + 1 < step ? 'bg-success' :
                  idx + 1 === step ? 'bg-primary' :
                  'bg-muted'
                }`}
                title={`${idx + 1}. ${label}`}
              />
            ))}
          </div>
          {/* Step labels row (desktop) */}
          <div className="hidden md:flex gap-1 mt-1.5">
            {STEP_LABELS.map((label, idx) => (
              <div key={idx} className="flex-1 text-center">
                <span className={`text-[9px] leading-none ${
                  idx + 1 < step ? 'text-success' :
                  idx + 1 === step ? 'text-primary font-semibold' :
                  'text-muted-foreground/50'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="pb-10">
          {step === 1 && <Step1KeywordAnalysis state={state} onChange={handleChange} onNext={goNext} />}
          {step === 2 && <Step2SERPAnalysis state={state} onChange={handleChange} onNext={goNext} onBack={goBack} />}
          {step === 3 && <Step3ContentBrief state={state} onChange={handleChange} onNext={goNext} onBack={goBack} />}
          {step === 4 && <Step4ArticleOutline state={state} onChange={handleChange} onNext={goNext} onBack={goBack} />}
          {step === 5 && <Step5EEATConfig state={state} onChange={handleChange} onNext={goNext} onBack={goBack} />}
          {step === 6 && <Step6ArticleGeneration state={state} onChange={handleChange} onNext={goNext} onBack={goBack} />}
          {step === 7 && <Step7Humanization state={state} onChange={handleChange} onNext={goNext} onBack={goBack} />}
          {step === 8 && <Step8SEOOptimization state={state} onChange={handleChange} onNext={goNext} onBack={goBack} />}
          {step === 9 && <Step9InternalLinking state={state} onChange={handleChange} onNext={goNext} onBack={goBack} />}
          {step === 10 && <Step10FAQGeneration state={state} onChange={handleChange} onNext={goNext} onBack={goBack} />}
          {step === 11 && <Step11SEOAssets state={state} onChange={handleChange} onNext={goNext} onBack={goBack} />}
          {step === 12 && (
            <Step12SEOAudit
              state={state}
              onChange={handleChange}
              onBack={goBack}
              computeOverall={computeOverallScore}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
