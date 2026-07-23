import MainLayout from '@/components/layouts/MainLayout';
import type { ReactNode } from 'react';
import HomePage from './pages/HomePage';
import DetectorPage from './pages/DetectorPage';
import ToolsPage from './pages/ToolsPage';
import PlagiarismCheckerPage from './pages/PlagiarismCheckerPage';
import ToolDetailPage from './pages/ToolDetailPage';
import CommunityPage from './pages/CommunityPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import DashboardPage from './pages/DashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import MarketplaceDetailPage from './pages/MarketplaceDetailPage';
import SellPage from './pages/SellPage';
import AdminPage from './pages/admin/AdminPage';
import FeatureControlsPage from './pages/admin/FeatureControlsPage';
import ApiHealthDashboardPage from './pages/admin/ApiHealthDashboardPage';
import DetectorAdminPage from './pages/admin/DetectorAdminPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import BestAIDetectorPage from './pages/blog/BestAIDetectorPage';
import ChatGPTDetectorPage from './pages/blog/ChatGPTDetectorPage';
import GPT5VsGeminiPage from './pages/blog/GPT5VsGeminiPage';
import TurnitinVsAIDetectorPage from './pages/blog/TurnitinVsAIDetectorPage';
import HowAIDetectionWorksPage from './pages/blog/HowAIDetectionWorksPage';
import AIDetectionAccuracyTestsPage from './pages/blog/AIDetectionAccuracyTestsPage';
import PricingPage from './pages/PricingPage';
import NewsletterPage from './pages/NewsletterPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ResetPasswordConfirmPage from './pages/auth/ResetPasswordConfirmPage';
import ContentStudioPage from './pages/content-studio/ContentStudioPage';
import ArticleWizardPage from './pages/content-studio/ArticleWizardPage';
import ApiPlatformPage from './pages/ApiPlatformPage';
import ApiDocsPage from './pages/api/ApiDocsPage';
import ApiDashboardPage from './pages/api/ApiDashboardPage';
import { Navigate } from 'react-router-dom';
import HumanizerPage from './pages/humanizer/HumanizerPage';
import HumanizerPageWrapper from './pages/humanizer/HumanizerPageWrapper';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import SEOAssistantPage from './pages/seo-assistant/SEOAssistantPage';
import AboutPage from './pages/company/AboutPage';
import CareersPage from './pages/company/CareersPage';
import EmailPreferencesPage from './pages/account/EmailPreferencesPage';
import PressPage from './pages/company/PressPage';
import ContactPage from './pages/company/ContactPage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsOfServicePage from './pages/legal/TermsOfServicePage';
import CookiePolicyPage from './pages/legal/CookiePolicyPage';

// Document Intelligence
import DocumentIntelligencePage from './pages/document/DocumentIntelligencePage';
import DocumentWorkspacePage from './pages/document/DocumentWorkspacePage';
import ProspectingDashboardPage from './pages/prospecting/ProspectingDashboardPage';
import CreateProspectingProjectPage from './pages/prospecting/CreateProspectingProjectPage';
import CompanySearchResultsPage from './pages/prospecting/CompanySearchResultsPage';
import DecisionMakerProfilesPage from './pages/prospecting/DecisionMakerProfilesPage';
import LeadEnrichmentPage from './pages/prospecting/LeadEnrichmentPage';
import OutreachGeneratorPage from './pages/prospecting/OutreachGeneratorPage';
import CompetitorIntelligencePage from './pages/prospecting/CompetitorIntelligencePage';
import AiCrmPage from './pages/prospecting/AiCrmPage';
import PremiumFindersPage from './pages/prospecting/PremiumFindersPage';

// Business Expansion
import FeatureGate from '@/components/auth/FeatureGate';
import ServicesOverviewPage from './pages/services/ServicesOverviewPage';
import SEOServicesPage from './pages/services/SEOServicesPage';
import AIConsultingPage from './pages/services/AIConsultingPage';
import GrowthMarketingPage from './pages/services/GrowthMarketingPage';
import HireExpertPage from './pages/experts/HireExpertPage';
import ConversionOptimizationPage from './pages/services/ConversionOptimizationPage';
import WebsiteDevelopmentPage from './pages/services/WebsiteDevelopmentPage';
import WebsiteDevRequestPage from './pages/services/WebsiteDevRequestPage';
import BookMeetingPage from './pages/services/BookMeetingPage';
import ChromeExtensionPage from './pages/integrations/ChromeExtensionPage';
import WordPressPluginPage from './pages/integrations/WordPressPluginPage';
import CaseStudiesPage from './pages/case-studies/CaseStudiesPage';
import AffiliateHubPage from './pages/affiliate/AffiliateHubPage';

// SEO Intelligence Suite
import SEODashboard from './pages/seo/SEODashboard';
import DomainOverviewPage from './pages/seo/DomainOverviewPage';
import SEOProjectsPage from './pages/seo/SEOProjectsPage';
import SEOAuditPage from './pages/seo/SEOAuditPage';
import TechnicalSEOPage from './pages/seo/TechnicalSEOPage';
import AEOOptimizerPage from './pages/seo/AEOOptimizerPage';
import KeywordResearchPage from './pages/seo/KeywordResearchPage';
import ContentStrategyPage from './pages/seo/ContentStrategyPage';
import LinkBuildingPage from './pages/seo/LinkBuildingPage';
import SEOAgentPage from './pages/seo/SEOAgentPage';


export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Humanizer',
    path: '/humanizer',
    element: <FeatureGate featureSlug="humanizer"><MainLayout><HumanizerPageWrapper /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Home',
    path: '/',
    element: <HomePage />,
    public: true,
  },
  {
    name: 'AI Detector',
    path: '/detector',
    element: <FeatureGate featureSlug="ai-detector"><DetectorPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'AI Tools',
    path: '/tools',
    element: <FeatureGate featureSlug="tools"><ToolsPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Tool Detail',
    path: '/tools/:id',
    element: <FeatureGate featureSlug="tools"><ToolDetailPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Plagiarism Checker',
    path: '/plagiarism-checker',
    element: <FeatureGate featureSlug="plagiarism-checker"><PlagiarismCheckerPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Community',
    path: '/community',
    element: <FeatureGate featureSlug="community"><CommunityPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Community Discussion',
    path: '/community/discussions/:id',
    element: <FeatureGate featureSlug="community"><CommunityDetailPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <DashboardPage />,
    public: true,
  },
  {
    name: 'Email Preferences',
    path: '/account/email-preferences',
    element: <EmailPreferencesPage />,
    public: true,
  },
  {
    name: 'Marketplace',
    path: '/marketplace',
    element: <FeatureGate featureSlug="marketplace"><MarketplacePage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Marketplace Product',
    path: '/marketplace/:id',
    element: <FeatureGate featureSlug="marketplace"><MarketplaceDetailPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Sell',
    path: '/sell',
    element: <SellPage />,
    public: true,
  },
  {
    name: 'Feature Controls',
    path: '/admin/features',
    element: <FeatureControlsPage />,
    public: true,
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminPage />,
    public: true,
  },
  {
    name: 'Admin Users',
    path: '/admin/users',
    element: <AdminPage />,
    public: true,
  },
  {
    name: 'Admin Products',
    path: '/admin/products',
    element: <AdminPage />,
    public: true,
  },
  {
    name: 'Admin Moderation',
    path: '/admin/moderation',
    element: <AdminPage />,
    public: true,
  },
  {
    name: 'Admin Articles',
    path: '/admin/articles',
    element: <AdminPage />,
    public: true,
  },
  {
    name: 'Admin Feature Controls',
    path: '/admin/feature-controls',
    element: <AdminPage />,
    public: true,
  },
  {
    name: 'Admin API Health',
    path: '/admin/api-health',
    element: <AdminPage />,
    public: true,
  },
  {
    name: 'Admin Email',
    path: '/admin/email',
    element: <AdminPage />,
    public: true,
  },
  {
    name: 'Admin Detector Config',
    path: '/admin/detector-config',
    element: <DetectorAdminPage />,
    public: true,
  },
  {
    name: 'Blog',
    path: '/blog',
    element: <FeatureGate featureSlug="blog"><BlogPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Best AI Detector in 2026',
    path: '/blog/best-ai-detector',
    element: <FeatureGate featureSlug="blog"><BestAIDetectorPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'ChatGPT Detector Comparison',
    path: '/blog/chatgpt-detector-comparison',
    element: <FeatureGate featureSlug="blog"><ChatGPTDetectorPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'GPT-5.5 vs Gemini Detection',
    path: '/blog/gpt-5-vs-gemini-detection',
    element: <FeatureGate featureSlug="blog"><GPT5VsGeminiPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Turnitin vs AIDetector.cx',
    path: '/blog/turnitin-vs-aidetector-cx',
    element: <FeatureGate featureSlug="blog"><TurnitinVsAIDetectorPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'How AI Detection Works',
    path: '/blog/how-ai-detection-works',
    element: <FeatureGate featureSlug="blog"><HowAIDetectionWorksPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'AI Detection Accuracy Tests',
    path: '/blog/ai-detection-accuracy-tests',
    element: <FeatureGate featureSlug="blog"><AIDetectionAccuracyTestsPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Blog Article',
    path: '/blog/:id',
    element: <FeatureGate featureSlug="blog"><BlogDetailPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Pricing',
    path: '/pricing',
    element: <FeatureGate featureSlug="pricing"><PricingPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Newsletter',
    path: '/newsletter',
    element: <NewsletterPage />,
    public: true,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    public: true,
  },
  {
    name: 'Sign Up',
    path: '/signup',
    element: <SignupPage />,
    public: true,
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: <ResetPasswordPage />,
    public: true,
  },
  {
    name: 'Reset Password Confirm',
    path: '/reset-password/confirm',
    element: <ResetPasswordConfirmPage />,
    public: true,
  },
  {
    name: 'Content Studio',
    path: '/content-studio',
    element: <ContentStudioPage />,
    public: true,
  },
  {
    name: 'Article Wizard',
    path: '/content-studio/:id',
    element: <ArticleWizardPage />,
    public: true,
  },

  {
    name: 'SEO Assistant',
    path: '/seo-assistant',
    element: <FeatureGate featureSlug="seo-assistant"><MainLayout><SEOAssistantPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Payment Success',
    path: '/payment-success',
    element: <PaymentSuccessPage />,
    public: true,
  },
  {
    name: 'Payment Cancel',
    path: '/payment-cancel',
    element: <PaymentCancelPage />,
    public: true,
  },
  {
    name: 'About',
    path: '/about',
    element: <AboutPage />,
    public: true,
  },
  {
    name: 'Careers',
    path: '/careers',
    element: <CareersPage />,
    public: true,
  },
  {
    name: 'Press',
    path: '/press',
    element: <PressPage />,
    public: true,
  },
  {
    name: 'Contact',
    path: '/contact',
    element: <ContactPage />,
    public: true,
  },
  {
    name: 'API Platform',
    path: '/api',
    element: <ApiPlatformPage />,
    public: true,
  },
  {
    name: 'API Platform Legacy Redirect',
    path: '/api-platform',
    element: <Navigate to="/api" replace />,
    public: true,
  },
  {
    name: 'API Documentation',
    path: '/api/docs',
    element: <ApiDocsPage />,
    public: true,
  },
  {
    name: 'API Dashboard',
    path: '/api/dashboard',
    element: <ApiDashboardPage />,
    public: true,
  },
  {
    name: 'Privacy Policy',
    path: '/privacy',
    element: <PrivacyPolicyPage />,
    public: true,
  },
  {
    name: 'Terms of Service',
    path: '/terms',
    element: <TermsOfServicePage />,
    public: true,
  },
  {
    name: 'Cookie Policy',
    path: '/cookies',
    element: <CookiePolicyPage />,
    public: true,
  },
  {
    name: 'Document Intelligence',
    path: '/document-intelligence',
    element: <DocumentIntelligencePage />,
    public: true,
  },
  {
    name: 'SEO Dashboard',
    path: '/seo-dashboard',
    element: <FeatureGate featureSlug="seo-dashboard"><MainLayout><SEODashboard /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Domain Overview',
    path: '/domain-overview',
    element: <FeatureGate featureSlug="domain-overview"><MainLayout><DomainOverviewPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'SEO Projects',
    path: '/seo-projects',
    element: <FeatureGate featureSlug="seo-projects"><MainLayout><SEOProjectsPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'SEO Audit',
    path: '/seo-audit',
    element: <FeatureGate featureSlug="seo-audit"><MainLayout><SEOAuditPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Technical SEO',
    path: '/technical-seo',
    element: <FeatureGate featureSlug="technical-seo"><MainLayout><TechnicalSEOPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'AEO Optimizer',
    path: '/aeo-optimizer',
    element: <FeatureGate featureSlug="aeo-optimizer"><MainLayout><AEOOptimizerPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Keyword Research',
    path: '/keyword-research',
    element: <FeatureGate featureSlug="keyword-research"><MainLayout><KeywordResearchPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Content Strategy',
    path: '/content-strategy',
    element: <FeatureGate featureSlug="content-strategy"><MainLayout><ContentStrategyPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Link Building',
    path: '/link-building',
    element: <FeatureGate featureSlug="link-building"><MainLayout><LinkBuildingPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'SEO Agent',
    path: '/seo-agent',
    element: <FeatureGate featureSlug="seo-agent"><MainLayout><SEOAgentPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Document Workspace',
    path: '/document-workspace',
    element: <MainLayout><DocumentWorkspacePage /></MainLayout>,
    public: true,
  },
  {
    name: 'AI Business Growth Intelligence',
    path: '/prospecting',
    element: <MainLayout><ProspectingDashboardPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Create Prospecting Project',
    path: '/prospecting/projects/new',
    element: <MainLayout><CreateProspectingProjectPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Companies Search Results',
    path: '/prospecting/projects/:projectId/companies',
    element: <MainLayout><CompanySearchResultsPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Decision Makers',
    path: '/prospecting/companies/:companyId/decision-makers',
    element: <MainLayout><DecisionMakerProfilesPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Lead Enrichment',
    path: '/prospecting/enrichment',
    element: <MainLayout><LeadEnrichmentPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Generate Outreach',
    path: '/prospecting/outreach/new',
    element: <MainLayout><OutreachGeneratorPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Competitor Intelligence',
    path: '/prospecting/competitor-intelligence',
    element: <MainLayout><CompetitorIntelligencePage /></MainLayout>,
    public: true,
  },
  {
    name: 'AI CRM Pipeline',
    path: '/prospecting/crm',
    element: <MainLayout><AiCrmPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Premium Finders',
    path: '/prospecting/premium-finders',
    element: <MainLayout><PremiumFindersPage /></MainLayout>,
    public: true,
  },

  // Business Expansion
  {
    name: 'Services Overview',
    path: '/services',
    element: <MainLayout><ServicesOverviewPage /></MainLayout>,
    public: true,
  },
  {
    name: 'SEO Services',
    path: '/services/seo-consulting',
    element: <MainLayout><SEOServicesPage /></MainLayout>,
    public: true,
  },
  {
    name: 'AI Consulting',
    path: '/services/ai-consulting',
    element: <MainLayout><AIConsultingPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Conversion Optimization',
    path: '/services/conversion-optimization',
    element: <MainLayout><ConversionOptimizationPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Chrome Extension',
    path: '/chrome-extension',
    element: <MainLayout><ChromeExtensionPage /></MainLayout>,
    public: true,
  },
  {
    name: 'WordPress Plugin',
    path: '/wordpress-plugin',
    element: <MainLayout><WordPressPluginPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Growth Marketing',
    path: '/services/growth-marketing',
    element: <MainLayout><GrowthMarketingPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Website Development',
    path: '/services/website-development',
    element: <MainLayout><WebsiteDevelopmentPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Business Website Design',
    path: '/services/business-website-design',
    element: <MainLayout><WebsiteDevelopmentPage title="Business Website Design" seoKeyword="Business Website Design" /></MainLayout>,
    public: true,
  },
  {
    name: 'SEO Website Design',
    path: '/services/seo-website-design',
    element: <MainLayout><WebsiteDevelopmentPage title="SEO Website Design" seoKeyword="SEO Website Design" /></MainLayout>,
    public: true,
  },
  {
    name: 'Custom Website Development',
    path: '/services/custom-website-development',
    element: <MainLayout><WebsiteDevelopmentPage title="Custom Website Development" seoKeyword="Custom Website Development" /></MainLayout>,
    public: true,
  },
  {
    name: 'E-commerce Website Development',
    path: '/services/ecommerce-website-development',
    element: <MainLayout><WebsiteDevelopmentPage title="E-commerce Website Development" seoKeyword="E-commerce Website Development" /></MainLayout>,
    public: true,
  },
  {
    name: 'Landing Page Design',
    path: '/services/landing-page-design',
    element: <MainLayout><WebsiteDevelopmentPage title="Landing Page Design" seoKeyword="Landing Page Design" /></MainLayout>,
    public: true,
  },
  {
    name: 'Website Dev Request',
    path: '/services/website-development/request',
    element: <MainLayout><WebsiteDevRequestPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Book a Meeting',
    path: '/services/website-development/book-meeting',
    element: <MainLayout><BookMeetingPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Hire an Expert',
    path: '/hire-expert',
    element: <MainLayout><HireExpertPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Case Studies',
    path: '/case-studies',
    element: <MainLayout><CaseStudiesPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Affiliate Hub',
    path: '/affiliate-hub',
    element: <MainLayout><AffiliateHubPage /></MainLayout>,
    public: true,
  },

];
