-- Function to update application status with history tracking
CREATE OR REPLACE FUNCTION update_application_status(
  p_application_id UUID,
  p_new_status application_status,
  p_notes TEXT DEFAULT NULL,
  p_changed_by UUID DEFAULT NULL
)
RETURNS applications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_status application_status;
  v_application applications;
BEGIN
  -- Get current status
  SELECT status INTO v_old_status
  FROM applications
  WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Update application
  UPDATE applications
  SET 
    status = p_new_status,
    status_changed_at = NOW(),
    status_notes = p_notes
  WHERE id = p_application_id
  RETURNING * INTO v_application;
  
  -- Record in history
  INSERT INTO application_status_history (
    application_id,
    previous_status,
    new_status,
    changed_by,
    notes
  ) VALUES (
    p_application_id,
    v_old_status,
    p_new_status,
    p_changed_by,
    p_notes
  );
  
  RETURN v_application;
END;
$$;

-- Function to submit an application
CREATE OR REPLACE FUNCTION submit_application(p_application_id UUID)
RETURNS applications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_application applications;
BEGIN
  -- Update application to submitted status
  UPDATE applications
  SET 
    status = 'submitted',
    submitted_at = NOW(),
    status_changed_at = NOW()
  WHERE id = p_application_id
    AND status = 'draft'
  RETURNING * INTO v_application;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or not in draft status';
  END IF;
  
  -- Record in history
  INSERT INTO application_status_history (
    application_id,
    previous_status,
    new_status,
    changed_by,
    notes
  ) VALUES (
    p_application_id,
    'draft',
    'submitted',
    v_application.applicant_id,
    'Application submitted by applicant'
  );
  
  RETURN v_application;
END;
$$;

-- Function to assign a reviewer to an application
CREATE OR REPLACE FUNCTION assign_reviewer(
  p_application_id UUID,
  p_reviewer_id UUID,
  p_assigned_by UUID,
  p_priority INTEGER DEFAULT 0,
  p_due_date DATE DEFAULT NULL
)
RETURNS assigned_applications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment assigned_applications;
BEGIN
  -- Verify reviewer is a caseworker
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_reviewer_id 
    AND role = 'caseworker'
    AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'User is not an active caseworker';
  END IF;
  
  -- Create or update assignment
  INSERT INTO assigned_applications (
    application_id,
    reviewer_id,
    assigned_by,
    priority,
    due_date
  ) VALUES (
    p_application_id,
    p_reviewer_id,
    p_assigned_by,
    p_priority,
    p_due_date
  )
  ON CONFLICT (reviewer_id, application_id) 
  DO UPDATE SET
    priority = EXCLUDED.priority,
    due_date = EXCLUDED.due_date,
    updated_at = NOW()
  RETURNING * INTO v_assignment;
  
  -- Update application status if still submitted
  UPDATE applications
  SET status = 'under_review', status_changed_at = NOW()
  WHERE id = p_application_id
    AND status = 'submitted';
  
  RETURN v_assignment;
END;
$$;

-- Function to update review status
CREATE OR REPLACE FUNCTION update_review_status(
  p_assignment_id UUID,
  p_new_status review_status,
  p_reviewer_id UUID
)
RETURNS assigned_applications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment assigned_applications;
BEGIN
  UPDATE assigned_applications
  SET 
    review_status = p_new_status,
    first_opened_at = CASE 
      WHEN review_status = 'unopened' AND p_new_status != 'unopened' 
      THEN NOW() 
      ELSE first_opened_at 
    END,
    last_accessed_at = NOW(),
    completed_at = CASE 
      WHEN p_new_status = 'completed' THEN NOW() 
      ELSE completed_at 
    END
  WHERE id = p_assignment_id
    AND reviewer_id = p_reviewer_id
  RETURNING * INTO v_assignment;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or unauthorized';
  END IF;
  
  RETURN v_assignment;
END;
$$;

-- Function to submit a recommendation (transactional)
CREATE OR REPLACE FUNCTION submit_recommendation(
  p_application_id UUID,
  p_reviewer_id UUID,
  p_recommendation review_recommendation,
  p_recommendation_notes TEXT DEFAULT NULL
)
RETURNS assigned_applications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment assigned_applications;
  v_application applications;
  v_old_status application_status;
BEGIN
  -- Verify assignment exists and belongs to reviewer
  SELECT * INTO v_assignment
  FROM assigned_applications
  WHERE application_id = p_application_id
    AND reviewer_id = p_reviewer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application is not assigned to this reviewer';
  END IF;
  
  -- Get current application status
  SELECT status INTO v_old_status
  FROM applications
  WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Update assigned_applications with recommendation (transactional)
  UPDATE assigned_applications
  SET 
    recommendation = p_recommendation,
    recommendation_notes = p_recommendation_notes,
    review_status = 'completed',
    completed_at = NOW(),
    last_accessed_at = NOW(),
    first_opened_at = COALESCE(first_opened_at, NOW()),
    updated_at = NOW()
  WHERE id = v_assignment.id
  RETURNING * INTO v_assignment;
  
  -- Record recommendation in application status history
  INSERT INTO application_status_history (
    application_id,
    previous_status,
    new_status,
    changed_by,
    notes
  ) VALUES (
    p_application_id,
    v_old_status,
    v_old_status, -- Status doesn't change automatically, just recording the recommendation
    p_reviewer_id,
    'Reviewer recommendation: ' || p_recommendation || 
    CASE WHEN p_recommendation_notes IS NOT NULL 
      THEN E'\nNotes: ' || p_recommendation_notes 
      ELSE '' 
    END
  );
  
  RETURN v_assignment;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_application_status TO authenticated;
GRANT EXECUTE ON FUNCTION submit_application TO authenticated;
GRANT EXECUTE ON FUNCTION assign_reviewer TO authenticated;
GRANT EXECUTE ON FUNCTION update_review_status TO authenticated;
GRANT EXECUTE ON FUNCTION submit_recommendation TO authenticated;
