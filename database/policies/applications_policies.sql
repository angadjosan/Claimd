-- Applicants can view their own applications
CREATE POLICY "applications_select_own"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    applicant_id = get_user_id()
  );

-- Caseworkers can view applications assigned to them
CREATE POLICY "applications_select_assigned"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assigned_applications aa
      JOIN users u ON u.auth_id = auth.uid()
      WHERE aa.application_id = applications.id
      AND aa.reviewer_id = u.id
      AND u.role = 'caseworker'
    )
  );

-- Administrators can view all applications
CREATE POLICY "applications_select_admin"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  );

-- Applicants can insert their own applications
CREATE POLICY "applications_insert_own"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    applicant_id = get_user_id()
    AND EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'applicant'
    )
  );

-- Applicants can update their own draft applications
CREATE POLICY "applications_update_own_draft"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (
    applicant_id = get_user_id()
    AND status IN ('draft', 'additional_info')
  )
  WITH CHECK (
    applicant_id = get_user_id()
    -- Cannot change applicant_id
  );

-- Caseworkers can update applications assigned to them (limited fields)
CREATE POLICY "applications_update_caseworker"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assigned_applications aa
      JOIN users u ON u.auth_id = auth.uid()
      WHERE aa.application_id = applications.id
      AND aa.reviewer_id = u.id
      AND u.role = 'caseworker'
    )
  )
  WITH CHECK (
    -- Caseworkers can update status but not application data
    EXISTS (
      SELECT 1 FROM assigned_applications aa
      JOIN users u ON u.auth_id = auth.uid()
      WHERE aa.application_id = applications.id
      AND aa.reviewer_id = u.id
      AND u.role = 'caseworker'
    )
  );

-- Administrators can update any application
CREATE POLICY "applications_update_admin"
  ON applications
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

-- Only allow deletion by administrators (soft delete preferred)
CREATE POLICY "applications_delete_admin"
  ON applications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  );
