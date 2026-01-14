/**
 * Application Routes
 * Handles application submission, file uploads, and application management
 * Uses shared utilities from utils/applications/
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const {
  uploadFields,
  handleMulterError,
  validateTotalRequestSize,
} = require('../../utils/applications/fileUpload');
const { processApplicationSubmission } = require('../../utils/applications/submission');


/**
 * Get user record from auth user
 * User record should already exist (created by database trigger on signup)
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
 * POST /api/private/applications
 * Submit a new application with all form data and files
 * Returns 202 Accepted immediately and processes asynchronously
 */
const applicationSubmissionHandler = async (req, res) => {
  const requestStartTime = Date.now();
  const requestId = uuidv4();
  
  try {
    const supabase = req.app.get('supabase');
    const authUser = req.user;

    console.log(`[SUBMISSION] Received submission request ${requestId}`, {
      userId: authUser?.id,
      timestamp: new Date().toISOString(),
    });

    // Get user record (created by database trigger on signup)
    const user = await getUser(supabase, authUser);
    const userId = user.id;

    console.log(`[SUBMISSION] User record retrieved for request ${requestId}`, {
      userId,
    });

    // Check if user already has a pending or submitted application
    const { data: existingApplications, error: checkError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('applicant_id', userId)
      .in('status', ['draft', 'submitted', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkError) {
      console.error(`[SUBMISSION] Error checking existing applications for request ${requestId}:`, {
        error: checkError.message,
        userId,
      });
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check existing applications',
      });
    }

    if (existingApplications && existingApplications.length > 0) {
      const existingApp = existingApplications[0];
      console.log(`[SUBMISSION] Existing application found for request ${requestId}`, {
        existingApplicationId: existingApp.id,
        existingStatus: existingApp.status,
        userId,
      });
      return res.status(409).json({
        error: 'Application Already Exists',
        message: `You already have an application in "${existingApp.status}" status. Please complete or cancel it before submitting a new one.`,
        existing_application_id: existingApp.id,
        existing_status: existingApp.status,
      });
    }

    // Generate application ID
    const applicationId = uuidv4();
    console.log(`[SUBMISSION] Generated application ID ${applicationId} for request ${requestId}`);

    // Parse form data
    let formData;
    try {
      formData = JSON.parse(req.body.formData || '{}');
      console.log(`[SUBMISSION] Form data parsed for request ${requestId}`, {
        hasFormData: !!formData,
        fields: Object.keys(formData).length,
      });
    } catch (e) {
      console.error(`[SUBMISSION] Invalid form data for request ${requestId}:`, {
        error: e.message,
      });
      return res.status(400).json({
        error: 'Invalid form data',
        message: 'Form data must be valid JSON',
      });
    }

    // Create application record first (minimal data) so files can reference it
    // Status is 'draft' initially, will be updated to 'submitted' after async processing
    console.log(`[SUBMISSION] Creating application record ${applicationId} for request ${requestId}`);
    const { data: createdApplication, error: createError } = await supabase
      .from('applications')
      .insert({
        id: applicationId,
        applicant_id: userId,
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      console.error(`[SUBMISSION] Application creation error for request ${requestId}:`, {
        error: createError.message,
        code: createError.code,
        applicationId,
      });
      return res.status(500).json({
        error: 'Failed to create application',
        message: createError.message,
      });
    }

    console.log(`[SUBMISSION] Application record created ${applicationId} for request ${requestId}`);

    // Store files in memory for async processing
    // We need to preserve the files since they're in memory buffers
    const filesForProcessing = req.files;

    // Return 202 Accepted immediately - processing will continue asynchronously
    const responseTime = Date.now() - requestStartTime;
    console.log(`[SUBMISSION] Returning 202 Accepted for request ${requestId}`, {
      applicationId,
      responseTime: `${responseTime}ms`,
    });

    res.status(202).json({
      success: true,
      message: 'Application submission received and is being processed',
      data: {
        application_id: applicationId,
        status: 'processing',
        created_at: createdApplication.created_at,
      },
    });

    // Process asynchronously (don't await - let it run in background)
    // Use setImmediate to ensure response is sent first
    setImmediate(async () => {
      try {
        await processApplicationSubmission({
          supabase,
          applicationId,
          userId,
          formData,
          files: filesForProcessing,
          logPrefix: '[SUBMISSION]',
        });
      } catch (error) {
        // Error is already logged in processApplicationSubmission
        // This catch prevents unhandled promise rejection
        console.error(`[SUBMISSION] Unhandled error in async processing for request ${requestId}:`, {
          error: error.message,
          stack: error.stack,
          applicationId,
        });
      }
    });

  } catch (error) {
    const responseTime = Date.now() - requestStartTime;
    console.error(`[SUBMISSION] Application submission error for request ${requestId}:`, {
      error: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

// Apply middleware in order: rate limiting -> multer upload -> error handling -> size validation -> handler
router.post('/', 
  // Rate limiting
  (req, res, next) => {
    const applicationSubmissionRateLimiter = req.app.get('applicationSubmissionRateLimiter');
    applicationSubmissionRateLimiter(req, res, next);
  },
  // File upload (multer)
  uploadFields,
  // Multer error handling
  handleMulterError,
  // Total request size validation
  validateTotalRequestSize,
  // Application submission handler
  applicationSubmissionHandler
);

/**
 * GET /api/private/applications
 * Get all applications for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const authUser = req.user;

    // Get user record
    const user = await getUser(supabase, authUser);

    const { data: applications, error } = await supabase
      .from('applications')
      .select('id, status, status_changed_at, submitted_at, created_at, updated_at, current_step')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch applications',
        message: error.message,
      });
    }

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/private/applications/:id
 * Get a specific application
 */
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const authUser = req.user;
    const applicationId = req.params.id;

    // Get user record
    const user = await getUser(supabase, authUser);

    const { data: application, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('applicant_id', user.id)
      .single();

    if (error || !application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found',
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Fetch application error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/private/applications/:id/cancel
 * Cancel an in-progress application (draft, submitted, or under_review)
 */
router.delete('/:id/cancel', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const authUser = req.user;
    const applicationId = req.params.id;

    // Get user record
    const user = await getUser(supabase, authUser);
    const userId = user.id;

    // First, verify the application exists and belongs to the user
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('id, status, applicant_id')
      .eq('id', applicationId)
      .eq('applicant_id', userId)
      .single();

    if (fetchError || !application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found or you do not have permission to cancel it',
      });
    }

    // Only allow cancellation of draft, submitted, or under_review applications
    if (!['draft', 'submitted', 'under_review'].includes(application.status)) {
      return res.status(400).json({
        error: 'Cannot Cancel',
        message: `Application in "${application.status}" status cannot be cancelled`,
      });
    }

    // Update application status to cancelled
    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'cancelled',
        status_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error cancelling application:', updateError);
      return res.status(500).json({
        error: 'Failed to cancel application',
        message: updateError.message,
      });
    }

    // Create history record for cancellation
    const { error: historyError } = await supabase
      .from('application_status_history')
      .insert({
        application_id: applicationId,
        previous_status: application.status,
        new_status: 'cancelled',
        changed_by: userId,
        notes: 'Application cancelled by user',
      });

    if (historyError) {
      console.error('History insert error:', historyError);
      // Non-fatal, continue
    }

    // Cancel any pending processing queue tasks
    const { error: queueError } = await supabase
      .from('processing_queue')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('application_id', applicationId)
      .in('status', ['pending', 'processing']);

    if (queueError) {
      console.error('Error cancelling queue tasks:', queueError);
      // Non-fatal, continue
    }

    res.json({
      success: true,
      data: {
        application_id: applicationId,
        status: 'cancelled',
        message: 'Application cancelled successfully',
      },
    });
  } catch (error) {
    console.error('Cancel application error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

module.exports = router;
