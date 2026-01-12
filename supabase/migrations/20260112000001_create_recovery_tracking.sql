-- Migration: Create Recovery Tracking Tables
-- Version: 2.3
-- Date: 2026-01-12
-- Description: Creates tables for claim tracking, denials, appeals, and recovery management
-- Links to existing hospital tables: visits, bills, patients, corporate

-- =====================================================
-- 1. CLAIM_TRACKING TABLE
-- Core table for tracking insurance claims
-- =====================================================
CREATE TABLE IF NOT EXISTS claim_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links to existing hospital tables
  visit_id text NOT NULL,                    -- Links to visits.visit_id
  bill_id uuid,                              -- Links to bills.id
  patient_id uuid NOT NULL,                  -- Links to patients.id

  -- Claim Identification
  claim_number text UNIQUE NOT NULL,
  hospital_claim_id text,
  payer_claim_id text,                       -- Payer's reference number

  -- Payer Info (from corporate table)
  payer_type text NOT NULL,                  -- 'CGHS', 'ECHS', 'ESIC', 'Insurance', 'Private'
  payer_name text,                           -- Specific company/scheme name

  -- Financial (INR)
  claimed_amount decimal(12,2) NOT NULL CHECK (claimed_amount >= 0),
  approved_amount decimal(12,2) CHECK (approved_amount >= 0),
  paid_amount decimal(12,2) DEFAULT 0 CHECK (paid_amount >= 0),

  -- Status Tracking
  claim_status text DEFAULT 'submitted' CHECK (claim_status IN (
    'submitted',
    'under_review',
    'pending_documents',
    'approved',
    'partially_approved',
    'denied',
    'appealed',
    'recovered',
    'written_off'
  )),

  -- Dates
  admission_date date,
  discharge_date date,
  submission_date date NOT NULL DEFAULT CURRENT_DATE,
  last_status_update timestamp DEFAULT now(),
  payment_due_date date,

  -- Notes
  remarks text,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes for claim_tracking
CREATE INDEX idx_claim_tracking_visit ON claim_tracking(visit_id);
CREATE INDEX idx_claim_tracking_patient ON claim_tracking(patient_id);
CREATE INDEX idx_claim_tracking_status ON claim_tracking(claim_status);
CREATE INDEX idx_claim_tracking_payer ON claim_tracking(payer_type);
CREATE INDEX idx_claim_tracking_submission ON claim_tracking(submission_date DESC);
CREATE INDEX idx_claim_tracking_claim_number ON claim_tracking(claim_number);

-- =====================================================
-- 2. CLAIM_DENIALS TABLE
-- Track denial reasons and recovery potential
-- =====================================================
CREATE TABLE IF NOT EXISTS claim_denials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claim_tracking(id) ON DELETE CASCADE NOT NULL,

  -- Denial Details
  denial_code text,
  denial_category text CHECK (denial_category IN (
    'medical_necessity',
    'documentation_incomplete',
    'coding_error',
    'eligibility_issue',
    'tariff_dispute',
    'time_limit_exceeded',
    'duplicate_claim',
    'unauthorized_service',
    'other'
  )) NOT NULL,
  denial_reason text NOT NULL,
  denial_amount decimal(12,2) NOT NULL CHECK (denial_amount >= 0),
  denial_date date NOT NULL,

  -- Payer Communication
  payer_reference_number text,
  denial_letter_url text,

  -- Recovery Assessment (manual for now)
  recovery_probability text CHECK (recovery_probability IN ('high', 'medium', 'low')),
  estimated_recovery_amount decimal(12,2) CHECK (estimated_recovery_amount >= 0),
  recovery_notes text,
  recommended_action text,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes for claim_denials
CREATE INDEX idx_claim_denials_claim ON claim_denials(claim_id);
CREATE INDEX idx_claim_denials_category ON claim_denials(denial_category);
CREATE INDEX idx_claim_denials_date ON claim_denials(denial_date DESC);
CREATE INDEX idx_claim_denials_probability ON claim_denials(recovery_probability);

-- =====================================================
-- 3. CLAIM_APPEALS TABLE
-- Track appeals filed against denials
-- =====================================================
CREATE TABLE IF NOT EXISTS claim_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claim_tracking(id) ON DELETE CASCADE NOT NULL,
  denial_id uuid REFERENCES claim_denials(id) ON DELETE SET NULL,

  -- Appeal Details
  appeal_number text UNIQUE NOT NULL,
  appeal_level int DEFAULT 1 CHECK (appeal_level BETWEEN 1 AND 3),
  appeal_type text CHECK (appeal_type IN (
    'reconsideration',
    'review',
    'grievance'
  )) NOT NULL,
  appeal_reason text,

  -- Status
  appeal_status text DEFAULT 'draft' CHECK (appeal_status IN (
    'draft',
    'submitted',
    'under_review',
    'additional_info_requested',
    'accepted',
    'partially_accepted',
    'rejected',
    'withdrawn'
  )),

  -- Dates
  created_date date DEFAULT CURRENT_DATE,
  submitted_date date,
  response_due_date date,
  response_received_date date,

  -- Outcome
  outcome_amount decimal(12,2) CHECK (outcome_amount >= 0),
  outcome_reason text,

  -- Documents
  appeal_letter_url text,
  supporting_documents_urls text[],
  response_document_url text,

  -- Notes
  internal_notes text,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes for claim_appeals
CREATE INDEX idx_claim_appeals_claim ON claim_appeals(claim_id);
CREATE INDEX idx_claim_appeals_denial ON claim_appeals(denial_id) WHERE denial_id IS NOT NULL;
CREATE INDEX idx_claim_appeals_status ON claim_appeals(appeal_status);
CREATE INDEX idx_claim_appeals_level ON claim_appeals(appeal_level);
CREATE INDEX idx_claim_appeals_submitted ON claim_appeals(submitted_date DESC) WHERE submitted_date IS NOT NULL;

-- =====================================================
-- 4. RECOVERY_TRANSACTIONS TABLE
-- Track money recovered and agent fee calculations
-- =====================================================
CREATE TABLE IF NOT EXISTS recovery_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claim_tracking(id) ON DELETE CASCADE NOT NULL,
  appeal_id uuid REFERENCES claim_appeals(id) ON DELETE SET NULL,

  -- Recovery Details
  recovery_amount decimal(12,2) NOT NULL CHECK (recovery_amount > 0),
  recovery_date date NOT NULL DEFAULT CURRENT_DATE,
  recovery_method text CHECK (recovery_method IN (
    'direct_payment',
    'adjustment',
    'settlement'
  )) NOT NULL,

  -- Gain-Share Model (Agent Fee)
  agent_fee_percentage decimal(5,2) DEFAULT 25.00 CHECK (agent_fee_percentage BETWEEN 0 AND 50),
  agent_fee_amount decimal(12,2) CHECK (agent_fee_amount >= 0),
  hospital_net_amount decimal(12,2) CHECK (hospital_net_amount >= 0),

  -- Payment Details
  payment_reference text,
  payment_date date,
  payment_mode text CHECK (payment_mode IN (
    'bank_transfer',
    'cheque',
    'upi',
    'neft',
    'rtgs'
  )),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN (
    'pending',
    'processed',
    'failed',
    'disputed'
  )),

  -- Invoice
  invoice_number text,
  invoice_url text,
  invoice_date date,

  -- Notes
  notes text,

  -- Metadata
  created_at timestamp DEFAULT now()
);

-- Indexes for recovery_transactions
CREATE INDEX idx_recovery_claim ON recovery_transactions(claim_id);
CREATE INDEX idx_recovery_appeal ON recovery_transactions(appeal_id) WHERE appeal_id IS NOT NULL;
CREATE INDEX idx_recovery_date ON recovery_transactions(recovery_date DESC);
CREATE INDEX idx_recovery_status ON recovery_transactions(payment_status);

-- =====================================================
-- 5. ZRA_USERS TABLE
-- Zero Risk Agent Users (separate from hospital users)
-- =====================================================
CREATE TABLE IF NOT EXISTS zra_users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,

  -- Profile
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,

  -- Role
  role text CHECK (role IN ('admin', 'manager', 'staff')) NOT NULL DEFAULT 'staff',

  -- Permissions
  can_view_claims boolean DEFAULT true,
  can_edit_claims boolean DEFAULT false,
  can_approve_appeals boolean DEFAULT false,
  can_view_financials boolean DEFAULT false,
  can_export_data boolean DEFAULT false,

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_login_at timestamp,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes for zra_users
CREATE INDEX idx_zra_users_email ON zra_users(email);
CREATE INDEX idx_zra_users_role ON zra_users(role);
CREATE INDEX idx_zra_users_status ON zra_users(status);

-- =====================================================
-- TRIGGERS: Auto-update timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_claim_tracking_updated_at
  BEFORE UPDATE ON claim_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claim_denials_updated_at
  BEFORE UPDATE ON claim_denials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claim_appeals_updated_at
  BEFORE UPDATE ON claim_appeals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zra_users_updated_at
  BEFORE UPDATE ON zra_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Auto-update claim status on denial
-- =====================================================
CREATE OR REPLACE FUNCTION auto_update_claim_on_denial()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE claim_tracking
  SET
    claim_status = 'denied',
    last_status_update = now()
  WHERE id = NEW.claim_id
  AND claim_status NOT IN ('appealed', 'recovered', 'written_off');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_claim_status_on_denial
  AFTER INSERT ON claim_denials
  FOR EACH ROW EXECUTE FUNCTION auto_update_claim_on_denial();

-- =====================================================
-- TRIGGER: Auto-update claim status on appeal
-- =====================================================
CREATE OR REPLACE FUNCTION auto_update_claim_on_appeal()
RETURNS TRIGGER AS $$
BEGIN
  -- When appeal is submitted
  IF NEW.appeal_status = 'submitted' AND (OLD.appeal_status IS NULL OR OLD.appeal_status = 'draft') THEN
    UPDATE claim_tracking
    SET
      claim_status = 'appealed',
      last_status_update = now()
    WHERE id = NEW.claim_id;
  END IF;

  -- When appeal is accepted
  IF NEW.appeal_status IN ('accepted', 'partially_accepted')
     AND (OLD.appeal_status IS NULL OR OLD.appeal_status NOT IN ('accepted', 'partially_accepted')) THEN
    UPDATE claim_tracking
    SET
      claim_status = 'recovered',
      approved_amount = COALESCE(NEW.outcome_amount, approved_amount),
      last_status_update = now()
    WHERE id = NEW.claim_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_claim_status_on_appeal
  AFTER INSERT OR UPDATE ON claim_appeals
  FOR EACH ROW EXECUTE FUNCTION auto_update_claim_on_appeal();

-- =====================================================
-- TRIGGER: Auto-calculate agent fee on recovery
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_agent_fee()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate agent fee if not provided
  IF NEW.agent_fee_amount IS NULL THEN
    NEW.agent_fee_amount = ROUND((NEW.recovery_amount * NEW.agent_fee_percentage / 100)::numeric, 2);
  END IF;

  -- Calculate hospital net amount
  NEW.hospital_net_amount = NEW.recovery_amount - NEW.agent_fee_amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_agent_fee
  BEFORE INSERT OR UPDATE ON recovery_transactions
  FOR EACH ROW EXECUTE FUNCTION calculate_agent_fee();

-- =====================================================
-- TRIGGER: Update claim paid_amount on recovery
-- =====================================================
CREATE OR REPLACE FUNCTION update_claim_on_recovery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'processed' THEN
    UPDATE claim_tracking
    SET
      paid_amount = COALESCE(paid_amount, 0) + NEW.recovery_amount,
      claim_status = 'recovered',
      last_status_update = now()
    WHERE id = NEW.claim_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_claim_on_recovery
  AFTER INSERT OR UPDATE OF payment_status ON recovery_transactions
  FOR EACH ROW
  WHEN (NEW.payment_status = 'processed')
  EXECUTE FUNCTION update_claim_on_recovery();

-- =====================================================
-- VIEWS: Dashboard Metrics
-- =====================================================

-- Claim Summary View
CREATE OR REPLACE VIEW claim_summary_view AS
SELECT
  COUNT(*) as total_claims,
  COUNT(CASE WHEN claim_status = 'submitted' THEN 1 END) as submitted_claims,
  COUNT(CASE WHEN claim_status = 'under_review' THEN 1 END) as under_review_claims,
  COUNT(CASE WHEN claim_status = 'pending_documents' THEN 1 END) as pending_documents_claims,
  COUNT(CASE WHEN claim_status = 'approved' THEN 1 END) as approved_claims,
  COUNT(CASE WHEN claim_status = 'partially_approved' THEN 1 END) as partially_approved_claims,
  COUNT(CASE WHEN claim_status = 'denied' THEN 1 END) as denied_claims,
  COUNT(CASE WHEN claim_status = 'appealed' THEN 1 END) as appealed_claims,
  COUNT(CASE WHEN claim_status = 'recovered' THEN 1 END) as recovered_claims,
  COUNT(CASE WHEN claim_status = 'written_off' THEN 1 END) as written_off_claims,

  -- Financial Summary
  COALESCE(SUM(claimed_amount), 0) as total_claimed,
  COALESCE(SUM(approved_amount), 0) as total_approved,
  COALESCE(SUM(paid_amount), 0) as total_paid,
  COALESCE(SUM(claimed_amount - COALESCE(paid_amount, 0)), 0) as total_outstanding,

  -- Denied Amount
  COALESCE(SUM(CASE WHEN claim_status IN ('denied', 'appealed') THEN claimed_amount - COALESCE(approved_amount, 0) ELSE 0 END), 0) as total_denied_amount,

  -- Aging Analysis
  COUNT(CASE WHEN (CURRENT_DATE - submission_date) > 30 AND claim_status NOT IN ('recovered', 'written_off') THEN 1 END) as aged_over_30,
  COUNT(CASE WHEN (CURRENT_DATE - submission_date) > 60 AND claim_status NOT IN ('recovered', 'written_off') THEN 1 END) as aged_over_60,
  COUNT(CASE WHEN (CURRENT_DATE - submission_date) > 90 AND claim_status NOT IN ('recovered', 'written_off') THEN 1 END) as aged_over_90,

  -- Average Aging
  ROUND(AVG(CURRENT_DATE - submission_date)) as avg_days_pending

FROM claim_tracking;

-- Payer-wise Summary View
CREATE OR REPLACE VIEW payer_wise_summary AS
SELECT
  payer_type,
  payer_name,
  COUNT(*) as total_claims,

  -- Status Counts
  COUNT(CASE WHEN claim_status = 'denied' THEN 1 END) as denied_claims,
  COUNT(CASE WHEN claim_status = 'appealed' THEN 1 END) as appealed_claims,
  COUNT(CASE WHEN claim_status = 'recovered' THEN 1 END) as recovered_claims,

  -- Financial
  COALESCE(SUM(claimed_amount), 0) as total_claimed,
  COALESCE(SUM(approved_amount), 0) as total_approved,
  COALESCE(SUM(paid_amount), 0) as total_paid,
  COALESCE(SUM(claimed_amount - COALESCE(paid_amount, 0)), 0) as total_outstanding,

  -- Rates
  ROUND(
    CASE
      WHEN COUNT(*) > 0
      THEN (COUNT(CASE WHEN claim_status = 'denied' THEN 1 END)::decimal / COUNT(*)::decimal * 100)
      ELSE 0
    END, 2
  ) as denial_rate_percent,

  -- Aging
  ROUND(AVG(CURRENT_DATE - submission_date)) as avg_days_pending

FROM claim_tracking
GROUP BY payer_type, payer_name
ORDER BY total_claimed DESC;

-- Recovery Summary View
CREATE OR REPLACE VIEW recovery_summary_view AS
SELECT
  COUNT(*) as total_recoveries,
  COALESCE(SUM(recovery_amount), 0) as total_recovered,
  COALESCE(SUM(agent_fee_amount), 0) as total_agent_fees,
  COALESCE(SUM(hospital_net_amount), 0) as total_hospital_net,

  -- By Method
  COUNT(CASE WHEN recovery_method = 'direct_payment' THEN 1 END) as direct_payments,
  COUNT(CASE WHEN recovery_method = 'adjustment' THEN 1 END) as adjustments,
  COUNT(CASE WHEN recovery_method = 'settlement' THEN 1 END) as settlements,

  -- By Status
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
  COUNT(CASE WHEN payment_status = 'processed' THEN 1 END) as processed_payments,

  -- Monthly Recovery (current month)
  COALESCE(SUM(CASE WHEN DATE_TRUNC('month', recovery_date) = DATE_TRUNC('month', CURRENT_DATE) THEN recovery_amount ELSE 0 END), 0) as current_month_recovery

FROM recovery_transactions;

-- Denial Category Summary View
CREATE OR REPLACE VIEW denial_category_summary AS
SELECT
  denial_category,
  COUNT(*) as total_denials,
  COALESCE(SUM(denial_amount), 0) as total_denied_amount,

  -- Recovery Potential
  COUNT(CASE WHEN recovery_probability = 'high' THEN 1 END) as high_probability,
  COUNT(CASE WHEN recovery_probability = 'medium' THEN 1 END) as medium_probability,
  COUNT(CASE WHEN recovery_probability = 'low' THEN 1 END) as low_probability,

  COALESCE(SUM(estimated_recovery_amount), 0) as total_estimated_recovery

FROM claim_denials
GROUP BY denial_category
ORDER BY total_denied_amount DESC;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE claim_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_denials ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zra_users ENABLE ROW LEVEL SECURITY;

-- Policy: ZRA users can view all claims
CREATE POLICY "ZRA users can view claims"
  ON claim_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zra_users
      WHERE id = auth.uid()
      AND status = 'active'
      AND can_view_claims = true
    )
  );

-- Policy: ZRA users with edit permission can insert/update claims
CREATE POLICY "ZRA users can edit claims"
  ON claim_tracking FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zra_users
      WHERE id = auth.uid()
      AND status = 'active'
      AND can_edit_claims = true
    )
  );

-- Policy: ZRA users can view denials
CREATE POLICY "ZRA users can view denials"
  ON claim_denials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zra_users
      WHERE id = auth.uid()
      AND status = 'active'
      AND can_view_claims = true
    )
  );

-- Policy: ZRA users with edit permission can manage denials
CREATE POLICY "ZRA users can edit denials"
  ON claim_denials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zra_users
      WHERE id = auth.uid()
      AND status = 'active'
      AND can_edit_claims = true
    )
  );

-- Policy: ZRA users can view appeals
CREATE POLICY "ZRA users can view appeals"
  ON claim_appeals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zra_users
      WHERE id = auth.uid()
      AND status = 'active'
      AND can_view_claims = true
    )
  );

-- Policy: ZRA users with appeal approval permission can manage appeals
CREATE POLICY "ZRA users can manage appeals"
  ON claim_appeals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zra_users
      WHERE id = auth.uid()
      AND status = 'active'
      AND (can_edit_claims = true OR can_approve_appeals = true)
    )
  );

-- Policy: ZRA users with financial access can view recovery
CREATE POLICY "ZRA users can view recovery"
  ON recovery_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zra_users
      WHERE id = auth.uid()
      AND status = 'active'
      AND can_view_financials = true
    )
  );

-- Policy: ZRA admins can manage recovery transactions
CREATE POLICY "ZRA admins can manage recovery"
  ON recovery_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zra_users
      WHERE id = auth.uid()
      AND status = 'active'
      AND role = 'admin'
    )
  );

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON zra_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Admins can manage all users
CREATE POLICY "Admins can manage users"
  ON zra_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM zra_users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE claim_tracking IS 'Core table for tracking insurance claims linked to hospital visits and bills';
COMMENT ON TABLE claim_denials IS 'Tracks denial reasons and recovery potential assessment';
COMMENT ON TABLE claim_appeals IS 'Tracks appeals filed against denied claims';
COMMENT ON TABLE recovery_transactions IS 'Tracks recovered amounts and gain-share fee calculations';
COMMENT ON TABLE zra_users IS 'Zero Risk Agent users with role-based permissions';

COMMENT ON VIEW claim_summary_view IS 'Dashboard metrics for claim status and financial summary';
COMMENT ON VIEW payer_wise_summary IS 'Analytics by payer type showing denial rates and outstanding amounts';
COMMENT ON VIEW recovery_summary_view IS 'Summary of recovered amounts and agent fees';
COMMENT ON VIEW denial_category_summary IS 'Breakdown of denials by category with recovery potential';
