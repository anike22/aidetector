import { lazy, Suspense, type ReactNode } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import HeroSection from '@/components/home/HeroSection';
import PageMeta from '@/components/common/PageMeta';
import { useAuth } from '@/contexts/AuthContext';
import { PersonalizedHome } from '@/components/personalization/PersonalizedHome';
import { FAQ_DATA } from '@/components/home/FAQSection';

const TwoPerspectivesSection = lazy(() => import('@/components/home/TwoPerspectivesSection'));
const MultilingualSection = lazy(() => import('@/components/home/MultilingualSection'));
const HowItWorksSection = lazy(() => import('@/components/home/HowItWorksSection'));
const SentenceLevelSection = lazy(() => import('@/components/home/SentenceLevelSection'));
const ChatGPTSection = lazy(() => import('@/components/home/ChatGPTSection'));
const AudienceIntentSection = lazy(() => import('@/components/home/AudienceIntentSection'));
const AccuracySection = lazy(() => import('@/components/home/AccuracySection'));
const CapabilitiesSection = lazy(() => import('@/components/home/CapabilitiesSection'));
const ResponsibleVerificationSection = lazy(() => import('@/components/home/ResponsibleVerificationSection'));
const ProductSuiteSection = lazy(() => import('@/components/home/ProductSuiteSection'));
const UseCasesSection = lazy(() => import('@/components/home/UseCasesSection'));
const FAQSection = lazy(() => import('@/components/home/FAQSection'));
const SEOAuthoritySection = lazy(() => import('@/components/home/SEOAuthoritySection'));
const NewsletterComponent = lazy(() => import('@/components/home/NewsletterComponent').then((m) => ({ default: m.NewsletterComponent })));
const CTASection = lazy(() => import('@/components/home/CTASection'));

const LazySection = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<div className="h-16" />}>{children}</Suspense>
);

const SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AIDetector.cx',
    url: 'https://www.aidetector.cx/',
    description: 'Free AI detector for ChatGPT, Claude, Gemini and AI-generated text. Dual detection modes, multilingual support, sentence-level analysis and explainable results.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.aidetector.cx/detector?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AIDetector.cx',
    url: 'https://www.aidetector.cx/',
    logo: 'https://www.aidetector.cx/logo.png',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: 'https://www.aidetector.cx/contact',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AIDetector.cx',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: 'https://www.aidetector.cx/',
    description: 'Free AI content detector supporting dual-mode analysis (Balanced and High-Sensitivity), multilingual AI detection across 19+ languages, and sentence-level explainability.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    featureList: [
      'Free AI Detector',
      'ChatGPT Detector',
      'AI Content Detector',
      'AI Checker',
      'AI Text Detector',
      'AI Writing Detector',
      'Balanced AI Detection',
      'High-Sensitivity AI Detection',
      'Multilingual AI Detector',
      'English AI Detector',
      'Spanish AI Detector',
      'Arabic AI Detector',
      'French AI Detector',
      'German AI Detector',
      'Sentence-Level AI Detection',
      'AI/Human/Mixed Classification',
      'Explainable Results',
      'AI Detector for Students',
      'AI Detector for Teachers',
      'AI Essay Detector',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <PageMeta
        title="AI Detector – Detect ChatGPT & AI-Generated Text | AIDetector.cx"
        description="Free AI detector for ChatGPT, Claude and AI-generated text. Dual detection modes, multilingual AI analysis across 19+ languages, sentence-level results and explainable AI content detection."
        canonicalUrl="https://www.aidetector.cx/"
        ogTitle="AI Detector – Detect ChatGPT & AI-Generated Text | AIDetector.cx"
        ogDescription="Detect ChatGPT, Claude, Gemini and AI-generated text free. Dual detection engines, 19+ languages, sentence-level breakdown — try it now, no account needed."
        schemas={SCHEMAS}
      />
      <div className="flex flex-col w-full">
        {user && <PersonalizedHome />}
        <HeroSection />
        {/* Core detection explanation — above-fold context */}
        <LazySection><TwoPerspectivesSection /></LazySection>
        <LazySection><MultilingualSection /></LazySection>
        <LazySection><HowItWorksSection /></LazySection>
        {/* Depth content — sentence-level + ChatGPT specific */}
        <LazySection><SentenceLevelSection /></LazySection>
        <LazySection><ChatGPTSection /></LazySection>
        {/* Audience intent — keyword-rich, natural */}
        <LazySection><AudienceIntentSection /></LazySection>
        {/* Accuracy + trust — topical authority */}
        <LazySection><AccuracySection /></LazySection>
        {/* Capabilities index — indexable feature list */}
        <LazySection><CapabilitiesSection /></LazySection>
        {/* Responsible use disclaimer */}
        <LazySection><ResponsibleVerificationSection /></LazySection>
        {/* Product ecosystem + user base */}
        <LazySection><UseCasesSection /></LazySection>
        <LazySection><ProductSuiteSection /></LazySection>
        {/* FAQ — structured data anchor */}
        <LazySection><FAQSection /></LazySection>
        {/* Internal linking hub */}
        <LazySection><SEOAuthoritySection /></LazySection>
        <LazySection><NewsletterComponent /></LazySection>
        <LazySection><CTASection /></LazySection>
      </div>
    </MainLayout>
  );
}
