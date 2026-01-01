CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to Supabase Auth
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User role for RLS
  role user_role NOT NULL DEFAULT 'applicant',
  
  -- Profile information
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  
  -- For applicants: profile completeness
  profile_complete BOOLEAN DEFAULT FALSE,
  
  -- For caseworkers/admins: department info
  department TEXT,
  employee_id TEXT,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for common queries
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_active = TRUE;

-- Trigger for updated_at
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- Comments for documentation
COMMENT ON TABLE users IS 'Core users table with role-based access (applicant, administrator, caseworker)';
COMMENT ON COLUMN users.role IS 'User role for Row Level Security policies';
COMMENT ON COLUMN users.auth_id IS 'References Supabase Auth user ID';
