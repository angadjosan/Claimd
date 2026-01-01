-- ========================================
-- APPLICATION_STATUS_HISTORY TABLE POLICIES
-- ========================================

-- Applicants can view history for their own applications
CREATE POLICY "history_select_own"
  ON application_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_status_history.application_id
      AND a.applicant_id = get_user_id()
    )
  );

-- Caseworkers can view history for applications assigned to them
CREATE POLICY "history_select_assigned"
  ON application_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assigned_applications aa
      JOIN users u ON u.auth_id = auth.uid()
      WHERE aa.application_id = application_status_history.application_id
      AND aa.reviewer_id = u.id
      AND u.role = 'caseworker'
    )
  );

-- Administrators can view all history
CREATE POLICY "history_select_admin"
  ON application_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.auth_id = auth.uid() 
      AND u.role = 'administrator'
    )
  );

-- History is insert-only (no updates or deletes allowed)
-- Inserts happen through functions, not directly

-- Allow inserts through service role only (functions use SECURITY DEFINER)
CREATE POLICY "history_insert_system"
  ON application_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (FALSE); -- Direct inserts blocked, use update_application_status function
