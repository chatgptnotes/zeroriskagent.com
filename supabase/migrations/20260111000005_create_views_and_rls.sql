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

  -- Aging
  COALESCE(AVG(c.aged_days), 0)::int as avg_aged_days,
  COUNT(CASE WHEN c.aged_days > 30 AND c.claim_status NOT IN ('recovered', 'written_off') THEN 1 END) as aged_over_30_days,
  COUNT(CASE WHEN c.aged_days > 60 AND c.claim_status NOT IN ('recovered', 'written_off') THEN 1 END) as aged_over_60_days,
  COUNT(CASE WHEN c.aged_days > 90 AND c.claim_status NOT IN ('recovered', 'written_off') THEN 1 END) as aged_over_90_days,

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
  COALESCE(AVG(c.aged_days), 0)::int as avg_processing_days,
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
  c.aged_days,
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
