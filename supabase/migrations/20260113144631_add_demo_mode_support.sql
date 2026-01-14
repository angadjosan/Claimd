-- Migration: add_demo_mode_support
-- 1. Add is_demo_user column to users table:
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT FALSE;

-- 2. Add demo_session_id column to applications table (for session isolation):
ALTER TABLE applications ADD COLUMN IF NOT EXISTS demo_session_id UUID;
CREATE INDEX IF NOT EXISTS idx_applications_demo_session_id ON applications(demo_session_id);