-- ============================================
-- 001_seed_admin.sql
-- Seed initial administrator user
-- Run this AFTER setting up Supabase Auth
-- ============================================

-- NOTE: You must first create a user in Supabase Auth
-- Then use their auth.users.id here

-- Example: Insert admin user after they sign up
-- Replace 'AUTH_USER_ID_HERE' with actual auth.users.id

/*
INSERT INTO users (
  auth_id,
  role,
  email,
  first_name,
  last_name,
  department,
  employee_id,
  is_active
) VALUES (
  'AUTH_USER_ID_HERE'::UUID,
  'administrator',
  'admin@example.com',
  'Admin',
  'User',
  'Administration',
  'EMP001',
  TRUE
);
*/

-- Function to promote a user to admin (run by superuser)
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user users;
BEGIN
  UPDATE users
  SET role = 'administrator'
  WHERE email = user_email
  RETURNING * INTO v_user;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  RETURN v_user;
END;
$$;

-- Function to create caseworker
CREATE OR REPLACE FUNCTION create_caseworker(
  p_auth_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_department TEXT DEFAULT NULL,
  p_employee_id TEXT DEFAULT NULL
)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user users;
BEGIN
  -- Only administrators can create caseworkers
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() 
    AND role = 'administrator'
  ) THEN
    RAISE EXCEPTION 'Only administrators can create caseworkers';
  END IF;
  
  INSERT INTO users (
    auth_id,
    role,
    email,
    first_name,
    last_name,
    department,
    employee_id,
    is_active
  ) VALUES (
    p_auth_id,
    'caseworker',
    p_email,
    p_first_name,
    p_last_name,
    p_department,
    p_employee_id,
    TRUE
  )
  RETURNING * INTO v_user;
  
  RETURN v_user;
END;
$$;

GRANT EXECUTE ON FUNCTION create_caseworker TO authenticated;
