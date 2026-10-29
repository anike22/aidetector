import PartnerResultPage from './pages/PartnerResultPage';
import { lazy } from 'react';
const AdminOutreachPage = lazy(() => import('./pages/admin/AdminOutreachPage'));
import MainLayout from '@/components/layouts/MainLayout';
import type { ReactNode } from 'react';
import HomePage from './pages/HomePage';
const DetectorPage = lazy(() => import('./pages/DetectorPage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const PlagiarismCheckerPage = lazy(() => import('./pages/PlagiarismCheckerPage'));
const ToolDetailPage = lazy(() => import('./pages/ToolDetailPage'));
const ToolComparePage = lazy(() => import('./pages/ToolComparePage'));
const ToolSubmitPage = lazy(() => import('./pages/ToolSubmitPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const CommunityDetailPage = lazy(() => import('./pages/CommunityDetailPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProgressPage = lazy(() => import('./pages/dashboard/ProgressPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const MarketplaceDetailPage = lazy(() => import('./pages/MarketplaceDetailPage'));
const SellPage = lazy(() => import('./pages/SellPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const FeatureControlsPage = lazy(() => import('./pages/admin/FeatureControlsPage'));
const ApiHealthDashboardPage = lazy(() => import('./pages/admin/ApiHealthDashboardPage'));
const LifecycleDashboardPage = lazy(() => import('./pages/admin/LifecycleDashboardPage'));
const AutomationCenterPage = lazy(() => import('./pages/admin/AutomationCenterPage'));
const AutomationLogsPage = lazy(() => import('./pages/admin/AutomationLogsPage'));
const AutomationAnalyticsPage = lazy(() => import('./pages/admin/AutomationAnalyticsPage'));
const AIPersonalizationCenterPage = lazy(() => import('./pages/admin/AIPersonalizationCenterPage'));
const DetectorAdminPage = lazy(() => import('./pages/admin/DetectorAdminPage'));
const DetectorBenchmarkPage = lazy(() => import('./pages/admin/DetectorBenchmarkPage'));
const DetectorFeedbackDashboard = lazy(() => import('./pages/admin/DetectorFeedbackDashboard'));
const LeadCaptureAdminPage = lazy(() => import('./pages/admin/LeadCaptureAdminPage'));
const CustomerIntelligencePage = lazy(() => import('./pages/admin/CustomerIntelligencePage'));
const PrivacyControlsPage = lazy(() => import('./pages/account/PrivacyControlsPage'));
const ContentHubPage = lazy(() => import('./pages/ContentHubPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const GonePage = lazy(() => import('./pages/GonePage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const ResetPasswordConfirmPage = lazy(() => import('./pages/auth/ResetPasswordConfirmPage'));
const ContentStudioPage = lazy(() => import('./pages/content-studio/ContentStudioPage'));
const ArticleWizardPage = lazy(() => import('./pages/content-studio/ArticleWizardPage'));
const ApiPlatformPage = lazy(() => import('./pages/ApiPlatformPage'));
const ApiDocsPage = lazy(() => import('./pages/api/ApiDocsPage'));
const ApiDashboardPage = lazy(() => import('./pages/api/ApiDashboardPage'));
import { Navigate } from 'react-router-dom';
const HumanizerPage = lazy(() => import('./pages/humanizer/HumanizerPage'));
const HumanizerPageWrapper = lazy(() => import('./pages/humanizer/HumanizerPageWrapper'));
const AIImageDetectorPage = lazy(() => import('./pages/ai-image-detector/AIImageDetectorPage'));
const AIVideoDetectorPage = lazy(() => import('./pages/ai-video-detector/AIVideoDetectorPage'));
const AIInsightsPage = lazy(() => import('./pages/AIInsightsPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage'));
const SEOAssistantPage = lazy(() => import('./pages/seo-assistant/SEOAssistantPage'));
const AICheckerForBloggersPage = lazy(() => import('./pages/AICheckerForBloggersPage'));
const WordCounter = lazy(() => import('./pages/WordCounter'));
const AiSummarizer = lazy(() => import('./pages/AiSummarizer'));
const AboutPage = lazy(() => import('./pages/company/AboutPage'));
const CareersPage = lazy(() => import('./pages/company/CareersPage'));
const EmailPreferencesPage = lazy(() => import('./pages/account/EmailPreferencesPage'));
const CommunicationPreferencesPage = lazy(() => import('./pages/account/CommunicationPreferencesPage'));
const PressPage = lazy(() => import('./pages/company/PressPage'));
const ContactPage = lazy(() => import('./pages/company/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage'));
const CookiePolicyPage = lazy(() => import('./pages/legal/CookiePolicyPage'));

// Humanizer
const HumanizerInputPage = lazy(() => import('./pages/humanizer/HumanizerInputPage'));
const HumanizerProcessingPage = lazy(() => import('./pages/humanizer/HumanizerProcessingPage'));
const HumanizerAlternativesPage = lazy(() => import('./pages/humanizer/HumanizerAlternativesPage'));
const HumanizerResultPage = lazy(() => import('./pages/humanizer/HumanizerResultPage'));
const HumanizerHistoryPage = lazy(() => import('./pages/humanizer/HumanizerHistoryPage'));
const HumanizerQualityPage = lazy(() => import('./pages/admin/HumanizerQualityPage'));

// Document Intelligence
const DocumentIntelligencePage = lazy(() => import('./pages/document/DocumentIntelligencePage'));
const DocumentWorkspacePage = lazy(() => import('./pages/document/DocumentWorkspacePage'));
const ProspectingDashboardPage = lazy(() => import('./pages/prospecting/ProspectingDashboardPage'));
const CreateProspectingProjectPage = lazy(() => import('./pages/prospecting/CreateProspectingProjectPage'));
const CompanySearchResultsPage = lazy(() => import('./pages/prospecting/CompanySearchResultsPage'));
const DecisionMakerProfilesPage = lazy(() => import('./pages/prospecting/DecisionMakerProfilesPage'));
const LeadEnrichmentPage = lazy(() => import('./pages/prospecting/LeadEnrichmentPage'));
const OutreachGeneratorPage = lazy(() => import('./pages/prospecting/OutreachGeneratorPage'));
const CompetitorIntelligencePage = lazy(() => import('./pages/prospecting/CompetitorIntelligencePage'));
const AiCrmPage = lazy(() => import('./pages/prospecting/AiCrmPage'));
const PremiumFindersPage = lazy(() => import('./pages/prospecting/PremiumFindersPage'));

// Business Expansion
import FeatureGate from '@/components/auth/FeatureGate';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
const ServicesOverviewPage = lazy(() => import('./pages/services/ServicesOverviewPage'));
const SEOServicesPage = lazy(() => import('./pages/services/SEOServicesPage'));
const AIConsultingPage = lazy(() => import('./pages/services/AIConsultingPage'));
const GrowthMarketingPage = lazy(() => import('./pages/services/GrowthMarketingPage'));
const HireExpertPage = lazy(() => import('./pages/experts/HireExpertPage'));
const ConversionOptimizationPage = lazy(() => import('./pages/services/ConversionOptimizationPage'));
const WebsiteDevelopmentPage = lazy(() => import('./pages/services/WebsiteDevelopmentPage'));
const WebsiteDevRequestPage = lazy(() => import('./pages/services/WebsiteDevRequestPage'));
const BookMeetingPage = lazy(() => import('./pages/services/BookMeetingPage'));
const ChromeExtensionPage = lazy(() => import('./pages/integrations/ChromeExtensionPage'));
const WordPressPluginPage = lazy(() => import('./pages/integrations/WordPressPluginPage'));
const CaseStudiesPage = lazy(() => import('./pages/case-studies/CaseStudiesPage'));
const AffiliateHubPage = lazy(() => import('./pages/affiliate/AffiliateHubPage'));
const AffiliateAgreementPage = lazy(() => import('./pages/legal/AffiliateAgreementPage'));

// Team Workspace & Collaboration
const OrganizationsPage = lazy(() => import('./pages/team/OrganizationsPage'));
const OrganizationDashboardPage = lazy(() => import('./pages/team/OrganizationDashboardPage'));
const AcceptInvitationPage = lazy(() => import('./pages/team/AcceptInvitationPage'));
const WorkspaceDashboardPage = lazy(() => import('./pages/team/WorkspaceDashboardPage'));
const SharedReportsPage = lazy(() => import('./pages/team/SharedReportsPage'));
const ReportCollaboratePage = lazy(() => import('./pages/team/ReportCollaboratePage'));
const EnterpriseAdminPage = lazy(() => import('./pages/team/EnterpriseAdminPage'));
const NotificationsPage = lazy(() => import('./pages/team/NotificationsPage'));
const ActivityFeedPage = lazy(() => import('./pages/team/ActivityFeedPage'));
const ClassroomsPage = lazy(() => import('./pages/team/ClassroomsPage'));
const ClassroomDetailPage = lazy(() => import('./pages/team/ClassroomDetailPage'));
const ClientWorkspacesPage = lazy(() => import('./pages/team/ClientWorkspacesPage'));

// Phase 8 - Referral, Affiliate & Rewards Ecosystem
const ReferralDashboardPage = lazy(() => import('./pages/referrals/ReferralDashboardPage'));
const AffiliateDashboardPage = lazy(() => import('./pages/referrals/AffiliateDashboardPage'));
const PartnerPortalPage = lazy(() => import('./pages/referrals/PartnerPortalPage'));
const RewardsPage = lazy(() => import('./pages/referrals/RewardsPage'));
const AdminReferralsPage = lazy(() => import('./pages/admin/referrals/AdminReferralsPage'));
const AdminAffiliatesPage = lazy(() => import('./pages/admin/referrals/AdminAffiliatesPage'));
const AdminCommissionsPage = lazy(() => import('./pages/admin/referrals/AdminCommissionsPage'));
const AdminRewardsConfigPage = lazy(() => import('./pages/admin/referrals/AdminRewardsConfigPage'));
const AdminFraudPage = lazy(() => import('./pages/admin/referrals/AdminFraudPage'));
const AdminPayoutsPage = lazy(() => import('./pages/admin/referrals/AdminPayoutsPage'));
const AdminReferralAnalyticsPage = lazy(() => import('./pages/admin/referrals/AdminReferralAnalyticsPage'));
const AdminMarketingAssetsPage = lazy(() => import('./pages/admin/referrals/AdminMarketingAssetsPage'));

// Phase 9 - Security, Trust, Compliance & Governance
const SecurityCenterPage = lazy(() => import('./pages/security/SecurityCenterPage'));
const AdminSecurityCenterPage = lazy(() => import('./pages/admin/security/AdminSecurityCenterPage'));
const AdminIncidentsPage = lazy(() => import('./pages/admin/security/AdminIncidentsPage'));
const AdminCompliancePage = lazy(() => import('./pages/admin/security/AdminCompliancePage'));
const AdminPrivacyRequestsPage = lazy(() => import('./pages/admin/security/AdminPrivacyRequestsPage'));

// Phase 10 - Marketplace, Integrations & Developer Ecosystem
const DeveloperPortalPage = lazy(() => import('./pages/developer/DeveloperPortalPage'));
const WebhooksPage = lazy(() => import('./pages/developer/WebhooksPage'));
const PartnerApplicationsPage = lazy(() => import('./pages/developer/PartnerApplicationsPage'));
const AppsMarketplacePage = lazy(() => import('./pages/marketplace/AppsMarketplacePage'));
const IntegrationsPage = lazy(() => import('./pages/integrations/IntegrationsPage'));
const RegisterAuthorshipPage = lazy(() => import('./pages/verified-authorship/RegisterAuthorshipPage'));
const AuthorshipCertificatePage = lazy(() => import('./pages/verified-authorship/AuthorshipCertificatePage'));
const VerifyAuthorshipPortalPage = lazy(() => import('./pages/verified-authorship/VerifyAuthorshipPortalPage'));
const ManageAuthorshipPage = lazy(() => import('./pages/verified-authorship/ManageAuthorshipPage'));
const AuthorProfilePage = lazy(() => import('./pages/verified-authorship/AuthorProfilePage'));
const VerifyPublicTrackingCodePage = lazy(() => import('./pages/verified-authorship/VerifyPublicTrackingCodePage'));
const OwnerRecordManagementPage = lazy(() => import('./pages/verified-authorship/OwnerRecordManagementPage'));
const VerifiedAuthorshipLandingPage = lazy(() => import('./pages/verified-authorship/VerifiedAuthorshipLandingPage'));
const AuthorshipOwnerDashboardPage = lazy(() => import('./pages/verified-authorship/AuthorshipOwnerDashboardPage'));
const AdminMarketplacePage = lazy(() => import('./pages/admin/marketplace/AdminMarketplacePage'));
const AdminWebhooksPage = lazy(() => import('./pages/admin/marketplace/AdminWebhooksPage'));
const AdminIntegrationsPage = lazy(() => import('./pages/admin/marketplace/AdminIntegrationsPage'));
const AdminPartnerApplicationsPage = lazy(() => import('./pages/admin/marketplace/AdminPartnerApplicationsPage'));

// Essay Studio
const EssayStudioHomePage = lazy(() => import('./pages/essay-studio/EssayStudioHomePage'));
const EssayWorkspacePage = lazy(() => import('./pages/essay-studio/EssayWorkspacePage'));
const TeacherDashboardPage = lazy(() => import('./pages/essay-studio/TeacherDashboardPage'));
const TeacherAssignmentsPage = lazy(() => import('./pages/essay-studio/TeacherAssignmentsPage'));
const TeacherSubmissionsPage = lazy(() => import('./pages/essay-studio/TeacherSubmissionsPage'));
const TeacherReviewPage = lazy(() => import('./pages/essay-studio/TeacherReviewPage'));
const StudentSubmitPage = lazy(() => import('./pages/essay-studio/StudentSubmitPage'));
const StudentFeedbackPage = lazy(() => import('./pages/essay-studio/StudentFeedbackPage'));
const TemplateLibraryPage = lazy(() => import('./pages/essay-studio/TemplateLibraryPage'));
const EssayTemplatePage = lazy(() => import('./pages/essay-studio/EssayTemplatePage'));
const ArchivedEssaysPage = lazy(() => import('./pages/essay-studio/ArchivedEssaysPage'));

// SEO Intelligence Suite
const SEODashboard = lazy(() => import('./pages/seo/SEODashboard'));
const DomainOverviewPage = lazy(() => import('./pages/seo/DomainOverviewPage'));
const SEOProjectsPage = lazy(() => import('./pages/seo/SEOProjectsPage'));
const SEOAuditPage = lazy(() => import('./pages/seo/SEOAuditPage'));
const TechnicalSEOPage = lazy(() => import('./pages/seo/TechnicalSEOPage'));
const AEOOptimizerPage = lazy(() => import('./pages/seo/AEOOptimizerPage'));
const KeywordResearchPage = lazy(() => import('./pages/seo/KeywordResearchPage'));
const ContentStrategyPage = lazy(() => import('./pages/seo/ContentStrategyPage'));
const LinkBuildingPage = lazy(() => import('./pages/seo/LinkBuildingPage'));
const SEOAgentPage = lazy(() => import('./pages/seo/SEOAgentPage'));

// Video Detection Research & SEO Case Studies
import { WhyTikTokFlaggedMyRealVideoPage } from './pages/blog/WhyTikTokFlaggedMyRealVideoPage';
import { WhatsAppCompressionAIDetectionPage } from './pages/blog/WhatsAppCompressionAIDetectionPage';
import { AuthenticVideoFalsePositiveGuidePage } from './pages/blog/AuthenticVideoFalsePositiveGuidePage';
const AllPagesDirectoryPage = lazy(() => import('./pages/AllPagesDirectoryPage'));
const PromoVideoPage = lazy(() => import('./pages/PromoVideoPage'));


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
    element: <EssayStudioHomePage />,
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
    name: 'AI Tools Directory (Alias)',
    path: '/ai-tools',
    element: <FeatureGate featureSlug="tools"><ToolsPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Tool Comparison',
    path: '/tools/compare',
    element: <FeatureGate featureSlug="tools"><ToolComparePage /></FeatureGate>,
    public: true,
  },
  {
    name: 'AI Tool Comparison (Alias)',
    path: '/ai-tools/compare',
    element: <FeatureGate featureSlug="tools"><ToolComparePage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Pairwise Tool Comparison',
    path: '/compare/:vsPair',
    element: <FeatureGate featureSlug="tools"><ToolComparePage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Tool Detail',
    path: '/tools/:id',
    element: <FeatureGate featureSlug="tools"><ToolDetailPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Tool Detail (Alias)',
    path: '/ai-tools/:id',
    element: <FeatureGate featureSlug="tools"><ToolDetailPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Submit AI Tool',
    path: '/tools/submit',
    element: <FeatureGate featureSlug="tools"><ToolSubmitPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Submit AI Tool (Alias)',
    path: '/ai-tools/submit',
    element: <FeatureGate featureSlug="tools"><ToolSubmitPage /></FeatureGate>,
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
    name: 'Customer Intelligence (Alias)',
    path: '/admin/customer-intelligence-analytics',
    element: <CustomerIntelligencePage />,
    public: true,
    visible: false,
  },
  {
    name: 'Customer Lifecycle',
    path: '/admin/lifecycle',
    element: <LifecycleDashboardPage />,
    public: true,
  },
  {
    name: 'Customer Lifecycle (Alias)',
    path: '/admin/customer-lifecycle',
    element: <LifecycleDashboardPage />,
    public: true,
    visible: false,
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
    name: 'Register',
    path: '/register',
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
    element: <FeatureGate featureSlug="seo-assistant"><SEOAssistantPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'AI Checker for Bloggers',
    path: '/ai-checker-for-bloggers',
    element: <AICheckerForBloggersPage />,
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
    element: <DocumentWorkspacePage />,
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
    element: <ChromeExtensionPage />,
    public: true,
  },
  {
    name: 'WordPress Plugin',
    path: '/wordpress-plugin',
    element: <WordPressPluginPage />,
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
    element: <FeatureGate featureSlug="website-development"><WebsiteDevelopmentPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Business Website Design',
    path: '/services/business-website-design',
    element: <FeatureGate featureSlug="website-development"><WebsiteDevelopmentPage title="Business Website Design" seoKeyword="Business Website Design" /></FeatureGate>,
    public: true,
  },
  {
    name: 'SEO Website Design',
    path: '/services/seo-website-design',
    element: <FeatureGate featureSlug="website-development"><WebsiteDevelopmentPage title="SEO Website Design" seoKeyword="SEO Website Design" /></FeatureGate>,
    public: true,
  },
  {
    name: 'Custom Website Development',
    path: '/services/custom-website-development',
    element: <FeatureGate featureSlug="website-development"><WebsiteDevelopmentPage title="Custom Website Development" seoKeyword="Custom Website Development" /></FeatureGate>,
    public: true,
  },
  {
    name: 'E-commerce Website Development',
    path: '/services/ecommerce-website-development',
    element: <FeatureGate featureSlug="website-development"><WebsiteDevelopmentPage title="E-commerce Website Development" seoKeyword="E-commerce Website Development" /></FeatureGate>,
    public: true,
  },
  {
    name: 'Landing Page Design',
    path: '/services/landing-page-design',
    element: <FeatureGate featureSlug="website-development"><WebsiteDevelopmentPage title="Landing Page Design" seoKeyword="Landing Page Design" /></FeatureGate>,
    public: true,
  },
  {
    name: 'Website Dev Request',
    path: '/services/website-development/request',
    element: <FeatureGate featureSlug="website-development"><WebsiteDevRequestPage /></FeatureGate>,
    public: true,
  },
  {
    name: 'Book a Meeting',
    path: '/services/website-development/book-meeting',
    element: <FeatureGate featureSlug="website-development"><BookMeetingPage /></FeatureGate>,
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
    name: 'Affiliate Agreement',
    path: '/affiliate-agreement',
    element: <AffiliateAgreementPage />,
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
  { name: 'Growth Outreach', path: '/admin/growth-outreach', element: <AdminOutreachPage key="growth" growth /> },
  { name: 'Clients Outreach', path: '/admin/clients-outreach', element: <AdminOutreachPage key="clients" clients /> },
  { name: 'Outreach Mailbox', path: '/admin/outreach-mail', element: <AdminOutreachPage key="outreach-mail" outreachMail /> },
  { name: 'Affiliate Outreach', path: '/admin/outreach', element: <AdminOutreachPage key="affiliate" /> },
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
    name: 'Partner Result',
    path: '/partner-result/:id',
    element: <PartnerResultPage />,
    public: true,
  },
  {
    name: 'Article',
    path: '/:hub/:slug',
    element: <FeatureGate featureSlug="blog"><ArticlePage /></FeatureGate>,
    public: true,
  },

];
