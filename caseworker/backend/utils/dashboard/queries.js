/**
 * Shared query utilities for dashboard routes
 * Used by both regular and demo routes
 */

/**
 * Get user record from auth user
 */
async function getUser(supabase, authUser) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  if (error || !user) {
    throw new Error('User record not found. Please try logging out and back in.');
  }

  return user;
}

/**
 * Transform assignment data for frontend consumption
 */
function transformAssignmentData(assignment) {
  return {
    assignment_id: assignment.id,
    application_id: assignment.applications.id,
    applicant: {
      id: assignment.applications.users.id,
      name: `${assignment.applications.users.first_name || ''} ${assignment.applications.users.last_name || ''}`.trim(),
      email: assignment.applications.users.email
    },
    application_status: assignment.applications.status,
    review_status: assignment.review_status,
    priority: assignment.priority,
    due_date: assignment.due_date,
    assigned_at: assignment.assigned_at,
    assigned_by: assignment.assigned_by,
    first_opened_at: assignment.first_opened_at,
    last_accessed_at: assignment.last_accessed_at,
    completed_at: assignment.completed_at,
    recommendation: assignment.recommendation,
    submitted_at: assignment.applications.submitted_at,
    created_at: assignment.applications.created_at,
    updated_at: assignment.applications.updated_at,
    ai_recommendation: assignment.applications.reasoning_overall_recommendation,
    ai_confidence: assignment.applications.reasoning_confidence_score,
    ai_summary: assignment.applications.reasoning_summary
  };
}

/**
 * Build application detail response
 */
function buildApplicationDetailResponse(application, assignment, assignedByUser, files) {
  const aiReasoning = {
    overall_recommendation: application.reasoning_overall_recommendation,
    confidence_score: application.reasoning_confidence_score,
    summary: application.reasoning_summary,
    phases: application.reasoning_phases || null,
    missing_information: application.reasoning_missing_information || [],
    suggested_actions: application.reasoning_suggested_actions || []
  };

  return {
    applicant: {
      id: application.users.id,
      first_name: application.users.first_name,
      last_name: application.users.last_name,
      name: `${application.users.first_name || ''} ${application.users.last_name || ''}`.trim(),
      email: application.users.email,
      phone_number: application.users.phone_number
    },
    application: {
      id: application.id,
      status: application.status,
      submitted_at: application.submitted_at,
      created_at: application.created_at,
      updated_at: application.updated_at,
      ai_recommendation: application.reasoning_overall_recommendation,
      ai_confidence: application.reasoning_confidence_score,
      ai_summary: application.reasoning_summary,
      ai_phases: application.reasoning_phases || null,
      ai_missing_information: application.reasoning_missing_information || [],
      ai_suggested_actions: application.reasoning_suggested_actions || [],
      birthdate: application.birthdate,
      date_condition_began_affecting_work: application.date_condition_began_affecting_work,
      earnings_history: application.earnings_history || [],
      employment_history: application.employment_history || [],
      conditions: application.conditions || [],
      functional_limitations: application.functional_limitations || null,
      healthcare_providers: application.healthcare_providers || [],
      medical_tests: application.medical_tests || [],
      evidence_documents: application.evidence_documents || [],
      education: application.education || [],
      job_training: application.job_training || []
    },
    assignment: {
      id: assignment.id,
      review_status: assignment.review_status,
      recommendation: assignment.recommendation,
      reviewer_notes: assignment.reviewer_notes,
      recommendation_notes: assignment.recommendation_notes,
      priority: assignment.priority,
      due_date: assignment.due_date,
      assigned_by: assignment.assigned_by,
      assigned_by_user: assignedByUser,
      assigned_at: assignment.assigned_at,
      first_opened_at: assignment.first_opened_at || new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      completed_at: assignment.completed_at
    },
    ai_reasoning: aiReasoning,
    files: files || []
  };
}

/**
 * Update assignment access tracking
 */
async function updateAssignmentAccess(supabase, assignment) {
  if (!assignment.first_opened_at) {
    await supabase
      .from('assigned_applications')
      .update({
        first_opened_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        review_status: 'in_progress'
      })
      .eq('id', assignment.id);
  } else {
    await supabase
      .from('assigned_applications')
      .update({
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', assignment.id);
  }
}

module.exports = {
  getUser,
  transformAssignmentData,
  buildApplicationDetailResponse,
  updateAssignmentAccess,
};
