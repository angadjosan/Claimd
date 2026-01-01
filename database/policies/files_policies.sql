-- ========================================
-- APPLICATION_FILES TABLE POLICIES
-- ========================================

-- Applicants can view files for their own applications
CREATE POLICY "files_select_own"
  ON application_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_files.application_id
      AND a.applicant_id = get_user_id()
    )
  );

-- Caseworkers can view files for applications assigned to them
CREATE POLICY "files_select_assigned"
  ON application_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assigned_applications aa
      JOIN users u ON u.auth_id = auth.uid()
      WHERE aa.application_id = application_files.application_id
      AND aa.reviewer_id = u.id
      AND u.role = 'caseworker'
    )
  );

-- Administrators can view all files
CREATE POLICY "files_select_admin"
  ON application_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  );

-- Applicants can upload files to their own applications
CREATE POLICY "files_insert_own"
  ON application_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_files.application_id
      AND a.applicant_id = get_user_id()
      AND a.status IN ('draft', 'additional_info')
    )
    AND uploaded_by = get_user_id()
  );

-- Applicants can update their own files
CREATE POLICY "files_update_own"
  ON application_files
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = get_user_id()
    AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_files.application_id
      AND a.status IN ('draft', 'additional_info')
    )
  )
  WITH CHECK (
    uploaded_by = get_user_id()
  );

-- Applicants can delete their own files (soft delete)
CREATE POLICY "files_delete_own"
  ON application_files
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = get_user_id()
    AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_files.application_id
      AND a.status IN ('draft', 'additional_info')
    )
  );

-- Administrators can manage all files
CREATE POLICY "files_all_admin"
  ON application_files
  FOR ALL
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
