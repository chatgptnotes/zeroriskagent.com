-- Simple Login Users for Zero Risk Agent
-- Copy-paste this in Supabase SQL Editor and run

-- Create zero_login_user table
CREATE TABLE IF NOT EXISTS public.zero_login_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  password text NOT NULL,
  role text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamp DEFAULT now()
);

-- Security disabled for simplified setup
-- ALTER TABLE public.zero_login_user ENABLE ROW LEVEL SECURITY;

-- Create simple test users
-- Independent table with no auth.users dependency

-- Super Admin User
INSERT INTO public.zero_login_user (email, full_name, password, role) 
VALUES ('admin@hopehospital.com', 'Admin User', 'admin123', 'super_admin');

-- Hospital User
INSERT INTO public.zero_login_user (email, full_name, password, role)
VALUES ('hope@hopehospital.com', 'Hope Hospital User', 'hope123', 'hospital_admin');

-- Staff User
INSERT INTO public.zero_login_user (email, full_name, password, role)
VALUES ('staff@hopehospital.com', 'Staff User', 'staff123', 'billing_staff');

-- Show created users
SELECT email, full_name, role, created_at FROM public.zero_login_user;

-- Success message
SELECT 'LOGIN CREDENTIALS:' as message;
SELECT 'admin@hopehospital.com / admin123 (Super Admin)' as credentials;
SELECT 'hope@hopehospital.com / hope123 (Hospital Admin)' as credentials;  
SELECT 'staff@hopehospital.com / staff123 (Staff)' as credentials;