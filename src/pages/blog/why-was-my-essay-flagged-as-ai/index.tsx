import { useEffect, useMemo, useRef, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FAQ_DATA } from './faqs';
import {
  HeroSection,
  ExecutiveSummarySection,
  QuickAnswerSection,
  CorePrinciplesSection,
  HowDetectorsWorkSection,
  WhyHumanEssaysFlaggedSection,
  FalsePositivesSection,
  FalseNegativesSection,
  WritingCharacteristicsSection,
  GrammarlySection,
  EditingSection,
  ParaphrasingSection,
  StudentsWorrySection,
  EducatorsSection,
  UniversitiesSection,
  ResponsibleUseSection,
  OriginalResearchSection,
  ComparisonTablesSection,
  FAQSection,
  FinalRecommendationsSection,
  EEATSection,
  InternalLinksSection,
} from './WhyWasMyEssayFlaggedContent';
import {
  PracticalExamplesSection,
  MythsVsFactsSection,
  ActionPlanSection,
  DetectorLimitationsSection,
} from './extraSections';

const SECTIONS = [
  { id: 'executive-summary', title: 'Executive Summary' },
  { id: 'core-principles', title: 'Core Principles' },
  { id: 'how-ai-detectors-work', title: 'How AI Detectors Work' },
  { id: 'why-human-essays-are-flagged', title: 'Why Human Essays Are Flagged' },
  { id: 'common-causes-of-false-positives', title: 'Common Causes of False Positives' },
  { id: 'common-causes-of-false-negatives', title: 'Common Causes of False Negatives' },
  { id: 'practical-examples', title: 'Practical Examples' },
  { id: 'myths-vs-facts', title: 'Myths vs. Facts' },
  { id: 'action-plan', title: 'Step-by-Step Action Plan' },
  { id: 'writing-characteristics', title: 'Writing Characteristics' },
  { id: 'detector-limitations', title: 'Detector Limitations' },
  { id: 'can-grammarly-affect-ai-detection', title: 'Can Grammarly Affect AI Detection?' },
  { id: 'can-editing-change-results', title: 'Can Editing Change Results?' },
  { id: 'can-paraphrasing-help', title: 'Can Paraphrasing Help?' },
  { id: 'should-students-worry', title: 'Should Students Worry?' },
  { id: 'guidance-for-educators', title: 'Guidance for Educators' },
  { id: 'guidance-for-universities', title: 'Guidance for Universities' },
  { id: 'responsible-use', title: 'Responsible Use of AI Detection' },
  { id: 'original-research', title: 'Original Research' },
  { id: 'comparison-tables', title: 'AI Detection Tools Comparison' },
  { id: 'faq', title: 'FAQ' },
  { id: 'final-recommendations', title: 'Final Recommendations' },
  { id: 'eeat-and-references', title: 'About This Guide' },
  { id: 'related-resources', title: 'Related Resources' },
];

const CANONICAL_URL = 'https://www.aidetector.cx/guides/why-was-my-essay-flagged-as-ai';
const OG_IMAGE = 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dd277352-e1ee-463e-8d0c-ed3988d35393.jpg';

function useActiveSection() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const observersRef = useRef<IntersectionObserver[]>([]);

  useEffect(() => {
    observersRef.current.forEach((o) => o.disconnect());
    observersRef.current = [];

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-section') || '';
          if (entry.isIntersecting) {
            visible.set(id, entry.intersectionRatio);
          } else {
            visible.delete(id);
          }
        });
        let bestId = SECTIONS[0].id;
        let bestRatio = 0;
        visible.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });
        setActiveId(bestId);
      },
      { rootMargin: '-10% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    document.querySelectorAll('[data-section]').forEach((el) => observer.observe(el));
    observersRef.current.push(observer);

    return () => {
      observersRef.current.forEach((o) => o.disconnect());
      observersRef.current = [];
    };
  }, []);

  return activeId;
}

function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setProgress(docHeight > 0 ? Math.min(100, (scrolled / docHeight) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return progress;
}

function TableOfContents({ activeId, mobile = false, onNavigate }: { activeId: string; mobile?: boolean; onNavigate?: () => void }) {
  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onNavigate?.();
    }
  };

  return (
    <nav aria-label="Table of contents" className={mobile ? '' : 'sticky top-24'}>
      <h3 className="text-sm font-bold text-navy uppercase tracking-wide mb-3">On this page</h3>
      <ScrollArea className={mobile ? 'h-[70vh]' : 'h-[calc(100vh-8rem)]'}>
        <ul className="space-y-1 pr-4">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => handleClick(section.id)}
                className={cn(
                  'w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors',
                  activeId === section.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </nav>
  );
}

function StructuredDataSchemas() {
  const faqSchema = useMemo(() => {
    const mainEntity = Object.values(FAQ_DATA)
      .flat()
      .map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      }));
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity,
    };
  }, []);

  const articleSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Why Was My Essay Flagged as AI? Complete Guide 2026',
      description:
        'Discover why AI detectors flag human essays, how detection works, and what to do if your writing is incorrectly identified as AI-generated.',
      author: {
        '@type': 'Person',
        name: 'Dr. Elena Voss',
      },
      publisher: {
        '@type': 'Organization',
        name: 'AIDetector.cx',
        logo: {
          '@type': 'ImageObject',
          url: '/brand/aidetector-icon.png',
        },
      },
      datePublished: '2026-07-27',
      dateModified: '2026-07-27',
      image: OG_IMAGE,
      url: CANONICAL_URL,
    }),
    []
  );

  const breadcrumbSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://aidetector.cx/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: 'https://aidetector.cx/blog',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Why Was My Essay Flagged as AI?',
          item: CANONICAL_URL,
        },
      ],
    }),
    []
  );

  return <PageMeta
    title="Why Was My Essay Flagged as AI? Complete Guide 2026"
    description="Discover why AI detectors flag human essays, how detection works, and what to do if your writing is incorrectly identified as AI-generated. Evidence-based guide with original research."
    canonicalUrl={CANONICAL_URL}
    ogTitle="Why Was My Essay Flagged as AI? Complete Guide 2026"
    ogDescription="Discover why AI detectors flag human essays, how detection works, and what to do if your writing is incorrectly identified as AI-generated."
    ogImage={OG_IMAGE}
    ogType="article"
    schemas={[articleSchema, faqSchema, breadcrumbSchema]}
  />;
}

export default function WhyWasMyEssayFlaggedPage() {
  const activeId = useActiveSection();
  const progress = useReadingProgress();
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  return (
    <MainLayout>
      <StructuredDataSchemas />
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Desktop TOC */}
          <aside className="hidden lg:block w-64 shrink-0">
            <TableOfContents activeId={activeId} />
          </aside>

          {/* Mobile TOC toggle */}
          <div className="lg:hidden flex items-center justify-between mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileTocOpen(true)}
              className="gap-2"
            >
              <Menu className="w-4 h-4" />
              Table of Contents
            </Button>
          </div>

          {mobileTocOpen && (
            <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm lg:hidden p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-navy">Table of Contents</h2>
                <Button variant="ghost" size="icon" onClick={() => setMobileTocOpen(false)} aria-label="Close table of contents">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <TableOfContents activeId={activeId} mobile onNavigate={() => setMobileTocOpen(false)} />
            </div>
          )}

          <article className="flex-1 min-w-0">
            <HeroSection />
            <QuickAnswerSection />
            <ExecutiveSummarySection />
            <CorePrinciplesSection />
            <HowDetectorsWorkSection />
            <WhyHumanEssaysFlaggedSection />
            <FalsePositivesSection />
            <FalseNegativesSection />
            <PracticalExamplesSection />
            <MythsVsFactsSection />
            <ActionPlanSection />
            <WritingCharacteristicsSection />
            <DetectorLimitationsSection />
            <GrammarlySection />
            <EditingSection />
            <ParaphrasingSection />
            <StudentsWorrySection />
            <EducatorsSection />
            <UniversitiesSection />
            <ResponsibleUseSection />
            <OriginalResearchSection />
            <ComparisonTablesSection />
            <FAQSection />
            <FinalRecommendationsSection />
            <EEATSection />
            <InternalLinksSection />

            <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
              <h2 className="text-xl md:text-2xl font-bold text-navy mb-3">Still have questions?</h2>
              <p className="text-foreground/80 text-pretty max-w-2xl mx-auto mb-6">
                Test your own writing, compare detector behavior, or explore our full suite of AI
                detection and humanization tools.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild className="gap-2">
                  <Link to="/detector">
                    Analyze My Essay <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="gap-2">
                  <Link to="/humanizer">
                    Humanize My Writing <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/plagiarism-checker">
                    Check for Plagiarism <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </MainLayout>
  );
}
