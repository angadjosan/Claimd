CREATE TABLE application_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference to application
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Status change details
  previous_status application_status,
  new_status application_status NOT NULL,
  
  -- Who made the change
  changed_by UUID REFERENCES users(id),
  
  -- Reason/notes for the change
  notes TEXT,
  
  -- Timestamp
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying history
CREATE INDEX idx_application_status_history_application_id 
  ON application_status_history(application_id, changed_at DESC);

-- Comments
COMMENT ON TABLE application_status_history IS 'Audit trail tracking all status changes for applications';
