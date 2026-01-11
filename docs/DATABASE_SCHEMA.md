# Database Schema: Zero Risk Agent
## Indian Healthcare Revenue Recovery System

### Overview
This database schema is designed for the autonomous healthcare revenue recovery agent, specifically targeting Indian healthcare systems including ESIC, CGHS, and ECHS.

---

## Core Entities

### 1. Hospitals
Stores information about hospitals using the system.

```sql
hospitals (
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
  recovery_fee_percentage decimal(5,2) DEFAULT 25.00,
  min_claim_value_for_recovery decimal(10,2) DEFAULT 5000.00,

  -- Status
  status text CHECK (status IN ('active', 'suspended', 'inactive')) DEFAULT 'active',
  onboarded_at timestamp DEFAULT now(),

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

### 2. Payer Organizations
Insurance and government health schemes.

```sql
payer_organizations (
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
  typical_processing_days int DEFAULT 30,
  appeal_levels int DEFAULT 3,
  max_appeal_days int DEFAULT 90,

  -- Integration
  api_endpoint text,
  api_auth_method text,
  has_direct_integration boolean DEFAULT false,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

### 3. Claims
Core claim tracking from hospital billing system.

```sql
claims (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id uuid REFERENCES hospitals(id) NOT NULL,
  payer_id uuid REFERENCES payer_organizations(id) NOT NULL,

  -- Claim Identification
  claim_number text UNIQUE NOT NULL,
  hospital_claim_id text NOT NULL,
  external_claim_id text, -- From payer system

  -- Patient Information (minimal, HIPAA-compliant)
  patient_id_hash text NOT NULL, -- One-way hash of patient ID
  patient_age int,
  patient_gender text CHECK (patient_gender IN ('M', 'F', 'O')),
  beneficiary_type text, -- For ESIC/CGHS/ECHS classification

  -- Claim Details
  admission_date date,
  discharge_date date,
  claim_type text CHECK (claim_type IN ('inpatient', 'outpatient', 'daycare', 'diagnostic', 'pharmacy')) NOT NULL,

  -- Financial
  claimed_amount decimal(12,2) NOT NULL,
  approved_amount decimal(12,2),
  paid_amount decimal(12,2) DEFAULT 0,
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
  submission_date timestamp NOT NULL,
  last_status_update timestamp DEFAULT now(),
  payment_due_date date,
  aged_days int GENERATED ALWAYS AS (EXTRACT(DAY FROM (now() - submission_date))) STORED,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

### 4. Claim Denials
Tracks denial reasons and patterns.

```sql
claim_denials (
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
  denial_amount decimal(12,2) NOT NULL,

  -- Payer Communication
  denial_date date NOT NULL,
  denial_letter_url text, -- Stored document
  payer_reference_number text,

  -- Recovery Analysis
  recovery_probability decimal(3,2), -- 0.00 to 1.00 (AI-predicted)
  estimated_recovery_amount decimal(12,2),
  recovery_effort_score int CHECK (recovery_effort_score BETWEEN 1 AND 10),

  -- AI Agent Analysis
  ai_analysis jsonb, -- Structured analysis from LLM
  recommended_action text,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

### 5. Appeals
Tracks appeal process and outcomes.

```sql
appeals (
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
  policy_references text[],

  -- Generation Info
  generated_by text CHECK (generated_by IN ('ai_agent', 'human', 'hybrid')) DEFAULT 'ai_agent',
  ai_model_used text,
  ai_confidence_score decimal(3,2),

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
  outcome_amount decimal(12,2),
  outcome_reason text,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

### 6. Recovery Transactions
Tracks successful recoveries and revenue sharing.

```sql
recovery_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id uuid REFERENCES hospitals(id) NOT NULL,
  claim_id uuid REFERENCES claims(id) NOT NULL,
  appeal_id uuid REFERENCES appeals(id),

  -- Recovery Details
  recovery_amount decimal(12,2) NOT NULL,
  recovery_date date NOT NULL,
  recovery_method text CHECK (recovery_method IN ('direct_payment', 'adjustment', 'settlement')) NOT NULL,

  -- Revenue Share Calculation
  agent_fee_percentage decimal(5,2) NOT NULL,
  agent_fee_amount decimal(12,2) NOT NULL,
  hospital_amount decimal(12,2) NOT NULL,

  -- Payment Details
  payment_status text CHECK (payment_status IN ('pending', 'processed', 'failed', 'disputed')) DEFAULT 'pending',
  payment_reference_number text,
  payment_date date,

  -- Invoice
  invoice_number text UNIQUE,
  invoice_url text,

  -- Metadata
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)
```

### 7. Agent Actions
Audit trail of AI agent activities.

```sql
agent_actions (
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
    'escalation'
  )) NOT NULL,

  -- Context
  claim_id uuid REFERENCES claims(id),
  appeal_id uuid REFERENCES appeals(id),
  hospital_id uuid REFERENCES hospitals(id),

  -- Agent Details
  agent_name text NOT NULL,
  agent_version text NOT NULL,
  model_used text,

  -- Execution
  input_data jsonb,
  output_data jsonb,
  tokens_used int,
  execution_time_ms int,

  -- Result
  success boolean NOT NULL,
  error_message text,
  confidence_score decimal(3,2),

  -- Human Review
  reviewed_by_human boolean DEFAULT false,
  human_feedback text,
  feedback_rating int CHECK (feedback_rating BETWEEN 1 AND 5),

  -- Metadata
  created_at timestamp DEFAULT now()
)
```

### 8. Payer Knowledge Graph
Learns patterns from historical data.

```sql
payer_knowledge_graph (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  payer_id uuid REFERENCES payer_organizations(id) NOT NULL,

  -- Pattern Details
  pattern_type text CHECK (pattern_type IN (
    'denial_reason_pattern',
    'approval_criteria',
    'documentation_requirement',
    'processing_time_pattern',
    'appeal_success_factor',
    'contact_escalation_path'
  )) NOT NULL,

  -- Pattern Data
  pattern_key text NOT NULL, -- e.g., "ICD_CODE:E11.9"
  pattern_value jsonb NOT NULL,

  -- Statistics
  occurrence_count int DEFAULT 1,
  success_rate decimal(3,2),
  avg_recovery_amount decimal(12,2),

  -- Confidence
  confidence_level decimal(3,2) DEFAULT 0.50,
  last_validated_at timestamp,

  -- Metadata
  first_observed_at timestamp DEFAULT now(),
  last_observed_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),

  UNIQUE(payer_id, pattern_type, pattern_key)
)
```

### 9. Users
System users (hospital staff, admins).

```sql
users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id),

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
)
```

### 10. Notifications
System notifications and alerts.

```sql
notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  hospital_id uuid REFERENCES hospitals(id),

  -- Notification Details
  type text CHECK (type IN (
    'claim_denied',
    'appeal_submitted',
    'appeal_accepted',
    'recovery_received',
    'action_required',
    'system_alert'
  )) NOT NULL,

  title text NOT NULL,
  message text NOT NULL,

  -- Links
  claim_id uuid REFERENCES claims(id),
  appeal_id uuid REFERENCES appeals(id),
  action_url text,

  -- Status
  read boolean DEFAULT false,
  read_at timestamp,

  -- Metadata
  created_at timestamp DEFAULT now()
)
```

---

## Indexes

```sql
-- Claims
CREATE INDEX idx_claims_hospital_status ON claims(hospital_id, claim_status);
CREATE INDEX idx_claims_payer_status ON claims(payer_id, claim_status);
CREATE INDEX idx_claims_submission_date ON claims(submission_date DESC);
CREATE INDEX idx_claims_aged_days ON claims(aged_days DESC);

-- Denials
CREATE INDEX idx_denials_claim ON claim_denials(claim_id);
CREATE INDEX idx_denials_category ON claim_denials(denial_category);
CREATE INDEX idx_denials_recovery_prob ON claim_denials(recovery_probability DESC);

-- Appeals
CREATE INDEX idx_appeals_claim ON appeals(claim_id);
CREATE INDEX idx_appeals_status ON appeals(appeal_status);
CREATE INDEX idx_appeals_submitted_date ON appeals(submitted_date DESC);

-- Recovery
CREATE INDEX idx_recovery_hospital ON recovery_transactions(hospital_id);
CREATE INDEX idx_recovery_date ON recovery_transactions(recovery_date DESC);

-- Agent Actions
CREATE INDEX idx_agent_actions_claim ON agent_actions(claim_id);
CREATE INDEX idx_agent_actions_type ON agent_actions(action_type);
CREATE INDEX idx_agent_actions_created ON agent_actions(created_at DESC);

-- Knowledge Graph
CREATE INDEX idx_knowledge_payer_pattern ON payer_knowledge_graph(payer_id, pattern_type);
```

---

## Row Level Security (RLS) Policies

```sql
-- Users can only access their hospital's data
CREATE POLICY hospital_isolation_policy ON claims
  FOR ALL
  USING (hospital_id IN (
    SELECT hospital_id FROM users WHERE id = auth.uid()
  ));

-- Super admins can access everything
CREATE POLICY super_admin_policy ON claims
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Similar policies for other tables
```

---

## Views

### Dashboard Metrics View

```sql
CREATE VIEW dashboard_metrics AS
SELECT
  h.id as hospital_id,
  h.name as hospital_name,
  COUNT(c.id) as total_claims,
  COUNT(CASE WHEN c.claim_status = 'denied' THEN 1 END) as denied_claims,
  COUNT(CASE WHEN c.claim_status = 'recovered' THEN 1 END) as recovered_claims,
  SUM(c.claimed_amount) as total_claimed,
  SUM(c.paid_amount) as total_paid,
  SUM(c.outstanding_amount) as total_outstanding,
  SUM(CASE WHEN c.claim_status IN ('denied', 'appealed') THEN c.outstanding_amount ELSE 0 END) as recoverable_amount,
  AVG(c.aged_days) as avg_aged_days,
  (SELECT SUM(agent_fee_amount) FROM recovery_transactions WHERE hospital_id = h.id) as total_agent_fees,
  (SELECT SUM(hospital_amount) FROM recovery_transactions WHERE hospital_id = h.id) as total_hospital_recovered
FROM hospitals h
LEFT JOIN claims c ON c.hospital_id = h.id
GROUP BY h.id, h.name;
```

---

Version: 1.0
Date: 2026-01-11
Repository: zeroriskagent.com
