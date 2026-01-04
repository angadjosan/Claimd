-- Add caseworker_available field to track if caseworkers are available to take cases
-- This is separate from is_active (which is for account status)
-- caseworker_available = true means the caseworker is available (not sick, not on leave)

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS caseworker_available boolean DEFAULT true;

-- Set default for existing caseworkers to true
UPDATE public.users 
SET caseworker_available = true 
WHERE role = 'caseworker' AND caseworker_available IS NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_caseworker_available 
ON public.users(role, is_active, caseworker_available) 
WHERE role = 'caseworker' AND is_active = true AND caseworker_available = true;

-- Add comment to clarify the field purpose
COMMENT ON COLUMN public.users.caseworker_available IS 'Indicates if a caseworker is available to take new case assignments (not sick, not on leave). Separate from is_active which indicates account status.';

-- Update assign_reviewer function to make p_assigned_by optional for system assignments
CREATE OR REPLACE FUNCTION public.assign_reviewer(p_application_id uuid, p_reviewer_id uuid, p_assigned_by uuid DEFAULT NULL, p_priority integer DEFAULT 0, p_due_date date DEFAULT NULL::date)
 RETURNS public.assigned_applications
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;