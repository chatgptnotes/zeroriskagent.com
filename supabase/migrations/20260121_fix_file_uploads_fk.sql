-- Migration: Fix file_uploads foreign key constraint
-- Problem: uploaded_by references auth.users(id) but app uses zero_login_user table
-- Solution: Change FK to reference zero_login_user instead

-- Drop the existing foreign key constraint
ALTER TABLE file_uploads
DROP CONSTRAINT IF EXISTS file_uploads_uploaded_by_fkey;

-- Add new foreign key referencing zero_login_user
ALTER TABLE file_uploads
ADD CONSTRAINT file_uploads_uploaded_by_fkey
FOREIGN KEY (uploaded_by) REFERENCES zero_login_user(id) ON DELETE CASCADE;

-- v2.6 - 2026-01-21 - zeroriskagent.com
