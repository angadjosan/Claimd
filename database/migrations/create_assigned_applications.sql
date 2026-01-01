CREATE TABLE assigned_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- The reviewer (caseworker) assigned to the application
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- The application being reviewed
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Review status
  review_status review_status NOT NULL DEFAULT 'unopened',
  
  -- Assignment metadata
  assigned_by UUID REFERENCES users(id), -- Admin who made the assignment
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Review progress tracking
  first_opened_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Reviewer notes (internal, not visible to applicant)
  reviewer_notes TEXT,
  
  -- Review outcome (when completed)
  recommendation review_recommendation,
  recommendation_notes TEXT,
  
  -- Priority level for the reviewer's queue
  priority INTEGER DEFAULT 0, -- Higher = more urgent
  
  -- Due date for review completion
  due_date DATE,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure a reviewer can only be assigned to an application once
  CONSTRAINT unique_reviewer_application UNIQUE (reviewer_id, application_id)
);

-- First, create the enum for review recommendation
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_recommendation') THEN
    CREATE TYPE review_recommendation AS ENUM (
      'approve',
      'deny', 
      'request_more_info',
      'escalate',
      'needs_medical_review'
    );
  END IF;
END $$;

-- Add the column if enum was just created
ALTER TABLE assigned_applications 
  ADD COLUMN IF NOT EXISTS recommendation review_recommendation;

-- Indexes for common queries
CREATE INDEX idx_assigned_applications_reviewer_id ON assigned_applications(reviewer_id);
CREATE INDEX idx_assigned_applications_application_id ON assigned_applications(application_id);
CREATE INDEX idx_assigned_applications_review_status ON assigned_applications(review_status);
CREATE INDEX idx_assigned_applications_priority ON assigned_applications(priority DESC);
CREATE INDEX idx_assigned_applications_due_date ON assigned_applications(due_date);

-- Composite index for reviewer's queue
CREATE INDEX idx_assigned_applications_reviewer_queue 
  ON assigned_applications(reviewer_id, review_status, priority DESC, due_date);

-- Trigger for updated_at
CREATE TRIGGER assigned_applications_updated_at
  BEFORE UPDATE ON assigned_applications
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- Comments for documentation
COMMENT ON TABLE assigned_applications IS 'Many-to-many relationship linking caseworkers to applications for review';
COMMENT ON COLUMN assigned_applications.review_status IS 'Current status of this reviewer''s review (unopened, in_progress, completed)';
COMMENT ON COLUMN assigned_applications.reviewer_notes IS 'Internal notes from reviewer, not visible to applicant';
COMMENT ON COLUMN assigned_applications.recommendation IS 'Reviewer''s recommendation after completing review';
