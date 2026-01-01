-- ============================================
-- 004_assigned_applications_policies.sql
-- RLS Policies for assigned_applications table
-- ============================================

-- ========================================
-- ASSIGNED_APPLICATIONS TABLE POLICIES
-- ========================================

-- Caseworkers can view their own assignments
CREATE POLICY "assigned_applications_select_own"
  ON assigned_applications
  FOR SELECT
  TO authenticated
  USING (
    reviewer_id = get_user_id()
    AND EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'caseworker'
    )
  );

-- Administrators can view all assignments
CREATE POLICY "assigned_applications_select_admin"
  ON assigned_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  );

-- Applicants can see who is reviewing their application (limited view)
CREATE POLICY "assigned_applications_select_applicant"
  ON assigned_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = assigned_applications.application_id
      AND a.applicant_id = get_user_id()
    )
  );

-- Only administrators can create assignments
CREATE POLICY "assigned_applications_insert_admin"
  ON assigned_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  );

-- Caseworkers can update their own assignments (status, notes, recommendation)
CREATE POLICY "assigned_applications_update_own"
  ON assigned_applications
  FOR UPDATE
  TO authenticated
  USING (
    reviewer_id = get_user_id()
    AND EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'caseworker'
    )
  )
  WITH CHECK (
    reviewer_id = get_user_id()
    -- Cannot change assignment itself, only review fields
  );

-- Administrators can update any assignment
CREATE POLICY "assigned_applications_update_admin"
  ON assigned_applications
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

-- Only administrators can delete assignments
CREATE POLICY "assigned_applications_delete_admin"
  ON assigned_applications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  );
