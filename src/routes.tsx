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
import ProgressPage from './pages/dashboard/ProgressPage';
import MarketplacePage from './pages/MarketplacePage';
import MarketplaceDetailPage from './pages/MarketplaceDetailPage';
import SellPage from './pages/SellPage';
import AdminPage from './pages/admin/AdminPage';
import FeatureControlsPage from './pages/admin/FeatureControlsPage';
import ApiHealthDashboardPage from './pages/admin/ApiHealthDashboardPage';
import LifecycleDashboardPage from './pages/admin/LifecycleDashboardPage';
import AutomationCenterPage from './pages/admin/AutomationCenterPage';
import AutomationLogsPage from './pages/admin/AutomationLogsPage';
import AutomationAnalyticsPage from './pages/admin/AutomationAnalyticsPage';
import AIPersonalizationCenterPage from './pages/admin/AIPersonalizationCenterPage';
import DetectorAdminPage from './pages/admin/DetectorAdminPage';
import DetectorBenchmarkPage from './pages/admin/DetectorBenchmarkPage';
import DetectorFeedbackDashboard from './pages/admin/DetectorFeedbackDashboard';
import LeadCaptureAdminPage from './pages/admin/LeadCaptureAdminPage';
import CustomerIntelligencePage from './pages/admin/CustomerIntelligencePage';
import PrivacyControlsPage from './pages/account/PrivacyControlsPage';
import ContentHubPage from './pages/ContentHubPage';
import ArticlePage from './pages/ArticlePage';
import GonePage from './pages/GonePage';
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
import AIImageDetectorPage from './pages/ai-image-detector/AIImageDetectorPage';
import AIVideoDetectorPage from './pages/ai-video-detector/AIVideoDetectorPage';
import AIInsightsPage from './pages/AIInsightsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import SEOAssistantPage from './pages/seo-assistant/SEOAssistantPage';
import WordCounter from './pages/WordCounter';
import AiSummarizer from './pages/AiSummarizer';
import AboutPage from './pages/company/AboutPage';
import CareersPage from './pages/company/CareersPage';
import EmailPreferencesPage from './pages/account/EmailPreferencesPage';
import CommunicationPreferencesPage from './pages/account/CommunicationPreferencesPage';
import PressPage from './pages/company/PressPage';
import ContactPage from './pages/company/ContactPage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsOfServicePage from './pages/legal/TermsOfServicePage';
import CookiePolicyPage from './pages/legal/CookiePolicyPage';

// Humanizer
import HumanizerInputPage from './pages/humanizer/HumanizerInputPage';
import HumanizerProcessingPage from './pages/humanizer/HumanizerProcessingPage';
import HumanizerAlternativesPage from './pages/humanizer/HumanizerAlternativesPage';
import HumanizerResultPage from './pages/humanizer/HumanizerResultPage';
import HumanizerHistoryPage from './pages/humanizer/HumanizerHistoryPage';
import HumanizerQualityPage from './pages/admin/HumanizerQualityPage';

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
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
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

// Team Workspace & Collaboration
import OrganizationsPage from './pages/team/OrganizationsPage';
import OrganizationDashboardPage from './pages/team/OrganizationDashboardPage';
import AcceptInvitationPage from './pages/team/AcceptInvitationPage';
import WorkspaceDashboardPage from './pages/team/WorkspaceDashboardPage';
import SharedReportsPage from './pages/team/SharedReportsPage';
import ReportCollaboratePage from './pages/team/ReportCollaboratePage';
import EnterpriseAdminPage from './pages/team/EnterpriseAdminPage';
import NotificationsPage from './pages/team/NotificationsPage';
import ActivityFeedPage from './pages/team/ActivityFeedPage';
import ClassroomsPage from './pages/team/ClassroomsPage';
import ClassroomDetailPage from './pages/team/ClassroomDetailPage';
import ClientWorkspacesPage from './pages/team/ClientWorkspacesPage';

// Phase 8 - Referral, Affiliate & Rewards Ecosystem
import ReferralDashboardPage from './pages/referrals/ReferralDashboardPage';
import AffiliateDashboardPage from './pages/referrals/AffiliateDashboardPage';
import PartnerPortalPage from './pages/referrals/PartnerPortalPage';
import RewardsPage from './pages/referrals/RewardsPage';
import AdminReferralsPage from './pages/admin/referrals/AdminReferralsPage';
import AdminAffiliatesPage from './pages/admin/referrals/AdminAffiliatesPage';
import AdminCommissionsPage from './pages/admin/referrals/AdminCommissionsPage';
import AdminRewardsConfigPage from './pages/admin/referrals/AdminRewardsConfigPage';
import AdminFraudPage from './pages/admin/referrals/AdminFraudPage';
import AdminPayoutsPage from './pages/admin/referrals/AdminPayoutsPage';
import AdminReferralAnalyticsPage from './pages/admin/referrals/AdminReferralAnalyticsPage';
import AdminMarketingAssetsPage from './pages/admin/referrals/AdminMarketingAssetsPage';

// Phase 9 - Security, Trust, Compliance & Governance
import SecurityCenterPage from './pages/security/SecurityCenterPage';
import AdminSecurityCenterPage from './pages/admin/security/AdminSecurityCenterPage';
import AdminIncidentsPage from './pages/admin/security/AdminIncidentsPage';
import AdminCompliancePage from './pages/admin/security/AdminCompliancePage';
import AdminPrivacyRequestsPage from './pages/admin/security/AdminPrivacyRequestsPage';

// Phase 10 - Marketplace, Integrations & Developer Ecosystem
import DeveloperPortalPage from './pages/developer/DeveloperPortalPage';
import WebhooksPage from './pages/developer/WebhooksPage';
import PartnerApplicationsPage from './pages/developer/PartnerApplicationsPage';
import AppsMarketplacePage from './pages/marketplace/AppsMarketplacePage';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import RegisterAuthorshipPage from './pages/verified-authorship/RegisterAuthorshipPage';
import AuthorshipCertificatePage from './pages/verified-authorship/AuthorshipCertificatePage';
import VerifyAuthorshipPortalPage from './pages/verified-authorship/VerifyAuthorshipPortalPage';
import ManageAuthorshipPage from './pages/verified-authorship/ManageAuthorshipPage';
import AuthorProfilePage from './pages/verified-authorship/AuthorProfilePage';
import VerifyPublicTrackingCodePage from './pages/verified-authorship/VerifyPublicTrackingCodePage';
import OwnerRecordManagementPage from './pages/verified-authorship/OwnerRecordManagementPage';
import VerifiedAuthorshipLandingPage from './pages/verified-authorship/VerifiedAuthorshipLandingPage';
import AuthorshipOwnerDashboardPage from './pages/verified-authorship/AuthorshipOwnerDashboardPage';
import AdminMarketplacePage from './pages/admin/marketplace/AdminMarketplacePage';
import AdminWebhooksPage from './pages/admin/marketplace/AdminWebhooksPage';
import AdminIntegrationsPage from './pages/admin/marketplace/AdminIntegrationsPage';
import AdminPartnerApplicationsPage from './pages/admin/marketplace/AdminPartnerApplicationsPage';

// Essay Studio
import EssayStudioHomePage from './pages/essay-studio/EssayStudioHomePage';
import EssayWorkspacePage from './pages/essay-studio/EssayWorkspacePage';
import TeacherDashboardPage from './pages/essay-studio/TeacherDashboardPage';
import TeacherAssignmentsPage from './pages/essay-studio/TeacherAssignmentsPage';
import TeacherSubmissionsPage from './pages/essay-studio/TeacherSubmissionsPage';
import TeacherReviewPage from './pages/essay-studio/TeacherReviewPage';
import StudentSubmitPage from './pages/essay-studio/StudentSubmitPage';
import StudentFeedbackPage from './pages/essay-studio/StudentFeedbackPage';
import TemplateLibraryPage from './pages/essay-studio/TemplateLibraryPage';
import EssayTemplatePage from './pages/essay-studio/EssayTemplatePage';
import ArchivedEssaysPage from './pages/essay-studio/ArchivedEssaysPage';

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

// Video Detection Research & SEO Case Studies
import { WhyTikTokFlaggedMyRealVideoPage } from './pages/blog/WhyTikTokFlaggedMyRealVideoPage';
import { WhatsAppCompressionAIDetectionPage } from './pages/blog/WhatsAppCompressionAIDetectionPage';
import { AuthenticVideoFalsePositiveGuidePage } from './pages/blog/AuthenticVideoFalsePositiveGuidePage';
import AllPagesDirectoryPage from './pages/AllPagesDirectoryPage';
import PromoVideoPage from './pages/PromoVideoPage';


export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  errorElement?: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  // ── Essay Studio ────────────────────────────────────────────────────────────
  {
    name: 'Essay Studio',
    path: '/essay-studio',
    element: <MainLayout><EssayStudioHomePage /></MainLayout>,
    public: false,
  },
  {
    name: 'Essay Workspace',
    path: '/essay-studio/:essayId/:phase',
    element: <EssayWorkspacePage />,
    public: false,
    visible: false,
  },
  {
    name: 'Essay Workspace (default phase)',
    path: '/essay-studio/:essayId',
    element: <EssayWorkspacePage />,
    public: false,
    visible: false,
  },
  {
    name: 'Teacher Dashboard',
    path: '/essay-studio/teacher',
    element: <TeacherDashboardPage />,
    public: false,
  },
  {
    name: 'Teacher Assignments',
    path: '/essay-studio/teacher/assignments',
    element: <TeacherAssignmentsPage />,
    public: false,
  },
  {
    name: 'Teacher Submissions',
    path: '/essay-studio/teacher/assignments/:assignmentId/submissions',
    element: <MainLayout showFooter={false}><TeacherSubmissionsPage /></MainLayout>,
    public: false,
    visible: false,
  },
  {
    name: 'Teacher Review',
    path: '/essay-studio/teacher/submissions/:submissionId/review',
    element: <MainLayout showFooter={false}><TeacherReviewPage /></MainLayout>,
    public: false,
    visible: false,
  },
  {
    name: 'Student Submit',
    path: '/essay-studio/submit-to/:assignmentId',
    element: <MainLayout showFooter={false}><StudentSubmitPage /></MainLayout>,
    public: false,
    visible: false,
  },
  {
    name: 'Student Feedback',
    path: '/essay-studio/submissions/:submissionId/feedback',
    element: <MainLayout showFooter={false}><StudentFeedbackPage /></MainLayout>,
    public: false,
    visible: false,
  },
  {
    name: 'Essay Studio – Template Library',
    path: '/essay-studio/templates',
    element: <TemplateLibraryPage />,
    public: true,
    visible: false,
  },
  {
    name: 'Essay Studio – Archived',
    path: '/essay-studio/archived',
    element: <ArchivedEssaysPage />,
    public: false,
    visible: false,
  },
  {
    name: 'Essay Template Detail',
    path: '/essay-template/:slug',
    element: <EssayTemplatePage />,
    public: true,
    visible: false,
  },
  // ────────────────────────────────────────────────────────────────────────────

  {
    name: 'Humanizer',
    path: '/humanizer',
    element: <FeatureGate featureSlug="humanizer"><MainLayout><HumanizerInputPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Humanizer Processing',
    path: '/humanizer/processing/:jobId',
    element: <FeatureGate featureSlug="humanizer"><MainLayout><HumanizerProcessingPage /></MainLayout></FeatureGate>,
    public: true,
    visible: false,
  },
  {
    name: 'Humanizer Alternatives',
    path: '/humanizer/alternatives/:jobId',
    element: <FeatureGate featureSlug="humanizer"><MainLayout><HumanizerAlternativesPage /></MainLayout></FeatureGate>,
    public: true,
    visible: false,
  },
  {
    name: 'Humanizer Result',
    path: '/humanizer/result/:jobId',
    element: <FeatureGate featureSlug="humanizer"><MainLayout><HumanizerResultPage /></MainLayout></FeatureGate>,
    public: true,
    visible: false,
  },
  {
    name: 'Humanizer History',
    path: '/humanizer/history',
    element: <FeatureGate featureSlug="humanizer"><MainLayout><HumanizerHistoryPage /></MainLayout></FeatureGate>,
    public: false,
  },
  {
    name: 'Admin - Humanizer Quality',
    path: '/admin/humanizer-quality',
    element: <MainLayout><HumanizerQualityPage /></MainLayout>,
    public: false,
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
    element: <DetectorPage />,
    public: true,
    errorElement: <RouteErrorBoundary />,
  },
  {
    name: 'AI Image Detector',
    path: '/ai-image-detector',
    element: <AIImageDetectorPage />,
    public: true,
    errorElement: <RouteErrorBoundary />,
  },
  {
    name: 'AI Image Detector (Redirect)',
    path: '/image-detector',
    element: <Navigate to="/ai-image-detector" replace />,
    public: true,
  },
  {
    name: 'AI Video Detector',
    path: '/ai-video-detector',
    element: <AIVideoDetectorPage />,
    public: true,
    errorElement: <RouteErrorBoundary />,
  },
  {
    name: 'AI Video Detector (Redirect)',
    path: '/video-detector',
    element: <Navigate to="/ai-video-detector" replace />,
    public: true,
  },
  {
    name: 'TikTok Video Detection Study',
    path: '/studies/why-tiktok-flagged-my-real-video',
    element: <MainLayout><WhyTikTokFlaggedMyRealVideoPage /></MainLayout>,
    public: true,
  },
  {
    name: 'WhatsApp Video Compression Study',
    path: '/studies/whatsapp-compression-ai-video',
    element: <MainLayout><WhatsAppCompressionAIDetectionPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Authentic Video False Positives Guide',
    path: '/studies/authentic-video-false-positives',
    element: <MainLayout><AuthenticVideoFalsePositiveGuidePage /></MainLayout>,
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
    name: 'Word Counter & AI Detector',
    path: '/word-counter',
    element: <WordCounter />,
    public: true,
    errorElement: <RouteErrorBoundary />,
  },
  {
    name: 'AI Summarizer',
    path: '/ai-summarizer',
    element: <FeatureGate featureSlug="ai-summarizer"><AiSummarizer /></FeatureGate>,
    public: true,
    errorElement: <RouteErrorBoundary />,
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
    name: 'My Progress',
    path: '/dashboard/progress',
    element: <ProgressPage />,
    public: true,
  },
  {
    name: 'AI Insights',
    path: '/insights',
    element: <AIInsightsPage />,
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
    name: 'Admin Settings',
    path: '/admin/settings',
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
    name: 'Admin Detector Benchmark',
    path: '/admin/detector-benchmark',
    element: <DetectorBenchmarkPage />,
    public: true,
  },
  {
    name: 'Admin Detector Feedback',
    path: '/admin/detector-feedback',
    element: <DetectorFeedbackDashboard />,
    public: true,
  },
  {
    name: 'Admin Lead Capture',
    path: '/admin/lead-capture',
    element: <LeadCaptureAdminPage />,
    public: true,
  },
  {
    name: 'Product Video Demo',
    path: '/promo',
    element: <MainLayout><PromoVideoPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Product Video Demo',
    path: '/video',
    element: <MainLayout><PromoVideoPage /></MainLayout>,
    public: true,
  },
  {
    name: 'Customer Intelligence',
    path: '/admin/customer-intelligence',
    element: <CustomerIntelligencePage />,
    public: true,
  },
  {
    name: 'Customer Lifecycle',
    path: '/admin/lifecycle',
    element: <LifecycleDashboardPage />,
    public: true,
  },
  {
    name: 'AI Personalization Center',
    path: '/admin/personalization',
    element: <AIPersonalizationCenterPage />,
    public: true,
  },
  {
    name: 'Automation Center',
    path: '/admin/automation',
    element: <AutomationCenterPage />,
    public: true,
  },
  {
    name: 'Automation Logs',
    path: '/admin/automation/logs',
    element: <AutomationLogsPage />,
    public: true,
  },
  {
    name: 'Automation Analytics',
    path: '/admin/automation/analytics',
    element: <AutomationAnalyticsPage />,
    public: true,
  },
  {
    name: 'Privacy Controls',
    path: '/account/privacy',
    element: <PrivacyControlsPage />,
    public: true,
  },
  {
    name: 'Communication Preferences',
    path: '/settings/preferences',
    element: <CommunicationPreferencesPage />,
    public: true,
  },
  {
    name: 'Blog',
    path: '/blog',
    element: <FeatureGate featureSlug="blog"><ContentHubPage hub="blog" /></FeatureGate>,
    public: true,
  },
  {
    name: 'Guides',
    path: '/guides',
    element: <FeatureGate featureSlug="blog"><ContentHubPage hub="guides" /></FeatureGate>,
    public: true,
  },
  {
    name: 'Understanding AI Detection Scores Redirect',
    path: '/guides/understanding-ai-detection-scores',
    element: <Navigate to="/guides/how-ai-detection-works" replace />,
    public: true,
  },
  {
    name: 'Research',
    path: '/research',
    element: <FeatureGate featureSlug="blog"><ContentHubPage hub="research" /></FeatureGate>,
    public: true,
  },
  {
    name: 'Comparisons',
    path: '/comparisons',
    element: <FeatureGate featureSlug="blog"><ContentHubPage hub="comparisons" /></FeatureGate>,
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
    element: <FeatureGate featureSlug="services"><MainLayout><ServicesOverviewPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'SEO Services',
    path: '/services/seo-consulting',
    element: <FeatureGate featureSlug="seo-consulting"><MainLayout><SEOServicesPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'AI Consulting',
    path: '/services/ai-consulting',
    element: <FeatureGate featureSlug="ai-consulting"><MainLayout><AIConsultingPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Conversion Optimization',
    path: '/services/conversion-optimization',
    element: <FeatureGate featureSlug="conversion-optimization"><MainLayout><ConversionOptimizationPage /></MainLayout></FeatureGate>,
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
    element: <FeatureGate featureSlug="growth-marketing"><MainLayout><GrowthMarketingPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Website Development',
    path: '/services/website-development',
    element: <FeatureGate featureSlug="website-development"><MainLayout><WebsiteDevelopmentPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Business Website Design',
    path: '/services/business-website-design',
    element: <FeatureGate featureSlug="website-development"><MainLayout><WebsiteDevelopmentPage title="Business Website Design" seoKeyword="Business Website Design" /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'SEO Website Design',
    path: '/services/seo-website-design',
    element: <FeatureGate featureSlug="website-development"><MainLayout><WebsiteDevelopmentPage title="SEO Website Design" seoKeyword="SEO Website Design" /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Custom Website Development',
    path: '/services/custom-website-development',
    element: <FeatureGate featureSlug="website-development"><MainLayout><WebsiteDevelopmentPage title="Custom Website Development" seoKeyword="Custom Website Development" /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'E-commerce Website Development',
    path: '/services/ecommerce-website-development',
    element: <FeatureGate featureSlug="website-development"><MainLayout><WebsiteDevelopmentPage title="E-commerce Website Development" seoKeyword="E-commerce Website Development" /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Landing Page Design',
    path: '/services/landing-page-design',
    element: <FeatureGate featureSlug="website-development"><MainLayout><WebsiteDevelopmentPage title="Landing Page Design" seoKeyword="Landing Page Design" /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Website Dev Request',
    path: '/services/website-development/request',
    element: <FeatureGate featureSlug="website-development"><MainLayout><WebsiteDevRequestPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Book a Meeting',
    path: '/services/website-development/book-meeting',
    element: <FeatureGate featureSlug="website-development"><MainLayout><BookMeetingPage /></MainLayout></FeatureGate>,
    public: true,
  },
  {
    name: 'Hire an Expert',
    path: '/hire-expert',
    element: <FeatureGate featureSlug="hire-expert"><MainLayout><HireExpertPage /></MainLayout></FeatureGate>,
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

  // Team Workspace & Collaboration
  {
    name: 'Accept Invitation',
    path: '/accept-invitation',
    element: <AcceptInvitationPage />,
    public: true,
  },
  {
    name: 'Organizations',
    path: '/organizations',
    element: <OrganizationsPage />,
  },
  {
    name: 'Organization Dashboard',
    path: '/organizations/:orgId',
    element: <OrganizationDashboardPage />,
  },
  {
    name: 'Workspace Dashboard',
    path: '/workspaces/:workspaceId',
    element: <WorkspaceDashboardPage />,
  },
  {
    name: 'Shared Reports',
    path: '/reports/shared',
    element: <SharedReportsPage />,
  },
  {
    name: 'Report Collaboration',
    path: '/reports/:reportId/collaborate',
    element: <ReportCollaboratePage />,
  },
  {
    name: 'Enterprise Admin',
    path: '/admin/enterprise',
    element: <EnterpriseAdminPage />,
  },
  {
    name: 'Notifications',
    path: '/notifications',
    element: <NotificationsPage />,
  },
  {
    name: 'Activity Feed',
    path: '/activity',
    element: <ActivityFeedPage />,
  },
  {
    name: 'Classrooms',
    path: '/organizations/:orgId/classrooms',
    element: <ClassroomsPage />,
  },
  {
    name: 'Classroom Detail',
    path: '/classrooms/:classroomId',
    element: <ClassroomDetailPage />,
  },
  {
    name: 'Client Workspaces',
    path: '/organizations/:orgId/clients',
    element: <ClientWorkspacesPage />,
  },

  // Phase 8 - Referral, Affiliate & Rewards Ecosystem
  {
    name: 'Referrals',
    path: '/referrals',
    element: <ReferralDashboardPage />,
  },
  {
    name: 'Affiliate Dashboard',
    path: '/affiliates/dashboard',
    element: <AffiliateDashboardPage />,
  },
  {
    name: 'Partner Portal',
    path: '/partner',
    element: <PartnerPortalPage />,
  },
  {
    name: 'Rewards',
    path: '/rewards',
    element: <RewardsPage />,
  },
  {
    name: 'Admin Referrals',
    path: '/admin/referrals',
    element: <AdminReferralsPage />,
    public: true,
  },
  {
    name: 'Admin Affiliates',
    path: '/admin/affiliates',
    element: <AdminAffiliatesPage />,
    public: true,
  },
  {
    name: 'Admin Commissions',
    path: '/admin/commissions',
    element: <AdminCommissionsPage />,
    public: true,
  },
  {
    name: 'Admin Rewards',
    path: '/admin/rewards',
    element: <AdminRewardsConfigPage />,
    public: true,
  },
  {
    name: 'Admin Fraud Review',
    path: '/admin/fraud',
    element: <AdminFraudPage />,
    public: true,
  },
  {
    name: 'Admin Payouts',
    path: '/admin/payouts',
    element: <AdminPayoutsPage />,
    public: true,
  },
  {
    name: 'Admin Referral Analytics',
    path: '/admin/referral-analytics',
    element: <AdminReferralAnalyticsPage />,
    public: true,
  },
  {
    name: 'Admin Marketing Assets',
    path: '/admin/marketing-assets',
    element: <AdminMarketingAssetsPage />,
    public: true,
  },

  // Phase 9 - Security, Trust, Compliance & Governance
  {
    name: 'Security Center',
    path: '/security',
    element: <SecurityCenterPage />,
  },
  {
    name: 'Admin Security Center',
    path: '/admin/security',
    element: <AdminSecurityCenterPage />,
    public: true,
  },
  {
    name: 'Admin Incidents',
    path: '/admin/incidents',
    element: <AdminIncidentsPage />,
    public: true,
  },
  {
    name: 'Admin Compliance',
    path: '/admin/compliance',
    element: <AdminCompliancePage />,
    public: true,
  },
  {
    name: 'Admin Privacy Requests',
    path: '/admin/privacy-requests',
    element: <AdminPrivacyRequestsPage />,
    public: true,
  },

  // Phase 10 - Marketplace, Integrations & Developer Ecosystem
  {
    name: 'Developer Center',
    path: '/developer',
    element: <DeveloperPortalPage />,
    public: true,
  },
  {
    name: 'Webhooks',
    path: '/webhooks',
    element: <WebhooksPage />,
  },
  {
    name: 'Partner Application',
    path: '/partner/apply',
    element: <PartnerApplicationsPage />,
  },
  {
    name: 'App Marketplace',
    path: '/apps',
    element: <AppsMarketplacePage />,
    public: true,
  },
  {
    name: 'Integration Hub',
    path: '/integrations',
    element: <IntegrationsPage />,
    public: true,
  },
  {
    name: 'Admin Marketplace',
    path: '/admin/marketplace',
    element: <AdminMarketplacePage />,
    public: true,
  },
  {
    name: 'Admin Webhooks',
    path: '/admin/webhooks',
    element: <AdminWebhooksPage />,
    public: true,
  },
  {
    name: 'Admin Integrations',
    path: '/admin/integrations',
    element: <AdminIntegrationsPage />,
    public: true,
  },
  {
    name: 'Admin Partner Applications',
    path: '/admin/partner-applications',
    element: <AdminPartnerApplicationsPage />,
    public: true,
  },
  {
    name: 'Verified Authorship Landing',
    path: '/authorship',
    element: <VerifiedAuthorshipLandingPage />,
    public: true,
  },
  {
    name: 'Verified Authorship Dashboard',
    path: '/authorship/dashboard',
    element: <AuthorshipOwnerDashboardPage />,
  },
  {
    name: 'Register Authorship',
    path: '/verified-authorship/register',
    element: <RegisterAuthorshipPage />,
    public: true,
  },
  {
    name: 'Verify Authorship Portal',
    path: '/verified-authorship/verify',
    element: <VerifyAuthorshipPortalPage />,
    public: true,
  },
  {
    name: 'Authorship Certificate',
    path: '/verified-authorship/:id/certificate',
    element: <AuthorshipCertificatePage />,
    public: true,
  },
  {
    name: 'Manage Authorship Claim',
    path: '/verified-authorship/:id/manage',
    element: <ManageAuthorshipPage />,
  },
  {
    name: 'Author Profile & Attestation',
    path: '/authorship/profile',
    element: <AuthorProfilePage />,
  },
  {
    name: 'Author Profile & Attestation Alt',
    path: '/verified-authorship/profile',
    element: <AuthorProfilePage />,
  },
  {
    name: 'Public Authorship Verification',
    path: '/verify/:trackingCode',
    element: <VerifyPublicTrackingCodePage />,
    public: true,
  },
  {
    name: 'Owner Authorship Record',
    path: '/authorship/records/:recordId',
    element: <OwnerRecordManagementPage />,
  },
  {
    name: 'All Pages Directory',
    path: '/all-pages',
    element: <AllPagesDirectoryPage />,
    public: true,
  },
  {
    name: 'Site Directory (Alias)',
    path: '/directory',
    element: <Navigate to="/all-pages" replace />,
    public: true,
  },
  {
    name: 'HTML Sitemap (Alias)',
    path: '/sitemap',
    element: <Navigate to="/all-pages" replace />,
    public: true,
  },
  {
    name: 'Article',
    path: '/:hub/:slug',
    element: <FeatureGate featureSlug="blog"><ArticlePage /></FeatureGate>,
    public: true,
  },

];
