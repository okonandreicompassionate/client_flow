export interface Business {
  id: string;
  name: string;
  website: string;
  industry: string;
  location: string;
  phone: string;
  email: string;
  status: string;
  source: string;
  notes: string;
  created_at: string;
  score?: number;
}

export interface WebsiteAudit {
  id: string;
  business_id: string;
  business_name: string;
  url: string;
  performance_score: number;
  accessibility_score: number;
  seo_score: number;
  best_practices_score: number;
  mobile_usability: string;
  has_contact_form: boolean;
  has_cta: boolean;
  load_time_seconds: number;
  created_at: string;
}

export interface AuditIssue {
  id: string;
  audit_id: string;
  title: string;
  description: string;
  evidence: string;
  severity: 'High' | 'Medium' | 'Low';
  solution: string;
  opportunity: string;
}

export interface EmailDraft {
  id: string;
  business_id: string;
  business_name: string;
  business_email: string;
  subject: string;
  body: string;
  alternative_body: string;
  recommended_service: string;
  pricing_range: string;
  rationale: string;
  status: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  template: string;
  status: string;
  target_industry: string;
  sent_count: number;
  open_count: number;
  reply_count: number;
  created_at: string;
}

export interface Deal {
  id: string;
  business_id: string;
  client_name: string;
  service_sold: string;
  proposal_amount: number;
  quoted_price: number;
  deposit_amount: number;
  payment_status: string;
  project_status: string;
  expected_completion: string;
  contract_status: string;
  final_revenue: number;
  created_at: string;
  business_name?: string;
}

export interface Stats {
  totalBusinesses: number;
  qualifiedLeads: number;
  auditedWebsites: number;
  draftsCount: number;
  sentCount: number;
  repliesCount: number;
  interestedCount: number;
  proposalsCount: number;
  wonCount: number;
  totalRevenue: number;
}
