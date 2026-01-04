/**
 * Dashboard Routes
 * Handles caseworker dashboard data retrieval and actions
 */
const express = require('express');
const router = express.Router();

/**
 * Helper function to get user record from auth user
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
 * GET /api/private/dashboard/applications
 * Get all applications assigned to the current caseworker
 * Returns list with applicant info, status, and review status
 */
router.get('/applications', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const authUser = req.user;
    const userDbId = req.userDbId;

    if (!userDbId) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'User database ID not found'
      });
    }

    // Get all assigned applications for this caseworker
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assigned_applications')
      .select(`
        id,
        review_status,
        priority,
        due_date,
        assigned_at,
        first_opened_at,
        last_accessed_at,
        completed_at,
        recommendation,
        application_id,
        assigned_by,
        applications (
          id,
          status,
          submitted_at,
          created_at,
          updated_at,
          reasoning_overall_recommendation,
          reasoning_confidence_score,
          reasoning_summary,
          applicant_id,
          users!applications_applicant_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('reviewer_id', userDbId)
      .order('priority', { ascending: false })
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('Assignments fetch error:', assignmentsError);
      return res.status(500).json({
        error: 'Failed to fetch assigned applications',
        message: assignmentsError.message
      });
    }

    // Transform the data for easier frontend consumption
    const applications = assignments.map(assignment => ({
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
    }));

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Dashboard applications fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/private/dashboard/applications/:id
 * Get detailed application data for review
 * Includes all application data, AI reasoning, and review assignment info
 */
router.get('/applications/:id', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const authUser = req.user;
    const userDbId = req.userDbId;
    const applicationId = req.params.id;

    if (!userDbId) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'User database ID not found'
      });
    }

    // Verify this application is assigned to the current caseworker
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select('*')
      .eq('application_id', applicationId)
      .eq('reviewer_id', userDbId)
      .single();

    if (assignmentError || !assignment) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This application is not assigned to you'
      });
    }

    // Get assigned_by user info if exists
    let assignedByUser = null;
    if (assignment.assigned_by) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('id', assignment.assigned_by)
        .single();
      
      if (!userError && user) {
        assignedByUser = {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email
        };
      }
    }

    // Get the full application with applicant info
    // Include all AI reasoning fields and supporting data
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select(`
        *,
        users!applications_applicant_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone_number
        )
      `)
      .eq('id', applicationId)
      .single();

    if (applicationError || !application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found'
      });
    }

    // Update last_accessed_at if this is the first time opening
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
      // Just update last_accessed_at
      await supabase
        .from('assigned_applications')
        .update({
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', assignment.id);
    }

    // Extract AI reasoning data for easier frontend consumption
    const aiReasoning = {
      overall_recommendation: application.reasoning_overall_recommendation,
      confidence_score: application.reasoning_confidence_score,
      summary: application.reasoning_summary,
      phases: application.reasoning_phases || null,
      missing_information: application.reasoning_missing_information || [],
      suggested_actions: application.reasoning_suggested_actions || []
    };

    // Format the response according to data_mapping.md structure
    const response = {
      // Header / Applicant Summary
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
        // AI Reasoning - Header fields
        ai_recommendation: application.reasoning_overall_recommendation,
        ai_confidence: application.reasoning_confidence_score,
        ai_summary: application.reasoning_summary,
        // AI Reasoning - Phases (for progress tracker and detailed views)
        ai_phases: application.reasoning_phases || null,
        // AI Reasoning - Recommendations
        ai_missing_information: application.reasoning_missing_information || [],
        ai_suggested_actions: application.reasoning_suggested_actions || [],
        // Supporting data for phase analysis
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
      // Assignment / Review data
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
      // Convenience field for AI reasoning (structured)
      ai_reasoning: aiReasoning
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Application detail fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * PATCH /api/private/dashboard/applications/:id/review-status
 * Update the review status of an assigned application
 */
router.patch('/applications/:id/review-status', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const userDbId = req.userDbId;
    const applicationId = req.params.id;
    const { review_status } = req.body;

    if (!userDbId) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'User database ID not found'
      });
    }

    // Validate review_status
    const validStatuses = ['unopened', 'in_progress', 'completed'];
    if (!review_status || !validStatuses.includes(review_status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `review_status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Verify assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select('*')
      .eq('application_id', applicationId)
      .eq('reviewer_id', userDbId)
      .single();

    if (assignmentError || !assignment) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This application is not assigned to you'
      });
    }

    // Prepare update data
    const updateData = {
      review_status,
      last_accessed_at: new Date().toISOString()
    };

    // Set first_opened_at if transitioning from unopened
    if (assignment.review_status === 'unopened' && review_status !== 'unopened') {
      updateData.first_opened_at = new Date().toISOString();
    }

    // Set completed_at if marking as completed
    if (review_status === 'completed' && !assignment.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    // Update the assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assigned_applications')
      .update(updateData)
      .eq('id', assignment.id)
      .select()
      .single();

    if (updateError) {
      console.error('Review status update error:', updateError);
      return res.status(500).json({
        error: 'Failed to update review status',
        message: updateError.message
      });
    }

    res.json({
      success: true,
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Review status update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * PATCH /api/private/dashboard/applications/:id/reviewer-notes
 * Update reviewer notes (internal notes)
 */
router.patch('/applications/:id/reviewer-notes', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const userDbId = req.userDbId;
    const applicationId = req.params.id;
    const { reviewer_notes } = req.body;

    if (!userDbId) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'User database ID not found'
      });
    }

    // Verify assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select('id')
      .eq('application_id', applicationId)
      .eq('reviewer_id', userDbId)
      .single();

    if (assignmentError || !assignment) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This application is not assigned to you'
      });
    }

    // Update reviewer notes
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assigned_applications')
      .update({
        reviewer_notes: reviewer_notes || null,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', assignment.id)
      .select()
      .single();

    if (updateError) {
      console.error('Reviewer notes update error:', updateError);
      return res.status(500).json({
        error: 'Failed to update reviewer notes',
        message: updateError.message
      });
    }

    res.json({
      success: true,
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Reviewer notes update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /api/private/dashboard/applications/:id/recommendation
 * Submit a recommendation for an application (transactional via DB function)
 */
router.post('/applications/:id/recommendation', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const userDbId = req.userDbId;
    const applicationId = req.params.id;
    const { recommendation, recommendation_notes } = req.body;

    if (!userDbId) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'User database ID not found'
      });
    }

    // Validate recommendation
    const validRecommendations = ['approve', 'deny', 'request_more_info', 'escalate', 'needs_medical_review'];
    if (!recommendation || !validRecommendations.includes(recommendation)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `recommendation must be one of: ${validRecommendations.join(', ')}`
      });
    }

    // Use database function for transactional recommendation submission
    // This ensures all updates happen atomically
    const { data: updatedAssignment, error: functionError } = await supabase
      .rpc('submit_recommendation', {
        p_application_id: applicationId,
        p_reviewer_id: userDbId,
        p_recommendation: recommendation,
        p_recommendation_notes: recommendation_notes || null
      });

    if (functionError) {
      console.error('Recommendation submission error:', functionError);
      
      // Handle specific error cases
      if (functionError.message.includes('not assigned')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'This application is not assigned to you'
        });
      }
      
      if (functionError.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Application not found'
        });
      }

      return res.status(500).json({
        error: 'Failed to submit recommendation',
        message: functionError.message
      });
    }

    if (!updatedAssignment) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to submit recommendation'
      });
    }

    res.json({
      success: true,
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Recommendation submission error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;

