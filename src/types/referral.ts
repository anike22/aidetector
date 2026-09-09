export type ReferralLinkType = 'direct' | 'email' | 'qr' | 'social' | 'team' | 'classroom' | 'api';
export type ReferralJourneyStage = 'visitor' | 'signup' | 'email_verified' | 'first_scan' | 'subscription' | 'renewal';
export type AffiliateTier = 'Standard' | 'Verified' | 'Professional' | 'Agency' | 'Enterprise_Partner';
export type AffiliateApplicationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Suspended' | 'Terminated';
export type AffiliateLinkType = 'Tracking' | 'Deep' | 'Campaign';
export type CommissionType = 'Fixed' | 'Percentage' | 'Recurring' | 'OneTime';
export type CommissionStatus = 'Pending' | 'Approved' | 'Held' | 'Expired' | 'Paid';
export type RewardType = 'Points' | 'Credits' | 'Badge' | 'Achievement' | 'FreeScan' | 'ExtraAIWords' | 'PremiumTrial' | 'FeatureUnlock' | 'ExclusiveTemplate';
export type AchievementType = 'FirstScan' | '100Scans' | 'FirstHumanization' | 'FirstAPICall' | 'FirstReferral' | '10Referrals' | 'TeamCreator' | 'PowerUser' | 'Educator' | 'APIExpert' | 'EarlyAdopter';
export type MarketingAssetType = 'Logo' | 'BrandGuideline' | 'BannerAd' | 'Screenshot' | 'DemoVideo' | 'EmailTemplate' | 'SocialGraphic' | 'LandingPageTemplate' | 'ProductDescription';
export type FraudType = 'SelfReferral' | 'DuplicateAccount' | 'FakeEmail' | 'VPNAbuse' | 'AutomatedSignup' | 'ReferralLoop' | 'MultipleRewards' | 'SuspiciousPattern';
export type FraudReviewStatus = 'Pending' | 'Approved' | 'Rejected';
export type PayoutStatus = 'Pending' | 'Approved' | 'Processing' | 'Paid' | 'Failed';
export type LeaderboardType = 'TopReferrers' | 'TopAffiliates' | 'MonthlyChallenge' | 'SeasonalCampaign';
export type ChallengeType = 'Monthly' | 'Seasonal';

export interface ReferralLink {
  id: string;
  user_id: string;
  organization_id?: string | null;
  code: string;
  link_type: ReferralLinkType;
  attribution_window_days: number;
  created_at: string;
  expires_at?: string | null;
}

export interface ReferralJourney {
  id: string;
  referral_link_id: string;
  visitor_id?: string | null;
  referred_user_id?: string | null;
  stage: ReferralJourneyStage;
  occurred_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface AffiliateApplication {
  id: string;
  user_id: string;
  status: AffiliateApplicationStatus;
  tier: AffiliateTier;
  website?: string | null;
  social_profiles?: string | null;
  marketing_experience?: string | null;
  application_data?: Record<string, unknown> | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: { email?: string; full_name?: string };
}

export interface AffiliateLink {
  id: string;
  affiliate_user_id: string;
  link_type: AffiliateLinkType;
  campaign_name?: string | null;
  coupon_code?: string | null;
  created_at: string;
}

export interface Commission {
  id: string;
  affiliate_user_id?: string | null;
  referred_user_id?: string | null;
  referral_link_id?: string | null;
  order_id?: string | null;
  transaction_id?: string | null;
  commission_type: CommissionType;
  amount: number;
  status: CommissionStatus;
  eligible_plan?: string | null;
  created_at: string;
  approved_at?: string | null;
  paid_at?: string | null;
  referred_user?: { email?: string };
}

export interface Reward {
  id: string;
  user_id: string;
  reward_type: RewardType;
  amount?: number | null;
  metadata?: Record<string, unknown> | null;
  earned_at: string;
  redeemed_at?: string | null;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  unlocked_at: string;
}

export interface MarketingAsset {
  id: string;
  asset_type: MarketingAssetType;
  name: string;
  file_url: string;
  description?: string | null;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
}

export interface ReferralAnalytics {
  id: string;
  referral_link_id: string;
  date: string;
  clicks: number;
  signups: number;
  verified_users: number;
  active_users: number;
  trial_starts: number;
  paid_subscriptions: number;
  renewals: number;
  revenue: number;
  ltv: number;
  conversion_rate: number;
}

export interface FraudReview {
  id: string;
  referral_link_id?: string | null;
  affiliate_user_id?: string | null;
  fraud_type: FraudType;
  status: FraudReviewStatus;
  notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface Payout {
  id: string;
  affiliate_user_id: string;
  amount: number;
  status: PayoutStatus;
  payout_method?: string | null;
  requested_at: string;
  approved_at?: string | null;
  paid_at?: string | null;
  failed_reason?: string | null;
}

export interface Leaderboard {
  id: string;
  leaderboard_type: LeaderboardType;
  period: string;
  user_id: string;
  score: number;
  rank?: number | null;
  updated_at: string;
  user?: { email?: string; full_name?: string };
}

export interface Challenge {
  id: string;
  challenge_type: ChallengeType;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  reward?: Record<string, unknown> | null;
  enabled: boolean;
  created_at: string;
}

export interface ReferralStats {
  clicks: number;
  signups: number;
  verified_users: number;
  active_users: number;
  paid_subscriptions: number;
  revenue: number;
  conversions: number;
}

export interface AffiliateEarnings {
  pending: number;
  approved: number;
  paid: number;
}
