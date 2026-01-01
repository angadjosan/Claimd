-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE auth_id = auth.uid();
$$;

-- Helper function to get current user's ID
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM users WHERE auth_id = auth.uid();
$$;

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Applicants can view their own profile
CREATE POLICY "users_select_own"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- Caseworkers can view all users (needed to see applicant info)
CREATE POLICY "users_select_caseworker"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role IN ('caseworker', 'administrator')
    )
  );

-- Administrators can view all users
CREATE POLICY "users_select_admin"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  );

-- Users can update their own profile
CREATE POLICY "users_update_own"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (
    auth_id = auth.uid()
    -- Prevent users from changing their own role
    AND (
      SELECT role FROM users WHERE auth_id = auth.uid()
    ) = role
  );

-- Administrators can update any user (including role changes)
CREATE POLICY "users_update_admin"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  );

-- New users can insert their own record (on signup)
CREATE POLICY "users_insert_own"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth_id = auth.uid()
    -- New users can only be applicants by default
    AND role = 'applicant'
  );

-- Administrators can insert new users with any role
CREATE POLICY "users_insert_admin"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  );
