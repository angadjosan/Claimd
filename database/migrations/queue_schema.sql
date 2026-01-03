-- Create the processing queue table
CREATE TABLE IF NOT EXISTS processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id),
    task_type TEXT NOT NULL, -- e.g., 'extract_info', 'reasoning'
    payload JSONB DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    attempts INT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    locked_at TIMESTAMPTZ
);

-- Index for faster polling
CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_processing_queue_created_at ON processing_queue(created_at);
