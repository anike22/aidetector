export type PricingModel = 
  | 'Free'
  | 'Freemium'
  | 'Paid'
  | 'Free Trial'
  | 'Enterprise / Contact Sales';

export type PlatformType = 
  | 'Web'
  | 'Windows'
  | 'macOS'
  | 'Linux'
  | 'iOS'
  | 'Android'
  | 'Browser Extension'
  | 'CLI / API';

export type SupportedModality = 
  | 'Text'
  | 'Code'
  | 'Image'
  | 'Audio'
  | 'Video'
  | 'Document'
  | 'Multimodal';

export type DeploymentMode = 
  | 'Cloud SaaS'
  | 'Local / Self-Hosted'
  | 'Air-Gapped / On-Premise'
  | 'Hybrid';

export interface SourceReference {
  id?: string;
  title: string;
  url: string;
  lastChecked: string;
  lastCheckedAt?: string;
  citationIndex?: number;
  isOfficial?: boolean;
  category?:
    | 'official_pricing'
    | 'documentation'
    | 'changelog'
    | 'announcement'
    | 'independent_benchmark'
    | 'academic_paper'
    | 'general';
}

export interface FreshnessMetadata {
  lastVerifiedProductInfo: string; // YYYY-MM-DD
  lastVerifiedPricing: string; // YYYY-MM-DD
  lastUpdatedTimeline: string; // YYYY-MM-DD
  lastUpdatedFeatures?: string;
  lastUpdatedSources?: string;
}

export type ProductCorrectionField =
  | 'product_name'
  | 'company'
  | 'description_or_summary'
  | 'category_or_tags'
  | 'pricing_model'
  | 'pricing_summary'
  | 'free_plan_or_trial'
  | 'platforms_or_deployment'
  | 'use_cases'
  | 'features_or_matrix'
  | 'limitations'
  | 'evolution_timeline'
  | 'sources_and_citations'
  | 'other';

export interface ProductCorrectionReport {
  id: string;
  productId: string;
  field: ProductCorrectionField;
  fieldLabel: string;
  currentValue: string;
  proposedCorrection: string;
  sourceUrl?: string;
  notes?: string;
  submitterEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface EditorialAssessment {
  author: string;
  title: string;
  verdict?: string;
  summary?: string;
  rating?: number;
  pros: string[];
  cons: string[];
  strengths?: string[];
  limitations?: string[];
  bestFor?: string | string[];
}

export interface VerifiedUserReview {
  id: string;
  author: string;
  role: string;
  organization?: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface ExternalRatingSource {
  source: string;
  rating: number;
  maxRating: number;
  sourceUrl?: string;
}

export interface PricingTier {
  name: string;
  price: string;
  billingPeriod?: string;
  description?: string;
  features: string[];
  highlight?: boolean;
  isPopular?: boolean;
}

export interface ProductEvolutionMilestone {
  id: string;
  date: string;
  versionOrModel: string;
  title: string;
  summary: string;
  majorChanges: string[];
  capabilitiesAdded: string[];
  capabilitiesRemoved?: string[];
  pricingImpact?: string;
  platformImpact?: string;
  sourceRef?: SourceReference;
  isCurrent?: boolean;
}

export interface FeatureDetail {
  name: string;
  description: string;
  targetAudience: string;
  limitations?: string;
  availabilityTier: string;
}

export interface FeatureCategoryGroup {
  category: string;
  iconName?: string;
  description: string;
  features: FeatureDetail[];
}

export interface FeatureAvailabilityItem {
  featureName: string;
  isAvailable: boolean | 'partial' | 'unverified';
  requiredPlan: string;
  supportedPlatforms: string[];
  verificationNotes: string;
  lastVerified: string;
}

export interface PricingHistoryItem {
  date: string;
  event: string;
  description: string;
  priceChangeDetails?: string;
  sourceUrl?: string;
}

export interface ProductFaqItem {
  question: string;
  answer: string;
  category?: string;
}

export interface AudienceUseCaseItem {
  persona: string;
  iconName?: string;
  benefits: string[];
  recommendedWorkflows: string[];
  importantLimitations: string[];
}

export interface MultiDimensionRating {
  easeOfUse?: number; // 1-5
  featureQuality?: number; // 1-5
  valueForMoney?: number; // 1-5
  reliability?: number; // 1-5
}

export type EvidenceVerificationStatus =
  | 'not_submitted'
  | 'submitted'
  | 'reviewed'
  | 'insufficient'
  | 'rejected'
  | 'verified_usage';

export interface EvidenceAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number; // bytes
  dataUrl?: string; // local or storage URL
  uploadedAt: string;
  evidenceType: 'screenshot' | 'billing' | 'interface' | 'error' | 'benchmark';
  privacy: 'moderators_only' | 'public_redacted';
  verificationStatus: EvidenceVerificationStatus;
  moderatorNotes?: string;
}

export type ConflictRelationshipType =
  | 'none'
  | 'employee'
  | 'former_employee'
  | 'consultant'
  | 'affiliate'
  | 'received_free_access'
  | 'received_incentive';

export interface ConflictDisclosure {
  hasConflict: boolean;
  relationshipType: ConflictRelationshipType;
  details?: string;
}

export interface VendorResponse {
  id: string;
  companyName: string;
  responderName: string;
  responderRole: string;
  officialVerified: boolean;
  responseText: string;
  date: string;
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  productId: string;
  reason: 'spam' | 'conflict_of_interest' | 'abusive_content' | 'privacy_issue' | 'misleading_information' | 'other';
  details: string;
  reporterEmail?: string;
  reportedAt: string;
  status: 'pending' | 'reviewed' | 'dismissed';
}

export interface ProductUserReview {
  id: string;
  productId: string;
  authorName: string;
  roleOrProfession: string;
  companyOrSchool?: string;
  rating: number; // 1 to 5 overall
  dimensionalRatings?: MultiDimensionRating;
  title: string;
  reviewText: string;
  pros?: string[];
  cons?: string[];
  primaryUseCase?: string;
  planUsed?: string;
  usageDuration: string;
  verifiedUser: boolean;
  evidenceAttachment?: EvidenceAttachment;
  conflictDisclosure?: ConflictDisclosure;
  vendorResponse?: VendorResponse;
  helpfulVotes: number;
  helpfulVotedBy?: string[];
  date: string;
  lastEditedDate?: string;
  moderationStatus: 'approved' | 'pending' | 'flagged' | 'rejected' | 'needs_review';
  moderatorNotes?: string;
}

export interface DirectoryProduct {
  id: string;
  slug: string;
  name: string;
  company: string;
  description: string;
  summary: string;
  logo: string;
  primaryCategory: string;
  categories: string[];
  tags: string[];
  useCases: string[];
  features: string[];
  limitations?: string[];
  supportedModalities: SupportedModality[];
  pricingModel: PricingModel;
  pricingSummary: string;
  hasFreePlan: boolean;
  hasFreeTrial: boolean;
  platforms: PlatformType[];
  apiAvailable: boolean;
  browserExtension: boolean;
  mobileApp: boolean;
  openSource: boolean;
  isOpenWeight?: boolean;
  licenseType?: string;
  supportsOfflineHosting?: boolean;
  deploymentOptions?: DeploymentMode[];
  businessAvailability: boolean;
  websiteUrl: string;
  lastVerified: string;
  lastChecked?: string;
  lastUpdatedAt?: string;
  featured: boolean;
  isOwnerProduct?: boolean;
  ownerBadgeLabel?: string;
  reviewStatus?: 'published' | 'coming_soon' | 'verified_only';
  editorialStatus?: 'editorial_reviewed' | 'community_indexed' | 'first_party_platform';
  sourceReferences?: SourceReference[];
  editorialAssessment?: EditorialAssessment;
  verifiedReviews?: VerifiedUserReview[];
  externalRatings?: ExternalRatingSource[];
  pricingTiers?: PricingTier[];
  evolutionMilestones?: ProductEvolutionMilestone[];
  structuredFeatureGroups?: FeatureCategoryGroup[];
  featureAvailabilityMatrix?: FeatureAvailabilityItem[];
  pricingHistory?: PricingHistoryItem[];
  audienceUseCases?: AudienceUseCaseItem[];
  faqs?: ProductFaqItem[];
  userReviews?: ProductUserReview[];
  freshness?: FreshnessMetadata;
}

export type DirectorySortOption = 
  | 'featured'
  | 'recently_updated'
  | 'name_asc'
  | 'name_desc'
  | 'highest_rated'
  | 'updated'
  | 'alpha-asc'
  | 'alpha-desc';

export interface DirectoryFilterState {
  searchQuery?: string;
  categories: string[];
  pricingModels: PricingModel[];
  hasFreePlan?: boolean;
  hasFreeTrial?: boolean;
  platforms: PlatformType[];
  useCases: string[];
  supportedModalities?: SupportedModality[];
  tags?: string[];
  apiAvailable?: boolean;
  browserExtension?: boolean;
  mobileApp?: boolean;
  openSource?: boolean;
  isOpenWeight?: boolean;
  supportsOfflineHosting?: boolean;
  licenseTypes?: string[];
  deploymentOptions?: DeploymentMode[];
  businessAvailability?: boolean;
  sortBy?: DirectorySortOption;
}

export interface ToolSubmissionPayload {
  name: string;
  company: string;
  websiteUrl: string;
  repositoryUrl?: string;
  docsUrl?: string;
  summary: string;
  description: string;
  primaryCategory: string;
  categories: string[];
  tags: string[];
  supportedModalities: SupportedModality[];
  pricingModel: PricingModel;
  pricingSummary: string;
  hasFreePlan: boolean;
  hasFreeTrial: boolean;
  platforms: PlatformType[];
  apiAvailable: boolean;
  openSource: boolean;
  isOpenWeight: boolean;
  licenseType: string;
  supportsOfflineHosting: boolean;
  deploymentOptions: DeploymentMode[];
  minimumHardwareRequirements?: string;
  contactEmail: string;
  verificationEvidenceUrl?: string;
  notesForEditorial?: string;
}

export interface DiscoveryNeedAnswer {
  primaryGoal: string;
  budgetPreference: 'all' | 'free_only' | 'free_trial' | 'paid_acceptable';
  platformNeed: 'all' | 'web' | 'desktop' | 'mobile' | 'api';
  teamScale: 'all' | 'individual' | 'team';
  mustHaveApi: boolean;
}
