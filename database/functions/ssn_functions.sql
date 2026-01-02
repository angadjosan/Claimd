-- =====================================================
-- App Secrets Table (for storing pepper securely)
-- =====================================================
CREATE TABLE IF NOT EXISTS app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Enable RLS and lock it down completely
ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- Remove all public access - only SECURITY DEFINER functions can read it
REVOKE ALL ON app_secrets FROM PUBLIC;
REVOKE ALL ON app_secrets FROM authenticated;
REVOKE ALL ON app_secrets FROM anon;

-- Insert the pepper (CHANGE THIS VALUE IN PRODUCTION!)
INSERT INTO app_secrets (key, value) 
VALUES ('ssn_pepper', 'change-me-to-a-random-32-character-string')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SSN Functions
-- =====================================================

-- Function to hash an SSN for storage
-- Uses SHA-256 with a pepper from app_secrets table
CREATE OR REPLACE FUNCTION hash_ssn(ssn TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pepper TEXT;
  normalized_ssn TEXT;
BEGIN
  -- Read pepper from app_secrets table
  SELECT value INTO pepper FROM app_secrets WHERE key = 'ssn_pepper';
  
  -- Normalize SSN: remove dashes and spaces
  normalized_ssn := regexp_replace(ssn, '[^0-9]', '', 'g');
  
  -- Validate SSN format (9 digits)
  IF length(normalized_ssn) != 9 THEN
    RAISE EXCEPTION 'Invalid SSN format';
  END IF;
  
  -- Return SHA-256 hash with pepper
  RETURN encode(
    digest(normalized_ssn || COALESCE(pepper, ''), 'sha256'),
    'hex'
  );
END;
$$;

-- Function to verify an SSN against stored hash
CREATE OR REPLACE FUNCTION verify_ssn(ssn TEXT, stored_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN hash_ssn(ssn) = stored_hash;
END;
$$;

-- Function to get last 4 digits of SSN (for display purposes only)
-- This should be called with the original SSN, NOT the hash
CREATE OR REPLACE FUNCTION get_ssn_last_four(ssn TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized_ssn TEXT;
BEGIN
  normalized_ssn := regexp_replace(ssn, '[^0-9]', '', 'g');
  
  IF length(normalized_ssn) != 9 THEN
    RETURN NULL;
  END IF;
  
  RETURN 'XXX-XX-' || right(normalized_ssn, 4);
END;
$$;

-- Revoke direct access - only accessible through defined functions
REVOKE ALL ON FUNCTION hash_ssn(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION verify_ssn(TEXT, TEXT) FROM PUBLIC;

-- Grant to authenticated users (will be further restricted by RLS)
GRANT EXECUTE ON FUNCTION hash_ssn(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_ssn(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ssn_last_four(TEXT) TO authenticated;

-- Comments
COMMENT ON FUNCTION hash_ssn IS 'Securely hash an SSN using SHA-256 with pepper. Original SSN is never stored.';
COMMENT ON FUNCTION verify_ssn IS 'Verify an SSN against a stored hash';
COMMENT ON FUNCTION get_ssn_last_four IS 'Get masked SSN showing only last 4 digits (XXX-XX-1234)';
