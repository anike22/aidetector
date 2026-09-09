import { supabase } from '@/db/supabase';
import type {
  ReferralLink,
  ReferralJourney,
  AffiliateApplication,
  AffiliateLink,
  Commission,
  Reward,
  Achievement,
  MarketingAsset,
  FraudReview,
  Payout,
  Leaderboard,
  Challenge,
  ReferralStats,
  AffiliateEarnings,
  ReferralLinkType,
  ReferralJourneyStage,
  AffiliateLinkType,
  CommissionType,
  CommissionStatus,
  RewardType,
  AchievementType,
  MarketingAssetType,
  FraudType,
  FraudReviewStatus,
  PayoutStatus,
  AffiliateApplicationStatus,
  AffiliateTier,
  LeaderboardType,
} from '@/types/referral';

// Profiles
export async function getCurrentProfile() {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', (await supabase.auth.getUser()).data.user?.id || '').maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileByReferralCode(code: string) {
  const { data, error } = await supabase.from('profiles').select('id,email,full_name,referral_code,affiliate_status,affiliate_tier,points_balance,credits_balance').eq('referral_code', code).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfileRewards(userId: string, updates: { points_balance?: number; credits_balance?: number; affiliate_status?: string; affiliate_tier?: string }) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

// Referral links
export async function getReferralLinks(userId?: string): Promise<ReferralLink[]> {
  let q = supabase.from('referral_links').select('*').order('created_at', { ascending: false });
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as ReferralLink[]) || [];
}

export async function getReferralLinkByCode(code: string): Promise<ReferralLink | null> {
  const { data, error } = await supabase.from('referral_links').select('*').eq('code', code).maybeSingle();
  if (error) throw error;
  return data as ReferralLink | null;
}

export async function createReferralLink(type: ReferralLinkType = 'direct', orgId?: string): Promise<ReferralLink> {
  const { data: codeData, error: rpcError } = await supabase.rpc('generate_referral_code');
  if (rpcError) throw rpcError;
  const code = codeData as string;
  const payload: Partial<ReferralLink> = { code, link_type: type, attribution_window_days: 30 };
  if (orgId) payload.organization_id = orgId;
  const { data, error } = await supabase.from('referral_links').insert(payload).select().single();
  if (error) throw error;
  return data as ReferralLink;
}

export async function deleteReferralLink(id: string) {
  const { error } = await supabase.from('referral_links').delete().eq('id', id);
  if (error) throw error;
}

// Referral journeys
export async function recordReferralClick(code: string, visitorId: string): Promise<ReferralJourney> {
  const link = await getReferralLinkByCode(code);
  if (!link) throw new Error('Invalid referral code');
  const { data, error } = await supabase.from('referral_journeys').insert({ referral_link_id: link.id, visitor_id: visitorId, stage: 'visitor' }).select().single();
  if (error) throw error;
  return data as ReferralJourney;
}

export async function recordReferralStage(code: string, stage: ReferralJourneyStage, visitorId?: string, referredUserId?: string): Promise<ReferralJourney> {
  const link = await getReferralLinkByCode(code);
  if (!link) throw new Error('Invalid referral code');
  if (stage === 'signup' && referredUserId && link.user_id === referredUserId) {
    throw new Error('Self-referrals are not allowed');
  }
  // Try to update the latest matching visitor row
  if (visitorId) {
    const { data: rows } = await supabase
      .from('referral_journeys')
      .select('id')
      .eq('referral_link_id', link.id)
      .eq('visitor_id', visitorId)
      .order('occurred_at', { ascending: false })
      .limit(1);
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (row) {
      const updates: Partial<ReferralJourney> = { stage };
      if (referredUserId) updates.referred_user_id = referredUserId;
      const { data, error } = await supabase.from('referral_journeys').update(updates).eq('id', row.id).select().single();
      if (!error && data) return data as ReferralJourney;
    }
  }
  const insert: Partial<ReferralJourney> = { referral_link_id: link.id, stage, visitor_id: visitorId || null };
  if (referredUserId) insert.referred_user_id = referredUserId;
  const { data, error } = await supabase.from('referral_journeys').insert(insert).select().single();
  if (error) throw error;
  return data as ReferralJourney;
}

export async function getReferralJourneys(linkId?: string): Promise<ReferralJourney[]> {
  let q = supabase.from('referral_journeys').select('*').order('occurred_at', { ascending: false });
  if (linkId) q = q.eq('referral_link_id', linkId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as ReferralJourney[]) || [];
}

// Stats
export async function getReferralStats(userId?: string): Promise<ReferralStats> {
  const links = await getReferralLinks(userId);
  if (links.length === 0) return { clicks: 0, signups: 0, verified_users: 0, active_users: 0, paid_subscriptions: 0, revenue: 0, conversions: 0 };
  const linkIds = links.map((l) => l.id);
  const { data, error } = await supabase.from('referral_journeys').select('stage').in('referral_link_id', linkIds);
  if (error) throw error;
  const rows = (data as ReferralJourney[]) || [];
  const clicks = rows.filter((r) => r.stage === 'visitor').length;
  const signups = rows.filter((r) => r.stage === 'signup').length;
  const verified = rows.filter((r) => r.stage === 'email_verified').length;
  const active = rows.filter((r) => r.stage === 'first_scan').length;
  const paid = rows.filter((r) => r.stage === 'subscription').length;
  const revenue = paid * 9.99; // placeholder estimate
  return {
    clicks,
    signups,
    verified_users: verified,
    active_users: active,
    paid_subscriptions: paid,
    revenue,
    conversions: paid,
  };
}

// Affiliate applications
export async function getAffiliateApplications(status?: AffiliateApplicationStatus): Promise<AffiliateApplication[]> {
  let q = supabase.from('affiliate_applications').select('*, user:profiles!affiliate_applications_user_id_fkey(email, full_name)').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data as AffiliateApplication[]) || [];
}

export async function getMyAffiliateApplication(): Promise<AffiliateApplication | null> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;
  const { data, error } = await supabase.from('affiliate_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as AffiliateApplication | null;
}

export async function applyForAffiliate(payload: { website?: string; social_profiles?: string; marketing_experience?: string }): Promise<AffiliateApplication> {
  const { data, error } = await supabase.from('affiliate_applications').insert(payload).select().single();
  if (error) throw error;
  return data as AffiliateApplication;
}

export async function updateAffiliateApplicationStatus(id: string, status: AffiliateApplicationStatus, tier?: AffiliateTier): Promise<AffiliateApplication> {
  const updates: Partial<AffiliateApplication> = { status };
  if (tier) updates.tier = tier;
  if (status === 'Approved' || status === 'Rejected') {
    updates.reviewed_at = new Date().toISOString();
  }
  const { data, error } = await supabase.from('affiliate_applications').update(updates).eq('id', id).select().single();
  if (error) throw error;
  // Sync profile status when approved
  if (status === 'Approved' || status === 'Rejected' || status === 'Suspended' || status === 'Terminated') {
    const app = data as AffiliateApplication;
    const profileStatus = status === 'Approved' ? 'active' : status === 'Rejected' ? 'none' : status.toLowerCase();
    await updateProfileRewards(app.user_id, { affiliate_status: profileStatus, affiliate_tier: tier || app.tier });
  }
  return data as AffiliateApplication;
}

// Affiliate links
export async function getAffiliateLinks(userId?: string): Promise<AffiliateLink[]> {
  let q = supabase.from('affiliate_links').select('*').order('created_at', { ascending: false });
  if (userId) q = q.eq('affiliate_user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as AffiliateLink[]) || [];
}

export async function createAffiliateLink(type: AffiliateLinkType, campaignName?: string, couponCode?: string): Promise<AffiliateLink> {
  const { data, error } = await supabase.from('affiliate_links').insert({ link_type: type, campaign_name: campaignName, coupon_code: couponCode }).select().single();
  if (error) throw error;
  return data as AffiliateLink;
}

export async function deleteAffiliateLink(id: string) {
  const { error } = await supabase.from('affiliate_links').delete().eq('id', id);
  if (error) throw error;
}

// Commissions
export async function getCommissions(filters?: { userId?: string; status?: CommissionStatus }): Promise<Commission[]> {
  let q = supabase.from('commissions').select('*, referred_user:profiles!commissions_referred_user_id_fkey(email)').order('created_at', { ascending: false });
  if (filters?.userId) q = q.eq('affiliate_user_id', filters.userId);
  if (filters?.status) q = q.eq('status', filters.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Commission[]) || [];
}

export function calculateCommission(amount: number, type: CommissionType, rate: number): number {
  if (type === 'Percentage') return Number(((amount * rate) / 100).toFixed(2));
  return Number(rate.toFixed(2));
}

export async function createCommission(payload: Partial<Commission>): Promise<Commission> {
  const { data, error } = await supabase.from('commissions').insert(payload).select().single();
  if (error) throw error;
  return data as Commission;
}

export async function approveCommission(id: string): Promise<Commission> {
  const { data, error } = await supabase.from('commissions').update({ status: 'Approved', approved_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as Commission;
}

export async function payCommission(id: string): Promise<Commission> {
  const { data, error } = await supabase.from('commissions').update({ status: 'Paid', paid_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as Commission;
}

export async function getAffiliateEarnings(userId: string): Promise<AffiliateEarnings> {
  const { data, error } = await supabase.from('commissions').select('amount, status').eq('affiliate_user_id', userId);
  if (error) throw error;
  const rows = (data as { amount: number; status: CommissionStatus }[]) || [];
  const pending = rows.filter((r) => r.status === 'Pending' || r.status === 'Held').reduce((s, r) => s + r.amount, 0);
  const approved = rows.filter((r) => r.status === 'Approved').reduce((s, r) => s + r.amount, 0);
  const paid = rows.filter((r) => r.status === 'Paid').reduce((s, r) => s + r.amount, 0);
  return { pending, approved, paid };
}

// Rewards
export async function getRewards(userId?: string): Promise<Reward[]> {
  let q = supabase.from('rewards').select('*').order('earned_at', { ascending: false });
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Reward[]) || [];
}

export async function createReward(payload: Partial<Reward>): Promise<Reward> {
  const { data, error } = await supabase.from('rewards').insert(payload).select().single();
  if (error) throw error;
  return data as Reward;
}

export async function redeemReward(id: string): Promise<Reward> {
  const { data, error } = await supabase.from('rewards').update({ redeemed_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as Reward;
}

// Achievements
export async function getAchievements(userId?: string): Promise<Achievement[]> {
  let q = supabase.from('achievements').select('*').order('unlocked_at', { ascending: false });
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Achievement[]) || [];
}

export async function awardAchievement(userId: string, type: AchievementType): Promise<Achievement> {
  const { data: existing } = await supabase.from('achievements').select('id').eq('user_id', userId).eq('achievement_type', type).maybeSingle();
  if (existing) return existing as Achievement;
  const { data, error } = await supabase.from('achievements').insert({ user_id: userId, achievement_type: type }).select().single();
  if (error) throw error;
  return data as Achievement;
}

// Marketing assets
export async function getMarketingAssets(type?: MarketingAssetType): Promise<MarketingAsset[]> {
  let q = supabase.from('marketing_assets').select('*').order('uploaded_at', { ascending: false });
  if (type) q = q.eq('asset_type', type);
  const { data, error } = await q;
  if (error) throw error;
  return (data as MarketingAsset[]) || [];
}

export async function createMarketingAsset(payload: Partial<MarketingAsset>): Promise<MarketingAsset> {
  const { data, error } = await supabase.from('marketing_assets').insert(payload).select().single();
  if (error) throw error;
  return data as MarketingAsset;
}

export async function updateMarketingAsset(id: string, payload: Partial<MarketingAsset>): Promise<MarketingAsset> {
  const { data, error } = await supabase.from('marketing_assets').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as MarketingAsset;
}

export async function deleteMarketingAsset(id: string) {
  const { error } = await supabase.from('marketing_assets').delete().eq('id', id);
  if (error) throw error;
}

// Fraud reviews
export async function getFraudReviews(status?: FraudReviewStatus): Promise<FraudReview[]> {
  let q = supabase.from('fraud_reviews').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data as FraudReview[]) || [];
}

export async function createFraudReview(payload: Partial<FraudReview>): Promise<FraudReview> {
  const { data, error } = await supabase.from('fraud_reviews').insert(payload).select().single();
  if (error) throw error;
  return data as FraudReview;
}

export async function updateFraudReviewStatus(id: string, status: FraudReviewStatus, notes?: string): Promise<FraudReview> {
  const updates: Partial<FraudReview> = { status };
  if (notes) updates.notes = notes;
  updates.reviewed_at = new Date().toISOString();
  const { data, error } = await supabase.from('fraud_reviews').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as FraudReview;
}

// Payouts
export async function getPayouts(filters?: { userId?: string; status?: PayoutStatus }): Promise<Payout[]> {
  let q = supabase.from('payouts').select('*').order('requested_at', { ascending: false });
  if (filters?.userId) q = q.eq('affiliate_user_id', filters.userId);
  if (filters?.status) q = q.eq('status', filters.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Payout[]) || [];
}

export async function requestPayout(amount: number, method?: string): Promise<Payout> {
  const { data, error } = await supabase.from('payouts').insert({ amount, payout_method: method }).select().single();
  if (error) throw error;
  return data as Payout;
}

export async function updatePayoutStatus(id: string, status: PayoutStatus, failedReason?: string): Promise<Payout> {
  const updates: Partial<Payout> = { status };
  if (status === 'Paid') updates.paid_at = new Date().toISOString();
  if (status === 'Approved') updates.approved_at = new Date().toISOString();
  if (failedReason) updates.failed_reason = failedReason;
  const { data, error } = await supabase.from('payouts').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Payout;
}

// Leaderboards & challenges
export async function getLeaderboards(type?: LeaderboardType, period?: string): Promise<Leaderboard[]> {
  let q = supabase.from('leaderboards').select('*, user:profiles!leaderboards_user_id_fkey(email, full_name)').order('rank', { ascending: true });
  if (type) q = q.eq('leaderboard_type', type);
  if (period) q = q.eq('period', period);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Leaderboard[]) || [];
}

export async function getChallenges(enabledOnly = true): Promise<Challenge[]> {
  let q = supabase.from('challenges').select('*').order('start_date', { ascending: false });
  if (enabledOnly) q = q.eq('enabled', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Challenge[]) || [];
}

export async function createChallenge(payload: Partial<Challenge>): Promise<Challenge> {
  const { data, error } = await supabase.from('challenges').insert(payload).select().single();
  if (error) throw error;
  return data as Challenge;
}

export async function updateChallenge(id: string, payload: Partial<Challenge>): Promise<Challenge> {
  const { data, error } = await supabase.from('challenges').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as Challenge;
}

export async function deleteChallenge(id: string) {
  const { error } = await supabase.from('challenges').delete().eq('id', id);
  if (error) throw error;
}
