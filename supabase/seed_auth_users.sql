-- Seed Script: Authentication Users
-- Version: 1.1
-- Date: 2026-01-20
-- Description: Creates mock users for testing authentication system

-- Note: This script creates users in the auth.users table and corresponding profiles
-- For production use, users should register through the application

-- =====================================================
-- INSERT MOCK USERS INTO AUTH.USERS TABLE
-- =====================================================

-- Super Admin User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000',
  'admin@hopehospital.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Hospital Admin User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000000',
  'hope@hopehospital.com',
  crypt('hope123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Billing Staff User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '00000000-0000-0000-0000-000000000000',
  'staff@hopehospital.com',
  crypt('staff123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Doctor User
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '00000000-0000-0000-0000-000000000000',
  'doctor@hopehospital.com',
  crypt('doctor123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INSERT CORRESPONDING USER PROFILES
-- =====================================================

-- Get Hope Hospital ID
DO $$
DECLARE
  hope_hospital_id uuid;
BEGIN
  SELECT id INTO hope_hospital_id FROM hospitals WHERE name = 'Hope Hospital' LIMIT 1;
  
  IF hope_hospital_id IS NOT NULL THEN
    
    -- Super Admin Profile
    INSERT INTO users (
      id,
      email,
      full_name,
      phone,
      role,
      hospital_id,
      can_approve_appeals,
      can_view_financials,
      can_export_data,
      status,
      created_at,
      updated_at
    ) VALUES (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'admin@hopehospital.com',
      'Super Administrator',
      '+91-9876543210',
      'super_admin',
      NULL,
      true,
      true,
      true,
      'active',
      now(),
      now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Hospital Admin Profile
    INSERT INTO users (
      id,
      email,
      full_name,
      phone,
      role,
      hospital_id,
      can_approve_appeals,
      can_view_financials,
      can_export_data,
      status,
      created_at,
      updated_at
    ) VALUES (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'hope@hopehospital.com',
      'Hope Hospital Admin',
      '+91-9876543211',
      'hospital_admin',
      hope_hospital_id,
      true,
      true,
      true,
      'active',
      now(),
      now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Billing Staff Profile
    INSERT INTO users (
      id,
      email,
      full_name,
      phone,
      role,
      hospital_id,
      can_approve_appeals,
      can_view_financials,
      can_export_data,
      status,
      created_at,
      updated_at
    ) VALUES (
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      'staff@hopehospital.com',
      'Billing Staff Member',
      '+91-9876543212',
      'billing_staff',
      hope_hospital_id,
      false,
      false,
      false,
      'active',
      now(),
      now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Doctor Profile
    INSERT INTO users (
      id,
      email,
      full_name,
      phone,
      role,
      hospital_id,
      can_approve_appeals,
      can_view_financials,
      can_export_data,
      status,
      created_at,
      updated_at
    ) VALUES (
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'doctor@hopehospital.com',
      'Dr. Medical Professional',
      '+91-9876543213',
      'doctor',
      hope_hospital_id,
      false,
      false,
      false,
      'active',
      now(),
      now()
    ) ON CONFLICT (id) DO NOTHING;

  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES (for debugging)
-- =====================================================

-- Check if users were created successfully
SELECT 
  u.email,
  p.full_name,
  p.role,
  h.name as hospital_name,
  p.status,
  p.can_approve_appeals,
  p.can_view_financials,
  p.can_export_data
FROM auth.users u
JOIN users p ON u.id = p.id
LEFT JOIN hospitals h ON p.hospital_id = h.id
WHERE u.email LIKE '%@hopehospital.com'
ORDER BY p.role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE auth.users IS 'Supabase authentication users table with mock data';

-- Update refresh materialized view to include new data
REFRESH MATERIALIZED VIEW dashboard_metrics;

-- Print success message
DO $$
BEGIN
  RAISE NOTICE 'Mock authentication users created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Login Credentials for Testing:';
  RAISE NOTICE '1. Super Admin: admin@hopehospital.com / admin123';
  RAISE NOTICE '2. Hospital Admin: hope@hopehospital.com / hope123';
  RAISE NOTICE '3. Billing Staff: staff@hopehospital.com / staff123';
  RAISE NOTICE '4. Doctor: doctor@hopehospital.com / doctor123';
  RAISE NOTICE '';
  RAISE NOTICE 'All users are active and can login immediately.';
END $$;