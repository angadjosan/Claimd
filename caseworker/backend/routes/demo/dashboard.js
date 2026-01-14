/**
 * Demo Dashboard Routes
 * Handles caseworker dashboard data retrieval in demo mode
 * Filters by demo_session_id for session isolation
 * Uses shared utilities from utils/dashboard/
 */
const express = require('express');
const router = express.Router();
const {
  transformAssignmentData,
  buildApplicationDetailResponse,
  updateAssignmentAccess,
} = require('../../utils/dashboard/queries');

/**
 * GET /api/demo/dashboard/applications
 * Get all applications assigned to demo caseworker for current session
 * CRITICAL: Filters by demo_session_id for session isolation
 */
router.get('/applications', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId; // From env var, IGNORE frontend
    const sessionId = req.demoSessionId; // Validated UUID v4

    // CRITICAL: Explicit filtering with JOIN for session isolation
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
        applications!inner (
          id,
          status,
          submitted_at,
          created_at,
          updated_at,
          demo_session_id,
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
      .eq('reviewer_id', caseworkerId) // Demo caseworker only
      .eq('applications.demo_session_id', sessionId) // Current session only
      .not('applications.demo_session_id', 'is', null) // Only demo apps
      .order('priority', { ascending: false })
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('[DEMO] Assignments fetch error:', assignmentsError);
      return res.status(500).json({
        error: 'Failed to fetch assigned applications',
        message: assignmentsError.message
      });
    }

    // Filter out any assignments where application.demo_session_id doesn't match (extra safety)
    const filteredAssignments = assignments.filter(assignment => 
      assignment.applications?.demo_session_id === sessionId
    );

    // Transform the data for easier frontend consumption
    const applications = filteredAssignments.map(transformAssignmentData);

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('[DEMO] Dashboard applications fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/demo/dashboard/applications/:id
 * Get detailed application data for review (must belong to current demo session)
 */
router.get('/applications/:id', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const sessionId = req.demoSessionId;
    const applicationId = req.params.id;

    // CRITICAL: Verify assignment belongs to demo caseworker AND current session
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select(`
        *,
        applications!inner (*)
      `)
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId) // Demo caseworker only
      .eq('applications.demo_session_id', sessionId) // Current session only
      .not('applications.demo_session_id', 'is', null)
      .single();

    if (assignmentError || !assignment || assignment.applications?.demo_session_id !== sessionId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Demo assignment not found or access denied'
      });
    }

    // Get assigned_by user info if exists
    let assignedByUser = null;
    if (assignment.assigned_by) {
      const { data: user } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('id', assignment.assigned_by)
        .single();
      
      if (user) {
        assignedByUser = {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email
        };
      }
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
      .eq('demo_session_id', sessionId) // Extra safety check
      .single();

    if (applicationError || !application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found'
      });
    }

    // Update assignment access tracking
    await updateAssignmentAccess(supabase, assignment);

    // Get all files for this application
    const { data: files } = await supabase
      .from('application_files')
      .select('*')
      .eq('application_id', applicationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    const response = buildApplicationDetailResponse(application, assignment, assignedByUser, files);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('[DEMO] Application detail fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * PATCH /api/demo/dashboard/applications/:id/review-status
 * Update the review status of an assigned application (demo mode)
 */
router.patch('/applications/:id/review-status', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const sessionId = req.demoSessionId;
    const applicationId = req.params.id;
    const { review_status } = req.body;

    const validStatuses = ['unopened', 'in_progress', 'completed'];
    if (!review_status || !validStatuses.includes(review_status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `review_status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Verify assignment belongs to demo caseworker AND current session
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select(`
        *,
        applications!inner (demo_session_id)
      `)
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .eq('applications.demo_session_id', sessionId)
      .single();

    if (assignmentError || !assignment || assignment.applications?.demo_session_id !== sessionId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This application is not assigned to you'
      });
    }

    const updateData = {
      review_status,
      last_accessed_at: new Date().toISOString()
    };

    if (assignment.review_status === 'unopened' && review_status !== 'unopened') {
      updateData.first_opened_at = new Date().toISOString();
    }

    if (review_status === 'completed' && !assignment.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assigned_applications')
      .update(updateData)
      .eq('id', assignment.id)
      .select()
      .single();

    if (updateError) {
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
    console.error('[DEMO] Review status update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * PATCH /api/demo/dashboard/applications/:id/reviewer-notes
 * Update reviewer notes (demo mode)
 */
router.patch('/applications/:id/reviewer-notes', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const sessionId = req.demoSessionId;
    const applicationId = req.params.id;
    const { reviewer_notes } = req.body;

    // Verify assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select(`
        id,
        applications!inner (demo_session_id)
      `)
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .eq('applications.demo_session_id', sessionId)
      .single();

    if (assignmentError || !assignment || assignment.applications?.demo_session_id !== sessionId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This application is not assigned to you'
      });
    }

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
    console.error('[DEMO] Reviewer notes update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /api/demo/dashboard/applications/:id/recommendation
 * Submit a recommendation for an application (demo mode)
 */
router.post('/applications/:id/recommendation', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const sessionId = req.demoSessionId;
    const applicationId = req.params.id;
    const { recommendation, recommendation_notes } = req.body;

    const validRecommendations = ['approve', 'deny', 'request_more_info', 'escalate', 'needs_medical_review'];
    if (!recommendation || !validRecommendations.includes(recommendation)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `recommendation must be one of: ${validRecommendations.join(', ')}`
      });
    }

    // Verify assignment belongs to demo caseworker AND current session
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select(`
        id,
        applications!inner (demo_session_id)
      `)
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .eq('applications.demo_session_id', sessionId)
      .single();

    if (assignmentError || !assignment || assignment.applications?.demo_session_id !== sessionId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This application is not assigned to you'
      });
    }

    const { data: updatedAssignment, error: functionError } = await supabase
      .rpc('submit_recommendation', {
        p_application_id: applicationId,
        p_reviewer_id: caseworkerId,
        p_recommendation: recommendation,
        p_recommendation_notes: recommendation_notes || null
      });

    if (functionError) {
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
    console.error('[DEMO] Recommendation submission error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/demo/dashboard/applications/:id/files
 * Get all files for an application (demo mode)
 */
router.get('/applications/:id/files', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const sessionId = req.demoSessionId;
    const applicationId = req.params.id;

    // Verify this application is assigned to the demo caseworker AND current session
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select(`
        id,
        applications!inner (demo_session_id)
      `)
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .eq('applications.demo_session_id', sessionId)
      .single();

    if (assignmentError || !assignment || assignment.applications?.demo_session_id !== sessionId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This application is not assigned to you'
      });
    }

    const { data: files, error: filesError } = await supabase
      .from('application_files')
      .select('*')
      .eq('application_id', applicationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (filesError) {
      return res.status(500).json({
        error: 'Failed to fetch files',
        message: filesError.message
      });
    }

    res.json({
      success: true,
      data: files || []
    });
  } catch (error) {
    console.error('[DEMO] Files fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/demo/dashboard/applications/:id/files/:fileId/download
 * Get a signed URL to download a specific file (demo mode)
 */
router.get('/applications/:id/files/:fileId/download', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const sessionId = req.demoSessionId;
    const applicationId = req.params.id;
    const fileId = req.params.fileId;

    // Verify this application is assigned to the demo caseworker AND current session
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select(`
        id,
        applications!inner (demo_session_id)
      `)
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .eq('applications.demo_session_id', sessionId)
      .single();

    if (assignmentError || !assignment || assignment.applications?.demo_session_id !== sessionId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This application is not assigned to you'
      });
    }

    const { data: file, error: fileError } = await supabase
      .from('application_files')
      .select('*')
      .eq('id', fileId)
      .eq('application_id', applicationId)
      .eq('is_deleted', false)
      .single();

    if (fileError || !file) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'File not found'
      });
    }

    const { data: signedUrlData, error: urlError } = await supabase
      .storage
      .from(file.storage_bucket)
      .createSignedUrl(file.storage_path, 3600);

    if (urlError || !signedUrlData) {
      return res.status(500).json({
        error: 'Failed to generate download URL',
        message: urlError?.message || 'Unknown error'
      });
    }

    res.json({
      success: true,
      data: {
        file: {
          id: file.id,
          file_name: file.file_name,
          file_type: file.file_type,
          file_size: file.file_size,
          category: file.category,
          description: file.description,
          document_year: file.document_year,
          created_at: file.created_at
        },
        download_url: signedUrlData.signedUrl,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('[DEMO] File download URL error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
