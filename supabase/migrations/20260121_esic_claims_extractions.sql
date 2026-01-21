-- Create table for storing ESIC claims extractions
CREATE TABLE IF NOT EXISTS esic_claims_extractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hospital_name TEXT NOT NULL,
    extracted_at TIMESTAMPTZ NOT NULL,
    total_claims JSONB NOT NULL DEFAULT '{"inPatient": 0, "opd": 0, "counts": 0, "enhancement": 0}',
    stage_data JSONB NOT NULL DEFAULT '[]',
    upload_id UUID REFERENCES file_uploads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_esic_extractions_created_at ON esic_claims_extractions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_esic_extractions_hospital ON esic_claims_extractions(hospital_name);
CREATE INDEX IF NOT EXISTS idx_esic_extractions_upload ON esic_claims_extractions(upload_id);

-- Enable RLS (Row Level Security)
ALTER TABLE esic_claims_extractions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read all data
CREATE POLICY "Users can view ESIC extractions" ON esic_claims_extractions
    FOR SELECT TO authenticated USING (true);

-- Create policy for authenticated users to insert data
CREATE POLICY "Users can insert ESIC extractions" ON esic_claims_extractions
    FOR INSERT TO authenticated WITH CHECK (true);

-- Create policy for authenticated users to update their own data
CREATE POLICY "Users can update ESIC extractions" ON esic_claims_extractions
    FOR UPDATE TO authenticated USING (true);

-- Create policy for authenticated users to delete data
CREATE POLICY "Users can delete ESIC extractions" ON esic_claims_extractions
    FOR DELETE TO authenticated USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_esic_extractions_updated_at
    BEFORE UPDATE ON esic_claims_extractions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();