-- CLIENTFLOW Supabase / PostgreSQL Migration
-- Initial Schema Creation with RLS, Foreign Keys, and Indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Agency / User Owner)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    agency_name TEXT NOT NULL,
    owner_name TEXT,
    default_pricing TEXT DEFAULT '$2,500',
    services_offered TEXT,
    email_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT NOT NULL,
    location TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'New Lead' CHECK (status IN ('New Lead', 'Audited', 'Qualified', 'Pitch Generated', 'Contacted', 'Replied', 'Interested', 'Meeting Booked', 'Proposal Sent', 'Negotiating', 'Won', 'Lost')),
    source TEXT DEFAULT 'Manual' CHECK (source IN ('Manual', 'CSV Import', 'Directory Search', 'Demo')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT,
    title TEXT,
    email TEXT,
    phone TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Website Audits Table
CREATE TABLE IF NOT EXISTS public.website_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    performance_score INTEGER CHECK (performance_score BETWEEN 0 AND 100),
    accessibility_score INTEGER CHECK (accessibility_score BETWEEN 0 AND 100),
    seo_score INTEGER CHECK (seo_score BETWEEN 0 AND 100),
    best_practices_score INTEGER CHECK (best_practices_score BETWEEN 0 AND 100),
    mobile_usability TEXT,
    has_contact_form BOOLEAN DEFAULT FALSE,
    has_cta BOOLEAN DEFAULT FALSE,
    load_time_seconds NUMERIC(4,2),
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Audit Issues Table
CREATE TABLE IF NOT EXISTS public.audit_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES public.website_audits(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    evidence TEXT,
    severity TEXT CHECK (severity IN ('High', 'Medium', 'Low')),
    solution TEXT,
    opportunity TEXT
);

-- 6. Lead Scores Table
CREATE TABLE IF NOT EXISTS public.lead_scores (
    business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    technical_score INTEGER CHECK (technical_score BETWEEN 0 AND 100),
    opportunity_score INTEGER CHECK (opportunity_score BETWEEN 0 AND 100),
    contact_score INTEGER CHECK (contact_score BETWEEN 0 AND 100),
    reasons_json JSONB,
    manual_adjustment INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Deals & Revenue Table
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    service_sold TEXT NOT NULL,
    proposal_amount NUMERIC(10,2) DEFAULT 0,
    quoted_price NUMERIC(10,2) DEFAULT 0,
    deposit_amount NUMERIC(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Deposit Paid', 'Fully Paid', 'Refunded')),
    project_status TEXT DEFAULT 'Not Started' CHECK (project_status IN ('Not Started', 'In Progress', 'Review', 'Completed')),
    expected_completion DATE,
    contract_status TEXT DEFAULT 'Draft' CHECK (contract_status IN ('Draft', 'Sent', 'Signed', 'Cancelled')),
    final_revenue NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Email Campaigns & Events Tables
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    template TEXT NOT NULL,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Completed', 'Paused')),
    target_industry TEXT,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'Queued' CHECK (status IN ('Queued', 'Sent', 'Delivered', 'Opened', 'Replied', 'Bounced', 'Failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_industry ON public.businesses(industry);
CREATE INDEX IF NOT EXISTS idx_website_audits_business ON public.website_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_deals_business ON public.deals(business_id);
CREATE INDEX IF NOT EXISTS idx_email_events_business ON public.email_events(business_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated owner access
CREATE POLICY "Allow authenticated users full access to profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to businesses" ON public.businesses
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to contacts" ON public.contacts
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to website_audits" ON public.website_audits
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to audit_issues" ON public.audit_issues
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to lead_scores" ON public.lead_scores
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to deals" ON public.deals
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to email_campaigns" ON public.email_campaigns
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users full access to email_events" ON public.email_events
    FOR ALL USING (auth.role() = 'authenticated');
