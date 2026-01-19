-- Migration: add_demo_email_tracking
-- Create table to track emails of users who access the demo

CREATE TABLE IF NOT EXISTS demo_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  demo_session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_demo_email_tracking_email ON demo_email_tracking(email);

-- Create index on demo_session_id for linking to demo sessions
CREATE INDEX IF NOT EXISTS idx_demo_email_tracking_session_id ON demo_email_tracking(demo_session_id);

-- Create index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_demo_email_tracking_created_at ON demo_email_tracking(created_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_demo_email_tracking_updated_at
  BEFORE UPDATE ON demo_email_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
