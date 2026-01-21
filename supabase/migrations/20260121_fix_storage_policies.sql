-- Fix Storage Policies for claim-uploads Bucket
-- This migration removes restrictive policies and allows all authenticated users
-- to upload/read/delete files in the claim-uploads bucket

-- Drop ALL existing policies on storage.objects for claim-uploads
DO $$
DECLARE
  policy_name TEXT;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
  END LOOP;
END $$;

-- Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-uploads', 'claim-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow all operations for authenticated users (no folder restrictions)
CREATE POLICY "Allow all for authenticated"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'claim-uploads')
WITH CHECK (bucket_id = 'claim-uploads');
