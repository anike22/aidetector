export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  subscription_plan: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface SellerProduct {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
  demo_url: string | null;
  tags: string[];
  status: ProductStatus;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

// --- AI Business Growth Intelligence (Prospecting) ---

export interface ProspectingProject {
  id: string;
  user_id: string;
  name: string;
  target_country: string;
  business_type: string;
  company_size: string;
  decision_maker_role: string[];
  goal: string;
  status: string;
  created_at: string;
  updated_at: string;
  
  // Calculated UI fields (optional)
  total_companies?: number;
  total_decision_makers?: number;
  average_lead_score?: number;
}

export interface ProspectingCompany {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  website: string | null;
  industry: string | null;
  employees: string | null;
  revenue_estimate: string | null;
  location: string | null;
  social_profiles: any; // jsonb
  contact_page: string | null;
  lead_score: number | null;
  phone?: string | null;
  email?: string | null;
  score_reason?: string | null;
  created_at: string;
}

export interface ProspectingDecisionMaker {
  id: string;
  company_id: string;
  user_id: string;
  name: string;
  job_title: string | null;
  level: number | null;
  linkedin_profile: string | null;
  email: string | null;
  phone: string | null;
  buying_intent_score: number | null;
  buying_intent_label: string | null;
  investment_probability: number | null;
  opportunity_detection: string | null;
  created_at: string;
}

export interface ProspectingOutreachMessage {
  id: string;
  decision_maker_id: string | null;
  user_id: string;
  outreach_type: string;
  tone: string | null;
  key_points: string | null;
  generated_message: string;
  created_at: string;
}

export interface ProspectingCrmLead {
  id: string;
  user_id: string;
  company_name: string;
  decision_maker_name: string | null;
  lead_score: number | null;
  stage: string;
  last_activity: string | null;
  next_action: string | null;
  details: any; // jsonb
  created_at: string;
  updated_at: string;
}
