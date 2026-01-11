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

  -- Calculated field for aging
  aged_days int GENERATED ALWAYS AS (
    EXTRACT(DAY FROM (now() - submission_date))::int
  ) STORED,

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
CREATE INDEX idx_claims_aged_days ON claims(aged_days DESC) WHERE claim_status IN ('submitted', 'under_review', 'denied', 'appealed');
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
COMMENT ON COLUMN claims.aged_days IS 'Automatically calculated number of days since submission';
COMMENT ON COLUMN claims.outstanding_amount IS 'Automatically calculated as claimed_amount - paid_amount';
COMMENT ON COLUMN claim_denials.recovery_probability IS 'AI-predicted probability of successful recovery (0.00 to 1.00)';
COMMENT ON COLUMN claim_denials.recovery_effort_score IS 'Effort required for recovery (1=easy, 10=very difficult)';
COMMENT ON COLUMN claim_denials.ai_analysis IS 'JSON structure with detailed AI analysis including patterns, similar cases, recommended strategy';
