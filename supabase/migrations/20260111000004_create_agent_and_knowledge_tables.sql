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
