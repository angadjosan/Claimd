/**
 * Demo Application Routes
 * Simplified - returns hardcoded demo application
 */
const express = require('express');
const router = express.Router();
const {
  buildApplicationDetailResponse,
  updateAssignmentAccess,
} = require('../../utils/dashboard/queries');

// Hardcoded demo IDs (must match Supabase data)
const DEMO_APPLICATION_ID = '7239184c-4d9a-48f5-936b-39428db1d6e3';

/**
 * GET /api/demo/applications/:id
 * Get detailed application data for demo (hardcoded application)
 */
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const applicationId = req.params.id;
    const demoApplicationId = DEMO_APPLICATION_ID;

    // Log for debugging
    console.log('[DEMO] Application request', {
      requestedId: applicationId,
      configuredId: demoApplicationId,
      caseworkerId
    });

    // Verify this is the demo application ID
    if (applicationId !== demoApplicationId) {
      console.log('[DEMO] Application ID mismatch', {
        requested: applicationId,
        expected: demoApplicationId
      });
      return res.status(404).json({
        error: 'Not Found',
        message: 'Demo application not found'
      });
    }

    // First verify assignment exists
    const { data: assignmentCheck, error: assignmentCheckError } = await supabase
      .from('assigned_applications')
      .select('id, application_id, reviewer_id, review_status')
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .maybeSingle();

    if (assignmentCheckError) {
      console.error('[DEMO] Assignment check error:', assignmentCheckError);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to check assignment',
        details: assignmentCheckError.message
      });
    }

    if (!assignmentCheck) {
      console.log('[DEMO] Assignment not found', {
        applicationId,
        caseworkerId
      });
      return res.status(404).json({
        error: 'Not Found',
        message: 'Demo assignment not found. Please ensure the demo application is assigned to the demo caseworker.'
      });
    }

    // Now get the full assignment with application data
    let assignment;
    const { data: assignmentWithApp, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select(`
        *,
        applications!inner (*)
      `)
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .single();

    if (assignmentError || !assignmentWithApp) {
      console.error('[DEMO] Full assignment query error:', {
        error: assignmentError,
        applicationId,
        caseworkerId,
        code: assignmentError?.code,
        message: assignmentError?.message
      });
      
      // If join fails, try getting application separately
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError || !application) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Application not found',
          details: appError?.message
        });
      }

      // Get assignment without join
      const { data: assignmentOnly, error: assignmentOnlyError } = await supabase
        .from('assigned_applications')
        .select('*')
        .eq('application_id', applicationId)
        .eq('reviewer_id', caseworkerId)
        .single();

      if (assignmentOnlyError || !assignmentOnly) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Assignment not found',
          details: assignmentOnlyError?.message
        });
      }

      // Manually combine the data
      assignment = {
        ...assignmentOnly,
        applications: application
      };
    } else {
      assignment = assignmentWithApp;
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
 * PATCH /api/demo/applications/:id/review-status
 * Update the review status (demo mode)
 */
router.patch('/:id/review-status', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const applicationId = req.params.id;
    const demoApplicationId = DEMO_APPLICATION_ID;
    const { review_status } = req.body;

    // Verify this is the demo application
    if (applicationId !== demoApplicationId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Demo application not found'
      });
    }

    const validStatuses = ['unopened', 'in_progress', 'completed'];
    if (!review_status || !validStatuses.includes(review_status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `review_status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Verify assignment belongs to demo caseworker
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select('id, review_status')
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .single();

    if (assignmentError || !assignment) {
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
 * PATCH /api/demo/applications/:id/reviewer-notes
 * Update reviewer notes (demo mode)
 */
router.patch('/:id/reviewer-notes', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const applicationId = req.params.id;
    const demoApplicationId = DEMO_APPLICATION_ID;
    const { reviewer_notes } = req.body;

    // Verify this is the demo application
    if (applicationId !== demoApplicationId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Demo application not found'
      });
    }

    // Verify assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select('id')
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .single();

    if (assignmentError || !assignment) {
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
 * POST /api/demo/applications/:id/recommendation
 * Submit a recommendation (demo mode)
 */
router.post('/:id/recommendation', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const applicationId = req.params.id;
    const demoApplicationId = DEMO_APPLICATION_ID;
    const { recommendation, recommendation_notes } = req.body;

    // Verify this is the demo application
    if (applicationId !== demoApplicationId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Demo application not found'
      });
    }

    const validRecommendations = ['approve', 'deny', 'request_more_info', 'escalate', 'needs_medical_review'];
    if (!recommendation || !validRecommendations.includes(recommendation)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `recommendation must be one of: ${validRecommendations.join(', ')}`
      });
    }

    // Verify assignment belongs to demo caseworker
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select('id')
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .single();

    if (assignmentError || !assignment) {
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
 * GET /api/demo/applications/:id/files
 * Get all files for an application (demo mode)
 */
router.get('/:id/files', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const applicationId = req.params.id;
    const demoApplicationId = DEMO_APPLICATION_ID;

    // Verify this is the demo application
    if (applicationId !== demoApplicationId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Demo application not found'
      });
    }

    // Verify this application is assigned to the demo caseworker
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select('id')
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .single();

    if (assignmentError || !assignment) {
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
 * GET /api/demo/applications/:id/files/:fileId/download
 * Get a signed URL to download a specific file (demo mode)
 */
router.get('/:id/files/:fileId/download', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const caseworkerId = req.demoCaseworkerId;
    const applicationId = req.params.id;
    const demoApplicationId = DEMO_APPLICATION_ID;
    const fileId = req.params.fileId;

    // Verify this is the demo application
    if (applicationId !== demoApplicationId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Demo application not found'
      });
    }

    // Verify this application is assigned to the demo caseworker
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_applications')
      .select('id')
      .eq('application_id', applicationId)
      .eq('reviewer_id', caseworkerId)
      .single();

    if (assignmentError || !assignment) {
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
