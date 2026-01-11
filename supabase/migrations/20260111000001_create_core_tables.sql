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
