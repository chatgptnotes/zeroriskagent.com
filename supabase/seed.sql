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
