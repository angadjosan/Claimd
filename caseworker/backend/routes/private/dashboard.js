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
        applications (
          id,
          status,
          submitted_at,
          created_at,
          updated_at,
          reasoning_overall_recommendation,
          reasoning_confidence_score,
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
      first_opened_at: assignment.first_opened_at,
      last_accessed_at: assignment.last_accessed_at,
      completed_at: assignment.completed_at,
      recommendation: assignment.recommendation,
      submitted_at: assignment.applications.submitted_at,
      created_at: assignment.applications.created_at,
      updated_at: assignment.applications.updated_at,
      ai_recommendation: assignment.applications.reasoning_overall_recommendation,
      ai_confidence: assignment.applications.reasoning_confidence_score
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

    // Get the full application with applicant info
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

    // Format the response
    const response = {
      application: {
        ...application,
        applicant: application.users
      },
      assignment: {
        ...assignment,
        // Re-fetch to get updated timestamps
        first_opened_at: assignment.first_opened_at || new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      }
    };

    // Remove the nested users object
    delete response.application.users;

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
 * Submit a recommendation for an application
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

    // Update assignment with recommendation
    const updateData = {
      recommendation,
      recommendation_notes: recommendation_notes || null,
      review_status: 'completed',
      completed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString()
    };

    // Set first_opened_at if not already set
    if (!assignment.first_opened_at) {
      updateData.first_opened_at = new Date().toISOString();
    }

    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assigned_applications')
      .update(updateData)
      .eq('id', assignment.id)
      .select()
      .single();

    if (updateError) {
      console.error('Recommendation submission error:', updateError);
      return res.status(500).json({
        error: 'Failed to submit recommendation',
        message: updateError.message
      });
    }

    // Optionally update application status based on recommendation
    // (This could be handled by a database trigger or separate admin action)
    // For now, we'll just return the updated assignment

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

