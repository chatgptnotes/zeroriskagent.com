-- File Uploads Table and Storage Bucket Setup
-- Run this in Supabase SQL Editor

-- Create file_uploads table (simplified, no foreign key dependencies)
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID,
  records_count INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_uploads_hospital_id ON file_uploads(hospital_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(status);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at DESC);

-- Enable RLS
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified - users can only access their own uploads)

-- Users can view their own uploads
CREATE POLICY "Users can view own uploads"
  ON file_uploads FOR SELECT
  USING (auth.uid() = uploaded_by);

-- Users can insert their own uploads
CREATE POLICY "Users can insert own uploads"
  ON file_uploads FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Users can update their own uploads
CREATE POLICY "Users can update own uploads"
  ON file_uploads FOR UPDATE
  USING (auth.uid() = uploaded_by);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
  ON file_uploads FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_file_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_uploads_updated_at
  BEFORE UPDATE ON file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_file_uploads_updated_at();
