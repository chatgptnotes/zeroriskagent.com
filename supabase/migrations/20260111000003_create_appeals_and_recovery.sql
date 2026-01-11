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
