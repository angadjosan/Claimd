/**
 * Demo Application Routes
 * Handles application submission and management in demo mode
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
 * POST /api/demo/applications
 * Submit a new application in demo mode
 */
const applicationSubmissionHandler = async (req, res) => {
  const requestStartTime = Date.now();
  const requestId = uuidv4();
  
  try {
    const supabase = req.app.get('supabase');
    const userId = req.demoApplicantId; // From env var, not req.user
    const sessionId = req.demoSessionId; // Validated UUID v4

    console.log(`[DEMO] Received submission request ${requestId}`, {
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
    });

    // CRITICAL: Verify applicant_id matches demo user ID
    if (userId !== process.env.DEMO_APPLICANT_USER_ID) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid demo user ID'
      });
    }

    // Check existing applications for this session (not user, since all demos share same user)
    const { data: existingApplications, error: checkError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('applicant_id', userId)
      .eq('demo_session_id', sessionId) // Filter by session
      .in('status', ['draft', 'submitted', 'under_review'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkError) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check existing applications',
      });
    }

    if (existingApplications && existingApplications.length > 0) {
      const existingApp = existingApplications[0];
      return res.status(409).json({
        error: 'Application Already Exists',
        message: `You already have an application in "${existingApp.status}" status. Please complete or cancel it before submitting a new one.`,
        existing_application_id: existingApp.id,
        existing_status: existingApp.status,
      });
    }

    const applicationId = uuidv4();
    let formData;
    try {
      formData = JSON.parse(req.body.formData || '{}');
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid form data',
        message: 'Form data must be valid JSON',
      });
    }

    // Create application record with demo_session_id
    const { data: createdApplication, error: createError } = await supabase
      .from('applications')
      .insert({
        id: applicationId,
        applicant_id: userId,
        demo_session_id: sessionId, // CRITICAL: Store session ID for isolation
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      return res.status(500).json({
        error: 'Failed to create application',
        message: createError.message,
      });
    }

    const filesForProcessing = req.files;

    res.status(202).json({
      success: true,
      message: 'Application submission received and is being processed',
      data: {
        application_id: applicationId,
        status: 'processing',
        created_at: createdApplication.created_at,
      },
    });

    setImmediate(async () => {
      try {
        await processApplicationSubmission({
          supabase,
          applicationId,
          userId,
          formData,
          files: filesForProcessing,
          sessionId,
          logPrefix: '[DEMO]',
        });
      } catch (error) {
        console.error(`[DEMO] Unhandled error in async processing for request ${requestId}:`, {
          error: error.message,
          applicationId,
        });
      }
    });

  } catch (error) {
    console.error(`[DEMO] Application submission error for request ${requestId}:`, {
      error: error.message,
    });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /api/demo/applications
 * Get all applications for the current demo session
 */
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const userId = req.demoApplicantId;
    const sessionId = req.demoSessionId;

    // CRITICAL: Explicit filtering for session isolation
    const { data: applications, error } = await supabase
      .from('applications')
      .select('id, status, status_changed_at, submitted_at, created_at, updated_at, current_step')
      .eq('applicant_id', userId) // Demo user only
      .eq('demo_session_id', sessionId) // Current session only
      .not('demo_session_id', 'is', null) // Extra safety: only demo apps
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
    console.error('[DEMO] Fetch applications error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/demo/applications/:id
 * Get a specific application (must belong to current demo session)
 */
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const userId = req.demoApplicantId;
    const sessionId = req.demoSessionId;
    const applicationId = req.params.id;

    // CRITICAL: Verify application belongs to current demo session
    const { data: application, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('applicant_id', userId) // Demo user only
      .eq('demo_session_id', sessionId) // Current session only
      .not('demo_session_id', 'is', null)
      .single();

    if (error || !application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Demo application not found or access denied'
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('[DEMO] Fetch application error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

/**
 * GET /api/demo/applications/:id/status
 * Get application status and assignment info (for polling)
 */
router.get('/:id/status', async (req, res) => {
  try {
    const supabase = req.app.get('supabase');
    const userId = req.demoApplicantId;
    const sessionId = req.demoSessionId;
    const applicationId = req.params.id;

    const { data: application, error } = await supabase
      .from('applications')
      .select('id, status, demo_session_id')
      .eq('id', applicationId)
      .eq('applicant_id', userId)
      .eq('demo_session_id', sessionId)
      .single();

    if (error || !application) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Demo application not found'
      });
    }

    // Check if assigned to demo caseworker
    const { data: assignment } = await supabase
      .from('assigned_applications')
      .select('reviewer_id')
      .eq('application_id', applicationId)
      .single();

    res.json({
      success: true,
      data: {
        status: application.status,
        assignedTo: assignment?.reviewer_id || null,
        isAssigned: assignment?.reviewer_id === process.env.DEMO_CASEWORKER_USER_ID,
      },
    });
  } catch (error) {
    console.error('[DEMO] Fetch application status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// Apply middleware in order: multer upload -> error handling -> size validation -> handler
router.post('/', 
  uploadFields,
  handleMulterError,
  validateTotalRequestSize,
  applicationSubmissionHandler
);

module.exports = router;
