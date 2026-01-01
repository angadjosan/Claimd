CREATE TABLE application_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to application
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Link to uploader
  uploaded_by UUID NOT NULL REFERENCES users(id),
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  file_size INTEGER, -- bytes
  
  -- Storage reference (Supabase Storage path)
  storage_bucket TEXT NOT NULL DEFAULT 'application-files',
  storage_path TEXT NOT NULL,
  
  -- File category for organization
  category TEXT NOT NULL, -- e.g., 'medical_records', 'w2_forms', 'birth_certificate'
  
  -- Optional description
  description TEXT,
  
  -- For documents like W2s that have a year
  document_year INTEGER,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_application_files_application_id ON application_files(application_id);
CREATE INDEX idx_application_files_category ON application_files(category);
CREATE INDEX idx_application_files_uploaded_by ON application_files(uploaded_by);

-- Trigger for updated_at
CREATE TRIGGER application_files_updated_at
  BEFORE UPDATE ON application_files
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- Comments
COMMENT ON TABLE application_files IS 'Tracks files uploaded for applications, stored in Supabase Storage';
COMMENT ON COLUMN application_files.storage_path IS 'Path to file in Supabase Storage bucket';
