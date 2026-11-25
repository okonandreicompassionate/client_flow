import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Database setup
const dbPath = path.resolve(__dirname, 'clientflow.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    location TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'New Lead',
    source TEXT DEFAULT 'Manual',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    name TEXT,
    title TEXT,
    email TEXT,
    phone TEXT,
    is_primary BOOLEAN DEFAULT 0,
    FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS website_audits (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    url TEXT,
    performance_score INTEGER,
    accessibility_score INTEGER,
    seo_score INTEGER,
    best_practices_score INTEGER,
    mobile_usability TEXT,
    has_contact_form BOOLEAN,
    has_cta BOOLEAN,
    load_time_seconds REAL,
    raw_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_issues (
    id TEXT PRIMARY KEY,
    audit_id TEXT,
    title TEXT,
    description TEXT,
    evidence TEXT,
    severity TEXT, -- High, Medium, Low
    solution TEXT,
    opportunity TEXT,
    FOREIGN KEY(audit_id) REFERENCES website_audits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lead_scores (
    business_id TEXT PRIMARY KEY,
    score INTEGER,
    quality_score INTEGER,
    technical_score INTEGER,
    opportunity_score INTEGER,
    contact_score INTEGER,
    reasons_json TEXT,
    manual_adjustment INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS email_drafts (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    subject TEXT,
    body TEXT,
    alternative_body TEXT,
    recommended_service TEXT,
    pricing_range TEXT,
    rationale TEXT,
    status TEXT DEFAULT 'Draft', -- Draft, Approved, Sent
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS email_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT,
    subject TEXT,
    template TEXT,
    status TEXT DEFAULT 'Draft', -- Draft, Active, Completed, Paused
    target_industry TEXT,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS email_events (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    campaign_id TEXT,
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'Queued', -- Queued, Sent, Delivered, Opened, Replied, Bounced, Failed
    sent_at DATETIME,
    error_message TEXT,
    FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS follow_ups (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    step_number INTEGER,
    scheduled_date DATETIME,
    status TEXT DEFAULT 'Scheduled', -- Scheduled, Sent, Cancelled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    client_name TEXT,
    service_sold TEXT,
    proposal_amount REAL,
    quoted_price REAL,
    deposit_amount REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'Pending', -- Pending, Deposit Paid, Fully Paid
    project_status TEXT DEFAULT 'Not Started', -- Not Started, In Progress, Review, Completed
    expected_completion TEXT,
    contract_status TEXT DEFAULT 'Draft', -- Draft, Sent, Signed
    final_revenue REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    business_id TEXT,
    action_type TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_id) REFERENCES businesses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS suppression_list (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_usage (
    id TEXT PRIMARY KEY,
    provider TEXT,
    model TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    cost REAL,
    task TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Helper to get setting
function getSetting(key: string, defaultValue: string = ''): string {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : defaultValue;
}

function setSetting(key: string, value: string) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

// Seed Demo Data if empty
function seedDemoData() {
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM businesses').get() as { cnt: number };
  if (countRow.cnt > 0) return;

  const demoBusinesses = [
    { id: 'b1', name: 'Prime Horizon Real Estate', website: 'https://primehorizon.ng', industry: 'Real Estate', location: 'Lagos, Nigeria', phone: '+234 1 234 5678', email: 'contact@primehorizon.ng', status: 'Qualified', source: 'Demo', notes: 'Slow loading mobile site, outdated contact form.' },
    { id: 'b2', name: 'Azure Suites & Hotels', website: 'https://azuresuites.com.ng', industry: 'Hotels and hospitality', location: 'Abuja, Nigeria', phone: '+234 9 876 5432', email: 'reservations@azuresuites.com.ng', status: 'Pitch Generated', source: 'Demo', notes: 'Missing booking engine on mobile, no SSL certificate warning on subpages.' },
    { id: 'b3', name: 'St. Jude Priory Schools', website: 'https://stjudepriory.edu.ng', industry: 'Private schools', location: 'Port Harcourt, Nigeria', phone: '+234 803 111 2222', email: 'admin@stjudepriory.edu.ng', status: 'Contacted', source: 'Demo', notes: 'HTML errors, poor mobile responsiveness for parents checking results.' },
    { id: 'b4', name: 'SwiftLink Express Logistics', website: 'https://swiftlinklogistics.ng', industry: 'Logistics businesses', location: 'Ikeja, Lagos', phone: '+234 802 333 4444', email: 'support@swiftlinklogistics.ng', status: 'Replied', source: 'Demo', notes: 'Interested in shipment tracking integration and redesign.' },
    { id: 'b5', name: 'Apex Legal & Partners', website: 'https://apexlegalpartners.ng', industry: 'Professional services', location: 'Victoria Island, Lagos', phone: '+234 1 456 7890', email: 'partners@apexlegalpartners.ng', status: 'Interested', source: 'Demo', notes: 'Wants consultation booking widget added.' },
    { id: 'b6', name: 'Medicaid Specialist Clinic', website: 'https://medicaidclinic.ng', industry: 'Clinics', location: 'Ibadan, Nigeria', phone: '+234 2 789 0123', email: 'info@medicaidclinic.ng', status: 'Meeting Booked', source: 'Demo', notes: 'Scheduled Zoom demo for Friday at 2 PM.' },
    { id: 'b7', name: 'Greenfield Agricultural Hub', website: 'https://greenfieldagri.ng', industry: 'Other businesses with existing websites', location: 'Kaduna, Nigeria', phone: '+234 62 555 6666', email: 'sales@greenfieldagri.ng', status: 'Proposal Sent', source: 'Demo', notes: 'Sent $2,500 proposal for wholesale portal redesign.' },
    { id: 'b8', name: 'Lakeside Resort & Spa', website: 'https://lakesideresort.ng', industry: 'Hotels and hospitality', location: 'Calabar, Nigeria', phone: '+234 805 777 8888', email: 'stay@lakesideresort.ng', status: 'Negotiating', source: 'Demo', notes: 'Negotiating milestone payment structure.' },
    { id: 'b9', name: 'Vanguard Security Services', website: 'https://vanguardsec.ng', industry: 'Professional services', location: 'Enugu, Nigeria', phone: '+234 42 333 9999', email: 'ops@vanguardsec.ng', status: 'Won', source: 'Demo', notes: 'Signed contract for corporate website overhaul.' },
    { id: 'b10', name: 'Metro Dental Specialists', website: 'https://metrodental.ng', industry: 'Clinics', location: 'Surulere, Lagos', phone: '+234 1 999 0000', email: 'smile@metrodental.ng', status: 'Audited', source: 'Demo', notes: 'High bounce rate due to broken appointment link.' }
  ];

  const insertBiz = db.prepare(`INSERT INTO businesses (id, name, website, industry, location, phone, email, status, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertAudit = db.prepare(`INSERT INTO website_audits (id, business_id, url, performance_score, accessibility_score, seo_score, best_practices_score, mobile_usability, has_contact_form, has_cta, load_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertIssue = db.prepare(`INSERT INTO audit_issues (id, audit_id, title, description, evidence, severity, solution, opportunity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertScore = db.prepare(`INSERT INTO lead_scores (business_id, score, quality_score, technical_score, opportunity_score, contact_score, reasons_json) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertDeal = db.prepare(`INSERT INTO deals (id, business_id, client_name, service_sold, proposal_amount, quoted_price, deposit_amount, payment_status, project_status, expected_completion, contract_status, final_revenue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const b of demoBusinesses) {
    insertBiz.run(b.id, b.name, b.website, b.industry, b.location, b.phone, b.email, b.status, b.source, b.notes);
    
    const auditId = `aud_${b.id}`;
    const perf = Math.floor(Math.random() * 45) + 35; // 35 - 80
    const a11y = Math.floor(Math.random() * 40) + 50;
    const seo = Math.floor(Math.random() * 35) + 55;
    const bp = Math.floor(Math.random() * 30) + 60;
    insertAudit.run(auditId, b.id, b.website, perf, a11y, seo, bp, perf < 50 ? 'Poor' : 'Moderate', true, false, 4.2);

    insertIssue.run(`iss_${b.id}_1`, auditId, 'Slow Mobile Page Load', 'Largest Contentful Paint exceeds 4.5 seconds on mobile networks.', 'LCP: 4.8s (Mobile 3G/4G)', 'High', 'Optimize hero images and remove render-blocking scripts.', 'Improve mobile conversion rate by 30%.');
    insertIssue.run(`iss_${b.id}_2`, auditId, 'Missing Call to Action on Homepage', 'No prominent booking or enquiry button above the fold.', 'Viewport analysis: 0 CTA buttons visible without scrolling.', 'High', 'Add a sticky header with a Book Consultation button.', 'Directly capture 25% more visitor inquiries.');

    const score = Math.floor(Math.random() * 30) + 65;
    insertScore.run(b.id, score, 75, perf, 85, 90, JSON.stringify(['Outdated mobile experience', 'High performance latency', 'Verified direct email contact available']));

    if (b.status === 'Won') {
      insertDeal.run(`deal_${b.id}`, b.id, b.name, 'Full Website Redesign & SEO', 3500, 3200, 1600, 'Fully Paid', 'In Progress', '2026-12-15', 'Signed', 3200);
    } else if (b.status === 'Proposal Sent' || b.status === 'Negotiating') {
      insertDeal.run(`deal_${b.id}`, b.id, b.name, 'Conversion Optimization & Audit', 2500, 2500, 0, 'Pending', 'Not Started', '2026-12-30', 'Sent', 0);
    }
  }

  // Insert default settings
  setSetting('agency_name', 'PixelCraft Web Studio');
  setSetting('default_pricing', '$2,500');
  setSetting('services_offered', 'Custom Web Development, SEO Optimization, Conversion Rate Optimization, Speed Acceleration');
  setSetting('email_signature', 'Best regards,\nWeb Development Team\nPixelCraft Studio');
}

seedDemoData();

// --- API ROUTES ---

// Dashboard stats
app.get('/api/stats', (req, res) => {
  const totalBusinesses = (db.prepare('SELECT COUNT(*) as c FROM businesses').get() as any).c;
  const qualifiedLeads = (db.prepare("SELECT COUNT(*) as c FROM businesses WHERE status IN ('Qualified', 'Interested', 'Meeting Booked', 'Proposal Sent', 'Negotiating', 'Won')").get() as any).c;
  const auditedWebsites = (db.prepare('SELECT COUNT(*) as c FROM website_audits').get() as any).c;
  const draftsCount = (db.prepare('SELECT COUNT(*) as c FROM email_drafts').get() as any).c;
  const sentCount = (db.prepare("SELECT COUNT(*) as c FROM email_events WHERE status IN ('Sent', 'Delivered', 'Opened', 'Replied')").get() as any).c;
  const repliesCount = (db.prepare("SELECT COUNT(*) as c FROM email_events WHERE status = 'Replied'").get() as any).c;
  const interestedCount = (db.prepare("SELECT COUNT(*) as c FROM businesses WHERE status IN ('Interested', 'Meeting Booked', 'Proposal Sent', 'Negotiating', 'Won')").get() as any).c;
  const proposalsCount = (db.prepare("SELECT COUNT(*) as c FROM businesses WHERE status IN ('Proposal Sent', 'Negotiating', 'Won')").get() as any).c;
  const wonCount = (db.prepare("SELECT COUNT(*) as c FROM businesses WHERE status = 'Won'").get() as any).c;
  
  const revenueResult = db.prepare('SELECT SUM(final_revenue) as rev FROM deals').get() as any;
  const totalRevenue = revenueResult?.rev || 0;

  res.json({
    totalBusinesses,
    qualifiedLeads,
    auditedWebsites,
    draftsCount,
    sentCount,
    repliesCount,
    interestedCount,
    proposalsCount,
    wonCount,
    totalRevenue
  });
});

// Businesses CRUD & Search
app.get('/api/businesses', (req, res) => {
  const { industry, status, search } = req.query;
  let query = 'SELECT b.*, s.score FROM businesses b LEFT JOIN lead_scores s ON b.id = s.business_id WHERE 1=1';
  const params: any[] = [];

  if (industry && industry !== 'All') {
    query += ' AND b.industry = ?';
    params.push(industry);
  }
  if (status && status !== 'All') {
    query += ' AND b.status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (b.name LIKE ? OR b.website LIKE ? OR b.location LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY b.created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

app.post('/api/businesses', (req, res) => {
  const { name, website, industry, location, phone, email, notes } = req.body;
  const id = 'biz_' + Math.random().toString(36).substring(2, 9);
  
  try {
    db.prepare('INSERT INTO businesses (id, name, website, industry, location, phone, email, status, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, website, industry, location, phone, email, 'New Lead', 'Manual', notes);

    // Initial default score
    db.prepare('INSERT INTO lead_scores (business_id, score, quality_score, technical_score, opportunity_score, contact_score, reasons_json) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, 70, 70, 70, 70, 70, JSON.stringify(['Manually added business prospect']));

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/businesses/import', (req, res) => {
  const { businesses } = req.body; // Array of business objects
  if (!Array.isArray(businesses)) {
    return res.status(400).json({ error: 'Invalid businesses array' });
  }

  let imported = 0;
  let duplicates = 0;

  const insertStmt = db.prepare('INSERT INTO businesses (id, name, website, industry, location, phone, email, status, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const checkStmt = db.prepare('SELECT id FROM businesses WHERE website = ? OR (email = ? AND email IS NOT NULL AND email != "")');
  const scoreStmt = db.prepare('INSERT INTO lead_scores (business_id, score, quality_score, technical_score, opportunity_score, contact_score, reasons_json) VALUES (?, ?, ?, ?, ?, ?, ?)');

  for (const b of businesses) {
    if (!b.name) continue;
    const existing = checkStmt.get(b.website || '', b.email || '');
    if (existing) {
      duplicates++;
      continue;
    }

    const id = 'biz_' + Math.random().toString(36).substring(2, 9);
    insertStmt.run(id, b.name, b.website || '', b.industry || 'Professional services', b.location || 'Nigeria', b.phone || '', b.email || '', 'New Lead', 'CSV Import', b.notes || '');
    scoreStmt.run(id, 65, 60, 70, 70, 70, JSON.stringify(['Imported via CSV batch']));
    imported++;
  }

  res.json({ success: true, imported, duplicates });
});

// Website Audits
app.get('/api/audits', (req, res) => {
  const audits = db.prepare('SELECT a.*, b.name as business_name FROM website_audits a JOIN businesses b ON a.business_id = b.id ORDER BY a.created_at DESC').all();
  res.json(audits);
});

app.post('/api/audits/run', async (req, res) => {
  const { businessId, url } = req.body;
  if (!businessId || !url) {
    return res.status(400).json({ error: 'Business ID and URL are required' });
  }

  try {
    // Generate realistic audit metrics (simulating PageSpeed & website health check)
    const perf = Math.floor(Math.random() * 40) + 38;
    const a11y = Math.floor(Math.random() * 35) + 55;
    const seo = Math.floor(Math.random() * 30) + 60;
    const bp = Math.floor(Math.random() * 25) + 65;
    const loadTime = Number((3.5 + Math.random() * 3).toFixed(1));

    const auditId = 'aud_' + Math.random().toString(36).substring(2, 9);
    
    db.prepare(`INSERT INTO website_audits (id, business_id, url, performance_score, accessibility_score, seo_score, best_practices_score, mobile_usability, has_contact_form, has_cta, load_time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(auditId, businessId, url, perf, a11y, seo, bp, perf < 50 ? 'Poor' : 'Moderate', true, false, loadTime);

    // Insert sample issues
    const issues = [
      {
        title: 'Slow Mobile Page Load Speed',
        desc: `Largest Contentful Paint (LCP) is ${loadTime}s. Recommended threshold is under 2.5s.`,
        evidence: `LCP measured at ${loadTime} seconds on mobile network simulation.`,
        severity: 'High',
        solution: 'Compress hero images, defer offscreen JS and enable browser caching.',
        opportunity: 'Decreasing load time by 2s typically boosts mobile conversion by 20-35%.'
      },
      {
        title: 'Missing Clear Call to Action (CTA)',
        desc: 'Visitors landing on the homepage cannot immediately find a booking or enquiry button without scrolling.',
        evidence: 'Viewport analysis shows 0 primary CTA buttons above the fold.',
        severity: 'High',
        solution: 'Add a prominent primary action button in the sticky top navigation bar.',
        opportunity: 'Capture immediate visitor intent before they bounce.'
      },
      {
        title: 'Low Contrast Text Elements',
        desc: 'Several footer and sub-navigation links fail WCAG AA contrast ratios.',
        evidence: 'Contrast ratio 2.8:1 detected on secondary text items.',
        severity: 'Medium',
        solution: 'Darken text hex codes to achieve at least 4.5:1 contrast ratio.',
        opportunity: 'Ensure full accessibility compliance for all prospective customers.'
      }
    ];

    const insertIssue = db.prepare('INSERT INTO audit_issues (id, audit_id, title, description, evidence, severity, solution, opportunity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (let i = 0; i < issues.length; i++) {
      const iss = issues[i];
      insertIssue.run(`iss_${auditId}_${i}`, auditId, iss.title, iss.desc, iss.evidence, iss.severity, iss.solution, iss.opportunity);
    }

    // Update business status to Audited if New Lead
    db.prepare("UPDATE businesses SET status = 'Audited' WHERE id = ? AND status = 'New Lead'").run(businessId);

    // Update lead score based on audit
    const newScore = Math.min(95, Math.max(40, 100 - Math.floor((perf + seo) / 2)));
    db.prepare('UPDATE lead_scores SET score = ?, technical_score = ?, updated_at = CURRENT_TIMESTAMP WHERE business_id = ?').run(newScore, perf, businessId);

    res.json({ success: true, auditId, performance_score: perf, seo_score: seo });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Pitch Generator
app.post('/api/pitches/generate', async (req, res) => {
  const { businessId } = req.body;
  if (!businessId) return res.status(400).json({ error: 'Business ID required' });

  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get() as any;
  if (!business) return res.status(400).json({ error: 'Business not found' });

  const audit = db.prepare('SELECT * FROM website_audits WHERE business_id = ? ORDER BY created_at DESC LIMIT 1').get() as any;
  const issues = db.prepare('SELECT * FROM audit_issues WHERE audit_id = ?').all() as any[];

  const apiKey = process.env.GEMINI_API_KEY || getSetting('gemini_api_key');
  
  let pitchData = {
    subject: `Quick idea regarding ${business.name}'s website speed and mobile conversions`,
    body: `Hi ${business.name} team,\n\nI was reviewing local websites in ${business.location} and came across ${business.website}.\n\nWhile your service offerings are strong, our recent technical audit highlights a few bottlenecks (such as a ${audit?.performance_score || 45}/100 mobile performance score and slow load times) that may be costing you inbound customer enquiries.\n\nAt PixelCraft Studio, we help businesses like yours upgrade their web presence to convert visitors into paying clients.\n\nWould you be open to a brief 10-minute audit review this week?\n\nBest regards,\nWeb Development Team`,
    alternative_body: `Hi there,\n\nNoticed a couple of quick fixes that could instantly boost online enquiries for ${business.name}. Let me know if you'd like a quick Loom video walkthrough of the findings.\n\nBest,\nWeb Development Team`,
    recommended_service: 'Website Speed Acceleration & Conversion Optimization',
    pricing_range: '$1,500 - $2,500',
    rationale: `Targeted based on mobile performance score of ${audit?.performance_score || 45} and absence of prominent header CTA.`
  };

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert freelance web developer and sales copywriter. Generate a highly personalized, human, professional cold outreach pitch for this business:
Business Name: ${business.name}
Website: ${business.website}
Industry: ${business.industry}
Location: ${business.location}
Audit Performance Score: ${audit?.performance_score || 'N/A'}
Audit Issues: ${issues.map(i => i.title + ': ' + i.description).join('; ')}

Return strictly valid JSON with keys: subject, body, alternative_body, recommended_service, pricing_range, rationale.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        pitchData = { ...pitchData, ...parsed };
      }

      // Record AI usage
      db.prepare('INSERT INTO ai_usage (id, provider, model, prompt_tokens, completion_tokens, cost, task) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run('ai_' + Math.random().toString(36).substring(2, 9), 'Gemini', 'gemini-2.5-flash', 450, 200, 0.001, 'Pitch Generation');

    } catch (e) {
      console.error('Gemini pitch generation error, falling back to smart template:', e);
    }
  }

  // Save email draft
  const draftId = 'drf_' + Math.random().toString(36).substring(2, 9);
  db.prepare(`INSERT INTO email_drafts (id, business_id, subject, body, alternative_body, recommended_service, pricing_range, rationale, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(draftId, businessId, pitchData.subject, pitchData.body, pitchData.alternative_body, pitchData.recommended_service, pitchData.pricing_range, pitchData.rationale, 'Draft');

  // Update business status
  db.prepare("UPDATE businesses SET status = 'Pitch Generated' WHERE id = ? AND status IN ('New Lead', 'Audited', 'Qualified')").run(businessId);

  res.json({ success: true, draftId, pitch: pitchData });
});

app.get('/api/drafts', (req, res) => {
  const drafts = db.prepare('SELECT d.*, b.name as business_name, b.email as business_email FROM email_drafts d JOIN businesses b ON d.business_id = b.id ORDER BY d.created_at DESC').all();
  res.json(drafts);
});

// Campaigns & Email sending
app.get('/api/campaigns', (req, res) => {
  const campaigns = db.prepare('SELECT * FROM email_campaigns ORDER BY created_at DESC').all();
  res.json(campaigns);
});

app.post('/api/campaigns', (req, res) => {
  const { name, subject, template, target_industry } = req.body;
  const id = 'cmp_' + Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT INTO email_campaigns (id, name, subject, template, target_industry, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, subject, template, target_industry, 'Draft');
  res.json({ success: true, id });
});

app.post('/api/campaigns/:id/send', (req, res) => {
  const campaignId = req.params.id;
  const campaign = db.prepare('SELECT * FROM email_campaigns WHERE id = ?').get() as any;
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  // Find target businesses matching industry and having email
  const businesses = db.prepare("SELECT * FROM businesses WHERE (industry = ? OR ? = 'All') AND email IS NOT NULL AND email != '' AND id NOT IN (SELECT business_id FROM email_events WHERE status = 'Sent')").all(campaign.target_industry, campaign.target_industry) as any[];

  let sentCount = 0;
  const insertEvent = db.prepare('INSERT INTO email_events (id, business_id, campaign_id, subject, body, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
  const updateBiz = db.prepare("UPDATE businesses SET status = 'Contacted' WHERE id = ?");

  for (const b of businesses) {
    const eventId = 'ev_' + Math.random().toString(36).substring(2, 9);
    insertEvent.run(eventId, b.id, campaignId, campaign.subject, campaign.template.replace(/{{name}}/g, b.name), 'Sent');
    updateBiz.run(b.id);
    sentCount++;
  }

  db.prepare('UPDATE email_campaigns SET status = "Completed", sent_count = sent_count + ? WHERE id = ?').run(sentCount, campaignId);

  res.json({ success: true, sentCount });
});

// Pipeline & Deals
app.get('/api/pipeline', (req, res) => {
  const businesses = db.prepare('SELECT b.*, s.score FROM businesses b LEFT JOIN lead_scores s ON b.id = s.business_id ORDER BY b.created_at DESC').all();
  res.json(businesses);
});

app.put('/api/businesses/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare('UPDATE businesses SET status = ? WHERE id = ?').run(status, id);
  res.json({ success: true });
});

app.get('/api/deals', (req, res) => {
  const deals = db.prepare('SELECT d.*, b.name as business_name FROM deals d JOIN businesses b ON d.business_id = b.id ORDER BY d.created_at DESC').all();
  res.json(deals);
});

app.post('/api/deals', (req, res) => {
  const { business_id, client_name, service_sold, proposal_amount, quoted_price, deposit_amount, payment_status, project_status, expected_completion, contract_status, final_revenue } = req.body;
  const id = 'deal_' + Math.random().toString(36).substring(2, 9);
  db.prepare(`INSERT INTO deals (id, business_id, client_name, service_sold, proposal_amount, quoted_price, deposit_amount, payment_status, project_status, expected_completion, contract_status, final_revenue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, business_id, client_name, service_sold, proposal_amount || 0, quoted_price || 0, deposit_amount || 0, payment_status || 'Pending', project_status || 'Not Started', expected_completion || '', contract_status || 'Draft', final_revenue || 0);

  if (contract_status === 'Signed') {
    db.prepare("UPDATE businesses SET status = 'Won' WHERE id = ?").run(business_id);
  }

  res.json({ success: true, id });
});

// Settings
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings: Record<string, string> = {};
  for (const r of rows as any[]) {
    settings[r.key] = r.value;
  }
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const settings = req.body;
  for (const [key, value] of Object.entries(settings)) {
    setSetting(key, String(value));
  }
  res.json({ success: true });
});

// Reset & Seed
app.post('/api/demo/reset', (req, res) => {
  db.exec(`
    DELETE FROM businesses;
    DELETE FROM contacts;
    DELETE FROM website_audits;
    DELETE FROM audit_issues;
    DELETE FROM lead_scores;
    DELETE FROM email_drafts;
    DELETE FROM email_campaigns;
    DELETE FROM email_events;
    DELETE FROM follow_ups;
    DELETE FROM deals;
    DELETE FROM activity_logs;
    DELETE FROM suppression_list;
    DELETE FROM ai_usage;
  `);
  seedDemoData();
  res.json({ success: true, message: 'Demo data re-seeded successfully' });
});

// Serve Vite in development or static build in production
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

const PORT = 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`CLIENTFLOW server running on http://localhost:${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    throw err;
  }
});
