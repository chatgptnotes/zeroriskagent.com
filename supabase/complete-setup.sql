-- ============================================
-- ZERO RISK AGENT - COMPLETE DATABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 20260111000001_create_core_tables.sql
-- ============================================
-- Migration: Create Core Tables
-- Version: 1.0
-- Date: 2026-01-11
-- Description: Creates hospitals, payer_organizations, and users tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- HOSPITALS TABLE
-- =====================================================
CREATE TABLE hospitals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  registration_number text UNIQUE NOT NULL,
  type text CHECK (type IN ('government', 'private', 'trust')) NOT NULL,
  address jsonb NOT NULL,
  contact_details jsonb NOT NULL,

  -- ESIC Registration
  esic_code text,
  esic_branch_code text,

  -- CGHS Registration
  cghs_wellness_center_code text,
  cghs_empanelment_number text,

  -- ECHS Registration
  echs_polyclinic_code text,
  echs_station_code text,

  -- Gain-Share Agreement
  recovery_fee_percentage decimal(5,2) DEFAULT 25.00 CHECK (recovery_fee_percentage BETWEEN 10.00 AND 40.00),
  min_claim_value_for_recovery decimal(10,2) DEFAULT 5000.00,

  -- Status
  status text CHECK (status IN ('active', 'suspended', 'inactive')) DEFAULT 'active',
  onboarded_at timestamp DEFAULT now(),

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for hospital lookups
CREATE INDEX idx_hospitals_status ON hospitals(status);
CREATE INDEX idx_hospitals_esic_code ON hospitals(esic_code) WHERE esic_code IS NOT NULL;
CREATE INDEX idx_hospitals_cghs_code ON hospitals(cghs_wellness_center_code) WHERE cghs_wellness_center_code IS NOT NULL;
CREATE INDEX idx_hospitals_echs_code ON hospitals(echs_polyclinic_code) WHERE echs_polyclinic_code IS NOT NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PAYER ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE payer_organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  type text CHECK (type IN ('esic', 'cghs', 'echs', 'state_govt', 'private_insurance', 'corporate', 'other')) NOT NULL,

  -- Contact Information
  portal_url text,
  grievance_email text,
  helpline_number text,
  regional_office_details jsonb,

  -- Processing Details
  typical_processing_days int DEFAULT 30 CHECK (typical_processing_days > 0),
  appeal_levels int DEFAULT 3 CHECK (appeal_levels BETWEEN 1 AND 5),
  max_appeal_days int DEFAULT 90 CHECK (max_appeal_days > 0),

  -- Integration
  api_endpoint text,
  api_auth_method text,
  has_direct_integration boolean DEFAULT false,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_payer_orgs_type ON payer_organizations(type);
CREATE INDEX idx_payer_orgs_code ON payer_organizations(code);

-- Add update trigger
CREATE TRIGGER update_payer_orgs_updated_at BEFORE UPDATE ON payer_organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE SET NULL,

  -- Profile
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,

  -- Role
  role text CHECK (role IN ('hospital_admin', 'billing_staff', 'doctor', 'agent_admin', 'super_admin')) NOT NULL,

  -- Permissions
  can_approve_appeals boolean DEFAULT false,
  can_view_financials boolean DEFAULT false,
  can_export_data boolean DEFAULT false,

  -- Status
  status text CHECK (status IN ('active', 'suspended', 'inactive')) DEFAULT 'active',
  last_login_at timestamp,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_users_hospital ON users(hospital_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Add update trigger
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA: Default Payer Organizations (Indian Healthcare)
-- =====================================================
INSERT INTO payer_organizations (name, code, type, portal_url, typical_processing_days, appeal_levels, max_appeal_days) VALUES
('Employees State Insurance Corporation', 'ESIC', 'esic', 'https://esic.nic.in', 30, 3, 90),
('Central Government Health Scheme', 'CGHS', 'cghs', 'https://cghs.gov.in', 45, 3, 120),
('Ex-Servicemen Contributory Health Scheme', 'ECHS', 'echs', 'https://echs.gov.in', 60, 3, 90),
('Ayushman Bharat PMJAY', 'PMJAY', 'state_govt', 'https://pmjay.gov.in', 30, 2, 60),
('Maharashtra State Health Scheme', 'MSHS', 'state_govt', null, 45, 2, 90);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE hospitals IS 'Stores hospital information and registration details for various payer schemes';
COMMENT ON TABLE payer_organizations IS 'Master table for insurance payers and government health schemes';
COMMENT ON TABLE users IS 'System users with role-based access control';

COMMENT ON COLUMN hospitals.recovery_fee_percentage IS 'Percentage of recovered amount charged as agent fee (gain-share model)';
COMMENT ON COLUMN hospitals.min_claim_value_for_recovery IS 'Minimum claim amount in INR to attempt recovery';
COMMENT ON COLUMN payer_organizations.typical_processing_days IS 'Average days for claim processing by this payer';
COMMENT ON COLUMN payer_organizations.appeal_levels IS 'Number of appeal levels available';


-- ============================================
-- 20260111000002_create_claims_and_denials.sql
-- ============================================
-- Migration: Create Claims and Denials Tables
-- Version: 1.0
-- Date: 2026-01-11
-- Description: Creates claims and claim_denials tables with full tracking

-- =====================================================
-- CLAIMS TABLE
-- =====================================================
CREATE TABLE claims (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE NOT NULL,
  payer_id uuid REFERENCES payer_organizations(id) ON DELETE RESTRICT NOT NULL,

  -- Claim Identification
  claim_number text UNIQUE NOT NULL,
  hospital_claim_id text NOT NULL,
  external_claim_id text, -- From payer system

  -- Patient Information (minimal, HIPAA-compliant)
  patient_id_hash text NOT NULL, -- One-way hash of patient ID
  patient_age int CHECK (patient_age BETWEEN 0 AND 150),
  patient_gender text CHECK (patient_gender IN ('M', 'F', 'O')),
  beneficiary_type text, -- For ESIC/CGHS/ECHS classification

  -- Claim Details
  admission_date date,
  discharge_date date,
  claim_type text CHECK (claim_type IN ('inpatient', 'outpatient', 'daycare', 'diagnostic', 'pharmacy')) NOT NULL,

  -- Financial (in INR)
  claimed_amount decimal(12,2) NOT NULL CHECK (claimed_amount >= 0),
  approved_amount decimal(12,2) CHECK (approved_amount >= 0),
  paid_amount decimal(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
  outstanding_amount decimal(12,2) GENERATED ALWAYS AS (claimed_amount - paid_amount) STORED,

  -- Treatment Details
  primary_diagnosis_code text, -- ICD-10
  procedure_codes text[], -- CPT/ICD procedure codes
  treatment_summary text,

  -- Status Tracking
  claim_status text CHECK (claim_status IN (
    'submitted',
    'under_review',
    'pending_documents',
    'approved',
    'partially_approved',
    'denied',
    'appealed',
    'recovered',
    'written_off'
  )) DEFAULT 'submitted',

  -- Dates
  submission_date timestamp NOT NULL DEFAULT now(),
  last_status_update timestamp DEFAULT now(),
  payment_due_date date,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  -- Constraints
  CONSTRAINT check_discharge_after_admission CHECK (discharge_date IS NULL OR discharge_date >= admission_date),
  CONSTRAINT check_approved_lte_claimed CHECK (approved_amount IS NULL OR approved_amount <= claimed_amount),
  CONSTRAINT check_paid_lte_claimed CHECK (paid_amount <= claimed_amount)
);

-- Create indexes for performance
CREATE INDEX idx_claims_hospital_status ON claims(hospital_id, claim_status);
CREATE INDEX idx_claims_payer_status ON claims(payer_id, claim_status);
CREATE INDEX idx_claims_submission_date ON claims(submission_date DESC);
CREATE INDEX idx_claims_status ON claims(claim_status);
CREATE INDEX idx_claims_claim_number ON claims(claim_number);
CREATE INDEX idx_claims_external_id ON claims(external_claim_id) WHERE external_claim_id IS NOT NULL;

-- Add update trigger
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update last_status_update when status changes
CREATE OR REPLACE FUNCTION update_claim_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.claim_status IS DISTINCT FROM NEW.claim_status THEN
    NEW.last_status_update = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_claim_status_date BEFORE UPDATE ON claims
FOR EACH ROW EXECUTE FUNCTION update_claim_status_timestamp();

-- =====================================================
-- CLAIM DENIALS TABLE
-- =====================================================
CREATE TABLE claim_denials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE NOT NULL,

  -- Denial Details
  denial_code text NOT NULL,
  denial_category text CHECK (denial_category IN (
    'medical_necessity',
    'documentation_incomplete',
    'coding_error',
    'eligibility_issue',
    'policy_exclusion',
    'tariff_rate_dispute',
    'duplicate_claim',
    'time_limit_exceeded',
    'unauthorized_service',
    'other'
  )) NOT NULL,

  denial_reason text NOT NULL,
  denial_amount decimal(12,2) NOT NULL CHECK (denial_amount >= 0),

  -- Payer Communication
  denial_date date NOT NULL,
  denial_letter_url text, -- Stored document in Supabase Storage
  payer_reference_number text,

  -- Recovery Analysis (AI-generated)
  recovery_probability decimal(3,2) CHECK (recovery_probability BETWEEN 0.00 AND 1.00),
  estimated_recovery_amount decimal(12,2) CHECK (estimated_recovery_amount >= 0),
  recovery_effort_score int CHECK (recovery_effort_score BETWEEN 1 AND 10),

  -- AI Agent Analysis
  ai_analysis jsonb, -- Structured analysis from LLM
  recommended_action text,
  ai_generated_at timestamp,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_denials_claim ON claim_denials(claim_id);
CREATE INDEX idx_denials_category ON claim_denials(denial_category);
CREATE INDEX idx_denials_recovery_prob ON claim_denials(recovery_probability DESC) WHERE recovery_probability IS NOT NULL;
CREATE INDEX idx_denials_date ON claim_denials(denial_date DESC);
CREATE INDEX idx_denials_effort_score ON claim_denials(recovery_effort_score) WHERE recovery_effort_score IS NOT NULL;

-- Add update trigger
CREATE TRIGGER update_denials_updated_at BEFORE UPDATE ON claim_denials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Auto-update claim status when denial is added
-- =====================================================
CREATE OR REPLACE FUNCTION auto_update_claim_status_on_denial()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE claims
  SET claim_status = 'denied'
  WHERE id = NEW.claim_id
  AND claim_status NOT IN ('appealed', 'recovered', 'written_off');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_claim_on_denial
AFTER INSERT ON claim_denials
FOR EACH ROW EXECUTE FUNCTION auto_update_claim_status_on_denial();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE claims IS 'Core table tracking all insurance claims from submission to resolution';
COMMENT ON TABLE claim_denials IS 'Tracks denial details and AI-powered recovery analysis';

COMMENT ON COLUMN claims.patient_id_hash IS 'SHA-256 hash of patient ID for privacy compliance';
-- Note: aged_days is calculated dynamically in queries as: EXTRACT(DAY FROM (CURRENT_DATE - submission_date::date))::int
COMMENT ON COLUMN claims.outstanding_amount IS 'Automatically calculated as claimed_amount - paid_amount';
COMMENT ON COLUMN claim_denials.recovery_probability IS 'AI-predicted probability of successful recovery (0.00 to 1.00)';
COMMENT ON COLUMN claim_denials.recovery_effort_score IS 'Effort required for recovery (1=easy, 10=very difficult)';
COMMENT ON COLUMN claim_denials.ai_analysis IS 'JSON structure with detailed AI analysis including patterns, similar cases, recommended strategy';


-- ============================================
-- 20260111000003_create_appeals_and_recovery.sql
-- ============================================
-- Migration: Create Appeals and Recovery Tables
-- Version: 1.0
-- Date: 2026-01-11
-- Description: Creates appeals and recovery_transactions tables

-- =====================================================
-- APPEALS TABLE
-- =====================================================
CREATE TABLE appeals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
  denial_id uuid REFERENCES claim_denials(id) ON DELETE CASCADE,

  -- Appeal Details
  appeal_number text UNIQUE NOT NULL,
  appeal_level int CHECK (appeal_level BETWEEN 1 AND 3) DEFAULT 1,
  appeal_type text CHECK (appeal_type IN ('reconsideration', 'review', 'grievance')) NOT NULL,

  -- Content
  appeal_reason text NOT NULL,
  supporting_documents_urls text[],
  medical_justification text,
  policy_references text[], -- References to specific payer policy clauses

  -- Generation Info
  generated_by text CHECK (generated_by IN ('ai_agent', 'human', 'hybrid')) DEFAULT 'ai_agent',
  ai_model_used text, -- e.g., 'gpt-4', 'claude-3-opus'
  ai_confidence_score decimal(3,2) CHECK (ai_confidence_score BETWEEN 0.00 AND 1.00),
  ai_generation_metadata jsonb, -- Tokens used, prompts, etc.

  -- Status
  appeal_status text CHECK (appeal_status IN (
    'draft',
    'submitted',
    'under_review',
    'additional_info_requested',
    'accepted',
    'partially_accepted',
    'rejected',
    'withdrawn'
  )) DEFAULT 'draft',

  -- Dates
  submitted_date timestamp,
  response_due_date date,
  response_received_date date,

  -- Outcome
  outcome_amount decimal(12,2) CHECK (outcome_amount >= 0),
  outcome_reason text,
  payer_response_document_url text,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  -- Constraints
  CONSTRAINT check_response_dates CHECK (
    response_received_date IS NULL OR
    response_due_date IS NULL OR
    response_received_date >= submitted_date::date
  )
);

-- Create indexes
CREATE INDEX idx_appeals_claim ON appeals(claim_id);
CREATE INDEX idx_appeals_denial ON appeals(denial_id) WHERE denial_id IS NOT NULL;
CREATE INDEX idx_appeals_status ON appeals(appeal_status);
CREATE INDEX idx_appeals_level ON appeals(appeal_level);
CREATE INDEX idx_appeals_submitted_date ON appeals(submitted_date DESC) WHERE submitted_date IS NOT NULL;
CREATE INDEX idx_appeals_generated_by ON appeals(generated_by);
CREATE INDEX idx_appeals_number ON appeals(appeal_number);

-- Add update trigger
CREATE TRIGGER update_appeals_updated_at BEFORE UPDATE ON appeals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Auto-update claim status when appeal is submitted
-- =====================================================
CREATE OR REPLACE FUNCTION auto_update_claim_status_on_appeal()
RETURNS TRIGGER AS $$
BEGIN
  -- When appeal is submitted, mark claim as 'appealed'
  IF NEW.appeal_status = 'submitted' AND (OLD.appeal_status IS NULL OR OLD.appeal_status != 'submitted') THEN
    UPDATE claims
    SET claim_status = 'appealed'
    WHERE id = NEW.claim_id;
  END IF;

  -- When appeal is accepted, mark claim as 'recovered'
  IF NEW.appeal_status IN ('accepted', 'partially_accepted') AND (OLD.appeal_status IS NULL OR OLD.appeal_status NOT IN ('accepted', 'partially_accepted')) THEN
    UPDATE claims
    SET
      claim_status = 'recovered',
      approved_amount = CASE
        WHEN NEW.appeal_status = 'accepted' THEN (SELECT claimed_amount FROM claims WHERE id = NEW.claim_id)
        ELSE NEW.outcome_amount
      END
    WHERE id = NEW.claim_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_claim_on_appeal
AFTER INSERT OR UPDATE ON appeals
FOR EACH ROW EXECUTE FUNCTION auto_update_claim_status_on_appeal();

-- =====================================================
-- RECOVERY TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE recovery_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE NOT NULL,
  claim_id uuid REFERENCES claims(id) ON DELETE RESTRICT NOT NULL,
  appeal_id uuid REFERENCES appeals(id) ON DELETE SET NULL,

  -- Recovery Details
  recovery_amount decimal(12,2) NOT NULL CHECK (recovery_amount > 0),
  recovery_date date NOT NULL DEFAULT CURRENT_DATE,
  recovery_method text CHECK (recovery_method IN ('direct_payment', 'adjustment', 'settlement')) NOT NULL,

  -- Revenue Share Calculation (Gain-Share Model)
  agent_fee_percentage decimal(5,2) NOT NULL CHECK (agent_fee_percentage BETWEEN 0 AND 50),
  agent_fee_amount decimal(12,2) NOT NULL CHECK (agent_fee_amount >= 0),
  hospital_amount decimal(12,2) NOT NULL CHECK (hospital_amount >= 0),

  -- Payment Details
  payment_status text CHECK (payment_status IN ('pending', 'processed', 'failed', 'disputed')) DEFAULT 'pending',
  payment_reference_number text,
  payment_date date,
  payment_mode text CHECK (payment_mode IN ('bank_transfer', 'cheque', 'upi', 'neft', 'rtgs')),

  -- Invoice
  invoice_number text UNIQUE,
  invoice_url text,
  invoice_generated_at timestamp,

  -- Metadata
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  -- Constraints
  CONSTRAINT check_amounts_sum CHECK (agent_fee_amount + hospital_amount = recovery_amount),
  CONSTRAINT check_payment_date CHECK (payment_date IS NULL OR payment_date >= recovery_date)
);

-- Create indexes
CREATE INDEX idx_recovery_hospital ON recovery_transactions(hospital_id);
CREATE INDEX idx_recovery_claim ON recovery_transactions(claim_id);
CREATE INDEX idx_recovery_appeal ON recovery_transactions(appeal_id) WHERE appeal_id IS NOT NULL;
CREATE INDEX idx_recovery_date ON recovery_transactions(recovery_date DESC);
CREATE INDEX idx_recovery_payment_status ON recovery_transactions(payment_status);
CREATE INDEX idx_recovery_invoice ON recovery_transactions(invoice_number) WHERE invoice_number IS NOT NULL;

-- Add update trigger
CREATE TRIGGER update_recovery_updated_at BEFORE UPDATE ON recovery_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Auto-calculate revenue share amounts
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_revenue_share()
RETURNS TRIGGER AS $$
BEGIN
  -- Get hospital's configured fee percentage if not provided
  IF NEW.agent_fee_percentage IS NULL THEN
    SELECT recovery_fee_percentage INTO NEW.agent_fee_percentage
    FROM hospitals WHERE id = NEW.hospital_id;
  END IF;

  -- Calculate agent fee and hospital amount
  NEW.agent_fee_amount = ROUND((NEW.recovery_amount * NEW.agent_fee_percentage / 100)::numeric, 2);
  NEW.hospital_amount = NEW.recovery_amount - NEW.agent_fee_amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_revenue_share
BEFORE INSERT ON recovery_transactions
FOR EACH ROW EXECUTE FUNCTION calculate_revenue_share();

-- =====================================================
-- TRIGGER: Update claim paid_amount when recovery is processed
-- =====================================================
CREATE OR REPLACE FUNCTION update_claim_on_recovery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'processed' THEN
    UPDATE claims
    SET
      paid_amount = paid_amount + NEW.recovery_amount,
      claim_status = CASE
        WHEN (paid_amount + NEW.recovery_amount) >= claimed_amount THEN 'recovered'
        ELSE claim_status
      END
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
-- COMMENTS
-- =====================================================
COMMENT ON TABLE appeals IS 'Tracks appeal submissions, AI-generated content, and outcomes';
COMMENT ON TABLE recovery_transactions IS 'Tracks successful recoveries and gain-share revenue distribution';

COMMENT ON COLUMN appeals.generated_by IS 'Indicates if appeal was generated by AI agent, human, or hybrid approach';
COMMENT ON COLUMN appeals.ai_confidence_score IS 'AI model confidence in the generated appeal (0.00 to 1.00)';
COMMENT ON COLUMN appeals.policy_references IS 'Array of specific policy clauses cited in the appeal';

COMMENT ON COLUMN recovery_transactions.agent_fee_percentage IS 'Percentage of recovery charged as agent fee (from hospital config)';
COMMENT ON COLUMN recovery_transactions.agent_fee_amount IS 'Calculated agent fee amount in INR';
COMMENT ON COLUMN recovery_transactions.hospital_amount IS 'Net amount hospital receives after agent fee';


-- ============================================
-- 20260111000004_create_agent_and_knowledge_tables.sql
-- ============================================
-- Migration: Create Agent Actions and Knowledge Graph Tables
-- Version: 1.0
-- Date: 2026-01-11
-- Description: Creates agent_actions, payer_knowledge_graph, and notifications tables

-- =====================================================
-- AGENT ACTIONS TABLE (Audit Trail)
-- =====================================================
CREATE TABLE agent_actions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Action Details
  action_type text CHECK (action_type IN (
    'claim_analysis',
    'denial_detection',
    'appeal_generation',
    'document_review',
    'policy_lookup',
    'probability_calculation',
    'payer_communication',
    'status_check',
    'escalation',
    'recovery_calculation'
  )) NOT NULL,

  -- Context
  claim_id uuid REFERENCES claims(id) ON DELETE SET NULL,
  appeal_id uuid REFERENCES appeals(id) ON DELETE SET NULL,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,
  payer_id uuid REFERENCES payer_organizations(id) ON DELETE SET NULL,

  -- Agent Details
  agent_name text NOT NULL, -- e.g., 'denial-detector', 'appeal-generator'
  agent_version text NOT NULL,
  model_used text, -- e.g., 'gpt-4-turbo', 'claude-3-opus'

  -- Execution
  input_data jsonb, -- Input parameters and context
  output_data jsonb, -- Result and generated content
  tokens_used int CHECK (tokens_used >= 0),
  execution_time_ms int CHECK (execution_time_ms >= 0),
  cost_usd decimal(10,6) CHECK (cost_usd >= 0), -- API cost tracking

  -- Result
  success boolean NOT NULL,
  error_message text,
  error_stack text,
  confidence_score decimal(3,2) CHECK (confidence_score BETWEEN 0.00 AND 1.00),

  -- Human Review
  reviewed_by_human boolean DEFAULT false,
  reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  human_feedback text,
  feedback_rating int CHECK (feedback_rating BETWEEN 1 AND 5),
  reviewed_at timestamp,

  -- Metadata
  created_at timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_agent_actions_claim ON agent_actions(claim_id) WHERE claim_id IS NOT NULL;
CREATE INDEX idx_agent_actions_appeal ON agent_actions(appeal_id) WHERE appeal_id IS NOT NULL;
CREATE INDEX idx_agent_actions_hospital ON agent_actions(hospital_id) WHERE hospital_id IS NOT NULL;
CREATE INDEX idx_agent_actions_type ON agent_actions(action_type);
CREATE INDEX idx_agent_actions_created ON agent_actions(created_at DESC);
CREATE INDEX idx_agent_actions_success ON agent_actions(success);
CREATE INDEX idx_agent_actions_agent_name ON agent_actions(agent_name);
CREATE INDEX idx_agent_actions_reviewed ON agent_actions(reviewed_by_human);

-- =====================================================
-- PAYER KNOWLEDGE GRAPH TABLE (Machine Learning)
-- =====================================================
CREATE TABLE payer_knowledge_graph (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payer_id uuid REFERENCES payer_organizations(id) ON DELETE CASCADE NOT NULL,

  -- Pattern Details
  pattern_type text CHECK (pattern_type IN (
    'denial_reason_pattern',
    'approval_criteria',
    'documentation_requirement',
    'processing_time_pattern',
    'appeal_success_factor',
    'contact_escalation_path',
    'coding_requirement',
    'seasonal_pattern'
  )) NOT NULL,

  -- Pattern Data
  pattern_key text NOT NULL, -- e.g., "ICD_CODE:E11.9", "PROCEDURE:CPT-99213"
  pattern_value jsonb NOT NULL, -- Structured data about the pattern

  -- Statistics
  occurrence_count int DEFAULT 1 CHECK (occurrence_count > 0),
  success_count int DEFAULT 0 CHECK (success_count >= 0),
  success_rate decimal(5,4) GENERATED ALWAYS AS (
    CASE
      WHEN occurrence_count > 0 THEN ROUND((success_count::decimal / occurrence_count::decimal), 4)
      ELSE 0
    END
  ) STORED,
  avg_recovery_amount decimal(12,2) CHECK (avg_recovery_amount >= 0),
  total_recovery_amount decimal(14,2) DEFAULT 0 CHECK (total_recovery_amount >= 0),

  -- Confidence & Validation
  confidence_level decimal(3,2) DEFAULT 0.50 CHECK (confidence_level BETWEEN 0.00 AND 1.00),
  last_validated_at timestamp,
  validation_count int DEFAULT 0,

  -- Temporal Tracking
  first_observed_at timestamp DEFAULT now(),
  last_observed_at timestamp DEFAULT now(),

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  -- Unique constraint on pattern
  UNIQUE(payer_id, pattern_type, pattern_key)
);

-- Create indexes
CREATE INDEX idx_knowledge_payer_pattern ON payer_knowledge_graph(payer_id, pattern_type);
CREATE INDEX idx_knowledge_success_rate ON payer_knowledge_graph(success_rate DESC);
CREATE INDEX idx_knowledge_confidence ON payer_knowledge_graph(confidence_level DESC);
CREATE INDEX idx_knowledge_pattern_type ON payer_knowledge_graph(pattern_type);
CREATE INDEX idx_knowledge_occurrence ON payer_knowledge_graph(occurrence_count DESC);

-- Add update trigger
CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON payer_knowledge_graph
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Update Knowledge Graph from Appeal Outcomes
-- =====================================================
CREATE OR REPLACE FUNCTION update_knowledge_graph_from_appeal()
RETURNS TRIGGER AS $$
DECLARE
  v_payer_id uuid;
  v_pattern_key text;
  v_success_count_delta int;
BEGIN
  -- Only process when appeal reaches final status
  IF NEW.appeal_status IN ('accepted', 'partially_accepted', 'rejected') AND
     (OLD.appeal_status IS NULL OR OLD.appeal_status NOT IN ('accepted', 'partially_accepted', 'rejected')) THEN

    -- Get payer_id from claim
    SELECT payer_id INTO v_payer_id FROM claims WHERE id = NEW.claim_id;

    -- Determine success
    v_success_count_delta := CASE
      WHEN NEW.appeal_status IN ('accepted', 'partially_accepted') THEN 1
      ELSE 0
    END;

    -- Update appeal_success_factor pattern
    INSERT INTO payer_knowledge_graph (
      payer_id,
      pattern_type,
      pattern_key,
      pattern_value,
      occurrence_count,
      success_count,
      avg_recovery_amount,
      total_recovery_amount,
      last_observed_at
    ) VALUES (
      v_payer_id,
      'appeal_success_factor',
      'appeal_level_' || NEW.appeal_level,
      jsonb_build_object(
        'appeal_type', NEW.appeal_type,
        'generated_by', NEW.generated_by,
        'latest_outcome', NEW.appeal_status
      ),
      1,
      v_success_count_delta,
      COALESCE(NEW.outcome_amount, 0),
      COALESCE(NEW.outcome_amount, 0),
      now()
    )
    ON CONFLICT (payer_id, pattern_type, pattern_key)
    DO UPDATE SET
      occurrence_count = payer_knowledge_graph.occurrence_count + 1,
      success_count = payer_knowledge_graph.success_count + v_success_count_delta,
      avg_recovery_amount = (
        (payer_knowledge_graph.avg_recovery_amount * payer_knowledge_graph.occurrence_count + COALESCE(NEW.outcome_amount, 0))
        / (payer_knowledge_graph.occurrence_count + 1)
      ),
      total_recovery_amount = payer_knowledge_graph.total_recovery_amount + COALESCE(NEW.outcome_amount, 0),
      last_observed_at = now(),
      updated_at = now();

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_from_appeal
AFTER UPDATE ON appeals
FOR EACH ROW EXECUTE FUNCTION update_knowledge_graph_from_appeal();

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE,

  -- Notification Details
  type text CHECK (type IN (
    'claim_denied',
    'appeal_submitted',
    'appeal_accepted',
    'appeal_rejected',
    'recovery_received',
    'action_required',
    'system_alert',
    'high_value_denial',
    'payment_processed'
  )) NOT NULL,

  title text NOT NULL,
  message text NOT NULL,
  severity text CHECK (severity IN ('info', 'warning', 'error', 'success')) DEFAULT 'info',

  -- Links
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  appeal_id uuid REFERENCES appeals(id) ON DELETE CASCADE,
  action_url text,

  -- Status
  read boolean DEFAULT false,
  read_at timestamp,
  dismissed boolean DEFAULT false,

  -- Metadata
  created_at timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, read) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_hospital ON notifications(hospital_id, read) WHERE hospital_id IS NOT NULL;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = false;

-- =====================================================
-- FUNCTION: Create notification on appeal status change
-- =====================================================
CREATE OR REPLACE FUNCTION notify_on_appeal_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_hospital_id uuid;
  v_notification_title text;
  v_notification_message text;
  v_notification_type text;
BEGIN
  -- Only notify on status changes
  IF NEW.appeal_status IS DISTINCT FROM OLD.appeal_status THEN
    -- Get hospital_id from claim
    SELECT hospital_id INTO v_hospital_id FROM claims WHERE id = NEW.claim_id;

    -- Determine notification content
    CASE NEW.appeal_status
      WHEN 'submitted' THEN
        v_notification_type := 'appeal_submitted';
        v_notification_title := 'Appeal Submitted';
        v_notification_message := format('Appeal %s has been submitted for claim %s', NEW.appeal_number, (SELECT claim_number FROM claims WHERE id = NEW.claim_id));
      WHEN 'accepted' THEN
        v_notification_type := 'appeal_accepted';
        v_notification_title := 'Appeal Accepted!';
        v_notification_message := format('Great news! Appeal %s has been accepted. Recovery amount: ₹%s', NEW.appeal_number, NEW.outcome_amount);
      WHEN 'partially_accepted' THEN
        v_notification_type := 'appeal_accepted';
        v_notification_title := 'Appeal Partially Accepted';
        v_notification_message := format('Appeal %s has been partially accepted. Recovery amount: ₹%s', NEW.appeal_number, NEW.outcome_amount);
      WHEN 'rejected' THEN
        v_notification_type := 'appeal_rejected';
        v_notification_title := 'Appeal Rejected';
        v_notification_message := format('Appeal %s has been rejected. Reason: %s', NEW.appeal_number, COALESCE(NEW.outcome_reason, 'No reason provided'));
      WHEN 'additional_info_requested' THEN
        v_notification_type := 'action_required';
        v_notification_title := 'Additional Information Required';
        v_notification_message := format('Payer has requested additional information for appeal %s', NEW.appeal_number);
      ELSE
        RETURN NEW;
    END CASE;

    -- Insert notification
    INSERT INTO notifications (
      hospital_id,
      type,
      title,
      message,
      severity,
      appeal_id,
      claim_id
    ) VALUES (
      v_hospital_id,
      v_notification_type,
      v_notification_title,
      v_notification_message,
      CASE
        WHEN NEW.appeal_status IN ('accepted', 'partially_accepted') THEN 'success'
        WHEN NEW.appeal_status = 'rejected' THEN 'error'
        WHEN NEW.appeal_status = 'additional_info_requested' THEN 'warning'
        ELSE 'info'
      END,
      NEW.id,
      NEW.claim_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_appeal_status
AFTER UPDATE ON appeals
FOR EACH ROW EXECUTE FUNCTION notify_on_appeal_status_change();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE agent_actions IS 'Comprehensive audit trail of all AI agent activities';
COMMENT ON TABLE payer_knowledge_graph IS 'Machine learning knowledge base that improves with each claim processed';
COMMENT ON TABLE notifications IS 'User and hospital notifications for important events';

COMMENT ON COLUMN agent_actions.tokens_used IS 'Number of LLM tokens consumed for cost tracking';
COMMENT ON COLUMN agent_actions.cost_usd IS 'Estimated API cost in USD';
COMMENT ON COLUMN payer_knowledge_graph.success_rate IS 'Automatically calculated success rate';
COMMENT ON COLUMN payer_knowledge_graph.confidence_level IS 'Statistical confidence in this pattern (0.00 to 1.00)';


-- ============================================
-- 20260111000005_create_views_and_rls.sql
-- ============================================
-- Migration: Create Views and Row Level Security Policies
-- Version: 1.0
-- Date: 2026-01-11
-- Description: Creates analytical views and implements RLS policies

-- =====================================================
-- MATERIALIZED VIEW: Dashboard Metrics
-- =====================================================
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT
  h.id as hospital_id,
  h.name as hospital_name,

  -- Claim Counts
  COUNT(c.id) as total_claims,
  COUNT(CASE WHEN c.claim_status = 'submitted' THEN 1 END) as submitted_claims,
  COUNT(CASE WHEN c.claim_status = 'under_review' THEN 1 END) as under_review_claims,
  COUNT(CASE WHEN c.claim_status = 'approved' THEN 1 END) as approved_claims,
  COUNT(CASE WHEN c.claim_status = 'denied' THEN 1 END) as denied_claims,
  COUNT(CASE WHEN c.claim_status = 'appealed' THEN 1 END) as appealed_claims,
  COUNT(CASE WHEN c.claim_status = 'recovered' THEN 1 END) as recovered_claims,

  -- Financial Totals (in INR)
  COALESCE(SUM(c.claimed_amount), 0) as total_claimed,
  COALESCE(SUM(c.approved_amount), 0) as total_approved,
  COALESCE(SUM(c.paid_amount), 0) as total_paid,
  COALESCE(SUM(c.outstanding_amount), 0) as total_outstanding,

  -- Denial Analytics
  COALESCE(SUM(CASE WHEN c.claim_status IN ('denied', 'appealed') THEN c.outstanding_amount ELSE 0 END), 0) as total_denied_amount,
  COALESCE(SUM(CASE WHEN c.claim_status IN ('denied', 'appealed') THEN c.outstanding_amount ELSE 0 END), 0) as recoverable_amount,

  -- Aging (calculated dynamically)
  COALESCE(AVG(EXTRACT(DAY FROM (CURRENT_DATE - c.submission_date::date))::int), 0)::int as avg_aged_days,
  COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_DATE - c.submission_date::date))::int > 30 AND c.claim_status NOT IN ('recovered', 'written_off') THEN 1 END) as aged_over_30_days,
  COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_DATE - c.submission_date::date))::int > 60 AND c.claim_status NOT IN ('recovered', 'written_off') THEN 1 END) as aged_over_60_days,
  COUNT(CASE WHEN EXTRACT(DAY FROM (CURRENT_DATE - c.submission_date::date))::int > 90 AND c.claim_status NOT IN ('recovered', 'written_off') THEN 1 END) as aged_over_90_days,

  -- Revenue Share (Gain-Share Model)
  COALESCE((SELECT SUM(agent_fee_amount) FROM recovery_transactions WHERE hospital_id = h.id), 0) as total_agent_fees,
  COALESCE((SELECT SUM(hospital_amount) FROM recovery_transactions WHERE hospital_id = h.id), 0) as total_hospital_recovered,
  COALESCE((SELECT SUM(recovery_amount) FROM recovery_transactions WHERE hospital_id = h.id), 0) as total_recovery_value,

  -- Appeal Stats
  (SELECT COUNT(*) FROM appeals a JOIN claims c2 ON a.claim_id = c2.id WHERE c2.hospital_id = h.id) as total_appeals,
  (SELECT COUNT(*) FROM appeals a JOIN claims c2 ON a.claim_id = c2.id WHERE c2.hospital_id = h.id AND a.appeal_status IN ('accepted', 'partially_accepted')) as successful_appeals,

  -- Calculated Metrics
  CASE
    WHEN COUNT(CASE WHEN c.claim_status = 'denied' THEN 1 END) > 0 THEN
      ROUND((COUNT(CASE WHEN c.claim_status = 'appealed' THEN 1 END)::decimal / COUNT(CASE WHEN c.claim_status = 'denied' THEN 1 END)::decimal * 100), 2)
    ELSE 0
  END as appeal_rate_percentage,

  CASE
    WHEN (SELECT COUNT(*) FROM appeals a JOIN claims c2 ON a.claim_id = c2.id WHERE c2.hospital_id = h.id) > 0 THEN
      ROUND((SELECT COUNT(*) FROM appeals a JOIN claims c2 ON a.claim_id = c2.id WHERE c2.hospital_id = h.id AND a.appeal_status IN ('accepted', 'partially_accepted'))::decimal /
            (SELECT COUNT(*) FROM appeals a JOIN claims c2 ON a.claim_id = c2.id WHERE c2.hospital_id = h.id)::decimal * 100, 2)
    ELSE 0
  END as appeal_success_rate_percentage,

  -- Timestamp
  now() as last_updated

FROM hospitals h
LEFT JOIN claims c ON c.hospital_id = h.id
WHERE h.status = 'active'
GROUP BY h.id, h.name;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_dashboard_metrics_hospital ON dashboard_metrics(hospital_id);

-- =====================================================
-- VIEW: Payer Performance
-- =====================================================
CREATE VIEW payer_performance AS
SELECT
  po.id as payer_id,
  po.name as payer_name,
  po.type as payer_type,
  COUNT(c.id) as total_claims,
  COUNT(CASE WHEN c.claim_status = 'denied' THEN 1 END) as denied_claims,
  COALESCE(SUM(c.claimed_amount), 0) as total_claimed_amount,
  COALESCE(SUM(CASE WHEN c.claim_status = 'denied' THEN c.outstanding_amount END), 0) as total_denied_amount,
  COALESCE(AVG(EXTRACT(DAY FROM (CURRENT_DATE - c.submission_date::date))::int), 0)::int as avg_processing_days,
  ROUND(
    CASE
      WHEN COUNT(c.id) > 0 THEN (COUNT(CASE WHEN c.claim_status = 'denied' THEN 1 END)::decimal / COUNT(c.id)::decimal * 100)
      ELSE 0
    END, 2
  ) as denial_rate_percentage,
  COUNT(a.id) as total_appeals,
  COUNT(CASE WHEN a.appeal_status IN ('accepted', 'partially_accepted') THEN 1 END) as successful_appeals,
  ROUND(
    CASE
      WHEN COUNT(a.id) > 0 THEN (COUNT(CASE WHEN a.appeal_status IN ('accepted', 'partially_accepted') THEN 1 END)::decimal / COUNT(a.id)::decimal * 100)
      ELSE 0
    END, 2
  ) as appeal_success_rate_percentage
FROM payer_organizations po
LEFT JOIN claims c ON c.payer_id = po.id
LEFT JOIN appeals a ON a.claim_id = c.id
GROUP BY po.id, po.name, po.type;

-- =====================================================
-- VIEW: High Priority Denials (for agent prioritization)
-- =====================================================
CREATE VIEW high_priority_denials AS
SELECT
  cd.id as denial_id,
  cd.claim_id,
  c.claim_number,
  c.hospital_id,
  h.name as hospital_name,
  c.payer_id,
  po.name as payer_name,
  cd.denial_category,
  cd.denial_amount,
  cd.recovery_probability,
  cd.estimated_recovery_amount,
  cd.recovery_effort_score,
  EXTRACT(DAY FROM (CURRENT_DATE - c.submission_date::date))::int as aged_days,
  -- Priority Score: High amount, high probability, low effort
  (
    (cd.denial_amount / 100000) * 0.4 +  -- Amount factor (normalized to lakhs)
    (COALESCE(cd.recovery_probability, 0.5) * 100) * 0.4 +  -- Probability factor
    ((11 - COALESCE(cd.recovery_effort_score, 5)) * 10) * 0.2  -- Inverse effort factor
  ) as priority_score,
  cd.created_at,
  -- Check if appeal already exists
  EXISTS(SELECT 1 FROM appeals a WHERE a.claim_id = cd.claim_id) as has_appeal
FROM claim_denials cd
JOIN claims c ON c.id = cd.claim_id
JOIN hospitals h ON h.id = c.hospital_id
JOIN payer_organizations po ON po.id = c.payer_id
WHERE c.claim_status IN ('denied', 'appealed')
  AND cd.denial_amount >= 5000  -- Minimum threshold
  AND NOT EXISTS(
    SELECT 1 FROM appeals a
    WHERE a.claim_id = cd.claim_id
    AND a.appeal_status IN ('accepted', 'partially_accepted')
  )
ORDER BY priority_score DESC;

-- =====================================================
-- VIEW: AI Agent Performance
-- =====================================================
CREATE VIEW agent_performance AS
SELECT
  agent_name,
  model_used,
  COUNT(*) as total_actions,
  COUNT(CASE WHEN success = true THEN 1 END) as successful_actions,
  ROUND(
    CASE
      WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN success = true THEN 1 END)::decimal / COUNT(*)::decimal * 100)
      ELSE 0
    END, 2
  ) as success_rate_percentage,
  COALESCE(AVG(execution_time_ms), 0)::int as avg_execution_time_ms,
  COALESCE(SUM(tokens_used), 0) as total_tokens_used,
  COALESCE(SUM(cost_usd), 0) as total_cost_usd,
  COALESCE(AVG(confidence_score), 0) as avg_confidence_score,
  COUNT(CASE WHEN reviewed_by_human = true THEN 1 END) as human_reviewed_count,
  COALESCE(AVG(CASE WHEN feedback_rating IS NOT NULL THEN feedback_rating END), 0) as avg_feedback_rating,
  MAX(created_at) as last_action_at
FROM agent_actions
GROUP BY agent_name, model_used;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_denials ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payer_knowledge_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: Hospitals
-- =====================================================

-- Super admins can access all hospitals
CREATE POLICY "Super admins can view all hospitals"
  ON hospitals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Hospital admins can view their own hospital
CREATE POLICY "Hospital admins can view their own hospital"
  ON hospitals FOR SELECT
  USING (
    id IN (
      SELECT hospital_id FROM users
      WHERE id = auth.uid()
      AND hospital_id IS NOT NULL
    )
  );

-- =====================================================
-- RLS POLICIES: Claims
-- =====================================================

-- Users can only access their hospital's claims
CREATE POLICY "Users can view their hospital claims"
  ON claims FOR SELECT
  USING (
    hospital_id IN (
      SELECT hospital_id FROM users
      WHERE id = auth.uid()
      AND hospital_id IS NOT NULL
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Users can insert claims for their hospital
CREATE POLICY "Users can insert claims for their hospital"
  ON claims FOR INSERT
  WITH CHECK (
    hospital_id IN (
      SELECT hospital_id FROM users
      WHERE id = auth.uid()
      AND role IN ('hospital_admin', 'billing_staff')
    )
  );

-- Users can update their hospital's claims
CREATE POLICY "Users can update their hospital claims"
  ON claims FOR UPDATE
  USING (
    hospital_id IN (
      SELECT hospital_id FROM users
      WHERE id = auth.uid()
      AND role IN ('hospital_admin', 'billing_staff')
    )
  );

-- =====================================================
-- RLS POLICIES: Denials, Appeals, Recovery
-- =====================================================

-- Similar policies for denials (via claim relationship)
CREATE POLICY "Users can view denials for their hospital claims"
  ON claim_denials FOR SELECT
  USING (
    claim_id IN (
      SELECT id FROM claims
      WHERE hospital_id IN (
        SELECT hospital_id FROM users WHERE id = auth.uid()
      )
    )
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Similar policies for appeals
CREATE POLICY "Users can view appeals for their hospital claims"
  ON appeals FOR SELECT
  USING (
    claim_id IN (
      SELECT id FROM claims
      WHERE hospital_id IN (
        SELECT hospital_id FROM users WHERE id = auth.uid()
      )
    )
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Similar policies for recovery transactions
CREATE POLICY "Users can view recovery for their hospital"
  ON recovery_transactions FOR SELECT
  USING (
    hospital_id IN (
      SELECT hospital_id FROM users WHERE id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- =====================================================
-- RLS POLICIES: Agent Actions
-- =====================================================

CREATE POLICY "Users can view agent actions for their hospital"
  ON agent_actions FOR SELECT
  USING (
    hospital_id IN (
      SELECT hospital_id FROM users WHERE id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Agent admin and super admin can insert agent actions
CREATE POLICY "Agents can insert actions"
  ON agent_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('agent_admin', 'super_admin')
    )
  );

-- =====================================================
-- RLS POLICIES: Notifications
-- =====================================================

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    hospital_id IN (
      SELECT hospital_id FROM users WHERE id = auth.uid()
    )
    OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES: Knowledge Graph
-- =====================================================

-- Everyone can read knowledge graph (it's anonymized data)
CREATE POLICY "Authenticated users can view knowledge graph"
  ON payer_knowledge_graph FOR SELECT
  TO authenticated
  USING (true);

-- Only agents and admins can update
CREATE POLICY "Agents can update knowledge graph"
  ON payer_knowledge_graph FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('agent_admin', 'super_admin')
    )
  );

-- =====================================================
-- REFRESH FUNCTION FOR MATERIALIZED VIEW
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON MATERIALIZED VIEW dashboard_metrics IS 'Pre-calculated dashboard metrics for fast retrieval';
COMMENT ON VIEW payer_performance IS 'Aggregated payer statistics for analysis';
COMMENT ON VIEW high_priority_denials IS 'Prioritized list of denials for AI agent processing';
COMMENT ON VIEW agent_performance IS 'AI agent performance metrics and cost tracking';


-- ============================================
-- SEED DATA
-- ============================================
-- Seed Data for Zero Risk Agent
-- Version: 1.0
-- Date: 2026-01-11
-- Description: Sample data for testing with Hope Hospital

-- =====================================================
-- SEED DATA: Hope Hospital
-- =====================================================

INSERT INTO hospitals (
  name,
  registration_number,
  type,
  address,
  contact_details,
  esic_code,
  esic_branch_code,
  cghs_wellness_center_code,
  cghs_empanelment_number,
  echs_polyclinic_code,
  echs_station_code,
  recovery_fee_percentage,
  min_claim_value_for_recovery,
  status
) VALUES (
  'Hope Hospital',
  'HOPE-MH-2010-12345',
  'private',
  '{
    "street": "123 Medical Plaza",
    "area": "Andheri West",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400058",
    "country": "India"
  }'::jsonb,
  '{
    "phone": "+91-22-12345678",
    "emergency": "+91-22-12345679",
    "email": "admin@hopehospital.com",
    "website": "https://hopehospital.com"
  }'::jsonb,
  'ESIC-MH-001',
  'MUM-WEST-01',
  'CGHS-MH-WC-001',
  'CGHS/2015/MH/12345',
  'ECHS-MH-PC-001',
  'MUMBAI-STATION-01',
  25.00,
  5000.00,
  'active'
);

-- =====================================================
-- SEED DATA: Sample Claims for Hope Hospital
-- =====================================================

-- Get Hope Hospital ID
DO $$
DECLARE
  v_hope_hospital_id uuid;
  v_esic_id uuid;
  v_cghs_id uuid;
  v_echs_id uuid;
  v_claim_id uuid;
  v_denial_id uuid;
BEGIN
  -- Get hospital and payer IDs
  SELECT id INTO v_hope_hospital_id FROM hospitals WHERE name = 'Hope Hospital';
  SELECT id INTO v_esic_id FROM payer_organizations WHERE code = 'ESIC';
  SELECT id INTO v_cghs_id FROM payer_organizations WHERE code = 'CGHS';
  SELECT id INTO v_echs_id FROM payer_organizations WHERE code = 'ECHS';

  -- =====================================================
  -- CLAIM 1: ESIC - Denied for Medical Necessity
  -- =====================================================
  INSERT INTO claims (
    hospital_id,
    payer_id,
    claim_number,
    hospital_claim_id,
    external_claim_id,
    patient_id_hash,
    patient_age,
    patient_gender,
    beneficiary_type,
    admission_date,
    discharge_date,
    claim_type,
    claimed_amount,
    primary_diagnosis_code,
    procedure_codes,
    treatment_summary,
    claim_status,
    submission_date
  ) VALUES (
    v_hope_hospital_id,
    v_esic_id,
    'HOPE-2025-ESI-001',
    'HH-IP-2025-0001',
    'ESIC/MH/2025/12345',
    encode(sha256('PATIENT-001'::bytea), 'hex'),
    45,
    'M',
    'ESIC Insured Person',
    '2025-12-15',
    '2025-12-20',
    'inpatient',
    125000.00,
    'I21.9', -- Acute Myocardial Infarction
    ARRAY['CPT-92980', 'CPT-93458'], -- PCI and cardiac catheterization
    'Patient admitted with acute MI. Underwent emergency PCI with stent placement. Recovered well.',
    'denied',
    '2025-12-25 10:30:00'
  ) RETURNING id INTO v_claim_id;

  -- Add denial for this claim
  INSERT INTO claim_denials (
    claim_id,
    denial_code,
    denial_category,
    denial_reason,
    denial_amount,
    denial_date,
    recovery_probability,
    estimated_recovery_amount,
    recovery_effort_score,
    ai_analysis,
    recommended_action
  ) VALUES (
    v_claim_id,
    'MED-NECESSITY-001',
    'medical_necessity',
    'Payer states that coronary angioplasty was not medically necessary based on submitted ECG reports. Requires additional clinical justification.',
    125000.00,
    '2026-01-05',
    0.75,
    93750.00,
    4,
    '{
      "primary_issue": "Insufficient clinical documentation",
      "missing_documents": ["ECG reports", "Troponin levels", "Cardiologist consultation notes"],
      "similar_cases": 15,
      "similar_cases_success_rate": 0.73,
      "recommended_strategy": "Provide comprehensive cardiac workup documentation and emergency nature justification"
    }'::jsonb,
    'Generate appeal with complete cardiac emergency documentation and cite ESIC cardiac care guidelines'
  );

  -- =====================================================
  -- CLAIM 2: CGHS - Denied for Documentation
  -- =====================================================
  INSERT INTO claims (
    hospital_id,
    payer_id,
    claim_number,
    hospital_claim_id,
    external_claim_id,
    patient_id_hash,
    patient_age,
    patient_gender,
    beneficiary_type,
    admission_date,
    discharge_date,
    claim_type,
    claimed_amount,
    primary_diagnosis_code,
    procedure_codes,
    treatment_summary,
    claim_status,
    submission_date
  ) VALUES (
    v_hope_hospital_id,
    v_cghs_id,
    'HOPE-2025-CGHS-001',
    'HH-IP-2025-0002',
    'CGHS/MH/WC001/2025/678',
    encode(sha256('PATIENT-002'::bytea), 'hex'),
    62,
    'F',
    'CGHS Beneficiary - Pensioner',
    '2025-12-18',
    '2025-12-28',
    'inpatient',
    280000.00,
    'C50.9', -- Breast Cancer
    ARRAY['CPT-19307', 'CPT-38525'], -- Mastectomy and sentinel node biopsy
    'Patient underwent modified radical mastectomy for breast cancer. Histopathology confirmed invasive ductal carcinoma.',
    'denied',
    '2026-01-02 14:20:00'
  ) RETURNING id INTO v_claim_id;

  INSERT INTO claim_denials (
    claim_id,
    denial_code,
    denial_category,
    denial_reason,
    denial_amount,
    denial_date,
    recovery_probability,
    estimated_recovery_amount,
    recovery_effort_score,
    ai_analysis,
    recommended_action
  ) VALUES (
    v_claim_id,
    'DOC-INCOMPLETE-002',
    'documentation_incomplete',
    'Missing required CGHS Form-2 (Referral from Wellness Center) and pre-authorization approval letter.',
    280000.00,
    '2026-01-08',
    0.85,
    238000.00,
    3,
    '{
      "primary_issue": "Missing mandatory forms",
      "missing_documents": ["CGHS Form-2", "Pre-authorization letter", "Wellness Center referral"],
      "procedural_error": true,
      "rectifiable": true,
      "timeline_status": "Within appeal window",
      "recommended_strategy": "Submit missing forms with backdated approval request citing emergency nature"
    }'::jsonb,
    'High priority - Obtain missing forms from patient, submit appeal with emergency treatment justification'
  );

  -- =====================================================
  -- CLAIM 3: ECHS - Denied for Tariff Dispute
  -- =====================================================
  INSERT INTO claims (
    hospital_id,
    payer_id,
    claim_number,
    hospital_claim_id,
    external_claim_id,
    patient_id_hash,
    patient_age,
    patient_gender,
    beneficiary_type,
    admission_date,
    discharge_date,
    claim_type,
    claimed_amount,
    approved_amount,
    primary_diagnosis_code,
    procedure_codes,
    treatment_summary,
    claim_status,
    submission_date
  ) VALUES (
    v_hope_hospital_id,
    v_echs_id,
    'HOPE-2025-ECHS-001',
    'HH-IP-2025-0003',
    'ECHS/MH/MUM/2025/890',
    encode(sha256('PATIENT-003'::bytea), 'hex'),
    68,
    'M',
    'ECHS Dependent - Ex-Serviceman Spouse',
    '2025-12-20',
    '2025-12-25',
    'inpatient',
    175000.00,
    95000.00,
    'M16.1', -- Knee Osteoarthritis
    ARRAY['CPT-27447'], -- Total knee replacement
    'Patient underwent total knee replacement for severe osteoarthritis. Surgery successful, mobility improved.',
    'partially_approved',
    '2025-12-28 11:00:00'
  ) RETURNING id INTO v_claim_id;

  INSERT INTO claim_denials (
    claim_id,
    denial_code,
    denial_category,
    denial_reason,
    denial_amount,
    denial_date,
    recovery_probability,
    estimated_recovery_amount,
    recovery_effort_score,
    ai_analysis,
    recommended_action
  ) VALUES (
    v_claim_id,
    'TARIFF-DISPUTE-001',
    'tariff_rate_dispute',
    'Hospital charged ₹175,000 but ECHS approved rate for total knee replacement is ₹95,000. Denied excess ₹80,000 as above approved tariff.',
    80000.00,
    '2026-01-09',
    0.45,
    36000.00,
    7,
    '{
      "primary_issue": "Rate cap dispute",
      "hospital_rate": 175000,
      "echs_rate": 95000,
      "difference": 80000,
      "negotiation_potential": "Medium",
      "similar_cases_success": 0.42,
      "recommended_strategy": "Negotiate partial settlement, cite special implant costs"
    }'::jsonb,
    'Medium priority - Provide implant cost breakdown, negotiate 40-50% recovery of difference'
  );

  -- =====================================================
  -- CLAIM 4: ESIC - Approved and Paid
  -- =====================================================
  INSERT INTO claims (
    hospital_id,
    payer_id,
    claim_number,
    hospital_claim_id,
    external_claim_id,
    patient_id_hash,
    patient_age,
    patient_gender,
    beneficiary_type,
    admission_date,
    discharge_date,
    claim_type,
    claimed_amount,
    approved_amount,
    paid_amount,
    primary_diagnosis_code,
    procedure_codes,
    treatment_summary,
    claim_status,
    submission_date
  ) VALUES (
    v_hope_hospital_id,
    v_esic_id,
    'HOPE-2025-ESI-002',
    'HH-IP-2025-0004',
    'ESIC/MH/2025/12399',
    encode(sha256('PATIENT-004'::bytea), 'hex'),
    32,
    'F',
    'ESIC Insured Person',
    '2025-12-10',
    '2025-12-12',
    'inpatient',
    45000.00,
    45000.00,
    45000.00,
    'O80', -- Normal delivery
    ARRAY['CPT-59400'], -- Vaginal delivery
    'Normal vaginal delivery. Mother and baby healthy.',
    'recovered',
    '2025-12-15 09:00:00'
  );

  -- =====================================================
  -- CLAIM 5: CGHS - Time Limit Exceeded
  -- =====================================================
  INSERT INTO claims (
    hospital_id,
    payer_id,
    claim_number,
    hospital_claim_id,
    patient_id_hash,
    patient_age,
    patient_gender,
    beneficiary_type,
    admission_date,
    discharge_date,
    claim_type,
    claimed_amount,
    primary_diagnosis_code,
    procedure_codes,
    treatment_summary,
    claim_status,
    submission_date
  ) VALUES (
    v_hope_hospital_id,
    v_cghs_id,
    'HOPE-2024-CGHS-099',
    'HH-IP-2024-0099',
    encode(sha256('PATIENT-005'::bytea), 'hex'),
    55,
    'M',
    'CGHS Beneficiary - Serving',
    '2024-10-05',
    '2024-10-12',
    'inpatient',
    150000.00,
    'K80.0', -- Gallstones
    ARRAY['CPT-47562'], -- Laparoscopic cholecystectomy
    'Laparoscopic cholecystectomy performed successfully.',
    'denied',
    '2025-01-15 10:00:00'
  ) RETURNING id INTO v_claim_id;

  INSERT INTO claim_denials (
    claim_id,
    denial_code,
    denial_category,
    denial_reason,
    denial_amount,
    denial_date,
    recovery_probability,
    estimated_recovery_amount,
    recovery_effort_score,
    ai_analysis,
    recommended_action
  ) VALUES (
    v_claim_id,
    'TIME-LIMIT-001',
    'time_limit_exceeded',
    'Claim submitted 95 days after discharge. CGHS requires submission within 90 days. Claim rejected as time-barred.',
    150000.00,
    '2025-01-20',
    0.20,
    30000.00,
    9,
    '{
      "primary_issue": "Late submission",
      "days_late": 5,
      "submission_deadline": "2024-01-10",
      "actual_submission": "2025-01-15",
      "condonation_possible": true,
      "condonation_conditions": "Valid reason for delay required",
      "recommended_strategy": "Request condonation of delay with valid justification"
    }'::jsonb,
    'Low priority - Submit condonation request with reasonable cause for delay, expect partial recovery at best'
  );

END $$;

-- =====================================================
-- SEED DATA: Sample User (Hospital Admin)
-- =====================================================

-- Note: This requires Supabase Auth to be set up
-- Create user via Supabase dashboard first, then run:
-- INSERT INTO users (id, hospital_id, email, full_name, phone, role, can_approve_appeals, can_view_financials, can_export_data)
-- SELECT
--   auth.uid(), -- This will be the actual user ID from Supabase Auth
--   id,
--   'admin@hopehospital.com',
--   'Dr. Rajesh Kumar',
--   '+91-98765-43210',
--   'hospital_admin',
--   true,
--   true,
--   true
-- FROM hospitals WHERE name = 'Hope Hospital';

-- =====================================================
-- REFRESH MATERIALIZED VIEW
-- =====================================================

SELECT refresh_dashboard_metrics();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check seeded data
SELECT
  'Hospitals' as entity,
  COUNT(*) as count
FROM hospitals
WHERE name = 'Hope Hospital'
UNION ALL
SELECT
  'Claims' as entity,
  COUNT(*) as count
FROM claims
WHERE hospital_id = (SELECT id FROM hospitals WHERE name = 'Hope Hospital')
UNION ALL
SELECT
  'Denials' as entity,
  COUNT(*) as count
FROM claim_denials
WHERE claim_id IN (
  SELECT id FROM claims
  WHERE hospital_id = (SELECT id FROM hospitals WHERE name = 'Hope Hospital')
)
UNION ALL
SELECT
  'Dashboard Metrics' as entity,
  COUNT(*) as count
FROM dashboard_metrics
WHERE hospital_name = 'Hope Hospital';
