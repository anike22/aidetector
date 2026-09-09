export interface PlanTier {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  annualMonthlyEquivalent: number;
  monthlyCredits: number;
  trialChecks: number;
  highlight?: boolean;
  badge?: string;
  features: string[];
  limits: {
    maxWordsPerCheck: number;
    maxVideoSeconds: number;
    concurrency: number;
    apiAccess: boolean;
    forensicMode: boolean;
    teamSeats: number;
    exportFormats: string[];
  };
}

export const PLAN_TIERS: Record<string, PlanTier> = {
  free: {
    id: 'free',
    name: 'Free Trial',
    tagline: '5 one-time introductory checks to evaluate accuracy and speed',
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthlyEquivalent: 0,
    monthlyCredits: 0,
    trialChecks: 5,
    features: [
      '1 guest check + 4 signed-in trial checks (5 total introductory)',
      'Standard Text Detection (Balanced engine)',
      'Humanizer (Standard mode up to 1,000 words)',
      'Plagiarism Checker (Standard scope up to 1,000 words)',
      'SEO Assistant (Standard report up to 1,000 words)',
      'Standard Image Detection (Balanced)',
      'Standard Video Detection (Balanced, up to 30s)',
      'Voice & Audio Detection (up to 1 min)',
      'No recurring daily or monthly resets',
    ],
    limits: {
      maxWordsPerCheck: 1000,
      maxVideoSeconds: 30,
      concurrency: 1,
      apiAccess: false,
      forensicMode: false,
      teamSeats: 1,
      exportFormats: ['Summary'],
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For professional writers, creators, and solo researchers',
    monthlyPrice: 12,
    annualPrice: 120,
    annualMonthlyEquivalent: 10,
    monthlyCredits: 300,
    trialChecks: 0,
    badge: 'Popular',
    features: [
      '300 monthly credits (refilled monthly on annual & monthly plans)',
      'Aggressive & High-Sensitivity Dual Detection',
      'Full Humanizer & Rewrite engine modes',
      'Full Plagiarism deep database search',
      'Advanced Image & Deepfake analysis (4 cr/image)',
      'Citation verification & Hallucination checking',
      'Writing Monitor & Verified Authorship support',
      'Up to 10,000 words per scan',
      'PDF, DOCX & CSV full report export',
    ],
    limits: {
      maxWordsPerCheck: 10000,
      maxVideoSeconds: 120,
      concurrency: 3,
      apiAccess: false,
      forensicMode: false,
      teamSeats: 1,
      exportFormats: ['PDF', 'DOCX', 'CSV', 'JSON'],
    },
  },
  pro_plus: {
    id: 'pro_plus',
    name: 'Pro Plus',
    tagline: 'For power users, agencies, and high-volume publishing teams',
    monthlyPrice: 29,
    annualPrice: 290,
    annualMonthlyEquivalent: 24.17,
    monthlyCredits: 1000,
    trialChecks: 0,
    highlight: true,
    badge: 'Best Value',
    features: [
      '1,000 monthly credits (refilled monthly)',
      'Forensic Video & Deepfake analysis (6 cr/30s)',
      'Bulk processing & automated document pipelines',
      'Priority multi-engine AI processing queue',
      'Up to 25,000 words per scan',
      'Full SEO Content Studio automation',
      'Verified Authorship Certificate registration',
      'Priority customer support',
    ],
    limits: {
      maxWordsPerCheck: 25000,
      maxVideoSeconds: 300,
      concurrency: 5,
      apiAccess: false,
      forensicMode: true,
      teamSeats: 1,
      exportFormats: ['PDF', 'DOCX', 'CSV', 'JSON', 'Certificate'],
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'For organizations, teams, and high-throughput content operations',
    monthlyPrice: 79,
    annualPrice: 790,
    annualMonthlyEquivalent: 65.83,
    monthlyCredits: 3000,
    trialChecks: 0,
    features: [
      '3,000 monthly credits with shared team workspace pool',
      'Up to 5 team member seats included',
      'REST API access & Webhook triggers',
      'WordPress & Chrome extension team licensing',
      'Centralized team audit ledger & member tracking',
      'Custom webhook notifications & integrations',
      'Dedicated account manager & SLA guarantee',
    ],
    limits: {
      maxWordsPerCheck: 50000,
      maxVideoSeconds: 600,
      concurrency: 10,
      apiAccess: true,
      forensicMode: true,
      teamSeats: 5,
      exportFormats: ['PDF', 'DOCX', 'CSV', 'JSON', 'Certificate', 'API'],
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Custom volume, dedicated infrastructure, and enterprise governance',
    monthlyPrice: 299,
    annualPrice: 2990,
    annualMonthlyEquivalent: 249,
    monthlyCredits: 15000,
    trialChecks: 0,
    features: [
      'Custom monthly credit pool & dedicated throughput',
      'Unlimited team member seats with role-based access',
      'Custom AI model fine-tuning & domain adaptation',
      'On-premise or private cloud deployment options',
      'Custom SSO/SAML 2.0 & SOC2 compliance reporting',
      '24/7 dedicated engineering support & 99.9% uptime SLA',
    ],
    limits: {
      maxWordsPerCheck: 100000,
      maxVideoSeconds: 1800,
      concurrency: 50,
      apiAccess: true,
      forensicMode: true,
      teamSeats: 999,
      exportFormats: ['ALL'],
    },
  },
};

export interface FeatureRateInfo {
  featureSlug: string;
  name: string;
  trialEligible: boolean;
  baseCreditCost: number;
  billingUnit: 'words_1000' | 'image' | 'video_30s' | 'audio_min' | 'references_5' | 'fixed';
  minPlan: 'guest' | 'free' | 'pro' | 'pro_plus' | 'business' | 'enterprise';
  description: string;
}

export const RATE_TABLE: Record<string, FeatureRateInfo> = {
  text_detect_balanced: {
    featureSlug: 'text_detect_balanced',
    name: 'Text Detection (Balanced)',
    trialEligible: true,
    baseCreditCost: 1,
    billingUnit: 'words_1000',
    minPlan: 'guest',
    description: '1 credit per started 1,000 words per engine',
  },
  text_detect_aggressive: {
    featureSlug: 'text_detect_aggressive',
    name: 'Text Detection (Aggressive)',
    trialEligible: false,
    baseCreditCost: 1,
    billingUnit: 'words_1000',
    minPlan: 'pro',
    description: '1 credit per started 1,000 words per engine (Pro only)',
  },
  humanizer_rewrite: {
    featureSlug: 'humanizer_rewrite',
    name: 'Humanizer Rewrite',
    trialEligible: true,
    baseCreditCost: 3,
    billingUnit: 'words_1000',
    minPlan: 'free',
    description: '3 credits per started 1,000 input words',
  },
  ai_summarizer: {
    featureSlug: 'ai_summarizer',
    name: 'AI Summarizer',
    trialEligible: true,
    baseCreditCost: 2,
    billingUnit: 'words_1000',
    minPlan: 'free',
    description: '2 credits per started 1,000 input words (trial checks cover up to 2,000 words)',
  },
  plagiarism_check: {
    featureSlug: 'plagiarism_check',
    name: 'Plagiarism Checker',
    trialEligible: true,
    baseCreditCost: 2,
    billingUnit: 'words_1000',
    minPlan: 'free',
    description: '2 credits per started 1,000 words',
  },
  seo_assistant: {
    featureSlug: 'seo_assistant',
    name: 'SEO Assistant Report',
    trialEligible: true,
    baseCreditCost: 3,
    billingUnit: 'words_1000',
    minPlan: 'free',
    description: '3 credits per started 1,000 words for standard report',
  },
  image_detect_standard: {
    featureSlug: 'image_detect_standard',
    name: 'Image Detection (Standard)',
    trialEligible: true,
    baseCreditCost: 2,
    billingUnit: 'image',
    minPlan: 'guest',
    description: '2 credits per image analyzed',
  },
  image_detect_advanced: {
    featureSlug: 'image_detect_advanced',
    name: 'Image / Deepfake Detection (Advanced)',
    trialEligible: false,
    baseCreditCost: 4,
    billingUnit: 'image',
    minPlan: 'pro',
    description: '4 credits per image for forensic deepfake analysis',
  },
  video_detect_balanced: {
    featureSlug: 'video_detect_balanced',
    name: 'Video Detection (Balanced)',
    trialEligible: true,
    baseCreditCost: 2,
    billingUnit: 'video_30s',
    minPlan: 'guest',
    description: '2 credits per started 30 seconds',
  },
  video_detect_high_sensitivity: {
    featureSlug: 'video_detect_high_sensitivity',
    name: 'Video Detection (High-Sensitivity)',
    trialEligible: false,
    baseCreditCost: 3,
    billingUnit: 'video_30s',
    minPlan: 'pro',
    description: '3 credits per started 30 seconds',
  },
  video_detect_forensic: {
    featureSlug: 'video_detect_forensic',
    name: 'Video Detection (Forensic Deepfake)',
    trialEligible: false,
    baseCreditCost: 6,
    billingUnit: 'video_30s',
    minPlan: 'pro_plus',
    description: '6 credits per started 30 seconds (Pro Plus only)',
  },
  voice_analysis: {
    featureSlug: 'voice_analysis',
    name: 'Voice & Speech Detection',
    trialEligible: true,
    baseCreditCost: 2,
    billingUnit: 'audio_min',
    minPlan: 'guest',
    description: '2 credits per started audio minute',
  },
  citation_verify: {
    featureSlug: 'citation_verify',
    name: 'Citation Verification',
    trialEligible: false,
    baseCreditCost: 1,
    billingUnit: 'references_5',
    minPlan: 'pro',
    description: '1 credit per 5 references checked',
  },
  hallucination_check: {
    featureSlug: 'hallucination_check',
    name: 'Hallucination Checker',
    trialEligible: false,
    baseCreditCost: 2,
    billingUnit: 'words_1000',
    minPlan: 'pro',
    description: '2 credits per started 1,000 words',
  },
  verified_authorship_register: {
    featureSlug: 'verified_authorship_register',
    name: 'Verified Authorship Registration',
    trialEligible: false,
    baseCreditCost: 5,
    billingUnit: 'fixed',
    minPlan: 'pro',
    description: '5 credits per blockchain/hash registry certificate',
  },
  bulk_processing: {
    featureSlug: 'bulk_processing',
    name: 'Bulk Document Processing',
    trialEligible: false,
    baseCreditCost: 1,
    billingUnit: 'fixed',
    minPlan: 'pro_plus',
    description: '1 credit per document batch item (Pro Plus only)',
  },
  api_access: {
    featureSlug: 'api_access',
    name: 'REST API Request',
    trialEligible: false,
    baseCreditCost: 1,
    billingUnit: 'fixed',
    minPlan: 'business',
    description: '1 credit per API call (Business only)',
  },
};

/**
 * Calculate exact credit cost based on units and rate table.
 */
export function calculateOperationCreditCost(
  featureSlug: string,
  units: {
    words?: number;
    engines?: number;
    images?: number;
    videoSeconds?: number;
    audioMinutes?: number;
    references?: number;
  } = {}
): number {
  const rate = RATE_TABLE[featureSlug];
  if (!rate) return 1;

  switch (rate.billingUnit) {
    case 'words_1000': {
      const words = Math.max(1, units.words || 100);
      const units1k = Math.ceil(words / 1000);
      const engineMultiplier = Math.max(1, units.engines || 1);
      return units1k * rate.baseCreditCost * engineMultiplier;
    }
    case 'image': {
      const count = Math.max(1, units.images || 1);
      return count * rate.baseCreditCost;
    }
    case 'video_30s': {
      const seconds = Math.max(1, units.videoSeconds || 30);
      const slots30s = Math.ceil(seconds / 30);
      return slots30s * rate.baseCreditCost;
    }
    case 'audio_min': {
      const minutes = Math.max(1, units.audioMinutes || 1);
      const slots1m = Math.ceil(minutes);
      return slots1m * rate.baseCreditCost;
    }
    case 'references_5': {
      const refs = Math.max(1, units.references || 5);
      const slots5 = Math.ceil(refs / 5);
      return slots5 * rate.baseCreditCost;
    }
    case 'fixed':
    default:
      return rate.baseCreditCost;
  }
}

/**
 * Check if an operation is eligible for free trial check consumption.
 */
export function isTrialEligibleOperation(featureSlug: string): boolean {
  if (RATE_TABLE[featureSlug]) {
    return RATE_TABLE[featureSlug].trialEligible;
  }
  // Common tool slug aliases
  if (featureSlug === 'ai_detector' || featureSlug === 'ai_image_detector' || featureSlug === 'ai_video_detector' || featureSlug === 'ai_humanizer' || featureSlug === 'ai_summarizer') {
    return true;
  }
  return false;
}

/**
 * Format badge text for Run buttons (e.g. "1 Trial Check" or "3 Credits").
 */
export function formatRunCostLabel(
  featureSlug: string,
  isTrialAvailable: boolean,
  cost: number
): { badge: string; isTrial: boolean; cost: number } {
  const trialEligible = isTrialEligibleOperation(featureSlug);
  if (trialEligible && isTrialAvailable) {
    return { badge: '1 Free Trial Check', isTrial: true, cost: 0 };
  }
  return {
    badge: `${cost} Credit${cost === 1 ? '' : 's'}`,
    isTrial: false,
    cost,
  };
}
